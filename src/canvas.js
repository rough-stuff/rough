import { RoughGenerator } from './generator.js'
import { RoughRenderer } from './renderer.js';

export class RoughCanvas {
  constructor(canvas, config) {
    this.gen = new RoughGenerator(config, canvas);
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
  }

  static createRenderer() {
    return new RoughRenderer();
  }

  line(x1, y1, x2, y2, options) {
    let d = this.gen.line(x1, y1, x2, y2, options);
    this.draw(d);
    return d;
  }

  rectangle(x, y, width, height, options) {
    let d = this.gen.rectangle(x, y, width, height, options);
    this.draw(d);
    return d;
  }

  ellipse(x, y, width, height, options) {
    let d = this.gen.ellipse(x, y, width, height, options);
    this.draw(d);
    return d;
  }

  circle(x, y, diameter, options) {
    let d = this.gen.circle(x, y, diameter, options);
    this.draw(d);
    return d;
  }

  linearPath(points, options) {
    let d = this.gen.linearPath(points, options);
    this.draw(d);
    return d;
  }

  polygon(points, options) {
    let d = this.gen.polygon(points, options);
    this.draw(d);
    return d;
  }

  arc(x, y, width, height, start, stop, closed, options) {
    let d = this.gen.arc(x, y, width, height, start, stop, closed, options);
    this.draw(d);
    return d;
  }

  curve(points, options) {
    let d = this.gen.curve(points, options);
    this.draw(d);
    return d;
  }

  path(d, options) {
    let drawing = this.gen.path(d, options);
    this.draw(drawing);
    return drawing;
  }

  draw(drawable) {
    let sets = drawable.sets || [];
    let o = drawable.options || this.gen.defaultOptions;
    let ctx = this.ctx;
    for (let drawing of sets) {
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
          ctx.fillStyle = o.fill;
          this._drawToContext(ctx, drawing, o);
          ctx.restore();
          break;
        case 'fillSketch':
          this._fillSketch(ctx, drawing, o);
          break;
        case 'path2Dfill': {
          this.ctx.save();
          this.ctx.fillStyle = o.fill;
          let p2d = new Path2D(drawing.path);
          this.ctx.fill(p2d);
          this.ctx.restore();
          break;
        }
        case 'path2Dpattern': {
          let size = drawing.size;
          let hcanvas = document.createElement('canvas');
          hcanvas.width = size[0];
          hcanvas.height = size[1];
          this._fillSketch(hcanvas.getContext("2d"), drawing, o);
          this.ctx.save();
          this.ctx.fillStyle = this.ctx.createPattern(hcanvas, 'repeat');
          let p2d = new Path2D(drawing.path);
          this.ctx.fill(p2d);
          this.ctx.restore();
          break;
        }
      }
    }
  }

  _fillSketch(ctx, drawing, o) {
    let fweight = o.fillWeight;
    if (fweight < 0) {
      fweight = o.strokeWidth / 2;
    }
    ctx.save();
    ctx.strokeStyle = o.fill;
    ctx.lineWidth = fweight;
    this._drawToContext(ctx, drawing);
    ctx.restore();
  }

  _drawToContext(ctx, drawing) {
    ctx.beginPath();
    for (let item of drawing.ops) {
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