// Render beberapa still sekaligus (1 bundle, 1 browser).
// Pakai: node scripts/stills.mjs <Composition> <outDir> <frame,frame,...> [propsJSON]
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const [comp, outDir, framesArg, propsJson] = process.argv.slice(2);
const root = process.cwd();
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const browser = await openBrowser('chrome', {browserExecutable: process.env.BROWSER_EXECUTABLE});
const inputProps = propsJson ? JSON.parse(propsJson) : {};
const composition = await selectComposition({serveUrl, id: comp, inputProps, puppeteerInstance: browser});
fs.mkdirSync(outDir, {recursive: true});
for (const f of framesArg.split(',').map(Number)) {
  const output = path.join(outDir, `${comp}-${String(f).padStart(5, '0')}.png`);
  await renderStill({composition, serveUrl, frame: f, output, inputProps, puppeteerInstance: browser, imageFormat: 'png'});
  console.log(output);
}
await browser.close({silent: true});
