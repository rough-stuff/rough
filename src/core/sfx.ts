// 落笔音效：按每一笔的起止时间合成“沙沙”声，擦除时合成一段更闷的摩擦声。
import { writeFileSync } from 'node:fs';
import type { Compiled } from './compile';
import { rng } from './strokes';

export function penEvents(c: Compiled): { t0: number; t1: number; kind: 'pen' | 'erase'; gain: number }[] {
  const ev: { t0: number; t1: number; kind: 'pen' | 'erase'; gain: number }[] = [];
  for (const tl of c.tls) {
    if (!tl.sched) continue;
    tl.el.strokes.forEach((s, i) => {
      const t0 = tl.sched![2 * i], t1 = tl.sched![2 * i + 1];
      if (t1 - t0 > 0.004) ev.push({ t0, t1, kind: 'pen', gain: s.kind === 'glyph' || s.kind === 'wipe' ? 0.75 : (s as any).under ? 0.55 : 1 });
    });
  }
  for (const g of c.erases) if (g.style === 'wipe') ev.push({ t0: g.t0, t1: g.t1, kind: 'erase', gain: 1 });
  return ev;
}

export function writeSfx(c: Compiled, file: string, volume = 0.5): void {
  const sr = 48000, n = Math.ceil(c.duration * sr), buf = new Float32Array(n), rand = rng(20240229);
  for (const e of penEvents(c)) {
    const a = Math.max(0, Math.floor(e.t0 * sr)), b = Math.min(n, Math.ceil(e.t1 * sr)), len = b - a;
    if (len <= 0) continue;
    // 带通噪声：笔 ≈ 2.5–6kHz，板擦 ≈ 400–1500Hz
    let lp1 = 0, lp2 = 0;
    const hi = e.kind === 'pen' ? 0.55 : 0.16, lo = e.kind === 'pen' ? 0.22 : 0.04;
    const amp = (e.kind === 'pen' ? 0.11 : 0.2) * e.gain * volume, att = Math.min(len * 0.25, sr * 0.012), rel = Math.min(len * 0.4, sr * 0.03);
    const wob = 18 + rand() * 20, ph = rand() * 6.28;
    for (let i = 0; i < len; i++) {
      const x = rand() * 2 - 1;
      lp1 += hi * (x - lp1); lp2 += lo * (lp1 - lp2);
      const env = Math.min(1, i / att, (len - i) / rel) * (0.72 + 0.28 * Math.sin(ph + (i / sr) * wob * 6.28));
      buf[a + i] += (lp1 - lp2) * amp * env;
    }
  }
  const pcm = Buffer.alloc(44 + n * 2);
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + n * 2, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(sr, 24); pcm.writeUInt32LE(sr * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf[i])) * 32767), 44 + i * 2);
  writeFileSync(file, pcm);
}
