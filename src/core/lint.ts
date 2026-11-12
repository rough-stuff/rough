// 质量检查：把“没人味、像 PPT、抄字幕、不同步”这些毛病在渲染前拦下来。
import type { Compiled, Issue, TL } from './compile';
import { stripPunct } from './alignment';
import type { Box } from './strokes';

function longestCommon(a: string, b: string): number {
  let best = 0; const prev = new Uint16Array(b.length + 1), cur = new Uint16Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) { for (let j = 1; j <= b.length; j++) { cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : 0; if (cur[j] > best) best = cur[j]; } prev.set(cur); }
  return best;
}
const inter = (a: Box, b: Box) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
const fmtT = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

export function lint(c: Compiled): Issue[] {
  const out: Issue[] = [...c.issues];
  const add = (level: Issue['level'], where: string, msg: string) => out.push({ level, where, msg });
  const B = c.fmt.board;
  let figures = 0, draws = 0, appears = 0;

  for (const sc of c.scenes) {
    const tls = c.tls.filter(t => t.scene === sc.index);
    const shown = tls.filter(t => t.drawT0 != null || t.appear);
    const say = stripPunct(sc.say);
    let textChars = 0;
    for (const tl of shown) {
      const el = tl.el, where = `${sc.file} / 元素 ${el.id}`;
      if (el.kind === 'figure') figures++;
      if (tl.drawT0 != null) draws++; else appears++;
      // 1. 板书不抄口播
      if (el.text) {
        const txt = stripPunct(el.text.replace(/\n/g, ''));
        textChars += txt.length;
        for (const piece of (el.kind === 'text' ? String(el.src.text).split('\n') : [el.text])) {
          const p = stripPunct(piece), lc = longestCommon(p, say);
          if (lc >= 7) add('error', where, `板书“${piece}”有 ${lc} 个字是照抄口播的。画面要演示口播在讲的事，不要把话再写一遍：换成图形、小人动作、数字或 2–5 字的关键词`);
          else if (p.length > 10 && el.kind === 'text') add('warn', where, `板书“${piece}”一行有 ${p.length} 个字，偏长。板书只留关键词、数字、标签`);
        }
      }
      // 2. 出界
      const b = el.box;
      const outside = b.x < -12 || b.y < -12 || b.x + b.w > B.w + 12 || b.y + b.h > B.h + 12;
      if (b.x > B.w || b.y > B.h || b.x + b.w < 0 || b.y + b.h < 0) add('error', where, `整个元素在画板外面（画板 ${B.w}×${B.h}，它在 x ${b.x.toFixed(0)}…${(b.x + b.w).toFixed(0)}，y ${b.y.toFixed(0)}…${(b.y + b.h).toFixed(0)}）`);
      else if (outside) add('warn', where, `超出画板安全区（画板 ${B.w}×${B.h}，它占 x ${b.x.toFixed(0)}…${(b.x + b.w).toFixed(0)}，y ${b.y.toFixed(0)}…${(b.y + b.h).toFixed(0)}），可能被平台界面或字幕挡住`);
      // 3. 画得太赶
      if (tl.compress != null && tl.compress < 0.4) add('warn', where, `要用自然速度的 ${(1 / tl.compress).toFixed(1)} 倍才画得完（${(tl.drawT1! - tl.drawT0!).toFixed(2)} 秒），会像快进。简化它、给它更多时间（节拍加 lead 提前起笔），或拆到两拍`);
    }
    if (textChars > 110) add('warn', sc.file, `这个场景板书共 ${textChars} 个字，偏多。批注要短：数字、名字、出处，一条不超过十个字`);
    // 信息密度：一块板讲了这么久，上面应该已经是一张内容丰富的图
    const dur = sc.t1 - sc.t0, things = shown.filter(t => t.el.kind !== 'mark').length, want = Math.max(6, Math.round(dur / 2.4));
    if (dur >= 8 && things < want) add('warn', sc.file, `信息密度偏低：这个场景讲了 ${dur.toFixed(0)} 秒，板上一共只出现了 ${things} 样东西（这个时长建议不少于 ${want} 样）。画面稀疏会显得内容单薄。往上加“第二层信息”：给箭头写小字（label）、给关键元素加批注（note：数字、名字、出处）、补一个小图表或再放一种手法（pattern 写成列表、各占一块 area）`);
    for (const tl of shown) if (tl.el.kind === 'text' && (tl.el.src.size ?? 72) < 34) add('warn', `${sc.file} / 元素 ${tl.el.id}`, `字号 ${tl.el.src.size} 太小，手机上看不清，至少 36`);
    const visual = shown.filter(t => !['text', 'mark'].includes(t.el.kind));
    if (shown.length && !visual.length) add('warn', sc.file, '这个场景只有文字，没有任何图形或小人——这就是“像 PPT”。至少用一个画面元素来演示正在讲的事');
    // 画面太空
    if (visual.length && sc.t1 - sc.t0 >= 6) {
      const bs = shown.map(t => t.el.box), x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y)), x1 = Math.max(...bs.map(b => b.x + b.w)), y1 = Math.max(...bs.map(b => b.y + b.h));
      const cover = ((x1 - x0) * (y1 - y0)) / (B.w * B.h);
      if (cover < 0.45) add('warn', sc.file, `所有元素加起来只占了画板的 ${(cover * 100).toFixed(0)}%（画板 ${B.w}×${B.h}，内容在 x ${x0.toFixed(0)}…${x1.toFixed(0)}，y ${y0.toFixed(0)}…${y1.toFixed(0)}）。画面太空、东西太小，手机上看不清：放大元素，把板面用满`);
    }
    // 4. 重叠
    const solid = shown.filter(t => !['mark', 'arrow', 'line'].includes(t.el.kind) && !t.moves.length);
    for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) {
      const a = solid[i], b = solid[j];
      const life = (t: TL): [number, number] => [t.drawT0 ?? t.appear!.t, t.gone ?? Infinity];
      const [a0, a1] = life(a), [b0, b1] = life(b);
      if (Math.max(a0, b0) >= Math.min(a1, b1)) continue;
      const refs = (x: TL, y: TL) => typeof x.el.src.at === 'string' && x.el.src.at.split('.')[0] === y.el.id;
      if (refs(a, b) || refs(b, a)) continue;
      const ov = inter(a.el.solid, b.el.solid) / Math.max(1, Math.min(a.el.box.w * a.el.box.h, b.el.box.w * b.el.box.h));
      // 小的整个装在大的容器里（气泡里的字、框里的图）是有意为之
      const big = a.el.box.w * a.el.box.h > b.el.box.w * b.el.box.h ? a : b;
      if (ov > 0.9 && ['doodle', 'shape', 'parts'].includes(big.el.kind)) continue;
      if (a.el.over.has(b.el.id) || b.el.over.has(a.el.id) || a.el.src.overlap === true || b.el.src.overlap === true) continue;
      if (ov > 0.06) add('warn', sc.file, `元素 "${a.el.id}" 和 "${b.el.id}" 重叠了 ${(ov * 100).toFixed(0)}%，引擎没能自动挪开（板上太挤，找不到空位）。减少这块板上的东西、缩小它们，或者先擦掉一部分`);
    }
    // 5. 画面静止太久
    const acts = sc.beats.flatMap(b => b.actions).sort((x, y) => x.t0 - y.t0);
    let cursor = sc.t0;
    const idle = (from: number, to: number) => {
      if (to - from < 4.2) return;
      const said = c.al.units.filter(u => u.start >= from && u.start < to).map(u => u.display).join('');
      add('warn', sc.file, `${fmtT(from)}–${fmtT(to)} 有 ${(to - from).toFixed(1)} 秒画面没有任何变化，这段在说：“${said.slice(0, 40)}${said.length > 40 ? '…' : ''}”。真人讲到这里手不会停：加一拍（画点东西、小人换个动作、圈一下重点、推一下镜头）`);
    };
    for (const a of acts) { idle(cursor, a.t0); cursor = Math.max(cursor, a.t1); }
    idle(cursor, sc.t1);
    // 6. 转场时上一场还没画完
    const next = c.scenes[sc.index + 1];
    if (next && acts.length) { const last = Math.max(...acts.map(a => a.t1)); if (last > next.t0 - 0.3) add('warn', sc.file, `最后一个动作 ${fmtT(last)} 才结束，但 ${fmtT(next.t0)} 就要转到下一个场景了，会画到一半被带走`); }
  }
  if (draws + appears > 6 && appears / (draws + appears) > 0.4) add('warn', '全片', `有 ${appears} 个元素是直接弹出/淡入的（共 ${draws + appears} 个）。这是 PPT 的出场方式；手绘视频里东西应该是画出来的，pop/fade 只留给“变戏法”的时刻`);
  if (c.scenes.length > 2 && figures === 0) add('info', '全片', '全片没有出现小人。一个会指、会愣、会摊手的小人是“有人在讲”的来源，考虑让它贯穿全片');
  return out;
}

export function printIssues(issues: Issue[]): { errors: number; warns: number } {
  const errors = issues.filter(i => i.level === 'error'), warns = issues.filter(i => i.level === 'warn'), infos = issues.filter(i => i.level === 'info');
  for (const [label, list] of [['✗ 错误', errors], ['! 警告', warns], ['· 提示', infos]] as const) for (const i of list) console.log(`${label}  ${i.where}\n      ${i.msg}`);
  console.log(`\n${errors.length} 个错误，${warns.length} 个警告，${infos.length} 个提示`);
  return { errors: errors.length, warns: warns.length };
}

/** 给用户确认用的文字分镜表 */
export function planMarkdown(c: Compiled): string {
  const L: string[] = [];
  L.push(`# 分镜表：${c.meta.title ?? '未命名'}`, '');
  L.push(`画幅 ${c.fmt.name === 'portrait' ? '竖屏 9:16' : '横屏 16:9'} · 时长 ${fmtT(c.duration)} · ${c.scenes.length} 个场景 · 分镜版本 \`${c.planHash}\``, '');
  L.push('> 请逐场景看“画面”一栏：它是否在**演示**口播讲的事，而不是把话再写一遍。确认前不会渲染任何画面。', '');
  for (const sc of c.scenes) {
    L.push(`## ${sc.index + 1}. ${sc.id}　${fmtT(sc.t0)}–${fmtT(sc.t1)}`, '');
    L.push(`**这个场景要让人看到：** ${sc.intent || '（未填写）'}`, '');
    L.push(`进场方式：${{ pan: '镜头平移到新板面', wipe: '板擦擦净后重画', cut: '直接切换' }[sc.enter] ?? sc.enter}`, '');
    L.push('| 时间 | 口播 | 画面 | 板书文字 |', '|---|---|---|---|');
    const first = sc.beats[0];
    if (first && first.t - sc.t0 > 0.4) { const pre = c.al.units.filter(u => u.start >= sc.t0 - 1e-6 && u.start < first.t - 1e-6).map(u => u.display).join(''); if (pre) L.push(`| ${fmtT(sc.t0)} | ${pre} | （承接上一拍，画面不变） | |`); }
    for (const b of sc.beats) {
      const texts = b.actions.flatMap(a => a.ids).map(id => c.tls.find(t => t.scene === sc.index && t.el.id === id)?.el).filter(e => e?.text && b.actions.some(a => ['draw', 'pop', 'fade'].includes(a.verb) && a.ids.includes(e!.id))).map(e => e!.text!.replace(/\n/g, ' / '));
      L.push(`| ${fmtT(b.t)} | ${b.say || '—'} | ${b.intent} | ${[...new Set(texts)].join('、')} |`);
    }
    L.push('');
  }
  // 没解决的质量警告原样交给用户看，不让它们被悄悄带过去
  const warns = c.issues.filter(i => i.level === 'warn');
  if (warns.length) {
    L.push('## 尚未解决的质量警告', '', '下面是自动检查发现、但写分镜的人没有处理的问题。确认前请留意：', '');
    for (const w of warns) L.push(`- **${w.where}**：${w.msg}`);
    L.push('');
  }
  return L.join('\n');
}
