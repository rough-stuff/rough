import { RoughDrawable } from './drawable';

export class RoughArc extends RoughDrawable {
  constructor(x, y, width, height, start, stop, closed) {
    super(['x', 'y', 'width', 'height', 'start', 'stop', 'numSteps', 'closed']);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height || width;
    this.start = start;
    this.stop = stop;
    this.numSteps = 9;
    this.closed = closed ? true : false;
  }

  draw(ctx) {
    let cx = this.x;
    let cy = this.y;
    let rx = Math.abs(this.width / 2);
    let ry = Math.abs(this.height / 2);
    rx += this.getOffset(-rx * 0.01, rx * 0.01);
    ry += this.getOffset(-ry * 0.01, ry * 0.01);
    let strt = this.start;
    let stp = this.stop;
    while (strt < 0) {
      strt += Math.PI * 2;
      stp += Math.PI * 2;
    }
    if ((stp - strt) > (Math.PI * 2)) {
      strt = 0;
      stp = Math.PI * 2;
    }
    let ellipseInc = (Math.PI * 2) / this.numSteps;
    let arcInc = Math.min(ellipseInc / 2, (stp - strt) / 2);

    var points = [];
    points.push([
      cx + rx * Math.cos(strt),
      cy + ry * Math.sin(strt)
    ]);
    for (var theta = strt; theta <= stp; theta += arcInc) {
      points.push([
        cx + rx * Math.cos(theta),
        cy + ry * Math.sin(theta)
      ]);
    }
    points.push([
      cx + rx * Math.cos(stp),
      cy + ry * Math.sin(stp)
    ]);
    points.push([
      cx + rx * Math.cos(stp),
      cy + ry * Math.sin(stp)
    ]);

    if (this.fill && this.closed) {
      this._doFill(ctx, points, [cx, cy]);
    }

    ctx.save();
    ctx.strokeStyle = this.stroke;
    ctx.lineWidth = this.strokeWidth;
    this.drawCurve(ctx, points);
    if (this.closed) {
      const lindex = points.length - 1;
      this.drawLine(ctx, points[0][0], points[0][1], cx, cy);
      this.drawLine(ctx, points[lindex][0], points[lindex][1], cx, cy);
    }
    ctx.restore();
  }

  _doFill(ctx, points, center) {
    var fillStyle = this.fillStyle || "hachure";
    switch (fillStyle) {
      case "solid": {
        ctx.save();
        ctx.fillStyle = this.fill;
        ctx.beginPath();
        this.drawCurve(ctx, points, true, true, center);
        ctx.fill();
        ctx.restore();
        break;
      }
      default: {
        let cx = this.x;
        let cy = this.y;
        let strt = this.start;
        let stp = this.stop;
        let rx = Math.abs(this.width / 2);
        let ry = Math.abs(this.height / 2);
        while (strt < 0) {
          strt += Math.PI * 2;
          stp += Math.PI * 2;
        }
        if ((stp - strt) > (Math.PI * 2)) {
          strt = 0;
          stp = Math.PI * 2;
        }
        let arcInc = (stp - strt) / this.numSteps;
        var vertices = [];
        vertices.push([cx, cy]);
        vertices.push([
          cx + rx * Math.cos(strt),
          cy + ry * Math.sin(strt)
        ]);
        for (var theta = strt; theta <= stp; theta += arcInc) {
          vertices.push([
            cx + rx * Math.cos(theta),
            cy + ry * Math.sin(theta)
          ]);
        }
        vertices.push([
          cx + rx * Math.cos(stp),
          cy + ry * Math.sin(stp)
        ]);

        let xc = [];
        let yc = [];
        vertices.forEach(function (p) {
          xc.push(p[0]);
          yc.push(p[1]);
        });
        this.hachureFillShape(ctx, xc, yc);
        break;
      }
    }
  }
}