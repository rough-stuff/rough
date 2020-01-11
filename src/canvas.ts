import { Config, Options, ResolvedOptions, Drawable, OpSet, SVGNS } from './core';
import { RoughGenerator } from './generator';
import { Point } from './geometry';

const hasDocument = typeof document !== 'undefined';

export class RoughCanvas {
  private gen: RoughGenerator;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, config?: Config) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d')!;
    this.gen = new RoughGenerator(config, this.canvas);
  }

  draw(drawable: Drawable) {
    const sets = drawable.sets || [];
    const o = drawable.options || this.getDefaultOptions();
    const ctx = this.ctx;
    for (const drawing of sets) {
      switch (drawing.type) {
        case 'path':
          ctx.save();
          ctx.strokeStyle = o.stroke === 'none' ? 'transparent' : o.stroke;
          ctx.lineWidth = o.strokeWidth;
          this._drawToContext(ctx, drawing);
          ctx.restore();
          break;
        case 'fillPath':
          ctx.save();
          ctx.fillStyle = o.fill || '';
          this._drawToContext(ctx, drawing);
          ctx.restore();
          break;
        case 'fillSketch':
          this.fillSketch(ctx, drawing, o);
          break;
        case 'path2Dfill': {
          this.ctx.save();
          this.ctx.fillStyle = o.fill || '';
          const p2d = new Path2D(drawing.path);
          this.ctx.fill(p2d);
          this.ctx.restore();
          break;
        }
        case 'path2Dpattern': {
          const doc = this.canvas.ownerDocument || (hasDocument && document);
          if (doc) {
            const size = drawing.size!;
            const hcanvas = doc.createElement('canvas');
            const hcontext = hcanvas.getContext('2d')!;
            const bbox = this.computeBBox(drawing.path!);
            if (bbox && (bbox.width || bbox.height)) {
              hcanvas.width = this.canvas.width;
              hcanvas.height = this.canvas.height;
              hcontext.translate(bbox.x || 0, bbox.y || 0);
            } else {
              hcanvas.width = size[0];
              hcanvas.height = size[1];
            }
            this.fillSketch(hcontext, drawing, o);
            this.ctx.save();
            this.ctx.fillStyle = this.ctx.createPattern(hcanvas, 'repeat')!;
            const p2d = new Path2D(drawing.path);
            this.ctx.fill(p2d);
            this.ctx.restore();
          } else {
            console.error('Pattern fill fail: No defs');
          }
          break;
        }
      }
    }
  }

  private computeBBox(d: string): SVGRect | null {
    if (hasDocument) {
      try {
        const svg = document.createElementNS(SVGNS, 'svg');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        const pathNode = self.document.createElementNS(SVGNS, 'path');
        pathNode.setAttribute('d', d);
        svg.appendChild(pathNode);
        document.body.appendChild(svg);
        const bbox = pathNode.getBBox();
        document.body.removeChild(svg);
        return bbox;
      } catch (err) { }
    }
    return null;
  }

  private fillSketch(ctx: CanvasRenderingContext2D, drawing: OpSet, o: ResolvedOptions) {
    let fweight = o.fillWeight;
    if (fweight < 0) {
      fweight = o.strokeWidth / 2;
    }
    ctx.save();
    ctx.strokeStyle = o.fill || '';
    ctx.lineWidth = fweight;
    this._drawToContext(ctx, drawing);
    ctx.restore();
  }

  private _drawToContext(ctx: CanvasRenderingContext2D, drawing: OpSet) {
    ctx.beginPath();
    for (const item of drawing.ops) {
      const data = item.data;
      switch (item.op) {
        case 'move':
          ctx.moveTo(data[0], data[1]);
          break;
        case 'bcurveTo':
          ctx.bezierCurveTo(data[0], data[1], data[2], data[3], data[4], data[5]);
          break;
        case 'qcurveTo':
          ctx.quadraticCurveTo(data[0], data[1], data[2], data[3]);
          break;
        case 'lineTo':
          ctx.lineTo(data[0], data[1]);
          break;
      }
    }
    if (drawing.type === 'fillPath') {
      ctx.fill();
    } else {
      ctx.stroke();
    }
  }

  get generator(): RoughGenerator {
    return this.gen;
  }

  getDefaultOptions(): ResolvedOptions {
    return this.gen.defaultOptions;
  }

  line(x1: number, y1: number, x2: number, y2: number, options?: Options): Drawable {
    const d = this.gen.line(x1, y1, x2, y2, options);
    this.draw(d);
    return d;
  }

  rectangle(x: number, y: number, width: number, height: number, options?: Options): Drawable {
    const d = this.gen.rectangle(x, y, width, height, options);
    this.draw(d);
    return d;
  }

  ellipse(x: number, y: number, width: number, height: number, options?: Options): Drawable {
    const d = this.gen.ellipse(x, y, width, height, options);
    this.draw(d);
    return d;
  }

  circle(x: number, y: number, diameter: number, options?: Options): Drawable {
    const d = this.gen.circle(x, y, diameter, options);
    this.draw(d);
    return d;
  }

  linearPath(points: Point[], options?: Options): Drawable {
    const d = this.gen.linearPath(points, options);
    this.draw(d);
    return d;
  }

  polygon(points: Point[], options?: Options): Drawable {
    const d = this.gen.polygon(points, options);
    this.draw(d);
    return d;
  }

  arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean = false, options?: Options): Drawable {
    const d = this.gen.arc(x, y, width, height, start, stop, closed, options);
    this.draw(d);
    return d;
  }

  curve(points: Point[], options?: Options): Drawable {
    const d = this.gen.curve(points, options);
    this.draw(d);
    return d;
  }

  path(d: string, options?: Options): Drawable {
    const drawing = this.gen.path(d, options);
    this.draw(drawing);
    return drawing;
  }
}