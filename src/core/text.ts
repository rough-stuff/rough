// 文字：汉字用带笔顺的楷体数据（hanzi-writer-data，源自 Make Me a Hanzi / 文鼎楷体）一笔一笔写；
// 数字、字母、符号用霞鹜文楷的字形轮廓，从左到右揭开。清晰可读优先。
import { readFileSync, existsSync } from 'node:fs';
import { pkgDir } from './pkg';
import opentype from 'opentype.js';
import { type Stroke, polyLen } from './strokes';

const hzCache = new Map<string, { strokes: string[]; medians: number[][][] } | null>();
let hzDir = '';
export function hanzi(ch: string) {
  if (hzCache.has(ch)) return hzCache.get(ch)!;
  if (!hzDir) hzDir = pkgDir('hanzi-writer-data');
  const f = hzDir + ch + '.json';
  const v = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
  hzCache.set(ch, v);
  return v;
}

let latin: any = null;
function latinFont(): any {
  if (latin) return latin;
  const f = pkgDir('@fontsource/lxgw-wenkai-tc') + 'files/lxgw-wenkai-tc-latin-700-normal.woff';
  const b = readFileSync(f);
  latin = opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  return latin;
}

const FULL2HALF: Record<string, string> = { '？': '?', '！': '!', '，': ',', '：': ':', '；': ';', '（': '(', '）': ')', '％': '%', '＋': '+', '－': '-', '＝': '=', '、': ',', '。': '.', '“': '"', '”': '"', '‘': "'", '’': "'", '—': '-', '→': '>', '×': 'x', '￥': '¥' };

export interface TextOpts { size: number; color: string; bold?: number; align?: 'left' | 'center' | 'right'; lineGap?: number; tracking?: number }

export function textWidth(line: string, size: number, tracking = 0): number {
  let w = 0;
  for (const c0 of line) {
    const c = FULL2HALF[c0] ?? c0;
    if (hanzi(c)) w += size * (1 + tracking);
    else if (c === ' ') w += size * 0.35;
    else w += latinFont().getAdvanceWidth(c, size * 0.96) + size * tracking;
  }
  return w;
}

/** 生成文字笔画。原点在整段文字的左上角。未知字符返回在 missing 里。 */
export function textStrokes(text: string, o: TextOpts): { strokes: Stroke[]; missing: string[]; w: number; h: number } {
  const size = o.size, tracking = o.tracking ?? 0.02;
  const bold = o.bold ?? size * 0.022;
  const lines = String(text).split('\n');
  const widths = lines.map(l => textWidth(l, size, tracking));
  const W = Math.max(...widths), lh = size * (1 + (o.lineGap ?? 0.25));
  const strokes: Stroke[] = [], missing: string[] = [];
  const s = size / 1024;
  lines.forEach((line, li) => {
    let x = o.align === 'right' ? W - widths[li] : o.align === 'left' ? 0 : (W - widths[li]) / 2;
    const y = li * lh;
    for (const c0 of line) {
      const c = FULL2HALF[c0] ?? c0;
      const hz = hanzi(c);
      if (hz) {
        hz.strokes.forEach((d: string, i: number) => {
          const median = hz.medians[i].flat();
          strokes.push({ kind: 'glyph', d, m: [s, 0, 0, -s, x, y + 900 * s], median, mw: 210, color: o.color, len: polyLen(median) * s + size * 0.12, bold, box: { x, y, w: size, h: size } });
        });
        x += size * (1 + tracking);
      } else if (c === ' ') x += size * 0.35;
      else {
        const f = latinFont(), fs = size * 0.96;
        const g = f.charToGlyph(c);
        if (!g || g.index === 0) { missing.push(c0); x += size * 0.5; continue; }
        const adv = f.getAdvanceWidth(c, fs);
        const d = g.getPath(0, 0, fs).toPathData(2);
        if (d) strokes.push({ kind: 'wipe', d, tx: x, ty: y + size * 0.86, color: o.color, len: adv * 1.6 + size * 0.1, bold: bold * 0.4, box: { x, y: y + size * 0.08, w: adv, h: size * 0.9 } });
        x += adv + size * tracking;
      }
    }
  });
  return { strokes, missing, w: W, h: lh * (lines.length - 1) + size };
}
