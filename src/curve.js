import { RoughDrawable } from './drawable';

export class RoughCurve extends RoughDrawable {
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
    let o = this.maxRandomnessOffset || 0;
    var p1 = [];
    var p2 = [];
    p1.push(this._points[0]);
    p1.push(this._points[0]);
    var px = [this._points[0][0] + this.getOffset(-o, o), this._points[0][1] + this.getOffset(-o, o)];
    p2.push(px);
    p2.push(px);

    var lastIndex = this._points.length - 1;
    for (var i = 1; i < lastIndex; i++) {
      p1.push(this._points[i]);
      if ((i % 3) == 0) {
        p2.push([this._points[i][0] + this.getOffset(-o, o), this._points[i][1] + this.getOffset(-o, o)]);
      } else {
        p2.push(this._points[i]);
      }
    }

    p1.push(this._points[lastIndex]);
    p1.push(this._points[lastIndex]);
    var px2 = [this._points[lastIndex][0] + this.getOffset(-o, o), this._points[lastIndex][1] + this.getOffset(-o, o)];
    p2.push(px2);
    p2.push(px2);

    this.drawCurve(ctx, p1);
    this.drawCurve(ctx, p2);
    ctx.restore();
  }
}