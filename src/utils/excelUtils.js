import ExcelJS from 'exceljs';

/**
 * Extrae el valor primitivo de una celda ExcelJS.
 */
export function getCellValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object') {
    if (Array.isArray(val.richText)) return val.richText.map(r => r.text).join('');
    if (typeof val.text === 'string') return val.text;
    if (val instanceof Date) return val;
  }
  return val;
}

/**
 * Lee un archivo .xlsx o .csv y devuelve un array de arrays.
 */
export async function parseSpreadsheet(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'csv') {
    const text = await file.text();
    const firstLine = text.split('\n')[0] || '';
    const sep = (firstLine.split(';').length >= firstLine.split(',').length) ? ';' : ',';
    return text
      .split('\n')
      .filter(line => line.trim())
      .map(line =>
        line.split(sep).map(cell =>
          cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
        )
      );
  }

  const data = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);
  const worksheet = workbook.worksheets[0];
  const json = [];
  worksheet.eachRow(row => {
    json.push(row.values.slice(1).map(getCellValue));
  });
  return json;
}