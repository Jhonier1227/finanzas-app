// Genera los iconos PNG de la PWA sin dependencias externas (Node + zlib).
// Motivo: tres barras ascendentes blancas sobre fondo esmeralda (#10b981).
//   node scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "public/icons";

// CRC32 (tabla precomputada)
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
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

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter none
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Dibuja el icono: fondo esmeralda + 3 barras blancas ascendentes. */
function drawIcon(size, { maskable }) {
  const px = Buffer.alloc(size * size * 4);
  const emerald = [16, 185, 129, 255]; // #10b981
  const white = [255, 255, 255, 255];

  // Zona del arte: maskable exige ~80% central seguro (el SO recorta);
  // el icono normal usa margen menor y esquinas redondeadas.
  const inset = maskable ? size * 0.24 : size * 0.16;
  const zone = size - inset * 2; // lado de la zona de arte
  const radius = maskable ? 0 : size * 0.22; // esquinas redondeadas
  const barW = Math.round(zone * 0.18);
  const gap = Math.round(zone * 0.13);
  const barsH = [0.32, 0.52, 0.72].map((h) => Math.round(zone * h));
  const baseY = inset + zone - Math.round(zone * 0.03);
  const startX = Math.round(inset + (zone - (barW * 3 + gap * 2)) / 2);
  const barR = Math.round(barW * 0.35); // redondeo de las barras

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const o = (y * size + x) * 4;

      // Fondo: transparente fuera de la esquina redondeada (solo icono normal)
      if (radius > 0) {
        const inCorner = (cx, cy) =>
          Math.hypot(x - cx, y - cy) > radius;
        const r = radius;
        if (
          (x < r && y < r && inCorner(r, r)) ||
          (x >= size - r && y < r && inCorner(size - r - 1, r)) ||
          (x < r && y >= size - r && inCorner(r, size - r - 1)) ||
          (x >= size - r && y >= size - r && inCorner(size - r - 1, size - r - 1))
        ) {
          px.fill(0, o, o + 4);
          continue;
        }
      }
      px.set(emerald, o);

      // Barras blancas con esquinas superiores redondeadas
      for (let b = 0; b < 3; b++) {
        const x0 = startX + b * (barW + gap);
        const x1 = x0 + barW;
        const y0 = baseY - barsH[b];
        if (x >= x0 && x < x1 && y >= y0 && y < baseY) {
          const inBar =
            y >= y0 + barR ||
            Math.hypot(x - (x0 + barR), y - (y0 + barR)) <= barR ||
            Math.hypot(x - (x1 - barR - 1), y - (y0 + barR)) <= barR;
          if (inBar) px.set(white, o);
        }
      }
    }
  }
  return encodePng(size, px);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/icon-192.png`, drawIcon(192, { maskable: false }));
writeFileSync(`${OUT}/icon-512.png`, drawIcon(512, { maskable: false }));
writeFileSync(
  `${OUT}/icon-maskable-512.png`,
  drawIcon(512, { maskable: true })
);
console.log("Iconos generados en public/icons/: icon-192.png, icon-512.png, icon-maskable-512.png");
