// 线条图标：Tabler Icons（MIT，5000+）。把 24px 的路径放大后交给 rough 抖成手绘线。
import { readFileSync, existsSync } from 'node:fs';
import { pkgDir } from './pkg';
import { parsePath, absolutize, normalize, serialize } from 'path-data-parser';
import { R, type Stroke, type Style } from './strokes';

let dir = '';
const root = () => dir || (dir = pkgDir('@tabler/icons'));

export function iconExists(name: string): boolean { return existsSync(`${root()}icons/outline/${name}.svg`); }

export function scalePath(d: string, k: number, dx = 0, dy = 0): string {
  const segs = normalize(absolutize(parsePath(d)));
  for (const s of segs) for (let i = 0; i < s.data.length; i += 2) { s.data[i] = +(s.data[i] * k + dx).toFixed(2); s.data[i + 1] = +(s.data[i + 1] * k + dy).toFixed(2); }
  return serialize(segs);
}

/** 图标笔画，画在以 (cx,cy) 为中心、边长 size 的方框里 */
export function iconStrokes(name: string, cx: number, cy: number, size: number, st: Style): Stroke[] {
  const svg = readFileSync(`${root()}icons/outline/${name}.svg`, 'utf8');
  const k = size / 24, out: Stroke[] = [];
  let i = 0;
  for (const m of svg.matchAll(/<path\b([^>]*)\/>/g)) {
    if (/stroke="none"/.test(m[1])) continue;
    const d = m[1].match(/\bd="([^"]+)"/)?.[1];
    if (!d) continue;
    // 填充只用在第一条路径上，避免细节被涂花
    out.push(...R.path(scalePath(d, k, cx - size / 2, cy - size / 2), { ...st, seed: st.seed + i, fill: i === 0 ? st.fill : undefined }));
    i++;
  }
  return out;
}

let meta: Record<string, { name: string; category?: string; tags?: (string | number)[] }> | null = null;
export function searchIcons(q: string, limit = 40): { name: string; category: string; tags: string }[] {
  meta ??= JSON.parse(readFileSync(`${root()}icons.json`, 'utf8'));
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const scored: { name: string; category: string; tags: string; score: number }[] = [];
  for (const it of Object.values(meta!)) {
    if (!iconExists(it.name)) continue;
    const tags = (it.tags ?? []).map(String);
    let score = 0;
    for (const t of terms) {
      if (it.name === t) score += 10;
      else if (it.name.split('-').includes(t)) score += 5;
      else if (it.name.includes(t)) score += 3;
      else if (tags.some(x => x.toLowerCase() === t)) score += 2;
      else if (tags.some(x => x.toLowerCase().includes(t)) || (it.category ?? '').toLowerCase().includes(t)) score += 1;
      else { score = -1; break; }
    }
    if (score > 0) scored.push({ name: it.name, category: it.category ?? '', tags: tags.slice(0, 8).join(','), score: score - it.name.length * 0.01 });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
