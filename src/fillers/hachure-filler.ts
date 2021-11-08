import { PatternFiller, RenderHelper } from './filler-interface';
import { ResolvedOptions, OpSet, Op } from '../core';
import { Point, Line } from '../geometry';
import { polygonHachureLines } from './scan-line-hachure';

export class HachureFiller implements PatternFiller {
  private helper: RenderHelper;

  constructor(helper: RenderHelper) {
    this.helper = helper;
  }

  fillPolygons(polygonList: Point[][], o: ResolvedOptions): OpSet {
    return this._fillPolygons(polygonList, o);
  }

  protected _fillPolygons(polygonList: Point[][], o: ResolvedOptions): OpSet {
    const lines = polygonHachureLines(polygonList, o);
    const ops = this.renderLines(lines, o);
    return { type: 'fillSketch', ops };
  }

  protected renderLines(lines: Line[], o: ResolvedOptions): Op[] {
    const ops: Op[] = [];
    for (const line of lines) {
      ops.push(...this.helper.doubleLineOps(line[0][0], line[0][1], line[1][0], line[1][1], o));
    }
    return ops;
  }


}
