import { Segment } from '../geometry';
export declare class HachureIterator {
    top: number;
    bottom: number;
    left: number;
    right: number;
    gap: number;
    sinAngle: number;
    tanAngle: number;
    pos: number;
    deltaX: number;
    hGap: number;
    sLeft?: Segment;
    sRight?: Segment;
    constructor(top: number, bottom: number, left: number, right: number, gap: number, sinAngle: number, cosAngle: number, tanAngle: number);
    nextLine(): number[] | null;
}
