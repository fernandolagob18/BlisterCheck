/**
 * BlisterCheck Service — Acceso a datos en Supabase
 * Todas las operaciones del módulo BlisterCheck se canalizan por aquí.
 */

import { supabase } from '../lib/supabase';

const CATALOG_TABLE = 'blistercheck_catalogo';
const GLOBAL_CLASIFICACION_TABLE = 'blistercheck_clasificacion_global';
const USER_FARMACIA_TABLE = 'blistercheck_user_farmacia';

// ─── BÚSQUEDA SIMPLE ──────────────────────────────────────────────────────────

/**
 * Detecta si el query es un código numérico (búsqueda por CN)
 */
function isNumericQuery(query) {
  return /^\d+$/.test(query.trim());
}

/**
 * Búsqueda simple: por nombre, principio activo o CN
 */
export async function searchSimple(query) {
  if (!query || query.trim().length < 2) return [];

  const q = query.trim();

  if (isNumericQuery(q)) {
    // Búsqueda por código nacional (numérico — sin tildes, ilike directo es suficiente)
    const { data, error } = await supabase
      .from(CATALOG_TABLE)
      .select('*')
      .ilike('cn', `${q}%`);
    if (error) throw error;
    return data || [];
  }

  // Búsqueda por nombre / principio activo usando RPC con unaccent (insensible a tildes)
  const { data, error } = await supabase.rpc('bc_search_simple', { q });
  if (!error) return data || [];

  // Fallback si la función RPC no está creada en Supabase
  const { data: fallbackData, error: fallbackError } = await supabase
    .from(CATALOG_TABLE)
    .select('*')
    .or(`nombre.ilike.%${q}%,principio_activo.ilike.%${q}%,laboratorio.ilike.%${q}%`)
    .limit(100);

  if (fallbackError) throw fallbackError;
  return fallbackData || [];
}

/**
 * Obtiene clasificaciones en batch para un array de CNs.
 * Devuelve un Map<cn, clasificacion> combinando la base global y los datos del hospital del usuario.
 */
export async function getClasificacionesByCNs(cns) {
  if (!cns || cns.length === 0) return new Map();
  const validCNs = [...new Set(cns.filter(Boolean).map(cn => String(cn)))];
  if (validCNs.length === 0) return new Map();

  const { data: { user } } = await supabase.auth.getUser();
  const CHUNK_SIZE = 900;

  let globalResults = [];
  let userResults = [];

  for (let i = 0; i < validCNs.length; i += CHUNK_SIZE) {
    const chunk = validCNs.slice(i, i + CHUNK_SIZE);
    
    const [globalRes, userRes] = await Promise.all([
      supabase.from(GLOBAL_CLASIFICACION_TABLE).select('*').in('cn', chunk),
      user ? supabase.from(USER_FARMACIA_TABLE).select('*').in('cn', chunk).eq('user_id', user.id) : { data: [] }
    ]);

    if (globalRes.data) globalResults = globalResults.concat(globalRes.data);
    if (userRes.data) userResults = userResults.concat(userRes.data);
  }

  const userMap = new Map();
  (userResults || []).forEach(u => userMap.set(String(u.cn), u));

  const map = new Map();
  (globalResults || []).forEach(g => {
    const u = userMap.get(String(g.cn));
    map.set(String(g.cn), {
      cn: String(g.cn),
      requiere_reenvasado:   g.requiere_reenvasado   ?? null,
      requiere_reetiquetado: g.requiere_reetiquetado ?? null,
      apto_sdmdu_blister:    g.apto_sdmdu_blister    ?? null,
      solo_envase_clinico:   g.solo_envase_clinico   ?? false,
      en_mi_farmacia:        u?.en_mi_farmacia       ?? false,
      notas:                 u?.notas                ?? '',
      updated_at:            g.updated_at || u?.updated_at || null,
    });
  });

  (userResults || []).forEach(u => {
    if (!map.has(String(u.cn))) {
      map.set(String(u.cn), {
        cn: String(u.cn),
        requiere_reenvasado: null,
        requiere_reetiquetado: null,
        apto_sdmdu_blister: null,
        solo_envase_clinico: false,
        en_mi_farmacia: u.en_mi_farmacia ?? false,
        notas: u.notas ?? '',
        updated_at: u.updated_at,
      });
    }
  });

  return map;
}

// ─── BÚSQUEDA AVANZADA ────────────────────────────────────────────────────────

/**
 * Búsqueda avanzada con múltiples filtros opcionales
 */
export async function searchAvanzado(filtros = {}) {
  const requiereEstarClasificado = filtros.soloClasificados || 
                                   filtros.soloEnMiFarmacia || 
                                   (filtros.estadoAcondicionamiento && filtros.estadoAcondicionamiento !== 'todos');

  let data, error;

  const { data: { user } } = await supabase.auth.getUser();

  if (filtros.soloEnMiFarmacia && user) {
    // 1. Obtener TODOS los CNs de la farmacia del usuario
    let cnsFarmacia = [];
    let page = 0;
    while(true) {
      const { data: uData } = await supabase.from(USER_FARMACIA_TABLE)
        .select('cn').eq('user_id', user.id).eq('en_mi_farmacia', true)
        .range(page*1000, (page+1)*1000-1);
      if(!uData || uData.length === 0) break;
      cnsFarmacia.push(...uData.map(d => d.cn));
      if(uData.length < 1000) break;
      page++;
    }
    
    if (cnsFarmacia.length === 0) return [];

    // 2. Obtener el catalogo para esos CNs en chunks de 900
    let results = [];
    for(let i=0; i<cnsFarmacia.length; i+=900) {
      const chunk = cnsFarmacia.slice(i, i+900);
      let query = supabase.from(CATALOG_TABLE).select('*').in('cn', chunk);
      // Aplicar filtros de busqueda al query (nombre, principio_activo, etc)
      if (filtros.cn?.trim()) query = query.ilike('cn', `${filtros.cn.trim()}%`);
      if (filtros.nombre?.trim()) query = query.ilike('nombre', `%${filtros.nombre.trim()}%`);
      if (filtros.principioActivo?.trim()) query = query.ilike('principio_activo', `%${filtros.principioActivo.trim()}%`);
      if (filtros.laboratorio?.trim()) query = query.ilike('laboratorio', `%${filtros.laboratorio.trim()}%`);
      if (filtros.formaFarmaceutica?.trim()) query = query.eq('forma_farmaceutica', filtros.formaFarmaceutica.trim());
      if (filtros.viaAdministracion?.trim()) query = query.eq('via_administracion', filtros.viaAdministracion.trim());
      
      const { data: cData } = await query;
      if (cData) results.push(...cData);
    }
    
    // 3. Filtrar por estadoAcondicionamiento si aplica
    if (filtros.estadoAcondicionamiento && filtros.estadoAcondicionamiento !== 'todos') {
       const clasifMap = await getClasificacionesByCNs(results.map(r => r.cn));
       results = results.filter(med => {
          const clasif = clasifMap.get(med.cn);
          if (!clasif) return false;
          if (filtros.estadoAcondicionamiento === 'reenvasado'   && clasif.requiere_reenvasado  !== true) return false;
          if (filtros.estadoAcondicionamiento === 'reetiquetado' && clasif.requiere_reetiquetado !== true) return false;
          if (filtros.estadoAcondicionamiento === 'apto_sdmdu'   && clasif.apto_sdmdu_blister   !== true) return false;
          return true;
       });
    }

    // 4. Ordenar alfabéticamente
    results.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    return results;
  }

  try {
    const res = await supabase.rpc('bc_search_avanzado', {
      p_cn:                 filtros.cn?.trim()                || null,
      p_nombre:             filtros.nombre?.trim()            || null,
      p_principio_activo:   filtros.principioActivo?.trim()   || null,
      p_laboratorio:        filtros.laboratorio?.trim()       || null,
      p_forma_farmaceutica: filtros.formaFarmaceutica?.trim() || null,
      p_via_administracion: filtros.viaAdministracion?.trim() || null,
      p_solo_clasificados:  requiereEstarClasificado          ?? false,
    });
    data = res.data;
    error = res.error;
  } catch (err) {
    error = err;
  }

  if (error) {
    let query = supabase.from(CATALOG_TABLE).select('*');
    if (filtros.cn?.trim()) query = query.ilike('cn', `${filtros.cn.trim()}%`);
    if (filtros.nombre?.trim()) query = query.ilike('nombre', `%${filtros.nombre.trim()}%`);
    if (filtros.principioActivo?.trim()) query = query.ilike('principio_activo', `%${filtros.principioActivo.trim()}%`);
    if (filtros.laboratorio?.trim()) query = query.ilike('laboratorio', `%${filtros.laboratorio.trim()}%`);
    if (filtros.formaFarmaceutica?.trim()) query = query.eq('forma_farmaceutica', filtros.formaFarmaceutica.trim());
    if (filtros.viaAdministracion?.trim()) query = query.eq('via_administracion', filtros.viaAdministracion.trim());
    const { data: fbData, error: fbErr } = await query.limit(200);
    if (fbErr) throw fbErr;
    data = fbData;
  }

  let results = data || [];

  if (filtros.soloFotosensibles) {
    results = results.filter(med => med.fotosensible === true);
  }

  if (filtros.soloEnMiFarmacia || (filtros.estadoAcondicionamiento && filtros.estadoAcondicionamiento !== 'todos')) {
    if (results.length === 0) return [];

    const cns = results.map(r => r.cn);
    const clasifMap = await getClasificacionesByCNs(cns);

    results = results.filter(med => {
      const clasif = clasifMap.get(med.cn);
      if (!clasif) return false;

      if (filtros.soloEnMiFarmacia && !clasif.en_mi_farmacia) return false;

      if (filtros.estadoAcondicionamiento) {
        if (filtros.estadoAcondicionamiento === 'reenvasado'   && clasif.requiere_reenvasado  !== true) return false;
        if (filtros.estadoAcondicionamiento === 'reetiquetado' && clasif.requiere_reetiquetado !== true) return false;
        if (filtros.estadoAcondicionamiento === 'apto_sdmdu'   && clasif.apto_sdmdu_blister   !== true) return false;
      }

      return true;
    });
  }

  return results;
}

// ─── VALORES ÚNICOS PARA FILTROS ──────────────────────────────────────────────

async function fetchAllDistinct(column) {
  const uniqueVals = new Set();
  let page = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(CATALOG_TABLE)
      .select(column)
      .not(column, 'is', null)
      .order(column)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) throw error;
    (data || []).forEach(row => uniqueVals.add(row[column]));
    if ((data || []).length < PAGE_SIZE) break;
    page++;
  }

  return Array.from(uniqueVals).filter(Boolean).sort((a, b) => a.localeCompare(b));
}

export async function getFormasFarmaceuticas() {
  return await fetchAllDistinct('forma_farmaceutica');
}

export async function getViasAdministracion() {
  return await fetchAllDistinct('via_administracion');
}

// ─── CLASIFICACIÓN ────────────────────────────────────────────────────────────

/**
 * Obtiene la clasificación combinada de una presentación.
 * Combina la base global SDMDU con los datos privados del hospital del usuario.
 */
export async function getClasificacion(cn) {
  if (!cn) return null;
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: globalData }, { data: userData }] = await Promise.all([
    supabase.from(GLOBAL_CLASIFICACION_TABLE).select('*').eq('cn', String(cn)).maybeSingle(),
    user ? supabase.from(USER_FARMACIA_TABLE).select('*').eq('cn', String(cn)).eq('user_id', user.id).maybeSingle() : { data: null }
  ]);

  if (!globalData && !userData) return null;

  return {
    cn: String(cn),
    requiere_reenvasado:   globalData?.requiere_reenvasado   ?? null,
    requiere_reetiquetado: globalData?.requiere_reetiquetado ?? null,
    apto_sdmdu_blister:    globalData?.apto_sdmdu_blister    ?? null,
    solo_envase_clinico:   globalData?.solo_envase_clinico   ?? false,
    en_mi_farmacia:        userData?.en_mi_farmacia          ?? false,
    notas:                 userData?.notas                   ?? '',
    updated_at:            globalData?.updated_at || userData?.updated_at || null,
    fecha_clasificacion:   userData?.fecha_clasificacion || globalData?.updated_at || null,
  };
}

/**
 * Guarda o actualiza la clasificación.
 * Actualiza la BD Global para criterios SDMDU (Apto, Reenvasado, Reetiquetado, EC)
 * y la BD Privada para stock del hospital (en_mi_farmacia) y notas.
 *
 * @param {string} cn - Código nacional del medicamento.
 * @param {object} clasificacion - Nuevos valores a guardar.
 * @param {object|null} clasificacionAnterior - Valores previos (opcional).
 *   Si se proporciona, `updated_at` de la BD Global sólo se actualiza cuando
 *   alguno de los campos SDMDU (reenvasado, reetiquetado, sdmdu, EC) ha cambiado.
 *   Cambios en `en_mi_farmacia` o `notas` NO afectan la fecha de actualización global.
 */
export async function saveClasificacion(cn, clasificacion, clasificacionAnterior = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debe iniciar sesión para guardar clasificaciones.");

  const cnStr = String(cn);

  // Determinar si algún campo SDMDU (global) ha cambiado respecto al valor anterior
  const sdmduCambiado = clasificacionAnterior === null || (
    clasificacion.requiere_reenvasado   !== (clasificacionAnterior.requiere_reenvasado   ?? null) ||
    clasificacion.requiere_reetiquetado !== (clasificacionAnterior.requiere_reetiquetado ?? null) ||
    clasificacion.apto_sdmdu_blister    !== (clasificacionAnterior.apto_sdmdu_blister    ?? null) ||
    clasificacion.solo_envase_clinico   !== (clasificacionAnterior.solo_envase_clinico   ?? false)
  );

  // 1. Guardar en la base de datos GLOBAL COMPARTIDA (SDMDU)
  //    Sólo se actualiza `updated_at` si realmente han cambiado los campos clínicos.
  const globalPayload = {
    cn:                     cnStr,
    requiere_reenvasado:   clasificacion.requiere_reenvasado   ?? null,
    requiere_reetiquetado: clasificacion.requiere_reetiquetado ?? null,
    apto_sdmdu_blister:    clasificacion.apto_sdmdu_blister    ?? null,
    solo_envase_clinico:   clasificacion.solo_envase_clinico   ?? false,
    updated_by:            user.id,
    ...(sdmduCambiado && { updated_at: new Date().toISOString() }),
  };

  // 2. Guardar en los datos PRIVADOS DEL HOSPITAL
  const userPayload = {
    cn:                    cnStr,
    user_id:               user.id,
    en_mi_farmacia:        clasificacion.en_mi_farmacia        ?? false,
    notas:                 clasificacion.notas                 ?? null,
    updated_at:            new Date().toISOString(),
  };

  const [globalRes, userRes] = await Promise.all([
    supabase.from(GLOBAL_CLASIFICACION_TABLE).upsert(globalPayload, { onConflict: 'cn' }).select('*').single(),
    supabase.from(USER_FARMACIA_TABLE).upsert(userPayload, { onConflict: 'cn,user_id' }).select('*').single()
  ]);

  if (globalRes.error) throw globalRes.error;
  if (userRes.error) throw userRes.error;

  return {
    cn: cnStr,
    requiere_reenvasado:   globalRes.data.requiere_reenvasado,
    requiere_reetiquetado: globalRes.data.requiere_reetiquetado,
    apto_sdmdu_blister:    globalRes.data.apto_sdmdu_blister,
    solo_envase_clinico:   globalRes.data.solo_envase_clinico,
    en_mi_farmacia:        userRes.data.en_mi_farmacia,
    notas:                 userRes.data.notas,
    updated_at:            globalRes.data.updated_at,
  };
}

/**
 * Obtiene todas las clasificaciones (para stats y export)
 */
export async function getAllClasificaciones() {
  const { data: { user } } = await supabase.auth.getUser();

  let globalData = [];
  let page = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(GLOBAL_CLASIFICACION_TABLE)
      .select(`
        *,
        blistercheck_catalogo (
          nombre, laboratorio, dosis, principio_activo,
          forma_farmaceutica, forma_simplificada, via_administracion,
          tipo_prescripcion, cn
        )
      `)
      .order('updated_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) throw error;
    globalData = globalData.concat(data || []);
    if ((data || []).length < PAGE_SIZE) break;
    page++;
  }

  if (!user) return globalData;

  const cns = globalData.map(g => String(g.cn));
  const userMap = new Map();
  for (let i = 0; i < cns.length; i += 900) {
    const chunk = cns.slice(i, i + 900);
    const { data: uData } = await supabase
      .from(USER_FARMACIA_TABLE)
      .select('*')
      .in('cn', chunk)
      .eq('user_id', user.id);
    (uData || []).forEach(u => userMap.set(String(u.cn), u));
  }

  return globalData.map(g => {
    const u = userMap.get(String(g.cn));
    return {
      ...g,
      en_mi_farmacia: u?.en_mi_farmacia ?? false,
      notas: u?.notas ?? '',
    };
  });
}

// ─── ESTADÍSTICAS POR LABORATORIO ─────────────────────────────────────────────

export async function getEstadisticasPorLaboratorio(soloMiFarmacia = false) {
  const { data: { user } } = await supabase.auth.getUser();

  let allData = [];
  let page = 0;
  const PAGE_SIZE = 1000;

  if (soloMiFarmacia && user) {
    let userFarmiaCNs = [];
    let uPage = 0;
    while (true) {
      const { data: uData } = await supabase
        .from(USER_FARMACIA_TABLE)
        .select('cn')
        .eq('user_id', user.id)
        .eq('en_mi_farmacia', true)
        .range(uPage * PAGE_SIZE, (uPage + 1) * PAGE_SIZE - 1);
      
      const chunkCNs = (uData || []).map(r => String(r.cn));
      userFarmiaCNs = userFarmiaCNs.concat(chunkCNs);
      if ((uData || []).length < PAGE_SIZE) break;
      uPage++;
    }

    if (userFarmiaCNs.length === 0) return [];

    for (let i = 0; i < userFarmiaCNs.length; i += 900) {
      const chunk = userFarmiaCNs.slice(i, i + 900);
      const { data, error } = await supabase
        .from(GLOBAL_CLASIFICACION_TABLE)
        .select(`
          cn,
          requiere_reenvasado,
          requiere_reetiquetado,
          apto_sdmdu_blister,
          solo_envase_clinico,
          blistercheck_catalogo ( laboratorio )
        `)
        .in('cn', chunk);
      if (error) throw error;
      allData = allData.concat(data || []);
    }
  } else {
    while (true) {
      const { data, error } = await supabase
        .from(GLOBAL_CLASIFICACION_TABLE)
        .select(`
          cn,
          requiere_reenvasado,
          requiere_reetiquetado,
          apto_sdmdu_blister,
          solo_envase_clinico,
          blistercheck_catalogo ( laboratorio )
        `)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      allData = allData.concat(data || []);
      if ((data || []).length < PAGE_SIZE) break;
      page++;
    }
  }

  const labMap = new Map();

  allData.forEach(row => {
    const lab = row.blistercheck_catalogo?.laboratorio || 'Sin laboratorio';
    if (!labMap.has(lab)) {
      labMap.set(lab, {
        laboratorio: lab,
        total_clasificados: 0,
        aptos_directos: 0,
        requieren_intervencion: 0,
        pendientes: 0,
      });
    }

    const entry = labMap.get(lab);
    const sinClasificar = row.apto_sdmdu_blister === null
      && row.requiere_reenvasado === null
      && row.requiere_reetiquetado === null;

    if (!sinClasificar) entry.total_clasificados++;

    if (row.apto_sdmdu_blister === true) entry.aptos_directos++;
    else if (row.requiere_reenvasado === true || row.requiere_reetiquetado === true) entry.requieren_intervencion++;
    else if (sinClasificar) entry.pendientes++;
  });

  const result = Array.from(labMap.values()).map(lab => ({
    ...lab,
    score_sdmdu: lab.total_clasificados > 0
      ? Math.round((lab.aptos_directos / lab.total_clasificados) * 100)
      : 0,
  }));

  result.sort((a, b) => b.score_sdmdu - a.score_sdmdu || b.total_clasificados - a.total_clasificados);
  return result;
}

// ─── INFO GENERAL DEL CATÁLOGO ────────────────────────────────────────────────

export async function getCatalogInfo() {
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { count: totalCatalogo },
    { count: totalClasificados },
    { count: enMiFarmacia },
    { data: syncData },
  ] = await Promise.all([
    supabase.from(CATALOG_TABLE).select('*', { count: 'exact', head: true }),
    supabase.from(GLOBAL_CLASIFICACION_TABLE).select('*', { count: 'exact', head: true })
      .or('requiere_reenvasado.not.is.null,requiere_reetiquetado.not.is.null,apto_sdmdu_blister.not.is.null,solo_envase_clinico.not.is.null'),
    user
      ? supabase.from(USER_FARMACIA_TABLE).select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('en_mi_farmacia', true)
      : Promise.resolve({ count: 0 }),
    supabase.from(CATALOG_TABLE).select('last_sync').order('last_sync', { ascending: false }).limit(1).maybeSingle(),
  ]);

  return {
    totalCatalogo:     totalCatalogo     || 0,
    totalClasificados: totalClasificados || 0,
    enMiFarmacia:      enMiFarmacia      || 0,
    ultimaSync:        syncData?.last_sync || null,
  };
}

// ─── EXPORTACIÓN CSV ─────────────────────────────────────────────────────────

/**
 * Obtiene datos para exportar (JOIN entre clasificación global, datos del hospital y catálogo)
 * @param {string} modo 'todos' | 'clasificados' | 'mi_farmacia'
 */
export async function getExportData(modo = 'clasificados') {
  const { data: { user } } = await supabase.auth.getUser();

  let globalData = [];
  let page = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    let query = supabase
      .from(GLOBAL_CLASIFICACION_TABLE)
      .select(`
        cn,
        requiere_reenvasado,
        requiere_reetiquetado,
        apto_sdmdu_blister,
        solo_envase_clinico,
        updated_at,
        blistercheck_catalogo (
          cn, nregistro, nombre, laboratorio, dosis, principio_activo,
          forma_farmaceutica, forma_simplificada, via_administracion, tipo_prescripcion
        )
      `)
      .order('updated_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (modo === 'clasificados') {
      query = query.or('requiere_reenvasado.not.is.null,requiere_reetiquetado.not.is.null,apto_sdmdu_blister.not.is.null,solo_envase_clinico.not.is.null');
    }

    const { data, error } = await query;
    if (error) throw error;
    globalData = globalData.concat(data || []);
    if ((data || []).length < PAGE_SIZE) break;
    page++;
  }

  if (!user) return globalData;

  const cns = globalData.map(g => String(g.cn));
  const userMap = new Map();
  for (let i = 0; i < cns.length; i += 900) {
    const chunk = cns.slice(i, i + 900);
    let uQuery = supabase.from(USER_FARMACIA_TABLE).select('*').in('cn', chunk).eq('user_id', user.id);
    if (modo === 'mi_farmacia') uQuery = uQuery.eq('en_mi_farmacia', true);
    const { data: uData } = await uQuery;
    (uData || []).forEach(u => userMap.set(String(u.cn), u));
  }

  let finalResults = globalData.map(g => {
    const u = userMap.get(String(g.cn));
    return {
      ...g,
      en_mi_farmacia: u?.en_mi_farmacia ?? false,
      notas: u?.notas ?? '',
      fecha_clasificacion: u?.fecha_clasificacion || g.updated_at,
    };
  });

  if (modo === 'mi_farmacia') {
    finalResults = finalResults.filter(r => r.en_mi_farmacia === true);
  }

  return finalResults;
}

// ─── ALTERNATIVAS SDMDU ────────────────────────────────────────────────────────

/**
 * Busca alternativas de un medicamento con el mismo principio activo, dosis, forma y vía,
 * y las clasifica en compatibles (apto SDMDU) y pendientes de evaluar.
 */
export async function getAlternativasSDMDU(medicamento) {
  const { cn, principio_activo, dosis, forma_farmaceutica, via_administracion } = medicamento;
  
  if (!principio_activo || !dosis || !forma_farmaceutica || !via_administracion) {
    return { compatibles: [], pendientes: [] };
  }

  const { data, error } = await supabase
    .from(CATALOG_TABLE)
    .select(`
      *,
      blistercheck_clasificacion_global (
        apto_sdmdu_blister,
        requiere_reenvasado,
        requiere_reetiquetado,
        solo_envase_clinico
      )
    `)
    .eq('principio_activo', principio_activo)
    .eq('dosis', dosis)
    .eq('forma_farmaceutica', forma_farmaceutica)
    .eq('via_administracion', via_administracion)
    .neq('cn', cn);

  if (error) throw error;

  const compatibles = [];
  const pendientes = [];
  
  (data || []).forEach(med => {
    const clas = Array.isArray(med.blistercheck_clasificacion_global) ? med.blistercheck_clasificacion_global[0] : med.blistercheck_clasificacion_global;
    
    if (clas && clas.apto_sdmdu_blister === true) {
      compatibles.push(med);
    } else if (!clas || (clas.apto_sdmdu_blister === null && clas.requiere_reenvasado === null && clas.requiere_reetiquetado === null)) {
      pendientes.push(med);
    }
  });

  return { compatibles, pendientes };
}

// ─── DESABASTECIMIENTOS ────────────────────────────────────────────────────────

/**
 * Busca si una presentación (por CN) tiene un desabastecimiento activo.
 */
export async function getDesabastecimientoByCN(cn) {
  if (!cn) return null;

  const { data, error } = await supabase
    .from('desabastecimientos_activos')
    .select('*')
    .eq('cn', String(cn))
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Dado un array de CNs, devuelve un Map<cn, shortage> con todos los que tienen
 * desabastecimiento activo.
 */
export async function getDesabastecimientosByCNs(cns) {
  if (!cns || cns.length === 0) return new Map();
  const validCNs = [...new Set(cns.filter(Boolean).map(cn => String(cn)))];
  if (validCNs.length === 0) return new Map();

  const CHUNK_SIZE = 900;
  const map = new Map();
  for (let i = 0; i < validCNs.length; i += CHUNK_SIZE) {
    const chunk = validCNs.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase
      .from('desabastecimientos_activos')
      .select('*')
      .in('cn', chunk);
    if (error) throw error;
    (data || []).forEach(row => {
      const rawCN = String(row.cn);
      map.set(rawCN, row);
      
      const cleanDigits = rawCN.replace(/\D/g, '');
      if (cleanDigits) {
        map.set(cleanDigits, row);
        map.set(cleanDigits.substring(0, 6), row);
        map.set(cleanDigits.padStart(6, '0'), row);
      }
    });
  }
  return map;
}

// --- OPTIMIZADOR DE GUÍA (EXCEL) ----------------------------------------------

/**
 * Obtiene medicamentos y sus clasificaciones por lista de CNs
 */
export async function getMedicationStatusByCNs(cnList) {
  if (!cnList || cnList.length === 0) return [];
  const clasifMap = await getClasificacionesByCNs(cnList);
  
  let allData = [];
  const chunkSize = 100;
  
  for (let i = 0; i < cnList.length; i += chunkSize) {
    const chunk = cnList.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from(CATALOG_TABLE)
      .select('*')
      .in('cn', chunk);
      
    if (error) throw error;
    (data || []).forEach(med => {
      allData.push({
        ...med,
        blistercheck_clasificacion: clasifMap.get(String(med.cn)) || null,
      });
    });
  }
  
  return allData;
}

/**
 * Busca alternativas viables que no requieran reenvasado/reetiquetado
 */
export async function findAlternatives(principioActivo, dosis, formaSimplificada) {
  if (!principioActivo) return [];
  
  let query = supabase
    .from(CATALOG_TABLE)
    .select('*, blistercheck_clasificacion_global!inner (*)')
    .eq('principio_activo', principioActivo);
    
  if (dosis) {
    query = query.eq('dosis', dosis);
  }
  if (formaSimplificada) {
    query = query.eq('forma_simplificada', formaSimplificada);
  }
  
  query = query.eq('blistercheck_clasificacion_global.requiere_reenvasado', false)
               .eq('blistercheck_clasificacion_global.requiere_reetiquetado', false);
               
  const { data, error } = await query;
  if (error) {
    console.error('Error finding alternatives:', error);
    return [];
  }
  
  return data || [];
}

/**
 * ─── IMPORTACIÓN MASIVA ───────────────────────────────────────────────────
 */

/**
 * Obtiene un array de CNs que existen en el catálogo a partir de una lista dada.
 */
export async function getExistingCatalogCNs(cns) {
  if (!cns || cns.length === 0) return [];
  const validCNs = [...new Set(cns.filter(Boolean).map(cn => String(cn)))];
  if (validCNs.length === 0) return [];

  const CHUNK_SIZE = 900;
  let existingCNs = [];

  for (let i = 0; i < validCNs.length; i += CHUNK_SIZE) {
    const chunk = validCNs.slice(i, i + CHUNK_SIZE);
    
    const { data, error } = await supabase
      .from(CATALOG_TABLE)
      .select('cn')
      .in('cn', chunk);

    if (error) {
      console.error('Error fetching catalog CNs:', error);
      throw error;
    }
    
    if (data) {
      existingCNs = existingCNs.concat(data.map(d => d.cn));
    }
  }

  return existingCNs;
}

/**
 * Marca masivamente como "En mi farmacia" un listado de CNs.
 */
export async function bulkMarkEnMiFarmacia(cns) {
  if (!cns || cns.length === 0) return 0;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debe iniciar sesión para realizar esta acción.");

  const validCNs = [...new Set(cns.filter(Boolean).map(cn => String(cn)))];
  if (validCNs.length === 0) return 0;

  const CHUNK_SIZE = 900;
  let totalUpserted = 0;

  for (let i = 0; i < validCNs.length; i += CHUNK_SIZE) {
    const chunk = validCNs.slice(i, i + CHUNK_SIZE);
    const payload = chunk.map(cn => ({
      cn: cn,
      user_id: user.id,
      en_mi_farmacia: true,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from(USER_FARMACIA_TABLE)
      .upsert(payload, { onConflict: 'cn,user_id' })
      .select();

    if (error) {
      console.error('Error in bulk upsert:', error);
      throw error;
    }
    
    if (data) {
      totalUpserted += data.length;
    }
  }

  return totalUpserted;
}
