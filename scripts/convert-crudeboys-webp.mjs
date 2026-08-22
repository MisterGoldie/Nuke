import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'public/crudeboys');
const WIDTH = 512;
const QUALITY = 78;
const CONCURRENCY = 8;

const pngs = fs.readdirSync(DIR).filter((name) => name.toLowerCase().endsWith('.png'));
if (!pngs.length) {
  throw new Error(`No PNGs in ${DIR}`);
}

function convertOne(fileName) {
  const input = path.join(DIR, fileName);
  const output = path.join(DIR, fileName.replace(/\.png$/i, '.webp'));
  return new Promise((resolve, reject) => {
    const child = spawn(
      'ffmpeg',
      [
        '-y',
        '-i',
        input,
        '-vf',
        `scale=${WIDTH}:-2`,
        '-c:v',
        'libwebp',
        '-q:v',
        String(QUALITY),
        output,
      ],
      { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] },
    );
    let err = '';
    child.stderr.on('data', (chunk) => {
      err += chunk.toString();
    });
    child.on('close', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`${fileName} failed (${code}): ${err.slice(-400)}`));
    });
  });
}

let next = 0;
let done = 0;
async function worker() {
  while (next < pngs.length) {
    const fileName = pngs[next];
    next += 1;
    await convertOne(fileName);
    done += 1;
    if (done % 40 === 0 || done === pngs.length) {
      console.log(`converted ${done}/${pngs.length}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

let pngBytes = 0;
let webpBytes = 0;
for (const fileName of pngs) {
  const pngPath = path.join(DIR, fileName);
  const webpPath = path.join(DIR, fileName.replace(/\.png$/i, '.webp'));
  pngBytes += fs.statSync(pngPath).size;
  webpBytes += fs.statSync(webpPath).size;
  fs.unlinkSync(pngPath);
}

console.log(
  `done ${pngs.length} images @ ${WIDTH}px q${QUALITY}: png=${(pngBytes / 1e6).toFixed(1)}MB webp=${(webpBytes / 1e6).toFixed(1)}MB`,
);
