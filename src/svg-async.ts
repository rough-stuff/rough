import { Config, Options, ResolvedOptions, OpSet } from './core';
import { RoughGeneratorAsync } from './generator-async';
import { Point } from './geometry';
import { RoughSVGBase } from './svg-base';

export class RoughSVGAsync extends RoughSVGBase {
  private genAsync: RoughGeneratorAsync;

  constructor(svg: SVGSVGElement, config?: Config) {
    super(svg);
    this.genAsync = new RoughGeneratorAsync(config || null, this.svg);
  }

  get generator(): RoughGeneratorAsync {
    return this.genAsync;
  }

  getDefaultOptions(): ResolvedOptions {
    return this.genAsync.defaultOptions;
  }

  opsToPath(drawing: OpSet): string {
    return this.genAsync.opsToPath(drawing);
  }

  async line(x1: number, y1: number, x2: number, y2: number, options?: Options): Promise<SVGGElement> {
    const d = await this.genAsync.line(x1, y1, x2, y2, options);
    return this.draw(d);
  }

  async rectangle(x: number, y: number, width: number, height: number, options?: Options): Promise<SVGGElement> {
    const d = await this.genAsync.rectangle(x, y, width, height, options);
    return this.draw(d);
  }

  async ellipse(x: number, y: number, width: number, height: number, options?: Options): Promise<SVGGElement> {
    const d = await this.genAsync.ellipse(x, y, width, height, options);
    return this.draw(d);
  }

  async circle(x: number, y: number, diameter: number, options?: Options): Promise<SVGGElement> {
    const d = await this.genAsync.circle(x, y, diameter, options);
    return this.draw(d);
  }

  async linearPath(points: Point[], options?: Options): Promise<SVGGElement> {
    const d = await this.genAsync.linearPath(points, options);
    return this.draw(d);
  }

  async polygon(points: Point[], options?: Options): Promise<SVGGElement> {
    const d = await this.genAsync.polygon(points, options);
    return this.draw(d);
  }

  async arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean = false, options?: Options): Promise<SVGGElement> {
    const d = await this.genAsync.arc(x, y, width, height, start, stop, closed, options);
    return this.draw(d);
  }

  async curve(points: Point[], options?: Options): Promise<SVGGElement> {
    const d = await this.genAsync.curve(points, options);
    return this.draw(d);
  }

  async path(d: string, options?: Options): Promise<SVGGElement> {
    const drawing = await this.genAsync.path(d, options);
    return this.draw(drawing);
  }
}