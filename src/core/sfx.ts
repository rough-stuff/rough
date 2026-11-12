// 落笔音效。默认是“稀疏”模式：每落一次笔只有一声很轻的“嗒—沙”，而且两声之间至少隔开一段时间。
// 合成的声音终归不如真实录音自然：在 project.yaml 里用 sfxSamples 指向自己的录音即可替换。
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Compiled } from './compile';
import { rng } from './strokes';

export interface Cue { t: number; kind: 'pen' | 'mark' | 'erase'; dur: number }

/** sparse：每个元素落笔时一声；full：每一段书写都有声（更密） */
export function cues(c: Compiled, mode: 'sparse' | 'full'): Cue[] {
  const raw: Cue[] = [];
  for (const tl of c.tls) {
    if (tl.drawT0 == null) continue;
    const kind = tl.el.kind === 'mark' ? 'mark' : 'pen';
    if (mode === 'sparse') raw.push({ t: tl.drawT0, kind, dur: kind === 'mark' ? 0.28 : 0.16 });
    else raw.push({ t: tl.drawT0, kind, dur: Math.min(0.6, tl.drawT1! - tl.drawT0) });
  }
  raw.sort((a, b) => a.t - b.t);
  const gap = mode === 'sparse' ? 0.9 : 0.35, out: Cue[] = [];
  for (const q of raw) { const last = out[out.length - 1]; if (!last || q.t - last.t >= gap || (q.kind === 'mark' && last.kind !== 'mark' && q.t - last.t >= 0.4)) out.push(q); }
  for (const g of c.erases) if (g.style === 'wipe') out.push({ t: g.t0, kind: 'erase', dur: g.t1 - g.t0 });
  return out.sort((a, b) => a.t - b.t);
}

function readWav(file: string): Float32Array | null {
  const b = readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF') return null;
  let p = 12, ch = 1, sr = 48000, bits = 16, data: Buffer | null = null;
  while (p + 8 <= b.length) {
    const id = b.toString('ascii', p, p + 4), size = b.readUInt32LE(p + 4);
    if (id === 'fmt ') { ch = b.readUInt16LE(p + 10); sr = b.readUInt32LE(p + 12); bits = b.readUInt16LE(p + 22); }
    else if (id === 'data') { data = b.subarray(p + 8, p + 8 + size); break; }
    p += 8 + size + (size & 1);
  }
  if (!data || bits !== 16) return null;
  const n = Math.floor(data.length / 2 / ch), mono = new Float32Array(n);
  for (let i = 0; i < n; i++) { let v = 0; for (let k = 0; k < ch; k++) v += data.readInt16LE((i * ch + k) * 2); mono[i] = v / ch / 32768; }
  if (sr === 48000) return mono;
  const m = Math.floor((n * 48000) / sr), out = new Float32Array(m); // 线性重采样
  for (let i = 0; i < m; i++) { const x = (i * sr) / 48000, j = Math.floor(x), f = x - j; out[i] = mono[j] * (1 - f) + (mono[Math.min(n - 1, j + 1)] ?? 0) * f; }
  return out;
}

export function writeSfx(c: Compiled, file: string): { count: number; mode: string } {
  const mode: 'sparse' | 'full' = c.meta.sfx === 'full' ? 'full' : 'sparse', volume = c.meta.sfxVolume ?? 1;
  const sr = 48000, n = Math.ceil(c.duration * sr), buf = new Float32Array(n), rand = rng(20240229);
  const samples: Record<string, Float32Array | null> = {};
  for (const k of ['pen', 'mark', 'erase']) { const f = c.meta.sfxSamples?.[k]; samples[k] = f && existsSync(join(c.dir, f)) ? readWav(join(c.dir, f)) : null; }
  const list = cues(c, mode);
  for (const q of list) {
    const a = Math.max(0, Math.floor(q.t * sr)), smp = samples[q.kind];
    if (smp) { const g = (0.8 + rand() * 0.3) * volume; for (let i = 0; i < smp.length && a + i < n; i++) buf[a + i] += smp[i] * g; continue; }
    const len = Math.min(n - a, Math.ceil((q.dur + 0.12) * sr));
    if (len <= 0) continue;
    if (q.kind === 'erase') { // 一声低而软的“呼”
      let l1 = 0, l2 = 0;
      for (let i = 0; i < len; i++) { const x = rand() * 2 - 1; l1 += 0.09 * (x - l1); l2 += 0.02 * (l1 - l2); const k = i / len; buf[a + i] += (l1 - l2) * 0.16 * volume * Math.sin(Math.PI * k) ** 2; }
      continue;
    }
    // “嗒”：笔尖碰到纸的一下低而短的轻响；“沙”：紧跟着一小段迅速消失的摩擦声
    const tapF = 150 + rand() * 60, long = q.kind === 'mark', tau = (long ? 0.085 : 0.045) * sr, amp = (long ? 0.05 : 0.04) * (0.8 + rand() * 0.4) * volume;
    let l1 = 0, l2 = 0;
    for (let i = 0; i < len; i++) {
      const x = rand() * 2 - 1;
      l1 += 0.22 * (x - l1); l2 += 0.07 * (l1 - l2);
      const att = Math.min(1, i / (0.004 * sr));
      buf[a + i] += (l1 - l2) * amp * att * Math.exp(-i / tau) + Math.sin((6.2832 * tapF * i) / sr) * amp * 0.5 * Math.exp(-i / (0.012 * sr));
    }
  }
  const pcm = Buffer.alloc(44 + n * 2);
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + n * 2, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(sr, 24); pcm.writeUInt32LE(sr * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf[i])) * 32767), 44 + i * 2);
  writeFileSync(file, pcm);
  return { count: list.length, mode };
}
