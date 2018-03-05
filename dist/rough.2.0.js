var RoughCanvas = (function () {
'use strict';

const RoughSegmentRelation = {
  LEFT: 0,
  RIGHT: 1,
  INTERSECTS: 2,
  AHEAD: 3,
  BEHIND: 4,
  SEPARATE: 5,
  UNDEFINED: 6
};

class RoughSegment {
  constructor(px1, py1, px2, py2) {
    this.px1 = px1;
    this.py1 = py1;
    this.px2 = px2;
    this.py2 = py2;
    this.xi = Number.MAX_VALUE;
    this.yi = Number.MAX_VALUE;
    this.a = py2 - py1;
    this.b = px1 - px2;
    this.c = px2 * py1 - px1 * py2;
    this._undefined = ((this.a == 0) && (this.b == 0) && (this.c == 0));
  }

  isUndefined() {
    return this._undefined;
  }

  compare(otherSegment) {
    if (this.isUndefined() || otherSegment.isUndefined()) {
      return RoughSegmentRelation.UNDEFINED;
    }
    var grad1 = Number.MAX_VALUE;
    var grad2 = Number.MAX_VALUE;
    var int1 = 0, int2 = 0;
    var a = this.a, b = this.b, c = this.c;

    if (Math.abs(b) > 0.00001) {
      grad1 = -a / b;
      int1 = -c / b;
    }
    if (Math.abs(otherSegment.b) > 0.00001) {
      grad2 = -otherSegment.a / otherSegment.b;
      int2 = -otherSegment.c / otherSegment.b;
    }

    if (grad1 == Number.MAX_VALUE) {
      if (grad2 == Number.MAX_VALUE) {
        if ((-c / a) != (-otherSegment.c / otherSegment.a)) {
          return RoughSegmentRelation.SEPARATE;
        }
        if ((this.py1 >= Math.min(otherSegment.py1, otherSegment.py2)) && (this.py1 <= Math.max(otherSegment.py1, otherSegment.py2))) {
          this.xi = this.px1;
          this.yi = this.py1;
          return RoughSegmentRelation.INTERSECTS;
        }
        if ((this.py2 >= Math.min(otherSegment.py1, otherSegment.py2)) && (this.py2 <= Math.max(otherSegment.py1, otherSegment.py2))) {
          this.xi = this.px2;
          this.yi = this.py2;
          return RoughSegmentRelation.INTERSECTS;
        }
        return RoughSegmentRelation.SEPARATE;
      }
      this.xi = this.px1;
      this.yi = (grad2 * this.xi + int2);
      if (((this.py1 - this.yi) * (this.yi - this.py2) < -0.00001) || ((otherSegment.py1 - this.yi) * (this.yi - otherSegment.py2) < -0.00001)) {
        return RoughSegmentRelation.SEPARATE;
      }
      if (Math.abs(otherSegment.a) < 0.00001) {
        if ((otherSegment.px1 - this.xi) * (this.xi - otherSegment.px2) < -0.00001) {
          return RoughSegmentRelation.SEPARATE;
        }
        return RoughSegmentRelation.INTERSECTS;
      }
      return RoughSegmentRelation.INTERSECTS;
    }

    if (grad2 == Number.MAX_VALUE) {
      this.xi = otherSegment.px1;
      this.yi = grad1 * this.xi + int1;
      if (((otherSegment.py1 - this.yi) * (this.yi - otherSegment.py2) < -0.00001) || ((this.py1 - this.yi) * (this.yi - this.py2) < -0.00001)) {
        return RoughSegmentRelation.SEPARATE;
      }
      if (Math.abs(a) < 0.00001) {
        if ((this.px1 - this.xi) * (this.xi - this.px2) < -0.00001) {
          return RoughSegmentRelation.SEPARATE;
        }
        return RoughSegmentRelation.INTERSECTS;
      }
      return RoughSegmentRelation.INTERSECTS;
    }

    if (grad1 == grad2) {
      if (int1 != int2) {
        return RoughSegmentRelation.SEPARATE;
      }
      if ((this.px1 >= Math.min(otherSegment.px1, otherSegment.px2)) && (this.px1 <= Math.max(otherSegment.py1, otherSegment.py2))) {
        this.xi = this.px1;
        this.yi = this.py1;
        return RoughSegmentRelation.INTERSECTS;
      }
      if ((this.px2 >= Math.min(otherSegment.px1, otherSegment.px2)) && (this.px2 <= Math.max(otherSegment.px1, otherSegment.px2))) {
        this.xi = this.px2;
        this.yi = this.py2;
        return RoughSegmentRelation.INTERSECTS;
      }
      return RoughSegmentRelation.SEPARATE;
    }

    this.xi = ((int2 - int1) / (grad1 - grad2));
    this.yi = (grad1 * this.xi + int1);

    if (((this.px1 - this.xi) * (this.xi - this.px2) < -0.00001) || ((otherSegment.px1 - this.xi) * (this.xi - otherSegment.px2) < -0.00001)) {
      return RoughSegmentRelation.SEPARATE;
    }
    return RoughSegmentRelation.INTERSECTS;
  }

  getLength() {
    return this._getLength(this.px1, this.py1, this.px2, this.py2);
  }

  _getLength(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

class RoughHachureIterator {
  constructor(top, bottom, left, right, gap, sinAngle, cosAngle, tanAngle) {
    this.top = top;
    this.bottom = bottom;
    this.left = left;
    this.right = right;
    this.gap = gap;
    this.sinAngle = sinAngle;
    this.tanAngle = tanAngle;

    if (Math.abs(sinAngle) < 0.0001) {
      this.pos = left + gap;
    } else if (Math.abs(sinAngle) > 0.9999) {
      this.pos = top + gap;
    } else {
      this.deltaX = (bottom - top) * Math.abs(tanAngle);
      this.pos = left - Math.abs(this.deltaX);
      this.hGap = Math.abs(gap / cosAngle);
      this.sLeft = new RoughSegment(left, bottom, left, top);
      this.sRight = new RoughSegment(right, bottom, right, top);
    }
  }

  getNextLine() {
    if (Math.abs(this.sinAngle) < 0.0001) {
      if (this.pos < this.right) {
        let line = [this.pos, this.top, this.pos, this.bottom];
        this.pos += this.gap;
        return line;
      }
    } else if (Math.abs(this.sinAngle) > 0.9999) {
      if (this.pos < this.bottom) {
        let line = [this.left, this.pos, this.right, this.pos];
        this.pos += this.gap;
        return line;
      }
    } else {
      let xLower = this.pos - this.deltaX / 2;
      let xUpper = this.pos + this.deltaX / 2;
      let yLower = this.bottom;
      let yUpper = this.top;
      if (this.pos < (this.right + this.deltaX)) {
        while (((xLower < this.left) && (xUpper < this.left)) || ((xLower > this.right) && (xUpper > this.right))) {
          this.pos += this.hGap;
          xLower = this.pos - this.deltaX / 2;
          xUpper = this.pos + this.deltaX / 2;
          if (this.pos > (this.right + this.deltaX)) {
            return null;
          }
        }
        let s = new RoughSegment(xLower, yLower, xUpper, yUpper);
        if (s.compare(this.sLeft) == RoughSegmentRelation.INTERSECTS) {
          xLower = s.xi;
          yLower = s.yi;
        }
        if (s.compare(this.sRight) == RoughSegmentRelation.INTERSECTS) {
          xUpper = s.xi;
          yUpper = s.yi;
        }
        if (this.tanAngle > 0) {
          xLower = this.right - (xLower - this.left);
          xUpper = this.right - (xUpper - this.left);
        }
        let line = [xLower, yLower, xUpper, yUpper];
        this.pos += this.hGap;
        return line;
      }
    }
    return null;
  }
}

class RoughRenderer {
  line(x1, y1, x2, y2, o) {
    let o1 = this._line(x1, y1, x2, y2, o, true, false);
    let o2 = this._line(x1, y1, x2, y2, o, true, true);
    return {
      type: 'path',
      ops: o1.concat(o2)
    };
  }

  linearPath(points, close, o) {
    const len = (points || []).length;
    if (len > 2) {
      let ops = [];
      for (let i = 0; i < (len - 1); i++) {
        let o1 = this._line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], o, true, false);
        let o2 = this._line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], o, true, true);
        ops = ops.concat(o1, o2);
      }
      if (close) {
        let o1 = this._line(points[len - 1][0], points[len - 1][1], points[0][0], points[0][1], o, true, false);
        let o2 = this._line(points[len - 1][0], points[len - 1][1], points[0][0], points[0][1], o, true, false);
        ops = ops.concat(o1, o2);
      }
      return { type: 'path', ops };
    } else if (len === 2) {
      return this.line(points[0][0], points[0][1], points[1][0], points[1][1], o);
    }
  }

  polygon(points, o) {
    return this.linearPath(points, true, o);
  }

  rectangle(x, y, width, height, o) {
    let points = [
      [x, y], [x + width, y], [x + width, y + height], [x, y + height]
    ];
    return this.polygon(points, o);
  }

  ellipse(x, y, width, height, o) {
    const increment = (Math.PI * 2) / o.curveStepCount;
    let rx = Math.abs(width / 2);
    let ry = Math.abs(height / 2);
    rx += this._getOffset(-rx * 0.05, rx * 0.05, o);
    ry += this._getOffset(-ry * 0.05, ry * 0.05, o);
    let o1 = this._ellipse(increment, x, y, rx, ry, 1, increment * this._getOffset(0.1, this._getOffset(0.4, 1, o), o), o);
    let o2 = this._ellipse(increment, x, y, rx, ry, 1.5, 0, o);
    return { type: 'path', ops: o1.concat(o2) };
  }

  solidFillShape(xCoords, yCoords, o) {
    let ops = [];
    if (xCoords && yCoords && xCoords.length && yCoords.length && xCoords.length === yCoords.length) {
      let offset = o.maxRandomnessOffset || 0;
      const len = xCoords.length;
      if (len > 2) {
        ops.push({ op: 'move', data: [xCoords[0] + this._getOffset(-offset, offset, o), yCoords[0] + this._getOffset(-offset, offset, o)] });
        for (var i = 1; i < len; i++) {
          ops.push({ op: 'lineTo', data: [xCoords[i] + this._getOffset(-offset, offset, o), yCoords[i] + this._getOffset(-offset, offset, o)] });
        }
      }
    }
    return { type: 'fillPath', ops };
  }

  hachureFillShape(xCoords, yCoords, o) {
    let ops = [];
    if (xCoords && yCoords && xCoords.length && yCoords.length) {
      let left = xCoords[0];
      let right = xCoords[0];
      let top = yCoords[0];
      let bottom = yCoords[0];
      for (let i = 1; i < xCoords.length; i++) {
        left = Math.min(left, xCoords[i]);
        right = Math.max(right, xCoords[i]);
        top = Math.min(top, yCoords[i]);
        bottom = Math.max(bottom, yCoords[i]);
      }
      const angle = o.hachureAngle;
      let gap = o.hachureGap;
      if (gap < 0) {
        gap = o.strokeWidth * 4;
      }
      gap = Math.max(gap, 0.1);

      const radPerDeg = Math.PI / 180;
      const hachureAngle = (angle % 180) * radPerDeg;
      const cosAngle = Math.cos(hachureAngle);
      const sinAngle = Math.sin(hachureAngle);
      const tanAngle = Math.tan(hachureAngle);

      const it = new RoughHachureIterator(top - 1, bottom + 1, left - 1, right + 1, gap, sinAngle, cosAngle, tanAngle);
      let rectCoords;
      while ((rectCoords = it.getNextLine()) != null) {
        let lines = this._getIntersectingLines(rectCoords, xCoords, yCoords);
        for (let i = 0; i < lines.length; i++) {
          if (i < (lines.length - 1)) {
            let p1 = lines[i];
            let p2 = lines[i + 1];
            const o1 = this._line(p1[0], p1[1], p2[0], p2[1], o, true, false);
            const o2 = this._line(p1[0], p1[1], p2[0], p2[1], o, true, true);
            ops = ops.concat(o1, o2);
          }
        }
      }
    }
    return { type: 'path', ops };
  }

  hachureFillEllipse(cx, cy, width, height, o) {
    let ops = [];
    let rx = Math.abs(width / 2);
    let ry = Math.abs(height / 2);
    rx += this._getOffset(-rx * 0.05, rx * 0.05, o);
    ry += this._getOffset(-ry * 0.05, ry * 0.05, o);
    let angle = o.hachureAngle;
    let gap = o.hachureGap;
    if (gap <= 0) {
      gap = o.strokeWidth * 4;
    }
    let fweight = o.fillWeight;
    if (fweight < 0) {
      fweight = o.strokeWidth / 2;
    }
    const radPerDeg = Math.PI / 180;
    let hachureAngle = (angle % 180) * radPerDeg;
    let tanAngle = Math.tan(hachureAngle);
    let aspectRatio = ry / rx;
    let hyp = Math.sqrt(aspectRatio * tanAngle * aspectRatio * tanAngle + 1);
    let sinAnglePrime = aspectRatio * tanAngle / hyp;
    let cosAnglePrime = 1 / hyp;
    let gapPrime = gap / ((rx * ry / Math.sqrt((ry * cosAnglePrime) * (ry * cosAnglePrime) + (rx * sinAnglePrime) * (rx * sinAnglePrime))) / rx);
    let halfLen = Math.sqrt((rx * rx) - (cx - rx + gapPrime) * (cx - rx + gapPrime));
    for (var xPos = cx - rx + gapPrime; xPos < cx + rx; xPos += gapPrime) {
      halfLen = Math.sqrt((rx * rx) - (cx - xPos) * (cx - xPos));
      let p1 = this._affine(xPos, cy - halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
      let p2 = this._affine(xPos, cy + halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
      const o1 = this._line(p1[0], p1[1], p2[0], p2[1], o, true, false);
      const o2 = this._line(p1[0], p1[1], p2[0], p2[1], o, true, true);
      ops = ops.concat(o1, o2);
    }
    return { type: 'path', ops };
  }

  // privates

  _getOffset(min, max, ops) {
    return ops.roughness * ((Math.random() * (max - min)) + min);
  }

  _affine(x, y, cx, cy, sinAnglePrime, cosAnglePrime, R) {
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

  _line(x1, y1, x2, y2, o, move, overlay) {
    const lengthSq = Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2);
    let offset = o.maxRandomnessOffset || 0;
    if ((offset * offset * 100) > lengthSq) {
      offset = Math.sqrt(lengthSq) / 10;
    }
    const halfOffset = offset / 2;
    const divergePoint = 0.2 + Math.random() * 0.2;
    let midDispX = o.bowing * o.maxRandomnessOffset * (y2 - y1) / 200;
    let midDispY = o.bowing * o.maxRandomnessOffset * (x2) / 200;
    midDispX = this._getOffset(-midDispX, midDispX, o);
    midDispY = this._getOffset(-midDispY, midDispY, o);
    let ops = [];
    if (move) {
      if (overlay) {
        ops.push({
          op: 'move', data: [
            x1 + this._getOffset(-halfOffset, halfOffset, o),
            y1 + this._getOffset(-halfOffset, halfOffset, o)
          ]
        });
      } else {
        ops.push({
          op: 'move', data: [
            x1 + this._getOffset(-offset, offset, o),
            y1 + this._getOffset(-offset, offset, o)
          ]
        });
      }
    }
    if (overlay) {
      ops.push({
        op: 'bcurveTo', data: [
          midDispX + x1 + (x2 - x1) * divergePoint + this._getOffset(-halfOffset, halfOffset, o),
          midDispY + y1 + (y2 - y1) * divergePoint + this._getOffset(-halfOffset, halfOffset, o),
          midDispX + x1 + 2 * (x2 - x1) * divergePoint + this._getOffset(-halfOffset, halfOffset, o),
          midDispY + y1 + 2 * (y2 - y1) * divergePoint + this._getOffset(-halfOffset, halfOffset, o),
          x2 + this._getOffset(-halfOffset, halfOffset, o),
          y2 + this._getOffset(-halfOffset, halfOffset, o)
        ]
      });
    } else {
      ops.push({
        op: 'bcurveTo', data: [
          midDispX + x1 + (x2 - x1) * divergePoint + this._getOffset(-offset, offset, o),
          midDispY + y1 + (y2 - y1) * divergePoint + this._getOffset(-offset, offset, o),
          midDispX + x1 + 2 * (x2 - x1) * divergePoint + this._getOffset(-offset, offset, o),
          midDispY + y1 + 2 * (y2 - y1) * divergePoint + this._getOffset(-offset, offset, o),
          x2 + this._getOffset(-offset, offset, o),
          y2 + this._getOffset(-offset, offset, o)
        ]
      });
    }
    return ops;
  }

  _curve(points, closePoint, o) {
    const len = points.length;
    let ops = [];
    if (len > 3) {
      const b = [];
      const s = 1 - o.curveTightness;
      ops.push({ op: 'move', data: [points[1][0], points[1][1]] });
      for (let i = 1; (i + 2) < len; i++) {
        const cachedVertArray = points[i];
        b[0] = [cachedVertArray[0], cachedVertArray[1]];
        b[1] = [cachedVertArray[0] + (s * points[i + 1][0] - s * points[i - 1][0]) / 6, cachedVertArray[1] + (s * points[i + 1][1] - s * points[i - 1][1]) / 6];
        b[2] = [points[i + 1][0] + (s * points[i][0] - s * points[i + 2][0]) / 6, points[i + 1][1] + (s * points[i][1] - s * points[i + 2][1]) / 6];
        b[3] = [points[i + 1][0], points[i + 1][1]];
        ops.push({ op: 'bcurveTo', data: [b[1][0], b[1][1], b[2][0], b[2][1], b[3][0], b[3][1]] });
      }
      if (closePoint && closePoint.length === 2) {
        let ro = o.maxRandomnessOffset;
        // TODO: more roughness here?
        ops.push({ ops: 'lineTo', data: [closePoint[0] + this._getOffset(-ro, ro, o), closePoint[1] + + this._getOffset(-ro, ro, o)] });
      }
    } else if (len === 3) {
      ops.push({ op: 'move', data: [points[1][0], points[1][1]] });
      ops.push({
        op: 'bcurveTo', data: [
          points[1][0], points[1][1],
          points[2][0], points[2][1],
          points[2][0], points[2][1]]
      });
    } else if (len === 2) {
      let o1 = this._line(points[0][0], points[0][1], points[1][0], points[1][1], o, true, false);
      let o2 = this._line(points[0][0], points[0][1], points[1][0], points[1][1], o, true, true);
      ops = ops.concat(o1, o2);
    }
    return ops;
  }

  _ellipse(increment, cx, cy, rx, ry, offset, overlap, o) {
    const radOffset = this._getOffset(-0.5, 0.5, o) - (Math.PI / 2);
    const points = [];
    points.push([
      this._getOffset(-offset, offset, o) + cx + 0.9 * rx * Math.cos(radOffset - increment),
      this._getOffset(-offset, offset, o) + cy + 0.9 * ry * Math.sin(radOffset - increment)
    ]);
    for (let angle = radOffset; angle < (Math.PI * 2 + radOffset - 0.01); angle = angle + increment) {
      points.push([
        this._getOffset(-offset, offset, o) + cx + rx * Math.cos(angle),
        this._getOffset(-offset, offset, o) + cy + ry * Math.sin(angle)
      ]);
    }
    points.push([
      this._getOffset(-offset, offset, o) + cx + rx * Math.cos(radOffset + Math.PI * 2 + overlap * 0.5),
      this._getOffset(-offset, offset, o) + cy + ry * Math.sin(radOffset + Math.PI * 2 + overlap * 0.5)
    ]);
    points.push([
      this._getOffset(-offset, offset, o) + cx + 0.98 * rx * Math.cos(radOffset + overlap),
      this._getOffset(-offset, offset, o) + cy + 0.98 * ry * Math.sin(radOffset + overlap)
    ]);
    points.push([
      this._getOffset(-offset, offset, o) + cx + 0.9 * rx * Math.cos(radOffset + overlap * 0.5),
      this._getOffset(-offset, offset, o) + cy + 0.9 * ry * Math.sin(radOffset + overlap * 0.5)
    ]);
    return this._curve(points, null, o);
  }

  _getIntersectingLines(lineCoords, xCoords, yCoords) {
    let intersections = [];
    var s1 = new RoughSegment(lineCoords[0], lineCoords[1], lineCoords[2], lineCoords[3]);
    for (var i = 0; i < xCoords.length; i++) {
      let s2 = new RoughSegment(xCoords[i], yCoords[i], xCoords[(i + 1) % xCoords.length], yCoords[(i + 1) % xCoords.length]);
      if (s1.compare(s2) == RoughSegmentRelation.INTERSECTS) {
        intersections.push([s1.xi, s1.yi]);
      }
    }
    return intersections;
  }
}

class RoughCanvas {
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
    this._draw(this.ctx, drawing, o);
  }

  async rectangle(x, y, width, height, options) {
    let o = this._options(options);
    let lib = await this.lib();
    if (o.fill) {
      let ctx = this.ctx;
      const xc = [x, x + width, x + width, x];
      const yc = [y, y, y + height, y + height];
      if (o.fillStyle === 'solid') {
        let fillShape = await lib.solidFillShape(xc, yc, o);
        this._fill(ctx, fillShape, o);
      } else {
        let fillShape = await lib.hachureFillShape(xc, yc, o);
        this._fillSketch(ctx, fillShape, o);
      }
    }
    let drawing = await lib.rectangle(x, y, width, height, o);
    this._draw(this.ctx, drawing, o);
  }

  async ellipse(x, y, width, height, options) {
    let o = this._options(options);
    let lib = await this.lib();
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        let fillShape = await lib.ellipse(x, y, width, height, o);
        this._fill(this.ctx, fillShape, o);
      } else {
        let fillShape = await lib.hachureFillEllipse(x, y, width, height, o);
        this._fillSketch(this.ctx, fillShape, o);
      }
    }
    let drawing = await lib.ellipse(x, y, width, height, o);
    this._draw(this.ctx, drawing, o);
  }

  async circle(x, y, radius, options) {
    return await this.ellipse(x, y, radius, radius, options);
  }

  async arc() {
    // TODO: 
  }

  _options(options) {
    return options ? Object.assign({}, this.defaultOptions, options) : this.defaultOptions;
  }

  _draw(ctx, drawing, o) {
    ctx.save();
    ctx.strokeStyle = o.stroke;
    ctx.lineWidth = o.strokeWidth;
    this._drawToContext(ctx, drawing);
    ctx.restore();
  }

  _fillSketch(ctx, drawing, o) {
    let fweight = o.fillWeight;
    if (fweight < 0) {
      fweight = o.strokeWidth / 2;
    }
    ctx.save();
    ctx.strokeStyle = o.fill;
    ctx.lineWidth = fweight;
    this._drawToContext(ctx, drawing);
    ctx.restore();
  }

  _fill(ctx, drawing, o) {
    ctx.save();
    ctx.fillStyle = o.fill;
    drawing.type = 'fillPath';
    this._drawToContext(ctx, drawing, o);
    ctx.restore();
  }

  _drawToContext(ctx, drawing) {
    if (drawing.type === 'path' || drawing.type === 'fillPath') {
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
            ctx.lineTo(data[0], data[1]);
            break;
        }
      }
      if (drawing.type === 'fillPath') {
        ctx.fill();
      } else {
        ctx.stroke();
      }
    }
  }
}

return RoughCanvas;

}());
