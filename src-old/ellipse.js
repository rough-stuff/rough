import { RoughDrawable } from './drawable';

export class RoughEllipse extends RoughDrawable {
  constructor(x, y, width, height) {
    super(['x', 'y', 'width', 'height', 'numSteps']);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height || width;
    this.numSteps = 9;
  }

  draw(ctx) {
    this.ellipseInc = (Math.PI * 2) / this.numSteps;
    let rx = Math.abs(this.width / 2);
    let ry = Math.abs(this.height / 2);
    rx += this.getOffset(-rx * 0.05, rx * 0.05);
    ry += this.getOffset(-ry * 0.05, ry * 0.05);

    if (this.fill) {
      this._doFill(ctx, rx, ry);
    }

    ctx.save();
    ctx.strokeStyle = this.stroke;
    ctx.lineWidth = this.strokeWidth;
    this._ellipse(ctx, this.x, this.y, rx, ry, 1, this.ellipseInc * this.getOffset(0.1, this.getOffset(0.4, 1)));
    this._ellipse(ctx, this.x, this.y, rx, ry, 1.5, 0);
    ctx.restore();
  }

  _ellipse(ctx, cx, cy, rx, ry, offset, overlap, existingPath) {
    var radOffset = this.getOffset(-0.5, 0.5) - Math.PI / 2;
    var points = [];
    points.push([
      this.getOffset(-offset, offset) + cx + 0.9 * rx * Math.cos(radOffset - this.ellipseInc),
      this.getOffset(-offset, offset) + cy + 0.9 * ry * Math.sin(radOffset - this.ellipseInc)
    ]);
    for (var angle = radOffset; angle < (Math.PI * 2 + radOffset - 0.01); angle = angle + this.ellipseInc) {
      points.push([
        this.getOffset(-offset, offset) + cx + rx * Math.cos(angle),
        this.getOffset(-offset, offset) + cy + ry * Math.sin(angle)
      ]);
    }
    points.push([
      this.getOffset(-offset, offset) + cx + rx * Math.cos(radOffset + Math.PI * 2 + overlap * 0.5),
      this.getOffset(-offset, offset) + cy + ry * Math.sin(radOffset + Math.PI * 2 + overlap * 0.5)
    ]);
    points.push([
      this.getOffset(-offset, offset) + cx + 0.98 * rx * Math.cos(radOffset + overlap),
      this.getOffset(-offset, offset) + cy + 0.98 * ry * Math.sin(radOffset + overlap)
    ]);
    points.push([
      this.getOffset(-offset, offset) + cx + 0.9 * rx * Math.cos(radOffset + overlap * 0.5),
      this.getOffset(-offset, offset) + cy + 0.9 * ry * Math.sin(radOffset + overlap * 0.5)
    ]);
    this.drawCurve(ctx, points, existingPath);
  }

  _doFill(ctx, rx, ry) {
    var fillStyle = this.fillStyle || "hachure";
    switch (fillStyle) {
      case "solid": {
        ctx.save();
        ctx.fillStyle = this.fill;
        ctx.strokeStyle = null;
        ctx.beginPath();
        this._ellipse(ctx, this.x, this.y, rx, ry, 1, this.ellipseInc * this.getOffset(0.1, this.getOffset(0.4, 1)), true);
        ctx.fill();
        ctx.restore();
        break;
      }
      default: {
        var angle = this.hachureAngle;
        var gap = this.hachureGap;
        if (gap <= 0) {
          gap = this.strokeWidth * 4;
        }
        var fweight = this.fillWeight;
        if (fweight < 0) {
          fweight = this.strokeWidth / 2;
        }
        const radPerDeg = Math.PI / 180;
        var hachureAngle = (angle % 180) * radPerDeg;
        var tanAngle = Math.tan(hachureAngle);
        var cx = this.x, cy = this.y;
        var aspectRatio = ry / rx;
        var hyp = Math.sqrt(aspectRatio * tanAngle * aspectRatio * tanAngle + 1);
        var sinAnglePrime = aspectRatio * tanAngle / hyp;
        var cosAnglePrime = 1 / hyp;
        var gapPrime = gap / ((rx * ry / Math.sqrt((ry * cosAnglePrime) * (ry * cosAnglePrime) + (rx * sinAnglePrime) * (rx * sinAnglePrime))) / rx);
        var halfLen = Math.sqrt((rx * rx) - (cx - rx + gapPrime) * (cx - rx + gapPrime));

        ctx.save();
        ctx.strokeStyle = this.fill;
        ctx.lineWidth = fweight;
        for (var xPos = cx - rx + gapPrime; xPos < cx + rx; xPos += gapPrime) {
          halfLen = Math.sqrt((rx * rx) - (cx - xPos) * (cx - xPos));
          let p1 = this.affine(xPos, cy - halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
          let p2 = this.affine(xPos, cy + halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
          this.drawLine(ctx, p1[0], p1[1], p2[0], p2[1]);
        }
        ctx.restore();
        break;
      }
    }
  }

  affine(x, y, cx, cy, sinAnglePrime, cosAnglePrime, R) {
    var A = -cx * cosAnglePrime - cy * sinAnglePrime + cx;
    var B = R * (cx * sinAnglePrime - cy * cosAnglePrime) + cy;
    var C = cosAnglePrime;
    var D = sinAnglePrime;
    var E = -R * sinAnglePrime;
    var F = R * cosAnglePrime;
    return [
      A + C * x + D * y,
      B + E * x + F * y
    ];
  }
}