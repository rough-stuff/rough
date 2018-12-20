import { PatternFiller } from './filler-interface';
import { ResolvedOptions, OpSet } from '../core';
import { Point } from '../geometry';
export declare class HachureFiller implements PatternFiller {
    fillPolygon(points: Point[], o: ResolvedOptions): OpSet;
    fillEllipse(cx: number, cy: number, width: number, height: number, o: ResolvedOptions): OpSet;
    protected _fillPolygon(points: Point[], o: ResolvedOptions, connectEnds?: boolean): OpSet;
    protected _fillEllipse(cx: number, cy: number, width: number, height: number, o: ResolvedOptions, connectEnds?: boolean): OpSet;
    private renderLines;
}
