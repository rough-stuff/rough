import { HachureFiller } from './hachure-filler';
import { ResolvedOptions, OpSet } from '../core';
import { Point } from '../geometry';

export class ZigZagFiller extends HachureFiller {
  fillPolygon(points: Point[], o: ResolvedOptions): OpSet {
    return this._fillPolygon(points, o, true);
  }

  fillEllipse(cx: number, cy: number, width: number, height: number, o: ResolvedOptions): OpSet {
    return this._fillEllipse(cx, cy, width, height, o, true);
  }
}