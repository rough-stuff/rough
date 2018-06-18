import { Options, OpSet, Op } from './core';
import { Point } from './geometry';
export declare class RoughRenderer {
    line(x1: number, y1: number, x2: number, y2: number, o: Options): OpSet;
    linearPath(points: Point[], close: boolean, o: Options): OpSet;
    polygon(points: Point[], o: Options): OpSet;
    rectangle(x: number, y: number, width: number, height: number, o: Options): OpSet;
    curve(points: Point[], o: Options): OpSet;
    ellipse(x: number, y: number, width: number, height: number, o: Options): OpSet;
    arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean, roughClosure: boolean, o: Options): OpSet;
    svgPath(path: string, o: Options): OpSet;
    solidFillPolygon(points: Point[], o: Options): OpSet;
    patternFillPolygon(points: Point[], o: Options): OpSet;
    patternFillEllipse(cx: number, cy: number, width: number, height: number, o: Options): OpSet;
    patternFillArc(x: number, y: number, width: number, height: number, start: number, stop: number, o: Options): OpSet;
    getOffset(min: number, max: number, ops: Options): number;
    doubleLine(x1: number, y1: number, x2: number, y2: number, o: Options): Op[];
    private _line;
    private _curve;
    private _ellipse;
    private _curveWithOffset;
    private _arc;
    private _bezierTo;
    private _processSegment;
}
