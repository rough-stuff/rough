import { Config, Options, Drawable } from './core';
import { RoughGenerator } from './generator';
import { RoughRenderer } from './renderer';
import { Point } from './geometry';
export declare class RoughSVG {
    protected svg: SVGSVGElement;
    private gen;
    protected _defs?: SVGDefsElement;
    constructor(svg: SVGSVGElement, config?: Config);
    readonly generator: RoughGenerator;
    static createRenderer(): RoughRenderer;
    readonly defs: SVGDefsElement | null;
    line(x1: number, y1: number, x2: number, y2: number, options?: Options): SVGGElement;
    rectangle(x: number, y: number, width: number, height: number, options?: Options): SVGGElement;
    ellipse(x: number, y: number, width: number, height: number, options?: Options): SVGGElement;
    circle(x: number, y: number, diameter: number, options?: Options): SVGGElement;
    linearPath(points: Point[], options?: Options): SVGGElement;
    polygon(points: Point[], options?: Options): SVGGElement;
    arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed?: boolean, options?: Options): SVGGElement;
    curve(points: Point[], options?: Options): SVGGElement;
    path(d: string, options?: Options): SVGGElement;
    draw(drawable: Drawable): SVGGElement;
    private opsToPath;
    private fillSketch;
}
