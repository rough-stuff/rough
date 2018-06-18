import { HachureFiller } from './hachure-filler';
import { Options, OpSet } from '../core';
import { Point } from '../geometry';
export declare class ZigZagFiller extends HachureFiller {
    fillPolygon(points: Point[], o: Options): OpSet;
    fillEllipse(cx: number, cy: number, width: number, height: number, o: Options): OpSet;
}
