import { Config, Options, OpSet, ResolvedOptions } from './core';
import { AsyncRoughGenerator } from './generator-async';
import { Point } from './geometry';
import { RoughSVGBase } from './svg-base';

export class AsyncRoughSVG extends RoughSVGBase {
  private gen: AsyncRoughGenerator;

  constructor(svg: SVGSVGElement, config?: Config) {
    super(svg);
    this.gen = new AsyncRoughGenerator(config || null, this.svg);
  }

  get generator(): AsyncRoughGenerator {
    return this.gen;
  }

  getDefaultOptions(): ResolvedOptions {
    return this.gen.defaultOptions;
  }

  opsToPath(drawing: OpSet): string {
    return this.gen.opsToPath(drawing);
  }

  async line(x1: number, y1: number, x2: number, y2: number, options?: Options): Promise<SVGGElement> {
    const d = await this.gen.line(x1, y1, x2, y2, options);
    return this.draw(d);
  }

  async rectangle(x: number, y: number, width: number, height: number, options?: Options): Promise<SVGGElement> {
    const d = await this.gen.rectangle(x, y, width, height, options);
    return this.draw(d);
  }

  async ellipse(x: number, y: number, width: number, height: number, options?: Options): Promise<SVGGElement> {
    const d = await this.gen.ellipse(x, y, width, height, options);
    return this.draw(d);
  }

  async circle(x: number, y: number, diameter: number, options?: Options): Promise<SVGGElement> {
    const d = await this.gen.circle(x, y, diameter, options);
    return this.draw(d);
  }

  async linearPath(points: Point[], options?: Options): Promise<SVGGElement> {
    const d = await this.gen.linearPath(points, options);
    return this.draw(d);
  }

  async polygon(points: Point[], options?: Options): Promise<SVGGElement> {
    const d = await this.gen.polygon(points, options);
    return this.draw(d);
  }

  async arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean = false, options?: Options): Promise<SVGGElement> {
    const d = await this.gen.arc(x, y, width, height, start, stop, closed, options);
    return this.draw(d);
  }

  async curve(points: Point[], options?: Options): Promise<SVGGElement> {
    const d = await this.gen.curve(points, options);
    return this.draw(d);
  }

  async path(d: string, options?: Options): Promise<SVGGElement> {
    const drawing = await this.gen.path(d, options);
    return this.draw(drawing);
  }
}