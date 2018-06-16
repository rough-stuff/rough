import { RoughRenderer } from './renderer.js';
import { Config, DrawingSurface, Options, Drawable, OpSet } from './core';
import { Point } from './geometry.js';

export class RoughGenerator {
  private config: Config;
  private surface: DrawingSurface;
  private renderer?: RoughRenderer;
  defaultOptions: Options = {
    maxRandomnessOffset: 2,
    roughness: 1,
    bowing: 1,
    stroke: '#000',
    strokeWidth: 1,
    curveTightness: 0,
    curveStepCount: 9,
    fill: null,
    fillStyle: 'hachure',
    fillWeight: -1,
    hachureAngle: -41,
    hachureGap: -1
  };

  constructor(config: Config | null, surface: DrawingSurface) {
    this.config = config || {};
    this.surface = surface;
    if (this.config.options) {
      this.defaultOptions = this._options(this.config.options);
    }
  }

  private _options(options?: Options): Options {
    return options ? Object.assign({}, this.defaultOptions, options) : this.defaultOptions;
  }

  private _drawable(shape: string, sets: OpSet[], options: Options): Drawable {
    return { shape, sets: sets || [], options: options || this.defaultOptions };
  }

  private get lib(): RoughRenderer {
    if (!this.renderer) {
      this.renderer = new RoughRenderer();
    }
    return this.renderer;
  }

  line(x1: number, y1: number, x2: number, y2: number, options?: Options): Drawable {
    const o = this._options(options);
    return this._drawable('line', [this.lib.line(x1, y1, x2, y2, o)], o);
  }

  rectangle(x: number, y: number, width: number, height: number, options?: Options): Drawable {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      const points: Point[] = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
      if (o.fillStyle === 'solid') {
        paths.push(this.lib.solidFillPolygon(points, o));
      }
      // if (o.fillStyle === 'solid') {
      //   paths.push(this.lib.solidFillShape(xc, yc, o));
      // } else {
      //   paths.push(this.lib.hachureFillShape(xc, yc, o));
      // }
    }
    console.log(this.surface);
    paths.push(this.lib.rectangle(x, y, width, height, o));
    return this._drawable('rectangle', paths, o);
  }
}