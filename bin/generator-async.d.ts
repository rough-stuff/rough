import { Options, Drawable } from './core';
import { Point } from './geometry.js';
import { RoughGeneratorBase } from './generator-base';
export declare class RoughGeneratorAsync extends RoughGeneratorBase {
    line(x1: number, y1: number, x2: number, y2: number, options?: Options): Promise<Drawable>;
    rectangle(x: number, y: number, width: number, height: number, options?: Options): Promise<Drawable>;
    ellipse(x: number, y: number, width: number, height: number, options?: Options): Promise<Drawable>;
    circle(x: number, y: number, diameter: number, options?: Options): Promise<Drawable>;
    linearPath(points: Point[], options?: Options): Promise<Drawable>;
    arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed?: boolean, options?: Options): Promise<Drawable>;
    curve(points: Point[], options?: Options): Promise<Drawable>;
    polygon(points: Point[], options?: Options): Promise<Drawable>;
    path(d: string, options?: Options): Promise<Drawable>;
}
