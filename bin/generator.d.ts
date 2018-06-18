import { RoughRenderer } from './renderer.js';
import { Config, DrawingSurface, Options, Drawable, OpSet, PathInfo } from './core';
import { Point } from './geometry.js';
export declare class RoughGenerator {
    private config;
    private surface;
    private renderer;
    defaultOptions: Options;
    constructor(config: Config | null, surface: DrawingSurface);
    protected _options(options?: Options): Options;
    protected _drawable(shape: string, sets: OpSet[], options: Options): Drawable;
    protected readonly lib: RoughRenderer;
    private getCanvasSize;
    protected computePolygonSize(points: Point[]): Point;
    protected polygonPath(points: Point[]): string;
    protected computePathSize(d: string): Point;
    line(x1: number, y1: number, x2: number, y2: number, options?: Options): Drawable;
    rectangle(x: number, y: number, width: number, height: number, options?: Options): Drawable;
    ellipse(x: number, y: number, width: number, height: number, options?: Options): Drawable;
    circle(x: number, y: number, diameter: number, options?: Options): Drawable;
    linearPath(points: Point[], options?: Options): Drawable;
    arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed?: boolean, options?: Options): Drawable;
    curve(points: Point[], options?: Options): Drawable;
    polygon(points: Point[], options?: Options): Drawable;
    path(d: string, options?: Options): Drawable;
    toPaths(drawable: Drawable): PathInfo[];
    private fillSketch;
    opsToPath(drawing: OpSet): string;
}
