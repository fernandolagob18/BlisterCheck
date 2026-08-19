const fs = require('fs');
const filePath = 'c:/Users/ferna/Desktop/AptoBlister/src/services/blistercheckService.js';
const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

const exportFunc = `export async function getExportData(modo = 'clasificados') {
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
}`;

const labsFunc = `export async function getMisLaboratoriosData() {
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
}`;

// --- Patch getMisLaboratoriosData ---
let labsStart = -1, labsEnd = -1;
for(let i=0; i<lines.length; i++) {
  if(lines[i].startsWith("export async function getMisLaboratoriosData() {")) labsStart = i;
  if(labsStart !== -1 && lines[i].startsWith("export async function savePedidoMinimo")) { labsEnd = i; break; }
}
if(labsStart !== -1 && labsEnd !== -1) {
  let trueEnd = labsEnd;
  while(lines[trueEnd-1].trim() === '') trueEnd--;
  lines.splice(labsStart, trueEnd - labsStart, labsFunc + '\n');
}

// --- Patch getExportData ---
let exportStart = -1, exportEnd = -1;
for(let i=0; i<lines.length; i++) {
  if(lines[i].startsWith("export async function getExportData(modo = 'clasificados') {")) exportStart = i;
  if(exportStart !== -1 && lines[i].startsWith("export async function getAlternativasSDMDU")) { exportEnd = i; break; }
}
if(exportStart !== -1 && exportEnd !== -1) {
  let trueEnd = exportEnd;
  while(lines[trueEnd-1].trim() === '') trueEnd--;
  lines.splice(exportStart, trueEnd - exportStart, exportFunc + '\n');
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log('Reemplazo doble exitoso');
