import { Config, DrawingSurface } from '../core';
import { RoughGenerator } from '../generator';
import { RoughSVG } from '../svg';

export default {
  svg(svg: SVGSVGElement, config?: Config): RoughSVG {
    return new RoughSVG(svg, config);
  },

  generator(config: Config | null, surface: DrawingSurface): RoughGenerator {
    return new RoughGenerator(config, surface);
  }
};