// Gera ícones PNG do PWA (fundo azul da marca + capacete de obra branco),
// sem dependências externas — encoder PNG próprio via zlib.
import zlib from "zlib";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

const BRAND = [37, 99, 235]; // #2563eb

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function png(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filtro none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function draw(S) {
  const rgba = Buffer.alloc(S * S * 4);
  const set = (x, y, r, g, b) => {
    const i = (y * S + x) * 4;
    rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = 255;
  };
  // Fundo cheio (full-bleed → serve como maskable também)
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) set(x, y, BRAND[0], BRAND[1], BRAND[2]);

  // Capacete branco: cúpula (meia-elipse) + aba (elipse fina) + faixa
  const domeCx = 0.5 * S, domeCy = 0.60 * S, domeRx = 0.24 * S, domeRy = 0.28 * S;
  const brimCx = 0.5 * S, brimCy = 0.635 * S, brimRx = 0.35 * S, brimRy = 0.058 * S;
  const bandY0 = 0.585 * S, bandY1 = 0.615 * S; // faixa (recorte azul) sob a cúpula
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const inDome = ((x - domeCx) ** 2) / domeRx ** 2 + ((y - domeCy) ** 2) / domeRy ** 2 <= 1 && y <= domeCy;
      const inBrim = ((x - brimCx) ** 2) / brimRx ** 2 + ((y - brimCy) ** 2) / brimRy ** 2 <= 1;
      if (inDome || inBrim) set(x, y, 255, 255, 255);
      // faixa azul separando cúpula/aba, só na largura da cúpula
      const inBand = y >= bandY0 && y <= bandY1 && Math.abs(x - domeCx) <= domeRx * 0.82;
      if (inBand) set(x, y, BRAND[0], BRAND[1], BRAND[2]);
    }
  return png(S, rgba);
}

const outDir = path.join(process.cwd(), "public", "icons");
mkdirSync(outDir, { recursive: true });
for (const S of [192, 512, 180]) {
  writeFileSync(path.join(outDir, `icon-${S}.png`), draw(S));
  console.log("wrote icon-" + S + ".png");
}
