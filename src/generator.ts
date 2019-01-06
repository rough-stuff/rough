import { Options, Drawable, OpSet } from './core';
import { Point } from './geometry.js';
import { RoughGeneratorBase } from './generator-base.js';
import { line, solidFillPolygon, patternFillPolygon, rectangle, ellipse, patternFillEllipse, linearPath, arc, patternFillArc, curve, svgPath } from './renderer.js';

export class RoughGenerator extends RoughGeneratorBase {
  line(x1: number, y1: number, x2: number, y2: number, options?: Options): Drawable {
    const o = this._options(options);
    return this._drawable('line', [line(x1, y1, x2, y2, o)], o);
  }

  rectangle(x: number, y: number, width: number, height: number, options?: Options): Drawable {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      const points: Point[] = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
      if (o.fillStyle === 'solid') {
        paths.push(solidFillPolygon(points, o));
      } else {
        paths.push(patternFillPolygon(points, o));
      }
    }
    paths.push(rectangle(x, y, width, height, o));
    return this._drawable('rectangle', paths, o);
  }

  ellipse(x: number, y: number, width: number, height: number, options?: Options): Drawable {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        const shape = ellipse(x, y, width, height, o);
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(patternFillEllipse(x, y, width, height, o));
      }
    }
    paths.push(ellipse(x, y, width, height, o));
    return this._drawable('ellipse', paths, o);
  }

  circle(x: number, y: number, diameter: number, options?: Options): Drawable {
    const ret = this.ellipse(x, y, diameter, diameter, options);
    ret.shape = 'circle';
    return ret;
  }

  linearPath(points: Point[], options?: Options): Drawable {
    const o = this._options(options);
    return this._drawable('linearPath', [linearPath(points, false, o)], o);
  }

  arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean = false, options?: Options): Drawable {
    const o = this._options(options);
    const paths = [];
    if (closed && o.fill) {
      if (o.fillStyle === 'solid') {
        const shape = arc(x, y, width, height, start, stop, true, false, o);
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(patternFillArc(x, y, width, height, start, stop, o));
      }
    }
    paths.push(arc(x, y, width, height, start, stop, closed, true, o));
    return this._drawable('arc', paths, o);
  }

  curve(points: Point[], options?: Options): Drawable {
    const o = this._options(options);
    return this._drawable('curve', [curve(points, o)], o);
  }

  polygon(points: Point[], options?: Options): Drawable {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        paths.push(solidFillPolygon(points, o));
      } else {
        const size = this.computePolygonSize(points);
        const fillPoints: Point[] = [
          [0, 0],
          [size[0], 0],
          [size[0], size[1]],
          [0, size[1]]
        ];
        const shape = patternFillPolygon(fillPoints, o);
        shape.type = 'path2Dpattern';
        shape.size = size;
        shape.path = this.polygonPath(points);
        paths.push(shape);
      }
    }
    paths.push(linearPath(points, true, o));
    return this._drawable('polygon', paths, o);
  }

  path(d: string, options?: Options): Drawable {
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
        const shape = patternFillPolygon(points, o);
        shape.type = 'path2Dpattern';
        shape.size = size;
        shape.path = d;
        paths.push(shape);
      }
    }
    paths.push(svgPath(d, o));
    return this._drawable('path', paths, o);
  }
}