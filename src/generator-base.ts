import { Config, DrawingSurface, Options, ResolvedOptions, Drawable, OpSet, PathInfo, PatternInfo } from './core';
import { Point } from './geometry.js';

const hasSelf = typeof self !== 'undefined';

export abstract class RoughGeneratorBase {
  protected config: Config;
  protected surface: DrawingSurface;

  defaultOptions: ResolvedOptions = {
    maxRandomnessOffset: 2,
    roughness: 1,
    bowing: 1,
    stroke: '#000',
    strokeWidth: 1,
    curveTightness: 0,
    curveStepCount: 9,
    fillStyle: 'hachure',
    fillWeight: -1,
    hachureAngle: -41,
    hachureGap: -1,
    dashOffset: -1,
    dashGap: -1,
    zigzagOffset: -1
  };

  constructor(config: Config | null, surface: DrawingSurface) {
    this.config = config || {};
    this.surface = surface;
    if (this.config.options) {
      this.defaultOptions = this._options(this.config.options);
    }
  }

  protected _options(options?: Options): ResolvedOptions {
    return options ? Object.assign({}, this.defaultOptions, options) : this.defaultOptions;
  }

  protected _drawable(shape: string, sets: OpSet[], options: ResolvedOptions): Drawable {
    return { shape, sets: sets || [], options: options || this.defaultOptions };
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

  protected computePolygonSize(points: Point[]): Point {
    if (points.length) {
      let left = points[0][0];
      let right = points[0][0];
      let top = points[0][1];
      let bottom = points[0][1];
      for (let i = 1; i < points.length; i++) {
        left = Math.min(left, points[i][0]);
        right = Math.max(right, points[i][0]);
        top = Math.min(top, points[i][1]);
        bottom = Math.max(bottom, points[i][1]);
      }
      return [(right - left), (bottom - top)];
    }
    return [0, 0];
  }

  protected polygonPath(points: Point[]): string {
    let d = '';
    if (points.length) {
      d = `M${points[0][0]},${points[0][1]}`;
      for (let i = 1; i < points.length; i++) {
        d = `${d} L${points[i][0]},${points[i][1]}`;
      }
    }
    return d;
  }

  protected computePathSize(d: string): Point {
    let size: Point = [0, 0];
    if (hasSelf && self.document) {
      try {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = self.document.createElementNS(ns, 'svg');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        const pathNode = self.document.createElementNS(ns, 'path');
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
            fill: 'none'
          };
          break;
        case 'fillPath':
          path = {
            d: this.opsToPath(drawing),
            stroke: 'none',
            strokeWidth: 0,
            fill: o.fill || 'none'
          };
          break;
        case 'fillSketch':
          path = this.fillSketch(drawing, o);
          break;
        case 'path2Dfill':
          path = {
            d: drawing.path || '',
            stroke: 'none',
            strokeWidth: 0,
            fill: o.fill || 'none'
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
            stroke: 'none',
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
      stroke: o.fill || 'none',
      strokeWidth: fweight,
      fill: 'none'
    };
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
}