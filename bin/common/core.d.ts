export interface Options {
    maxRandomnessOffset: number;
    roughness: number;
    bowing: number;
    stroke: string;
    strokeWidth: number;
    curveTightness: number;
    curveStepCount: number;
    fill: string | null;
    fillStyle: string;
    fillWeight: number;
    hachureAngle: number;
    hachureGap: number;
}
export declare type OpType = 'move' | 'bcurveTo' | 'lineTo';
export declare type OpSetType = 'path' | 'fillPath' | 'fillSketch';
export interface Op {
    op: OpType;
    data: number[];
}
export interface OpSet {
    type: OpSetType;
    ops: Op[];
}
export interface Drawable {
    shape: string;
    options: Options;
    sets: OpSet[];
}
