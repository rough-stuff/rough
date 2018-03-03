import { RoughRenderer } from './core/renderer.js';

export default class RoughCanvas {
  constructor(canvas, useWorker) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this.useWorker = useWorker;
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
  }

  _options(options) {
    return options ? Object.assign({}, this.defaultOptions, options) : this.defaultOptions;
  }

  _draw(ctx, drawing) {
    if (drawing.type === 'path') {
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
            console.warn("lineTo not implemented yet");
            break;
        }
      }
      ctx.stroke();
    }
  }

  async lib() {
    if (!this._renderer) {
      if (this.useWorker) {
        // let Renderer = workly.proxy(RoughRenderer);
        // this._renderer = await new Renderer();
        this._renderer = new RoughRenderer();
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
    let ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = o.stroke;
    ctx.lineWidth = o.strokeWidth;
    this._draw(ctx, drawing);
    ctx.restore();
  }

  async arc() {
    // TODO: 
  }
}