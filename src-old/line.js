import { RoughDrawable } from './drawable';

export class RoughLine extends RoughDrawable {
  constructor(x1, y1, x2, y2) {
    super(['x1', 'y1', 'x2', 'y2']);
    this.x1 = x1;
    this.x2 = x2;
    this.y1 = y1;
    this.y2 = y2;
  }

  draw(ctx) {
    ctx.save();
    ctx.strokeStyle = this.stroke;
    ctx.lineWidth = this.strokeWidth;
    this.drawLine(ctx, this.x1, this.y1, this.x2, this.y2);
    ctx.restore();
  }
}