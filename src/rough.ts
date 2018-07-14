import { Config, DrawingSurface } from './core';
import { RoughCanvas } from './canvas';
import { RoughRenderer } from './renderer';
import { RoughGenerator } from './generator';
import { RoughGeneratorAsync } from './generator-async';
import { RoughCanvasAsync } from './canvas-async';
import { RoughSVG } from './svg';
import { RoughSVGAsync } from './svg-async';

export default {
  canvas(canvas: HTMLCanvasElement, config?: Config): RoughCanvas | RoughCanvasAsync {
    if (config && config.async) {
      return new RoughCanvasAsync(canvas, config);
    }
    return new RoughCanvas(canvas, config);
  },

  svg(svg: SVGSVGElement, config?: Config): RoughSVG | RoughSVGAsync {
    if (config && config.async) {
      return new RoughSVGAsync(svg, config);
    }
    return new RoughSVG(svg, config);
  },

  createRenderer(): RoughRenderer {
    return RoughCanvas.createRenderer();
  },

  generator(config: Config | null, surface: DrawingSurface): RoughGenerator | RoughGeneratorAsync {
    if (config && config.async) {
      return new RoughGeneratorAsync(config, surface);
    }
    return new RoughGenerator(config, surface);
  }
};