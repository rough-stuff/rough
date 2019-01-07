import { Config, Options, ResolvedOptions, Drawable } from './core';
import { AsyncRoughGenerator } from './generator-async';
import { Point } from './geometry';
import { RoughCanvasBase } from './canvas-base';

export class AsyncRoughCanvas extends RoughCanvasBase {
  private gen: AsyncRoughGenerator;

  constructor(canvas: HTMLCanvasElement, config?: Config) {
    super(canvas);
    this.gen = new AsyncRoughGenerator(config || null, this.canvas);
  }

  get generator(): AsyncRoughGenerator {
    return this.gen;
  }

  getDefaultOptions(): ResolvedOptions {
    return this.gen.defaultOptions;
  }

  async line(x1: number, y1: number, x2: number, y2: number, options?: Options): Promise<Drawable> {
    const d = await this.gen.line(x1, y1, x2, y2, options);
    this.draw(d);
    return d;
  }

  async rectangle(x: number, y: number, width: number, height: number, options?: Options): Promise<Drawable> {
    const d = await this.gen.rectangle(x, y, width, height, options);
    this.draw(d);
    return d;
  }

  async ellipse(x: number, y: number, width: number, height: number, options?: Options): Promise<Drawable> {
    const d = await this.gen.ellipse(x, y, width, height, options);
    this.draw(d);
    return d;
  }

  async circle(x: number, y: number, diameter: number, options?: Options): Promise<Drawable> {
    const d = await this.gen.circle(x, y, diameter, options);
    this.draw(d);
    return d;
  }

  async linearPath(points: Point[], options?: Options): Promise<Drawable> {
    const d = await this.gen.linearPath(points, options);
    this.draw(d);
    return d;
  }

  async polygon(points: Point[], options?: Options): Promise<Drawable> {
    const d = await this.gen.polygon(points, options);
    this.draw(d);
    return d;
  }

  async arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean = false, options?: Options): Promise<Drawable> {
    const d = await this.gen.arc(x, y, width, height, start, stop, closed, options);
    this.draw(d);
    return d;
  }

  async curve(points: Point[], options?: Options): Promise<Drawable> {
    const d = await this.gen.curve(points, options);
    this.draw(d);
    return d;
  }

  async path(d: string, options?: Options): Promise<Drawable> {
    const drawing = await this.gen.path(d, options);
    this.draw(drawing);
    return drawing;
  }
}