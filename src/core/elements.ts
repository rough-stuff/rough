// 元素：把分镜里“画什么、放哪儿”的声明变成摆好位置的笔画。
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { R, type Stroke, type Style, type Pt, type Box, boxOf, unionBox, translateStrokes, hash, polyLen } from './strokes';
import { textStrokes } from './text';
import { iconStrokes, iconExists, scalePath } from './icons';
import { figureStrokes, POSES, FACES, ACCESSORIES, type Pose, type FigureSpec } from './figure';
import { THEME, color, type Format } from './theme';

export class SrcError extends Error { constructor(public where: string, msg: string) { super(`${where}: ${msg}`); } }

export interface El {
  id: string; scene: string; kind: string; src: any;
  strokes: Stroke[]; box: Box; anchors: Record<string, Pt>;
  text?: string;              // 板书文字内容（用于检查与分镜表）
  missing?: string[];
  path?: number[];            // 箭头/线的走向，可作移动轨迹
  figure?: { spec: FigureSpec; dx: number; dy: number; labelStrokes: Stroke[] };
  rebuild?: (pose: Pose, face: string) => Stroke[];
}

export const KINDS = ['text', 'figure', 'icon', 'doodle', 'parts', 'shape', 'arrow', 'line', 'mark', 'chart'] as const;
const POS_KEYS = ['at', 'rightOf', 'leftOf', 'above', 'below'];
const COMMON = ['id', 'at', 'rightOf', 'leftOf', 'above', 'below', 'gap', 'align', 'anchor', 'dx', 'dy', 'size', 'color', 'label', 'labelSize', 'rough', 'w', 'h', 'fill', 'fillStyle', 'pen', 'z'];
const FIELDS: Record<string, string[]> = {
  text: ['bold', 'lineGap'], figure: ['face', 'wear', 'accent', 'pose'], icon: [], doodle: ['vars'], parts: ['box'],
  shape: [], arrow: ['curve', 'head', 'both', 'pad'], line: ['curve', 'pad'], mark: ['target', 'pad'],
  chart: ['data', 'labels', 'highlight', 'values', 'unit'],
};

const DOODLE_DIR = join(fileURLToPath(new URL('.', import.meta.url)), '../../doodles');
export function doodleDirs(projectDir?: string): string[] { return [projectDir ? join(projectDir, 'doodles') : '', DOODLE_DIR].filter(d => d && existsSync(d)); }
export function loadDoodle(name: string, projectDir?: string): any | null {
  for (const d of doodleDirs(projectDir)) { const f = join(d, name + '.yaml'); if (existsSync(f)) return YAML.parse(readFileSync(f, 'utf8')); }
  return null;
}

function num(v: any, total: number, where: string): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && /^-?[\d.]+%$/.test(v)) return (parseFloat(v) / 100) * total;
  throw new SrcError(where, `坐标要写数字或百分比（如 320 或 "50%"），现在是 ${JSON.stringify(v)}`);
}

/** 小图形清单（doodle 的内容，或元素里内联的 parts）→ 笔画。k 为缩放 */
export function buildParts(parts: any[], k: number, base: Style, vars: Record<string, any>, where: string): { strokes: Stroke[]; text: string } {
  const out: Stroke[] = [];
  let text = '';
  const sub = (v: any): any => (typeof v === 'string' && v.startsWith('$') ? vars[v.slice(1)] ?? '' : v);
  const P = (a: any[]): Pt[] => a.map(p => [p[0] * k, p[1] * k]);
  parts.forEach((p, i) => {
    const w0 = `${where} 第 ${i + 1} 个图形`;
    if (!p || typeof p !== 'object') throw new SrcError(w0, '应该是一个对象，例如 {rect: [0,0,100,60]}');
    const st: Style = { ...base, seed: base.seed + i * 7 + 1, color: p.color ? color(sub(p.color)) : base.color, w: p.pen ?? base.w, rough: p.rough ?? base.rough,
      fill: p.fill ? color(sub(p.fill)) : undefined, fillStyle: p.fillStyle, fillAlpha: p.fillAlpha, fillGap: p.fillGap };
    const need = (key: string, n: number) => { if (!Array.isArray(p[key]) || p[key].length < n) throw new SrcError(w0, `${key} 需要 ${n} 个数字`); return p[key].map((x: number) => x * k); };
    if ('line' in p) { const a = need('line', 4); out.push(...R.line(a[0], a[1], a[2], a[3], st)); }
    else if ('rect' in p) { const a = need('rect', 4); out.push(...R.rect(a[0], a[1], a[2], a[3], st)); }
    else if ('ellipse' in p) { const a = need('ellipse', 4); out.push(...R.ellipse(a[0], a[1], a[2], a[3], st)); }
    else if ('circle' in p) { const a = need('circle', 3); out.push(...R.ellipse(a[0], a[1], a[2], a[2], st)); }
    else if ('arc' in p) { const a = p.arc; out.push(...R.arc(a[0] * k, a[1] * k, a[2] * k, a[3] * k, (a[4] * Math.PI) / 180, (a[5] * Math.PI) / 180, st)); }
    else if ('poly' in p) out.push(...R.poly(P(p.poly), !!p.close, st));
    else if ('curve' in p) out.push(...R.curve(P(p.curve), st));
    else if ('path' in p) out.push(...R.path(scalePath(String(p.path), k), st));
    else if ('icon' in p) { if (!iconExists(p.icon)) throw new SrcError(w0, `没有叫 ${p.icon} 的图标，用 hj assets icons <关键词> 搜索`); out.push(...iconStrokes(p.icon, p.at[0] * k, p.at[1] * k, (p.size ?? 24) * k, st)); }
    else if ('text' in p) {
      const s = String(sub(p.text));
      if (!s) return;
      const t = textStrokes(s, { size: (p.size ?? 40) * k, color: st.color });
      translateStrokes(t.strokes, p.at[0] * k - t.w / 2, p.at[1] * k - t.h / 2);
      out.push(...t.strokes); text += s;
    } else throw new SrcError(w0, `不认识的图形 ${JSON.stringify(Object.keys(p))}，可用：line rect ellipse circle arc poly curve path icon text`);
  });
  return { strokes: out, text };
}

export interface BuildCtx { scene: string; fmt: Format; els: Map<string, El>; projectDir?: string }

function parseRef(ctx: BuildCtx, ref: any, where: string): { pt: Pt; el?: El; explicit: boolean } {
  if (Array.isArray(ref)) return { pt: [num(ref[0], ctx.fmt.board.w, where), num(ref[1], ctx.fmt.board.h, where)], explicit: true };
  if (typeof ref !== 'string') throw new SrcError(where, `位置引用要写元素 id、"id.锚点" 或 [x, y]，现在是 ${JSON.stringify(ref)}`);
  const [id, a] = ref.split('.');
  const el = ctx.els.get(id);
  if (!el) throw new SrcError(where, `引用了不存在（或定义在它后面）的元素 "${id}"。被引用的元素要写在前面`);
  if (!a) return { pt: el.anchors.center, el, explicit: false };
  if (!el.anchors[a]) throw new SrcError(where, `元素 "${id}" 没有锚点 "${a}"，可用：${Object.keys(el.anchors).join(' ')}`);
  return { pt: el.anchors[a], el, explicit: true };
}

/** 从 from 指向 to 的射线离开 box（外扩 pad）的位置 */
function exitPoint(b: Box, pad: number, from: Pt, to: Pt): Pt {
  const hw = b.w / 2 + pad, hh = b.h / 2 + pad, dx = to[0] - from[0], dy = to[1] - from[1];
  if (!dx && !dy) return from;
  const t = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
  return [from[0] + dx * Math.min(t, 0.48), from[1] + dy * Math.min(t, 0.48)];
}

function setAnchors(el: El) {
  const b = el.box, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  el.anchors = { ...el.anchors, center: [cx, cy], top: [cx, b.y], bottom: [cx, b.y + b.h], left: [b.x, cy], right: [b.x + b.w, cy],
    topLeft: [b.x, b.y], topRight: [b.x + b.w, b.y], bottomLeft: [b.x, b.y + b.h], bottomRight: [b.x + b.w, b.y + b.h] };
}

export function buildElement(ctx: BuildCtx, id: string, src: any): El {
  const where = `场景 ${ctx.scene} / 元素 ${id}`;
  if (!src || typeof src !== 'object') throw new SrcError(where, '元素定义应该是一个对象');
  const kind = KINDS.find(k => k in src);
  if (!kind) throw new SrcError(where, `看不出这是什么元素。需要包含其中一个键：${KINDS.join(' ')}`);
  for (const k of Object.keys(src)) if (k !== kind && !COMMON.includes(k) && !FIELDS[kind].includes(k)) throw new SrcError(where, `${kind} 元素不认识字段 "${k}"。可用：${[...COMMON, ...FIELDS[kind]].join(' ')}`);
  const B = ctx.fmt.board;
  const seed = hash(ctx.scene + '/' + id);
  const st: Style = { color: color(src.color), w: src.pen ?? THEME.pen, rough: src.rough ?? THEME.rough, seed, fill: src.fill ? color(src.fill) : undefined, fillStyle: src.fillStyle };
  const el: El = { id, scene: ctx.scene, kind, src, strokes: [], box: { x: 0, y: 0, w: 0, h: 0 }, anchors: {} };
  let placed = false; // arrow/line/mark 直接画在场景坐标里

  if (kind === 'text') {
    const t = textStrokes(String(src.text), { size: src.size ?? THEME.textSize, color: st.color, bold: src.bold, align: src.align, lineGap: src.lineGap });
    el.strokes = t.strokes; el.text = String(src.text); el.missing = t.missing;
  } else if (kind === 'figure') {
    const f = typeof src.figure === 'string' ? { pose: src.figure } : src.figure ?? {};
    const poseName = src.pose ?? f.pose ?? 'stand', face = src.face ?? f.face ?? 'happy', wear = src.wear ?? f.wear ?? [];
    if (!POSES[poseName]) throw new SrcError(where, `没有姿势 "${poseName}"。可用：${Object.keys(POSES).join(' ')}`);
    if (!FACES[face]) throw new SrcError(where, `没有表情 "${face}"。可用：${Object.keys(FACES).join(' ')}`);
    for (const a of wear) if (!ACCESSORIES.includes(a)) throw new SrcError(where, `没有配饰 "${a}"。可用：${ACCESSORIES.join(' ')}`);
    const spec: FigureSpec = { size: src.size ?? 360, color: st.color, pose: POSES[poseName], face, accessories: wear, accent: src.accent ? color(src.accent) : undefined, seed };
    const r = figureStrokes(spec);
    el.strokes = r.strokes; el.anchors = r.anchors; el.figure = { spec, dx: 0, dy: 0, labelStrokes: [] };
  } else if (kind === 'icon') {
    if (!iconExists(src.icon)) throw new SrcError(where, `没有叫 "${src.icon}" 的图标。用 hj assets icons <英文关键词> 搜索`);
    el.strokes = iconStrokes(src.icon, 0, 0, src.size ?? 200, { ...st, rough: src.rough ?? 0.6 });
  } else if (kind === 'doodle' || kind === 'parts') {
    let parts = src.parts, box = src.box, vars = src.vars ?? {};
    if (kind === 'doodle') {
      const d = loadDoodle(src.doodle, ctx.projectDir);
      if (!d) throw new SrcError(where, `没有叫 "${src.doodle}" 的手绘件。用 hj assets doodles 查看，或在项目的 doodles/ 目录里自己画一个`);
      parts = d.parts; box = d.box; vars = { ...(d.vars ?? {}), ...vars };
    }
    if (!Array.isArray(parts)) throw new SrcError(where, 'parts 应该是图形列表');
    const k = src.size && box ? src.size / Math.max(box[0], box[1]) : 1;
    const r = buildParts(parts, k, st, vars, where);
    el.strokes = r.strokes; el.text = r.text || undefined;
  } else if (kind === 'shape') {
    const w = src.w ?? src.size ?? 240, h = src.h ?? src.size ?? 160;
    if (src.shape === 'rect') el.strokes = R.rect(0, 0, w, h, st);
    else if (src.shape === 'ellipse') el.strokes = R.ellipse(0, 0, w, h, st);
    else if (src.shape === 'circle') el.strokes = R.ellipse(0, 0, w, w, st);
    else if (src.shape === 'diamond') el.strokes = R.poly([[0, -h / 2], [w / 2, 0], [0, h / 2], [-w / 2, 0]], true, st);
    else if (src.shape === 'triangle') el.strokes = R.poly([[0, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], true, st);
    else if (src.shape === 'cloud') { const d = `M${-w * 0.3},${h * 0.3} C${-w * 0.62},${h * 0.3} ${-w * 0.6},${-h * 0.15} ${-w * 0.33},${-h * 0.12} C${-w * 0.32},${-h * 0.5} ${w * 0.08},${-h * 0.55} ${w * 0.13},${-h * 0.22} C${w * 0.4},${-h * 0.42} ${w * 0.62},${-h * 0.05} ${w * 0.4},${h * 0.08} C${w * 0.6},${h * 0.2} ${w * 0.45},${h * 0.32} ${w * 0.3},${h * 0.3} Z`; el.strokes = R.path(d, st); }
    else throw new SrcError(where, `没有形状 "${src.shape}"。可用：rect ellipse circle diamond triangle cloud`);
  } else if (kind === 'arrow' || kind === 'line') {
    const refs = src[kind];
    if (!Array.isArray(refs) || refs.length !== 2) throw new SrcError(where, `${kind} 要写成 [起点, 终点]，起终点可以是元素 id、"id.锚点" 或 [x, y]`);
    const a = parseRef(ctx, refs[0], where), b = parseRef(ctx, refs[1], where);
    const pad = src.pad ?? 18;
    const p0 = a.el && !a.explicit ? exitPoint(a.el.box, pad, a.pt, b.pt) : a.pt;
    const p1 = b.el && !b.explicit ? exitPoint(b.el.box, pad, b.pt, a.pt) : b.pt;
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1, bow = (src.curve ?? 0) * L;
    const mid: Pt = [(p0[0] + p1[0]) / 2 - (dy / L) * bow, (p0[1] + p1[1]) / 2 + (dx / L) * bow];
    el.strokes = bow ? R.curve([p0, mid, p1], { ...st, rough: Math.min(st.rough, 0.6) }) : R.line(p0[0], p0[1], p1[0], p1[1], st);
    el.path = (el.strokes[0] as any).pts.slice();
    if (kind === 'arrow') {
      const hs = src.head ?? 26;
      const head = (tip: Pt, from: Pt, n: number) => { const ang = Math.atan2(tip[1] - from[1], tip[0] - from[0]); for (const s of [-1, 1]) { const q = ang + Math.PI + s * 0.48; el.strokes.push(...R.line(tip[0], tip[1], tip[0] + Math.cos(q) * hs, tip[1] + Math.sin(q) * hs, { ...st, rough: 0.4, seed: seed + n + s })); } };
      head(p1, bow ? mid : p0, 11);
      if (src.both) head(p0, bow ? mid : p1, 17);
    }
    placed = true;
  } else if (kind === 'mark') {
    const targets = (Array.isArray(src.target) ? src.target : [src.target]).map((t: any) => parseRef(ctx, t, where));
    if (targets.some((t: any) => !t.el)) throw new SrcError(where, 'mark 的 target 要写元素 id');
    const tb = unionBox(targets.map((t: any) => t.el!.box)), pad = src.pad ?? 14;
    const b = { x: tb.x - pad, y: tb.y - pad, w: tb.w + pad * 2, h: tb.h + pad * 2 }, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const ms: Style = { ...st, color: color(src.color, THEME.colors.red), w: src.pen ?? THEME.pen * 1.15 };
    const m = src.mark;
    if (m === 'circle') el.strokes = R.ellipse(cx, cy, b.w * 1.22 + 20, b.h * 1.3 + 20, { ...ms, rough: 1.6, double: true });
    else if (m === 'box') el.strokes = R.rect(b.x, b.y, b.w, b.h, { ...ms, rough: 1.3 });
    else if (m === 'underline') el.strokes = [...R.line(b.x, b.y + b.h + 2, b.x + b.w, b.y + b.h + 2, ms), ...R.line(b.x + b.w * 0.98, b.y + b.h + 14, b.x + b.w * 0.08, b.y + b.h + 14, { ...ms, seed: seed + 5 })];
    else if (m === 'strike') el.strokes = R.line(b.x, cy + 2, b.x + b.w, cy - 2, { ...ms, w: ms.w * 1.2 });
    else if (m === 'cross') el.strokes = [...R.line(b.x, b.y, b.x + b.w, b.y + b.h, { ...ms, w: ms.w * 1.4 }), ...R.line(b.x + b.w, b.y, b.x, b.y + b.h, { ...ms, w: ms.w * 1.4, seed: seed + 5 })];
    else if (m === 'highlight') { const pts = [b.x + 4, cy + 3, b.x + b.w - 4, cy - 3]; el.strokes = [{ kind: 'line', pts, w: tb.h * 0.82, color: color(src.color, THEME.colors.yellow), len: polyLen(pts), under: true, alpha: 0.38 }]; }
    else if (m === 'check') el.strokes = R.poly([[cx - b.w * 0.3, cy], [cx - b.w * 0.05, cy + b.h * 0.3], [cx + b.w * 0.4, cy - b.h * 0.4]], false, { ...ms, color: color(src.color, THEME.colors.green), w: ms.w * 1.5, rough: 0.6 });
    else if (m === 'burst') { const n = 10; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2, rx = b.w / 2 + 14, ry = b.h / 2 + 14, l = 30 + (i % 2) * 16; el.strokes.push(...R.line(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, cx + Math.cos(a) * (rx + l), cy + Math.sin(a) * (ry + l), { ...ms, seed: seed + i, rough: 0.5 })); } }
    else throw new SrcError(where, `没有标记 "${m}"。可用：circle box underline strike cross highlight check burst`);
    placed = true;
  } else if (kind === 'chart') {
    el.strokes = chartStrokes(src, st, where); el.text = (src.labels ?? []).join('');
  }

  if (!el.strokes.length) throw new SrcError(where, '这个元素没有画出任何笔画');
  // 标签：写在元素正下方，属于元素的一部分，跟着一起画
  const core = boxOf(el.strokes);
  let labelStrokes: Stroke[] = [];
  if (src.label) {
    const t = textStrokes(String(src.label), { size: src.labelSize ?? 46, color: st.color });
    translateStrokes(t.strokes, core.x + core.w / 2 - t.w / 2, core.y + core.h + 14);
    labelStrokes = t.strokes; el.text = (el.text ?? '') + String(src.label); el.missing = [...(el.missing ?? []), ...t.missing];
    el.strokes.push(...labelStrokes);
  }
  el.box = boxOf(el.strokes);

  if (!placed) {
    const keys = POS_KEYS.filter(k => k in src);
    if (keys.length !== 1) throw new SrcError(where, `需要且只能有一种定位方式：at / rightOf / leftOf / above / below（现在有 ${keys.length} 种）`);
    const b = el.box, gap = src.gap ?? 40;
    let tx = 0, ty = 0;
    if ('at' in src) {
      const r = parseRef(ctx, src.at, where);
      const an = src.anchor ?? 'center';
      const ax = /left/i.test(an) ? b.x : /right/i.test(an) ? b.x + b.w : b.x + b.w / 2;
      const ay = /top/i.test(an) ? b.y : /bottom/i.test(an) ? b.y + b.h : b.y + b.h / 2;
      tx = r.pt[0] - ax; ty = r.pt[1] - ay;
    } else {
      const key = keys[0], ref = ctx.els.get(String(src[key]));
      if (!ref) throw new SrcError(where, `${key} 引用了不存在（或定义在它后面）的元素 "${src[key]}"`);
      const rb = ref.box, al = src.align ?? 'center';
      const alignX = () => (al === 'start' ? rb.x - b.x : al === 'end' ? rb.x + rb.w - b.x - b.w : rb.x + rb.w / 2 - b.x - b.w / 2);
      const alignY = () => (al === 'start' ? rb.y - b.y : al === 'end' ? rb.y + rb.h - b.y - b.h : rb.y + rb.h / 2 - b.y - b.h / 2);
      if (key === 'rightOf') { tx = rb.x + rb.w + gap - b.x; ty = alignY(); }
      else if (key === 'leftOf') { tx = rb.x - gap - b.x - b.w; ty = alignY(); }
      else if (key === 'below') { ty = rb.y + rb.h + gap - b.y; tx = alignX(); }
      else { ty = rb.y - gap - b.y - b.h; tx = alignX(); }
    }
    tx += src.dx ?? 0; ty += src.dy ?? 0;
    translateStrokes(el.strokes, tx, ty);
    for (const k of Object.keys(el.anchors)) el.anchors[k] = [el.anchors[k][0] + tx, el.anchors[k][1] + ty];
    el.box = boxOf(el.strokes);
    if (el.figure) {
      el.figure.dx = tx; el.figure.dy = ty; el.figure.labelStrokes = labelStrokes;
      const fg = el.figure;
      el.rebuild = (pose, face) => { const r = figureStrokes({ ...fg.spec, pose, face }); translateStrokes(r.strokes, fg.dx, fg.dy); return [...r.strokes, ...fg.labelStrokes]; };
    }
  } else if (src.dx || src.dy) { translateStrokes(el.strokes, src.dx ?? 0, src.dy ?? 0); el.box = boxOf(el.strokes); }
  setAnchors(el);
  void B;
  return el;
}

function chartStrokes(src: any, st: Style, where: string): Stroke[] {
  const data: number[] = src.data;
  if (!Array.isArray(data) || data.length < 2 || data.some(v => typeof v !== 'number')) throw new SrcError(where, 'chart 需要 data: [数字, ...]（至少 2 个）');
  const W = src.w ?? 620, H = src.h ?? 380, n = data.length, out: Stroke[] = [];
  const max = Math.max(...data, 0), min = src.chart === 'line' ? Math.min(...data) - (Math.max(...data) - Math.min(...data)) * 0.25 : 0;
  const Y = (v: number) => H - ((v - min) / (max - min || 1)) * H * 0.86;
  const hl: Record<number, string> = typeof src.highlight === 'number' ? { [src.highlight]: 'red' } : src.highlight ?? {};
  // 坐标轴
  out.push(...R.line(0, -10, 0, H, st), ...R.line(0, H, W + 10, H, { ...st, seed: st.seed + 1 }));
  const tsize = Math.min(44, (W / n) * 0.42);
  const lab = (s: string, cx: number, y: number, c: string, size = tsize) => { const t = textStrokes(s, { size, color: c }); translateStrokes(t.strokes, cx - t.w / 2, y); out.push(...t.strokes); };
  if (src.chart === 'bar') {
    const slot = W / n, bw = slot * 0.56;
    data.forEach((v, i) => {
      const c = color(hl[i] ?? src.color ?? 'blue'), x = slot * i + (slot - bw) / 2;
      out.push(...R.rect(x, Y(v), bw, H - Y(v), { ...st, color: c, fill: c, seed: st.seed + 10 + i }));
      if (src.values) lab(String(v) + (src.unit ?? ''), x + bw / 2, Y(v) - tsize - 8, c);
      if (src.labels?.[i] != null) lab(String(src.labels[i]), x + bw / 2, H + 12, st.color, tsize * 0.9);
    });
  } else if (src.chart === 'line') {
    const X = (i: number) => (W * (i + 0.5)) / n, c = color(src.color ?? 'blue');
    out.push(...R.poly(data.map((v, i) => [X(i), Y(v)] as Pt), false, { ...st, color: c, w: st.w * 1.25, rough: 0.5, seed: st.seed + 9 }));
    data.forEach((v, i) => {
      const hc = hl[i] ? color(hl[i]) : null;
      if (hc) out.push(...R.ellipse(X(i), Y(v), 26, 26, { ...st, color: hc, fill: hc, fillStyle: 'solid', fillAlpha: 1, seed: st.seed + 20 + i }));
      if (src.values && (hc || i === 0 || i === n - 1)) lab(String(v) + (src.unit ?? ''), X(i), Y(v) - tsize - 16, hc ?? c);
      if (src.labels?.[i] != null) lab(String(src.labels[i]), X(i), H + 12, st.color, tsize * 0.9);
    });
  } else throw new SrcError(where, `没有图表类型 "${src.chart}"。可用：bar line`);
  return out;
}
