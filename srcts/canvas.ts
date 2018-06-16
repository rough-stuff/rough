import { Config, Options, Drawable, OpSet } from './core';
import { RoughGenerator } from './generator';
import { RoughRenderer } from './renderer';

export class RoughCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gen: RoughGenerator;

  constructor(canvas: HTMLCanvasElement, config?: Config) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d')!;
    this.gen = new RoughGenerator(config || null, this.canvas);
  }

  get generator(): RoughGenerator {
    return this.gen;
  }

  static createRenderer(): RoughRenderer {
    return new RoughRenderer();
  }

  line(x1: number, y1: number, x2: number, y2: number, options?: Options) {
    const d = this.gen.line(x1, y1, x2, y2, options);
    this.draw(d);
    return d;
  }

  rectangle(x: number, y: number, width: number, height: number, options: Options) {
    const d = this.gen.rectangle(x, y, width, height, options);
    this.draw(d);
    return d;
  }

  draw(drawable: Drawable) {
    const sets = drawable.sets || [];
    const o = drawable.options || this.gen.defaultOptions;
    const ctx = this.ctx;
    for (const drawing of sets) {
      switch (drawing.type) {
        case 'path':
          ctx.save();
          ctx.strokeStyle = o.stroke;
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
      }
    }
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
}