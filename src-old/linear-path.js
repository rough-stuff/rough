import { RoughDrawable } from './drawable';

export class RoughLinearPath extends RoughDrawable {
  constructor(points) {
    super();
    this._points = points;
  }

  setPoint(index, x, y) {
    this._points[index] = [x, y];
    if (this._canvas) {
      this._canvas.requestDraw();
    }
  }

  getPoint(index) {
    if (index > 0 && index < this._points.length) {
      return this._points[index];
    }
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.strokeStyle = this.stroke;
    ctx.lineWidth = this.strokeWidth;
    this.drawLinearPath(ctx, this._points, false);
    ctx.restore();
  }
}