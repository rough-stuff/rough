import { Point, Line } from '../geometry';
import { ResolvedOptions } from '../core';
import { RenderHelper } from './filler-interface';
export declare function lineLength(line: Line): number;
export declare function getIntersectingLines(line: number[], points: Point[]): Point[];
export declare function affine(x: number, y: number, cx: number, cy: number, sinAnglePrime: number, cosAnglePrime: number, R: number): Point;
export declare function hachureLinesForPolygon(points: Point[], o: ResolvedOptions): Line[];
export declare function hachureLinesForEllipse(cx: number, cy: number, width: number, height: number, o: ResolvedOptions, renderer: RenderHelper): Line[];
