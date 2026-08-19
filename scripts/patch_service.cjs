const fs = require('fs');
const filePath = 'c:/Users/ferna/Desktop/AptoBlister/src/services/blistercheckService.js';
const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

const newFunc = `export async function searchAvanzado(filtros = {}) {
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
    });
    
    if (res.error) {
      console.error('Error en RPC bc_search_avanzado:', res.error);
      throw res.error;
    }
    
    return res.data || [];
  } catch (err) {
    console.error('Fallo en searchAvanzado:', err);
    throw err;
  }
}`;

let start = -1; let end = -1;
for(let i=0; i<lines.length; i++) {
  if(lines[i].startsWith('export async function searchAvanzado(filtros = {}) {')) start = i;
  if(start !== -1 && lines[i].startsWith('// ─── VALORES ÚNICOS PARA FILTROS')) { end = i; break; }
}

if(start !== -1 && end !== -1) {
  // quitar líneas vacías antes del final
  let trueEnd = end;
  while(lines[trueEnd-1].trim() === '') trueEnd--;
  lines.splice(start, trueEnd - start, newFunc + '\n');
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log('Reemplazo exitoso');
} else {
  console.log('No se pudo encontrar la funcion', start, end);
}
