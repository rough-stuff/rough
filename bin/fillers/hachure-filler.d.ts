import { PatternFiller, RenderHelper } from './filler-interface';
import { Options, OpSet } from '../core';
import { Point } from '../geometry';
export declare class HachureFiller implements PatternFiller {
    renderer: RenderHelper;
    constructor(renderer: RenderHelper);
    fillPolygon(points: Point[], o: Options): OpSet;
    fillEllipse(cx: number, cy: number, width: number, height: number, o: Options): OpSet;
    protected _fillPolygon(points: Point[], o: Options, connectEnds?: boolean): OpSet;
    protected _fillEllipse(cx: number, cy: number, width: number, height: number, o: Options, connectEnds?: boolean): OpSet;
    private getIntersectingLines;
    private affine;
}
