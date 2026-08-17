/**
 * BlisterCheck — Identificación de Medicamentos Fotosensibles
 *
 * Se ejecuta para analizar la Ficha Técnica (HTML) y detectar si el fármaco
 * es fotosensible ("proteger de la luz", "fotosensible").
 */

import { createClient } from '@supabase/supabase-js';

let SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
if (SUPABASE_URL) {
  SUPABASE_URL = SUPABASE_URL.trim().replace(/\/+$|\/rest\/v1\/?$/gi, '');
}
let SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
if (SUPABASE_SERVICE_KEY) {
  SUPABASE_SERVICE_KEY = SUPABASE_SERVICE_KEY.trim();
}

const CONCURRENCY_LIMIT = 5;
const BATCH_SIZE = 1000; // Procesaremos hasta 1000 por ejecución de GitHub Actions para evitar time-outs largos
const MAX_RETRIES = 3;

// Palabras clave
const KEYWORDS = [
  'fotosensible',
  'proteger de la luz',
  'sensible a la luz',
  'proteger de luz'
];

async function fetchWithRetry(url, maxRetries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return null; // No existe
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === maxRetries) return null;
      const waitMs = 1000 * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
}

function convertPdfUrlToHtmlUrl(pdfUrl) {
  if (!pdfUrl) return null;
  // Convertimos: https://cima.aemps.es/cima/pdfs/ft/80298/FT_80298.pdf
  // A: https://cima.aemps.es/cima/dochtml/ft/80298/FT_80298.html
  // Y si tuviese /es/ en medio: /pdfs/es/ft/ -> /dochtml/ft/
  return pdfUrl
    .replace(/\/pdfs\/(es\/)?ft\//i, '/dochtml/ft/')
    .replace(/\.pdf$/i, '.html');
}

function checkFotosensibilidad(htmlText) {
  if (!htmlText) return false;
  const lowerHtml = htmlText.toLowerCase();
  return KEYWORDS.some(kw => lowerHtml.includes(kw));
}

async function processBatch(supabase, items) {
  let processed = 0;
  let fotosensiblesCount = 0;

  for (let i = 0; i < items.length; i += CONCURRENCY_LIMIT) {
    const chunk = items.slice(i, i + CONCURRENCY_LIMIT);
    
    const updates = await Promise.all(chunk.map(async (item) => {
      const htmlUrl = convertPdfUrlToHtmlUrl(item.url_ficha_tecnica);
      if (!htmlUrl) {
        return { cn: item.cn, fotosensible: false }; // No tiene FT
      }
      
      const htmlText = await fetchWithRetry(htmlUrl);
      const isFotosensible = checkFotosensibilidad(htmlText);
      
      return {
        cn: item.cn,
        fotosensible: isFotosensible
      };
    }));

    // Actualizar en Supabase (de a uno o en mini batch)
    for (const update of updates) {
      const { error } = await supabase
        .from('blistercheck_catalogo')
        .update({ fotosensible: update.fotosensible })
        .eq('cn', update.cn);
      
      if (error) {
        console.error(`Error actualizando CN ${update.cn}:`, error.message);
      } else {
        processed++;
        if (update.fotosensible) fotosensiblesCount++;
      }
    }
    
    process.stdout.write(`\r   Procesados: ${processed}/${items.length} (Encontrados: ${fotosensiblesCount})`);
  }
  console.log('');
  return processed;
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  BlisterCheck — Identificación Fotosensibles');
  console.log(`  Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}`);
  console.log('═══════════════════════════════════════════════════');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Faltan credenciales de Supabase en las variables de entorno.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    let totalProcessed = 0;
    
    while (true) {
      console.log(`🔍 Buscando lote de medicamentos pendientes de analizar...`);
      
      const { data: pendientes, error } = await supabase
        .from('blistercheck_catalogo')
        .select('cn, url_ficha_tecnica')
        .is('fotosensible', null)
        .not('url_ficha_tecnica', 'is', null)
        .limit(1000);

      if (error) {
        throw new Error(`Error consultando base de datos: ${error.message}`);
      }

      if (!pendientes || pendientes.length === 0) {
        console.log('✅ No quedan más medicamentos pendientes de analizar.');
        break;
      }

      console.log(`📦 Analizando lote de ${pendientes.length} medicamentos...`);
      
      const count = await processBatch(supabase, pendientes);
      totalProcessed += count;
    }

    console.log(`🎉 Proceso completado. Total de medicamentos analizados en esta sesión: ${totalProcessed}`);
    console.log('═══════════════════════════════════════════════════');

  } catch (err) {
    console.error('');
    console.error('❌ ERROR DURANTE EL PROCESO:');
    console.error(`   ${err.message}`);
    console.log('═══════════════════════════════════════════════════');
    process.exit(1);
  }
}

main();
