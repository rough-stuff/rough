import { RoughSegmentRelation, RoughSegment } from './core/segment.js';
import { RoughHachureIterator } from './core/hachure.js';
import { RoughRenderer } from './core/renderer.js';

export default class RoughCanvas {
  constructor(canvas, config) {
    this.config = config || {};
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this.defaultOptions = {
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
    if (this.config.options) {
      this.defaultOptions = this._options(this.config.options);
    }
  }

  async lib() {
    if (!this._renderer) {
      if (window.workly && (!this.config.noWorker)) {
        const tos = Function.prototype.toString;
        const worklySource = this.config.worklyURL || 'https://cdn.jsdelivr.net/gh/pshihn/workly/dist/workly.min.js';
        let code = `importScripts('${worklySource}');\n${tos.call(RoughSegmentRelation)}\n${tos.call(RoughSegment)}\n${tos.call(RoughHachureIterator)}\nself._rendererClass=${tos.call(RoughRenderer)}\nworkly.expose(self._rendererClass);`;
        let ourl = URL.createObjectURL(new Blob([code]));
        let ProxyRenderer = workly.proxy(ourl);
        this._renderer = await new ProxyRenderer();
      } else {
        this._renderer = new RoughRenderer();
      }
    }
    return this._renderer;
  }

  async line(x1, y1, x2, y2, options) {
    let o = this._options(options);
    let lib = await this.lib();
    let drawing = await lib.line(x1, y1, x2, y2, o);
    this._draw(this.ctx, drawing, o);
  }

  async rectangle(x, y, width, height, options) {
    let o = this._options(options);
    let lib = await this.lib();
    if (o.fill) {
      let ctx = this.ctx;
      const xc = [x, x + width, x + width, x];
      const yc = [y, y, y + height, y + height];
      if (o.fillStyle === 'solid') {
        let fillShape = await lib.solidFillShape(xc, yc, o);
        this._fill(ctx, fillShape, o);
      } else {
        let fillShape = await lib.hachureFillShape(xc, yc, o);
        this._fillSketch(ctx, fillShape, o);
      }
    }
    let drawing = await lib.rectangle(x, y, width, height, o);
    this._draw(this.ctx, drawing, o);
  }

  async ellipse(x, y, width, height, options) {
    let o = this._options(options);
    let lib = await this.lib();
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        let fillShape = await lib.ellipse(x, y, width, height, o);
        this._fill(this.ctx, fillShape, o);
      } else {
        let fillShape = await lib.hachureFillEllipse(x, y, width, height, o);
        this._fillSketch(this.ctx, fillShape, o);
      }
    }
    let drawing = await lib.ellipse(x, y, width, height, o);
    this._draw(this.ctx, drawing, o);
  }

  async circle(x, y, radius, options) {
    return await this.ellipse(x, y, radius, radius, options);
  }

  async linearPath(points, options) {
    let o = this._options(options);
    let lib = await this.lib();
    let drawing = await lib.linearPath(points, false, o);
    this._draw(this.ctx, drawing, o);
  }

  async polygon(points, options) {
    let o = this._options(options);
    let lib = await this.lib();
    if (o.fill) {
      let xc = [], yc = [];
      for (let p of points) {
        xc.push(p[0]);
        yc.push(p[1]);
      }
      if (o.fillStyle === 'solid') {
        let fillShape = await lib.solidFillShape(xc, yc, o);
        this._fill(this.ctx, fillShape, o);
      } else {
        let fillShape = await lib.hachureFillShape(xc, yc, o);
        this._fillSketch(this.ctx, fillShape, o);
      }
    }
    let drawing = await lib.linearPath(points, true, o);
    this._draw(this.ctx, drawing, o);
  }

  async arc(x, y, width, height, start, stop, closed, options) {
    let o = this._options(options);
    let lib = await this.lib();
    if (closed && o.fill) {
      if (o.fillStyle === 'solid') {
        let fillShape = await lib.arc(x, y, width, height, start, stop, true, false, o);
        this._fill(this.ctx, fillShape, o);
      } else {
        let fillShape = await lib.hachureFillArc(x, y, width, height, start, stop, o);
        this._fillSketch(this.ctx, fillShape, o);
      }
    }
    let drawing = await lib.arc(x, y, width, height, start, stop, closed, true, o);
    this._draw(this.ctx, drawing, o);
  }

  async curve(points, options) {
    let o = this._options(options);
    let lib = await this.lib();
    let drawing = await lib.curve(points, o);
    this._draw(this.ctx, drawing, o);
  }

  // private

  _options(options) {
    return options ? Object.assign({}, this.defaultOptions, options) : this.defaultOptions;
  }

  _draw(ctx, drawing, o) {
    ctx.save();
    ctx.strokeStyle = o.stroke;
    ctx.lineWidth = o.strokeWidth;
    this._drawToContext(ctx, drawing);
    ctx.restore();
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

  _fill(ctx, drawing, o) {
    ctx.save();
    ctx.fillStyle = o.fill;
    drawing.type = 'fillPath';
    this._drawToContext(ctx, drawing, o);
    ctx.restore();
  }

  _drawToContext(ctx, drawing) {
    if (drawing.type === 'path' || drawing.type === 'fillPath') {
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
}