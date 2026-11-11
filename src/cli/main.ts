// hj：画讲命令行。流程是 init → brief → 写分镜 → check → plan →（用户确认）→ stills →（用户确认）→ render
import { existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { spawn } from 'node:child_process';
import { createCanvas, Path2D } from '@napi-rs/canvas';
import YAML from 'yaml';
import { compile, type Compiled, type CScene } from '../core/compile';
import { lint, printIssues, planMarkdown } from '../core/lint';
import { drawFrame, drawStrokes, type Env } from '../core/render';
import { writeSfx } from '../core/sfx';
import { loadAlignment, fakeAlignment, resolveAnchor } from '../core/alignment';
import { searchIcons } from '../core/icons';
import { POSES, FACES, ACCESSORIES } from '../core/figure';
import { doodleDirs } from '../core/elements';
import { textStrokes } from '../core/text';
import { THEME, FORMATS } from '../core/theme';

const env: Env = { createCanvas, Path2D };
const argv = process.argv.slice(2);
const cmd = argv[0];
const flags: Record<string, string | true> = {};
const args: string[] = [];
for (let i = 1; i < argv.length; i++) {
  if (argv[i].startsWith('--')) { const k = argv[i].slice(2); if (argv[i + 1] != null && !argv[i + 1].startsWith('--')) flags[k] = argv[++i]; else flags[k] = true; }
  else args.push(argv[i]);
}
const die = (msg: string): never => { console.error('✗ ' + msg); process.exit(1); };
const fmtT = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

function load(dir: string, strict = true): Compiled {
  let c: Compiled;
  try { c = compile(dir); } catch (e: any) { return die(e.message); }
  c.issues = lint(c);
  const errors = c.issues.filter(i => i.level === 'error');
  if (strict && errors.length) { printIssues(c.issues); die('分镜有错误，先修掉再继续（hj check 可随时重查）'); }
  return c;
}
const approvalsFile = (dir: string) => join(dir, 'approvals.json');
const approvals = (dir: string): any => (existsSync(approvalsFile(dir)) ? JSON.parse(readFileSync(approvalsFile(dir), 'utf8')) : {});
function gate(c: Compiled, stage: 'plan' | 'keyframes') {
  const a = approvals(c.dir);
  const label = stage === 'plan' ? '文字分镜' : '关键帧';
  const how = stage === 'plan'
    ? `先运行 hj plan ${c.dir} 生成 storyboard.md 交给用户看；用户明确同意后运行 hj approve ${c.dir} plan --by "<用户的确认原话>"`
    : `先运行 hj stills ${c.dir} 出关键帧交给用户看；用户明确同意后运行 hj approve ${c.dir} keyframes --by "<用户的确认原话>"`;
  if (!a[stage]) die(`${label}还没有得到用户确认，不能继续。\n  ${how}`);
  if (a[stage].planHash !== c.planHash) die(`${label}确认之后，分镜内容（场景划分 / 每拍画什么）又改过了（确认的是 ${a[stage].planHash}，现在是 ${c.planHash}），需要用户重新确认。\n  ${how}\n  只调位置、大小、颜色、时长这类细节不会触发重新确认。`);
}

function canvasFor(c: Compiled, scale: number) { const cv = createCanvas(Math.round(c.fmt.W * scale), Math.round(c.fmt.H * scale)); return { cv, ctx: cv.getContext('2d') }; }
function sceneArg(c: Compiled): CScene | null {
  if (!flags.scene) return null;
  return c.scenes.find(s => s.id === flags.scene || String(s.index + 1) === flags.scene || s.file.includes(String(flags.scene))) ?? die(`没有叫 "${flags.scene}" 的场景。现有：${c.scenes.map(s => s.id).join(' ')}`);
}

const commands: Record<string, () => Promise<void> | void> = {
  init() {
    const dir = args[0] ?? die('用法：hj init <项目目录> --voice <配音材料目录或 alignment.json> [--format portrait|landscape] [--title 标题]');
    const voice = flags.voice ? String(flags.voice) : die('需要 --voice：配音材料目录（含 alignment.json），或一份时间表文件');
    mkdirSync(join(dir, 'voice'), { recursive: true }); mkdirSync(join(dir, 'scenes'), { recursive: true });
    const srcAl = existsSync(join(voice, 'alignment.json')) ? join(voice, 'alignment.json') : existsSync(join(voice, 'subtitles.srt')) ? join(voice, 'subtitles.srt') : voice;
    if (!existsSync(srcAl)) die(`找不到时间表：${srcAl}`);
    const alName = /\.srt$/i.test(srcAl) ? 'subtitles.srt' : 'alignment.json';
    copyFileSync(srcAl, join(dir, 'voice', alName));
    let audio = '';
    for (const n of ['narration.wav', 'narration.mp3', 'narration.m4a']) { const f = join(existsSync(join(voice, n)) ? voice : resolve(voice, '..'), n); if (existsSync(f)) { copyFileSync(f, join(dir, 'voice', n)); audio = 'voice/' + n; break; } }
    const fmt = String(flags.format ?? 'portrait');
    if (!FORMATS[fmt]) die('format 只能是 portrait 或 landscape');
    if (!existsSync(join(dir, 'project.yaml'))) writeFileSync(join(dir, 'project.yaml'), `title: ${JSON.stringify(String(flags.title ?? basename(resolve(dir))))}\nformat: ${fmt}        # portrait 竖屏 1080×1920 / landscape 横屏 1920×1080\nfps: 30\nvoice: voice/${alName}\n${audio ? `audio: ${audio}` : '# audio: voice/narration.wav   # 配音文件放进 voice/ 后取消注释'}\nsubtitles: true\nsfx: true              # 落笔音效\npen: false             # 是否显示笔尖\n`);
    console.log(`✓ 项目已创建：${dir}\n  时间表：voice/${alName}${audio ? `\n  配音：${audio}` : '\n  （没找到配音文件，渲染出来只有落笔音效；把 narration.wav 放进 voice/ 并在 project.yaml 里填 audio）'}\n下一步：hj brief ${dir}   通读口播和时间，然后在 scenes/ 里写分镜`);
  },

  brief() {
    const dir = args[0] ?? die('用法：hj brief <项目目录>');
    const meta = YAML.parse(readFileSync(join(dir, 'project.yaml'), 'utf8'));
    const al = loadAlignment(join(dir, meta.voice ?? 'voice/alignment.json'));
    const L: string[] = [`# 口播简报`, '', `总时长 ${fmtT(al.duration)}，${al.units.length} 个字/词，${al.sentences.length} 句，平均每秒 ${(al.units.length / al.duration).toFixed(1)} 字。`, '',
      '每句后面的“停顿”是到下一句开口前的空隙——转场、擦板、提前起笔都该放在停顿里。', '带 ~波浪线~ 的字时间不可靠，尽量别把卡点落在它们上面。', '', '| # | 起 | 止 | 时长 | 停顿 | 口播 |', '|--:|--:|--:|--:|--:|---|'];
    al.sentences.forEach((s, i) => {
      const gap = al.sentences[i + 1] ? al.sentences[i + 1].start - s.end : 0;
      let txt = '';
      for (let k = s.from; k < s.to; k++) { const u = al.units[k]; txt += u.shaky ? `~${u.display}~` : u.display; }
      L.push(`| ${i + 1} | ${s.start.toFixed(2)} | ${s.end.toFixed(2)} | ${(s.end - s.start).toFixed(1)}s | ${gap > 0.02 ? gap.toFixed(2) + 's' : ''} | ${txt.replace(/~~/g, '')} |`);
    });
    const out = L.join('\n') + '\n';
    writeFileSync(join(dir, 'brief.md'), out);
    console.log(out + `\n（已写入 ${join(dir, 'brief.md')}）`);
  },

  check() {
    const dir = args[0] ?? die('用法：hj check <项目目录>');
    const c = load(dir, false);
    console.log(`${c.scenes.length} 个场景，${c.tls.length} 个元素，时长 ${fmtT(c.duration)}，分镜版本 ${c.planHash}\n`);
    for (const sc of c.scenes) console.log(`  ${String(sc.index + 1).padStart(2)}. ${sc.id.padEnd(18)} ${fmtT(sc.t0)}–${fmtT(sc.t1)}  ${sc.beats.length} 拍  ${sc.els.length} 个元素`);
    console.log('');
    const r = printIssues(c.issues);
    const a = approvals(dir);
    console.log(`确认状态：文字分镜 ${a.plan ? (a.plan.planHash === c.planHash ? '✓ 已确认' : '✗ 确认后又改过，需重新确认') : '未确认'}；关键帧 ${a.keyframes ? (a.keyframes.planHash === c.planHash ? '✓ 已确认' : '✗ 需重新确认') : '未确认'}`);
    if (r.errors) process.exit(1);
  },

  plan() {
    const dir = args[0] ?? die('用法：hj plan <项目目录>');
    const c = load(dir);
    const warns = c.issues.filter(i => i.level === 'warn');
    writeFileSync(join(dir, 'storyboard.md'), planMarkdown(c));
    console.log(`✓ 文字分镜表已生成：${join(dir, 'storyboard.md')}（分镜版本 ${c.planHash}）`);
    if (warns.length) console.log(`  注意：还有 ${warns.length} 个警告（hj check 查看）。交给用户之前最好处理掉，或向用户说明。`);
    console.log('把这份分镜表交给用户确认。用户同意之前不要出图、不要渲染。');
  },

  approve() {
    const dir = args[0], stage = args[1] as 'plan' | 'keyframes';
    if (!dir || !['plan', 'keyframes'].includes(stage) || typeof flags.by !== 'string') die('用法：hj approve <项目目录> plan|keyframes --by "<用户的确认原话>"\n只有在用户明确表示同意之后才能运行。');
    const c = load(dir);
    if (stage === 'keyframes') gate(c, 'plan');
    const a = approvals(dir);
    a[stage] = { planHash: c.planHash, by: flags.by, at: new Date().toISOString() };
    writeFileSync(approvalsFile(dir), JSON.stringify(a, null, 2) + '\n');
    console.log(`✓ 已记录用户对${stage === 'plan' ? '文字分镜' : '关键帧'}的确认（分镜版本 ${c.planHash}）。下一步：${stage === 'plan' ? `hj stills ${dir}` : `hj render ${dir}`}`);
  },

  async stills() {
    const dir = args[0] ?? die('用法：hj stills <项目目录> [--scene 场景] [--at 秒数或口播片段] [--guides]');
    const c = load(dir);
    gate(c, 'plan');
    const out = join(dir, 'out', 'stills'); mkdirSync(out, { recursive: true });
    const { cv, ctx } = canvasFor(c, 1);
    const shot = async (t: number, name: string) => { drawFrame(ctx, c, t, env, { subtitles: true, pen: !!c.meta.pen, guides: !!flags.guides }); writeFileSync(join(out, name), await cv.encode('png')); };
    if (flags.at != null) {
      const t = /^[\d.]+$/.test(String(flags.at)) ? +flags.at : resolveAnchor(c.al, String(flags.at)).time;
      await shot(t, `at-${t.toFixed(2)}.png`);
      console.log(`✓ ${join(out, `at-${t.toFixed(2)}.png`)}  （${fmtT(t)}）`);
      return;
    }
    const only = sceneArg(c);
    if (!only) for (const f of readdirSync(out)) if (/^(\d+-|sheet-)/.test(f)) rmSync(join(out, f));
    const sheets: string[] = [];
    for (const sc of c.scenes) {
      if (only && sc !== only) continue;
      const tiles: { t: number; label: string; file: string }[] = [];
      for (let bi = 0; bi < sc.beats.length; bi++) {
        const b = sc.beats[bi];
        const end = Math.max(b.t + 0.05, ...b.actions.map(a => a.t1));
        const t = Math.min(end + 0.03, Math.max(b.tEnd - 0.03, end + 0.03), c.duration - 0.01);
        const file = `${String(sc.index + 1).padStart(2, '0')}-${sc.id}-${String(bi + 1).padStart(2, '0')}.png`;
        await shot(t, file);
        tiles.push({ t, label: `${sc.index + 1}.${bi + 1}  ${fmtT(t)}`, file });
      }
      if (!tiles.length) continue;
      // 联系表：一个场景一张，方便一眼看完
      const k = c.fmt.name === 'portrait' ? 0.3 : 0.34, cols = Math.min(tiles.length, c.fmt.name === 'portrait' ? 5 : 3), rows = Math.ceil(tiles.length / cols);
      const tw = Math.round(c.fmt.W * k), th = Math.round(c.fmt.H * k), pad = 16, cap = 44;
      const sheet = createCanvas(cols * (tw + pad) + pad, rows * (th + cap + pad) + pad), sx = sheet.getContext('2d');
      sx.fillStyle = '#e9ecef'; sx.fillRect(0, 0, sheet.width, sheet.height);
      for (let i = 0; i < tiles.length; i++) {
        const x = pad + (i % cols) * (tw + pad), y = pad + Math.floor(i / cols) * (th + cap + pad);
        drawFrame(ctx, c, tiles[i].t, env, { subtitles: true, pen: false });
        sx.drawImage(cv, x, y + cap, tw, th);
        sx.strokeStyle = '#adb5bd'; sx.lineWidth = 1; sx.strokeRect(x + 0.5, y + cap + 0.5, tw, th);
        const lab = textStrokes(tiles[i].label, { size: 28, color: '#212529' });
        sx.save(); sx.translate(x + 4, y + 6);
        drawStrokes(sx, env, lab.strokes);
        sx.restore();
      }
      const sf = `sheet-${String(sc.index + 1).padStart(2, '0')}-${sc.id}.png`;
      writeFileSync(join(out, sf), await sheet.encode('png')); sheets.push(sf);
    }
    console.log(`✓ 关键帧已输出到 ${out}\n  每个场景一张联系表：${sheets.join('  ')}\n  每一拍的全尺寸图：<场景序号>-<场景>-<拍>.png`);
    console.log('先自己逐张看一遍（重叠、出界、难看、看不懂），改好后再交给用户确认关键帧。');
  },

  async render() {
    const dir = args[0] ?? die('用法：hj render <项目目录> [--scene 场景 | --from 秒 --to 秒] [--draft] [--out 文件]');
    const c = load(dir);
    gate(c, 'plan'); gate(c, 'keyframes');
    const only = sceneArg(c);
    const from = only ? Math.max(0, only.t0 - 0.6) : +(flags.from ?? 0), to = only ? only.t1 : +(flags.to ?? c.duration);
    const draft = !!flags.draft, scale = draft ? 0.5 : 1, fps = draft ? Math.min(15, c.fps) : c.fps;
    const outDir = join(dir, 'out'); mkdirSync(outDir, { recursive: true });
    const name = String(flags.out ?? join(outDir, `${only ? only.id : flags.from || flags.to ? `${from.toFixed(0)}-${to.toFixed(0)}` : 'video'}${draft ? '.draft' : ''}.mp4`));
    const { cv, ctx } = canvasFor(c, scale);
    const inputs: string[] = ['-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${cv.width}x${cv.height}`, '-r', String(fps), '-i', '-'];
    const audio = c.meta.audio ? join(dir, c.meta.audio) : '';
    const amix: string[] = [];
    if (audio && existsSync(audio)) { inputs.push('-ss', String(from), '-t', String(to - from), '-i', audio); amix.push(`[${amix.length + 1}:a]`); }
    else console.log('  （没有配音文件，成片只有落笔音效）');
    if (c.meta.sfx !== false) { const sfx = join(outDir, 'sfx.wav'); writeSfx(c, sfx, c.meta.sfxVolume ?? 1); inputs.push('-ss', String(from), '-t', String(to - from), '-i', sfx); amix.push(`[${amix.length + 1}:a]`); }
    const ff = ['-y', '-loglevel', 'error', ...inputs];
    if (amix.length > 1) ff.push('-filter_complex', `${amix.join('')}amix=inputs=${amix.length}:normalize=0[a]`, '-map', '0:v', '-map', '[a]');
    else if (amix.length === 1) ff.push('-map', '0:v', '-map', '1:a');
    ff.push('-c:v', 'libx264', '-preset', draft ? 'veryfast' : 'medium', '-crf', draft ? '26' : '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', name);
    const p = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });
    p.on('error', () => die('没有找到 ffmpeg，请先安装'));
    const done = new Promise<number>(r => p.on('close', code => r(code ?? 1)));
    const total = Math.round((to - from) * fps), started = Date.now();
    for (let i = 0; i < total; i++) {
      drawFrame(ctx, c, from + i / fps, env, { scale, subtitles: true, pen: !!c.meta.pen });
      if (!p.stdin.write(cv.data())) await new Promise(r => p.stdin.once('drain', r));
      if (i % (fps * 10) === 0 && i) console.log(`  ${fmtT(from + i / fps)} / ${fmtT(to)}  （${((i / total) * 100).toFixed(0)}%，已用 ${((Date.now() - started) / 1000).toFixed(0)}s）`);
    }
    p.stdin.end();
    if ((await done) !== 0) die('ffmpeg 合成失败');
    console.log(`✓ ${name}  （${fmtT(from)}–${fmtT(to)}，${total} 帧，${((Date.now() - started) / 1000).toFixed(0)}s）`);
  },

  assets() {
    const what = args[0];
    if (what === 'icons') {
      const q = args.slice(1).join(' ') || die('用法：hj assets icons <英文关键词…>   例：hj assets icons money bag');
      const r = searchIcons(q, +(flags.limit ?? 40));
      if (!r.length) console.log('没有匹配的图标，换个英文近义词试试');
      for (const it of r) console.log(`${it.name.padEnd(30)} ${it.category.padEnd(14)} ${it.tags}`);
    } else if (what === 'doodles') {
      for (const d of doodleDirs(args[1])) for (const f of readdirSync(d).filter(f => f.endsWith('.yaml')).sort()) { const y = YAML.parse(readFileSync(join(d, f), 'utf8')); console.log(`${f.replace('.yaml', '').padEnd(18)} ${String(y.desc ?? '').padEnd(30)} ${y.vars ? '可调：' + Object.keys(y.vars).join(' ') : ''}`); }
    } else if (what === 'figure') {
      console.log('姿势 pose：' + Object.keys(POSES).join('  '));
      console.log('表情 face：' + Object.keys(FACES).filter(f => f !== 'none').join('  '));
      console.log('配饰 wear：' + ACCESSORIES.join('  '));
    } else if (what === 'colors') console.log(Object.entries(THEME.colors).map(([k, v]) => `${k} ${v}`).join('\n'));
    else if (what === 'sheet') return assetSheet();
    else die('用法：hj assets icons <关键词> | doodles [项目目录] | figure | colors | sheet [--out 文件]');
  },

  'fake-align'() {
    const f = args[0] ?? die('用法：hj fake-align <口播稿.txt> [--cps 4.5] > alignment.json   （没有配音时先造一份匀速时间表打草稿）');
    process.stdout.write(JSON.stringify(fakeAlignment(readFileSync(f, 'utf8'), +(flags.cps ?? 4.5)), null, 1));
  },
};

/** 内置素材一览图：所有姿势、表情、手绘件画在一张图上，供挑选 */
async function assetSheet() {
  const { buildElement } = await import('../core/elements');
  const fmt = { ...FORMATS.landscape, board: { x: 0, y: 0, w: 100000, h: 100000 } };
  const els = new Map<string, any>(), ctxB = { scene: 'sheet', fmt, els };
  const items: { el: any; label: string }[] = [];
  for (const p of Object.keys(POSES)) items.push({ el: buildElement(ctxB, 'p' + p, { figure: p, size: 230, at: [0, 0] }), label: p });
  for (const f of Object.keys(FACES).filter(f => f !== 'none')) items.push({ el: buildElement(ctxB, 'f' + f, { figure: 'stand', face: f, size: 230, at: [0, 0] }), label: 'face:' + f });
  for (const a of ACCESSORIES) items.push({ el: buildElement(ctxB, 'a' + a, { figure: 'stand', wear: [a], accent: 'blue', size: 230, at: [0, 0] }), label: 'wear:' + a });
  for (const d of doodleDirs()) for (const f of readdirSync(d).filter(f => f.endsWith('.yaml')).sort()) { const n = f.replace('.yaml', ''); items.push({ el: buildElement(ctxB, 'd' + n, { doodle: n, size: 200, at: [0, 0] }), label: n }); }
  const cols = 8, cw = 290, chh = 330, rows = Math.ceil(items.length / cols);
  const cv = createCanvas(cols * cw, rows * chh), ctx = cv.getContext('2d');
  ctx.fillStyle = THEME.paper; ctx.fillRect(0, 0, cv.width, cv.height);
  const c: any = { fmt: { ...fmt, W: cv.width, H: cv.height }, cams: [], scenes: [{ origin: [0, 0] }], tls: [], erases: [], subs: [] };
  items.forEach((it, i) => {
    const x = (i % cols) * cw + cw / 2, y = Math.floor(i / cols) * chh + 140, b = it.el.box;
    ctx.save(); ctx.translate(x - (b.x + b.w / 2), y - (b.y + b.h / 2));
    drawStrokes(ctx, env, it.el.strokes);
    ctx.restore(); ctx.globalAlpha = 1;
    const lab = textStrokes(it.label, { size: 26, color: '#495057' });
    ctx.save(); ctx.translate(x - lab.w / 2, Math.floor(i / cols) * chh + chh - 50);
    drawStrokes(ctx, env, lab.strokes);
    ctx.restore();
  });
  void c;
  const out = String(flags.out ?? 'assets-sheet.png');
  writeFileSync(out, await cv.encode('png'));
  console.log(`✓ ${out}`);
}

if (!cmd || !commands[cmd]) {
  console.log(`画讲 hj —— 把带时间表的口播做成“边画边讲”的手绘视频

  hj init <目录> --voice <配音材料>   建项目，导入时间表
  hj brief <目录>                     口播逐句时间简报（写分镜前先读）
  hj check <目录>                     编译 + 质量检查（随时跑，很快）
  hj plan <目录>                      生成文字分镜表 storyboard.md → 交用户确认
  hj approve <目录> plan|keyframes --by "<用户确认原话>"
  hj stills <目录> [--scene x]        出关键帧（需先确认文字分镜）→ 交用户确认
  hj render <目录> [--scene x] [--draft]   渲染视频（需先确认关键帧）
  hj assets icons <关键词> | doodles | figure | colors | sheet
  hj fake-align <稿.txt>              没配音时造匀速时间表打草稿

完整工作流见 AGENTS.md`);
  process.exit(cmd ? 1 : 0);
}
await commands[cmd]();
