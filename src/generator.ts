import { Config, DrawingSurface, Options, Drawable, OpSet, ResolvedOptions, PathInfo, PatternInfo, SVGNS } from './core';
import { Point } from './geometry.js';
import { line, solidFillPolygon, patternFillPolygon, rectangle, ellipseWithParams, generateEllipseParams, linearPath, arc, patternFillArc, curve, svgPath } from './renderer.js';
import { randomSeed } from './math';

const hasSelf = typeof self !== 'undefined';
const NOS = 'none';

export class RoughGenerator {
  private config: Config;
  private surface?: DrawingSurface;

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
    seed: 0,
    roughnessGain: 1
  };

  constructor(config?: Config, surface?: DrawingSurface) {
    this.config = config || {};
    this.surface = surface;
    if (this.config.options) {
      this.defaultOptions = this._options(this.config.options);
    }
  }

  static newSeed(): number {
    return randomSeed();
  }

  private _options(options?: Options): ResolvedOptions {
    return options ? Object.assign({}, this.defaultOptions, options) : this.defaultOptions;
  }

  private _drawable(shape: string, sets: OpSet[], options: ResolvedOptions): Drawable {
    return { shape, sets: sets || [], options: options || this.defaultOptions };
  }

  line(x1: number, y1: number, x2: number, y2: number, options?: Options): Drawable {
    const o = this._options(options);
    return this._drawable('line', [line(x1, y1, x2, y2, o)], o);
  }

  rectangle(x: number, y: number, width: number, height: number, options?: Options): Drawable {
    const o = this._options(options);
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
    return this._drawable('rectangle', paths, o);
  }

  ellipse(x: number, y: number, width: number, height: number, options?: Options): Drawable {
    const o = this._options(options);
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
    return this._drawable('arc', paths, o);
  }

  curve(points: Point[], options?: Options): Drawable {
    const o = this._options(options);
    return this._drawable('curve', [curve(points, o)], o);
  }

  polygon(points: Point[], options?: Options): Drawable {
    const o = this._options(options);
    const paths = [];
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
    return this._drawable('polygon', paths, o);
  }

  path(d: string, options?: Options): Drawable {
    const o = this._options(options);
    const paths: OpSet[] = [];
    if (!d) {
      return this._drawable('path', paths, o);
    }
    const outline = svgPath(d, o);
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
    if (o.stroke !== NOS) {
      paths.push(outline);
    }
    return this._drawable('path', paths, o);
  }

  private computePathSize(d: string): Point {
    let size: Point = [0, 0];
    if (hasSelf && self.document) {
      try {
        const svg = self.document.createElementNS(SVGNS, 'svg');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        const pathNode = self.document.createElementNS(SVGNS, 'path');
        pathNode.setAttribute('d', d);
        svg.appendChild(pathNode);
        self.document.body.appendChild(svg);
        const bb = pathNode.getBBox();
        if (bb) {
          size[0] = bb.width || 0;
          size[1] = bb.height || 0;
        }
        self.document.body.removeChild(svg);
      } catch (err) { }
    }
    const canvasSize = this.getCanvasSize();
    if (!(size[0] * size[1])) {
      size = canvasSize;
    }
    return size;
  }

  private getCanvasSize(): Point {
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
        case 'qcurveTo':
          path += `Q${data[0]} ${data[1]}, ${data[2]} ${data[3]} `;
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
        case 'path2Dfill':
          path = {
            d: drawing.path || '',
            stroke: NOS,
            strokeWidth: 0,
            fill: o.fill || NOS
          };
          break;
        case 'path2Dpattern': {
          const size = drawing.size!;
          const pattern: PatternInfo = {
            x: 0, y: 0, width: 1, height: 1,
            viewBox: `0 0 ${Math.round(size[0])} ${Math.round(size[1])}`,
            patternUnits: 'objectBoundingBox',
            path: this.fillSketch(drawing, o)
          };
          path = {
            d: drawing.path!,
            stroke: NOS,
            strokeWidth: 0,
            pattern: pattern
          };
          break;
        }
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