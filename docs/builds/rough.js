"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Drawable = function () {
  function Drawable(propertyNames) {
    _classCallCheck(this, Drawable);

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

  _createClass(Drawable, [{
    key: '_defineRenderProperty',
    value: function _defineRenderProperty(name) {
      Object.defineProperty(this, name, {
        get: function get() {
          return this._get(name);
        },
        set: function set(value) {
          this._set(name, value);
        }
      });
    }
  }, {
    key: 'attach',
    value: function attach(canvas, z) {
      this.attached = true;
      this._canvas = canvas;
      this.z = z;
    }
  }, {
    key: 'detach',
    value: function detach() {
      this.attached = false;
      this.z = 0;
    }
  }, {
    key: 'remove',
    value: function remove() {
      if (this.attached && this._canvas) {
        this._canvas.remove(this);
      }
    }
  }, {
    key: '_get',
    value: function _get(name) {
      if (this._fields[name]) {
        return this._fields[name];
      }
      return null;
    }
  }, {
    key: '_set',
    value: function _set(name, value) {
      var markDirty = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

      this._fields[name] = value;
      if (markDirty) {
        this._dirty = true;
        if (this._canvas) {
          this._canvas.requestDraw();
        }
      }
    }
  }, {
    key: 'draw',
    value: function draw(context) {
      console.log("Draw not implemented.", context);
    }
  }, {
    key: 'getOffset',
    value: function getOffset(min, max) {
      return this.roughness * (Math.random() * (max - min) + min);
    }
  }, {
    key: 'drawLine',
    value: function drawLine(ctx, x1, y1, x2, y2, existingPath) {
      var lengthSq = Math.pow(x1 - x2, 2) + Math.pow(x1 - x2, 2);
      var offset = this.maxRandomnessOffset || 0;
      if (offset * offset * 100 > lengthSq) {
        offset = Math.sqrt(lengthSq) / 10;
      }
      var halfOffset = offset / 2;
      var divergePoint = 0.2 + Math.random() * 0.2;
      // Midpoint displacement value to give slightly bowed lines.
      var midDispX = this.bowing * this.maxRandomnessOffset * (y2 - y1) / 200;
      var midDispY = this.bowing * this.maxRandomnessOffset * (x1 - x2) / 200;
      midDispX = this.getOffset(-midDispX, midDispX);
      midDispY = this.getOffset(-midDispY, midDispY);

      if (!existingPath) {
        ctx.beginPath();
      }
      ctx.moveTo(x1 + this.getOffset(-offset, offset), y1 + this.getOffset(-offset, offset));
      ctx.bezierCurveTo(midDispX + x1 + (x2 - x1) * divergePoint + this.getOffset(-offset, offset), midDispY + y1 + (y2 - y1) * divergePoint + this.getOffset(-offset, offset), midDispX + x1 + 2 * (x2 - x1) * divergePoint + this.getOffset(-offset, offset), midDispY + y1 + 2 * (y2 - y1) * divergePoint + this.getOffset(-offset, offset), x2 + this.getOffset(-offset, offset), y2 + this.getOffset(-offset, offset));
      if (!existingPath) {
        ctx.stroke();
      }
      if (!existingPath) {
        ctx.beginPath();
      }
      ctx.moveTo(x1 + this.getOffset(-halfOffset, halfOffset), y1 + this.getOffset(-halfOffset, halfOffset));
      ctx.bezierCurveTo(midDispX + x1 + (x2 - x1) * divergePoint + this.getOffset(-halfOffset, halfOffset), midDispY + y1 + (y2 - y1) * divergePoint + this.getOffset(-halfOffset, halfOffset), midDispX + x1 + 2 * (x2 - x1) * divergePoint + this.getOffset(-halfOffset, halfOffset), midDispY + y1 + 2 * (y2 - y1) * divergePoint + this.getOffset(-halfOffset, halfOffset), x2 + this.getOffset(-halfOffset, halfOffset), y2 + this.getOffset(-halfOffset, halfOffset));
      if (!existingPath) {
        ctx.stroke();
      }
    }
  }, {
    key: 'drawLinearPath',
    value: function drawLinearPath(ctx, points, close) {
      var len = points.length;
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
  }, {
    key: 'drawCurve',
    value: function drawCurve(ctx, vertArray, existingPath, closeToCenter, center) {
      var vertArrayLength = vertArray.length;
      var i;
      if (vertArrayLength > 3) {
        var b = [];
        var s = 1 - this.curveTightness;
        if (!existingPath) {
          ctx.beginPath();
        }
        ctx.moveTo(vertArray[1][0], vertArray[1][1]);
        for (i = 1; i + 2 < vertArrayLength; i++) {
          var cachedVertArray = vertArray[i];
          b[0] = [cachedVertArray[0], cachedVertArray[1]];
          b[1] = [cachedVertArray[0] + (s * vertArray[i + 1][0] - s * vertArray[i - 1][0]) / 6, cachedVertArray[1] + (s * vertArray[i + 1][1] - s * vertArray[i - 1][1]) / 6];
          b[2] = [vertArray[i + 1][0] + (s * vertArray[i][0] - s * vertArray[i + 2][0]) / 6, vertArray[i + 1][1] + (s * vertArray[i][1] - s * vertArray[i + 2][1]) / 6];
          b[3] = [vertArray[i + 1][0], vertArray[i + 1][1]];
          ctx.bezierCurveTo(b[1][0], b[1][1], b[2][0], b[2][1], b[3][0], b[3][1]);
        }
        if (closeToCenter && center && center.length == 2) {
          var ro = this.maxRandomnessOffset || 0;
          ctx.lineTo(center[0] + this.getOffset(-ro, ro), center[1] + this.getOffset(-ro, ro));
        }
        if (!existingPath) {
          ctx.stroke();
        }
      } else if (vertArrayLength == 3) {
        this.drawBezier(ctx, vertArray[0][0], vertArray[0][1], vertArray[1][0], vertArray[1][1], vertArray[2][0], vertArray[2][1], vertArray[2][0], vertArray[2][1], existingPath);
      } else if (vertArrayLength == 2) {
        this.drawLine(ctx, vertArray[0][0], vertArray[0][1], vertArray[1][0], vertArray[1][1], existingPath);
      }
    }
  }, {
    key: 'drawBezier',
    value: function drawBezier(ctx, x1, y1, x2, y2, x3, y3, x4, y4, existingPath) {
      if (!existingPath) {
        ctx.beginPath();
      }
      ctx.moveTo(x1, y1);
      var ro = this.maxRandomnessOffset || 0;
      ctx.moveTo(x1 + this.getOffset(-ro, ro), y1 + this.getOffset(-ro, ro));
      this._drawBezierTo(ctx, x2, y2, x3, y3, x4, y4);
      if (!existingPath) {
        ctx.stroke();
      }
    }
  }, {
    key: '_drawBezierTo',
    value: function _drawBezierTo(ctx, x1, y1, x2, y2, x, y) {
      var ro = this.maxRandomnessOffset || 0;
      var final = [x + this.getOffset(-ro, ro), y + this.getOffset(-ro, ro)];
      ctx.bezierCurveTo(x1 + this.getOffset(-ro, ro), y1 + this.getOffset(-ro, ro), x2 + this.getOffset(-ro, ro), y2 + this.getOffset(-ro, ro), final[0], final[1]);
      return final;
    }
  }, {
    key: '_drawQuadTo',
    value: function _drawQuadTo(ctx, x1, y1, x, y) {
      var ro = this.maxRandomnessOffset || 0;
      var final = [x + this.getOffset(-ro, ro), y + this.getOffset(-ro, ro)];
      ctx.quadraticCurveTo(x1 + this.getOffset(-ro, ro), y1 + this.getOffset(-ro, ro), final[0], final[1]);
      return final;
    }

    // fill

  }, {
    key: 'getIntersectingLines',
    value: function getIntersectingLines(lineCoords, xCoords, yCoords) {
      var intersections = [];
      var s1 = new Segment(lineCoords[0], lineCoords[1], lineCoords[2], lineCoords[3]);
      for (var i = 0; i < xCoords.length; i++) {
        var s2 = new Segment(xCoords[i], yCoords[i], xCoords[(i + 1) % xCoords.length], yCoords[(i + 1) % xCoords.length]);
        if (s1.compare(s2) == _RELATION_.INTERSECTS) {
          intersections.push([s1.xi, s1.yi]);
        }
      }
      return intersections;
    }
  }, {
    key: 'hachureFillShape',
    value: function hachureFillShape(ctx, xCoords, yCoords) {
      if (xCoords && yCoords && xCoords.length && yCoords.length) {
        var left = xCoords[0];
        var right = xCoords[0];
        var top = yCoords[0];
        var bottom = yCoords[0];
        for (var i = 1; i < xCoords.length; i++) {
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

        var radPerDeg = Math.PI / 180;
        var hachureAngle = angle % 180 * radPerDeg;
        var cosAngle = Math.cos(hachureAngle);
        var sinAngle = Math.sin(hachureAngle);
        var tanAngle = Math.tan(hachureAngle);

        ctx.save();
        ctx.strokeStyle = this.fill;
        ctx.lineWidth = fweight;

        var it = new HachureIterator(top - 1, bottom + 1, left - 1, right + 1, gap, sinAngle, cosAngle, tanAngle);
        var rectCoords;
        while ((rectCoords = it.getNextLine()) != null) {
          var lines = this.getIntersectingLines(rectCoords, xCoords, yCoords);
          for (var _i = 0; _i < lines.length; _i++) {
            if (_i < lines.length - 1) {
              var p1 = lines[_i];
              var p2 = lines[_i + 1];
              this.drawLine(ctx, p1[0], p1[1], p2[0], p2[1]);
            }
          }
        }

        ctx.restore();
      }
    }
  }, {
    key: 'dirty',
    get: function get() {
      return this._dirty;
    }
  }, {
    key: 'roughness',
    set: function set(value) {
      this._roughness = value;
      if (this._canvas) {
        this._canvas.requestDraw();
      }
    },
    get: function get() {
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
  }, {
    key: 'bowing',
    set: function set(value) {
      this._bowing = value;
      if (this._canvas) {
        this._canvas.requestDraw();
      }
    },
    get: function get() {
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
  }, {
    key: 'stroke',
    set: function set(value) {
      this._stroke = value;
      if (this._canvas) {
        this._canvas.requestDraw();
      }
    },
    get: function get() {
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
  }, {
    key: 'strokeWidth',
    set: function set(value) {
      this._strokeWidth = value;
      if (this._canvas) {
        this._canvas.requestDraw();
      }
    },
    get: function get() {
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
  }, {
    key: 'maxRandomnessOffset',
    set: function set(value) {
      this._maxRandomnessOffset = value;
      if (this._canvas) {
        this._canvas.requestDraw();
      }
    },
    get: function get() {
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
  }, {
    key: 'curveTightness',
    set: function set(value) {
      this._curveTightness = Math.max(Math.min(value, 1), 0);
      if (this._canvas) {
        this._canvas.requestDraw();
      }
    },
    get: function get() {
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
  }, {
    key: 'fill',
    set: function set(value) {
      this._fill = value;
      if (this._canvas) {
        this._canvas.requestDraw();
      }
    },
    get: function get() {
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
  }, {
    key: 'fillStyle',
    set: function set(value) {
      this._fillStyle = value;
      if (this._canvas) {
        this._canvas.requestDraw();
      }
    },
    get: function get() {
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
  }, {
    key: 'fillWeight',
    set: function set(value) {
      this._fillWeight = value;
      if (this._canvas) {
        this._canvas.requestDraw();
      }
    },
    get: function get() {
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
  }, {
    key: 'hachureAngle',
    set: function set(value) {
      this._hachureAngle = value;
      if (this._canvas) {
        this._canvas.requestDraw();
      }
    },
    get: function get() {
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
  }, {
    key: 'hachureGap',
    set: function set(value) {
      this._hachureGap = value;
      if (this._canvas) {
        this._canvas.requestDraw();
      }
    },
    get: function get() {
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
  }]);

  return Drawable;
}();

"use strict";

var Ellipse = function (_Drawable) {
  _inherits(Ellipse, _Drawable);

  function Ellipse(x, y, width, height) {
    _classCallCheck(this, Ellipse);

    var _this = _possibleConstructorReturn(this, (Ellipse.__proto__ || Object.getPrototypeOf(Ellipse)).call(this, ['x', 'y', 'width', 'height', 'numSteps']));

    _this.x = x;
    _this.y = y;
    _this.width = width;
    _this.height = height || width;
    _this.numSteps = 9;
    return _this;
  }

  _createClass(Ellipse, [{
    key: 'draw',
    value: function draw(ctx) {
      this.ellipseInc = Math.PI * 2 / this.numSteps;
      var rx = Math.abs(this.width / 2);
      var ry = Math.abs(this.height / 2);
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
  }, {
    key: '_ellipse',
    value: function _ellipse(ctx, cx, cy, rx, ry, offset, overlap, existingPath) {
      var radOffset = this.getOffset(-0.5, 0.5) - Math.PI / 2;
      var points = [];
      points.push([this.getOffset(-offset, offset) + cx + 0.9 * rx * Math.cos(radOffset - this.ellipseInc), this.getOffset(-offset, offset) + cy + 0.9 * ry * Math.sin(radOffset - this.ellipseInc)]);
      for (var angle = radOffset; angle < Math.PI * 2 + radOffset - 0.01; angle = angle + this.ellipseInc) {
        points.push([this.getOffset(-offset, offset) + cx + rx * Math.cos(angle), this.getOffset(-offset, offset) + cy + ry * Math.sin(angle)]);
      }
      points.push([this.getOffset(-offset, offset) + cx + rx * Math.cos(radOffset + Math.PI * 2 + overlap * 0.5), this.getOffset(-offset, offset) + cy + ry * Math.sin(radOffset + Math.PI * 2 + overlap * 0.5)]);
      points.push([this.getOffset(-offset, offset) + cx + 0.98 * rx * Math.cos(radOffset + overlap), this.getOffset(-offset, offset) + cy + 0.98 * ry * Math.sin(radOffset + overlap)]);
      points.push([this.getOffset(-offset, offset) + cx + 0.9 * rx * Math.cos(radOffset + overlap * 0.5), this.getOffset(-offset, offset) + cy + 0.9 * ry * Math.sin(radOffset + overlap * 0.5)]);
      this.drawCurve(ctx, points, existingPath);
    }
  }, {
    key: '_doFill',
    value: function _doFill(ctx, rx, ry) {
      var fillStyle = this.fillStyle || "hachure";
      switch (fillStyle) {
        case "solid":
          {
            ctx.save();
            ctx.fillStyle = this.fill;
            ctx.strokeStyle = null;
            ctx.beginPath();
            this._ellipse(ctx, this.x, this.y, rx, ry, 1, this.ellipseInc * this.getOffset(0.1, this.getOffset(0.4, 1)), true);
            ctx.fill();
            ctx.restore();
            break;
          }
        default:
          {
            var angle = this.hachureAngle;
            var gap = this.hachureGap;
            if (gap <= 0) {
              gap = this.strokeWidth * 4;
            }
            var fweight = this.fillWeight;
            if (fweight < 0) {
              fweight = this.strokeWidth / 2;
            }
            var radPerDeg = Math.PI / 180;
            var hachureAngle = angle % 180 * radPerDeg;
            var tanAngle = Math.tan(hachureAngle);
            var cx = this.x,
                cy = this.y;
            var aspectRatio = ry / rx;
            var hyp = Math.sqrt(aspectRatio * tanAngle * aspectRatio * tanAngle + 1);
            var sinAnglePrime = aspectRatio * tanAngle / hyp;
            var cosAnglePrime = 1 / hyp;
            var gapPrime = gap / (rx * ry / Math.sqrt(ry * cosAnglePrime * (ry * cosAnglePrime) + rx * sinAnglePrime * (rx * sinAnglePrime)) / rx);
            var halfLen = Math.sqrt(rx * rx - (cx - rx + gapPrime) * (cx - rx + gapPrime));

            ctx.save();
            ctx.strokeStyle = this.fill;
            ctx.lineWidth = fweight;
            for (var xPos = cx - rx + gapPrime; xPos < cx + rx; xPos += gapPrime) {
              halfLen = Math.sqrt(rx * rx - (cx - xPos) * (cx - xPos));
              var p1 = this.affine(xPos, cy - halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
              var p2 = this.affine(xPos, cy + halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
              this.drawLine(ctx, p1[0], p1[1], p2[0], p2[1]);
            }
            ctx.restore();
            break;
          }
      }
    }
  }, {
    key: 'affine',
    value: function affine(x, y, cx, cy, sinAnglePrime, cosAnglePrime, R) {
      var A = -cx * cosAnglePrime - cy * sinAnglePrime + cx;
      var B = R * (cx * sinAnglePrime - cy * cosAnglePrime) + cy;
      var C = cosAnglePrime;
      var D = sinAnglePrime;
      var E = -R * sinAnglePrime;
      var F = R * cosAnglePrime;
      return [A + C * x + D * y, B + E * x + F * y];
    }
  }]);

  return Ellipse;
}(Drawable);

"use strict";

var Arc = function (_Drawable2) {
  _inherits(Arc, _Drawable2);

  function Arc(x, y, width, height, start, stop, closed) {
    _classCallCheck(this, Arc);

    var _this2 = _possibleConstructorReturn(this, (Arc.__proto__ || Object.getPrototypeOf(Arc)).call(this, ['x', 'y', 'width', 'height', 'start', 'stop', 'numSteps', 'closed']));

    _this2.x = x;
    _this2.y = y;
    _this2.width = width;
    _this2.height = height || width;
    _this2.start = start;
    _this2.stop = stop;
    _this2.numSteps = 9;
    _this2.closed = closed ? true : false;
    return _this2;
  }

  _createClass(Arc, [{
    key: 'draw',
    value: function draw(ctx) {
      var cx = this.x;
      var cy = this.y;
      var rx = Math.abs(this.width / 2);
      var ry = Math.abs(this.height / 2);
      rx += this.getOffset(-rx * 0.01, rx * 0.01);
      ry += this.getOffset(-ry * 0.01, ry * 0.01);
      var strt = this.start;
      var stp = this.stop;
      while (strt < 0) {
        strt += Math.PI * 2;
        stp += Math.PI * 2;
      }
      if (stp - strt > Math.PI * 2) {
        strt = 0;
        stp = Math.PI * 2;
      }
      var ellipseInc = Math.PI * 2 / this.numSteps;
      var arcInc = Math.min(ellipseInc / 2, (stp - strt) / 2);

      var points = [];
      points.push([cx + rx * Math.cos(strt), cy + ry * Math.sin(strt)]);
      for (var theta = strt; theta <= stp; theta += arcInc) {
        points.push([cx + rx * Math.cos(theta), cy + ry * Math.sin(theta)]);
      }
      points.push([cx + rx * Math.cos(stp), cy + ry * Math.sin(stp)]);
      points.push([cx + rx * Math.cos(stp), cy + ry * Math.sin(stp)]);

      if (this.fill && this.closed) {
        this._doFill(ctx, points, [cx, cy]);
      }

      ctx.save();
      ctx.strokeStyle = this.stroke;
      ctx.lineWidth = this.strokeWidth;
      this.drawCurve(ctx, points);
      if (this.closed) {
        var lindex = points.length - 1;
        this.drawLine(ctx, points[0][0], points[0][1], cx, cy);
        this.drawLine(ctx, points[lindex][0], points[lindex][1], cx, cy);
      }
      ctx.restore();
    }
  }, {
    key: '_doFill',
    value: function _doFill(ctx, points, center) {
      var _this3 = this;

      var fillStyle = this.fillStyle || "hachure";
      switch (fillStyle) {
        case "solid":
          {
            ctx.save();
            ctx.fillStyle = this.fill;
            ctx.beginPath();
            this.drawCurve(ctx, points, true, true, center);
            ctx.fill();
            ctx.restore();
            break;
          }
        default:
          {
            var vertices;
            var theta;

            var _ret = function () {
              var cx = _this3.x;
              var cy = _this3.y;
              var strt = _this3.start;
              var stp = _this3.stop;
              var rx = Math.abs(_this3.width / 2);
              var ry = Math.abs(_this3.height / 2);
              while (strt < 0) {
                strt += Math.PI * 2;
                stp += Math.PI * 2;
              }
              if (stp - strt > Math.PI * 2) {
                strt = 0;
                stp = Math.PI * 2;
              }
              var arcInc = (stp - strt) / _this3.numSteps;
              vertices = [];

              vertices.push([cx, cy]);
              vertices.push([cx + rx * Math.cos(strt), cy + ry * Math.sin(strt)]);
              for (theta = strt; theta <= stp; theta += arcInc) {
                vertices.push([cx + rx * Math.cos(theta), cy + ry * Math.sin(theta)]);
              }
              vertices.push([cx + rx * Math.cos(stp), cy + ry * Math.sin(stp)]);

              var xc = [];
              var yc = [];
              vertices.forEach(function (p) {
                xc.push(p[0]);
                yc.push(p[1]);
              });
              _this3.hachureFillShape(ctx, xc, yc);
              return 'break';
            }();

            if (_ret === 'break') break;
          }
      }
    }
  }]);

  return Arc;
}(Drawable);

"use strict";

var Circle = function (_Ellipse) {
  _inherits(Circle, _Ellipse);

  function Circle(x, y, radius) {
    _classCallCheck(this, Circle);

    return _possibleConstructorReturn(this, (Circle.__proto__ || Object.getPrototypeOf(Circle)).call(this, x, y, radius * 2));
  }

  _createClass(Circle, [{
    key: 'radius',
    get: function get() {
      return this.width / 2;
    },
    set: function set(value) {
      this.width = value * 2;
      this.height = value * 2;
    }
  }]);

  return Circle;
}(Ellipse);

"use strict";

var Curve = function (_Drawable3) {
  _inherits(Curve, _Drawable3);

  function Curve(points) {
    _classCallCheck(this, Curve);

    var _this5 = _possibleConstructorReturn(this, (Curve.__proto__ || Object.getPrototypeOf(Curve)).call(this));

    _this5._points = points;
    return _this5;
  }

  _createClass(Curve, [{
    key: 'setPoint',
    value: function setPoint(index, x, y) {
      this._points[index] = [x, y];
      if (this._canvas) {
        this._canvas.requestDraw();
      }
    }
  }, {
    key: 'getPoint',
    value: function getPoint(index) {
      if (index > 0 && index < this._points.length) {
        return this._points[index];
      }
      return null;
    }
  }, {
    key: 'draw',
    value: function draw(ctx) {
      ctx.save();
      ctx.strokeStyle = this.stroke;
      ctx.lineWidth = this.strokeWidth;
      var o = this.maxRandomnessOffset || 0;
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
        if (i % 3 == 0) {
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
  }]);

  return Curve;
}(Drawable);

"use strict";

var ArcConverter = function () {
  // Algorithm as described in https://www.w3.org/TR/SVG/implnote.html
  // Code adapted from nsSVGPathDataParser.cpp in Mozilla 
  // https://hg.mozilla.org/mozilla-central/file/17156fbebbc8/content/svg/content/src/nsSVGPathDataParser.cpp#l887

  function ArcConverter(from, to, radii, angle, largeArcFlag, sweepFlag) {
    _classCallCheck(this, ArcConverter);

    var radPerDeg = Math.PI / 180;
    this._segIndex = 0;
    this._numSegs = 0;
    if (from[0] == to[0] && from[1] == to[1]) {
      return;
    }
    this._rx = Math.abs(radii[0]);
    this._ry = Math.abs(radii[1]);
    this._sinPhi = Math.sin(angle * radPerDeg);
    this._cosPhi = Math.cos(angle * radPerDeg);
    var x1dash = this._cosPhi * (from[0] - to[0]) / 2.0 + this._sinPhi * (from[1] - to[1]) / 2.0;
    var y1dash = -this._sinPhi * (from[0] - to[0]) / 2.0 + this._cosPhi * (from[1] - to[1]) / 2.0;
    var root;
    var numerator = this._rx * this._rx * this._ry * this._ry - this._rx * this._rx * y1dash * y1dash - this._ry * this._ry * x1dash * x1dash;
    if (numerator < 0) {
      var s = Math.sqrt(1 - numerator / (this._rx * this._rx * this._ry * this._ry));
      this._rx = s;
      this._ry = s;
      root = 0;
    } else {
      root = (largeArcFlag == sweepFlag ? -1.0 : 1.0) * Math.sqrt(numerator / (this._rx * this._rx * y1dash * y1dash + this._ry * this._ry * x1dash * x1dash));
    }
    var cxdash = root * this._rx * y1dash / this._ry;
    var cydash = -root * this._ry * x1dash / this._rx;
    this._C = [0, 0];
    this._C[0] = this._cosPhi * cxdash - this._sinPhi * cydash + (from[0] + to[0]) / 2.0;
    this._C[1] = this._sinPhi * cxdash + this._cosPhi * cydash + (from[1] + to[1]) / 2.0;
    this._theta = this.calculateVectorAngle(1.0, 0.0, (x1dash - cxdash) / this._rx, (y1dash - cydash) / this._ry);
    var dtheta = this.calculateVectorAngle((x1dash - cxdash) / this._rx, (y1dash - cydash) / this._ry, (-x1dash - cxdash) / this._rx, (-y1dash - cydash) / this._ry);
    if (!sweepFlag && dtheta > 0) {
      dtheta -= 2 * Math.PI;
    } else if (sweepFlag && dtheta < 0) {
      dtheta += 2 * Math.PI;
    }
    this._numSegs = Math.ceil(Math.abs(dtheta / (Math.PI / 2)));
    this._delta = dtheta / this._numSegs;
    this._T = 8 / 3 * Math.sin(this._delta / 4) * Math.sin(this._delta / 4) / Math.sin(this._delta / 2);
    this._from = from;
  }

  _createClass(ArcConverter, [{
    key: 'getNextSegment',
    value: function getNextSegment() {
      var cp1, cp2, to;
      if (this._segIndex == this._numSegs) {
        return null;
      }
      var cosTheta1 = Math.cos(this._theta);
      var sinTheta1 = Math.sin(this._theta);
      var theta2 = this._theta + this._delta;
      var cosTheta2 = Math.cos(theta2);
      var sinTheta2 = Math.sin(theta2);

      to = [this._cosPhi * this._rx * cosTheta2 - this._sinPhi * this._ry * sinTheta2 + this._C[0], this._sinPhi * this._rx * cosTheta2 + this._cosPhi * this._ry * sinTheta2 + this._C[1]];
      cp1 = [this._from[0] + this._T * (-this._cosPhi * this._rx * sinTheta1 - this._sinPhi * this._ry * cosTheta1), this._from[1] + this._T * (-this._sinPhi * this._rx * sinTheta1 + this._cosPhi * this._ry * cosTheta1)];
      cp2 = [to[0] + this._T * (this._cosPhi * this._rx * sinTheta2 + this._sinPhi * this._ry * cosTheta2), to[1] + this._T * (this._sinPhi * this._rx * sinTheta2 - this._cosPhi * this._ry * cosTheta2)];

      this._theta = theta2;
      this._from = [to[0], to[1]];
      this._segIndex++;

      return {
        cp1: cp1,
        cp2: cp2,
        to: to
      };
    }
  }, {
    key: 'calculateVectorAngle',
    value: function calculateVectorAngle(ux, uy, vx, vy) {
      var ta = Math.atan2(uy, ux);
      var tb = Math.atan2(vy, vx);
      if (tb >= ta) return tb - ta;
      return 2 * Math.PI - (ta - tb);
    }
  }]);

  return ArcConverter;
}();

"use strict";

// Path parsing adapted from http://www.kevlindev.com/geometry/index.htm

function GeomToken(type, text) {
  if (arguments.length > 0) {
    this.init(type, text);
  }
}
GeomToken.prototype.init = function (type, text) {
  this.type = type;this.text = text;
};
GeomToken.prototype.typeis = function (type) {
  return this.type == type;
};

var GeomPath = function () {
  function GeomPath(d) {
    _classCallCheck(this, GeomPath);

    this.PARAMS = {
      A: ["rx", "ry", "x-axis-rotation", "large-arc-flag", "sweep-flag", "x", "y"],
      a: ["rx", "ry", "x-axis-rotation", "large-arc-flag", "sweep-flag", "x", "y"],
      C: ["x1", "y1", "x2", "y2", "x", "y"],
      c: ["x1", "y1", "x2", "y2", "x", "y"],
      H: ["x"],
      h: ["x"],
      L: ["x", "y"],
      l: ["x", "y"],
      M: ["x", "y"],
      m: ["x", "y"],
      Q: ["x1", "y1", "x", "y"],
      q: ["x1", "y1", "x", "y"],
      S: ["x2", "y2", "x", "y"],
      s: ["x2", "y2", "x", "y"],
      T: ["x", "y"],
      t: ["x", "y"],
      V: ["y"],
      v: ["y"],
      Z: [],
      z: []
    };
    this.COMMAND = 0;
    this.NUMBER = 1;
    this.EOD = 2;

    this.segments = [];
    this.d = d || "";
    this.parseData(d);
  }

  _createClass(GeomPath, [{
    key: 'parseData',
    value: function parseData(d) {
      var tokens = this.tokenize(d);
      var index = 0;
      var token = tokens[index];
      var mode = "BOD";
      this.segments = new Array();
      while (!token.typeis(this.EOD)) {
        var param_length;
        var params = new Array();
        if (mode == "BOD") {
          if (token.text == "M" || token.text == "m") {
            index++;
            param_length = this.PARAMS[token.text].length;
            mode = token.text;
          } else {
            console.error("Path data must begin with a MoveTo command");
            return;
          }
        } else {
          if (token.typeis(this.NUMBER)) {
            param_length = this.PARAMS[mode].length;
          } else {
            index++;
            param_length = this.PARAMS[token.text].length;
            mode = token.text;
          }
        }

        if (index + param_length < tokens.length) {
          for (var i = index; i < index + param_length; i++) {
            var number = tokens[i];
            if (number.typeis(this.NUMBER)) {
              params[params.length] = number.text;
            } else {
              console.error("Parameter type is not a number: " + mode + "," + number.text);
              return;
            }
          }
          var segment;
          if (this.PARAMS[mode]) {
            segment = { key: mode, data: params };
          } else {
            console.error("Unsupported segment type: " + mode);
            return;
          }
          this.segments.push(segment);
          index += param_length;
          token = tokens[index];
          if (mode == "M") mode = "L";
          if (mode == "m") mode = "l";
        } else {
          console.error("Path data ended before all parameters were found");
        }
      }
    }
  }, {
    key: 'tokenize',
    value: function tokenize(d) {
      var tokens = new Array();
      while (d != "") {
        if (d.match(/^([ \t\r\n,]+)/)) {
          d = d.substr(RegExp.$1.length);
        } else if (d.match(/^([aAcChHlLmMqQsStTvVzZ])/)) {
          tokens[tokens.length] = new GeomToken(this.COMMAND, RegExp.$1);
          d = d.substr(RegExp.$1.length);
        } else if (d.match(/^(([-+]?[0-9]+(\.[0-9]*)?|[-+]?\.[0-9]+)([eE][-+]?[0-9]+)?)/)) {
          tokens[tokens.length] = new GeomToken(this.NUMBER, parseFloat(RegExp.$1));
          d = d.substr(RegExp.$1.length);
        } else {
          console.error("Unrecognized segment command: " + d);
          return null;
        }
      }
      tokens[tokens.length] = new GeomToken(this.EOD, null);
      return tokens;
    }
  }]);

  return GeomPath;
}();

"use strict";

var HachureIterator = function () {
  function HachureIterator(top, bottom, left, right, gap, sinAngle, cosAngle, tanAngle) {
    _classCallCheck(this, HachureIterator);

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
      this.sLeft = new Segment(left, bottom, left, top);
      this.sRight = new Segment(right, bottom, right, top);
    }
  }

  _createClass(HachureIterator, [{
    key: 'getNextLine',
    value: function getNextLine() {
      if (Math.abs(this.sinAngle) < 0.0001) {
        if (this.pos < this.right) {
          var line = [this.pos, this.top, this.pos, this.bottom];
          this.pos += this.gap;
          return line;
        }
      } else if (Math.abs(this.sinAngle) > 0.9999) {
        if (this.pos < this.bottom) {
          var _line = [this.left, this.pos, this.right, this.pos];
          this.pos += this.gap;
          return _line;
        }
      } else {
        var xLower = this.pos - this.deltaX / 2;
        var xUpper = this.pos + this.deltaX / 2;
        var yLower = this.bottom;
        var yUpper = this.top;
        if (this.pos < this.right + this.deltaX) {
          while (xLower < this.left && xUpper < this.left || xLower > this.right && xUpper > this.right) {
            this.pos += this.hGap;
            xLower = this.pos - this.deltaX / 2;
            xUpper = this.pos + this.deltaX / 2;
            if (this.pos > this.right + this.deltaX) {
              return null;
            }
          }
          var s = new Segment(xLower, yLower, xUpper, yUpper);
          if (s.compare(this.sLeft) == _RELATION_.INTERSECTS) {
            xLower = s.xi;
            yLower = s.yi;
          }
          if (s.compare(this.sRight) == _RELATION_.INTERSECTS) {
            xUpper = s.xi;
            yUpper = s.yi;
          }
          if (this.tanAngle > 0) {
            xLower = this.right - (xLower - this.left);
            xUpper = this.right - (xUpper - this.left);
          }
          var _line2 = [xLower, yLower, xUpper, yUpper];
          this.pos += this.hGap;
          return _line2;
        }
      }
      return null;
    }
  }]);

  return HachureIterator;
}();

"use strict";

var _RELATION_ = {
  LEFT: 0,
  RIGHT: 1,
  INTERSECTS: 2,
  AHEAD: 3,
  BEHIND: 4,
  SEPARATE: 5,
  UNDEFINED: 6
};

var Segment = function () {
  function Segment(px1, py1, px2, py2) {
    _classCallCheck(this, Segment);

    this.px1 = px1;
    this.py1 = py1;
    this.px2 = px2;
    this.py2 = py2;
    this.xi = Number.MAX_VALUE;
    this.yi = Number.MAX_VALUE;
    this.a = py2 - py1;
    this.b = px1 - px2;
    this.c = px2 * py1 - px1 * py2;
    this._undefined = this.a == 0 && this.b == 0 && this.c == 0;
  }

  _createClass(Segment, [{
    key: 'isUndefined',
    value: function isUndefined() {
      return this._undefined;
    }
  }, {
    key: 'compare',
    value: function compare(otherSegment) {
      if (this.isUndefined() || otherSegment.isUndefined()) {
        return _RELATION_.UNDEFINED;
      }
      var grad1 = Number.MAX_VALUE;
      var grad2 = Number.MAX_VALUE;
      var int1 = 0,
          int2 = 0;
      var a = this.a,
          b = this.b,
          c = this.c;

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
          if (-c / a != -otherSegment.c / otherSegment.a) {
            return _RELATION_.SEPARATE;
          }
          if (this.py1 >= Math.min(otherSegment.py1, otherSegment.py2) && this.py1 <= Math.max(otherSegment.py1, otherSegment.py2)) {
            this.xi = this.px1;
            this.yi = this.py1;
            return _RELATION_.INTERSECTS;
          }
          if (this.py2 >= Math.min(otherSegment.py1, otherSegment.py2) && this.py2 <= Math.max(otherSegment.py1, otherSegment.py2)) {
            this.xi = this.px2;
            this.yi = this.py2;
            return _RELATION_.INTERSECTS;
          }
          return _RELATION_.SEPARATE;
        }
        this.xi = this.px1;
        this.yi = grad2 * this.xi + int2;
        if ((this.py1 - this.yi) * (this.yi - this.py2) < -0.00001 || (otherSegment.py1 - this.yi) * (this.yi - otherSegment.py2) < -0.00001) {
          return _RELATION_.SEPARATE;
        }
        if (Math.abs(otherSegment.a) < 0.00001) {
          if ((otherSegment.px1 - this.xi) * (this.xi - otherSegment.px2) < -0.00001) {
            return _RELATION_.SEPARATE;
          }
          return _RELATION_.INTERSECTS;
        }
        return _RELATION_.INTERSECTS;
      }

      if (grad2 == Number.MAX_VALUE) {
        this.xi = otherSegment.px1;
        this.yi = grad1 * this.xi + int1;
        if ((otherSegment.py1 - this.yi) * (this.yi - otherSegment.py2) < -0.00001 || (this.py1 - this.yi) * (this.yi - this.py2) < -0.00001) {
          return _RELATION_.SEPARATE;
        }
        if (Math.abs(a) < 0.00001) {
          if ((this.px1 - this.xi) * (this.xi - this.px2) < -0.00001) {
            return _RELATION_.SEPARATE;
          }
          return _RELATION_.INTERSECTS;
        }
        return _RELATION_.INTERSECTS;
      }

      if (grad1 == grad2) {
        if (int1 != int2) {
          return _RELATION_.SEPARATE;
        }
        if (this.px1 >= Math.min(otherSegment.px1, otherSegment.px2) && this.px1 <= Math.max(otherSegment.py1, otherSegment.py2)) {
          this.xi = this.px1;
          this.yi = this.py1;
          return _RELATION_.INTERSECTS;
        }
        if (this.px2 >= Math.min(otherSegment.px1, otherSegment.px2) && this.px2 <= Math.max(otherSegment.px1, otherSegment.px2)) {
          this.xi = this.px2;
          this.yi = this.py2;
          return _RELATION_.INTERSECTS;
        }
        return _RELATION_.SEPARATE;
      }

      this.xi = (int2 - int1) / (grad1 - grad2);
      this.yi = grad1 * this.xi + int1;

      if ((this.px1 - this.xi) * (this.xi - this.px2) < -0.00001 || (otherSegment.px1 - this.xi) * (this.xi - otherSegment.px2) < -0.00001) {
        return _RELATION_.SEPARATE;
      }
      return _RELATION_.INTERSECTS;
    }
  }, {
    key: 'getLength',
    value: function getLength() {
      return this._getLength(this.px1, this.py1, this.px2, this.py2);
    }
  }, {
    key: '_getLength',
    value: function _getLength(x1, y1, x2, y2) {
      var dx = x2 - x1;
      var dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    }
  }]);

  return Segment;
}();

"use strict";

var Line = function (_Drawable4) {
  _inherits(Line, _Drawable4);

  function Line(x1, y1, x2, y2) {
    _classCallCheck(this, Line);

    var _this6 = _possibleConstructorReturn(this, (Line.__proto__ || Object.getPrototypeOf(Line)).call(this, ['x1', 'y1', 'x2', 'y2']));

    _this6.x1 = x1;
    _this6.x2 = x2;
    _this6.y1 = y1;
    _this6.y2 = y2;
    return _this6;
  }

  _createClass(Line, [{
    key: 'draw',
    value: function draw(ctx) {
      ctx.save();
      ctx.strokeStyle = this.stroke;
      ctx.lineWidth = this.strokeWidth;
      this.drawLine(ctx, this.x1, this.y1, this.x2, this.y2);
      ctx.restore();
    }
  }]);

  return Line;
}(Drawable);

"use strict";

var LinearPath = function (_Drawable5) {
  _inherits(LinearPath, _Drawable5);

  function LinearPath(points) {
    _classCallCheck(this, LinearPath);

    var _this7 = _possibleConstructorReturn(this, (LinearPath.__proto__ || Object.getPrototypeOf(LinearPath)).call(this));

    _this7._points = points;
    return _this7;
  }

  _createClass(LinearPath, [{
    key: 'setPoint',
    value: function setPoint(index, x, y) {
      this._points[index] = [x, y];
      if (this._canvas) {
        this._canvas.requestDraw();
      }
    }
  }, {
    key: 'getPoint',
    value: function getPoint(index) {
      if (index > 0 && index < this._points.length) {
        return this._points[index];
      }
      return null;
    }
  }, {
    key: 'draw',
    value: function draw(ctx) {
      ctx.save();
      ctx.strokeStyle = this.stroke;
      ctx.lineWidth = this.strokeWidth;
      this.drawLinearPath(ctx, this._points, false);
      ctx.restore();
    }
  }]);

  return LinearPath;
}(Drawable);

"use strict";

var Path = function (_Drawable6) {
  _inherits(Path, _Drawable6);

  function Path(path) {
    _classCallCheck(this, Path);

    var _this8 = _possibleConstructorReturn(this, (Path.__proto__ || Object.getPrototypeOf(Path)).call(this, ['path', 'numSteps']));

    _this8.numSteps = 9;
    _this8.path = path;
    _this8._keys = ['C', 'c', 'Q', 'q', 'M', 'm', 'L', 'l', 'A', 'a', 'H', 'h', 'V', 'v', 'S', 's', 'T', 't', 'Z', 'z'];
    return _this8;
  }

  _createClass(Path, [{
    key: 'draw',
    value: function draw(ctx) {
      if (this.path) {
        var path = (this.path || "").replace(/\n/g, " ").replace(/(-)/g, " -").replace(/(-\s)/g, "-").replace("/(\s\s)/g", " ");

        this.gp = new GeomPath(path);
        var segments = this.gp.segments || [];
        // console.log("Segments", segments);

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
  }, {
    key: '_doFill',
    value: function _doFill(ctx, path) {
      var fillStyle = this.fillStyle || "hachure";
      switch (fillStyle) {
        case "solid":
          {
            ctx.save();
            ctx.fillStyle = this.fill;
            var p2d = new Path2D(path);
            ctx.fill(p2d);
            ctx.restore();
            break;
          }
        default:
          {
            var hc = this._canvas.getHiddenCanvas();
            if (hc) {
              var hctx = hc.getContext("2d");
              var xc = [0, hc.width, hc.width, 0];
              var yc = [0, 0, hc.height, hc.height];
              this.hachureFillShape(hctx, xc, yc);
            }
            ctx.save();
            ctx.fillStyle = ctx.createPattern(hc, 'repeat');
            var _p2d = new Path2D(path);
            ctx.fill(_p2d);
            ctx.restore();
            break;
          }
      }
    }
  }, {
    key: '_processSegment',
    value: function _processSegment(ctx, seg, prevSeg) {
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
  }, {
    key: '_setPosition',
    value: function _setPosition(x, y) {
      this._position = [x, y];
      if (!this._first) {
        this._first = [x, y];
      }
    }
  }, {
    key: '_moveTo',
    value: function _moveTo(seg) {
      var delta = seg.key === 'm';
      if (seg.data.length >= 2) {
        var x = +seg.data[0];
        var y = +seg.data[1];
        if (delta) {
          this._setPosition(this._position[0] + x, this._position[1] + y);
        } else {
          this._setPosition(x, y);
        }
      }
    }
  }, {
    key: '_closeShape',
    value: function _closeShape(ctx) {
      if (this._first) {
        this.drawLine(ctx, this._position[0], this._position[1], this._first[0], this._first[1], true);
      }
    }
  }, {
    key: '_lineTo',
    value: function _lineTo(ctx, seg) {
      var delta = seg.key === 'l';
      if (seg.data.length >= 2) {
        var x = +seg.data[0];
        var y = +seg.data[1];
        if (delta) {
          x += this._position[0];
          y += this._position[1];
        }
        this.drawLine(ctx, this._position[0], this._position[1], x, y, true);
        this._setPosition(x, y);
      }
    }
  }, {
    key: '_hLineTo',
    value: function _hLineTo(ctx, seg) {
      var delta = seg.key === 'h';
      if (seg.data.length) {
        var x = +seg.data[0];
        if (delta) {
          x += this._position[0];
        }
        this.drawLine(ctx, this._position[0], this._position[1], x, this._position[1], true);
        this._setPosition(x, this._position[1]);
      }
    }
  }, {
    key: '_vLineTo',
    value: function _vLineTo(ctx, seg) {
      var delta = seg.key === 'v';
      if (seg.data.length) {
        var y = +seg.data[0];
        if (delta) {
          y += this._position[1];
        }
        this.drawLine(ctx, this._position[0], this._position[1], this._position[0], y, true);
        this._setPosition(this._position[0], y);
      }
    }
  }, {
    key: '_quadCurveTo',
    value: function _quadCurveTo(ctx, seg) {
      var delta = seg.key === 'q';
      if (seg.data.length >= 4) {
        var x1 = +seg.data[0];
        var y1 = +seg.data[1];
        var x = +seg.data[2];
        var y = +seg.data[3];
        if (delta) {
          x1 += this._position[0];
          x += this._position[0];
          y1 += this._position[1];
          y += this._position[1];
        }
        var ro = this.maxRandomnessOffset || 0;
        ctx.moveTo(this._position[0], this._position[1]);
        this._drawQuadTo(ctx, x1, y1, x, y);
        ctx.moveTo(this._position[0] + this.getOffset(-ro, ro), this._position[1] + this.getOffset(-ro, ro));
        var final = this._drawQuadTo(ctx, x1, y1, x, y);
        x = final[0];
        y = final[1];
        this._setPosition(x, y);
        this._quadReflectionPoint = [x + (x - x1), y + (y - y1)];
      }
    }
  }, {
    key: '_curveTo',
    value: function _curveTo(ctx, seg) {
      var delta = seg.key === 'c';
      if (seg.data.length >= 6) {
        var x1 = +seg.data[0];
        var y1 = +seg.data[1];
        var x2 = +seg.data[2];
        var y2 = +seg.data[3];
        var x = +seg.data[4];
        var y = +seg.data[5];
        if (delta) {
          x1 += this._position[0];
          x2 += this._position[0];
          x += this._position[0];
          y1 += this._position[1];
          y2 += this._position[1];
          y += this._position[1];
        }
        var ro = this.maxRandomnessOffset || 0;
        ctx.moveTo(this._position[0], this._position[1]);
        this._drawBezierTo(ctx, x1, y1, x2, y2, x, y);
        ctx.moveTo(this._position[0] + this.getOffset(-ro, ro), this._position[1] + this.getOffset(-ro, ro));
        var final = this._drawBezierTo(ctx, x1, y1, x2, y2, x, y);
        x = final[0];
        y = final[1];
        this._setPosition(x, y);
        this._bezierReflectionPoint = [x + (x - x2), y + (y - y2)];
      }
    }
  }, {
    key: '_shortCurveTo',
    value: function _shortCurveTo(ctx, seg, prevSeg) {
      var delta = seg.key === 's';
      if (seg.data.length >= 4) {
        var x2 = +seg.data[0];
        var y2 = +seg.data[1];
        var x = +seg.data[2];
        var y = +seg.data[3];
        if (delta) {
          x2 += this._position[0];
          x += this._position[0];
          y2 += this._position[1];
          y += this._position[1];
        }
        var x1 = x2;
        var y1 = y2;
        var prevKey = prevSeg ? prevSeg.key : "";
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
  }, {
    key: '_shortQuadTo',
    value: function _shortQuadTo(ctx, seg, prevSeg) {
      var delta = seg.key === 't';
      if (seg.data.length >= 2) {
        var x = +seg.data[0];
        var y = +seg.data[1];
        if (delta) {
          x += this._position[0];
          y += this._position[1];
        }
        var x1 = x;
        var y1 = y;
        var prevKey = prevSeg ? prevSeg.key : "";
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
        var final = this._drawQuadTo(ctx, x1, y1, x, y);
        x = final[0];
        y = final[1];
        this._setPosition(x, y);
        this._quadReflectionPoint = [x + (x - x1), y + (y - y1)];
      }
    }
  }, {
    key: '_arcTo',
    value: function _arcTo(ctx, seg) {
      var delta = seg.key === 'a';
      if (seg.data.length >= 7) {
        var rx = +seg.data[0];
        var ry = +seg.data[1];
        var angle = +seg.data[2];
        var largeArcFlag = +seg.data[3];
        var sweepFlag = +seg.data[4];
        var x = +seg.data[5];
        var y = +seg.data[6];
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
            var arcConverter = new ArcConverter([this._position[0], this._position[1]], [x, y], [rx, ry], angle, largeArcFlag ? true : false, sweepFlag ? true : false);
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

    // _parse(path, index, currentWord = "", current = {}, segments) {
    //   if (index >= path.length) {
    //     if (current && current.key) {
    //       if (currentWord) {
    //         current.data.push(currentWord);
    //       }
    //       segments.push(current);
    //       currentWord = "";
    //       current = {};
    //     }
    //     return;
    //   }
    //   current.data = current.data || [];
    //   var c = path.charAt(index);
    //   if ((!c) || (c == ' ') || (c == ',')) {
    //     if (currentWord) {
    //       current.data.push(currentWord);
    //       currentWord = "";
    //     }
    //   } else {
    //     if (this._keys.indexOf(c) >= 0) {
    //       if (current && current.key) {
    //         if (currentWord) {
    //           current.data.push(currentWord);
    //         }
    //         segments.push(current);
    //         currentWord = "";
    //         current = {};
    //       }
    //       current.key = c;
    //       current.data = [];
    //     } else {
    //       currentWord += c;
    //     }
    //   }
    //   this._parse(path, index + 1, currentWord, current, segments);
    // }

  }]);

  return Path;
}(Drawable);

"use strict";

var Polygon = function (_Drawable7) {
  _inherits(Polygon, _Drawable7);

  function Polygon(points) {
    _classCallCheck(this, Polygon);

    var _this9 = _possibleConstructorReturn(this, (Polygon.__proto__ || Object.getPrototypeOf(Polygon)).call(this));

    _this9._points = points;
    return _this9;
  }

  _createClass(Polygon, [{
    key: 'setPoint',
    value: function setPoint(index, x, y) {
      this._points[index] = [x, y];
      if (this._canvas) {
        this._canvas.requestDraw();
      }
    }
  }, {
    key: 'getPoint',
    value: function getPoint(index) {
      if (index > 0 && index < this._points.length) {
        return this._points[index];
      }
      return null;
    }
  }, {
    key: 'draw',
    value: function draw(ctx) {
      if (this.fill) {
        this._doFill(ctx, this._points);
      }
      ctx.save();
      ctx.strokeStyle = this.stroke;
      ctx.lineWidth = this.strokeWidth;
      this.drawLinearPath(ctx, this._points, true);
      ctx.restore();
    }
  }, {
    key: '_doFill',
    value: function _doFill(ctx, points) {
      var _this10 = this;

      var fillStyle = this.fillStyle || "hachure";
      switch (fillStyle) {
        case "solid":
          {
            ctx.save();
            ctx.fillStyle = this.fill;
            var o = this.maxRandomnessOffset || 0;
            var len = points.length;
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
        default:
          {
            var _ret2 = function () {
              var xc = [];
              var yc = [];
              points.forEach(function (p) {
                xc.push(p[0]);
                yc.push(p[1]);
              });
              _this10.hachureFillShape(ctx, xc, yc);
              return 'break';
            }();

            if (_ret2 === 'break') break;
          }
      }
    }
  }]);

  return Polygon;
}(Drawable);

"use strict";

var Rectangle = function (_Drawable8) {
  _inherits(Rectangle, _Drawable8);

  function Rectangle(x, y, width, height) {
    _classCallCheck(this, Rectangle);

    var _this11 = _possibleConstructorReturn(this, (Rectangle.__proto__ || Object.getPrototypeOf(Rectangle)).call(this, ['x', 'y', 'width', 'height']));

    _this11.x = x;
    _this11.y = y;
    _this11.width = width;
    _this11.height = height;
    return _this11;
  }

  _createClass(Rectangle, [{
    key: 'draw',
    value: function draw(ctx) {
      var left = this.x;
      var right = this.x + this.width;
      var top = this.y;
      var bottom = this.y + this.height;

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
  }, {
    key: '_doFill',
    value: function _doFill(ctx, left, right, top, bottom) {
      var fillStyle = this.fillStyle || "hachure";
      switch (fillStyle) {
        case "solid":
          {
            ctx.save();
            ctx.fillStyle = this.fill;
            var o = this.maxRandomnessOffset || 0;
            var points = [[left + this.getOffset(-o, o), top + this.getOffset(-o, o)], [right + this.getOffset(-o, o), top + this.getOffset(-o, o)], [right + this.getOffset(-o, o), bottom + this.getOffset(-o, o)], [left + this.getOffset(-o, o), bottom + this.getOffset(-o, o)]];
            ctx.beginPath();
            ctx.moveTo(points[0][0], points[0][1]);
            ctx.lineTo(points[1][0], points[1][1]);
            ctx.lineTo(points[2][0], points[2][1]);
            ctx.lineTo(points[3][0], points[3][1]);
            ctx.fill();
            ctx.restore();
            break;
          }
        default:
          {
            var xc = [left, right, right, left];
            var yc = [top, top, bottom, bottom];
            this.hachureFillShape(ctx, xc, yc);
            break;
          }
      }
    }
  }]);

  return Rectangle;
}(Drawable);

"use strict";

var RoughCanvas = function () {
  function RoughCanvas(canvas, width, height) {
    _classCallCheck(this, RoughCanvas);

    this._canvas = canvas;
    this.width = width || canvas.width;
    this.height = height || canvas.height;
    canvas.width = this.width;
    canvas.height = this.height;
    this._objects = [];
    this._drawRequested = false;

    this.roughness = 1;
    this.bowing = 1;

    this.stroke = "#000";
    this.strokeWidth = 1;

    this.fill = null;
    this.fillStyle = "hachure";
    this.fillWeight = -1;
    this.hachureAngle = -41;
    this.hachureGap = -1;

    this.maxRandomnessOffset = 2;
  }

  _createClass(RoughCanvas, [{
    key: 'add',
    value: function add(drawable) {
      if (drawable instanceof Drawable) {
        if (drawable.attached) {
          return;
        }
        this._objects.push(drawable);
        drawable.attach(this, this._objects.length - 1);
        this.requestDraw();
      } else {
        console.warn("Ignoring canvas add - the object is not drawable", drawable);
      }
    }
  }, {
    key: 'remove',
    value: function remove(drawable) {
      if (drawable instanceof Drawable) {
        if (drawable.attached) {
          this._objects.splice(drawable.z, 1);
          drawable.detach();
          this.requestDraw();
        }
      } else {
        console.warn("Ignoring canvas remove - the object is not drawable", drawable);
      }
    }
  }, {
    key: 'clear',
    value: function clear() {
      if (this._objects && this._objects.length) {
        this._objects.forEach(function (d) {
          d.detach();
        });
      }
      this._objects = [];
      this.requestDraw();
    }
  }, {
    key: 'requestDraw',
    value: function requestDraw() {
      var _this12 = this;

      if (!this._drawRequested) {
        this._drawRequested = true;
        window.requestAnimationFrame(function () {
          _this12._drawRequested = false;
          _this12._draw();
        });
      }
    }
  }, {
    key: '_draw',
    value: function _draw() {
      var ctx = this._canvas.getContext("2d");
      ctx.clearRect(0, 0, this.width, this.height);
      for (var i = 0; i < this._objects.length; i++) {
        try {
          this._objects[i].draw(ctx);
        } catch (ex) {
          console.error(ex);
        }
      }
    }
  }, {
    key: 'getHiddenCanvas',
    value: function getHiddenCanvas() {
      if (!this._hiddenCanvas) {
        var div = document.createElement("div");
        div.setAttribute("id", "roughHiddenCanvas");
        div.style.overflow = "hidden";
        div.style.position = "absolute";
        div.style.left = "-1px";
        div.style.top = "-1px";
        div.style.width = "0px";
        div.style.height = "0px";
        div.style.opacity = 0;
        div.style.pointerEvents = "none";
        document.body.appendChild(div);
        this._hiddenCanvas = document.createElement("canvas");
        div.appendChild(this._hiddenCanvas);
      }
      var hc = this._hiddenCanvas;
      hc.width = this.width;
      hc.height = this.height;
      var ctx = hc.getContext("2d");
      ctx.clearRect(0, 0, this.width, this.height);
      return hc;
    }
  }, {
    key: 'arc',
    value: function arc(x, y, width, height, start, stop, closed) {
      var d = new Arc(x, y, width, height, start, stop, closed);
      this.add(d);
      return d;
    }
  }, {
    key: 'circle',
    value: function circle(x, y, radius) {
      var d = new Circle(x, y, radius);
      this.add(d);
      return d;
    }
  }, {
    key: 'ellipse',
    value: function ellipse(x, y, width, height) {
      var d = new Ellipse(x, y, width, height);
      this.add(d);
      return d;
    }
  }, {
    key: 'curve',
    value: function curve(points) {
      var d = new Curve(points);
      this.add(d);
      return d;
    }
  }, {
    key: 'line',
    value: function line(x1, y1, x2, y2) {
      var d = new Line(x1, y1, x2, y2);
      this.add(d);
      return d;
    }
  }, {
    key: 'rectangle',
    value: function rectangle(x, y, width, height) {
      var d = new Rectangle(x, y, width, height);
      this.add(d);
      return d;
    }
  }, {
    key: 'linearPath',
    value: function linearPath(points) {
      var d = new LinearPath(points);
      this.add(d);
      return d;
    }
  }, {
    key: 'polygon',
    value: function polygon(points) {
      var d = new Polygon(points);
      this.add(d);
      return d;
    }
  }, {
    key: 'path',
    value: function path(d) {
      var p = new Path(d);
      this.add(p);
      return p;
    }
  }]);

  return RoughCanvas;
}();
//# sourceMappingURL=rough.js.map
