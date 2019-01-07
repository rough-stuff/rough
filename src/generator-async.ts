import { RoughGeneratorBase } from './generator-base';
import { Options, Drawable, OpSet } from './core';
import { Config, DrawingSurface } from './core';
import { AsyncRenderer } from './renderer-async';
import { Point } from './geometry.js';
import { proxy } from 'workly';
import * as syncRenderer from './renderer';

export class AsyncRoughGenerator extends RoughGeneratorBase {
  private renderer: AsyncRenderer;

  constructor(config: Config | null, surface: DrawingSurface) {
    super(config, surface);
    if (config && config.workerURL) {
      this.renderer = proxy(config.workerURL);
    } else {
      this.renderer = syncRenderer as any as AsyncRenderer;
    }
  }

  async line(x1: number, y1: number, x2: number, y2: number, options?: Options): Promise<Drawable> {
    const o = this._options(options);
    return this._drawable('line', [await this.renderer.line(x1, y1, x2, y2, o)], o);
  }

  async rectangle(x: number, y: number, width: number, height: number, options?: Options): Promise<Drawable> {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      const points: Point[] = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
      if (o.fillStyle === 'solid') {
        paths.push(await this.renderer.solidFillPolygon(points, o));
      } else {
        paths.push(await this.renderer.patternFillPolygon(points, o));
      }
    }
    paths.push(await this.renderer.rectangle(x, y, width, height, o));
    return this._drawable('rectangle', paths, o);
  }

  async ellipse(x: number, y: number, width: number, height: number, options?: Options): Promise<Drawable> {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        const shape = await this.renderer.ellipse(x, y, width, height, o);
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(await this.renderer.patternFillEllipse(x, y, width, height, o));
      }
    }
    paths.push(await this.renderer.ellipse(x, y, width, height, o));
    return this._drawable('ellipse', paths, o);
  }

  async circle(x: number, y: number, diameter: number, options?: Options): Promise<Drawable> {
    const ret = await this.ellipse(x, y, diameter, diameter, options);
    ret.shape = 'circle';
    return ret;
  }

  async linearPath(points: Point[], options?: Options): Promise<Drawable> {
    const o = this._options(options);
    return this._drawable('linearPath', [await this.renderer.linearPath(points, false, o)], o);
  }

  async arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean = false, options?: Options): Promise<Drawable> {
    const o = this._options(options);
    const paths = [];
    if (closed && o.fill) {
      if (o.fillStyle === 'solid') {
        const shape = await this.renderer.arc(x, y, width, height, start, stop, true, false, o);
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(await this.renderer.patternFillArc(x, y, width, height, start, stop, o));
      }
    }
    paths.push(await this.renderer.arc(x, y, width, height, start, stop, closed, true, o));
    return this._drawable('arc', paths, o);
  }

  async curve(points: Point[], options?: Options): Promise<Drawable> {
    const o = this._options(options);
    return this._drawable('curve', [await this.renderer.curve(points, o)], o);
  }

  async polygon(points: Point[], options?: Options): Promise<Drawable> {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        paths.push(await this.renderer.solidFillPolygon(points, o));
      } else {
        const size = this.computePolygonSize(points);
        const fillPoints: Point[] = [
          [0, 0],
          [size[0], 0],
          [size[0], size[1]],
          [0, size[1]]
        ];
        const shape = await this.renderer.patternFillPolygon(fillPoints, o);
        shape.type = 'path2Dpattern';
        shape.size = size;
        shape.path = this.polygonPath(points);
        paths.push(shape);
      }
    }
    paths.push(await this.renderer.linearPath(points, true, o));
    return this._drawable('polygon', paths, o);
  }

  async path(d: string, options?: Options): Promise<Drawable> {
    const o = this._options(options);
    const paths: OpSet[] = [];
    if (!d) {
      return this._drawable('path', paths, o);
    }
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        const shape: OpSet = { type: 'path2Dfill', path: d, ops: [] };
        paths.push(shape);
      } else {
        const size = this.computePathSize(d);
        const points: Point[] = [
          [0, 0],
          [size[0], 0],
          [size[0], size[1]],
          [0, size[1]]
        ];
        const shape = await this.renderer.patternFillPolygon(points, o);
        shape.type = 'path2Dpattern';
        shape.size = size;
        shape.path = d;
        paths.push(shape);
      }
    }
    paths.push(await this.renderer.svgPath(d, o));
    return this._drawable('path', paths, o);
  }
}