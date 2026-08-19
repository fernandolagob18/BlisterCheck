import { supabase } from './src/lib/supabase.js';
import { searchSimple, searchAvanzado } from './src/services/blistercheckService.js';

async function run() {
  console.log("Testing searchSimple('Para')...");
  const start = Date.now();
  const res = await searchSimple('Para');
  console.log(`searchSimple: ${res.length} results returned in ${Date.now() - start}ms`);

  console.log("Testing searchAvanzado({ nombre: 'Para' })...");
  const start2 = Date.now();
  const res2 = await searchAvanzado({ nombre: 'Para' });
  console.log(`searchAvanzado: ${res2.length} results returned in ${Date.now() - start2}ms`);
}

run().catch(console.error);
