import { ResolvedOptions, OpSet } from './core';
import { Point } from './geometry';

export interface AsyncRenderer {
  line(x1: number, y1: number, x2: number, y2: number, o: ResolvedOptions): Promise<OpSet>;
  linearPath(points: Point[], close: boolean, o: ResolvedOptions): Promise<OpSet>;
  polygon(points: Point[], o: ResolvedOptions): Promise<OpSet>;
  rectangle(x: number, y: number, width: number, height: number, o: ResolvedOptions): Promise<OpSet>;
  curve(points: Point[], o: ResolvedOptions): Promise<OpSet>;
  ellipse(x: number, y: number, width: number, height: number, o: ResolvedOptions): Promise<OpSet>;
  arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean, roughClosure: boolean, o: ResolvedOptions): Promise<OpSet>;
  svgPath(path: string, o: ResolvedOptions): Promise<OpSet>;
  solidFillPolygon(points: Point[], o: ResolvedOptions): Promise<OpSet>;
  patternFillPolygon(points: Point[], o: ResolvedOptions): Promise<OpSet>;
  patternFillEllipse(cx: number, cy: number, width: number, height: number, o: ResolvedOptions): Promise<OpSet>;
  patternFillArc(x: number, y: number, width: number, height: number, start: number, stop: number, o: ResolvedOptions): Promise<OpSet>;
}