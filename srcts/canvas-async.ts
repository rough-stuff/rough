import { RoughCanvas } from './canvas';
import { Config, Options, Drawable } from './core';
import { RoughGeneratorAsync } from './generator-async';
import { Point } from './geometry';

export class RoughCanvasAsync extends RoughCanvas {
  private genAsync: RoughGeneratorAsync;

  constructor(canvas: HTMLCanvasElement, config?: Config) {
    super(canvas, config);
    this.genAsync = new RoughGeneratorAsync(config || null, this.canvas);
  }

  // @ts-ignore
  get generator(): RoughGeneratorAsync {
    return this.genAsync;
  }

  // @ts-ignore
  async line(x1: number, y1: number, x2: number, y2: number, options?: Options): Promise<Drawable> {
    const d = await this.genAsync.line(x1, y1, x2, y2, options);
    this.draw(d);
    return d;
  }

  // @ts-ignore
  async rectangle(x: number, y: number, width: number, height: number, options?: Options): Promise<Drawable> {
    const d = await this.genAsync.rectangle(x, y, width, height, options);
    this.draw(d);
    return d;
  }

  // @ts-ignore
  async ellipse(x: number, y: number, width: number, height: number, options?: Options): Promise<Drawable> {
    const d = await this.genAsync.ellipse(x, y, width, height, options);
    this.draw(d);
    return d;
  }

  // @ts-ignore
  async circle(x: number, y: number, diameter: number, options?: Options): Promise<Drawable> {
    const d = await this.genAsync.circle(x, y, diameter, options);
    this.draw(d);
    return d;
  }

  // @ts-ignore
  async linearPath(points: Point[], options?: Options): Promise<Drawable> {
    const d = await this.genAsync.linearPath(points, options);
    this.draw(d);
    return d;
  }

  // @ts-ignore
  async polygon(points: Point[], options?: Options): Promise<Drawable> {
    const d = await this.genAsync.polygon(points, options);
    this.draw(d);
    return d;
  }

  // @ts-ignore
  async arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean = false, options?: Options): Promise<Drawable> {
    const d = await this.genAsync.arc(x, y, width, height, start, stop, closed, options);
    this.draw(d);
    return d;
  }

  // @ts-ignore
  async curve(points: Point[], options?: Options): Promise<Drawable> {
    const d = await this.genAsync.curve(points, options);
    this.draw(d);
    return d;
  }

  // @ts-ignore
  async path(d: string, options?: Options): Promise<Drawable> {
    const drawing = await this.genAsync.path(d, options);
    this.draw(drawing);
    return drawing;
  }
}