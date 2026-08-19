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
  const { data, error } = await supabase.rpc('bc_search_simple', { q }).limit(3000);
  if (!error) return data || [];

  // Fallback si la función RPC no está creada en Supabase
  const { data: fallbackData, error: fallbackError } = await supabase
    .from(CATALOG_TABLE)
    .select('*')
    .or(`nombre.ilike.%${q}%,principio_activo.ilike.%${q}%,laboratorio.ilike.%${q}%`)
    .limit(3000);

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
  const CHUNK_SIZE = 200;

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

  const { data: { user } } = await supabase.auth.getUser();

  try {
    const res = await supabase.rpc('bc_search_avanzado', {
      p_cn:                       filtros.cn?.trim()                || null,
      p_nombre:                   filtros.nombre?.trim()            || null,
      p_principio_activo:         filtros.principioActivo?.trim()   || null,
      p_laboratorio:              filtros.laboratorio?.trim()       || null,
      p_forma_farmaceutica:       filtros.formaFarmaceutica?.trim() || null,
      p_via_administracion:       filtros.viaAdministracion?.trim() || null,
      p_solo_clasificados:        requiereEstarClasificado          || false,
      p_user_id:                  user?.id                          || null,
      p_solo_en_mi_farmacia:      Boolean(filtros.soloEnMiFarmacia && user),
      p_solo_fotosensibles:       Boolean(filtros.soloFotosensibles),
      p_solo_higroscopicos:       Boolean(filtros.soloHigroscopicos),
      p_estado_acondicionamiento: filtros.estadoAcondicionamiento   || 'todos'
    }).limit(3000);
    
    if (res.error) {
      console.error('Error en RPC bc_search_avanzado:', res.error);
      throw res.error;
    }
    
    return res.data || [];
  } catch (err) {
    console.error('Fallo en searchAvanzado:', err);
    throw err;
  }
}


// ─── VALORES ÚNICOS PARA FILTROS ──────────────────────────────────────────────

async function fetchAllDistinct(column) {
  try {
    const { data, error } = await supabase.rpc('bc_get_distinct_values', { p_column: column });
    if (error) throw error;
    
    // Mapear la respuesta de la base de datos (array de objetos { valor: 'xyz' }) a un array de strings
    return (data || []).map(row => row.valor);
  } catch (err) {
    console.error(`Error obteniendo valores únicos para ${column}:`, err);
    return [];
  }
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
  for (let i = 0; i < cns.length; i += 200) {
    const chunk = cns.slice(i, i + 200);
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

  try {
    const res = await supabase.rpc('bc_get_estadisticas_laboratorios', {
      p_user_id: user?.id || null,
      p_solo_mi_farmacia: Boolean(soloMiFarmacia && user)
    });

    if (res.error) throw res.error;

    // Convertir BigInts devueltos por Postgres (a menudo strings) en números de JS
    return (res.data || []).map(row => ({
      ...row,
      total_clasificados: Number(row.total_clasificados),
      aptos_directos: Number(row.aptos_directos),
      requieren_intervencion: Number(row.requieren_intervencion),
      pendientes: Number(row.pendientes),
      score_sdmdu: Number(row.score_sdmdu)
    }));
  } catch (err) {
    console.error('Error calculando estadísticas:', err);
    throw err;
  }
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
    supabase.from(CATALOG_TABLE).select('*', { count: 'estimated', head: true }),
    supabase.from(GLOBAL_CLASIFICACION_TABLE).select('*', { count: 'estimated', head: true })
      .or('requiere_reenvasado.not.is.null,requiere_reetiquetado.not.is.null,apto_sdmdu_blister.not.is.null,solo_envase_clinico.not.is.null'),
    user
      ? supabase.from(USER_FARMACIA_TABLE).select('*', { count: 'estimated', head: true }).eq('user_id', user.id).eq('en_mi_farmacia', true)
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

  try {
    const { data, error } = await supabase.rpc('bc_get_export_data', {
      p_modo: modo,
      p_user_id: user?.id || null
    });

    if (error) throw error;
    
    return data || [];
  } catch (err) {
    console.error('Error exportando datos:', err);
    throw err;
  }
}

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

  const CHUNK_SIZE = 200;
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

  const CHUNK_SIZE = 200;
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

  // 1. Limpiar el inventario actual (establecer todo a false)
  // Esto asegura que reemplazamos el inventario en lugar de acumularlo.
  // Como solo tocamos 'en_mi_farmacia', las 'notas' introducidas previamente SE CONSERVAN intactas.
  const { error: resetError } = await supabase
    .from(USER_FARMACIA_TABLE)
    .update({ en_mi_farmacia: false, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('en_mi_farmacia', true);

  if (resetError) {
    console.error('Error limpiando el inventario previo:', resetError);
    throw resetError;
  }

  // 2. Insertar o actualizar los nuevos medicamentos a true
  const CHUNK_SIZE = 200;
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

// ─── MIS LABORATORIOS ────────────────────────────────────────────────────────

const USER_LABORATORIOS_TABLE = 'blistercheck_user_laboratorios';

export async function getMisLaboratoriosData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. Obtener configuraciones de laboratorios/plataformas del usuario
  const { data: userLabs, error: labsError } = await supabase
    .from(USER_LABORATORIOS_TABLE)
    .select('laboratorio, pedido_minimo, is_plataforma')
    .eq('user_id', user.id);
  
  if (labsError) throw labsError;

  const userLabsMap = new Map();
  (userLabs || []).forEach(l => userLabsMap.set(l.laboratorio, {
    pedido_minimo: l.pedido_minimo || 0,
    is_plataforma: l.is_plataforma || false
  }));

  // 2. Obtener medicamentos vinculados manualmente a plataformas
  const { data: platMedsData, error: platMedsError } = await supabase
    .from('blistercheck_user_plataforma_medicamentos')
    .select('laboratorio_nombre, cn')
    .eq('user_id', user.id);
  if (platMedsError) throw platMedsError;

  const platformMedsMap = new Map();
  (platMedsData || []).forEach(pm => {
    if (!platformMedsMap.has(pm.cn)) platformMedsMap.set(pm.cn, []);
    platformMedsMap.get(pm.cn).push(pm.laboratorio_nombre);
  });

  const customCNs = Array.from(platformMedsMap.keys());

  // 3. Obtener todo el catálogo cruzado en una sola petición RPC
  const { data: allMeds, error: medsError } = await supabase.rpc('bc_get_user_catalog_with_custom', {
    p_user_id: user.id,
    p_custom_cns: customCNs
  });
  if (medsError) throw medsError;

  // 4. Agrupar por laboratorio / plataforma
  const labMap = new Map();
  
  for (const [labName, config] of userLabsMap.entries()) {
    labMap.set(labName, {
      laboratorio: labName,
      medicamentos: [],
      total: 0,
      aptos_sdmdu: 0,
      pedido_minimo: config.pedido_minimo,
      is_plataforma: config.is_plataforma
    });
  }

  (allMeds || []).forEach(med => {
    const isPlatformMed = platformMedsMap.has(med.cn);
    const targetLabs = [];
    
    targetLabs.push(med.laboratorio || 'Sin laboratorio');
    
    if (isPlatformMed) {
        targetLabs.push(...platformMedsMap.get(med.cn));
    }

    const uniqueLabs = [...new Set(targetLabs)];

    uniqueLabs.forEach(labName => {
      if (!labMap.has(labName)) {
        labMap.set(labName, {
          laboratorio: labName,
          medicamentos: [],
          total: 0,
          aptos_sdmdu: 0,
          pedido_minimo: 0,
          is_plataforma: false
        });
      }

      const lab = labMap.get(labName);
      const medCopy = { ...med, is_manual_link: isPlatformMed && platformMedsMap.get(med.cn).includes(labName) };
      
      lab.medicamentos.push(medCopy);
      lab.total++;
      
      const clas = med.blistercheck_clasificacion_global;
      if (clas && clas.apto_sdmdu_blister === true) {
        lab.aptos_sdmdu++;
      }
    });
  });

  // 5. Convertir a array y calcular porcentajes
  const result = Array.from(labMap.values()).map(lab => {
    const p = lab.total > 0 ? Math.round((lab.aptos_sdmdu / lab.total) * 100) : 0;
    return { ...lab, porcentaje: p };
  });

  result.sort((a, b) => a.laboratorio.localeCompare(b.laboratorio));

  return result;
}


export async function savePedidoMinimo(laboratorio, pedidoMinimo) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debe iniciar sesión.");

  const payload = {
    user_id: user.id,
    laboratorio: laboratorio,
    pedido_minimo: parseFloat(pedidoMinimo) || 0,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from(USER_LABORATORIOS_TABLE)
    .upsert(payload, { onConflict: 'user_id,laboratorio' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
export async function createCustomPlatform(laboratorio_nombre, pedidoMinimo) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debe iniciar sesiÃ³n.");

  const payload = {
    user_id: user.id,
    laboratorio: laboratorio_nombre,
    pedido_minimo: parseFloat(pedidoMinimo) || 0,
    is_plataforma: true,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from(USER_LABORATORIOS_TABLE)
    .upsert(payload, { onConflict: 'user_id,laboratorio' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCustomPlatform(laboratorio_nombre) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debe iniciar sesiÃ³n.");

  // Delete from user_laboratorios
  const { error: err1 } = await supabase
    .from(USER_LABORATORIOS_TABLE)
    .delete()
    .eq('user_id', user.id)
    .eq('laboratorio', laboratorio_nombre);
    
  if (err1) throw err1;

  // Meds linked are deleted via cascade or we can delete them explicitly:
  const { error: err2 } = await supabase
    .from('blistercheck_user_plataforma_medicamentos')
    .delete()
    .eq('user_id', user.id)
    .eq('laboratorio_nombre', laboratorio_nombre);

  if (err2) throw err2;
  return true;
}

export async function addMedicationToPlatform(laboratorio_nombre, cn) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debe iniciar sesiÃ³n.");

  const { data, error } = await supabase
    .from('blistercheck_user_plataforma_medicamentos')
    .insert({
      user_id: user.id,
      laboratorio_nombre: laboratorio_nombre,
      cn: cn
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeMedicationFromPlatform(laboratorio_nombre, cn) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debe iniciar sesiÃ³n.");

  const { error } = await supabase
    .from('blistercheck_user_plataforma_medicamentos')
    .delete()
    .eq('user_id', user.id)
    .eq('laboratorio_nombre', laboratorio_nombre)
    .eq('cn', cn);

  if (error) throw error;
  return true;
}
