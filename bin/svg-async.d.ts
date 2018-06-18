import { RoughSVG } from './svg';
import { Config, Options } from './core';
import { RoughGeneratorAsync } from './generator-async';
import { Point } from './geometry';
export declare class RoughSVGAsync extends RoughSVG {
    private genAsync;
    constructor(svg: SVGSVGElement, config?: Config);
    readonly generator: RoughGeneratorAsync;
    line(x1: number, y1: number, x2: number, y2: number, options?: Options): Promise<SVGGElement>;
    rectangle(x: number, y: number, width: number, height: number, options?: Options): Promise<SVGGElement>;
    ellipse(x: number, y: number, width: number, height: number, options?: Options): Promise<SVGGElement>;
    circle(x: number, y: number, diameter: number, options?: Options): Promise<SVGGElement>;
    linearPath(points: Point[], options?: Options): Promise<SVGGElement>;
    polygon(points: Point[], options?: Options): Promise<SVGGElement>;
    arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed?: boolean, options?: Options): Promise<SVGGElement>;
    curve(points: Point[], options?: Options): Promise<SVGGElement>;
    path(d: string, options?: Options): Promise<SVGGElement>;
}
