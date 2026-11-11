import { Config } from './core';
import { RoughCanvas } from './canvas';
import { RoughGenerator } from './generator';
import { RoughSVG } from './svg';

export default {
  canvas(canvas: HTMLCanvasElement, config?: Config): RoughCanvas {
    return new RoughCanvas(canvas, config);
  },

  svg(svg: SVGSVGElement, config?: Config): RoughSVG {
    return new RoughSVG(svg, config);
  },

  generator(config?: Config): RoughGenerator {
    return new RoughGenerator(config);
  },

  newSeed(): number {
    return RoughGenerator.newSeed();
  },
};
