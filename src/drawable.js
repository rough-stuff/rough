import { RoughHachureIterator } from './geom/hachure-iterator';
import { _RELATION_, RoughSegment } from './geom/segment';

export class RoughDrawable {
  constructor(propertyNames) {
    this._fields = {};
    this._dirty = false;
    this._canvas = null;
    this.z = 0;
    this._roughness = null;
    this._bowing = null;
    this._stroke = null;
    this._strokeWidth = null;

    this._fill = null;
    this._fillStyle = null;
    this._fillWeight = null;
    this._hachureAngle = null;
    this._hachureGap = null;

    this._maxRandomnessOffset = null;
    this._curveTightness = 0;
    if (propertyNames) {
      for (var i = 0; i < propertyNames.length; i++) {
        this._defineRenderProperty(propertyNames[i]);
      }
    }
  }

  _defineRenderProperty(name) {
    Object.defineProperty(this, name, {
      get: function () {
        return this._get(name);
      },
      set: function (value) {
        this._set(name, value);
      }
    });
  }

  get dirty() {
    return this._dirty;
  }

  set roughness(value) {
    this._roughness = value;
    if (this._canvas) {
      this._canvas.requestDraw();
    }
  }

  get roughness() {
    if (typeof this._roughness === 'number') {
      if (this._roughness >= 0) {
        return this._roughness;
      }
    }
    if (this._canvas) {
      return this._canvas.roughness;
    }
    return this._roughness;
  }

  set bowing(value) {
    this._bowing = value;
    if (this._canvas) {
      this._canvas.requestDraw();
    }
  }

  get bowing() {
    if (typeof this._bowing === 'number') {
      if (this._bowing >= 0) {
        return this._bowing;
      }
    }
    if (this._canvas) {
      return this._canvas.bowing;
    }
    return this._bowing;
  }

  set stroke(value) {
    this._stroke = value;
    if (this._canvas) {
      this._canvas.requestDraw();
    }
  }

  get stroke() {
    if (typeof this._stroke === 'string') {
      if (this._stroke) {
        return this._stroke;
      }
    }
    if (this._canvas) {
      return this._canvas.stroke;
    }
    return this._stroke;
  }

  set strokeWidth(value) {
    this._strokeWidth = value;
    if (this._canvas) {
      this._canvas.requestDraw();
    }
  }

  get strokeWidth() {
    if (typeof this._strokeWidth === 'number') {
      if (this._strokeWidth >= 0) {
        return this._strokeWidth;
      }
    }
    if (this._canvas) {
      return this._canvas.strokeWidth;
    }
    return this._strokeWidth;
  }

  set maxRandomnessOffset(value) {
    this._maxRandomnessOffset = value;
    if (this._canvas) {
      this._canvas.requestDraw();
    }
  }

  get maxRandomnessOffset() {
    if (typeof this._maxRandomnessOffset === 'number') {
      if (this._maxRandomnessOffset >= 0) {
        return this._maxRandomnessOffset;
      }
    }
    if (this._canvas) {
      return this._canvas.maxRandomnessOffset;
    }
    return this._maxRandomnessOffset;
  }

  set curveTightness(value) {
    this._curveTightness = Math.max(Math.min(value, 1), 0);
    if (this._canvas) {
      this._canvas.requestDraw();
    }
  }

  get curveTightness() {
    if (typeof this._curveTightness === 'number') {
      if (this._curveTightness >= 0) {
        return this._curveTightness;
      }
    }
    if (this._canvas) {
      return this._canvas.curveTightness || 0;
    }
    return this._curveTightness;
  }

  set fill(value) {
    this._fill = value;
    if (this._canvas) {
      this._canvas.requestDraw();
    }
  }

  get fill() {
    if (typeof this._fill === 'string') {
      if (this._fill) {
        return this._fill;
      }
    }
    if (this._canvas) {
      return this._canvas.fill;
    }
    return this._fill;
  }

  set fillStyle(value) {
    this._fillStyle = value;
    if (this._canvas) {
      this._canvas.requestDraw();
    }
  }

  get fillStyle() {
    if (typeof this._fillStyle === 'string') {
      if (this._fillStyle) {
        return this._fillStyle;
      }
    }
    if (this._canvas) {
      return this._canvas.fillStyle;
    }
    return this._fillStyle;
  }

  set fillWeight(value) {
    this._fillWeight = value;
    if (this._canvas) {
      this._canvas.requestDraw();
    }
  }

  get fillWeight() {
    if (typeof this._fillWeight === 'number') {
      if (this._fillWeight) {
        return this._fillWeight;
      }
    }
    if (this._canvas) {
      return this._canvas.fillWeight;
    }
    return this._fillWeight;
  }

  set hachureAngle(value) {
    this._hachureAngle = value;
    if (this._canvas) {
      this._canvas.requestDraw();
    }
  }

  get hachureAngle() {
    if (typeof this._hachureAngle === 'number') {
      if (this._hachureAngle >= 0) {
        return this._hachureAngle;
      }
    }
    if (this._canvas) {
      return this._canvas.hachureAngle;
    }
    return this._hachureAngle;
  }

  set hachureGap(value) {
    this._hachureGap = value;
    if (this._canvas) {
      this._canvas.requestDraw();
    }
  }

  get hachureGap() {
    if (typeof this._hachureGap === 'number') {
      if (this._hachureGap >= 0) {
        return this._hachureGap;
      }
    }
    if (this._canvas) {
      return this._canvas.hachureGap;
    }
    return this._hachureGap;
  }

  attach(canvas, z) {
    this.attached = true;
    this._canvas = canvas;
    this.z = z;
  }

  detach() {
    this.attached = false;
    this.z = 0;
  }

  remove() {
    if (this.attached && this._canvas) {
      this._canvas.remove(this);
    }
  }

  _get(name) {
    if (this._fields[name]) {
      return this._fields[name];
    }
    return null;
  }

  _set(name, value, markDirty = true) {
    this._fields[name] = value;
    if (markDirty) {
      this._dirty = true;
      if (this._canvas) {
        this._canvas.requestDraw();
      }
    }
  }

  draw(context) {
    console.log("Draw not implemented.", context);
  }

  getOffset(min, max) {
    return this.roughness * ((Math.random() * (max - min)) + min);
  }

  drawLine(ctx, x1, y1, x2, y2, existingPath) {
    let lengthSq = Math.pow((x1 - x2), 2) + Math.pow((x1 - x2), 2);
    let offset = this.maxRandomnessOffset || 0;
    if (offset * offset * 100 > lengthSq) {
      offset = Math.sqrt(lengthSq) / 10;
    }
    let halfOffset = offset / 2;
    let divergePoint = 0.2 + Math.random() * 0.2;
    // Midpoint displacement value to give slightly bowed lines.
    let midDispX = this.bowing * this.maxRandomnessOffset * (y2 - y1) / 200;
    let midDispY = this.bowing * this.maxRandomnessOffset * (x1 - x2) / 200;
    midDispX = this.getOffset(-midDispX, midDispX);
    midDispY = this.getOffset(-midDispY, midDispY);

    if (!existingPath) {
      ctx.beginPath();
    }
    ctx.moveTo(x1 + this.getOffset(-offset, offset), y1 + this.getOffset(-offset, offset));
    ctx.bezierCurveTo(midDispX + x1 + (x2 - x1) * divergePoint + this.getOffset(-offset, offset),
      midDispY + y1 + (y2 - y1) * divergePoint + this.getOffset(-offset, offset),
      midDispX + x1 + 2 * (x2 - x1) * divergePoint + this.getOffset(-offset, offset),
      midDispY + y1 + 2 * (y2 - y1) * divergePoint + this.getOffset(-offset, offset),
      x2 + this.getOffset(-offset, offset),
      y2 + this.getOffset(-offset, offset));
    if (!existingPath) {
      ctx.stroke();
    }
    if (!existingPath) {
      ctx.beginPath();
    }
    ctx.moveTo(x1 + this.getOffset(-halfOffset, halfOffset), y1 + this.getOffset(-halfOffset, halfOffset));
    ctx.bezierCurveTo(midDispX + x1 + (x2 - x1) * divergePoint + this.getOffset(-halfOffset, halfOffset),
      midDispY + y1 + (y2 - y1) * divergePoint + this.getOffset(-halfOffset, halfOffset),
      midDispX + x1 + 2 * (x2 - x1) * divergePoint + this.getOffset(-halfOffset, halfOffset),
      midDispY + y1 + 2 * (y2 - y1) * divergePoint + this.getOffset(-halfOffset, halfOffset),
      x2 + this.getOffset(-halfOffset, halfOffset),
      y2 + this.getOffset(-halfOffset, halfOffset));
    if (!existingPath) {
      ctx.stroke();
    }
  }

  drawLinearPath(ctx, points, close) {
    const len = points.length;
    if (len > 2) {
      ctx.beginPath();
      for (var i = 0; i < len - 1; i++) {
        this.drawLine(ctx, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], true);
      }
      if (close) {
        this.drawLine(ctx, points[len - 1][0], points[len - 1][1], points[0][0], points[0][1], true);
      }
      ctx.stroke();
    } else if (len == 2) {
      this.drawLine(ctx, points[0][0], points[0][1], points[1][0], points[1][1]);
    }
  }

  drawCurve(ctx, vertArray, existingPath, closeToCenter, center) {
    const vertArrayLength = vertArray.length;
    var i;
    if (vertArrayLength > 3) {
      var b = [];
      const s = 1 - this.curveTightness;
      if (!existingPath) {
        ctx.beginPath();
      }
      ctx.moveTo(vertArray[1][0], vertArray[1][1]);
      for (i = 1; (i + 2) < vertArrayLength; i++) {
        let cachedVertArray = vertArray[i];
        b[0] = [cachedVertArray[0], cachedVertArray[1]];
        b[1] = [
          cachedVertArray[0] + (s * vertArray[i + 1][0] - s * vertArray[i - 1][0]) / 6,
          cachedVertArray[1] + (s * vertArray[i + 1][1] - s * vertArray[i - 1][1]) / 6
        ];
        b[2] = [
          vertArray[i + 1][0] + (s * vertArray[i][0] - s * vertArray[i + 2][0]) / 6,
          vertArray[i + 1][1] + (s * vertArray[i][1] - s * vertArray[i + 2][1]) / 6
        ];
        b[3] = [vertArray[i + 1][0], vertArray[i + 1][1]];
        ctx.bezierCurveTo(b[1][0], b[1][1], b[2][0], b[2][1], b[3][0], b[3][1]);
      }
      if (closeToCenter && center && center.length == 2) {
        let ro = this.maxRandomnessOffset || 0;
        ctx.lineTo(center[0] + this.getOffset(-ro, ro), center[1] + this.getOffset(-ro, ro));
      }
      if (!existingPath) {
        ctx.stroke();
      }
    } else if (vertArrayLength == 3) {
      this.drawBezier(
        ctx,
        vertArray[0][0], vertArray[0][1],
        vertArray[1][0], vertArray[1][1],
        vertArray[2][0], vertArray[2][1],
        vertArray[2][0], vertArray[2][1],
        existingPath
      );
    } else if (vertArrayLength == 2) {
      this.drawLine(ctx, vertArray[0][0], vertArray[0][1], vertArray[1][0], vertArray[1][1], existingPath);
    }
  }

  drawBezier(ctx, x1, y1, x2, y2, x3, y3, x4, y4, existingPath) {
    if (!existingPath) {
      ctx.beginPath();
    }
    ctx.moveTo(x1, y1);
    let ro = this.maxRandomnessOffset || 0;
    ctx.moveTo(x1 + this.getOffset(-ro, ro), y1 + this.getOffset(-ro, ro));
    this._drawBezierTo(ctx, x2, y2, x3, y3, x4, y4);
    if (!existingPath) {
      ctx.stroke();
    }
  }

  _drawBezierTo(ctx, x1, y1, x2, y2, x, y) {
    let ro = this.maxRandomnessOffset || 0;
    let final = [x + this.getOffset(-ro, ro), y + this.getOffset(-ro, ro)];
    ctx.bezierCurveTo(
      x1 + this.getOffset(-ro, ro), y1 + this.getOffset(-ro, ro),
      x2 + this.getOffset(-ro, ro), y2 + this.getOffset(-ro, ro),
      final[0], final[1]
    );
    return final;
  }

  _drawQuadTo(ctx, x1, y1, x, y) {
    let ro = this.maxRandomnessOffset || 0;
    let final = [x + this.getOffset(-ro, ro), y + this.getOffset(-ro, ro)];
    ctx.quadraticCurveTo(
      x1 + this.getOffset(-ro, ro), y1 + this.getOffset(-ro, ro),
      final[0], final[1]
    );
    return final;
  }

  // fill
  getIntersectingLines(lineCoords, xCoords, yCoords) {
    let intersections = [];
    var s1 = new RoughSegment(lineCoords[0], lineCoords[1], lineCoords[2], lineCoords[3]);
    for (var i = 0; i < xCoords.length; i++) {
      let s2 = new RoughSegment(xCoords[i], yCoords[i], xCoords[(i + 1) % xCoords.length], yCoords[(i + 1) % xCoords.length]);
      if (s1.compare(s2) == _RELATION_.INTERSECTS) {
        intersections.push([s1.xi, s1.yi]);
      }
    }
    return intersections;
  }

  hachureFillShape(ctx, xCoords, yCoords) {
    if (xCoords && yCoords && xCoords.length && yCoords.length) {
      var left = xCoords[0];
      var right = xCoords[0];
      var top = yCoords[0];
      var bottom = yCoords[0];
      for (let i = 1; i < xCoords.length; i++) {
        left = Math.min(left, xCoords[i]);
        right = Math.max(right, xCoords[i]);
        top = Math.min(top, yCoords[i]);
        bottom = Math.max(bottom, yCoords[i]);
      }

      var angle = this.hachureAngle;
      var gap = this.hachureGap;
      if (gap < 0) {
        gap = this.strokeWidth * 4;
      }
      gap = Math.max(gap, 0.1);
      var fweight = this.fillWeight;
      if (fweight < 0) {
        fweight = this.strokeWidth / 2;
      }

      const radPerDeg = Math.PI / 180;
      var hachureAngle = (angle % 180) * radPerDeg;
      var cosAngle = Math.cos(hachureAngle);
      var sinAngle = Math.sin(hachureAngle);
      var tanAngle = Math.tan(hachureAngle);

      ctx.save();
      ctx.strokeStyle = this.fill;
      ctx.lineWidth = fweight;

      var it = new RoughHachureIterator(top - 1, bottom + 1, left - 1, right + 1, gap, sinAngle, cosAngle, tanAngle);
      var rectCoords;
      while ((rectCoords = it.getNextLine()) != null) {
        var lines = this.getIntersectingLines(rectCoords, xCoords, yCoords);
        for (let i = 0; i < lines.length; i++) {
          if (i < (lines.length - 1)) {
            let p1 = lines[i];
            let p2 = lines[i + 1];
            this.drawLine(ctx, p1[0], p1[1], p2[0], p2[1]);
          }
        }
      }

      ctx.restore();
    }
  }
}