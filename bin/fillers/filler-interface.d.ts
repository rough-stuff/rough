import { ResolvedOptions, OpSet } from '../core';
import { Point } from '../geometry';
export interface PatternFiller {
    fillPolygon(points: Point[], o: ResolvedOptions): OpSet;
    fillEllipse(cx: number, cy: number, width: number, height: number, o: ResolvedOptions): OpSet;
}
