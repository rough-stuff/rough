import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCanvas, Path2D } from '@napi-rs/canvas';
import { fakeAlignment, resolveAnchor, buildSubtitles, loadAlignment } from '../src/core/alignment';
import { compile } from '../src/core/compile';
import { lint } from '../src/core/lint';
import { drawFrame } from '../src/core/render';

const tmp = () => mkdtempSync(join(tmpdir(), 'hj-'));
function alignmentOf(text: string) { const d = tmp(), f = join(d, 'alignment.json'); writeFileSync(f, JSON.stringify(fakeAlignment(text))); return loadAlignment(f); }

test('锚点：文字、第 n 次、@end、偏移、范围', () => {
  const al = alignmentOf('一百块给你。你拿一百块去买东西。');
  const a = resolveAnchor(al, '一百块'), b = resolveAnchor(al, '一百块#2');
  assert.equal(a.time, 0);
  assert.ok(b.time > a.time);
  assert.equal(a.ambiguous, 1);
  assert.equal(b.ambiguous, 0);
  assert.ok(resolveAnchor(al, '给你@end').time > resolveAnchor(al, '给你').time);
  assert.ok(Math.abs(resolveAnchor(al, '买东西-0.2').time - (resolveAnchor(al, '买东西').time - 0.2)) < 1e-9);
  assert.equal(resolveAnchor(al, '一百块', [b.time - 0.01, 99]).time, b.time);
  assert.throws(() => resolveAnchor(al, '两百块'), /找不到/);
  assert.equal(resolveAnchor(al, '给，你').time, resolveAnchor(al, '给你').time);
});

test('字幕：按标点断行，不超过上限', () => {
  const al = alignmentOf('很多人信，而且理由听着特别硬。人都没工资了，东西卖给谁？');
  const subs = buildSubtitles(al, 13);
  assert.ok(subs.length >= 3);
  for (const s of subs) { assert.ok(s.text.replace(/\s/g, '').length <= 14, s.text); assert.ok(s.end > s.start); }
});

test('示例项目：零错误零警告，时间线合理', () => {
  const c = compile('examples/compound');
  const issues = lint(c);
  assert.deepEqual(issues.filter(i => i.level !== 'info'), []);
  assert.equal(c.scenes.length, 2);
  for (const tl of c.tls) if (tl.drawT0 != null) assert.ok(tl.drawT1! > tl.drawT0);
  const sc2 = c.scenes[1];
  assert.ok(Math.abs(sc2.t0 - resolveAnchor(c.al, '时间越长').time) < 1e-9);
});

test('渲染：画面是时间的纯函数（同一时刻两次渲染逐像素一致，且画面随时间变化）', () => {
  const c = compile('examples/compound');
  const env = { createCanvas, Path2D };
  const shot = (t: number) => { const cv = createCanvas(270, 480); drawFrame(cv.getContext('2d'), c, t, env, { scale: 0.25 }); return Buffer.from(cv.data()); };
  const a = shot(9.5), b = shot(3), a2 = shot(9.5);
  assert.ok(a.equals(a2));
  assert.ok(!a.equals(b));
  assert.ok(a.some((v, i) => i % 4 === 0 && v < 100), '画面上应该有墨迹');
});

test('检查器：拦住抄口播、找不到的锚点、引用不存在的元素', () => {
  const d = tmp();
  cpSync('examples/compound', d, { recursive: true });
  const f = join(d, 'scenes/02-snowball.yaml');
  let s = readFileSync(f, 'utf8');
  s = s.replace('text: "本金"', 'text: "复利的关键不是本金"').replace('at: "这个雪球"', 'at: "这个火球"').replace('draw: me', 'draw: nobody');
  writeFileSync(f, s);
  const msgs = lint(compile(d)).filter(i => i.level === 'error').map(i => i.msg).join('\n');
  assert.match(msgs, /照抄口播/);
  assert.match(msgs, /这个火球/);
  assert.match(msgs, /nobody/);
});

test('确认：只调细节不改变分镜版本，改“画什么”才改变', () => {
  const d = tmp();
  cpSync('examples/compound', d, { recursive: true });
  const h0 = compile(d).planHash, f = join(d, 'scenes/01-deposit.yaml');
  const s = readFileSync(f, 'utf8');
  writeFileSync(f, s.replace('size: 560', 'size: 540'));
  assert.equal(compile(d).planHash, h0);
  writeFileSync(f, s.replace('intent: 画出小人和存钱罐', 'intent: 画出小人和保险箱'));
  assert.notEqual(compile(d).planHash, h0);
});

test('表现手法：九种都能在竖屏和横屏下展开，示例零警告', () => {
  const c = compile('examples/patterns');
  assert.deepEqual(lint(c).filter(i => i.level !== 'info'), []);
  assert.equal(c.scenes.length, 9);
  const d = tmp();
  cpSync('examples/patterns', d, { recursive: true });
  const pf = join(d, 'project.yaml');
  writeFileSync(pf, readFileSync(pf, 'utf8').replace('format: portrait', 'format: landscape'));
  const errors = lint(compile(d)).filter(i => i.level === 'error');
  assert.deepEqual(errors, []);
});

test('表现手法：写错步骤名时列出可用步骤', () => {
  const d = tmp();
  cpSync('examples/patterns', d, { recursive: true });
  const f = join(d, 'scenes/01-cycle.yaml');
  writeFileSync(f, readFileSync(f, 'utf8').replace('step: result', 'step: finish'));
  const msgs = lint(compile(d)).filter(i => i.level === 'error').map(i => i.msg).join('\n');
  assert.match(msgs, /finish/);
  assert.match(msgs, /go\.1/);
});

test('一块板放两种手法：自动起名的元素不撞名，步骤带前缀', () => {
  const d = tmp();
  cpSync('examples/patterns', d, { recursive: true });
  const f = join(d, 'scenes/04-bars.yaml');
  writeFileSync(f, `from: "按公式该发"
intent: 上半板柱子被砍，下半板一条走势
pattern:
  - { kind: bars, area: ["5%", "2%", "90%", "48%"], items: [{ label: 法定, value: 3800, cutTo: 1200 }, { label: 去年, value: 1300 }] }
  - { kind: trend, area: ["5%", "52%", "90%", "46%"], points: [{ value: 3, label: A }, { value: 2, label: B }, { value: 1, label: C }] }
beats:
  - { at: "按公式该发", intent: 画柱子, do: [{ step: bars.axis }, { step: bars.bar.1 }, { step: bars.bar.2 }] }
  - { at: "最后只批了", intent: 砍柱子并画走势, do: [{ step: bars.cut.1 }, { step: trend.axis }, { step: trend.all }, { draw: { note: 砍了, target: bars_n1, side: bottom } }] }
`);
  const c = compile(d), errors = lint(c).filter(i => i.level === 'error');
  assert.deepEqual(errors, []);
  const ids = c.tls.filter(t => t.scene === 3).map(t => t.el.id);
  assert.ok(ids.includes('bars_axis') && ids.includes('trend_axisX'));
  assert.equal(new Set(ids).size, ids.length);
});

test('自动避让：堆在同一点、不写位置、写到板外的元素，最后都在板内且互不重叠', () => {
  const d = tmp();
  cpSync('examples/patterns', d, { recursive: true });
  for (const f of ['01-cycle', '02-versus', '03-chain', '05-trend', '06-timeline', '07-thought', '08-equation', '09-split']) writeFileSync(join(d, `scenes/${f}.yaml`), '');
  const f = join(d, 'scenes/04-bars.yaml');
  writeFileSync(f, `intent: 压力测试
elements:
  a: { doodle: factory, size: 280, at: [480, 400], label: 公司 }
  b: { doodle: gov, size: 280, at: [480, 400] }
  c: { figure: stand, size: 360, at: [500, 420] }
  d: { doodle: banknote, size: 200, at: [480, 400] }
  e: { text: "+0", size: 150, at: [470, 410] }
  f: { doodle: robot, size: 240 }
  g: { doodle: server, size: 220 }
  h: { text: "53%", size: 110 }
  i: { doodle: moneybag, size: 200, near: c }
  j: { doodle: chip, size: 180, at: [1500, 300] }
  n: { note: 一条批注, target: e }
  inside: { doodle: bubble, size: 300, at: [200, 1050] }
  word: { text: "嗯", size: 80, at: inside }
beats:
  - { at: "一百块从公司", intent: 全部画出来, do: [{ draw: [a, b, c, d, e, f, g, h, i, j, n, inside, word] }] }
`);
  for (const x of readdirSync(join(d, 'scenes'))) if (!readFileSync(join(d, 'scenes', x), 'utf8').trim()) rmSync(join(d, 'scenes', x));
  const c = compile(d), B = c.fmt.board, els = c.tls.map(t => t.el);
  assert.deepEqual(lint(c).filter(i => i.level === 'error'), []);
  for (const e of els) assert.ok(e.solid.x >= -6 && e.solid.y >= -6 && e.solid.x + e.solid.w <= B.w + 6 && e.solid.y + e.solid.h <= B.h + 6, `${e.id} 出界`);
  const ov = (p: any, q: any) => Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x) > 8 && Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y) > 8;
  for (const p of els) for (const q of els) if (p.id < q.id && !(p.id === 'inside' && q.id === 'word')) assert.ok(!ov(p.solid, q.solid), `${p.id} 和 ${q.id} 重叠`);
  const word = els.find(e => e.id === 'word')!, bub = els.find(e => e.id === 'inside')!;
  assert.ok(ov(word.solid, bub.solid), '明确叠放在气泡上的文字不应该被挪走');
});
