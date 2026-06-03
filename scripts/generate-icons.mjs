/**
 * Generates placeholder PNG icons for the PWA manifest.
 * Run: node scripts/generate-icons.mjs
 * Replace with real artwork before launch.
 */
import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";

function crc32(buf) {
  const table = Array.from({ length: 256 }, (_, i) => {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  let crc = 0xffffffff;
  for (const byte of buf) crc = (table[(crc ^ byte) & 0xff] ^ (crc >>> 8)) >>> 0;
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const payload = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(payload));
  return Buffer.concat([len, payload, crcBuf]);
}

function solidPNG(size, [r, g, b]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // RGB colour type
  // bytes 10-12: compression=0, filter=0, interlace=0

  // Raw image: one filter byte + size*3 RGB bytes per row
  const row = Buffer.alloc(1 + size * 3);
  row[0] = 0; // None filter
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = r;
    row[1 + x * 3 + 1] = g;
    row[1 + x * 3 + 2] = b;
  }
  const raw = Buffer.concat(Array(size).fill(row));

  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdrData),
    pngChunk("IDAT", deflateSync(raw, { level: 6 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// FIFA gold: #C8A24B  ink: #0B0B0B
const GOLD = [0xc8, 0xa2, 0x4b];

mkdirSync("public/icons", { recursive: true });

writeFileSync("public/icons/icon-192.png", solidPNG(192, GOLD));
writeFileSync("public/icons/icon-512.png", solidPNG(512, GOLD));
writeFileSync("public/icons/apple-touch-icon.png", solidPNG(180, GOLD));

console.log("✓ Placeholder icons written to public/icons/ — replace with real artwork before launch.");
