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

  protected getCanvasSize(): Point {
    const val = (w: any): number => {
      if (w && typeof w === 'object') {
        if (w.baseVal && w.baseVal.value) {
          return w.baseVal.value;
        }
      }
      return w || 100;
    };
    if (this.surface) {
      return [val(this.surface.width), val(this.surface.height)];
    }
    return [100, 100];
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
      } else {
        paths.push(this.lib.patternFillPolygon(points, o));
      }
    }
    paths.push(this.lib.rectangle(x, y, width, height, o));
    return this._drawable('rectangle', paths, o);
  }

  ellipse(x: number, y: number, width: number, height: number, options?: Options): Drawable {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        const shape = this.lib.ellipse(x, y, width, height, o);
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(this.lib.patternFillEllipse(x, y, width, height, o));
      }
    }
    paths.push(this.lib.ellipse(x, y, width, height, o));
    return this._drawable('ellipse', paths, o);
  }

  circle(x: number, y: number, diameter: number, options?: Options): Drawable {
    const ret = this.ellipse(x, y, diameter, diameter, options);
    ret.shape = 'circle';
    return ret;
  }

  linearPath(points: Point[], options?: Options): Drawable {
    const o = this._options(options);
    return this._drawable('linearPath', [this.lib.linearPath(points, false, o)], o);
  }

  polygon(points: Point[], options?: Options): Drawable {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        paths.push(this.lib.solidFillPolygon(points, o));
      } else {
        paths.push(this.lib.patternFillPolygon(points, o));
      }
    }
    paths.push(this.lib.linearPath(points, true, o));
    return this._drawable('polygon', paths, o);
  }

  arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean = false, options?: Options): Drawable {
    const o = this._options(options);
    const paths = [];
    if (closed && o.fill) {
      if (o.fillStyle === 'solid') {
        const shape = this.lib.arc(x, y, width, height, start, stop, true, false, o);
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(this.lib.patternFillArc(x, y, width, height, start, stop, o));
      }
    }
    paths.push(this.lib.arc(x, y, width, height, start, stop, closed, true, o));
    return this._drawable('arc', paths, o);
  }

  curve(points: Point[], options?: Options): Drawable {
    const o = this._options(options);
    return this._drawable('curve', [this.lib.curve(points, o)], o);
  }
}