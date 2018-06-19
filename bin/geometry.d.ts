export declare type Point = [number, number];
export declare type Line = [Point, Point];
export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}
export declare class Segment {
    px1: number;
    px2: number;
    py1: number;
    py2: number;
    xi: number;
    yi: number;
    a: number;
    b: number;
    c: number;
    _undefined: boolean;
    constructor(p1: Point, p2: Point);
    isUndefined(): boolean;
    intersects(otherSegment: Segment): boolean;
}
