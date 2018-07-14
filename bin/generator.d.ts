import { Config, DrawingSurface, Options, Drawable } from './core';
import { Point } from './geometry.js';
import { RoughGeneratorBase } from './generator-base';
export declare class RoughGenerator extends RoughGeneratorBase {
    constructor(config: Config | null, surface: DrawingSurface);
    line(x1: number, y1: number, x2: number, y2: number, options?: Options): Drawable;
    rectangle(x: number, y: number, width: number, height: number, options?: Options): Drawable;
    ellipse(x: number, y: number, width: number, height: number, options?: Options): Drawable;
    circle(x: number, y: number, diameter: number, options?: Options): Drawable;
    linearPath(points: Point[], options?: Options): Drawable;
    arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed?: boolean, options?: Options): Drawable;
    curve(points: Point[], options?: Options): Drawable;
    polygon(points: Point[], options?: Options): Drawable;
    path(d: string, options?: Options): Drawable;
}
