import { PatternFiller, RenderHelper } from './filler-interface';
import { ResolvedOptions, OpSet, Op } from '../core';
import { Point, Line, lineLength, lineIntersection, doIntersect, isPointInPolygon } from '../geometry';
import { polygonHachureLines } from './scan-line-hachure';

interface IntersectionInfo {
  point: Point;
  distance: number;
}

export class HachureFiller implements PatternFiller {
  private helper: RenderHelper;

  constructor(helper: RenderHelper) {
    this.helper = helper;
  }

  fillPolygon(points: Point[], o: ResolvedOptions): OpSet {
    return this._fillPolygon(points, o);
  }

  protected _fillPolygon(points: Point[], o: ResolvedOptions, connectEnds: boolean = false): OpSet {
    let lines = polygonHachureLines(points, o);
    if (connectEnds) {
      const connectingLines = this.connectingLines(points, lines);
      lines = lines.concat(connectingLines);
    }
    const ops = this.renderLines(lines, o);
    return { type: 'fillSketch', ops };
  }

  private renderLines(lines: Line[], o: ResolvedOptions): Op[] {
    const ops: Op[] = [];
    for (const line of lines) {
      ops.push(...this.helper.doubleLineOps(line[0][0], line[0][1], line[1][0], line[1][1], o));
    }
    return ops;
  }

  private connectingLines(polygon: Point[], lines: Line[]): Line[] {
    const result: Line[] = [];
    if (lines.length > 1) {
      for (let i = 1; i < lines.length; i++) {
        const prev = lines[i - 1];
        if (lineLength(prev) < 3) {
          continue;
        }
        const current = lines[i];
        const segment: Line = [current[0], prev[1]];
        if (lineLength(segment) > 3) {
          const segSplits = this.splitOnIntersections(polygon, segment);
          result.push(...segSplits);
        }
      }
    }
    return result;
  }

  private midPointInPolygon(polygon: Point[], segment: Line): boolean {
    return isPointInPolygon(polygon, (segment[0][0] + segment[1][0]) / 2, (segment[0][1] + segment[1][1]) / 2);
  }

  private splitOnIntersections(polygon: Point[], segment: Line): Line[] {
    const error = Math.max(5, lineLength(segment) * 0.1);
    const intersections: IntersectionInfo[] = [];
    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];
      if (doIntersect(p1, p2, ...segment)) {
        const ip = lineIntersection(p1, p2, segment[0], segment[1]);
        if (ip) {
          const d0 = lineLength([ip, segment[0]]);
          const d1 = lineLength([ip, segment[1]]);
          if (d0 > error && d1 > error) {
            intersections.push({
              point: ip,
              distance: d0,
            });
          }
        }
      }
    }
    if (intersections.length > 1) {
      const ips = intersections.sort((a, b) => a.distance - b.distance).map<Point>((d) => d.point);
      if (!isPointInPolygon(polygon, ...segment[0])) {
        ips.shift();
      }
      if (!isPointInPolygon(polygon, ...segment[1])) {
        ips.pop();
      }
      if (ips.length <= 1) {
        if (this.midPointInPolygon(polygon, segment)) {
          return [segment];
        } else {
          return [];
        }
      }
      const spoints = [segment[0], ...ips, segment[1]];
      const slines: Line[] = [];
      for (let i = 0; i < (spoints.length - 1); i += 2) {
        const subSegment: Line = [spoints[i], spoints[i + 1]];
        if (this.midPointInPolygon(polygon, subSegment)) {
          slines.push(subSegment);
        }
      }
      return slines;
    } else if (this.midPointInPolygon(polygon, segment)) {
      return [segment];
    } else {
      return [];
    }
  }
}
