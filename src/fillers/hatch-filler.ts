import { HachureFiller } from './hachure-filler';
import { ResolvedOptions, OpSet } from '../core';
import { Point } from '../geometry';

export class HatchFiller extends HachureFiller {
  fillPolygon(points: Point[], o: ResolvedOptions): OpSet {
    const set = this._fillPolygon(points, o);
    const o2 = Object.assign({}, o, { hachureAngle: o.hachureAngle + 90 });
    const set2 = this._fillPolygon(points, o2);
    set.ops = set.ops.concat(set2.ops);
    return set;
  }

  fillEllipse(cx: number, cy: number, width: number, height: number, o: ResolvedOptions): OpSet {
    const set = this._fillEllipse(cx, cy, width, height, o);
    const o2 = Object.assign({}, o, { hachureAngle: o.hachureAngle + 90 });
    const set2 = this._fillEllipse(cx, cy, width, height, o2);
    set.ops = set.ops.concat(set2.ops);
    return set;
  }
}