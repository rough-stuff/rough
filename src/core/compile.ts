// 编译器：项目目录（project.yaml + scenes/*.yaml + 时间表）→ 一条算好绝对时间的时间线。
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { createHash } from 'node:crypto';
import YAML from 'yaml';
import { loadAlignment, resolveAnchor, buildSubtitles, type Alignment, type SubLine } from './alignment';
import { buildElement, SrcError, KINDS, type El } from './elements';
import { POSES, FACES, type Pose } from './figure';
import { FORMATS, THEME, type Format } from './theme';
import { type Pt, type Box, unionBox, polyLen } from './strokes';
import { PATTERNS } from './patterns';

export interface Issue { level: 'error' | 'warn' | 'info'; where: string; msg: string }
export interface Tween { t0: number; t1: number; from: number; to: number }
export interface TL {
  el: El; order: number; scene: number;
  drawT0?: number; drawT1?: number; sched?: Float64Array; // 每笔 [起, 止]
  appear?: { t: number; kind: 'pop' | 'fade'; dur: number };
  moves: { t0: number; t1: number; from: Pt; to: Pt; path?: number[]; base?: Pt; linear?: boolean }[];
  alpha: Tween[]; scale: Tween[];
  shakes: { t0: number; t1: number; kind: 'shake' | 'pulse' | 'nod' }[];
  poses: { t0: number; t1: number; from: Pose; to: Pose; faceFrom: string; faceTo: string }[];
  erase?: number; // 所属擦除组
  gone?: number;
  compress?: number;
}
export interface EraseGroup { t0: number; t1: number; style: 'wipe' | 'fade'; path: number[]; width: number; scene: number }
export interface CamSeg { t0: number; t1: number; to: Cam; cut?: boolean }
export interface Cam { cx: number; cy: number; zoom: number }
export interface CAction { verb: string; ids: string[]; t0: number; t1: number; natural: number; desc: string }
export interface CBeat { at: string | number; t: number; tEnd: number; intent: string; actions: CAction[]; say: string; shaky: boolean; compress: number }
export interface CScene { id: string; file: string; index: number; t0: number; t1: number; origin: Pt; intent: string; enter: string; beats: CBeat[]; els: string[]; say: string; home: Cam }
export interface Compiled {
  dir: string; meta: any; fmt: Format; fps: number; al: Alignment; duration: number;
  scenes: CScene[]; tls: TL[]; erases: EraseGroup[]; cams: CamSeg[]; subs: SubLine[]; issues: Issue[];
  planHash: string;
}

const NATURAL: Record<string, number> = { move: 0.6, walk: 1.1, scale: 0.5, pose: 0.35, face: 0.15, pop: 0.3, fade: 0.35, hide: 0.2, erase: 0.55, camera: 0.7, shake: 0.5, pulse: 0.45, nod: 0.5 };
const VERBS = ['draw', 'erase', 'move', 'walk', 'scale', 'pose', 'face', 'pop', 'fade', 'hide', 'shake', 'pulse', 'nod', 'camera', 'wait'];
const ACTION_OPTS = ['dur', 'at', 'with', 'to', 'by', 'along', 'style', 'face', 'pad', 'zoom', 'delay'];
const SCENE_GAP = 260;

export function naturalDraw(el: El): number {
  let d = 0;
  for (const s of el.strokes) d += weight(s) / THEME.pace.px;
  return Math.max(THEME.pace.min, d);
}
/** 一笔占多少“时间份额”：上色的排线是快速涂抹，只算三分之一 */
const weight = (s: any) => ((s.under ? 0.2 : 1) * s.len + penUp(s) * (s.under ? 0.4 : 1));
const penUp = (s: { kind: string; len: number }) => (s.kind === 'fglyph' ? 40 : s.kind === 'wipe' ? 10 : (s as any).flat ? 10 : Math.min(75, 18 + s.len * 0.3));

export function loadProject(dir: string): { meta: any; scenes: { file: string; src: any }[] } {
  const pf = join(dir, 'project.yaml');
  if (!existsSync(pf)) throw new Error(`${dir} 里没有 project.yaml，这不是一个画讲项目（用 hj init 创建）`);
  const meta = YAML.parse(readFileSync(pf, 'utf8')) ?? {};
  const sd = join(dir, 'scenes');
  const files = existsSync(sd) ? readdirSync(sd).filter(f => /\.ya?ml$/.test(f)).sort() : [];
  const scenes = files.map(f => {
    try { return { file: 'scenes/' + f, src: YAML.parse(readFileSync(join(sd, f), 'utf8'), { prettyErrors: true }) ?? {} }; }
    catch (e: any) { throw new Error(`scenes/${f} 的 YAML 写错了：${e.message}`); }
  });
  return { meta, scenes };
}

export function compile(dir: string): Compiled {
  const { meta, scenes: srcScenes } = loadProject(dir);
  const issues: Issue[] = [];
  const err = (where: string, msg: string) => issues.push({ level: 'error', where, msg });
  const warn = (where: string, msg: string) => issues.push({ level: 'warn', where, msg });
  const fmt = FORMATS[meta.format ?? 'portrait'];
  if (!fmt) throw new Error(`project.yaml: format 只能是 portrait（竖屏）或 landscape（横屏）`);
  const alFile = join(dir, meta.voice ?? 'voice/alignment.json');
  if (!existsSync(alFile)) throw new Error(`找不到时间表 ${alFile}。把配音材料里的 alignment.json 放到项目的 voice/ 目录`);
  const al = loadAlignment(alFile);
  const fps = meta.fps ?? 30;
  const duration = al.duration + (meta.tail ?? 0.6);
  if (al.precision === 'sentence') warn('时间表', '当前是 SRT 降级输入，只有句级时间，句内卡点是均分估算的，同步精度有限');

  // ── 场景起点 ──
  const N = srcScenes.length;
  const starts: number[] = [];
  srcScenes.forEach((s, i) => {
    const where = s.file;
    let t = i === 0 ? 0 : NaN;
    if (s.src.from == null) { if (i > 0) err(where, '缺少 from：写上这个场景开口的头几个字，作为场景的起点'); }
    else { try { const r = resolveAnchor(al, s.src.from, [i ? starts[i - 1] ?? 0 : 0, Infinity]); if (i > 0) t = r.time; } catch (e: any) { err(where, `from ${e.message}`); } }
    if (i > 0 && !(t > starts[i - 1])) { if (!Number.isNaN(t)) err(where, `场景起点（${t.toFixed(2)}s）没有排在上一个场景之后，检查 from 或文件名顺序`); t = (starts[i - 1] ?? 0) + 0.01; }
    starts.push(t);
  });

  const scenes: CScene[] = [], tls: TL[] = [], erases: EraseGroup[] = [], camEvents: CamSeg[] = [];
  const screenC: Pt = [fmt.W / 2, fmt.H / 2], boardC: Pt = [fmt.board.x + fmt.board.w / 2, fmt.board.y + fmt.board.h / 2];
  let order = 0;
  const seenIds = new Set<string>();

  srcScenes.forEach((s, si) => {
    const src = s.src, file = s.file;
    const id = String(src.id ?? basename(file).replace(/\.ya?ml$/, '').replace(/^\d+[-_]?/, '') ?? `s${si + 1}`);
    if (seenIds.has(id)) err(file, `场景 id "${id}" 重复了`);
    seenIds.add(id);
    for (const k of Object.keys(src)) if (!['id', 'from', 'intent', 'enter', 'pattern', 'elements', 'beats', 'note'].includes(k)) err(file, `场景不认识字段 "${k}"。可用：from intent enter pattern elements beats note`);
    const t0 = starts[si], t1 = si + 1 < N ? starts[si + 1] : duration;
    const origin: Pt = [si * (fmt.W + SCENE_GAP), 0];
    const home: Cam = { cx: origin[0] + fmt.W / 2, cy: fmt.H / 2, zoom: 1 };
    const enter = src.enter ?? (si === 0 ? 'cut' : 'pan');
    if (!['pan', 'wipe', 'cut'].includes(enter)) err(file, `enter 只能是 pan（镜头平移到新板面）/ wipe（擦掉重来）/ cut（直接切）`);
    const sayUnits = al.units.filter(u => u.start >= t0 - 1e-6 && u.start < t1 - 1e-6);
    const scene: CScene = { id, file, index: si, t0, t1, origin, intent: String(src.intent ?? ''), enter, beats: [], els: [], say: sayUnits.map(u => u.display).join(''), home };
    scenes.push(scene);
    if (!scene.intent) err(file, '缺少 intent：用一两句人话说明这个场景要让观众看到什么（给用户确认分镜用）');

    // 进场镜头
    if (si > 0) {
      if (enter === 'pan') camEvents.push({ t0: t0 - 0.45, t1: t0 + 0.1, to: home });
      else camEvents.push({ t0: t0 - 0.08, t1: t0 - 0.08, to: home, cut: true });
    } else camEvents.push({ t0: -1, t1: -1, to: home, cut: true });

    // ── 元素 ──
    const els = new Map<string, El>();
    const local = new Map<string, TL>();
    const ctx = { scene: id, fmt, els, projectDir: dir };
    const addEl = (eid: string, esrc: any): TL | null => {
      if (els.has(eid)) { err(`${file} / 元素 ${eid}`, 'id 重复了'); return local.get(eid)!; }
      try {
        const el = buildElement(ctx, eid, esrc);
        els.set(eid, el);
        const tl: TL = { el, order: 0, scene: si, moves: [], alpha: [], scale: [], shakes: [], poses: [] };
        local.set(eid, tl); scene.els.push(eid);
        if (el.missing?.length) warn(`${file} / 元素 ${eid}`, `这些字符没有字形数据，画不出来：${[...new Set(el.missing)].join(' ')}`);
        return tl;
      } catch (e: any) { if (e instanceof SrcError) { err(file, e.message); return null; } throw e; }
    };
    // 表现手法：展开成元素和具名步骤
    let steps: Record<string, any[]> = {};
    const fromPattern = new Set<string>();
    if (src.pattern != null) {
      // 一块板上可以放多种手法（写成列表，各占一块 area）。多于一种时，步骤名要带前缀：<name>.<步骤>
      const specs: any[] = (Array.isArray(src.pattern) ? src.pattern : [src.pattern]).map((x: any) => (typeof x === 'string' ? { kind: x } : x));
      const multi = specs.length > 1, B = fmt.board;
      const pc = (v: any, total: number) => (typeof v === 'string' && v.endsWith('%') ? (parseFloat(v) / 100) * total : +v);
      const REF_KEYS = new Set(['draw', 'erase', 'move', 'hide', 'shake', 'pulse', 'nod', 'pop', 'fade', 'target', 'along', 'at', 'arrow', 'line', 'above', 'below', 'rightOf', 'leftOf', 'to']);
      specs.forEach((ps, pi) => {
        const pat = PATTERNS[ps?.kind];
        if (!pat) { err(file, `pattern.kind 写一种表现手法：${Object.keys(PATTERNS).join(' ')}（hj patterns 查看说明）`); return; }
        const name = String(ps.name ?? ps.kind);
        if (multi && !(Array.isArray(ps.area) && ps.area.length === 4)) { err(file, `一块板上放多种手法时，每种都要写 area: [x, y, w, h] 划出自己的地盘（手法 ${name}）`); return; }
        const a = Array.isArray(ps.area) && ps.area.length === 4 ? { x: pc(ps.area[0], B.w), y: pc(ps.area[1], B.h), w: pc(ps.area[2], B.w), h: pc(ps.area[3], B.h) } : { x: 20, y: 20, w: B.w - 40, h: B.h - 40 };
        try {
          const out = pat.build(ps, { fmt, A: a, portrait: a.h > a.w, fail: (m: string) => { throw new SrcError(`${file} / 手法 ${name}`, m); } });
          // 多种手法并存时，给自动起名的元素加前缀，避免撞名
          const userIds = new Set<string>(); JSON.stringify(ps, (k, v) => { if (k === 'id' && typeof v === 'string') userIds.add(v); return v; });
          const ren = new Map<string, string>();
          if (multi) for (const [eid] of out.elements) if (!userIds.has(eid)) ren.set(eid, `${name}_${eid}`);
          const fix = (v: any, key?: string): any => {
            if (typeof v === 'string') { if (key && !REF_KEYS.has(key)) return v; const [h, ...rest] = v.split('.'); return ren.has(h) ? [ren.get(h), ...rest].join('.') : v; }
            if (Array.isArray(v)) return v.map(x => fix(x, key));
            if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fix(x, k)]));
            return v;
          };
          for (const [eid, esrc] of out.elements) { const nid = ren.get(eid) ?? eid; addEl(nid, fix(esrc)); fromPattern.add(nid); }
          for (const [sn, acts] of Object.entries(out.steps)) { const fixed = fix(acts); steps[`${name}.${sn}`] = fixed; if (!multi) steps[sn] = fixed; }
        } catch (e: any) { if (e instanceof SrcError) err(file, e.message); else throw e; }
      });
    }
    if (src.elements && typeof src.elements !== 'object') err(file, 'elements 应该是 "id: 定义" 的映射');
    for (const [eid, esrc] of Object.entries(src.elements ?? {})) addEl(eid, esrc);

    // ── 节拍 ──
    const beats: any[] = Array.isArray(src.beats) ? src.beats : [];
    if (!beats.length) warn(file, '这个场景没有任何节拍（beats），画面会是空的');
    const beatTimes: { t: number; shaky: boolean }[] = beats.map((b, bi) => {
      const where = `${file} / 节拍 ${bi + 1}`;
      if (b?.at == null) { err(where, '缺少 at：写上触发这个节拍的口播原文片段'); return { t: NaN, shaky: false }; }
      try {
        const r = resolveAnchor(al, b.at, [t0, t1]);
        if (typeof b.at === 'number') warn(where, `at 用了写死的秒数 ${b.at}，换配音后不会跟着变；尽量改成口播原文`);
        if (r.ambiguous) warn(where, `"${b.at}" 在本场景口播里出现了 ${r.ambiguous + 1} 次，现在取的是第 1 次；用 "…#2" 指明，或把片段写长一点`);
        if (r.shaky) warn(where, `"${b.at}" 落在时间不可靠的字上（低置信度/待复核），卡点可能偏；可以换成相邻的字，或渲染后听审微调`);
        return { t: r.time - (b.lead ?? 0), shaky: r.shaky };
      } catch (e: any) { err(where, e.message); return { t: NaN, shaky: false }; }
    });
    let pos = new Map<string, Pt>(); // 元素当前位移
    const poseNow = new Map<string, { pose: Pose; face: string }>();
    let lastEnd = t0;
    beats.forEach((b, bi) => {
      const where = `${file} / 节拍 ${bi + 1}`;
      const bt = beatTimes[bi].t;
      if (Number.isNaN(bt)) return;
      for (const k of Object.keys(b)) if (!['at', 'lead', 'intent', 'do'].includes(k)) err(where, `节拍不认识字段 "${k}"。可用：at lead intent do`);
      let next = t1;
      for (let j = bi + 1; j < beats.length; j++) if (!Number.isNaN(beatTimes[j].t)) { next = beatTimes[j].t; break; }
      if (bi > 0 && !Number.isNaN(beatTimes[bi - 1].t) && bt < beatTimes[bi - 1].t) err(where, `节拍时间（${bt.toFixed(2)}s）比上一个节拍还早，节拍要按口播顺序写`);
      const nextAnchor = Math.min(next, t1);
      const endUnit = al.units.filter(u => u.start >= bt + (b.lead ?? 0) - 1e-6 && u.start < nextAnchor - 1e-6);
      const beat: CBeat = { at: b.at, t: bt, tEnd: next, intent: String(b.intent ?? ''), actions: [], say: endUnit.map(u => u.display).join(''), shaky: beatTimes[bi].shaky, compress: 1 };
      scene.beats.push(beat);
      if (!beat.intent) err(where, '缺少 intent：用一句人话说明这一拍画面上发生什么');
      // 把 {step: 名字} 换成手法给出的那组动作；写在 step 上的 at/with/delay 作用于这组动作的第一个
      const acts: any[] = [];
      for (const a of Array.isArray(b.do) ? b.do : []) {
        if (a && typeof a === 'object' && 'step' in a) {
          const st = steps[String(a.step)];
          if (!st) { err(where, `没有叫 "${a.step}" 的步骤。${Object.keys(steps).length ? '本场景可用：' + Object.keys(steps).join(' ') : '本场景没有使用表现手法（pattern）'}`); continue; }
          st.forEach((x, i) => { const { step: _s, ...rest } = a; void _s; acts.push(i === 0 ? { ...x, ...rest } : { ...x }); });
        } else acts.push(a);
      }
      if (!acts.length) warn(where, '这一拍没有动作（do 为空）');

      // 展开动作
      interface A { verb: string; ids: string[]; opt: any; natural: number; fixed: boolean; t0: number; t1: number; chain: number; withPrev: boolean; atTime?: number }
      const list: A[] = [];
      acts.forEach((a, ai) => {
        const aw = `${where} / 动作 ${ai + 1}`;
        if (!a || typeof a !== 'object') { err(aw, '动作应该是一个对象，例如 {draw: boss}'); return; }
        const verb = VERBS.find(v => v in a);
        if (!verb) { err(aw, `看不出这是什么动作。可用：${VERBS.join(' ')}`); return; }
        for (const k of Object.keys(a)) if (k !== verb && !ACTION_OPTS.includes(k)) err(aw, `动作不认识字段 "${k}"。可用：${ACTION_OPTS.join(' ')}`);
        let targets: any[] = verb === 'camera' || verb === 'wait' ? [] : Array.isArray(a[verb]) ? a[verb] : [a[verb]];
        const ids: string[] = [];
        targets.forEach((tg, ti) => {
          if (tg && typeof tg === 'object') { // 内联元素
            if (verb !== 'draw' && verb !== 'pop' && verb !== 'fade') { err(aw, '只有 draw / pop / fade 可以内联定义元素'); return; }
            const eid = String(tg.id ?? `_${bi + 1}_${ai + 1}${ti ? '_' + ti : ''}`);
            const { id: _drop, ...rest } = tg; void _drop;
            if (!KINDS.some(k => k in rest)) { err(aw, `内联元素看不出类型，需要包含：${KINDS.join(' ')}`); return; }
            if (addEl(eid, rest)) ids.push(eid);
          } else if (tg === 'all' && (verb === 'erase' || verb === 'hide')) ids.push('*');
          else if (typeof tg === 'string') { if (!local.has(tg)) err(aw, `没有叫 "${tg}" 的元素（在本场景的 elements 里定义，id 不跨场景）`); else ids.push(tg); }
          else err(aw, `${verb} 的对象应该是元素 id`);
        });
        let atTime: number | undefined;
        if (a.at != null) { try { atTime = resolveAnchor(al, a.at, [t0, t1]).time; } catch (e: any) { err(aw, e.message); } }
        const mk = (ids: string[], natural: number, withPrev = !!a.with): A => ({ verb, ids, opt: a, natural, fixed: a.dur != null, t0: 0, t1: 0, chain: 0, withPrev, atTime });
        if (verb === 'draw') {
          ids.forEach((eid, k) => { const x = mk([eid], a.dur != null ? a.dur / ids.length : naturalDraw(local.get(eid)!.el), k === 0 ? !!a.with : false); if (k > 0) x.atTime = undefined; list.push(x); });
        } else if (verb === 'wait') list.push(mk([], +a.wait || 0));
        else if (verb === 'camera' || ids.length) list.push(mk(ids, a.dur ?? NATURAL[verb] ?? 0.4));
      });

      // 排时间：默认顺序执行；with: prev 与上一个同时开始；动作自带 at 则从那一刻另起一串
      const chains: A[][] = [];
      for (const a of list) {
        if (a.withPrev && chains.length && chains[chains.length - 1].length) { a.chain = -1; chains[chains.length - 1].push(a); continue; }
        if (a.atTime != null || !chains.length) chains.push([]);
        chains[chains.length - 1].push(a);
      }
      chains.forEach((ch, ci) => {
        const start = ch[0].atTime ?? bt;
        const nextStart = chains[ci + 1]?.[0].atTime ?? next;
        const seq = ch.filter(a => a.chain !== -1);
        const avail = Math.max(0.1, nextStart - start - 0.04);
        const fixedSum = seq.filter(a => a.fixed || a.verb !== 'draw').reduce((n, a) => n + a.natural + (a.opt.delay ?? 0), 0);
        const flex = seq.filter(a => !a.fixed && a.verb === 'draw');
        const flexSum = flex.reduce((n, a) => n + a.natural, 0);
        let f = 1;
        if (flexSum > 0) {
          f = (avail - fixedSum) / flexSum;
          f = Math.max(0.12, Math.min(1.25, f));
        }
        if (flexSum > 0) beat.compress = Math.min(beat.compress, f);
        let t = start, prevStart = start;
        for (const a of ch) {
          if (a.chain === -1) { a.t0 = prevStart + (a.opt.delay ?? 0); }
          else { a.t0 = t + (a.opt.delay ?? 0); prevStart = a.t0; }
          const d = a.verb === 'draw' && !a.fixed ? a.natural * f : a.natural;
          a.t1 = a.t0 + d;
          if (a.chain !== -1) t = a.t1;
        }
        const over = t - nextStart;
        if (over > 0.25) warn(where, `这一拍的动作要到 ${t.toFixed(2)}s 才做完，比下一拍开始晚了 ${over.toFixed(1)} 秒，会和后面的画面抢。减少这一拍的内容、把一部分提前（lead）或挪到上一拍`);
      });

      // 落实动作
      for (const a of list) {
        const aw = where;
        const o = a.opt;
        let ids = a.ids;
        if (ids.includes('*')) ids = [...local.values()].filter(tl => (tl.drawT0 ?? tl.appear?.t ?? Infinity) < a.t0 && tl.gone == null).map(tl => tl.el.id);
        const tlsOf = ids.map(i => local.get(i)!).filter(Boolean);
        const need = (tl: TL) => { if (tl.drawT0 == null && !tl.appear) { err(aw, `${a.verb} 的对象 "${tl.el.id}" 还没出现在画面上（先 draw / pop / fade）`); return false; } return true; };
        let desc = '';
        if (a.verb === 'draw' || a.verb === 'pop' || a.verb === 'fade') {
          for (const tl of tlsOf) {
            if (tl.drawT0 != null || tl.appear) { err(aw, `元素 "${tl.el.id}" 已经出现过了，不能重复 ${a.verb}（要再出现一次请定义一个新元素）`); continue; }
            tl.order = order++;
            if (a.verb === 'draw') {
              tl.drawT0 = a.t0; tl.drawT1 = a.t1; tl.compress = a.fixed ? a.natural / naturalDraw(tl.el) : Math.min(1, (a.t1 - a.t0) / a.natural);
              const ws = tl.el.strokes.map(weight), sum = ws.reduce((x, y) => x + y, 0), sched = new Float64Array(ws.length * 2);
              let acc = a.t0;
              tl.el.strokes.forEach((s, i) => { const slot = ((a.t1 - a.t0) * ws[i]) / sum; sched[2 * i] = acc + slot * Math.min(0.6, penUp(s) / ws[i]) * 0.9; sched[2 * i + 1] = acc + slot; acc += slot; });
              tl.sched = sched;
            } else tl.appear = { t: a.t0, kind: a.verb, dur: a.t1 - a.t0 };
          }
          desc = (a.verb === 'draw' ? '画 ' : a.verb === 'pop' ? '弹出 ' : '淡入 ') + tlsOf.map(tl => describe(tl.el)).join('、');
        } else if (a.verb === 'erase') {
          const ok = tlsOf.filter(need);
          if (ok.length) {
            const style = o.style ?? 'wipe';
            if (!['wipe', 'fade'].includes(style)) err(aw, 'erase 的 style 只能是 wipe（板擦擦掉）或 fade（淡出）');
            const b = unionBox(ok.map(tl => shifted(tl.el.box, pos.get(tl.el.id))));
            erases.push({ t0: a.t0, t1: a.t1, style, ...wipePath(b), scene: si });
            for (const tl of ok) { tl.erase = erases.length - 1; tl.gone = a.t1; }
            desc = '擦掉 ' + ok.map(tl => describe(tl.el)).join('、');
          }
        } else if (a.verb === 'hide') { for (const tl of tlsOf.filter(need)) { tl.alpha.push({ t0: a.t0, t1: a.t1, from: 1, to: 0 }); tl.gone = a.t1; } desc = '隐去 ' + ids.join('、'); }
        else if (a.verb === 'move' || a.verb === 'walk') {
          const walking = a.verb === 'walk';
          for (const tl of tlsOf.filter(need)) {
            const cur = pos.get(tl.el.id) ?? [0, 0];
            let to: Pt = cur, path: number[] | undefined, base: Pt | undefined;
            const c = tl.el.anchors.center;
            try {
              if (o.along) { const ar = els.get(String(o.along)); if (!ar?.path) throw new SrcError(aw, `along 要写一个 arrow、line 或折线图元素的 id，"${o.along}" 不是`); path = ar.path; base = c; to = [path[path.length - 2] - c[0], path[path.length - 1] - c[1]]; }
              else if (o.to != null) { const r = refPoint(els, pos, o.to, fmt, aw); to = [r[0] - c[0], r[1] - c[1]]; }
              else if (Array.isArray(o.by)) to = [cur[0] + o.by[0], cur[1] + o.by[1]];
              else throw new SrcError(aw, 'move 需要 to（目标：元素 id、"id.锚点" 或 [x,y]）、by（相对位移 [dx,dy]）或 along（沿某条箭头走）');
            } catch (e: any) { if (e instanceof SrcError) { err(aw, e.message.replace(aw + ': ', '')); continue; } throw e; }
            tl.moves.push({ t0: a.t0, t1: a.t1, from: cur, to, path, base, linear: walking });
            pos.set(tl.el.id, to);
            if (walking) { // 走过去：边移动边交替迈步，到了恢复原来的姿势
              if (!tl.el.figure) { err(aw, `"${tl.el.id}" 不是火柴人，不能 walk（用 move）`); continue; }
              const now = poseNow.get(tl.el.id) ?? { pose: tl.el.figure.spec.pose, face: tl.el.figure.spec.face };
              const right = to[0] >= cur[0], n = Math.max(2, Math.round((a.t1 - a.t0) / 0.22)), dt = (a.t1 - a.t0) / n;
              let prev = now.pose;
              for (let i = 0; i < n; i++) { const nx = i === n - 1 ? now.pose : POSES[(i % 2 === 0) === right ? 'walk-right' : 'walk-left']; tl.poses.push({ t0: a.t0 + i * dt, t1: a.t0 + (i + 1) * dt, from: prev, to: nx, faceFrom: now.face, faceTo: now.face }); prev = nx; }
            }
          }
          desc = `${walking ? '走动' : '移动'} ${ids.join('、')}` + (o.along ? ` 沿 ${o.along}` : o.to ? ` 到 ${JSON.stringify(o.to)}` : '');
        } else if (a.verb === 'scale') {
          if (typeof o.to !== 'number' || o.to <= 0) err(aw, 'scale 需要 to: 倍数（如 1.6 放大、0.5 缩小，相对元素原始大小）');
          else for (const tl of tlsOf.filter(need)) { const from = tl.scale.length ? tl.scale[tl.scale.length - 1].to : 1; tl.scale.push({ t0: a.t0, t1: a.t1, from, to: o.to }); }
          desc = `${ids.join('、')} 缩放到 ${o.to} 倍`;
        } else if (a.verb === 'pose' || a.verb === 'face') {
          for (const tl of tlsOf.filter(need)) {
            if (!tl.el.figure) { err(aw, `"${tl.el.id}" 不是火柴人，不能 ${a.verb}`); continue; }
            const cur = poseNow.get(tl.el.id) ?? { pose: tl.el.figure.spec.pose, face: tl.el.figure.spec.face };
            const pn = a.verb === 'pose' ? o.to : undefined, fn = a.verb === 'face' ? o.to : o.face;
            if (pn != null && !POSES[pn]) { err(aw, `没有姿势 "${pn}"。可用：${Object.keys(POSES).join(' ')}`); continue; }
            if (fn != null && !FACES[fn]) { err(aw, `没有表情 "${fn}"。可用：${Object.keys(FACES).join(' ')}`); continue; }
            if (pn == null && fn == null) { err(aw, `${a.verb} 需要 to`); continue; }
            if (a.t0 < (tl.drawT1 ?? 0) - 1e-6) warn(aw, `"${tl.el.id}" 还没画完就开始换姿势，会跳一下`);
            const nx = { pose: pn ? POSES[pn] : cur.pose, face: fn ?? cur.face };
            tl.poses.push({ t0: a.t0, t1: a.t1, from: cur.pose, to: nx.pose, faceFrom: cur.face, faceTo: nx.face });
            poseNow.set(tl.el.id, nx);
          }
          desc = `${ids.join('、')} ${a.verb === 'pose' ? '摆出 ' + o.to : ''}${a.verb === 'face' || o.face ? ' 表情变 ' + (a.verb === 'face' ? o.to : o.face) : ''}`;
        } else if (a.verb === 'shake' || a.verb === 'pulse' || a.verb === 'nod') { for (const tl of tlsOf.filter(need)) tl.shakes.push({ t0: a.t0, t1: a.t1, kind: a.verb }); desc = `${a.verb === 'shake' ? '晃动' : a.verb === 'pulse' ? '放大强调' : '点头'} ${ids.join('、')}`; }
        else if (a.verb === 'camera') {
          const c = o.camera;
          if (c === 'home') { camEvents.push({ t0: a.t0, t1: a.t1, to: home }); desc = '镜头回到全景'; }
          else if (c && typeof c === 'object' && c.focus != null) {
            const fids: string[] = Array.isArray(c.focus) ? c.focus : [c.focus];
            const bad = fids.find(i => !local.has(i));
            if (bad) err(aw, `camera.focus 里没有叫 "${bad}" 的元素`);
            else {
              const b = unionBox(fids.map(i => shifted(local.get(i)!.el.box, pos.get(i)))), pad = c.pad ?? 90;
              const zoom = Math.min(c.maxZoom ?? 2.4, fmt.board.w / (b.w + pad * 2), fmt.board.h / (b.h + pad * 2));
              const wx = origin[0] + fmt.board.x + b.x + b.w / 2, wy = fmt.board.y + b.y + b.h / 2;
              camEvents.push({ t0: a.t0, t1: a.t1, to: { cx: wx + (screenC[0] - boardC[0]) / zoom, cy: wy + (screenC[1] - boardC[1]) / zoom, zoom } });
              desc = `镜头推近 ${fids.join('、')}`;
            }
          } else err(aw, 'camera 写 home（回全景）或 {focus: [元素id…], pad: 90}（推近）');
        }
        if (desc) beat.actions.push({ verb: a.verb, ids, t0: a.t0, t1: a.t1, natural: a.natural, desc });
        lastEnd = Math.max(lastEnd, a.t1);
      }
    });
    // 进场方式为 wipe 的下一场景：把本场景整板擦掉
    const nextSrc = srcScenes[si + 1]?.src;
    if (nextSrc && nextSrc.enter === 'wipe') {
      const live = [...local.values()].filter(tl => (tl.drawT0 != null || tl.appear) && tl.gone == null);
      if (live.length) {
        const g = { t0: t1 - 0.62, t1: t1 - 0.1, style: 'wipe' as const, ...wipePath({ x: -fmt.board.x, y: -fmt.board.y, w: fmt.W, h: fmt.H }, 260), scene: si };
        erases.push(g);
        for (const tl of live) { tl.erase = erases.length - 1; tl.gone = g.t1; }
      }
    }
    for (const tl of local.values()) {
      if (tl.drawT0 == null && !tl.appear && !fromPattern.has(tl.el.id)) warn(`${file} / 元素 ${tl.el.id}`, '定义了但从没画出来（没有任何 draw / pop / fade 用到它）');
      tls.push(tl);
    }
    void lastEnd;
  });

  // 镜头：按时间排好
  camEvents.sort((a, b) => a.t0 - b.t0);
  const subs = meta.subtitles === false ? [] : buildSubtitles(al, meta.subtitleMaxChars ?? fmt.subMax);
  const planHash = createHash('sha256').update(JSON.stringify({ format: fmt.name, scenes: srcScenes.map(s => [s.src.from, s.src.intent, s.src.enter, [].concat(s.src.pattern ?? []).map((x: any) => (typeof x === 'string' ? x : x?.kind)), (s.src.beats ?? []).map((b: any) => [b?.at, b?.intent])]) })).digest('hex').slice(0, 16);
  tls.sort((a, b) => a.order - b.order);
  return { dir, meta, fmt, fps, al, duration, scenes, tls, erases, cams: camEvents, subs, issues, planHash };
}

function describe(el: El): string {
  const s = el.src;
  if (el.kind === 'text') return `文字“${String(s.text).replace(/\n/g, '/')}”`;
  const lab = s.label ? `（标“${s.label}”）` : '';
  if (el.kind === 'figure') { const f = typeof s.figure === 'string' ? { pose: s.figure } : s.figure ?? {}; return `小人 ${el.id}${lab}[${s.pose ?? f.pose ?? 'stand'}/${s.face ?? f.face ?? 'happy'}]`; }
  if (el.kind === 'icon') return `图标 ${s.icon}${lab}`;
  if (el.kind === 'doodle') return `手绘件 ${s.doodle}${el.text ? `“${el.text}”` : ''}`;
  if (el.kind === 'arrow') return `箭头 ${JSON.stringify(s.arrow).replace(/"/g, '')}${s.label ? `“${s.label}”` : ''}`;
  if (el.kind === 'line') return `连线 ${JSON.stringify(s.line).replace(/"/g, '')}`;
  if (el.kind === 'mark') return `标记 ${s.mark}→${[].concat(s.target).join(',')}`;
  if (el.kind === 'note') return `批注“${s.note}”→${s.target}`;
  if (el.kind === 'chart') return `${s.chart === 'bar' ? '柱状图' : '折线图'} ${el.id}`;
  if (el.kind === 'shape') return `形状 ${s.shape} ${el.id}${lab}`;
  return `图形 ${el.id}${lab}`;
}

const shifted = (b: Box, p?: Pt): Box => (p ? { x: b.x + p[0], y: b.y + p[1], w: b.w, h: b.h } : b);

function refPoint(els: Map<string, El>, pos: Map<string, Pt>, ref: any, fmt: Format, where: string): Pt {
  if (Array.isArray(ref)) {
    const n = (v: any, total: number) => (typeof v === 'string' && v.endsWith('%') ? (parseFloat(v) / 100) * total : +v);
    return [n(ref[0], fmt.board.w), n(ref[1], fmt.board.h)];
  }
  const [id, a] = String(ref).split('.');
  const el = els.get(id);
  if (!el) throw new SrcError(where, `to 引用了不存在的元素 "${id}"`);
  const p = el.anchors[a ?? 'center'];
  if (!p) throw new SrcError(where, `元素 "${id}" 没有锚点 "${a}"，可用：${Object.keys(el.anchors).join(' ')}`);
  const off = pos.get(id) ?? [0, 0];
  return [p[0] + off[0], p[1] + off[1]];
}

/** 板擦的走位：在 box 上来回横扫 */
function wipePath(b: Box, width?: number): { path: number[]; width: number } {
  const w = width ?? Math.max(70, Math.min(150, b.h * 0.5));
  const rows = Math.max(1, Math.ceil((b.h + 30) / (w * 0.8)));
  const path: number[] = [];
  for (let r = 0; r < rows; r++) {
    const y = b.y - 15 + ((r + 0.5) * (b.h + 30)) / rows, l = b.x - 30, rr = b.x + b.w + 30;
    if (r % 2 === 0) path.push(l, y - 12, rr, y + 12); else path.push(rr, y - 12, l, y + 12);
  }
  if (path.length === 4) { path.push(path[0] + 20, path[1] + 24); }
  void polyLen;
  return { path, width: w };
}
