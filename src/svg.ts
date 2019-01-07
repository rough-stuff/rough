import { Config, Options, OpSet, ResolvedOptions } from './core';
import { RoughGenerator } from './generator';
import { Point } from './geometry';
import { RoughSVGBase } from './svg-base';

export class RoughSVG extends RoughSVGBase {
  private gen: RoughGenerator;

  constructor(svg: SVGSVGElement, config?: Config) {
    super(svg);
    this.gen = new RoughGenerator(config || null, this.svg);
  }

  get generator(): RoughGenerator {
    return this.gen;
  }

  getDefaultOptions(): ResolvedOptions {
    return this.gen.defaultOptions;
  }

  opsToPath(drawing: OpSet): string {
    return this.gen.opsToPath(drawing);
  }

  line(x1: number, y1: number, x2: number, y2: number, options?: Options): SVGGElement {
    const d = this.gen.line(x1, y1, x2, y2, options);
    return this.draw(d);
  }

  rectangle(x: number, y: number, width: number, height: number, options?: Options): SVGGElement {
    const d = this.gen.rectangle(x, y, width, height, options);
    return this.draw(d);
  }

  ellipse(x: number, y: number, width: number, height: number, options?: Options): SVGGElement {
    const d = this.gen.ellipse(x, y, width, height, options);
    return this.draw(d);
  }

  circle(x: number, y: number, diameter: number, options?: Options): SVGGElement {
    const d = this.gen.circle(x, y, diameter, options);
    return this.draw(d);
  }

  linearPath(points: Point[], options?: Options): SVGGElement {
    const d = this.gen.linearPath(points, options);
    return this.draw(d);
  }

  polygon(points: Point[], options?: Options): SVGGElement {
    const d = this.gen.polygon(points, options);
    return this.draw(d);
  }

  arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean = false, options?: Options): SVGGElement {
    const d = this.gen.arc(x, y, width, height, start, stop, closed, options);
    return this.draw(d);
  }

  curve(points: Point[], options?: Options): SVGGElement {
    const d = this.gen.curve(points, options);
    return this.draw(d);
  }

  path(d: string, options?: Options): SVGGElement {
    const drawing = this.gen.path(d, options);
    return this.draw(drawing);
  }
}