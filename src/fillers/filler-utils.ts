import { Point, Segment, Line } from '../geometry';
import { ResolvedOptions } from '../core';
import { HachureIterator } from '../utils/hachure';
import { RenderHelper } from './filler-interface';

export function lineLength(line: Line): number {
  const p1 = line[0];
  const p2 = line[1];
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}

export function getIntersectingLines(line: number[], points: Point[]): Point[] {
  const intersections: Point[] = [];
  const s1 = new Segment([line[0], line[1]], [line[2], line[3]]);
  for (let i = 0; i < points.length; i++) {
    const s2 = new Segment(points[i], points[(i + 1) % points.length]);
    if (s1.intersects(s2)) {
      intersections.push([s1.xi, s1.yi]);
    }
  }
  return intersections;
}

export function affine(x: number, y: number, cx: number, cy: number, sinAnglePrime: number, cosAnglePrime: number, R: number): Point {
  const A = -cx * cosAnglePrime - cy * sinAnglePrime + cx;
  const B = R * (cx * sinAnglePrime - cy * cosAnglePrime) + cy;
  const C = cosAnglePrime;
  const D = sinAnglePrime;
  const E = -R * sinAnglePrime;
  const F = R * cosAnglePrime;
  return [
    A + C * x + D * y,
    B + E * x + F * y
  ];
}

export function hachureLinesForPolygon(points: Point[], o: ResolvedOptions): Line[] {
  const ret: Line[] = [];
  if (points && points.length) {
    let left = points[0][0];
    let right = points[0][0];
    let top = points[0][1];
    let bottom = points[0][1];
    for (let i = 1; i < points.length; i++) {
      left = Math.min(left, points[i][0]);
      right = Math.max(right, points[i][0]);
      top = Math.min(top, points[i][1]);
      bottom = Math.max(bottom, points[i][1]);
    }
    const angle = o.hachureAngle;
    let gap = o.hachureGap;
    if (gap < 0) {
      gap = o.strokeWidth * 4;
    }
    gap = Math.max(gap, 0.1);
    const radPerDeg = Math.PI / 180;
    const hachureAngle = (angle % 180) * radPerDeg;
    const cosAngle = Math.cos(hachureAngle);
    const sinAngle = Math.sin(hachureAngle);
    const tanAngle = Math.tan(hachureAngle);
    const it = new HachureIterator(top - 1, bottom + 1, left - 1, right + 1, gap, sinAngle, cosAngle, tanAngle);
    let rect: number[] | null;
    while ((rect = it.nextLine()) != null) {
      const lines = getIntersectingLines(rect, points);
      for (let i = 0; i < lines.length; i++) {
        if (i < (lines.length - 1)) {
          const p1 = lines[i];
          const p2 = lines[i + 1];
          ret.push([p1, p2]);
        }
      }
    }
  }
  return ret;
}

export function hachureLinesForEllipse(helper: RenderHelper, cx: number, cy: number, width: number, height: number, o: ResolvedOptions): Line[] {
  const ret: Line[] = [];
  let rx = Math.abs(width / 2);
  let ry = Math.abs(height / 2);
  rx += helper.randOffset(rx * 0.05, o);
  ry += helper.randOffset(ry * 0.05, o);
  const angle = o.hachureAngle;
  let gap = o.hachureGap;
  if (gap <= 0) {
    gap = o.strokeWidth * 4;
  }
  let fweight = o.fillWeight;
  if (fweight < 0) {
    fweight = o.strokeWidth / 2;
  }
  const radPerDeg = Math.PI / 180;
  const hachureAngle = (angle % 180) * radPerDeg;
  const tanAngle = Math.tan(hachureAngle);
  const aspectRatio = ry / rx;
  const hyp = Math.sqrt(aspectRatio * tanAngle * aspectRatio * tanAngle + 1);
  const sinAnglePrime = aspectRatio * tanAngle / hyp;
  const cosAnglePrime = 1 / hyp;
  const gapPrime = gap / ((rx * ry / Math.sqrt((ry * cosAnglePrime) * (ry * cosAnglePrime) + (rx * sinAnglePrime) * (rx * sinAnglePrime))) / rx);
  let halfLen = Math.sqrt((rx * rx) - (cx - rx + gapPrime) * (cx - rx + gapPrime));
  for (let xPos = cx - rx + gapPrime; xPos < cx + rx; xPos += gapPrime) {
    halfLen = Math.sqrt((rx * rx) - (cx - xPos) * (cx - xPos));
    const p1 = affine(xPos, cy - halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
    const p2 = affine(xPos, cy + halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
    ret.push([p1, p2]);
  }
  return ret;
}