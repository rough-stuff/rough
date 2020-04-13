import { Config, Options, Drawable, OpSet, ResolvedOptions, PathInfo } from './core.js';
import { Point } from './geometry.js';
import { line, solidFillPolygon, patternFillPolygon, rectangle, ellipseWithParams, generateEllipseParams, linearPath, arc, patternFillArc, curve, svgPath } from './renderer.js';
import { randomSeed } from './math.js';
import { curveToBezier } from 'points-on-curve/lib/curve-to-bezier.js';
import { pointsOnBezierCurves } from 'points-on-curve';
import { pointsOnPath } from 'points-on-path';

const NOS = 'none';

export class RoughGenerator {
  private config: Config;

  defaultOptions: ResolvedOptions = {
    maxRandomnessOffset: 2,
    roughness: 1,
    bowing: 1,
    stroke: '#000',
    strokeWidth: 1,
    curveTightness: 0,
    curveFitting: 0.95,
    curveStepCount: 9,
    fillStyle: 'hachure',
    fillWeight: -1,
    hachureAngle: -41,
    hachureGap: -1,
    dashOffset: -1,
    dashGap: -1,
    zigzagOffset: -1,
    seed: 0
  };

  constructor(config?: Config) {
    this.config = config || {};
    if (this.config.options) {
      this.defaultOptions = this._o(this.config.options);
    }
  }

  static newSeed(): number {
    return randomSeed();
  }

  private _o(options?: Options): ResolvedOptions {
    return options ? Object.assign({}, this.defaultOptions, options) : this.defaultOptions;
  }

  private _d(shape: string, sets: OpSet[], options: ResolvedOptions): Drawable {
    return { shape, sets: sets || [], options: options || this.defaultOptions };
  }

  line(x1: number, y1: number, x2: number, y2: number, options?: Options): Drawable {
    const o = this._o(options);
    return this._d('line', [line(x1, y1, x2, y2, o)], o);
  }

  rectangle(x: number, y: number, width: number, height: number, options?: Options): Drawable {
    const o = this._o(options);
    const paths = [];
    const outline = rectangle(x, y, width, height, o);
    if (o.fill) {
      const points: Point[] = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
      if (o.fillStyle === 'solid') {
        paths.push(solidFillPolygon(points, o));
      } else {
        paths.push(patternFillPolygon(points, o));
      }
    }
    if (o.stroke !== NOS) {
      paths.push(outline);
    }
    return this._d('rectangle', paths, o);
  }

  ellipse(x: number, y: number, width: number, height: number, options?: Options): Drawable {
    const o = this._o(options);
    const paths: OpSet[] = [];
    const ellipseParams = generateEllipseParams(width, height, o);
    const ellipseResponse = ellipseWithParams(x, y, o, ellipseParams);
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        const shape = ellipseWithParams(x, y, o, ellipseParams).opset;
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(patternFillPolygon(ellipseResponse.estimatedPoints, o));
      }
    }
    if (o.stroke !== NOS) {
      paths.push(ellipseResponse.opset);
    }
    return this._d('ellipse', paths, o);
  }

  circle(x: number, y: number, diameter: number, options?: Options): Drawable {
    const ret = this.ellipse(x, y, diameter, diameter, options);
    ret.shape = 'circle';
    return ret;
  }

  linearPath(points: Point[], options?: Options): Drawable {
    const o = this._o(options);
    return this._d('linearPath', [linearPath(points, false, o)], o);
  }

  arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean = false, options?: Options): Drawable {
    const o = this._o(options);
    const paths = [];
    const outline = arc(x, y, width, height, start, stop, closed, true, o);
    if (closed && o.fill) {
      if (o.fillStyle === 'solid') {
        const shape = arc(x, y, width, height, start, stop, true, false, o);
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(patternFillArc(x, y, width, height, start, stop, o));
      }
    }
    if (o.stroke !== NOS) {
      paths.push(outline);
    }
    return this._d('arc', paths, o);
  }

  curve(points: Point[], options?: Options): Drawable {
    const o = this._o(options);
    const paths: OpSet[] = [];
    const outline = curve(points, o);
    if (o.fill && o.fill !== NOS && points.length >= 3) {
      const bcurve = curveToBezier(points);
      const polyPoints = pointsOnBezierCurves(bcurve, 10, (1 + o.roughness) / 2);
      if (o.fillStyle === 'solid') {
        paths.push(solidFillPolygon(polyPoints, o));
      } else {
        paths.push(patternFillPolygon(polyPoints, o));
      }
    }
    if (o.stroke !== NOS) {
      paths.push(outline);
    }
    return this._d('curve', paths, o);
  }

  polygon(points: Point[], options?: Options): Drawable {
    const o = this._o(options);
    const paths: OpSet[] = [];
    const outline = linearPath(points, true, o);
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        paths.push(solidFillPolygon(points, o));
      } else {
        paths.push(patternFillPolygon(points, o));
      }
    }
    if (o.stroke !== NOS) {
      paths.push(outline);
    }
    return this._d('polygon', paths, o);
  }

  path(d: string, options?: Options): Drawable {
    const o = this._o(options);
    const paths: OpSet[] = [];
    if (!d) {
      return this._d('path', paths, o);
    }
    const outline = svgPath(d, o);
    if (o.fill) {
      const polyPoints = (pointsOnPath(d, 1, (1 + o.roughness) / 2)).points;
      if (o.fillStyle === 'solid') {
        paths.push(solidFillPolygon(polyPoints, o));
      } else {
        paths.push(patternFillPolygon(polyPoints, o));
      }
    }
    if (o.stroke !== NOS) {
      paths.push(outline);
    }
    return this._d('path', paths, o);
  }

  opsToPath(drawing: OpSet): string {
    let path = '';
    for (const item of drawing.ops) {
      const data = item.data;
      switch (item.op) {
        case 'move':
          path += `M${data[0]} ${data[1]} `;
          break;
        case 'bcurveTo':
          path += `C${data[0]} ${data[1]}, ${data[2]} ${data[3]}, ${data[4]} ${data[5]} `;
          break;
        case 'lineTo':
          path += `L${data[0]} ${data[1]} `;
          break;
      }
    }
    return path.trim();
  }

  toPaths(drawable: Drawable): PathInfo[] {
    const sets = drawable.sets || [];
    const o = drawable.options || this.defaultOptions;
    const paths: PathInfo[] = [];
    for (const drawing of sets) {
      let path: PathInfo | null = null;
      switch (drawing.type) {
        case 'path':
          path = {
            d: this.opsToPath(drawing),
            stroke: o.stroke,
            strokeWidth: o.strokeWidth,
            fill: NOS
          };
          break;
        case 'fillPath':
          path = {
            d: this.opsToPath(drawing),
            stroke: NOS,
            strokeWidth: 0,
            fill: o.fill || NOS
          };
          break;
        case 'fillSketch':
          path = this.fillSketch(drawing, o);
          break;
      }
      if (path) {
        paths.push(path);
      }
    }
    return paths;
  }

  private fillSketch(drawing: OpSet, o: ResolvedOptions): PathInfo {
    let fweight = o.fillWeight;
    if (fweight < 0) {
      fweight = o.strokeWidth / 2;
    }
    return {
      d: this.opsToPath(drawing),
      stroke: o.fill || NOS,
      strokeWidth: fweight,
      fill: NOS
    };
  }
}