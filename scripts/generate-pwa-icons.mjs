/**
 * Generates PWA icons and favicon (pure Node, no native deps).
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../apps/frontend/public/icons');

/** Theme terracotta + cream accent */
const BG = [196, 92, 38, 255];
const FG = [250, 248, 245, 255];

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

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function createPng(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const margin = Math.floor(size * 0.18);
  const inner = size - margin * 2;
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1) + 1;
    raw[row - 1] = 0;
    for (let x = 0; x < size; x++) {
      const i = row + x * 4;
      const inReceipt =
        x >= margin &&
        x < margin + inner &&
        y >= margin &&
        y < margin + inner;
      const rx = 0.12 * size;
      const corner =
        (x < margin + rx && y < margin + rx) ||
        (x >= margin + inner - rx && y < margin + rx) ||
        (x < margin + rx && y >= margin + inner - rx) ||
        (x >= margin + inner - rx && y >= margin + inner - rx);
      const useFg = inReceipt && !corner;
      const c = useFg ? FG : BG;
      raw[i] = c[0];
      raw[i + 1] = c[1];
      raw[i + 2] = c[2];
      raw[i + 3] = c[3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function writeIco(png32) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = 32;
  entry[1] = 32;
  entry[2] = 0;
  entry[3] = 0;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png32.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png32]);
}

mkdirSync(outDir, { recursive: true });
const png192 = createPng(192);
const png512 = createPng(512);
const png32 = createPng(32);
writeFileSync(join(outDir, 'icon-192.png'), png192);
writeFileSync(join(outDir, 'icon-512.png'), png512);
writeFileSync(join(__dirname, '../apps/frontend/public/favicon.ico'), writeIco(png32));
console.log('Wrote public/icons/icon-192.png, icon-512.png, favicon.ico');
