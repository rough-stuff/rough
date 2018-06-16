import { Config, DrawingSurface } from './core';
import { RoughCanvas } from './canvas';
import { RoughRenderer } from './renderer';
import { RoughGenerator } from './generator';

export default {
  canvas(canvas: HTMLCanvasElement, config?: Config): RoughCanvas {
    if (config && config.async) {
      // TODO:
    }
    return new RoughCanvas(canvas, config);
  },

  createRenderer(): RoughRenderer {
    return RoughCanvas.createRenderer();
  },

  generator(config: Config | null, surface: DrawingSurface) {
    // if (config && config.async) {
    //   return new RoughGeneratorAsync(config, size);
    // }
    // return new RoughGenerator(config, size);
    return new RoughGenerator(config, surface);
  }
};