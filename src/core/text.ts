// 文字：字形用手写马克笔字体「霞鹜漫黑」(OFL)；汉字的书写顺序来自 hanzi-writer-data 的笔顺中线——
// 笔沿着真实笔顺走，走到哪儿字就露出到哪儿。数字、字母、符号从左到右写出。
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import { pkgDir } from './pkg';
import { type Stroke, polyLen } from './strokes';

const hzCache = new Map<string, { medians: number[][][] } | null>();
let hzDir = '';
export function hanzi(ch: string) {
  if (hzCache.has(ch)) return hzCache.get(ch)!;
  if (!/[㐀-鿿]/.test(ch)) { hzCache.set(ch, null); return null; }
  if (!hzDir) hzDir = pkgDir('hanzi-writer-data');
  const f = hzDir + ch + '.json';
  const v = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
  hzCache.set(ch, v);
  return v;
}

let font: any = null;
function theFont(): any {
  if (font) return font;
  const b = readFileSync(fileURLToPath(new URL('../../assets/fonts/LXGWMarkerGothic-Regular.ttf', import.meta.url)));
  font = opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  return font;
}
const glyphCache = new Map<string, { d: string; adv: number; ok: boolean; x0: number; x1: number }>();
function glyph(c: string) {
  let g = glyphCache.get(c);
  if (!g) {
    const f = theFont(), gl = f.charToGlyph(c), ok = !!gl && gl.index !== 0;
    const bb = ok ? gl.getBoundingBox() : { x1: 0, x2: 0 };
    g = { d: ok ? gl.getPath(0, 0, 1000).toPathData(1) : '', adv: ok ? (gl.advanceWidth ?? f.unitsPerEm) / f.unitsPerEm : 0.5, ok, x0: bb.x1 / f.unitsPerEm, x1: bb.x2 / f.unitsPerEm };
    glyphCache.set(c, g);
  }
  return g;
}

// 全角标点在手写里占位太宽，收紧一些
const TIGHT: Record<string, number> = { '，': 0.5, '。': 0.5, '、': 0.5, '：': 0.5, '；': 0.5, '？': 0.62, '！': 0.5, '“': 0.5, '”': 0.5, '（': 0.5, '）': 0.5 };

export interface TextOpts { size: number; color: string; align?: 'left' | 'center' | 'right'; lineGap?: number; tracking?: number }

function advance(c: string, size: number, tracking: number): number {
  if (c === ' ') return size * 0.3;
  const g = glyph(c);
  return (g.adv * (TIGHT[c] ?? 1) + tracking) * size;
}
export function textWidth(line: string, size: number, tracking = 0.02): number { let w = 0; for (const c of line) w += advance(c, size, tracking); return w; }

/** 生成文字笔画。原点在整段文字的左上角。字体里没有的字符返回在 missing 里。 */
export function textStrokes(text: string, o: TextOpts): { strokes: Stroke[]; missing: string[]; w: number; h: number } {
  const size = o.size, tracking = o.tracking ?? 0.02;
  const lines = String(text).split('\n');
  const widths = lines.map(l => textWidth(l, size, tracking));
  const W = Math.max(...widths), lh = size * (1 + (o.lineGap ?? 0.22));
  const strokes: Stroke[] = [], missing: string[] = [];
  lines.forEach((line, li) => {
    let x = o.align === 'right' ? W - widths[li] : o.align === 'left' ? 0 : (W - widths[li]) / 2;
    const top = li * lh, base = top + size * 0.88;
    for (const c of line) {
      if (c === ' ') { x += advance(c, size, tracking); continue; }
      const g = glyph(c), adv = advance(c, size, tracking);
      if (!g.ok) { missing.push(c); x += adv; continue; }
      const tight = TIGHT[c] != null, gx = tight ? x - g.x0 * size + (adv - (g.x1 - g.x0) * size) / 2 : x;
      const hz = hanzi(c);
      const box = { x, y: top, w: adv, h: size };
      if (hz) {
        // 笔顺中线：1024 坐标、y 轴向上、基线在 900 → 换到像素
        const k = size / 1024;
        const medians = hz.medians.map((m: number[][]) => m.flatMap(([mx, my]: number[]) => [x + mx * k, top + (900 - my) * k + size * 0.02]));
        const len = medians.reduce((n: number, m: number[]) => n + polyLen(m), 0);
        strokes.push({ kind: 'fglyph', d: g.d, tx: gx, ty: base, s: size / 1000, medians, r: size * 0.115, color: o.color, len: len + medians.length * size * 0.05, box });
      } else strokes.push({ kind: 'wipe', d: g.d, tx: gx, ty: base, s: size / 1000, color: o.color, len: adv * 1.5 + size * 0.1, box });
      x += adv;
    }
  });
  return { strokes, missing, w: W, h: lh * (lines.length - 1) + size };
}
