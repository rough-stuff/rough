import { RoughDrawable } from './drawable';

export class RoughPolygon extends RoughDrawable {
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
    if (this.fill) {
      this._doFill(ctx, this._points);
    }
    ctx.save();
    ctx.strokeStyle = this.stroke;
    ctx.lineWidth = this.strokeWidth;
    this.drawLinearPath(ctx, this._points, true);
    ctx.restore();
  }

  _doFill(ctx, points) {
    var fillStyle = this.fillStyle || "hachure";
    switch (fillStyle) {
      case "solid": {
        ctx.save();
        ctx.fillStyle = this.fill;
        let o = this.maxRandomnessOffset || 0;
        const len = points.length;
        if (len > 2) {
          ctx.beginPath();
          ctx.moveTo(points[0][0] + this.getOffset(-o, o), points[0][1] + this.getOffset(-o, o));
          for (var i = 1; i < len; i++) {
            ctx.lineTo(points[i][0] + this.getOffset(-o, o), points[i][1] + this.getOffset(-o, o));
          }
          ctx.fill();
        }
        ctx.restore();
        break;
      }
      default: {
        let xc = [];
        let yc = [];
        points.forEach(function (p) {
          xc.push(p[0]);
          yc.push(p[1]);
        });
        this.hachureFillShape(ctx, xc, yc);
        break;
      }
    }
  }
}