import { Config, DrawingSurface } from './core';
import { RoughCanvas } from './canvas';
import { RoughRenderer } from './renderer';
import { RoughGenerator } from './generator';
import { RoughGeneratorAsync } from './generator-async';
import { RoughCanvasAsync } from './canvas-async';
import { RoughSVG } from './svg';
import { RoughSVGAsync } from './svg-async';
declare const _default: {
    canvas(canvas: HTMLCanvasElement, config?: Config | undefined): RoughCanvasAsync | RoughCanvas;
    svg(svg: SVGSVGElement, config?: Config | undefined): RoughSVG | RoughSVGAsync;
    createRenderer(): RoughRenderer;
    generator(config: Config | null, surface: DrawingSurface): RoughGeneratorAsync | RoughGenerator;
};
export default _default;
