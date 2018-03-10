import { RoughDrawable } from './drawable';
import { RoughGeomPath } from './geom/geom-path';
import { RoughArcConverter } from './geom/arc-converter';

export class RoughPath extends RoughDrawable {
  constructor(path) {
    super(['path', 'numSteps']);
    this.numSteps = 9;
    this.path = path;
    this._keys = ['C', 'c', 'Q', 'q', 'M', 'm', 'L', 'l',
      'A', 'a', 'H', 'h', 'V', 'v', 'S', 's', 'T', 't', 'Z', 'z'];
  }

  draw(ctx) {
    if (this.path) {
      var path = (this.path || "").replace(/\n/g, " ").replace(/(-)/g, " -").replace(/(-\s)/g, "-").replace("/(\s\s)/g", " ");

      this.gp = new RoughGeomPath(path);
      var segments = this.gp.segments || [];

      this._position = [0, 0];
      this._bezierReflectionPoint = null;
      this._quadReflectionPoint = null;
      this._first = null;

      if (this.fill) {
        this._doFill(ctx, path);
      }

      ctx.save();
      ctx.strokeStyle = this.stroke;
      ctx.lineWidth = this.strokeWidth;
      ctx.beginPath();
      for (var i = 0; i < segments.length; i++) {
        var s = segments[i];
        this._processSegment(ctx, s, i > 0 ? segments[i - 1] : null);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  _doFill(ctx, path) {
    var fillStyle = this.fillStyle || "hachure";
    switch (fillStyle) {
      case "solid": {
        ctx.save();
        ctx.fillStyle = this.fill;
        let p2d = new Path2D(path);
        ctx.fill(p2d);
        ctx.restore();
        break;
      }
      default: {
        var hc = this._canvas.getHiddenCanvas();
        if (hc) {
          const hctx = hc.getContext("2d");
          let xc = [0, hc.width, hc.width, 0];
          let yc = [0, 0, hc.height, hc.height];
          this.hachureFillShape(hctx, xc, yc);
        }
        ctx.save();
        ctx.fillStyle = ctx.createPattern(hc, 'repeat');
        let p2d = new Path2D(path);
        ctx.fill(p2d);
        ctx.restore();
        break;
      }
    }
  }

  _processSegment(ctx, seg, prevSeg) {
    switch (seg.key) {
      case 'M':
      case 'm':
        this._moveTo(seg);
        break;
      case 'L':
      case 'l':
        this._lineTo(ctx, seg);
        break;
      case 'H':
      case 'h':
        this._hLineTo(ctx, seg);
        break;
      case 'V':
      case 'v':
        this._vLineTo(ctx, seg);
        break;
      case 'Z':
      case 'z':
        this._closeShape(ctx);
        break;
      case 'C':
      case 'c':
        this._curveTo(ctx, seg);
        break;
      case 'S':
      case 's':
        this._shortCurveTo(ctx, seg, prevSeg);
        break;
      case 'Q':
      case 'q':
        this._quadCurveTo(ctx, seg);
        break;
      case 'T':
      case 't':
        this._shortQuadTo(ctx, seg, prevSeg);
        break;
      case 'A':
      case 'a':
        this._arcTo(ctx, seg);
        break;
      default:
        break;
    }
  }

  _setPosition(x, y) {
    this._position = [x, y];
    if (!this._first) {
      this._first = [x, y];
    }
  }

  _moveTo(seg) {
    var delta = seg.key === 'm';
    if (seg.data.length >= 2) {
      let x = +seg.data[0];
      let y = +seg.data[1];
      if (delta) {
        this._setPosition(this._position[0] + x, this._position[1] + y);
      } else {
        this._setPosition(x, y);
      }
    }
  }

  _closeShape(ctx) {
    if (this._first) {
      this.drawLine(ctx, this._position[0], this._position[1], this._first[0], this._first[1], true);
    }
  }

  _lineTo(ctx, seg) {
    var delta = seg.key === 'l';
    if (seg.data.length >= 2) {
      let x = +seg.data[0];
      let y = +seg.data[1];
      if (delta) {
        x += this._position[0];
        y += this._position[1];
      }
      this.drawLine(ctx, this._position[0], this._position[1], x, y, true);
      this._setPosition(x, y);
    }
  }

  _hLineTo(ctx, seg) {
    var delta = seg.key === 'h';
    if (seg.data.length) {
      let x = +seg.data[0];
      if (delta) {
        x += this._position[0];
      }
      this.drawLine(ctx, this._position[0], this._position[1], x, this._position[1], true);
      this._setPosition(x, this._position[1]);
    }
  }

  _vLineTo(ctx, seg) {
    var delta = seg.key === 'v';
    if (seg.data.length) {
      let y = +seg.data[0];
      if (delta) {
        y += this._position[1];
      }
      this.drawLine(ctx, this._position[0], this._position[1], this._position[0], y, true);
      this._setPosition(this._position[0], y);
    }
  }

  _quadCurveTo(ctx, seg) {
    var delta = seg.key === 'q';
    if (seg.data.length >= 4) {
      let x1 = +seg.data[0];
      let y1 = +seg.data[1];
      let x = +seg.data[2];
      let y = +seg.data[3];
      if (delta) {
        x1 += this._position[0];
        x += this._position[0];
        y1 += this._position[1];
        y += this._position[1];
      }
      let ro = this.maxRandomnessOffset || 0;
      ctx.moveTo(this._position[0], this._position[1]);
      this._drawQuadTo(ctx, x1, y1, x, y);
      ctx.moveTo(this._position[0] + this.getOffset(-ro, ro), this._position[1] + this.getOffset(-ro, ro));
      let final = this._drawQuadTo(ctx, x1, y1, x, y);
      x = final[0];
      y = final[1];
      this._setPosition(x, y);
      this._quadReflectionPoint = [x + (x - x1), y + (y - y1)];
    }
  }

  _curveTo(ctx, seg) {
    var delta = seg.key === 'c';
    if (seg.data.length >= 6) {
      let x1 = +seg.data[0];
      let y1 = +seg.data[1];
      let x2 = +seg.data[2];
      let y2 = +seg.data[3];
      let x = +seg.data[4];
      let y = +seg.data[5];
      if (delta) {
        x1 += this._position[0];
        x2 += this._position[0];
        x += this._position[0];
        y1 += this._position[1];
        y2 += this._position[1];
        y += this._position[1];
      }
      let ro = this.maxRandomnessOffset || 0;
      ctx.moveTo(this._position[0], this._position[1]);
      this._drawBezierTo(ctx, x1, y1, x2, y2, x, y);
      ctx.moveTo(this._position[0] + this.getOffset(-ro, ro), this._position[1] + this.getOffset(-ro, ro));
      let final = this._drawBezierTo(ctx, x1, y1, x2, y2, x, y);
      x = final[0];
      y = final[1];
      this._setPosition(x, y);
      this._bezierReflectionPoint = [x + (x - x2), y + (y - y2)];
    }
  }

  _shortCurveTo(ctx, seg, prevSeg) {
    var delta = seg.key === 's';
    if (seg.data.length >= 4) {
      let x2 = +seg.data[0];
      let y2 = +seg.data[1];
      let x = +seg.data[2];
      let y = +seg.data[3];
      if (delta) {
        x2 += this._position[0];
        x += this._position[0];
        y2 += this._position[1];
        y += this._position[1];
      }
      let x1 = x2;
      let y1 = y2;
      let prevKey = prevSeg ? prevSeg.key : "";
      var ref = null;
      if (prevKey == 'c' || prevKey == 'C' || prevKey == 's' || prevKey == 'S') {
        ref = this._bezierReflectionPoint;
      }
      if (ref) {
        x1 = ref[0];
        y1 = ref[1];
      }
      ctx.moveTo(this._position[0], this._position[1]);
      this._drawBezierTo(ctx, x1, y1, x2, y2, x, y);
      ctx.moveTo(this._position[0], this._position[1]);
      var final = this._drawBezierTo(ctx, x1, y1, x2, y2, x, y);
      x = final[0];
      y = final[1];
      this._setPosition(x, y);
      this._bezierReflectionPoint = [x + (x - x2), y + (y - y2)];
    }
  }

  _shortQuadTo(ctx, seg, prevSeg) {
    var delta = seg.key === 't';
    if (seg.data.length >= 2) {
      let x = +seg.data[0];
      let y = +seg.data[1];
      if (delta) {
        x += this._position[0];
        y += this._position[1];
      }
      let x1 = x;
      let y1 = y;
      let prevKey = prevSeg ? prevSeg.key : "";
      var ref = null;
      if (prevKey == 'q' || prevKey == 'Q' || prevKey == 't' || prevKey == 'T') {
        ref = this._quadReflectionPoint;
      }
      if (ref) {
        x1 = ref[0];
        y1 = ref[1];
      }
      ctx.moveTo(this._position[0], this._position[1]);
      this._drawQuadTo(ctx, x1, y1, x, y);
      ctx.moveTo(this._position[0], this._position[1]);
      let final = this._drawQuadTo(ctx, x1, y1, x, y);
      x = final[0];
      y = final[1];
      this._setPosition(x, y);
      this._quadReflectionPoint = [x + (x - x1), y + (y - y1)];
    }
  }

  _arcTo(ctx, seg) {
    var delta = seg.key === 'a';
    if (seg.data.length >= 7) {
      let rx = +seg.data[0];
      let ry = +seg.data[1];
      let angle = +seg.data[2];
      let largeArcFlag = +seg.data[3];
      let sweepFlag = +seg.data[4];
      let x = +seg.data[5];
      let y = +seg.data[6];
      if (delta) {
        x += this._position[0];
        y += this._position[1];
      }
      if (x == this._position[0] && y == this._position[1]) {
        return;
      }
      if (rx == 0 || ry == 0) {
        this.drawLine(ctx, this._position[0], this._position[1], x, y, true);
        this._setPosition(x, y);
      } else {
        var final;
        for (var i = 0; i < 2; i++) {
          ctx.moveTo(this._position[0], this._position[1]);
          var arcConverter = new RoughArcConverter(
            [this._position[0], this._position[1]],
            [x, y],
            [rx, ry],
            angle,
            largeArcFlag ? true : false,
            sweepFlag ? true : false
          );
          var segment = arcConverter.getNextSegment();
          while (segment) {
            final = this._drawBezierTo(ctx, segment.cp1[0], segment.cp1[1], segment.cp2[0], segment.cp2[1], segment.to[0], segment.to[1]);
            segment = arcConverter.getNextSegment();
          }
        }
        if (final) {
          x = final[0];
          y = final[1];
        }
        this._setPosition(x, y);
      }
    }
  }
}