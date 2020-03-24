import { Config, DrawingSurface } from './core';
import { RoughCanvas } from './canvas';
import { RoughGenerator } from './generator';
import { RoughSVG } from './svg';
import { RoughWebGL } from './webgl';

export default {
  canvas(canvas: HTMLCanvasElement, config?: Config): RoughCanvas {
    return new RoughCanvas(canvas, config);
  },

  svg(svg: SVGSVGElement, config?: Config): RoughSVG {
    return new RoughSVG(svg, config);
  },

  webGl(canvas: HTMLCanvasElement): RoughWebGL {
    return new RoughWebGL(canvas);
  },

  generator(config?: Config, surface?: DrawingSurface): RoughGenerator {
    return new RoughGenerator(config, surface);
  },

  newSeed(): number {
    return RoughGenerator.newSeed();
  }
};