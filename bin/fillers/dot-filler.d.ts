import { PatternFiller, RenderHelper } from './filler-interface';
import { Options, OpSet } from '../core';
import { Point } from '../geometry';
export declare class DotFiller implements PatternFiller {
    renderer: RenderHelper;
    constructor(renderer: RenderHelper);
    fillPolygon(points: Point[], o: Options): OpSet;
    fillEllipse(cx: number, cy: number, width: number, height: number, o: Options): OpSet;
    private dotsOnLines;
}
