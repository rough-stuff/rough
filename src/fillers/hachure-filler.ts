import { PatternFiller, RenderHelper } from './filler-interface';
import { ResolvedOptions, OpSet, Op } from '../core';
import { Point, Line } from '../geometry';
import { hachureLinesForPolygon, hachureLinesForEllipse } from './filler-utils';

export class HachureFiller implements PatternFiller {
  private helper: RenderHelper;

  constructor(helper: RenderHelper) {
    this.helper = helper;
  }

  fillPolygon(points: Point[], o: ResolvedOptions): OpSet {
    return this._fillPolygon(points, o);
  }

  fillEllipse(cx: number, cy: number, width: number, height: number, o: ResolvedOptions): OpSet {
    return this._fillEllipse(cx, cy, width, height, o);
  }

  fillArc(_x: number, _y: number, _width: number, _height: number, _start: number, _stop: number, _o: ResolvedOptions): OpSet | null {
    return null;
  }

  protected _fillPolygon(points: Point[], o: ResolvedOptions, connectEnds: boolean = false): OpSet {
    const lines = hachureLinesForPolygon(points, o);
    const ops = this.renderLines(lines, o, connectEnds);
    return { type: 'fillSketch', ops };
  }

  protected _fillEllipse(cx: number, cy: number, width: number, height: number, o: ResolvedOptions, connectEnds: boolean = false): OpSet {
    const lines = hachureLinesForEllipse(this.helper, cx, cy, width, height, o);
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