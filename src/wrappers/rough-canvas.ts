import { Config, DrawingSurface } from '../core';
import { RoughCanvas } from '../canvas';
import { RoughGenerator } from '../generator';

export default {
  canvas(canvas: HTMLCanvasElement, config?: Config): RoughCanvas {
    return new RoughCanvas(canvas, config);
  },

  generator(config: Config | null, surface: DrawingSurface): RoughGenerator {
    return new RoughGenerator(config, surface);
  }
};