import { PatternFiller } from './filler-interface';
import { ResolvedOptions, OpSet } from '../core';
import { Point } from '../geometry';
export declare class DotFiller implements PatternFiller {
    fillPolygon(points: Point[], o: ResolvedOptions): OpSet;
    fillEllipse(cx: number, cy: number, width: number, height: number, o: ResolvedOptions): OpSet;
    private dotsOnLines;
}
