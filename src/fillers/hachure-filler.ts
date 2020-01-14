import { PatternFiller, RenderHelper } from './filler-interface';
import { ResolvedOptions, OpSet, Op } from '../core';
import { Point, Line } from '../geometry';
import { polygonHachureLines } from './scan-line-hachure';

export class HachureFiller implements PatternFiller {
  private helper: RenderHelper;

  constructor(helper: RenderHelper) {
    this.helper = helper;
  }

  fillPolygon(points: Point[], o: ResolvedOptions): OpSet {
    return this._fillPolygon(points, o);
  }

  protected _fillPolygon(points: Point[], o: ResolvedOptions, connectEnds: boolean = false): OpSet {
    const lines = polygonHachureLines(points, o);
    const ops = this.renderLines(lines, o, connectEnds);
    return { type: 'fillSketch', ops };
  }

  private renderLines(lines: Line[], o: ResolvedOptions, connectEnds: boolean): Op[] {
    let ops: Op[] = [];
    let prevPoint: Point | null = null;
    for (const line of lines) {
      ops = ops.concat(this.helper.doubleLineOps(line[0][0], line[0][1], line[1][0], line[1][1], o));
      if (connectEnds && prevPoint) {
        ops = ops.concat(this.helper.doubleLineOps(prevPoint[0], prevPoint[1], line[0][0], line[0][1], o));
      }
      prevPoint = line[1];
    }
    return ops;
  }
}