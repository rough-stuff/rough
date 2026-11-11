// 笔画层：把 rough.js 生成的手绘路径压成可按时间重放的折线笔画。
import { RoughGenerator } from '../rough/generator';
import type { Drawable, Options } from '../rough/core';

export type Pt = [number, number];
export type Box = { x: number; y: number; w: number; h: number };

export interface LineStroke { kind: 'line'; pts: number[]; w: number; color: string; len: number; under?: boolean; alpha?: number; cum?: number[] }
/** 汉字笔画：outline 是该笔的轮廓，median 是运笔中线，按中线推进并用轮廓裁剪 */
export interface GlyphStroke { kind: 'glyph'; d: string; m: [number, number, number, number, number, number]; median: number[]; mw: number; color: string; len: number; bold: number; box: Box; cum?: number[] }
/** 非汉字字形：整个字形轮廓，从左到右揭开 */
export interface WipeStroke { kind: 'wipe'; d: string; tx: number; ty: number; color: string; len: number; bold: number; box: Box }
/** 实心填充块：在自己的时间片里淡入 */
export interface FillStroke { kind: 'fill'; pts: number[]; color: string; alpha: number; len: number; under: true }
export type Stroke = LineStroke | GlyphStroke | WipeStroke | FillStroke;

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 2147483647 || 1;
}
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function polyLen(pts: number[]): number {
  let L = 0;
  for (let i = 2; i < pts.length; i += 2) L += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
  return L;
}
export function cumLen(s: { pts?: number[]; median?: number[]; cum?: number[] }): number[] {
  if (s.cum) return s.cum;
  const pts = (s.pts ?? s.median)!;
  const c = [0];
  for (let i = 2; i < pts.length; i += 2) c.push(c[c.length - 1] + Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]));
  return (s.cum = c);
}
/** 折线上 frac∈[0,1] 处的点 */
export function pointAt(pts: number[], cum: number[], frac: number): Pt {
  const total = cum[cum.length - 1];
  const target = Math.max(0, Math.min(1, frac)) * total;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < target) i++;
  const seg = cum[i] - cum[i - 1] || 1;
  const k = (target - cum[i - 1]) / seg;
  return [pts[2 * i - 2] + (pts[2 * i] - pts[2 * i - 2]) * k, pts[2 * i - 1] + (pts[2 * i + 1] - pts[2 * i - 1]) * k];
}

export function boxOf(strokes: Stroke[]): Box {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x: number, y: number) => { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; };
  for (const s of strokes) {
    if (s.kind === 'line' || s.kind === 'fill') { for (let i = 0; i < s.pts.length; i += 2) add(s.pts[i], s.pts[i + 1]); }
    else { add(s.box.x, s.box.y); add(s.box.x + s.box.w, s.box.y + s.box.h); }
  }
  if (x0 === Infinity) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
export const unionBox = (bs: Box[]): Box => {
  const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
  return { x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x, h: Math.max(...bs.map(b => b.y + b.h)) - y };
};

export function translateStrokes(strokes: Stroke[], dx: number, dy: number): void {
  for (const s of strokes) {
    if (s.kind === 'line' || s.kind === 'fill') { for (let i = 0; i < s.pts.length; i += 2) { s.pts[i] += dx; s.pts[i + 1] += dy; } }
    else {
      s.box.x += dx; s.box.y += dy;
      if (s.kind === 'glyph') { s.m[4] += dx; s.m[5] += dy; }
      else { s.tx += dx; s.ty += dy; }
    }
  }
}

const gen = new RoughGenerator();

export interface Style { color: string; w: number; rough: number; seed: number; fill?: string; fillStyle?: string; fillGap?: number; fillAlpha?: number; double?: boolean; bow?: number }

function opts(st: Style): Options {
  return {
    seed: st.seed, roughness: st.rough, bowing: st.bow ?? 1, stroke: st.color, strokeWidth: st.w,
    disableMultiStroke: !st.double, disableMultiStrokeFill: true,
    fill: st.fill, fillStyle: st.fillStyle ?? 'hachure', hachureGap: st.fillGap ?? Math.max(9, st.w * 2.4), fillWeight: Math.max(2, st.w * 0.6),
    hachureAngle: -41, preserveVertices: st.rough < 0.5, curveStepCount: 12,
  };
}

function bez(out: number[], x0: number, y0: number, d: number[]) {
  const [x1, y1, x2, y2, x3, y3] = d;
  const approx = Math.hypot(x1 - x0, y1 - y0) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2);
  const n = Math.max(2, Math.min(40, Math.ceil(approx / 7)));
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push(u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3);
  }
}

/** rough 的 Drawable → 时间有序的笔画（先轮廓，后上色；上色在渲染时垫在轮廓下面） */
export function toStrokes(d: Drawable, st: Style): Stroke[] {
  const outline: Stroke[] = [], fills: Stroke[] = [];
  for (const set of d.sets) {
    const lines: number[][] = [];
    let cur: number[] | null = null;
    for (const op of set.ops) {
      if (op.op === 'move') { cur = [op.data[0], op.data[1]]; lines.push(cur); }
      else if (!cur) continue;
      else if (op.op === 'lineTo') cur.push(op.data[0], op.data[1]);
      else bez(cur, cur[cur.length - 2], cur[cur.length - 1], op.data);
    }
    for (const pts of lines) {
      if (pts.length < 4) continue;
      const len = polyLen(pts);
      if (set.type === 'path') outline.push({ kind: 'line', pts, w: st.w, color: st.color, len });
      else if (set.type === 'fillSketch') fills.push({ kind: 'line', pts, w: Math.max(2, st.w * 0.6), color: st.fill!, len, under: true, alpha: st.fillAlpha ?? 0.85 });
      else fills.push({ kind: 'fill', pts, color: st.fill!, alpha: st.fillAlpha ?? 0.35, len: Math.sqrt(len) * 12, under: true });
    }
  }
  return [...outline, ...fills];
}

export const R = {
  line: (x1: number, y1: number, x2: number, y2: number, st: Style) => toStrokes(gen.line(x1, y1, x2, y2, opts(st)), st),
  rect: (x: number, y: number, w: number, h: number, st: Style) => toStrokes(gen.rectangle(x, y, w, h, opts(st)), st),
  ellipse: (cx: number, cy: number, w: number, h: number, st: Style) => toStrokes(gen.ellipse(cx, cy, w, h, opts(st)), st),
  poly: (pts: Pt[], close: boolean, st: Style) => toStrokes(close ? gen.polygon(pts, opts(st)) : gen.linearPath(pts, opts(st)), st),
  curve: (pts: Pt[], st: Style) => toStrokes(gen.curve(pts, opts(st)), st),
  path: (d: string, st: Style) => toStrokes(gen.path(d, opts(st)), st),
  arc: (cx: number, cy: number, w: number, h: number, a0: number, a1: number, st: Style) => toStrokes(gen.arc(cx, cy, w, h, a0, a1, false, opts(st)), st),
};
