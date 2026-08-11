/**
 * BlisterCheck — Daily Shortage Check (V2 - Supabase Persisted)
 * 
 * Runs via GitHub Actions cron at 8:00 AM daily.
 * 1. Fetches current shortages from CIMA API
 * 2. Saves/Updates them to `desabastecimientos_activos` in Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// --- Configuration from environment variables ---
let SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
if (SUPABASE_URL) {
    SUPABASE_URL = SUPABASE_URL.trim().replace(/\/+$|\/rest\/v1\/?$/gi, '');
}
let SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
if (SUPABASE_SERVICE_KEY) {
    SUPABASE_SERVICE_KEY = SUPABASE_SERVICE_KEY.trim();
}

const CIMA_API_URL = 'https://cima.aemps.es/cima/rest/psuministro';
const PAGE_SIZE = 200;
const CONCURRENCY_LIMIT = 5;

// --- Helper: Fetch with retry ---
async function fetchWithRetry(url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                if (attempt === retries) throw new Error(`HTTP error: ${res.status}`);
                console.warn(`Attempt ${attempt} failed with status ${res.status}. Retrying...`);
                await new Promise(r => setTimeout(r, 1000 * attempt));
                continue;
            }
            return await res.json();
        } catch (err) {
            if (attempt === retries) throw err;
            console.warn(`Attempt ${attempt} failed: ${err.message}. Retrying...`);
            await new Promise(r => setTimeout(r, 1000 * attempt));
        }
    }
}

// --- Helper: Fetch all shortages from CIMA API ---
async function fetchAllShortages() {
    console.log('Fetching shortages from CIMA API...');
    const cacheBuster = `&t=${Date.now()}`;
    let allResults = [];

    const firstData = await fetchWithRetry(`${CIMA_API_URL}?pagina=1&tamanioPagina=${PAGE_SIZE}${cacheBuster}`);

    const totalItems = firstData.totalFilas || 0;
    allResults = firstData.resultados || [];

    if (totalItems === 0) return [];

    const totalPages = Math.ceil(totalItems / PAGE_SIZE);
    console.log(`Total: ${totalItems} items across ${totalPages} pages`);

    if (totalPages > 1) {
        const remainingPages = [];
        for (let i = 2; i <= totalPages; i++) remainingPages.push(i);

        for (let i = 0; i < remainingPages.length; i += CONCURRENCY_LIMIT) {
            const chunk = remainingPages.slice(i, i + CONCURRENCY_LIMIT);
            const results = await Promise.all(
                chunk.map(async (pageNum) => {
                    try {
                        const data = await fetchWithRetry(`${CIMA_API_URL}?pagina=${pageNum}&tamanioPagina=${PAGE_SIZE}${cacheBuster}`);
                        return data.resultados || [];
                    } catch (err) {
                        console.error(`Fatal error fetching page ${pageNum} after retries:`, err.message);
                        throw err; // Abort the whole sync process to avoid data corruption
                    }
                })
            );
            results.forEach(r => { allResults = [...allResults, ...r]; });
        }
    }

    console.log(`Fetched ${allResults.length} total shortages from CIMA.`);
    return allResults;
}

// --- Helper: Normalize CN ---
function normalizeCN(rawCN) {
    if (!rawCN) return '';
    const numeric = String(rawCN).replace(/\D/g, '');
    return numeric.length >= 6 ? numeric.substring(0, 6) : numeric;
}

// --- Helper: Criticidad ---
function isCritical(item) {
    if (item.activo !== 1) return false;
    const obs = item.observ ? item.observ.toLowerCase().replace(/\s+/g, ' ') : '';
    const alleviationTriggers = [
        'existe/n otro/s', 'existen otros', 'existe otro', 'tratamientos alternativos',
        'el médico', 'tratamientos comercializados', 'principio activo', 'principios activos',
        'misma vía de administración', 'de administracion', 'de administración'
    ];
    if (alleviationTriggers.some(t => obs.includes(t))) return false;
    const criticalTriggers = ['medicamento extranjero', 'distribución controlada', 'suministro controlado', 'comercialización excepcional'];
    if (criticalTriggers.some(t => obs.includes(t))) return true;
    return true;
}

async function main() {
    console.log('=== BlisterCheck Shortage Check ===');
    console.log(`Date: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}`);

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error('❌ Missing Supabase credentials in environment:');
        if (!SUPABASE_URL) console.error('  - SUPABASE_URL (or VITE_SUPABASE_URL) is missing');
        if (!SUPABASE_SERVICE_KEY) console.error('  - SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) is missing');
        console.error('Please configure Repository Secrets in GitHub: Settings > Secrets and variables > Actions.');
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch Current Shortages from CIMA
    const allCimaRaw = await fetchAllShortages();
    const currentCimaMap = new Map();

    // Ignore shortages > 1 year old if they have no definite end date
    const nowMs = Date.now();
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;

    allCimaRaw.forEach(item => {
        const startMs = item.fini ? Number(item.fini) : null;
        let hasIndefiniteEnd = false;

        if (!item.ffin) {
            hasIndefiniteEnd = true;
        } else {
            const endYear = new Date(item.ffin).getFullYear();
            if (endYear > 2040) hasIndefiniteEnd = true;
        }

        if (startMs && (nowMs - startMs > oneYearMs) && hasIndefiniteEnd) {
            return; // Skip adding to current active map
        }

        const cn = normalizeCN(item.cn || item.nregistro);
        if (cn) currentCimaMap.set(cn, item);
    });

    const cnKeysToKeep = Array.from(currentCimaMap.keys());
    console.log(`Extracted ${cnKeysToKeep.length} valid shortages.`);

    // Refresh active shortages table - delete all existing and insert new
    console.log('Replacing desabastecimientos_activos table...');
    
    // We cannot truncate without RPC, so we do a blanket delete using a truthy condition
    // or we just delete in batches. It's safer to fetch existing CNs and delete them.
    let { data: existingData } = await supabase.from('desabastecimientos_activos').select('cn');
    if (existingData && existingData.length > 0) {
        const existingCns = existingData.map(r => r.cn);
        for (let i = 0; i < existingCns.length; i += 1000) {
            await supabase.from('desabastecimientos_activos').delete().in('cn', existingCns.slice(i, i + 1000));
        }
    }

    const upsertPayload = Array.from(currentCimaMap.values()).map(item => ({
        cn: normalizeCN(item.cn || item.nregistro),
        nombre: item.nombre || '',
        observaciones: item.observ || '',
        fecha_inicio: item.fini ? Number(item.fini) : null,
        fecha_fin: item.ffin ? Number(item.ffin) : null,
        criticidad: isCritical(item) ? 'critical' : 'normal',
        last_sync: new Date().toISOString()
    }));

    for (let i = 0; i < upsertPayload.length; i += 1000) {
        const chunk = upsertPayload.slice(i, i + 1000);
        let { error: upsertError } = await supabase
            .from('desabastecimientos_activos')
            .upsert(chunk);
        
        if (upsertError) {
            if (upsertError.code === 'PGRST125') {
                console.error("❌ Error PGRST125: La tabla 'desabastecimientos_activos' no existe en tu base de datos de Supabase o la ruta es inválida.");
                console.error("👉 Por favor, ejecuta el script de base de datos en Supabase SQL Editor: scripts/setup-all.sql");
            } else {
                console.warn(`Upsert warning (${upsertError.message}). Intentando insert...`);
                const { error: insertError } = await supabase
                    .from('desabastecimientos_activos')
                    .insert(chunk);
                if (insertError) console.error("Error inserting chunk:", insertError);
            }
        }
    }
    
    console.log("DB Sync complete.");
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
