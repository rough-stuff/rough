import { Point } from './geometry';
import { Random } from './math';

export const SVGNS = 'http://www.w3.org/2000/svg';

export interface Config {
  options?: Options;
}

export interface DrawingSurface {
  width: number | SVGAnimatedLength;
  height: number | SVGAnimatedLength;
}

export interface Options {
  maxRandomnessOffset?: number;
  roughness?: number;
  bowing?: number;
  stroke?: string;
  strokeWidth?: number;
  curveFitting?: number;
  curveTightness?: number;
  curveStepCount?: number;
  fill?: string;
  fillStyle?: string;
  fillWeight?: number;
  hachureAngle?: number;
  hachureGap?: number;
  simplification?: number;
  dashOffset?: number;
  dashGap?: number;
  zigzagOffset?: number;
  seed?: number;
}

export interface ResolvedOptions extends Options {
  maxRandomnessOffset: number;
  roughness: number;
  bowing: number;
  stroke: string;
  strokeWidth: number;
  curveFitting: number;
  curveTightness: number;
  curveStepCount: number;
  fillStyle: string;
  fillWeight: number;
  hachureAngle: number;
  hachureGap: number;
  dashOffset: number;
  dashGap: number;
  zigzagOffset: number;
  seed: number;
  roughnessGain: number;
  randomizer?: Random;
}

export declare type OpType = 'move' | 'bcurveTo' | 'lineTo' | 'qcurveTo';
export declare type OpSetType = 'path' | 'fillPath' | 'fillSketch' | 'path2Dfill' | 'path2Dpattern';

export interface Op {
  op: OpType;
  data: number[];
}

export interface OpSet {
  type: OpSetType;
  ops: Op[];
  size?: Point;
  path?: string;
}

export interface Drawable {
  shape: string;
  options: ResolvedOptions;
  sets: OpSet[];
}

export interface PathInfo {
  d: string;
  stroke: string;
  strokeWidth: number;
  fill?: string;
  pattern?: PatternInfo;
}

export interface PatternInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  viewBox: string;
  patternUnits: string;
  path: PathInfo;
}