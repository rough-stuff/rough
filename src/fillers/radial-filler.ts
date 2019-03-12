import { PatternFiller, RenderHelper } from './filler-interface';
import { ResolvedOptions, OpSet, Op } from '../core';
import { Point, Line, linerIntersection, centroid } from '../geometry';

export class RadialFiller implements PatternFiller {
  private helper: RenderHelper;

  constructor(helper: RenderHelper) {
    this.helper = helper;
  }

  fillPolygon(points: Point[], o: ResolvedOptions): OpSet {
    const xMinMax: Point = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
    const yMinMax: Point = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
    points.forEach((p) => {
      if (p[0] < xMinMax[0]) {
        xMinMax[0] = p[0];
      }
      if (p[0] > xMinMax[1]) {
        xMinMax[1] = p[0];
      }
      if (p[1] < yMinMax[0]) {
        yMinMax[0] = p[1];
      }
      if (p[1] > yMinMax[1]) {
        yMinMax[1] = p[1];
      }
    });
    const center: Point = centroid(points);
    console.log('centroid', center);
    const radius = Math.sqrt(Math.pow(center[0] - xMinMax[0], 2) + Math.pow(center[1] - yMinMax[0], 2));
    let gap = o.hachureGap;
    if (gap < 0) {
      gap = o.strokeWidth * 4;
    }

    const lines: Line[] = [];
    if (points.length > 2) {
      for (let i = 0; i < points.length; i++) {
        if (i === (points.length - 1)) {
          lines.push([points[i], points[0]]);
        } else {
          lines.push([points[i], points[i + 1]]);
        }
      }
    }

    let ops: Op[] = [];
    if (lines.length) {
      const count = Math.max(1, Math.PI * radius / gap);
      const intersectingLines: Line[] = [];
      const lineKeys: string[] = [];
      for (let i = 0; i < count; i++) {
        const angle = i * Math.PI / count;
        const cl: Line = [center, [center[0] + radius * Math.cos(angle), center[1] + radius * Math.sin(angle)]];
        const intersections: Point[] = [];
        const pointKeys: string[] = [];
        lines.forEach((l) => {
          const intersection = linerIntersection(l, cl);
          if (intersection) {
            if (intersection[0] >= xMinMax[0] && intersection[0] <= xMinMax[1]) {
              if (intersection[1] >= yMinMax[0] && intersection[1] <= yMinMax[1]) {
                const key = intersection.join(',');
                if (pointKeys.indexOf(key) < 0) {
                  intersections.push(intersection);
                  pointKeys.push(key);
                }
              }
            }
          }
        });
        if (intersections.length > 1) {
          const a = intersections[0];
          const b = intersections[1];
          const k1 = a.join(',') + '-' + b.join(',');
          const k2 = b.join(',') + '-' + a.join(',');
          if (lineKeys.indexOf(k1) < 0 && lineKeys.indexOf(k2) < 0) {
            lineKeys.push(k1);
            lineKeys.push(k2);
            intersectingLines.push([a, b]);
          }
        }
      }
      intersectingLines.forEach((line) => {
        const pa = line[0];
        const pb = line[1];
        ops = ops.concat(this.helper.doubleLineOps(pa[0], pa[1], pb[0], pb[1], o));
      });
    }
    return { type: 'fillSketch', ops };
  }

  fillEllipse(cx: number, cy: number, width: number, height: number, o: ResolvedOptions): OpSet {
    const center: Point = [cx, cy];
    const a = width / 2;
    const b = height / 2;
    const radius = Math.max(width / 2, height / 2);
    let gap = o.hachureGap;
    if (gap < 0) {
      gap = o.strokeWidth * 4;
    }
    let ops: Op[] = [];
    const count = Math.max(1, Math.PI * radius / gap);
    const intersectingLines: Line[] = [];
    const lineKeys: string[] = [];
    for (let i = 0; i < count; i++) {
      const angle = i * Math.PI / count;
      const x0 = radius * Math.cos(angle);
      const y0 = radius * Math.sin(angle);
      const d = Math.sqrt((a * a * y0 * y0) + (b * b * x0 * x0));
      const xp = (a * b * x0) / d;
      const yp = (a * b * y0) / d;
      const p1: Point = [center[0] + xp, center[1] + yp];
      const p2: Point = [center[0] - xp, center[1] - yp];
      const k1 = p1.join(',') + '-' + p2.join(',');
      const k2 = p2.join(',') + '-' + p1.join(',');
      if (lineKeys.indexOf(k1) < 0 && lineKeys.indexOf(k2) < 0) {
        lineKeys.push(k1);
        lineKeys.push(k2);
        intersectingLines.push([p1, p2]);
      }
    }
    intersectingLines.forEach((line) => {
      const pa = line[0];
      const pb = line[1];
      ops = ops.concat(this.helper.doubleLineOps(pa[0], pa[1], pb[0], pb[1], o));
    });
    return { type: 'fillSketch', ops };
  }
}