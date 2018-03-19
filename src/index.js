import { RoughCanvas, RoughCanvasAsync } from './canvas.js';
import { RoughGenerator, RoughGeneratorAsync } from './generator.js'

export default {
  canvas(canvas, config) {
    if (config && config.async) {
      return new RoughCanvasAsync(canvas, config);
    }
    return new RoughCanvas(canvas, config);
  },
  createRenderer() {
    return RoughCanvas.createRenderer();
  },
  generator(config, size) {
    if (config && config.async) {
      return new RoughGeneratorAsync(config, size);
    }
    return new RoughGenerator(config, size);
  }
};