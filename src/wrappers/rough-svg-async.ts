import { Config, DrawingSurface } from '../core';
import { AsyncRoughSVG } from '../svg-async';
import { AsyncRoughGenerator } from '../generator-async';

export default {
  svg(svg: SVGSVGElement, config?: Config): AsyncRoughSVG {
    return new AsyncRoughSVG(svg, config);
  },

  generator(config: Config | null, surface: DrawingSurface): AsyncRoughGenerator {
    return new AsyncRoughGenerator(config, surface);
  }
};