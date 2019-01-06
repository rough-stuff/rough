import { RoughGeneratorBase } from './generator-base';
import { Config, DrawingSurface } from './core';

export class RoughGeneratorAsync extends RoughGeneratorBase {

  constructor(config: Config | null, surface: DrawingSurface) {
    super(config, surface);
  }
}