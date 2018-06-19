import { Options, OpSet, Op } from '../core';
import { Point } from '../geometry';
export interface PatternFiller {
    fillPolygon(points: Point[], o: Options): OpSet;
    fillEllipse(cx: number, cy: number, width: number, height: number, o: Options): OpSet;
}
export interface RenderHelper {
    doubleLine(x1: number, y1: number, x2: number, y2: number, o: Options): Op[];
    getOffset(min: number, max: number, ops: Options): number;
    ellipse(x: number, y: number, width: number, height: number, o: Options): OpSet;
}
