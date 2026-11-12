// 表现手法：把常见的论证结构做成“自带构图和动作编排”的场景骨架。
// agent 填角色、把步骤（step）卡到口播上；位置、大小、箭头走向、动作顺序由手法负责。
// 手法展开后就是普通的 elements 和动作，所以可以和自己写的元素、动作混用，也可以引用它生成的 id。
import type { Format } from './theme';

export interface Area { x: number; y: number; w: number; h: number }
export interface PCtx { fmt: Format; A: Area; portrait: boolean; fail: (msg: string) => never }
export interface POut { elements: [string, any][]; steps: Record<string, any[]> }
export interface Pattern { title: string; when: string; params: string[]; steps: string[]; build(p: any, c: PCtx): POut }

const need = (c: PCtx, v: any, what: string) => { if (v == null || (Array.isArray(v) && !v.length)) c.fail(`缺少 ${what}`); return v; };
const list = (c: PCtx, v: any, what: string, min: number, max: number): any[] => { if (!Array.isArray(v) || v.length < min || v.length > max) c.fail(`${what} 需要 ${min}–${max} 项`); return v; };
/** 元素定义：允许直接写一个字符串当文字 */
const el = (src: any, extra: any, defSize?: number) => {
  const s = typeof src === 'string' ? { text: src } : { ...src };
  delete s.id; delete s.note; delete s.value; delete s.cutTo; delete s.item; delete s.when;
  const isLabelOnly = false; void isLabelOnly;
  if (s.size == null && defSize != null) s.size = 'text' in s ? Math.round(defSize * 0.42) : 'figure' in s ? Math.round(defSize * 1.25) : defSize;
  return { ...s, ...extra };
};
const idOf = (src: any, d: string) => (src && typeof src === 'object' && src.id ? String(src.id) : d);
const r = Math.round;

export const PATTERNS: Record<string, Pattern> = {
  cycle: {
    title: '循环流转',
    when: '钱、货、信息在几方之间转一圈（税收转移、资金回流、互相做生意）。重点是“转”这个动作，以及转完之后的结果。',
    params: ['nodes: 2–5 个参与方（元素定义，建议带 label）', 'token: 流转的东西（默认一张钞票）', 'flows: 每条箭头上的小字（如 ["交税", "发钱", "消费"]），可省', 'result: 转完后写在圈中央的结论（如 "+0"），可省'],
    steps: ['show.N 画出第 N 个参与方', 'show.all 依次画出全部', 'token 画出流转物（在第 1 个参与方旁边）', 'go.N 画第 N 条箭头（N→N+1），流转物同时沿箭头滑过去', 'result 圈中央写下结论并圈起来'],
    build(p, c) {
      const nodes = list(c, p.nodes, 'nodes', 2, 5), n = nodes.length, A = c.A;
      const s = Math.min(A.w, A.h) * (n <= 3 ? 0.34 : 0.27), cx = A.x + A.w / 2, cy = A.y + A.h / 2;
      // 各方的站位（占区域的比例），把区域撑满
      const table: Record<number, number[][]> = { 2: [[0.2, 0.5], [0.8, 0.5]], 3: [[0.2, 0.2], [0.8, 0.2], [0.5, 0.84]], 4: [[0.2, 0.18], [0.8, 0.18], [0.8, 0.82], [0.2, 0.82]], 5: [[0.5, 0.13], [0.84, 0.42], [0.72, 0.85], [0.28, 0.85], [0.16, 0.42]] };
      const ids = nodes.map((nd, i) => idOf(nd, `n${i + 1}`));
      const pos = table[n].map(([fx, fy]) => [A.x + s * 0.5 + (A.w - s) * ((fx - 0.2) / 0.6 * 0.82 + 0.09), A.y + s * 0.6 + (A.h - s * 1.5) * Math.max(0, Math.min(1, (fy - 0.13) / 0.72))]);
      const E: [string, any][] = nodes.map((nd, i) => [ids[i], el(nd, { at: [r(pos[i][0]), r(pos[i][1])] }, r(s))]);
      const gx = pos.reduce((a, q) => a + q[0], 0) / n, gy = pos.reduce((a, q) => a + q[1], 0) / n;
      // 流转物的“停靠点”：第 1 方朝圈内的那个角。最后一条箭头指回这里，圈在这儿闭合
      const dl = Math.hypot(gx - pos[0][0], gy - pos[0][1]) || 1;
      const tk = n === 2 ? [pos[0][0] + s * 0.2, pos[0][1] + s * 0.95] : [pos[0][0] + ((gx - pos[0][0]) / dl) * s * 0.85, pos[0][1] + ((gy - pos[0][1]) / dl) * s * 0.85];
      for (let i = 0; i < n; i++) E.push([`a${i + 1}`, { arrow: [ids[i], i === n - 1 && n > 2 ? [r(tk[0] + s * 0.1), r(tk[1] + s * 0.28)] : ids[(i + 1) % n]], curve: n === 2 ? -0.32 : -0.16, pad: 26, ...(p.flows?.[i] ? { label: String(p.flows[i]) } : {}) }]);
      E.push(['token', el(p.token ?? { doodle: 'banknote' }, { at: [r(tk[0]), r(tk[1])] }, r(s * 0.5))]);
      const steps: Record<string, any[]> = { 'show.all': [{ draw: ids }], token: [{ draw: 'token' }] };
      ids.forEach((id, i) => { steps[`show.${i + 1}`] = [{ draw: id }]; steps[`go.${i + 1}`] = [{ draw: `a${i + 1}` }, { move: 'token', along: `a${i + 1}`, with: 'prev', dur: 0.75 }]; });
      if (n > 2) steps[`go.${n}`].push({ move: 'token', to: [r(tk[0]), r(tk[1])], dur: 0.25 });
      if (p.result != null) {
        E.push(['result', el(p.result, { at: n === 2 ? [r(cx), r(cy + s * 1.05)] : n === 3 ? [r(pos[0][0] + s * 0.12), r(pos[2][1] + s * 0.1)] : [r(gx), r(gy)], color: p.result?.color ?? 'red', ...(typeof p.result === 'string' ? { size: r(s * 0.75) } : {}) }, r(s))]);
        steps.result = [{ draw: 'result' }, { draw: { mark: 'underline', target: 'result', pad: 4 } }];
      }
      return { elements: E, steps };
    },
  },

  versus: {
    title: '两相对比',
    when: '两种情况、两个时代、两个方案摆在一起比（现在 vs 以后、有工资 vs 没工资、法定 vs 实发）。',
    params: ['left / right: 两边各一个元素定义（竖屏时是上/下）', 'leftTitle / rightTitle: 各自的小标题，可省'],
    steps: ['left / right 画出一边（含小标题）', 'divide 画中间的分隔线', 'win.left / win.right 圈出胜出的一边', 'lose.left / lose.right 给一边打叉并晃一下'],
    build(p, c) {
      need(c, p.left, 'left'); need(c, p.right, 'right');
      const A = c.A, E: [string, any][] = [], v = c.portrait;
      const half = v ? { w: A.w, h: A.h / 2 } : { w: A.w / 2, h: A.h };
      const s = Math.min(half.w, half.h) * 0.56;
      const center = (i: number) => (v ? [A.x + A.w / 2, A.y + half.h * (i + 0.5)] : [A.x + half.w * (i + 0.5), A.y + A.h / 2]);
      (['left', 'right'] as const).forEach((side, i) => {
        const [x, y] = center(i), title = p[side + 'Title'];
        E.push([side, el(p[side], { at: [r(x), r(y + (title ? s * 0.12 : 0))] }, r(s))]);
        if (title) E.push([side + 'Title', { text: String(title), size: 72, color: 'gray', above: side, gap: 26 }]);
      });
      E.push(['divider', v ? { line: [[r(A.x + A.w * 0.06), r(A.y + A.h / 2)], [r(A.x + A.w * 0.94), r(A.y + A.h / 2)]], color: 'gray', rough: 1.6 } : { line: [[r(A.x + A.w / 2), r(A.y + A.h * 0.04)], [r(A.x + A.w / 2), r(A.y + A.h * 0.96)]], color: 'gray', rough: 1.6 }]);
      const steps: Record<string, any[]> = { divide: [{ draw: 'divider' }] };
      for (const side of ['left', 'right']) {
        steps[side] = [{ draw: p[side + 'Title'] ? [side + 'Title', side] : [side] }];
        steps[`win.${side}`] = [{ draw: { mark: 'circle', target: side, color: 'green', pad: 6 } }];
        steps[`lose.${side}`] = [{ draw: { mark: 'cross', target: side, pad: -10 } }, { shake: side }];
      }
      return { elements: E, steps };
    },
  },

  chain: {
    title: '因果链',
    when: '一环扣一环的推理（AI 造货 → 货要有人买 → 人没工资 → 卖不掉）。每说到一环就长出一环；要推翻时把其中一条箭头打叉。',
    params: ['items: 2–5 个环节（元素定义）', 'links: 每条箭头上的小字（如 ["卖给", "需要"]），可省'],
    steps: ['item.N 画出第 N 环（第 2 环起会先画出连过来的箭头）', 'break.N 把第 N 环和下一环之间的箭头打叉，后面那环晃一下'],
    build(p, c) {
      const items = list(c, p.items, 'items', 2, 5), n = items.length, A = c.A;
      // 竖屏且环节多时走“之”字：左、右、左、右一路往下，把板面用满
      const zig = c.portrait && n > 3;
      const s = zig ? Math.min(A.w * 0.4, (A.h / n) * 1.05) : Math.min(A.h * 0.5, (A.w / n) * 0.72);
      const ids = items.map((it, i) => idOf(it, `c${i + 1}`));
      const E: [string, any][] = [];
      items.forEach((it, i) => {
        const at = zig ? [r(A.x + A.w * (i % 2 ? 0.74 : 0.26)), r(A.y + s * 0.5 + ((A.h - s) * i) / (n - 1))] : [r(A.x + (A.w * (i + 0.5)) / n), r(A.y + A.h / 2)];
        E.push([ids[i], el(it, { at }, r(s))]);
        if (i > 0) E.push([`l${i}`, { arrow: [ids[i - 1], ids[i]], pad: 22, ...(p.links?.[i - 1] ? { label: String(p.links[i - 1]) } : {}) }]);
      });
      const steps: Record<string, any[]> = {};
      ids.forEach((id, i) => { steps[`item.${i + 1}`] = i ? [{ draw: `l${i}` }, { draw: id }] : [{ draw: id }]; if (i < n - 1) steps[`break.${i + 1}`] = [{ draw: { mark: 'cross', target: `l${i + 1}`, pad: 18 } }, { shake: ids[i + 1] }]; });
      return { elements: E, steps };
    },
  },

  bars: {
    title: '柱子比大小 / 被砍掉一截',
    when: '几个数量比大小；或者一个数被砍、被吃掉一部分（法定 3800 → 实发 1200）。“砍”是一个动作：柱子上半截被擦掉。',
    params: ['items: 1–5 项，每项 { label, value, color?, cutTo? }。写了 cutTo 的柱子可以被砍到这个值', 'unit: 数值后缀，可省'],
    steps: ['axis 画底线', 'bar.N 画出第 N 根柱子、数值和标签', 'cut.N 擦掉第 N 根柱子的上半截，写上新数值，旁边标出砍掉的比例'],
    build(p, c) {
      const items = list(c, p.items, 'items', 1, 5), n = items.length, A = c.A, unit = p.unit ?? '';
      const base = A.y + A.h - 86, top = A.y + 110, max = Math.max(...items.map(i => +i.value));
      const slot = A.w / n, bw = Math.min(slot * 0.5, 300), ts = Math.min(72, slot * 0.2);
      const H = (v: number) => (v / max) * (base - top);
      const E: [string, any][] = [['axis', { line: [[r(A.x), r(base)], [r(A.x + A.w), r(base)]] }]];
      const steps: Record<string, any[]> = { axis: [{ draw: 'axis' }] };
      items.forEach((it, i) => {
        if (typeof it.value !== 'number') c.fail(`items 第 ${i + 1} 项缺少数字 value`);
        const k = i + 1, x = A.x + slot * (i + 0.5), col = it.color ?? 'blue', keep = it.cutTo != null ? +it.cutTo : +it.value;
        E.push([`b${k}`, { shape: 'rect', w: r(bw), h: r(H(keep)), at: [r(x), r(base - H(keep) / 2)], color: col, fill: col }]);
        const draw = [`b${k}`];
        if (it.cutTo != null) { E.push([`b${k}top`, { shape: 'rect', w: r(bw), h: r(H(it.value) - H(keep)), at: [r(x), r(base - H(keep) - (H(it.value) - H(keep)) / 2)], color: col, fill: col, overlap: true }]); draw.push(`b${k}top`); }
        E.push([`v${k}`, { text: `${it.value}${unit}`, size: r(ts), color: col, at: [r(x), r(base - H(it.value) - ts * 0.75)] }]);
        if (it.label) E.push([`t${k}`, { text: String(it.label), size: r(ts * 0.9), at: [r(x), r(base + ts * 0.8)] }]);
        steps[`bar.${k}`] = [{ draw: [...draw, `v${k}`, ...(it.label ? [`t${k}`] : [])] }];
        if (it.cutTo != null) {
          const pct = Math.round((1 - keep / it.value) * 100);
          E.push([`v${k}cut`, { text: `${keep}${unit}`, size: r(ts * 1.15), color: 'red', at: [r(x), r(base - H(keep) - ts * 0.85)] }]);
          E.push([`n${k}`, { text: it.cutLabel ?? `-${pct}%`, size: r(ts), color: 'red', at: [r(x + bw / 2 + ts * 1.5), r(base - H(keep) - (H(it.value) - H(keep)) / 2)] }]);
          steps[`cut.${k}`] = [{ erase: [`b${k}top`, `v${k}`], dur: 0.5 }, { draw: `v${k}cut` }, { draw: `n${k}` }];
        }
      });
      return { elements: E, steps };
    },
  },

  trend: {
    title: '走势',
    when: '一个数随时间变化（工资占比一路跌到 53）。线跟着口播一段一段画到对应的点，关键点标红写数。',
    params: ['points: 2–8 个点，每个 { value, label? }', 'unit: 数值后缀，可省', 'color: 线的颜色，默认 blue'],
    steps: ['axis 画坐标轴', 'to.N 把线画到第 N 个点（第 1 个点只画点）', 'mark.N 把第 N 个点标红、写出数值并圈起来', 'all 一口气画完整条线'],
    build(p, c) {
      const pts = list(c, p.points, 'points', 2, 8), n = pts.length, A = c.A, col = p.color ?? 'blue', unit = p.unit ?? '';
      const vals = pts.map(q => +(q.value ?? q)), lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo || 1) * 0.3;
      const x0 = A.x + 30, y1 = A.y + A.h - 90, y0 = A.y + 90, x1 = A.x + A.w - 20;
      const X = (i: number) => x0 + ((x1 - x0) * (i + 0.6)) / n, Y = (v: number) => y1 - ((v - (lo - pad)) / (hi + pad * 0.4 - (lo - pad))) * (y1 - y0);
      const ts = Math.min(60, ((x1 - x0) / n) * 0.3);
      const E: [string, any][] = [['axisY', { line: [[r(x0), r(y0 - 40)], [r(x0), r(y1)]] }], ['axisX', { line: [[r(x0), r(y1)], [r(x1), r(y1)]] }]];
      const steps: Record<string, any[]> = { axis: [{ draw: ['axisY', 'axisX'] }], all: [] };
      pts.forEach((q, i) => {
        const k = i + 1, draw: string[] = [];
        if (i) { E.push([`s${k}`, { line: [[r(X(i - 1)), r(Y(vals[i - 1]))], [r(X(i)), r(Y(vals[i]))]], color: col, pen: 9, rough: 0.5 }]); draw.push(`s${k}`); }
        E.push([`d${k}`, { shape: 'circle', size: 24, color: col, fill: col, fillStyle: 'solid', fillAlpha: 1, at: [r(X(i)), r(Y(vals[i]))] }]); draw.push(`d${k}`);
        if (q.label != null && String(q.label).trim()) { E.push([`t${k}`, { text: String(q.label), size: r(ts * 0.85), color: 'gray', at: [r(X(i)), r(y1 + ts * 0.75)] }]); draw.push(`t${k}`); }
        const up = i > 0 && vals[i] < vals[i - 1];
        E.push([`v${k}`, { text: `${vals[i]}${unit}`, size: r(ts * 1.5), color: 'red', at: [r(X(i)), r(Y(vals[i]) + (up ? ts * 1.6 : -ts * 1.5))] }]);
        steps[`to.${k}`] = [{ draw }];
        steps[`mark.${k}`] = [{ draw: `v${k}` }, { draw: { mark: 'circle', target: `d${k}`, pad: 10 } }];
        steps.all.push({ draw });
      });
      return { elements: E, steps };
    },
  },

  timeline: {
    title: '时间线',
    when: '按年代讲的事（七十多年前 → 1982 → 今年）。讲到哪一年，时间线上就长出哪一年的东西。',
    params: ['events: 2–5 个节点，每个 { label, item?, note? }。label 是年份/时间，item 是那一年的画面（元素定义），note 是一行小字说明'],
    steps: ['axis 画时间轴', 'event.N 画出第 N 个节点：刻度、时间、画面'],
    build(p, c) {
      const ev = list(c, p.events, 'events', 2, 5), n = ev.length, A = c.A, v = c.portrait;
      const E: [string, any][] = [], steps: Record<string, any[]> = { axis: [{ draw: 'axis' }] };
      const ts = v ? 64 : 58;
      if (v) {
        const ax = A.x + A.w * 0.34, s = Math.min((A.h / n) * 0.8, A.w * 0.46);
        E.push(['axis', { arrow: [[r(ax), r(A.y + 10)], [r(ax), r(A.y + A.h - 10)]] }]);
        ev.forEach((e, i) => {
          const k = i + 1, y = A.y + (A.h * (i + 0.5)) / n, draw = [`k${k}`, `y${k}`];
          E.push([`k${k}`, { shape: 'circle', size: 30, fill: 'ink', fillStyle: 'solid', fillAlpha: 1, at: [r(ax), r(y)] }]);
          E.push([`y${k}`, { text: String(e.label), size: ts, at: [r(ax - 40), r(y)], anchor: 'right' }]);
          if (e.item) { E.push([idOf(e.item, `e${k}`), el(e.item, { at: [r(ax + 60 + (A.x + A.w - ax - 60) / 2), r(y)] }, r(s))]); draw.push(idOf(e.item, `e${k}`)); }
          if (e.note) { E.push([`m${k}`, { text: String(e.note), size: 40, color: 'gray', below: `y${k}`, gap: 10, align: 'end' }]); draw.push(`m${k}`); }
          steps[`event.${k}`] = [{ draw }];
        });
      } else {
        const ay = A.y + A.h * 0.7, s = Math.min((A.w / n) * 0.6, A.h * 0.5);
        E.push(['axis', { arrow: [[r(A.x + 10), r(ay)], [r(A.x + A.w - 10), r(ay)]] }]);
        ev.forEach((e, i) => {
          const k = i + 1, x = A.x + (A.w * (i + 0.5)) / n, draw = [`k${k}`, `y${k}`];
          E.push([`k${k}`, { shape: 'circle', size: 30, fill: 'ink', fillStyle: 'solid', fillAlpha: 1, at: [r(x), r(ay)] }]);
          E.push([`y${k}`, { text: String(e.label), size: ts, at: [r(x), r(ay + ts * 1.1)] }]);
          if (e.item) { E.push([idOf(e.item, `e${k}`), el(e.item, { at: [r(x), r(ay - 50 - s / 2)] }, r(s))]); draw.push(idOf(e.item, `e${k}`)); }
          if (e.note) { E.push([`m${k}`, { text: String(e.note), size: 40, color: 'gray', below: `y${k}`, gap: 8 }]); draw.push(`m${k}`); }
          steps[`event.${k}`] = [{ draw }];
        });
      }
      return { elements: E, steps };
    },
  },

  thought: {
    title: '想法 / 说法',
    when: '“很多人觉得…”“你可能会说…”“他回了一句…”。一个人头上冒出泡泡，泡泡里是画，不是字。想法被推翻时把泡泡擦掉。',
    params: ['who: 小人（元素定义）', 'content: 泡泡里的东西（元素定义）', 'bubble: thought（想，默认）或 speech（说）'],
    steps: ['who 画出小人', 'bubble 冒出泡泡和里面的内容', 'pop 泡泡被擦掉（想法破灭）'],
    build(p, c) {
      need(c, p.who, 'who'); need(c, p.content, 'content');
      const A = c.A, speech = p.bubble === 'speech';
      const fs = Math.min(A.h * 0.62, A.w * 0.8), bs = Math.min(A.w * 0.66, A.h * 0.52, 620);
      const fx = A.x + A.w * 0.26, fy = A.y + A.h - fs * 0.5 - 20;
      const bx = Math.min(A.x + A.w - bs / 2 - 10, fx + bs * 0.62), by = A.y + bs * 0.38 + 10;
      const E: [string, any][] = [
        ['who', el(p.who, { at: [r(fx), r(fy)], size: p.who.size ?? r(fs) })],
        ['bubble', { doodle: speech ? 'bubble' : 'thought', size: r(bs), at: [r(bx), r(by)] }],
        ['idea', el(p.content, { at: 'bubble', dy: r(-bs * (speech ? 0.07 : 0.05)), dx: speech ? 0 : r(-bs * 0.01) }, r(bs * 0.3))],
      ];
      return { elements: E, steps: { who: [{ draw: 'who' }], bubble: [{ draw: ['bubble', 'idea'] }], pop: [{ erase: ['bubble', 'idea'], dur: 0.5 }] } };
    },
  },

  equation: {
    title: '等式',
    when: '“A 就是 B”“A 加 B 等于 C”这类一句话的结论（老板挣到的 = 老板自己花出去的）。两边用画，不用长句。',
    params: ['terms: 2–4 项（元素定义）', 'ops: 项与项之间的符号，默认第一个是 "="、其余 "+"'],
    steps: ['term.N 画出第 N 项（第 2 项起会先写出前面的符号）'],
    build(p, c) {
      const terms = list(c, p.terms, 'terms', 2, 4), n = terms.length, A = c.A;
      const col = c.portrait;
      const main = col ? A.h : A.w, s = Math.min((main / n) * (col ? 0.44 : 0.62), (col ? A.w : A.h) * 0.6);
      const ids = terms.map((t, i) => idOf(t, `t${i + 1}`)), E: [string, any][] = [], steps: Record<string, any[]> = {};
      terms.forEach((t, i) => {
        // 第一项定位，后面的符号和项一个挨一个排下去，保证不会互相压住
        if (i) E.push([`o${i}`, { text: String(p.ops?.[i - 1] ?? (i === 1 ? '=' : '+')), size: r(s * 0.42), color: 'red', [col ? 'below' : 'rightOf']: ids[i - 1], gap: 34 }]);
        E.push([ids[i], el(t, i ? { [col ? 'below' : 'rightOf']: `o${i}`, gap: 34 } : { at: col ? [r(A.x + A.w / 2), r(A.y + main / n / 2 - s * 0.1)] : [r(A.x + main / n / 2), r(A.y + A.h / 2)] }, r(s))]);
        steps[`term.${i + 1}`] = i ? [{ draw: [`o${i}`, ids[i]] }] : [{ draw: ids[i] }];
      });
      return { elements: E, steps };
    },
  },

  split: {
    title: '一份东西怎么分',
    when: '“每 100 块里，工资拿走 53 块”“大半又从税里收回来了”。先画出完整的一条，再一段一段涂上颜色。',
    params: ['parts: 2–4 份，每份 { label, value, color? }', 'total: 整条上方的标题（如 "100块"），可省', 'unit: 数值后缀，可省'],
    steps: ['whole 画出完整的一条（和标题）', 'part.N 涂出第 N 份，写上名字和数值'],
    build(p, c) {
      const parts = list(c, p.parts, 'parts', 2, 4), A = c.A, unit = p.unit ?? '';
      const sum = parts.reduce((s, q) => s + +q.value, 0), W = A.w * 0.92, h = Math.min(190, A.h * 0.3), x0 = A.x + (A.w - W) / 2, cy = A.y + A.h / 2;
      const ts = Math.min(66, A.h * 0.11), cols = ['blue', 'orange', 'green', 'purple'];
      const E: [string, any][] = [['whole', { shape: 'rect', w: r(W), h: r(h), at: [r(A.x + A.w / 2), r(cy)] }]];
      const steps: Record<string, any[]> = { whole: [{ draw: p.total ? ['whole', 'total'] : ['whole'] }] };
      if (p.total) E.push(['total', el(p.total, { above: 'whole', gap: 30 }, r(ts * 2.6))]);
      let acc = 0;
      parts.forEach((q, i) => {
        const k = i + 1, w = (W * +q.value) / sum, x = x0 + acc + w / 2, col = q.color ?? cols[i];
        acc += w;
        E.push([`p${k}`, { shape: 'rect', w: r(w - 10), h: r(h - 14), at: [r(x), r(cy)], color: col, fill: col, fillAlpha: 0.55, rough: 0.6, overlap: true }]);
        E.push([`pl${k}`, { text: `${q.label ?? ''}\n${q.value}${unit}`, size: r(ts), color: col, at: [r(x), r(cy + h / 2 + ts * 1.5)] }]);
        steps[`part.${k}`] = [{ draw: [`p${k}`, `pl${k}`] }];
      });
      return { elements: E, steps };
    },
  },
};
