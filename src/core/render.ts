// 渲染器：画面是时间的纯函数。drawFrame(ctx, compiled, t) 能精确画出任意时刻的一帧。
import type { Compiled, TL, Cam, EraseGroup } from './compile';
import { type Stroke, type LineStroke, type Pt, cumLen, pointAt, widthProfile, rng } from './strokes';
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

function tracePartial(ctx: any, pts: number[], cum: number[], frac: number) {
  ctx.moveTo(pts[0], pts[1]);
  if (frac >= 1) { for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); return; }
  const target = frac * cum[cum.length - 1];
  let i = 1;
  for (; i < cum.length && cum[i] <= target; i++) ctx.lineTo(pts[2 * i], pts[2 * i + 1]);
  if (i < cum.length) { const k = (target - cum[i - 1]) / (cum[i] - cum[i - 1] || 1); ctx.lineTo(pts[2 * i - 2] + (pts[2 * i] - pts[2 * i - 2]) * k, pts[2 * i - 1] + (pts[2 * i + 1] - pts[2 * i - 1]) * k); }
}

/** 等宽描线（涂色笔道、板擦） */
function lineUniform(ctx: any, s: LineStroke, frac: number) {
  ctx.beginPath(); tracePartial(ctx, s.pts, cumLen(s), frac);
  ctx.strokeStyle = s.color; ctx.lineWidth = s.w; ctx.stroke();
}

/** 墨线：一小段一小段画，每段粗细不同——落笔重、行笔有起伏、收笔出锋 */
function lineBrush(ctx: any, s: LineStroke, frac: number) {
  const pts = s.pts, cum = cumLen(s), wm = widthProfile(s), n = cum.length;
  const target = frac >= 1 ? Infinity : frac * cum[n - 1];
  ctx.strokeStyle = s.color;
  for (let i = 1; i < n; i++) {
    let x1 = pts[2 * i], y1 = pts[2 * i + 1], w = (wm[i - 1] + wm[i]) / 2, last = false;
    if (cum[i] > target) {
      const k = (target - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      if (k <= 0) break;
      x1 = pts[2 * i - 2] + (x1 - pts[2 * i - 2]) * k; y1 = pts[2 * i - 1] + (y1 - pts[2 * i - 1]) * k; w = wm[i - 1]; last = true;
    }
    ctx.beginPath(); ctx.moveTo(pts[2 * i - 2], pts[2 * i - 1]); ctx.lineTo(x1, y1); ctx.lineWidth = s.w * w; ctx.stroke();
    if (last) break;
  }
}

export function drawStroke(ctx: any, env: Env, s: Stroke, frac: number, alpha: number) {
  if (frac <= 0) return;
  if (s.kind === 'line') {
    ctx.globalAlpha = alpha * (s.alpha ?? 1);
    if (s.flat) { ctx.globalCompositeOperation = 'multiply'; lineUniform(ctx, s, frac); ctx.globalCompositeOperation = 'source-over'; }
    else if ((s.alpha ?? 1) < 1 || s.pts.length <= 4 && s.len < 3) lineUniform(ctx, s, frac);
    else lineBrush(ctx, s, frac);
  } else if (s.kind === 'fill') {
    // 涂色：沿斜向一路涂过去，而不是整块淡入
    ctx.save(); ctx.globalAlpha = alpha * s.alpha; ctx.globalCompositeOperation = 'multiply';
    if (frac < 1) {
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < s.pts.length; i += 2) { const v = s.pts[i] * 0.83 + s.pts[i + 1] * 0.55; if (v < lo) lo = v; if (v > hi) hi = v; }
      const edge = lo + (hi - lo) * frac, R = 1e5;
      ctx.beginPath(); // 半平面 {0.83x + 0.55y <= edge}
      ctx.moveTo(edge * 0.83 - 0.55 * R, edge * 0.55 + 0.83 * R); ctx.lineTo(edge * 0.83 + 0.55 * R, edge * 0.55 - 0.83 * R);
      ctx.lineTo(edge * 0.83 + 0.55 * R - 0.83 * R, edge * 0.55 - 0.83 * R - 0.55 * R); ctx.lineTo(edge * 0.83 - 0.55 * R - 0.83 * R, edge * 0.55 + 0.83 * R - 0.55 * R);
      ctx.closePath(); ctx.clip();
    }
    ctx.fillStyle = s.color; ctx.beginPath(); ctx.moveTo(s.pts[0], s.pts[1]);
    for (let i = 2; i < s.pts.length; i += 2) ctx.lineTo(s.pts[i], s.pts[i + 1]);
    ctx.closePath(); ctx.fill(); ctx.restore();
  } else {
    ctx.globalAlpha = alpha; ctx.save();
    if (frac < 1) {
      ctx.beginPath();
      if (s.kind === 'wipe') ctx.rect(s.box.x - 6, s.box.y - 30, (s.box.w + 12) * frac, s.box.h + 60);
      else {
        // 沿笔顺中线撒一串圆，圆的并集就是“笔已经走过的地方”
        s.mcum ??= s.medians.map(m => cumLen({ pts: m }));
        const total = s.mcum.reduce((n, c) => n + c[c.length - 1], 0);
        let left = frac * total;
        const step = s.r * 0.55;
        for (let mi = 0; mi < s.medians.length && left > 0; mi++) {
          const m = s.medians[mi], c = s.mcum[mi], L = c[c.length - 1], upto = Math.min(L, left);
          for (let d = 0; ; d += step) { const dd = Math.min(d, upto), q = pointAt(m, c, L ? dd / L : 0); ctx.moveTo(q[0] + s.r, q[1]); ctx.arc(q[0], q[1], s.r, 0, 6.2832); if (d >= upto) break; }
          left -= L;
        }
      }
      ctx.clip();
    }
    ctx.translate(s.tx, s.ty); ctx.scale(s.s, s.s);
    ctx.fillStyle = s.color; ctx.fill(P(env, s.d));
    ctx.restore();
  }
}

/** 把一组笔画完整画出来（素材一览、字幕等静态用途） */
export function drawStrokes(ctx: any, env: Env, strokes: Stroke[], alpha = 1) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const under of [true, false]) for (const s of strokes) if (!!(s as any).under === under) drawStroke(ctx, env, s, 1, alpha);
  ctx.globalAlpha = 1;
}

// ── 纸面 ──
const papers = new Map<string, any>();
function paperTexture(env: Env, W: number, H: number): any {
  const key = `${W}x${H}`;
  let cv = papers.get(key);
  if (cv) return cv;
  cv = env.createCanvas(W, H);
  const x = cv.getContext('2d'), r = rng(7);
  x.fillStyle = THEME.paper; x.fillRect(0, 0, W, H);
  // 大块的明暗不匀
  const sw = Math.ceil(W / 150), sh = Math.ceil(H / 150), small = env.createCanvas(sw, sh), sx = small.getContext('2d'), sd = sx.createImageData(sw, sh);
  for (let i = 0; i < sw * sh; i++) { const v = r(); sd.data[4 * i] = 120; sd.data[4 * i + 1] = 95; sd.data[4 * i + 2] = 60; sd.data[4 * i + 3] = v * v * 11; }
  sx.putImageData(sd, 0, 0);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(small, 0, 0, W, H);
  // 细颗粒
  const id = x.getImageData(0, 0, W, H), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() + r() - 1) * 6; d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9; }
  x.putImageData(id, 0, 0);
  // 纸纤维
  x.lineCap = 'round';
  for (let i = 0; i < 900; i++) {
    const px = r() * W, py = r() * H, a = r() * 6.28, l = 6 + r() * 22;
    x.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(90,70,40,0.05)'; x.lineWidth = 0.6 + r() * 0.8;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * 0.5 + (r() - 0.5) * 6, py + Math.sin(a) * l * 0.5 + (r() - 0.5) * 6, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  papers.set(key, cv);
  return cv;
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
  for (const a of tl.scale) if (t >= a.t0) st.scale = (st.scale / (tl.scale[tl.scale.indexOf(a) - 1]?.to ?? 1)) * (a.from + (a.to - a.from) * ease(span(t, a.t0, a.t1)));
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
      if (s.kind === 'fill') return null;
      return [s.box.x + s.box.w * f, s.box.y + s.box.h * 0.6];
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
  const cam = camAt(c, t);
  const world = (x: any) => { x.setTransform(k, 0, 0, k, 0, 0); x.translate(W / 2, H / 2); x.scale(cam.zoom, cam.zoom); x.translate(-cam.cx, -cam.cy); };
  const vx0 = cam.cx - W / 2 / cam.zoom, vx1 = cam.cx + W / 2 / cam.zoom, vy0 = cam.cy - H / 2 / cam.zoom, vy1 = cam.cy + H / 2 / cam.zoom;
  // 纸面铺在世界坐标里：镜头移动时纸纹跟着画一起走
  const tex = paperTexture(env, W, H);
  world(ctx);
  for (let i = Math.floor(vx0 / W); i * W < vx1; i++) for (let j = Math.floor(vy0 / H); j * H < vy1; j++) ctx.drawImage(tex, i * W - 0.5, j * H - 0.5, W + 1, H + 1);
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
      lineUniform(lx, { kind: 'line', pts: g.path, w: g.width, color: '#000', len: 0 }, Math.min(1, ease(kk) * 1.02));
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
  // 四角略暗，像拍下来的纸面
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.hypot(W, H) * 0.62);
  vg.addColorStop(0, 'rgba(60,45,25,0)'); vg.addColorStop(1, 'rgba(60,45,25,0.13)');
  ctx.globalAlpha = 1; ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (o.subtitles !== false) {
    const line = c.subs.find(s => t >= s.start && t < s.end);
    if (line) {
      let sub = subCache.get(line.text);
      if (!sub) { const r = textStrokes(line.text, { size: c.fmt.subSize, color: THEME.ink }); sub = { strokes: r.strokes, w: r.w }; subCache.set(line.text, sub); }
      ctx.save(); ctx.translate(W / 2 - sub.w / 2, c.fmt.subY - c.fmt.subSize / 2);
      ctx.lineJoin = 'round'; ctx.strokeStyle = THEME.paper;
      for (const s of sub.strokes) { // 先垫一圈纸色描边，保证压在画上也读得清
        if (s.kind !== 'fglyph' && s.kind !== 'wipe') continue;
        ctx.save(); ctx.translate(s.tx, s.ty); ctx.scale(s.s, s.s); ctx.lineWidth = 16 / s.s; ctx.stroke(P(env, s.d)); ctx.restore();
      }
      for (const s of sub.strokes) drawStroke(ctx, env, s, 1, 1);
      ctx.restore(); ctx.globalAlpha = 1;
    }
  }
}
