import { ResolvedOptions, OpSet, Op } from './core';
import { Point } from './geometry';
export declare class RoughRenderer {
    line(x1: number, y1: number, x2: number, y2: number, o: ResolvedOptions): OpSet;
    linearPath(points: Point[], close: boolean, o: ResolvedOptions): OpSet;
    polygon(points: Point[], o: ResolvedOptions): OpSet;
    rectangle(x: number, y: number, width: number, height: number, o: ResolvedOptions): OpSet;
    curve(points: Point[], o: ResolvedOptions): OpSet;
    ellipse(x: number, y: number, width: number, height: number, o: ResolvedOptions): OpSet;
    arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean, roughClosure: boolean, o: ResolvedOptions): OpSet;
    svgPath(path: string, o: ResolvedOptions): OpSet;
    solidFillPolygon(points: Point[], o: ResolvedOptions): OpSet;
    patternFillPolygon(points: Point[], o: ResolvedOptions): OpSet;
    patternFillEllipse(cx: number, cy: number, width: number, height: number, o: ResolvedOptions): OpSet;
    patternFillArc(x: number, y: number, width: number, height: number, start: number, stop: number, o: ResolvedOptions): OpSet;
    getOffset(min: number, max: number, ops: ResolvedOptions): number;
    doubleLine(x1: number, y1: number, x2: number, y2: number, o: ResolvedOptions): Op[];
    private _line;
    private _curve;
    private _ellipse;
    private _curveWithOffset;
    private _arc;
    private _bezierTo;
    private _processSegment;
}
