import { Config, Options, ResolvedOptions, Drawable } from './core';
import { RoughGenerator } from './generator';
import { Point } from './geometry';
import { RoughCanvasBase } from './canvas-base';

export class RoughCanvas extends RoughCanvasBase {
  private gen: RoughGenerator;

  constructor(canvas: HTMLCanvasElement, config?: Config) {
    super(canvas);
    this.gen = new RoughGenerator(config || null, this.canvas);
  }

  get generator(): RoughGenerator {
    return this.gen;
  }

  getDefaultOptions(): ResolvedOptions {
    return this.gen.defaultOptions;
  }

  line(x1: number, y1: number, x2: number, y2: number, options?: Options): Drawable {
    const d = this.gen.line(x1, y1, x2, y2, options);
    this.draw(d);
    return d;
  }

  rectangle(x: number, y: number, width: number, height: number, options?: Options): Drawable {
    const d = this.gen.rectangle(x, y, width, height, options);
    this.draw(d);
    return d;
  }

  ellipse(x: number, y: number, width: number, height: number, options?: Options): Drawable {
    const d = this.gen.ellipse(x, y, width, height, options);
    this.draw(d);
    return d;
  }

  circle(x: number, y: number, diameter: number, options?: Options): Drawable {
    const d = this.gen.circle(x, y, diameter, options);
    this.draw(d);
    return d;
  }

  linearPath(points: Point[], options?: Options): Drawable {
    const d = this.gen.linearPath(points, options);
    this.draw(d);
    return d;
  }

  polygon(points: Point[], options?: Options): Drawable {
    const d = this.gen.polygon(points, options);
    this.draw(d);
    return d;
  }

  arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean = false, options?: Options): Drawable {
    const d = this.gen.arc(x, y, width, height, start, stop, closed, options);
    this.draw(d);
    return d;
  }

  curve(points: Point[], options?: Options): Drawable {
    const d = this.gen.curve(points, options);
    this.draw(d);
    return d;
  }

  path(d: string, options?: Options): Drawable {
    const drawing = this.gen.path(d, options);
    this.draw(drawing);
    return drawing;
  }
}