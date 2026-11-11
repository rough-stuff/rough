// 渲染器：画面是时间的纯函数。drawFrame(ctx, compiled, t) 能精确画出任意时刻的一帧。
import type { Compiled, TL, Cam, EraseGroup } from './compile';
import { type Stroke, type LineStroke, type GlyphStroke, type Pt, cumLen, pointAt } from './strokes';
import { lerpPose } from './figure';
import { textStrokes } from './text';
import { THEME } from './theme';

export interface Env { createCanvas(w: number, h: number): any; Path2D: any }
export interface FrameOpts { scale?: number; subtitles?: boolean; pen?: boolean; guides?: boolean }

const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const clamp01 = (k: number) => (k < 0 ? 0 : k > 1 ? 1 : k);
const span = (t: number, t0: number, t1: number) => (t1 <= t0 ? (t >= t1 ? 1 : 0) : clamp01((t - t0) / (t1 - t0)));
const outBack = (k: number) => 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);

export function camAt(c: Compiled, t: number): Cam {
  let s: Cam = c.cams[0]?.to ?? { cx: c.fmt.W / 2, cy: c.fmt.H / 2, zoom: 1 };
  for (const seg of c.cams) {
    if (t >= seg.t1) { s = seg.to; continue; }
    if (t <= seg.t0 || seg.cut) break;
    const k = ease(span(t, seg.t0, seg.t1));
    // 缩放按对数插值，推拉更自然
    const z = Math.exp(Math.log(s.zoom) + (Math.log(seg.to.zoom) - Math.log(s.zoom)) * k);
    return { cx: s.cx + (seg.to.cx - s.cx) * k, cy: s.cy + (seg.to.cy - s.cy) * k, zoom: z };
  }
  return s;
}

const paths = new Map<string, any>();
const P = (env: Env, d: string) => { let p = paths.get(d); if (!p) { p = new env.Path2D(d); paths.set(d, p); } return p; };

function linePartial(ctx: any, s: LineStroke, frac: number) {
  const pts = s.pts;
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  if (frac >= 1) { for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); }
  else {
    const cum = cumLen(s), target = frac * cum[cum.length - 1];
    let i = 1;
    for (; i < cum.length && cum[i] <= target; i++) ctx.lineTo(pts[2 * i], pts[2 * i + 1]);
    if (i < cum.length) { const k = (target - cum[i - 1]) / (cum[i] - cum[i - 1] || 1); ctx.lineTo(pts[2 * i - 2] + (pts[2 * i] - pts[2 * i - 2]) * k, pts[2 * i - 1] + (pts[2 * i + 1] - pts[2 * i - 1]) * k); }
  }
  ctx.strokeStyle = s.color; ctx.lineWidth = s.w; ctx.stroke();
}

function drawStroke(ctx: any, env: Env, s: Stroke, frac: number, alpha: number) {
  if (frac <= 0) return;
  if (s.kind === 'line') { ctx.globalAlpha = alpha * (s.alpha ?? 1); linePartial(ctx, s, frac); }
  else if (s.kind === 'fill') {
    ctx.globalAlpha = alpha * s.alpha * frac; ctx.fillStyle = s.color; ctx.beginPath(); ctx.moveTo(s.pts[0], s.pts[1]);
    for (let i = 2; i < s.pts.length; i += 2) ctx.lineTo(s.pts[i], s.pts[i + 1]);
    ctx.closePath(); ctx.fill();
  } else if (s.kind === 'glyph') {
    ctx.globalAlpha = alpha; ctx.save(); ctx.transform(...s.m);
    const p = P(env, s.d);
    if (frac >= 1) { ctx.fillStyle = s.color; ctx.fill(p); if (s.bold > 0) { ctx.strokeStyle = s.color; ctx.lineWidth = s.bold / s.m[0]; ctx.stroke(p); } }
    else {
      ctx.clip(p);
      const cum = cumLen(s), target = frac * cum[cum.length - 1], m = s.median;
      ctx.beginPath(); ctx.moveTo(m[0], m[1]);
      let i = 1;
      for (; i < cum.length && cum[i] <= target; i++) ctx.lineTo(m[2 * i], m[2 * i + 1]);
      if (i < cum.length) { const k = (target - cum[i - 1]) / (cum[i] - cum[i - 1] || 1); ctx.lineTo(m[2 * i - 2] + (m[2 * i] - m[2 * i - 2]) * k, m[2 * i - 1] + (m[2 * i + 1] - m[2 * i - 1]) * k); }
      ctx.strokeStyle = s.color; ctx.lineWidth = s.mw; ctx.stroke();
    }
    ctx.restore();
  } else {
    ctx.globalAlpha = alpha; ctx.save();
    if (frac < 1) { ctx.beginPath(); ctx.rect(s.box.x - 4, s.box.y - 20, (s.box.w + 8) * frac, s.box.h + 40); ctx.clip(); }
    ctx.translate(s.tx, s.ty); const p = P(env, s.d);
    ctx.fillStyle = s.color; ctx.fill(p); if (s.bold > 0) { ctx.strokeStyle = s.color; ctx.lineWidth = s.bold; ctx.stroke(p); }
    ctx.restore();
  }
}

interface ElState { visible: boolean; dx: number; dy: number; scale: number; alpha: number; strokes: Stroke[]; drawing: boolean }
const poseCache = new WeakMap<object, Map<string, Stroke[]>>();

export function stateAt(tl: TL, t: number): ElState {
  const el = tl.el;
  const st: ElState = { visible: false, dx: 0, dy: 0, scale: 1, alpha: 1, strokes: el.strokes, drawing: false };
  const born = tl.drawT0 ?? tl.appear?.t;
  if (born == null || t < born || (tl.gone != null && t >= tl.gone)) return st;
  st.visible = true;
  st.drawing = tl.drawT1 != null && t < tl.drawT1;
  if (tl.appear) { const k = span(t, tl.appear.t, tl.appear.t + tl.appear.dur); if (tl.appear.kind === 'pop') st.scale *= Math.max(0.01, outBack(k)); else st.alpha *= k; }
  for (const m of tl.moves) {
    if (t < m.t0) break;
    const k = ease(span(t, m.t0, m.t1));
    if (m.path && m.base) {
      // 先滑到轨迹起点，再沿轨迹走
      const cum = cumLen({ pts: m.path }), p = pointAt(m.path, cum, k);
      const lead = Math.min(1, k * 6);
      const sx = m.from[0] + (m.path[0] - m.base[0] - m.from[0]) * lead, sy = m.from[1] + (m.path[1] - m.base[1] - m.from[1]) * lead;
      st.dx = k < 1 / 6 ? sx : p[0] - m.base[0]; st.dy = k < 1 / 6 ? sy : p[1] - m.base[1];
    } else { st.dx = m.from[0] + (m.to[0] - m.from[0]) * k; st.dy = m.from[1] + (m.to[1] - m.from[1]) * k; }
  }
  for (const a of tl.alpha) if (t >= a.t0) st.alpha *= a.from + (a.to - a.from) * span(t, a.t0, a.t1);
  for (const s of tl.shakes) {
    if (t < s.t0 || t > s.t1) continue;
    const k = span(t, s.t0, s.t1);
    if (s.kind === 'shake') st.dx += 14 * Math.sin(k * Math.PI * 7) * (1 - k);
    else if (s.kind === 'nod') st.dy += 12 * Math.abs(Math.sin(k * Math.PI * 3)) * (1 - k);
    else st.scale *= 1 + 0.2 * Math.sin(k * Math.PI);
  }
  if (tl.poses.length && el.rebuild) {
    let pose = tl.poses[0].from, face = tl.poses[0].faceFrom, key = '';
    for (const p of tl.poses) {
      if (t < p.t0) break;
      const k = ease(span(t, p.t0, p.t1));
      pose = k >= 1 ? p.to : lerpPose(p.from, p.to, k); face = k >= 0.5 ? p.faceTo : p.faceFrom;
      key = k >= 1 ? `${tl.poses.indexOf(p)}` : '';
    }
    if (t >= tl.poses[0].t0) {
      let cache = poseCache.get(tl); if (!cache) poseCache.set(tl, (cache = new Map()));
      st.strokes = (key && cache.get(key)) || el.rebuild(pose, face);
      if (key) cache.set(key, st.strokes);
    }
  }
  return st;
}

function strokeFrac(tl: TL, i: number, t: number): number {
  if (!tl.sched || t >= tl.drawT1!) return 1;
  const a = tl.sched[2 * i], b = tl.sched[2 * i + 1];
  if (t <= a) return 0;
  if (t >= b) return 1;
  const k = (t - a) / (b - a);
  return k * 0.55 + (k * k * (3 - 2 * k)) * 0.45; // 起笔、收笔略慢
}

function drawEl(ctx: any, env: Env, tl: TL, t: number, st: ElState) {
  ctx.save();
  ctx.translate(st.dx, st.dy);
  if (st.scale !== 1) { const c = tl.el.anchors.center; ctx.translate(c[0], c[1]); ctx.scale(st.scale, st.scale); ctx.translate(-c[0], -c[1]); }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const ss = st.strokes, same = ss === tl.el.strokes;
  for (const under of [true, false]) for (let i = 0; i < ss.length; i++) {
    const s = ss[i];
    if (!!(s as any).under !== under) continue;
    drawStroke(ctx, env, s, same ? strokeFrac(tl, i, t) : 1, st.alpha);
  }
  ctx.restore();
}

/** 当前笔尖位置（场景坐标），没在画则为 null */
export function penAt(tl: TL, t: number): Pt | null {
  if (!tl.sched || t < tl.drawT0! || t >= tl.drawT1!) return null;
  for (let i = 0; i < tl.el.strokes.length; i++) {
    if (t >= tl.sched[2 * i] && t < tl.sched[2 * i + 1]) {
      const s = tl.el.strokes[i], f = strokeFrac(tl, i, t);
      if (s.kind === 'line') return pointAt(s.pts, cumLen(s), f);
      if (s.kind === 'glyph') { const p = pointAt(s.median, cumLen(s), f); return [s.m[0] * p[0] + s.m[4], s.m[3] * p[1] + s.m[5]]; }
      if (s.kind === 'wipe') return [s.box.x + s.box.w * f, s.box.y + s.box.h * 0.6];
    }
  }
  return null;
}

const subCache = new Map<string, { strokes: Stroke[]; w: number }>();
let layer: any = null;

export function drawFrame(ctx: any, c: Compiled, t: number, env: Env, o: FrameOpts = {}) {
  const k = o.scale ?? 1, { W, H, board } = c.fmt;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = THEME.paper; ctx.fillRect(0, 0, W, H);
  const cam = camAt(c, t);
  const world = (x: any) => { x.setTransform(k, 0, 0, k, 0, 0); x.translate(W / 2, H / 2); x.scale(cam.zoom, cam.zoom); x.translate(-cam.cx, -cam.cy); };
  const vx0 = cam.cx - W / 2 / cam.zoom, vx1 = cam.cx + W / 2 / cam.zoom;
  let pen: { p: Pt; scene: number } | null = null;
  const groups = new Map<number, { tl: TL; st: ElState }[]>();
  let curScene = -1;
  for (const tl of c.tls) {
    const sc = c.scenes[tl.scene];
    if (sc.origin[0] > vx1 || sc.origin[0] + W < vx0) continue;
    const st = stateAt(tl, t);
    if (!st.visible) continue;
    if (tl.erase != null) { const g = c.erases[tl.erase]; if (t >= g.t0) { if (!groups.has(tl.erase)) groups.set(tl.erase, []); groups.get(tl.erase)!.push({ tl, st }); continue; } }
    if (tl.scene !== curScene) { world(ctx); ctx.translate(sc.origin[0] + board.x, sc.origin[1] + board.y); curScene = tl.scene; }
    drawEl(ctx, env, tl, t, st);
    if (st.drawing) { const p = penAt(tl, t); if (p) pen = { p: [p[0] + st.dx, p[1] + st.dy], scene: tl.scene }; }
  }
  // 正在被擦的元素：画到单独一层，用板擦路径抠掉
  for (const [gi, items] of groups) {
    const g: EraseGroup = c.erases[gi], sc = c.scenes[g.scene], kk = span(t, g.t0, g.t1);
    const cw = Math.round(W * k), ch = Math.round(H * k);
    if (!layer || layer.width !== cw || layer.height !== ch) layer = env.createCanvas(cw, ch);
    const lx = layer.getContext('2d');
    lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalCompositeOperation = 'source-over'; lx.globalAlpha = 1; lx.clearRect(0, 0, cw, ch);
    world(lx); lx.translate(sc.origin[0] + board.x, sc.origin[1] + board.y);
    for (const it of items) drawEl(lx, env, it.tl, t, it.st);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (g.style === 'wipe') {
      lx.globalCompositeOperation = 'destination-out'; lx.globalAlpha = 1; lx.lineCap = 'round'; lx.lineJoin = 'round';
      linePartial(lx, { kind: 'line', pts: g.path, w: g.width, color: '#000', len: 0 }, ease(kk) * 1.02);
      ctx.globalAlpha = 1;
    } else ctx.globalAlpha = 1 - kk;
    ctx.drawImage(layer, 0, 0);
    ctx.globalAlpha = 1;
  }
  // 笔尖（可选，极小）
  if (o.pen && pen) {
    const sc = c.scenes[pen.scene];
    world(ctx); ctx.translate(sc.origin[0] + board.x, sc.origin[1] + board.y);
    ctx.globalAlpha = 0.9; ctx.lineCap = 'round'; ctx.strokeStyle = THEME.ink; ctx.lineWidth = 9 / cam.zoom;
    ctx.beginPath(); ctx.moveTo(pen.p[0] + 5 / cam.zoom, pen.p[1] - 5 / cam.zoom); ctx.lineTo(pen.p[0] + 44 / cam.zoom, pen.p[1] - 44 / cam.zoom); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.setTransform(k, 0, 0, k, 0, 0);
  if (o.guides) {
    ctx.strokeStyle = '#4dabf7'; ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.strokeRect(board.x, board.y, board.w, board.h); ctx.setLineDash([]);
  }
  if (o.subtitles !== false) {
    const line = c.subs.find(s => t >= s.start && t < s.end);
    if (line) {
      let sub = subCache.get(line.text);
      if (!sub) { const r = textStrokes(line.text, { size: c.fmt.subSize, color: THEME.ink, bold: c.fmt.subSize * 0.03 }); sub = { strokes: r.strokes, w: r.w }; subCache.set(line.text, sub); }
      ctx.save(); ctx.translate(W / 2 - sub.w / 2, c.fmt.subY - c.fmt.subSize / 2);
      ctx.lineJoin = 'round';
      for (const s of sub.strokes) { // 先垫一圈纸色描边，保证压在画上也读得清
        if (s.kind === 'glyph') { ctx.save(); ctx.transform(...s.m); ctx.strokeStyle = THEME.paper; ctx.lineWidth = 14 / s.m[0]; ctx.stroke(P(env, s.d)); ctx.restore(); }
        else if (s.kind === 'wipe') { ctx.save(); ctx.translate(s.tx, s.ty); ctx.strokeStyle = THEME.paper; ctx.lineWidth = 14; ctx.stroke(P(env, s.d)); ctx.restore(); }
      }
      for (const s of sub.strokes) drawStroke(ctx, env, s, 1, 1);
      ctx.restore(); ctx.globalAlpha = 1;
    }
  }
}
