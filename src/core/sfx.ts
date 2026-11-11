// 落笔音效：很轻的一层“笔在纸上走”的沙沙声。按元素为单位连成一段，不是每一笔响一下。
import { writeFileSync } from 'node:fs';
import type { Compiled } from './compile';
import { rng } from './strokes';

export interface PenEvent { t0: number; t1: number; kind: 'pen' | 'erase' }

export function penEvents(c: Compiled): PenEvent[] {
  const raw: PenEvent[] = [];
  for (const tl of c.tls) {
    if (!tl.sched) continue;
    tl.el.strokes.forEach((s, i) => {
      if ((s as any).under) return; // 涂色不出声
      const t0 = tl.sched![2 * i], t1 = tl.sched![2 * i + 1];
      if (t1 - t0 > 0.004) raw.push({ t0, t1, kind: 'pen' });
    });
  }
  raw.sort((a, b) => a.t0 - b.t0);
  // 间隔很短的笔画并成一段，听起来是“写了一会儿”，而不是一串哒哒声
  const ev: PenEvent[] = [];
  for (const e of raw) { const last = ev[ev.length - 1]; if (last && e.t0 - last.t1 < 0.2) last.t1 = Math.max(last.t1, e.t1); else ev.push({ ...e }); }
  for (const g of c.erases) if (g.style === 'wipe') ev.push({ t0: g.t0, t1: g.t1, kind: 'erase' });
  return ev;
}

export function writeSfx(c: Compiled, file: string, volume = 1): void {
  const sr = 48000, n = Math.ceil(c.duration * sr), buf = new Float32Array(n), rand = rng(20240229);
  for (const e of penEvents(c)) {
    const a = Math.max(0, Math.floor(e.t0 * sr)), b = Math.min(n, Math.ceil(e.t1 * sr)), len = b - a;
    if (len <= 0) continue;
    // 柔和的带通噪声：笔 ≈ 0.9–3kHz，板擦 ≈ 300–1200Hz
    let lp1 = 0, lp2 = 0;
    const hi = e.kind === 'pen' ? 0.28 : 0.13, lo = e.kind === 'pen' ? 0.1 : 0.035;
    const amp = (e.kind === 'pen' ? 0.07 : 0.14) * volume, att = Math.min(len * 0.3, sr * 0.05), rel = Math.min(len * 0.45, sr * 0.12);
    const f1 = 2.5 + rand() * 2.5, f2 = 7 + rand() * 5, p1 = rand() * 6.28, p2 = rand() * 6.28;
    for (let i = 0; i < len; i++) {
      const x = rand() * 2 - 1;
      lp1 += hi * (x - lp1); lp2 += lo * (lp1 - lp2);
      const tt = i / sr;
      const env = Math.min(1, i / att, (len - i) / rel) * (0.62 + 0.26 * Math.sin(p1 + tt * f1 * 6.28) + 0.12 * Math.sin(p2 + tt * f2 * 6.28));
      buf[a + i] += (lp1 - lp2) * amp * env;
    }
  }
  const pcm = Buffer.alloc(44 + n * 2);
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + n * 2, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(sr, 24); pcm.writeUInt32LE(sr * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf[i])) * 32767), 44 + i * 2);
  writeFileSync(file, pcm);
}
