import { HachureFiller } from './hachure-filler';
import { ResolvedOptions, OpSet } from '../core';
import { Point } from '../geometry';

export class ZigZagFiller extends HachureFiller {
  fillPolygons(polygonList: Point[][], o: ResolvedOptions): OpSet {
    // TODO: zigzag
    return this._fillPolygons(polygonList, o);
  }
}