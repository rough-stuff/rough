import { hachureLines } from 'hachure-fill';
import { Point, Line } from '../geometry';
import { ResolvedOptions } from '../core';

export function polygonHachureLines(polygonList: Point[][], o: ResolvedOptions): Line[] {
  const angle = o.hachureAngle + 90;
  let gap = o.hachureGap;
  if (gap < 0) {
    gap = o.strokeWidth * 4;
  }
  gap = Math.round(Math.max(gap, 0.1));
  let skipOffset = 1;
  if (o.roughness >= 1) {
    if ((o.randomizer?.next() || Math.random()) > 0.7) {
      skipOffset = gap;
    }
  }
  return hachureLines(polygonList, gap, angle, skipOffset || 1);
}