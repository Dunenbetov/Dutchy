/**
 * Resizes apps/frontend/public/icons/icon-source.png into PWA sizes.
 * Source: 1024×1024 PNG (design master). Regenerate master in design tools if needed.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../apps/frontend/public/icons');
const sourcePath = join(iconsDir, 'icon-source.png');

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function writeIco(pngBuffer) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = 32;
  entry[1] = 32;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, pngBuffer]);
}

if (!existsSync(sourcePath)) {
  console.error(`Missing ${sourcePath} — add a 1024×1024 master icon first.`);
  process.exit(1);
}

mkdirSync(iconsDir, { recursive: true });

const master = sharp(sourcePath);

await master.clone().resize(512, 512).png({ compressionLevel: 9 }).toFile(join(iconsDir, 'icon-512.png'));
await master.clone().resize(192, 192).png({ compressionLevel: 9 }).toFile(join(iconsDir, 'icon-192.png'));

const png32 = await master.clone().resize(32, 32).png().toBuffer();
writeFileSync(join(__dirname, '../apps/frontend/public/favicon.ico'), writeIco(png32));

console.log('Wrote icon-512.png, icon-192.png, favicon.ico from icon-source.png');
