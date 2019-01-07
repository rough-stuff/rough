import { Config, DrawingSurface } from '../core';
import { AsyncRoughCanvas } from '../canvas-async';
import { AsyncRoughSVG } from '../svg-async';
import { AsyncRoughGenerator } from '../generator-async';

export default {
  canvas(canvas: HTMLCanvasElement, config?: Config): AsyncRoughCanvas {
    return new AsyncRoughCanvas(canvas, config);
  },

  svg(svg: SVGSVGElement, config?: Config): AsyncRoughSVG {
    return new AsyncRoughSVG(svg, config);
  },

  generator(config: Config | null, surface: DrawingSurface): AsyncRoughGenerator {
    return new AsyncRoughGenerator(config, surface);
  }
};