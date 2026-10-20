/**
 * Draws the app icons straight to PNG — no image libraries, no binary assets
 * checked in that nobody can regenerate. Run with: node scripts/make-icons.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'assets');

/* ---------------- tiny canvas ---------------- */

function canvas(size) {
  const px = new Uint8Array(size * size * 4);
  return {
    size,
    px,
    set(x, y, [r, g, b], a = 255) {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      const i = (y * size + x) * 4;
      const src = a / 255;
      const dstA = px[i + 3] / 255;
      const outA = src + dstA * (1 - src);
      if (outA === 0) return;
      px[i] = Math.round((r * src + px[i] * dstA * (1 - src)) / outA);
      px[i + 1] = Math.round((g * src + px[i + 1] * dstA * (1 - src)) / outA);
      px[i + 2] = Math.round((b * src + px[i + 2] * dstA * (1 - src)) / outA);
      px[i + 3] = Math.round(outA * 255);
    },
    /** anti-aliased fill of any signed-distance-ish predicate */
    fill(color, inside, alpha = 255) {
      const s = 3; // supersamples per axis
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          let hits = 0;
          for (let sy = 0; sy < s; sy++) {
            for (let sx = 0; sx < s; sx++) {
              if (inside(x + (sx + 0.5) / s, y + (sy + 0.5) / s)) hits++;
            }
          }
          if (hits) this.set(x, y, color, (alpha * hits) / (s * s));
        }
      }
    },
  };
}

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

function roundedRect(x0, y0, w, h, r) {
  return (x, y) => {
    if (x < x0 || y < y0 || x > x0 + w || y > y0 + h) return false;
    const cx = Math.min(Math.max(x, x0 + r), x0 + w - r);
    const cy = Math.min(Math.max(y, y0 + r), y0 + h - r);
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= r * r;
  };
}

function polygon(points) {
  return (x, y) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
}

const circle = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

/* ---------------- the mark ---------------- */

const CREAM = hex('#FAF5EA');
const SAGE = hex('#7FA88A');
const SAGE_DARK = hex('#5F8A6C');
const CORAL = hex('#EE8A6C');
const GOLD = hex('#E3AE45');
const INK = hex('#2E2A25');

/** A little house with a glowing window. u = unit of the canvas (size / 100). */
function drawMark(c, u, oy = 0) {
  const Y = (v) => v * u + oy;
  const X = (v) => v * u;

  // chimney sits behind the roof line
  c.fill(SAGE_DARK, roundedRect(X(64), Y(20), X(8), X(18), X(2)));
  // roof
  c.fill(
    SAGE_DARK,
    polygon([
      [X(50), Y(22)],
      [X(84), Y(48)],
      [X(16), Y(48)],
    ]),
  );
  // body
  c.fill(SAGE, roundedRect(X(24), Y(46), X(52), X(32), X(5)));
  // lit windows
  c.fill(GOLD, roundedRect(X(30), Y(54), X(11), X(11), X(2.5)));
  c.fill(GOLD, roundedRect(X(59), Y(54), X(11), X(11), X(2.5)));
  // door
  c.fill(CREAM, roundedRect(X(44), Y(58), X(12), X(20), X(3)));
  // sparkle, clear of the chimney
  c.fill(
    CORAL,
    polygon([
      [X(83), Y(8)],
      [X(86), Y(17)],
      [X(95), Y(20)],
      [X(86), Y(23)],
      [X(83), Y(32)],
      [X(80), Y(23)],
      [X(71), Y(20)],
      [X(80), Y(17)],
    ]),
  );
}

/* ---------------- PNG ---------------- */

function writePng(file, c) {
  const { size, px } = c;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0;
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      raw[p++] = px[i];
      raw[p++] = px[i + 1];
      raw[p++] = px[i + 2];
      raw[p++] = px[i + 3];
    }
  }

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  console.log('wrote', path.basename(file), `${size}x${size}`, `${(png.length / 1024) | 0}kb`);
}

let table = null;
function crc32(buf) {
  if (!table) {
    table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return crc ^ -1;
}

/* ---------------- outputs ---------------- */

function appIcon(size) {
  const c = canvas(size);
  const u = size / 100;
  c.fill(CREAM, () => true);
  drawMark(c, u);
  return c;
}

/** Android foreground: transparent, and inset so the launcher mask can't clip it. */
function foreground(size) {
  const c = canvas(size);
  const u = (size / 100) * 0.62;
  const shift = (size - 100 * u) / 2;
  const inner = canvas(Math.round(100 * u));
  drawMark(inner, u);
  for (let y = 0; y < inner.size; y++) {
    for (let x = 0; x < inner.size; x++) {
      const i = (y * inner.size + x) * 4;
      const a = inner.px[i + 3];
      if (a) {
        c.set(
          Math.round(x + shift),
          Math.round(y + shift),
          [inner.px[i], inner.px[i + 1], inner.px[i + 2]],
          a,
        );
      }
    }
  }
  return c;
}

function monochrome(size) {
  const c = foreground(size);
  for (let i = 0; i < c.px.length; i += 4) {
    if (c.px[i + 3]) {
      c.px[i] = INK[0];
      c.px[i + 1] = INK[1];
      c.px[i + 2] = INK[2];
    }
  }
  return c;
}

function splash(size) {
  const c = canvas(size);
  const u = size / 100;
  drawMark(c, u);
  return c;
}

fs.mkdirSync(OUT, { recursive: true });
writePng(path.join(OUT, 'icon.png'), appIcon(1024));
writePng(path.join(OUT, 'android-icon-foreground.png'), foreground(1024));
writePng(path.join(OUT, 'android-icon-monochrome.png'), monochrome(1024));
writePng(path.join(OUT, 'splash-icon.png'), splash(512));
writePng(path.join(OUT, 'favicon.png'), appIcon(64));
