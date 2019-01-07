import { Config, DrawingSurface } from '../core';
import { AsyncRoughCanvas } from '../canvas-async';
import { AsyncRoughGenerator } from '../generator-async';

export default {
  canvas(canvas: HTMLCanvasElement, config?: Config): AsyncRoughCanvas {
    return new AsyncRoughCanvas(canvas, config);
  },

  generator(config: Config | null, surface: DrawingSurface): AsyncRoughGenerator {
    return new AsyncRoughGenerator(config, surface);
  }
};