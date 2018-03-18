import { RoughCanvas, RoughCanvasAsync } from './canvas.js';

export default {
  canvas(canvas, config) {
    if (config && config.async) {
      return new RoughCanvasAsync(canvas, config);
    }
    return new RoughCanvas(canvas, config);
  },
  createRenderer() {
    return RoughCanvas.createRenderer();
  }
};