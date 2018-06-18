import { Point } from './geometry';
export interface Segment {
    key: string;
    data: number[];
    point?: Point;
}
export declare class RoughPath {
    private parsed;
    private _position;
    private _first;
    private _linearPoints?;
    bezierReflectionPoint: Point | null;
    quadReflectionPoint: Point | null;
    constructor(d: string);
    readonly segments: Segment[];
    readonly closed: boolean;
    readonly linearPoints: Point[][];
    first: Point | null;
    setPosition(x: number, y: number): void;
    readonly position: Point;
    readonly x: number;
    readonly y: number;
}
export interface RoughArcSegment {
    cp1: Point;
    cp2: Point;
    to: Point;
}
export declare class RoughArcConverter {
    private _segIndex;
    private _numSegs;
    private _rx;
    private _ry;
    private _sinPhi;
    private _cosPhi;
    private _C;
    private _theta;
    private _delta;
    private _T;
    private _from;
    constructor(from: Point, to: Point, radii: Point, angle: number, largeArcFlag: boolean, sweepFlag: boolean);
    getNextSegment(): RoughArcSegment | null;
    calculateVectorAngle(ux: number, uy: number, vx: number, vy: number): number;
}
export declare class PathFitter {
    sets: Point[][];
    closed: boolean;
    constructor(sets: Point[][], closed: boolean);
    fit(simplification: number): string;
    distance(p1: Point, p2: Point): number;
    reduce(set: Point[], count: number): Point[];
}
