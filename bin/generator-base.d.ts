import { Config, DrawingSurface, Options, ResolvedOptions, Drawable, OpSet, PathInfo } from './core';
import { Point } from './geometry.js';
export declare abstract class RoughGeneratorBase {
    protected config: Config;
    protected surface: DrawingSurface;
    defaultOptions: ResolvedOptions;
    constructor(config: Config | null, surface: DrawingSurface);
    protected _options(options?: Options): ResolvedOptions;
    protected _drawable(shape: string, sets: OpSet[], options: ResolvedOptions): Drawable;
    private getCanvasSize;
    protected computePolygonSize(points: Point[]): Point;
    protected polygonPath(points: Point[]): string;
    protected computePathSize(d: string): Point;
    toPaths(drawable: Drawable): PathInfo[];
    private fillSketch;
    opsToPath(drawing: OpSet): string;
}
