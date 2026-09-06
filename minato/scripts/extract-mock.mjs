import fs from 'fs';
import path from 'path';
import vm from 'node:vm';

const root = path.resolve(process.cwd(), '..');
const srcDir = path.join(root, 'src/lib/mock');
const outDir = path.join(process.cwd(), 'scripts/seed');

function ensureDir(p){ fs.mkdirSync(p, {recursive:true}); }

function extractBetween(text, startMarker, endMarker){
  const s = text.indexOf(startMarker);
  if (s === -1) throw new Error('start marker not found');
  const e = text.indexOf(endMarker, s);
  if (e === -1) throw new Error('end marker not found');
  return text.slice(s, e + endMarker.length);
}

// not used currently

async function writeJson(name, data){
  ensureDir(outDir);
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2));
  console.log('wrote', name, data.length ?? Object.keys(data).length);
}

async function main(){
  // categories + locations
  const categoriesTs = fs.readFileSync(path.join(srcDir, 'categories.ts'),'utf8');
  const catArr = categoriesTs.match(/export const mockCategories:[\s\S]*?=\s*(\[[\s\S]*?\]);/)[1];
  const locArr = categoriesTs.match(/export const mockLocations:[\s\S]*?=\s*(\[[\s\S]*?\]);/)[1];
  await writeJson('categories.json', eval(`(${catArr})`));
  await writeJson('locations.json', eval(`(${locArr})`));

  // approvals
  const approvalsTs = fs.readFileSync(path.join(srcDir, 'approvals.ts'),'utf8');
  const apprArr = approvalsTs.match(/let approvals:[\s\S]*?=\s*(\[[\s\S]*?\]);/)[1];
  await writeJson('approvals.json', eval(`(${apprArr})`));

  // assets
  const assetsTs = fs.readFileSync(path.join(srcDir, 'assets.ts'),'utf8');
  const genFn = assetsTs.match(/const generateTxId = [\s\S]*?\n\};/)[0];
  const assetsArr = assetsTs.match(/export const mockAssets:[\s\S]*?=\s*(\[[\s\S]*?\]);/)[1];
  const assetsCode = `${genFn}\n;globalThis.__OUT__ = ${assetsArr};`;
  const ctx = {console};
  vm.createContext(ctx);
  vm.runInContext(assetsCode, ctx);
  await writeJson('assets.json', ctx.__OUT__);

  // maintenance and history
  const txTs = fs.readFileSync(path.join(srcDir, 'transactions.ts'),'utf8');
  const genHash = txTs.match(/const generateHash = [\s\S]*?\n\};/)[0];
  const genTx = txTs.match(/const generateTxId = [\s\S]*?\n\};/)[0];
  const maintArr = txTs.match(/export const mockMaintenanceRecords:[\s\S]*?=\s*(\[[\s\S]*?\]);/)[1];
  const histObj = txTs.match(/export const mockAssetHistory:[\s\S]*?=\s*(\{[\s\S]*?\});/)[1];
  const ctx2 = { console };
  vm.createContext(ctx2);
  vm.runInContext(`${genHash}\n${genTx}\n;globalThis.__M__=${maintArr};\n;globalThis.__H__=${histObj};`, ctx2);
  const maintenance = ctx2.__M__;
  const histMap = ctx2.__H__;
  const history = Object.values(histMap).flat();
  await writeJson('maintenance.json', maintenance);
  await writeJson('history.json', history);
}

main().catch(e=>{ console.error(e); process.exit(1); });
