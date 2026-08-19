const fs = require('fs');
const filePath = 'c:/Users/ferna/Desktop/AptoBlister/src/services/blistercheckService.js';
const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

const newFunc = `export async function getEstadisticasPorLaboratorio(soloMiFarmacia = false) {
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
}`;

let start = -1; let end = -1;
for(let i=0; i<lines.length; i++) {
  if(lines[i].startsWith('export async function getEstadisticasPorLaboratorio(soloMiFarmacia = false) {')) start = i;
  if(start !== -1 && lines[i].startsWith('// ─── INFO GENERAL DEL CATÁLOGO')) { end = i; break; }
}

if(start !== -1 && end !== -1) {
  let trueEnd = end;
  while(lines[trueEnd-1].trim() === '') trueEnd--;
  lines.splice(start, trueEnd - start, newFunc + '\n');
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log('Reemplazo exitoso');
} else {
  console.log('No se pudo encontrar la funcion getEstadisticasPorLaboratorio', start, end);
}
