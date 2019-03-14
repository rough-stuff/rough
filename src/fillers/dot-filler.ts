import { PatternFiller, RenderHelper } from './filler-interface';
import { ResolvedOptions, OpSet, Op } from '../core';
import { Point, Line } from '../geometry';
import { hachureLinesForPolygon, hachureLinesForEllipse, lineLength } from './filler-utils';

export class DotFiller implements PatternFiller {
  private helper: RenderHelper;

  constructor(helper: RenderHelper) {
    this.helper = helper;
  }

  fillPolygon(points: Point[], o: ResolvedOptions): OpSet {
    o = Object.assign({}, o, { curveStepCount: 4, hachureAngle: 0 });
    const lines = hachureLinesForPolygon(points, o);
    return this.dotsOnLines(lines, o);
  }

  fillEllipse(cx: number, cy: number, width: number, height: number, o: ResolvedOptions): OpSet {
    o = Object.assign({}, o, { curveStepCount: 4, hachureAngle: 0 });
    const lines = hachureLinesForEllipse(this.helper, cx, cy, width, height, o);
    return this.dotsOnLines(lines, o);
  }

  fillArc(_x: number, _y: number, _width: number, _height: number, _start: number, _stop: number, _o: ResolvedOptions): OpSet | null {
    return null;
  }

  private dotsOnLines(lines: Line[], o: ResolvedOptions): OpSet {
    let ops: Op[] = [];
    let gap = o.hachureGap;
    if (gap < 0) {
      gap = o.strokeWidth * 4;
    }
    gap = Math.max(gap, 0.1);
    let fweight = o.fillWeight;
    if (fweight < 0) {
      fweight = o.strokeWidth / 2;
    }
    for (const line of lines) {
      const length = lineLength(line);
      const dl = length / gap;
      const count = Math.ceil(dl) - 1;
      const alpha = Math.atan((line[1][1] - line[0][1]) / (line[1][0] - line[0][0]));
      for (let i = 0; i < count; i++) {
        const l = gap * (i + 1);
        const dy = l * Math.sin(alpha);
        const dx = l * Math.cos(alpha);
        const c: Point = [line[0][0] - dx, line[0][1] + dy];
        const cx = this.helper.randOffsetWithRange(c[0] - gap / 4, c[0] + gap / 4, o);
        const cy = this.helper.randOffsetWithRange(c[1] - gap / 4, c[1] + gap / 4, o);
        const el = this.helper.ellipse(cx, cy, fweight, fweight, o);
        ops = ops.concat(el.ops);
      }
    }
    return { type: 'fillSketch', ops };
  }
}