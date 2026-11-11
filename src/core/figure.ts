// 火柴人：可摆姿势、可换表情、可加配饰的参数化小人。它是“讲的人”的替身。
import { R, type Stroke, type Style, type Pt } from './strokes';

export interface Pose {
  /** [上臂角, 肘部再弯多少]。0=垂下，90=向外平举，180=举过头。左右对称定义 */
  armL: [number, number]; armR: [number, number];
  /** [大腿角, 膝盖再弯多少]。0=直立，正数向外 */
  legL: [number, number]; legR: [number, number];
  /** 身体倾斜（正数向右）、头部歪斜 */
  lean: number; head: number;
}

export const POSES: Record<string, Pose> = {
  stand:        { armL: [12, 6], armR: [12, 6], legL: [7, 0], legR: [7, 0], lean: 0, head: 0 },
  wave:         { armL: [12, 6], armR: [105, 70], legL: [7, 0], legR: [7, 0], lean: 0, head: 4 },
  'point-right':{ armL: [14, 8], armR: [88, 0], legL: [7, 0], legR: [9, 0], lean: 3, head: 0 },
  'point-left': { armL: [88, 0], armR: [14, 8], legL: [9, 0], legR: [7, 0], lean: -3, head: 0 },
  'point-up':   { armL: [14, 8], armR: [122, 50], legL: [7, 0], legR: [7, 0], lean: 0, head: 0 },
  'point-up-right': { armL: [14, 8], armR: [128, 0], legL: [7, 0], legR: [8, 0], lean: 2, head: 0 },
  'point-up-left':  { armL: [128, 0], armR: [14, 8], legL: [8, 0], legR: [7, 0], lean: -2, head: 0 },
  'point-down-right': { armL: [14, 8], armR: [50, 0], legL: [7, 0], legR: [7, 0], lean: 2, head: 6 },
  shrug:        { armL: [55, 75], armR: [55, 75], legL: [9, 0], legR: [9, 0], lean: 0, head: 8 },
  cheer:        { armL: [122, 35], armR: [122, 35], legL: [14, 0], legR: [14, 0], lean: 0, head: 0 },
  think:        { armL: [48, -100], armR: [60, 156], legL: [7, 0], legR: [7, 0], lean: -2, head: -8 },
  hips:         { armL: [48, -100], armR: [48, -100], legL: [12, 0], legR: [12, 0], lean: 0, head: 0 },
  'give-right': { armL: [12, 6], armR: [70, 20], legL: [7, 0], legR: [9, 0], lean: 4, head: 0 },
  'give-left':  { armL: [70, 20], armR: [12, 6], legL: [9, 0], legR: [7, 0], lean: -4, head: 0 },
  hold:         { armL: [55, -130], armR: [55, -130], legL: [8, 0], legR: [8, 0], lean: 0, head: 5 },
  facepalm:     { armL: [14, 8], armR: [110, 108], legL: [7, 0], legR: [7, 0], lean: 0, head: 14 },
  slump:        { armL: [4, 2], armR: [4, 2], legL: [5, 0], legR: [5, 0], lean: 0, head: 16 },
  'walk-right': { armL: [30, 10], armR: [38, -45], legL: [26, 0], legR: [22, 0], lean: 6, head: 0 },
  'walk-left':  { armL: [38, -45], armR: [30, 10], legL: [22, 0], legR: [26, 0], lean: -6, head: 0 },
  'run-right':  { armL: [62, -85], armR: [72, 62], legL: [42, 0], legR: [52, -72], lean: 12, head: 0 },
  stop:         { armL: [80, 75], armR: [80, 75], legL: [10, 0], legR: [10, 0], lean: 0, head: 0 },
};

type Eyes = 'dot' | 'wide' | 'closed' | 'arc' | 'x' | 'dollar';
type Brows = 'none' | 'angry' | 'sad' | 'raised' | 'skeptic';
type Mouth = 'smile' | 'flat' | 'frown' | 'o' | 'grin' | 'wavy' | 'smirk';
export const FACES: Record<string, { eyes: Eyes; brows: Brows; mouth: Mouth }> = {
  neutral:   { eyes: 'dot', brows: 'none', mouth: 'flat' },
  happy:     { eyes: 'dot', brows: 'none', mouth: 'smile' },
  joy:       { eyes: 'arc', brows: 'none', mouth: 'grin' },
  sad:       { eyes: 'dot', brows: 'sad', mouth: 'frown' },
  angry:     { eyes: 'dot', brows: 'angry', mouth: 'frown' },
  surprised: { eyes: 'wide', brows: 'raised', mouth: 'o' },
  thinking:  { eyes: 'dot', brows: 'skeptic', mouth: 'smirk' },
  dizzy:     { eyes: 'x', brows: 'none', mouth: 'wavy' },
  greedy:    { eyes: 'dollar', brows: 'none', mouth: 'grin' },
  smug:      { eyes: 'closed', brows: 'none', mouth: 'smirk' },
  worried:   { eyes: 'dot', brows: 'sad', mouth: 'wavy' },
  none:      { eyes: 'dot', brows: 'none', mouth: 'flat' },
};
export const ACCESSORIES = ['tophat', 'hardhat', 'cap', 'crown', 'glasses', 'tie', 'longhair', 'beard', 'briefcase', 'gradcap'] as const;

export const lerpPose = (a: Pose, b: Pose, k: number): Pose => {
  const l = (x: number, y: number) => x + (y - x) * k;
  const l2 = (x: [number, number], y: [number, number]): [number, number] => [l(x[0], y[0]), l(x[1], y[1])];
  return { armL: l2(a.armL, b.armL), armR: l2(a.armR, b.armR), legL: l2(a.legL, b.legL), legR: l2(a.legR, b.legR), lean: l(a.lean, b.lean), head: l(a.head, b.head) };
};

export interface FigureSpec { size: number; color: string; pose: Pose; face: string; accessories?: string[]; accent?: string; seed: number; faceless?: boolean }

const rad = (d: number) => (d * Math.PI) / 180;

export function figureStrokes(f: FigureSpec): { strokes: Stroke[]; anchors: Record<string, Pt> } {
  const H = f.size, p = f.pose;
  const w = Math.min(11, Math.max(6, H * 0.02));
  let n = 0;
  const st = (extra: Partial<Style> = {}): Style => ({ color: f.color, w, rough: 0.7, seed: f.seed + n++, bow: 0.6, ...extra });
  const rot = (x: number, y: number, deg: number, ox = 0, oy = 0): Pt => { const a = rad(deg), c = Math.cos(a), s = Math.sin(a); return [ox + (x - ox) * c - (y - oy) * s, oy + (x - ox) * s + (y - oy) * c]; };
  const dir = (side: 1 | -1, deg: number): Pt => [side * Math.sin(rad(deg)), Math.cos(rad(deg))];

  const hip: Pt = [0, 0];
  const shoulder = rot(0, -0.27 * H, p.lean);
  const neck = rot(0, -0.30 * H, p.lean);
  const hr = 0.15 * H;
  const headC = rot(neck[0], neck[1] - hr * 1.02, p.head * 0.5, neck[0], neck[1]);
  const out: Stroke[] = [];

  // 头、躯干
  out.push(...R.ellipse(headC[0], headC[1], hr * 2, hr * 2.05, st({ rough: 0.9 })));
  out.push(...R.line(neck[0], neck[1], hip[0], hip[1], st()));
  // 腿
  const limb = (o: Pt, side: 1 | -1, a: [number, number], l1: number, l2: number): Pt[] => {
    const d1 = dir(side, a[0]), d2 = dir(side, a[0] + a[1]);
    const j: Pt = [o[0] + d1[0] * l1, o[1] + d1[1] * l1];
    return [o, j, [j[0] + d2[0] * l2, j[1] + d2[1] * l2]];
  };
  const draw = (pts: Pt[]) => {
    const bent = Math.abs((pts[1][0] - pts[0][0]) * (pts[2][1] - pts[0][1]) - (pts[1][1] - pts[0][1]) * (pts[2][0] - pts[0][0])) > H * H * 0.0012;
    out.push(...(bent ? R.poly(pts, false, st({ rough: 0.5 })) : R.line(pts[0][0], pts[0][1], pts[2][0], pts[2][1], st())));
  };
  const legL = limb(hip, -1, p.legL, 0.2 * H, 0.2 * H), legR = limb(hip, 1, p.legR, 0.2 * H, 0.2 * H);
  draw(legL); draw(legR);
  // 脚：一小横
  for (const [leg, side] of [[legL, -1], [legR, 1]] as const) out.push(...R.line(leg[2][0], leg[2][1], leg[2][0] + side * 0.045 * H, leg[2][1], st({ rough: 0.3 })));
  const armL = limb(shoulder, -1, p.armL, 0.155 * H, 0.155 * H), armR = limb(shoulder, 1, p.armR, 0.155 * H, 0.155 * H);
  draw(armL); draw(armR);

  // 脸
  const face = FACES[f.face] ?? FACES.neutral;
  const fx = (x: number, y: number): Pt => rot(headC[0] + x * hr, headC[1] + y * hr, p.head, headC[0], headC[1]);
  const fw = Math.max(3, w * 0.8);
  const seg = (a: Pt, b: Pt, e: Partial<Style> = {}) => out.push(...R.line(a[0], a[1], b[0], b[1], st({ w: fw, rough: 0.25, ...e })));
  const cur = (pts: Pt[], e: Partial<Style> = {}) => out.push(...R.curve(pts, st({ w: fw, rough: 0.25, ...e })));
  if (!f.faceless) {
    for (const sx of [-1, 1] as const) {
      const ex = sx * 0.36, ey = -0.12;
      if (face.eyes === 'dot') seg(fx(ex, ey - 0.03), fx(ex, ey + 0.05), { w: fw * 1.7 });
      else if (face.eyes === 'wide') out.push(...R.ellipse(...fx(ex, ey), hr * 0.3, hr * 0.36, st({ w: fw, rough: 0.3 })));
      else if (face.eyes === 'closed') seg(fx(ex - 0.14, ey), fx(ex + 0.14, ey));
      else if (face.eyes === 'arc') cur([fx(ex - 0.15, ey + 0.05), fx(ex, ey - 0.1), fx(ex + 0.15, ey + 0.05)]);
      else if (face.eyes === 'x') { seg(fx(ex - 0.12, ey - 0.12), fx(ex + 0.12, ey + 0.12)); seg(fx(ex + 0.12, ey - 0.12), fx(ex - 0.12, ey + 0.12)); }
      else if (face.eyes === 'dollar') {
        cur([fx(ex + 0.12, ey - 0.12), fx(ex - 0.1, ey - 0.1), fx(ex, ey), fx(ex + 0.1, ey + 0.1), fx(ex - 0.12, ey + 0.13)], { color: f.accent ?? '#3c8f4f' });
        seg(fx(ex, ey - 0.22), fx(ex, ey + 0.22), { color: f.accent ?? '#3c8f4f' });
      }
      const by = ey - 0.32;
      if (face.brows === 'angry') seg(fx(ex + sx * 0.18, by - 0.1), fx(ex - sx * 0.16, by + 0.08));
      else if (face.brows === 'sad') seg(fx(ex + sx * 0.16, by + 0.08), fx(ex - sx * 0.16, by - 0.08));
      else if (face.brows === 'raised') cur([fx(ex - 0.16, by - 0.04), fx(ex, by - 0.14), fx(ex + 0.16, by - 0.04)]);
      else if (face.brows === 'skeptic') sx === 1 ? cur([fx(ex - 0.16, by - 0.1), fx(ex, by - 0.2), fx(ex + 0.16, by - 0.1)]) : seg(fx(ex - 0.16, by + 0.04), fx(ex + 0.16, by + 0.04));
    }
    const my = 0.42;
    if (face.mouth === 'smile') cur([fx(-0.3, my - 0.08), fx(0, my + 0.1), fx(0.3, my - 0.08)]);
    else if (face.mouth === 'flat') seg(fx(-0.22, my), fx(0.22, my));
    else if (face.mouth === 'frown') cur([fx(-0.28, my + 0.1), fx(0, my - 0.06), fx(0.28, my + 0.1)]);
    else if (face.mouth === 'o') out.push(...R.ellipse(...fx(0, my + 0.02), hr * 0.3, hr * 0.38, st({ w: fw, rough: 0.3 })));
    else if (face.mouth === 'grin') { seg(fx(-0.34, my - 0.1), fx(0.34, my - 0.1)); cur([fx(-0.34, my - 0.1), fx(-0.2, my + 0.18), fx(0.2, my + 0.18), fx(0.34, my - 0.1)]); }
    else if (face.mouth === 'wavy') cur([fx(-0.3, my), fx(-0.15, my - 0.08), fx(0, my + 0.04), fx(0.15, my - 0.08), fx(0.3, my)]);
    else if (face.mouth === 'smirk') cur([fx(-0.22, my + 0.02), fx(0.05, my + 0.04), fx(0.3, my - 0.1)]);
  }

  // 配饰
  const acc = f.accent ?? f.color;
  const hx = (x: number, y: number): Pt => fx(x, y);
  for (const a of f.accessories ?? []) {
    if (a === 'tophat') { out.push(...R.line(...hx(-1.25, -0.82), ...hx(1.25, -0.82), st())); out.push(...R.poly([hx(-0.78, -0.84), hx(-0.72, -1.95), hx(0.72, -1.95), hx(0.78, -0.84)], false, st({ fill: f.color, fillGap: 14 }))); }
    else if (a === 'hardhat') { out.push(...R.curve([hx(-1.05, -0.62), hx(-0.8, -1.3), hx(0, -1.55), hx(0.8, -1.3), hx(1.05, -0.62)], st({ color: acc }))); out.push(...R.line(...hx(-1.3, -0.62), ...hx(1.3, -0.62), st({ color: acc }))); }
    else if (a === 'cap') { out.push(...R.curve([hx(-0.98, -0.6), hx(-0.7, -1.25), hx(0, -1.4), hx(0.7, -1.25), hx(0.98, -0.6)], st({ color: acc }))); out.push(...R.line(...hx(-0.98, -0.6), ...hx(1.7, -0.6), st({ color: acc }))); }
    else if (a === 'crown') out.push(...R.poly([hx(-0.8, -0.85), hx(-0.9, -1.75), hx(-0.4, -1.3), hx(0, -1.9), hx(0.4, -1.3), hx(0.9, -1.75), hx(0.8, -0.85)], true, st({ color: '#e8792b', fill: '#f2b830', fillGap: 14 })));
    else if (a === 'gradcap') { out.push(...R.poly([hx(-1.3, -1.1), hx(0, -1.6), hx(1.3, -1.1), hx(0, -0.7)], true, st({ fill: f.color, fillGap: 14 }))); out.push(...R.line(...hx(1.3, -1.1), ...hx(1.3, -0.3), st({ color: acc }))); }
    else if (a === 'glasses') { for (const sx of [-1, 1]) out.push(...R.ellipse(...hx(sx * 0.38, -0.1), hr * 0.62, hr * 0.56, st({ w: fw, rough: 0.4 }))); seg(hx(-0.08, -0.12), hx(0.08, -0.12)); }
    else if (a === 'longhair') { out.push(...R.curve([hx(-0.3, -1.0), hx(-0.95, -0.6), hx(-1.15, 0.5), hx(-0.9, 1.5)], st())); out.push(...R.curve([hx(0.3, -1.0), hx(0.95, -0.6), hx(1.15, 0.5), hx(0.9, 1.5)], st())); out.push(...R.curve([hx(-0.8, -0.55), hx(-0.2, -0.75), hx(0.8, -0.5)], st({ w: fw }))); }
    else if (a === 'beard') out.push(...R.curve([hx(-0.85, 0.3), hx(-0.6, 1.15), hx(0, 1.5), hx(0.6, 1.15), hx(0.85, 0.3)], st({ fill: f.color, fillGap: 12 })));
    else if (a === 'tie') { const t0: Pt = [neck[0], neck[1] + 0.02 * H]; out.push(...R.poly([t0, [t0[0] - 0.03 * H, t0[1] + 0.13 * H], [t0[0], t0[1] + 0.17 * H], [t0[0] + 0.03 * H, t0[1] + 0.13 * H]], true, st({ color: acc, fill: acc, fillStyle: 'solid', fillAlpha: 0.85, w: fw }))); }
    else if (a === 'briefcase') { const h = armL[2]; out.push(...R.rect(h[0] - 0.09 * H, h[1] + 0.02 * H, 0.18 * H, 0.13 * H, st({ fill: acc === f.color ? '#8a8580' : acc, fillGap: 14 }))); out.push(...R.poly([[h[0] - 0.035 * H, h[1] + 0.02 * H], [h[0] - 0.035 * H, h[1] - 0.015 * H], [h[0] + 0.035 * H, h[1] - 0.015 * H], [h[0] + 0.035 * H, h[1] + 0.02 * H]], false, st({ w: fw }))); }
  }
  return { strokes: out, anchors: { head: headC, handL: armL[2], handR: armR[2], hip, feet: [(legL[2][0] + legR[2][0]) / 2, Math.max(legL[2][1], legR[2][1])] } };
}
