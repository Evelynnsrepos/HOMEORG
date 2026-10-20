import { unzlibSync } from 'fflate';

/**
 * Just enough of a PDF reader to get the words out of a shop's order PDF, with
 * where each one sits on the page. Runs on the phone, no network, no WebView.
 *
 * It handles what generated documents (invoices, order confirmations) use:
 * uncompressed or Flate-compressed page streams, the standard fonts with
 * WinAnsi encoding, and text placed with Tm/Td. Embedded fonts with their own
 * character maps, scanned pages and encrypted files are out of scope — those
 * come back with no text, and the caller says it can't read the file.
 */

export interface TextRun {
  /** 0-based page number */
  page: number;
  /** PDF points from the left edge */
  x: number;
  /** PDF points from the bottom edge, so bigger is higher up */
  y: number;
  size: number;
  text: string;
}

/** WinAnsi differs from Latin-1 only in 0x80–0x9F. */
const WIN_ANSI_HIGH: Record<number, string> = {
  0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡',
  0x88: 'ˆ', 0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ', 0x8e: 'Ž', 0x91: '‘',
  0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—', 0x98: '˜',
  0x99: '™', 0x9a: 'š', 0x9b: '›', 0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ',
};

function winAnsi(bytes: number[]): string {
  let out = '';
  for (const b of bytes) out += WIN_ANSI_HIGH[b] ?? String.fromCharCode(b);
  return out;
}

/** Byte-for-byte string, so offsets match the Uint8Array. */
function latin1(data: Uint8Array): string {
  let out = '';
  const chunk = 0x8000;
  for (let i = 0; i < data.length; i += chunk) {
    out += String.fromCharCode.apply(null, Array.from(data.subarray(i, i + chunk)));
  }
  return out;
}

/* ---- the file: objects, pages, streams ------------------------------ */

interface PdfObject {
  dict: string;
  stream?: Uint8Array;
}

function readObjects(data: Uint8Array): Map<number, PdfObject> {
  const raw = latin1(data);
  const objects = new Map<number, PdfObject>();
  const head = /(\d+)\s+\d+\s+obj\b/g;
  let m: RegExpExecArray | null;

  while ((m = head.exec(raw))) {
    const num = Number(m[1]);
    const start = m.index + m[0].length;
    const end = raw.indexOf('endobj', start);
    if (end < 0) break;
    const body = raw.slice(start, end);

    const at = body.search(/stream\r?\n/);
    if (at < 0) {
      objects.set(num, { dict: body });
    } else {
      const dict = body.slice(0, at);
      const begin = start + at + (body[at + 6] === '\r' ? 8 : 7);
      const len = /\/Length\s+(\d+)\b(?!\s+\d+\s+R)/.exec(dict);
      let stop = len ? begin + Number(len[1]) : raw.indexOf('endstream', begin);
      if (stop > end || stop < begin) stop = raw.indexOf('endstream', begin);
      objects.set(num, { dict, stream: data.subarray(begin, stop) });
    }
    head.lastIndex = end;
  }
  return objects;
}

function refs(text: string): number[] {
  return [...text.matchAll(/(\d+)\s+\d+\s+R/g)].map((r) => Number(r[1]));
}

/** Page objects in reading order, following the page tree from the root. */
function pageList(objects: Map<number, PdfObject>): PdfObject[] {
  const pages: PdfObject[] = [];
  const seen = new Set<number>();

  const walk = (num: number) => {
    if (seen.has(num)) return;
    seen.add(num);
    const obj = objects.get(num);
    if (!obj) return;
    const kids = /\/Kids\s*\[([^\]]*)\]/.exec(obj.dict);
    if (kids) refs(kids[1]).forEach(walk);
    else if (/\/Type\s*\/Page\b/.test(obj.dict)) pages.push(obj);
  };

  for (const [num, obj] of objects) {
    if (/\/Type\s*\/Pages\b/.test(obj.dict) && !/\/Parent\b/.test(obj.dict)) walk(num);
  }
  if (pages.length) return pages;

  // no tidy page tree: take the page objects in file order
  return [...objects.values()].filter((o) => /\/Type\s*\/Page\b/.test(o.dict));
}

function decode(obj: PdfObject): Uint8Array | null {
  if (!obj.stream) return null;
  if (!/\/Filter/.test(obj.dict)) return obj.stream;
  if (/\/Filter\s*\/FlateDecode\b|\/Filter\s*\[\s*\/FlateDecode\s*\]/.test(obj.dict)) {
    try {
      return unzlibSync(obj.stream);
    } catch {
      return null;
    }
  }
  return null;
}

function pageContent(page: PdfObject, objects: Map<number, PdfObject>): string {
  const single = /\/Contents\s+(\d+)\s+\d+\s+R/.exec(page.dict);
  const many = /\/Contents\s*\[([^\]]*)\]/.exec(page.dict);
  const nums = single ? [Number(single[1])] : many ? refs(many[1]) : [];

  return nums
    .map((n) => {
      const obj = objects.get(n);
      const bytes = obj ? decode(obj) : null;
      return bytes ? latin1(bytes) : '';
    })
    .join('\n');
}

/* ---- the page: text operators ------------------------------------ */

type Token = { kind: 'op'; v: string } | { kind: 'num'; v: number } | { kind: 'str'; v: number[] } | { kind: 'arr'; v: Token[] } | { kind: 'name'; v: string };

const DELIM = '()<>[]{}/%';
const isSpace = (c: string) => c === ' ' || c === '\n' || c === '\r' || c === '\t' || c === '\f' || c === '\0';

function tokenize(src: string): Token[] {
  let i = 0;

  const literal = (): number[] => {
    const out: number[] = [];
    let depth = 1;
    i++; // (
    while (i < src.length) {
      const c = src[i];
      if (c === '\\') {
        const n = src[i + 1];
        i += 2;
        if (n === 'n') out.push(10);
        else if (n === 'r') out.push(13);
        else if (n === 't') out.push(9);
        else if (n === 'b') out.push(8);
        else if (n === 'f') out.push(12);
        else if (n === '\r' || n === '\n') {
          if (n === '\r' && src[i] === '\n') i++;
        } else if (n >= '0' && n <= '7') {
          let oct = n;
          while (oct.length < 3 && src[i] >= '0' && src[i] <= '7') oct += src[i++];
          out.push(parseInt(oct, 8) & 0xff);
        } else out.push(n.charCodeAt(0));
        continue;
      }
      if (c === '(') depth++;
      if (c === ')' && --depth === 0) {
        i++;
        break;
      }
      out.push(c.charCodeAt(0));
      i++;
    }
    return out;
  };

  const hex = (): number[] => {
    const end = src.indexOf('>', i);
    const digits = src.slice(i + 1, end < 0 ? src.length : end).replace(/\s+/g, '');
    i = end < 0 ? src.length : end + 1;
    const out: number[] = [];
    for (let k = 0; k < digits.length; k += 2) out.push(parseInt(digits.slice(k, k + 2).padEnd(2, '0'), 16));
    return out;
  };

  const read = (): Token[] => {
    const out: Token[] = [];
    while (i < src.length) {
      const c = src[i];
      if (isSpace(c)) {
        i++;
      } else if (c === '%') {
        while (i < src.length && src[i] !== '\n' && src[i] !== '\r') i++;
      } else if (c === '(') {
        out.push({ kind: 'str', v: literal() });
      } else if (c === '<' && src[i + 1] === '<') {
        // inline dictionaries (marked content) carry nothing we need
        const end = src.indexOf('>>', i);
        i = end < 0 ? src.length : end + 2;
      } else if (c === '<') {
        out.push({ kind: 'str', v: hex() });
      } else if (c === '[') {
        i++;
        out.push({ kind: 'arr', v: read() });
      } else if (c === ']') {
        i++;
        return out;
      } else if (c === '/') {
        let j = i + 1;
        while (j < src.length && !isSpace(src[j]) && !DELIM.includes(src[j])) j++;
        out.push({ kind: 'name', v: src.slice(i + 1, j) });
        i = j;
      } else {
        let j = i;
        while (j < src.length && !isSpace(src[j]) && !DELIM.includes(src[j])) j++;
        if (j === i) j++;
        const word = src.slice(i, j);
        const n = Number(word);
        out.push(word !== '' && Number.isFinite(n) ? { kind: 'num', v: n } : { kind: 'op', v: word });
        i = j;
      }
    }
    return out;
  };

  return read();
}

type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[1] * n[2],
    m[0] * n[1] + m[1] * n[3],
    m[2] * n[0] + m[3] * n[2],
    m[2] * n[1] + m[3] * n[3],
    m[4] * n[0] + m[5] * n[2] + n[4],
    m[4] * n[1] + m[5] * n[3] + n[5],
  ];
}

function pageText(content: string, page: number): TextRun[] {
  const runs: TextRun[] = [];
  const stack: Matrix[] = [];
  let ctm: Matrix = IDENTITY;
  let tm: Matrix = IDENTITY;
  let line: Matrix = IDENTITY;
  let size = 10;
  let leading = 0;
  const args: Token[] = [];

  const num = (k: number) => {
    const t = args[args.length - k];
    return t?.kind === 'num' ? t.v : 0;
  };
  const moveTo = (tx: number, ty: number) => {
    line = multiply([1, 0, 0, 1, tx, ty], line);
    tm = line;
  };
  const show = (bytes: number[]) => {
    const text = winAnsi(bytes);
    if (!text.trim()) return;
    const at = multiply(tm, ctm);
    runs.push({ page, x: at[4], y: at[5], size: size * Math.abs(at[3] || at[0]), text });
  };

  for (const tok of tokenize(content)) {
    if (tok.kind !== 'op') {
      args.push(tok);
      continue;
    }
    switch (tok.v) {
      case 'q':
        stack.push(ctm);
        break;
      case 'Q':
        ctm = stack.pop() ?? IDENTITY;
        break;
      case 'cm':
        ctm = multiply([num(6), num(5), num(4), num(3), num(2), num(1)], ctm);
        break;
      case 'BT':
        tm = line = IDENTITY;
        break;
      case 'Tf':
        size = num(1);
        break;
      case 'TL':
        leading = num(1);
        break;
      case 'Tm':
        tm = line = [num(6), num(5), num(4), num(3), num(2), num(1)];
        break;
      case 'Td':
        moveTo(num(2), num(1));
        break;
      case 'TD':
        leading = -num(1);
        moveTo(num(2), num(1));
        break;
      case 'T*':
        moveTo(0, -leading);
        break;
      case 'Tj': {
        const s = args[args.length - 1];
        if (s?.kind === 'str') show(s.v);
        break;
      }
      case "'":
      case '"': {
        moveTo(0, -leading);
        const s = args[args.length - 1];
        if (s?.kind === 'str') show(s.v);
        break;
      }
      case 'TJ': {
        const arr = args[args.length - 1];
        if (arr?.kind !== 'arr') break;
        // kerning numbers only nudge letters; a big gap means a word space
        const bytes: number[] = [];
        for (const part of arr.v) {
          if (part.kind === 'str') bytes.push(...part.v);
          else if (part.kind === 'num' && part.v < -200) bytes.push(32);
        }
        show(bytes);
        break;
      }
    }
    args.length = 0;
  }
  return runs;
}

/** Every piece of text in the file, page by page, top to bottom. */
export function readPdfText(data: Uint8Array): TextRun[] {
  const objects = readObjects(data);
  return pageList(objects).flatMap((page, i) => pageText(pageContent(page, objects), i));
}

/**
 * Runs that share a baseline, left to right. Text that is a point or two off
 * the line (a bolder font, a superscript) still counts as the same line.
 */
export function toLines(runs: TextRun[], tolerance = 2): TextRun[][] {
  const sorted = [...runs].sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x);
  const lines: TextRun[][] = [];
  for (const run of sorted) {
    const last = lines[lines.length - 1];
    if (last && last[0].page === run.page && Math.abs(last[0].y - run.y) <= tolerance) last.push(run);
    else lines.push([run]);
  }
  for (const l of lines) l.sort((a, b) => a.x - b.x);
  return lines;
}
