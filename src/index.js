import { RoughSegmentRelation, RoughSegment } from './segment.js';
import { RoughHachureIterator } from './hachure.js';
import { RoughRenderer } from './renderer.js';

self._roughScript = self.document && self.document.currentScript && self.document.currentScript.src;

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

  static createRenderer() {
    return new RoughRenderer();
  }

  async lib() {
    if (!this._renderer) {
      if (window.workly && (!this.config.noWorker)) {
        const tos = Function.prototype.toString;
        const worklySource = this.config.worklyURL || 'https://cdn.jsdelivr.net/gh/pshihn/workly/dist/workly.min.js';
        const rendererSource = this.config.roughURL || self._roughScript;
        if (rendererSource && worklySource) {
          let code = `importScripts('${worklySource}', '${rendererSource}');\nworkly.expose(self.RoughCanvas.createRenderer());`;
          let ourl = URL.createObjectURL(new Blob([code]));
          this._renderer = workly.proxy(ourl);
        } else {
          this._renderer = new RoughRenderer();
        }
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

  async path(d, options) {
    if (!d) {
      return;
    }
    let o = this._options(options);
    let lib = await this.lib();
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        this.ctx.save();
        this.ctx.fillStyle = o.fill;
        let p2d = new Path2D(d);
        this.ctx.fill(p2d);
        this.ctx.restore();
      } else {
        let size = [0, 0];
        try {
          const ns = "http://www.w3.org/2000/svg";
          let svg = document.createElementNS(ns, "svg");
          svg.setAttribute("width", "0");
          svg.setAttribute("height", "0");
          let pathNode = document.createElementNS(ns, "path");
          pathNode.setAttribute('d', d);
          svg.appendChild(pathNode);
          document.body.appendChild(svg);
          let bb = pathNode.getBBox()
          if (bb) {
            size[0] = bb.width || 0;
            size[1] = bb.height || 0;
          }
          document.body.removeChild(svg);
        } catch (err) { }
        if (!(size[0] * size[1])) {
          size = [this.canvas.width || 100, this.canvas.height || 100];
        }
        size[0] = Math.min(size[0] * 4, this.canvas.width);
        size[1] = Math.min(size[1] * 4, this.canvas.height);
        let xc = [0, size[0], size[0], 0];
        let yc = [0, 0, size[1], size[1]];
        let fillShape = await lib.hachureFillShape(xc, yc, o);
        let hcanvas = document.createElement('canvas');
        hcanvas.width = size[0];
        hcanvas.height = size[1];
        this._fillSketch(hcanvas.getContext("2d"), fillShape, o);
        this.ctx.save();
        this.ctx.fillStyle = this.ctx.createPattern(hcanvas, 'repeat');
        let p2d = new Path2D(d);
        this.ctx.fill(p2d);
        this.ctx.restore();
      }
    }
    let drawing = await lib.svgPath(d, o);
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
}