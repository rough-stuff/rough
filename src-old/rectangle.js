import { RoughDrawable } from './drawable';

export class RoughRectangle extends RoughDrawable {
  constructor(x, y, width, height) {
    super(['x', 'y', 'width', 'height']);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  draw(ctx) {
    let left = this.x;
    let right = this.x + this.width;
    let top = this.y;
    let bottom = this.y + this.height;

    if (this.fill) {
      this._doFill(ctx, left, right, top, bottom);
    }

    ctx.save();
    ctx.strokeStyle = this.stroke;
    ctx.lineWidth = this.strokeWidth;
    this.drawLine(ctx, left, top, right, top);
    this.drawLine(ctx, right, top, right, bottom);
    this.drawLine(ctx, right, bottom, left, bottom);
    this.drawLine(ctx, left, bottom, left, top);
    ctx.restore();
  }

  _doFill(ctx, left, right, top, bottom) {
    var fillStyle = this.fillStyle || "hachure";
    switch (fillStyle) {
      case "solid": {
        ctx.save();
        ctx.fillStyle = this.fill;
        let o = this.maxRandomnessOffset || 0;
        var points = [
          [left + this.getOffset(-o, o), top + this.getOffset(-o, o)],
          [right + this.getOffset(-o, o), top + this.getOffset(-o, o)],
          [right + this.getOffset(-o, o), bottom + this.getOffset(-o, o)],
          [left + this.getOffset(-o, o), bottom + this.getOffset(-o, o)]
        ];
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        ctx.lineTo(points[1][0], points[1][1]);
        ctx.lineTo(points[2][0], points[2][1]);
        ctx.lineTo(points[3][0], points[3][1]);
        ctx.fill();
        ctx.restore();
        break;
      }
      default: {
        let xc = [left, right, right, left];
        let yc = [top, top, bottom, bottom];
        this.hachureFillShape(ctx, xc, yc);
        break;
      }
    }
  }
}