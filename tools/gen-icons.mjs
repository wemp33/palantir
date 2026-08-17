// Palantir — PWA icon generator. The mark is drawn as geometry (a ring above a
// chevron cradle), white on dark navy. No external dependencies.
//   node tools/gen-icons.mjs      (run from the palantir/ directory)
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'icons');

/* ---------- minimal PNG encoder ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encodePNG(width, height, rgba) {
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter: none
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolour + alpha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- mark geometry ----------
   Normalised 0..1 inside the glyph square. A heavy ring (the seeing-stone)
   resting in a chevron cradle whose two arms meet at a point below centre. */
const CX = 0.5, CY = 0.36;          // ring centre
const R_OUT = 0.36, R_IN = 0.245;   // ring radii => stroke of 0.115

const V_L = 0.045, V_R = 0.955;     // chevron span
const V_EDGE = 0.775;               // top of an arm at the outer end
const V_MID = 0.885;                // top of the arms where they meet
const V_TH = 0.115;                 // arm thickness, measured vertically

function chevronTop(x) {
  // 0 at the outer ends, 1 at the centre
  const t = 1 - Math.abs(2 * x - 1);
  return V_EDGE + (V_MID - V_EDGE) * t;
}

function inGlyph(x, y) {
  const d = Math.hypot(x - CX, y - CY);
  if (d <= R_OUT && d >= R_IN) return true;
  if (x >= V_L && x <= V_R) {
    const top = chevronTop(x);
    if (y >= top && y <= top + V_TH) return true;
  }
  return false;
}

/* ---------- colours ---------- */
const NAVY_HI = [0x11, 0x22, 0x3c];
const NAVY_LO = [0x07, 0x11, 0x21];
const WHITE = [0xff, 0xff, 0xff];

function lerp(a, b, t) { return a + (b - a) * t; }

function renderIcon(size, { padding = 0.13, radius = null } = {}) {
  const SS = 4; // supersampling
  const buf = Buffer.alloc(size * size * 4);
  const inner = 1 - 2 * padding;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = (x + (sx + 0.5) / SS) / size;
          const fy = (y + (sy + 0.5) / SS) / size;

          let bgA = 1;
          if (radius !== null) {
            const cx = Math.min(Math.max(fx, radius), 1 - radius);
            const cy = Math.min(Math.max(fy, radius), 1 - radius);
            bgA = Math.hypot(fx - cx, fy - cy) <= radius ? 1 : 0;
          }

          // background: a faint navy gradient, lighter at the top-left
          const t = Math.min(1, Math.max(0, (fx + fy) / 2));
          const bg = [0, 1, 2].map(i => lerp(NAVY_HI[i], NAVY_LO[i], t));

          const lx = (fx - padding) / inner;
          const ly = (fy - padding) / inner;
          const on = lx >= 0 && lx <= 1 && ly >= 0 && ly <= 1 && inGlyph(lx, ly);

          const px = on ? WHITE : bg;
          r += px[0] * bgA; g += px[1] * bgA; b += px[2] * bgA; a += 255 * bgA;
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      buf[i] = Math.round(r / n);
      buf[i + 1] = Math.round(g / n);
      buf[i + 2] = Math.round(b / n);
      buf[i + 3] = Math.round(a / n);
    }
  }
  return encodePNG(size, size, buf);
}

fs.mkdirSync(OUT, { recursive: true });

const targets = [
  ['icon-180.png', 180, { padding: 0.15 }],           // apple-touch-icon (iOS rounds it itself)
  ['icon-192.png', 192, { padding: 0.15 }],
  ['icon-512.png', 512, { padding: 0.15 }],
  ['icon-maskable-512.png', 512, { padding: 0.24 }],  // safe zone for Android masks
  ['favicon-64.png', 64, { padding: 0.10, radius: 0.22 }],
];

for (const [name, size, opts] of targets) {
  fs.writeFileSync(path.join(OUT, name), renderIcon(size, opts));
  console.log('ok:', name, size + 'x' + size);
}

/* ---------- vector version ---------- */
const p = (v) => +(v * 100).toFixed(2);
const chevron = [
  `M${p(V_L)} ${p(chevronTop(V_L))}`,
  `L${p(0.5)} ${p(V_MID)}`,
  `L${p(V_R)} ${p(chevronTop(V_R))}`,
  `L${p(V_R)} ${p(chevronTop(V_R) + V_TH)}`,
  `L${p(0.5)} ${p(V_MID + V_TH)}`,
  `L${p(V_L)} ${p(chevronTop(V_L) + V_TH)}`,
  'Z',
].join(' ');

const ringR = (R_OUT + R_IN) / 2;
const ringW = R_OUT - R_IN;

fs.writeFileSync(path.join(OUT, 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#0B1626"/>
  <g transform="translate(13 13) scale(0.74)">
    <circle cx="${p(CX)}" cy="${p(CY)}" r="${p(ringR)}" fill="none" stroke="#fff" stroke-width="${p(ringW)}"/>
    <path d="${chevron}" fill="#fff"/>
  </g>
</svg>
`);
console.log('ok: favicon.svg');
console.log('\nchevron path (for index.html):\n' + chevron);
console.log(`ring: cx=${p(CX)} cy=${p(CY)} r=${p(ringR)} stroke-width=${p(ringW)}`);
