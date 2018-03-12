import { RoughCanvas } from './canvas.js';

export default {
  canvas(canvas, config) {
    return new RoughCanvas(canvas, config);
  },
  createRenderer() {
    return RoughCanvas.createRenderer();
  }
};