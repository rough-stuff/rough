var rough = (function () {
'use strict';

function RoughSegmentRelation() {
  return {
    LEFT: 0,
    RIGHT: 1,
    INTERSECTS: 2,
    AHEAD: 3,
    BEHIND: 4,
    SEPARATE: 5,
    UNDEFINED: 6
  };
}

class RoughSegment {
  constructor(px1, py1, px2, py2) {
    this.RoughSegmentRelationConst = RoughSegmentRelation();
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
      return this.RoughSegmentRelationConst.UNDEFINED;
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
          return this.RoughSegmentRelationConst.SEPARATE;
        }
        if ((this.py1 >= Math.min(otherSegment.py1, otherSegment.py2)) && (this.py1 <= Math.max(otherSegment.py1, otherSegment.py2))) {
          this.xi = this.px1;
          this.yi = this.py1;
          return this.RoughSegmentRelationConst.INTERSECTS;
        }
        if ((this.py2 >= Math.min(otherSegment.py1, otherSegment.py2)) && (this.py2 <= Math.max(otherSegment.py1, otherSegment.py2))) {
          this.xi = this.px2;
          this.yi = this.py2;
          return this.RoughSegmentRelationConst.INTERSECTS;
        }
        return this.RoughSegmentRelationConst.SEPARATE;
      }
      this.xi = this.px1;
      this.yi = (grad2 * this.xi + int2);
      if (((this.py1 - this.yi) * (this.yi - this.py2) < -0.00001) || ((otherSegment.py1 - this.yi) * (this.yi - otherSegment.py2) < -0.00001)) {
        return this.RoughSegmentRelationConst.SEPARATE;
      }
      if (Math.abs(otherSegment.a) < 0.00001) {
        if ((otherSegment.px1 - this.xi) * (this.xi - otherSegment.px2) < -0.00001) {
          return this.RoughSegmentRelationConst.SEPARATE;
        }
        return this.RoughSegmentRelationConst.INTERSECTS;
      }
      return this.RoughSegmentRelationConst.INTERSECTS;
    }

    if (grad2 == Number.MAX_VALUE) {
      this.xi = otherSegment.px1;
      this.yi = grad1 * this.xi + int1;
      if (((otherSegment.py1 - this.yi) * (this.yi - otherSegment.py2) < -0.00001) || ((this.py1 - this.yi) * (this.yi - this.py2) < -0.00001)) {
        return this.RoughSegmentRelationConst.SEPARATE;
      }
      if (Math.abs(a) < 0.00001) {
        if ((this.px1 - this.xi) * (this.xi - this.px2) < -0.00001) {
          return this.RoughSegmentRelationConst.SEPARATE;
        }
        return this.RoughSegmentRelationConst.INTERSECTS;
      }
      return this.RoughSegmentRelationConst.INTERSECTS;
    }

    if (grad1 == grad2) {
      if (int1 != int2) {
        return this.RoughSegmentRelationConst.SEPARATE;
      }
      if ((this.px1 >= Math.min(otherSegment.px1, otherSegment.px2)) && (this.px1 <= Math.max(otherSegment.py1, otherSegment.py2))) {
        this.xi = this.px1;
        this.yi = this.py1;
        return this.RoughSegmentRelationConst.INTERSECTS;
      }
      if ((this.px2 >= Math.min(otherSegment.px1, otherSegment.px2)) && (this.px2 <= Math.max(otherSegment.px1, otherSegment.px2))) {
        this.xi = this.px2;
        this.yi = this.py2;
        return this.RoughSegmentRelationConst.INTERSECTS;
      }
      return this.RoughSegmentRelationConst.SEPARATE;
    }

    this.xi = ((int2 - int1) / (grad1 - grad2));
    this.yi = (grad1 * this.xi + int1);

    if (((this.px1 - this.xi) * (this.xi - this.px2) < -0.00001) || ((otherSegment.px1 - this.xi) * (this.xi - otherSegment.px2) < -0.00001)) {
      return this.RoughSegmentRelationConst.SEPARATE;
    }
    return this.RoughSegmentRelationConst.INTERSECTS;
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
        if (s.compare(this.sLeft) == RoughSegmentRelation().INTERSECTS) {
          xLower = s.xi;
          yLower = s.yi;
        }
        if (s.compare(this.sRight) == RoughSegmentRelation().INTERSECTS) {
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

class PathToken {
  constructor(type, text) {
    this.type = type;
    this.text = text;
  }
  isType(type) {
    return this.type === type;
  }
}

class ParsedPath {
  constructor(d) {
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
    this.processPoints();
  }

  loadFromSegments(segments) {
    this.segments = segments;
    this.processPoints();
  }

  processPoints() {
    let first = null, currentPoint = [0, 0];
    for (let i = 0; i < this.segments.length; i++) {
      let s = this.segments[i];
      switch (s.key) {
        case 'M':
        case 'L':
        case 'T':
          s.point = [s.data[0], s.data[1]];
          break;
        case 'm':
        case 'l':
        case 't':
          s.point = [s.data[0] + currentPoint[0], s.data[1] + currentPoint[1]];
          break;
        case 'H':
          s.point = [s.data[0], currentPoint[1]];
          break;
        case 'h':
          s.point = [s.data[0] + currentPoint[0], currentPoint[1]];
          break;
        case 'V':
          s.point = [currentPoint[0], s.data[0]];
          break;
        case 'v':
          s.point = [currentPoint[0], s.data[0] + currentPoint[1]];
          break;
        case 'z':
        case 'Z':
          if (first) {
            s.point = [first[0], first[1]];
          }
          break;
        case 'C':
          s.point = [s.data[4], s.data[5]];
          break;
        case 'c':
          s.point = [s.data[4] + currentPoint[0], s.data[5] + currentPoint[1]];
          break;
        case 'S':
          s.point = [s.data[2], s.data[3]];
          break;
        case 's':
          s.point = [s.data[2] + currentPoint[0], s.data[3] + currentPoint[1]];
          break;
        case 'Q':
          s.point = [s.data[2], s.data[3]];
          break;
        case 'q':
          s.point = [s.data[2] + currentPoint[0], s.data[3] + currentPoint[1]];
          break;
        case 'A':
          s.point = [s.data[5], s.data[6]];
          break;
        case 'a':
          s.point = [s.data[5] + currentPoint[0], s.data[6] + currentPoint[1]];
          break;
      }
      if (s.key === 'm' || s.key === 'M') {
        first = null;
      }
      if (s.point) {
        currentPoint = s.point;
        if (!first) {
          first = s.point;
        }
      }
      if (s.key === 'z' || s.key === 'Z') {
        first = null;
      }
    }
  }

  get closed() {
    if (typeof this._closed === 'undefined') {
      this._closed = false;
      for (let s of this.segments) {
        if (s.key.toLowerCase() === 'z') {
          this._closed = true;
        }
      }
    }
    return this._closed;
  }

  parseData(d) {
    var tokens = this.tokenize(d);
    var index = 0;
    var token = tokens[index];
    var mode = "BOD";
    this.segments = new Array();
    while (!token.isType(this.EOD)) {
      var param_length;
      var params = new Array();
      if (mode == "BOD") {
        if (token.text == "M" || token.text == "m") {
          index++;
          param_length = this.PARAMS[token.text].length;
          mode = token.text;
        } else {
          return this.parseData('M0,0' + d);
        }
      } else {
        if (token.isType(this.NUMBER)) {
          param_length = this.PARAMS[mode].length;
        } else {
          index++;
          param_length = this.PARAMS[token.text].length;
          mode = token.text;
        }
      }

      if ((index + param_length) < tokens.length) {
        for (var i = index; i < index + param_length; i++) {
          var number = tokens[i];
          if (number.isType(this.NUMBER)) {
            params[params.length] = number.text;
          }
          else {
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

  tokenize(d) {
    var tokens = new Array();
    while (d != "") {
      if (d.match(/^([ \t\r\n,]+)/)) {
        d = d.substr(RegExp.$1.length);
      } else if (d.match(/^([aAcChHlLmMqQsStTvVzZ])/)) {
        tokens[tokens.length] = new PathToken(this.COMMAND, RegExp.$1);
        d = d.substr(RegExp.$1.length);
      } else if (d.match(/^(([-+]?[0-9]+(\.[0-9]*)?|[-+]?\.[0-9]+)([eE][-+]?[0-9]+)?)/)) {
        tokens[tokens.length] = new PathToken(this.NUMBER, parseFloat(RegExp.$1));
        d = d.substr(RegExp.$1.length);
      } else {
        console.error("Unrecognized segment command: " + d);
        return null;
      }
    }
    tokens[tokens.length] = new PathToken(this.EOD, null);
    return tokens;
  }
}

class RoughPath {
  constructor(d) {
    this.d = d;
    this.parsed = new ParsedPath(d);
    this._position = [0, 0];
    this.bezierReflectionPoint = null;
    this.quadReflectionPoint = null;
    this._first = null;
  }

  get segments() {
    return this.parsed.segments;
  }

  get closed() {
    return this.parsed.closed;
  }

  get linearPoints() {
    if (!this._linearPoints) {
      const lp = [];
      let points = [];
      for (let s of this.parsed.segments) {
        let key = s.key.toLowerCase();
        if (key === 'm' || key === 'z') {
          if (points.length) {
            lp.push(points);
            points = [];
          }
          if (key === 'z') {
            continue;
          }
        }
        if (s.point) {
          points.push(s.point);
        }
      }
      if (points.length) {
        lp.push(points);
        points = [];
      }
      this._linearPoints = lp;
    }
    return this._linearPoints;
  }

  get first() {
    return this._first;
  }

  set first(v) {
    this._first = v;
  }

  setPosition(x, y) {
    this._position = [x, y];
    if (!this._first) {
      this._first = [x, y];
    }
  }

  get position() {
    return this._position;
  }

  get x() {
    return this._position[0];
  }

  get y() {
    return this._position[1];
  }
}

class RoughArcConverter {
  // Algorithm as described in https://www.w3.org/TR/SVG/implnote.html
  // Code adapted from nsSVGPathDataParser.cpp in Mozilla 
  // https://hg.mozilla.org/mozilla-central/file/17156fbebbc8/content/svg/content/src/nsSVGPathDataParser.cpp#l887
  constructor(from, to, radii, angle, largeArcFlag, sweepFlag) {
    const radPerDeg = Math.PI / 180;
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
      let s = Math.sqrt(1 - (numerator / (this._rx * this._rx * this._ry * this._ry)));
      this._rx = s;
      this._ry = s;
      root = 0;
    } else {
      root = (largeArcFlag == sweepFlag ? -1.0 : 1.0) *
        Math.sqrt(numerator / (this._rx * this._rx * y1dash * y1dash + this._ry * this._ry * x1dash * x1dash));
    }
    let cxdash = root * this._rx * y1dash / this._ry;
    let cydash = -root * this._ry * x1dash / this._rx;
    this._C = [0, 0];
    this._C[0] = this._cosPhi * cxdash - this._sinPhi * cydash + (from[0] + to[0]) / 2.0;
    this._C[1] = this._sinPhi * cxdash + this._cosPhi * cydash + (from[1] + to[1]) / 2.0;
    this._theta = this.calculateVectorAngle(1.0, 0.0, (x1dash - cxdash) / this._rx, (y1dash - cydash) / this._ry);
    let dtheta = this.calculateVectorAngle((x1dash - cxdash) / this._rx, (y1dash - cydash) / this._ry, (-x1dash - cxdash) / this._rx, (-y1dash - cydash) / this._ry);
    if ((!sweepFlag) && (dtheta > 0)) {
      dtheta -= 2 * Math.PI;
    } else if (sweepFlag && (dtheta < 0)) {
      dtheta += 2 * Math.PI;
    }
    this._numSegs = Math.ceil(Math.abs(dtheta / (Math.PI / 2)));
    this._delta = dtheta / this._numSegs;
    this._T = (8 / 3) * Math.sin(this._delta / 4) * Math.sin(this._delta / 4) / Math.sin(this._delta / 2);
    this._from = from;
  }

  getNextSegment() {
    var cp1, cp2, to;
    if (this._segIndex == this._numSegs) {
      return null;
    }
    let cosTheta1 = Math.cos(this._theta);
    let sinTheta1 = Math.sin(this._theta);
    let theta2 = this._theta + this._delta;
    let cosTheta2 = Math.cos(theta2);
    let sinTheta2 = Math.sin(theta2);

    to = [
      this._cosPhi * this._rx * cosTheta2 - this._sinPhi * this._ry * sinTheta2 + this._C[0],
      this._sinPhi * this._rx * cosTheta2 + this._cosPhi * this._ry * sinTheta2 + this._C[1]
    ];
    cp1 = [
      this._from[0] + this._T * (- this._cosPhi * this._rx * sinTheta1 - this._sinPhi * this._ry * cosTheta1),
      this._from[1] + this._T * (- this._sinPhi * this._rx * sinTheta1 + this._cosPhi * this._ry * cosTheta1)
    ];
    cp2 = [
      to[0] + this._T * (this._cosPhi * this._rx * sinTheta2 + this._sinPhi * this._ry * cosTheta2),
      to[1] + this._T * (this._sinPhi * this._rx * sinTheta2 - this._cosPhi * this._ry * cosTheta2)
    ];

    this._theta = theta2;
    this._from = [to[0], to[1]];
    this._segIndex++;

    return {
      cp1: cp1,
      cp2: cp2,
      to: to
    };
  }

  calculateVectorAngle(ux, uy, vx, vy) {
    let ta = Math.atan2(uy, ux);
    let tb = Math.atan2(vy, vx);
    if (tb >= ta)
      return tb - ta;
    return 2 * Math.PI - (ta - tb);
  }
}

class PathFitter {
  constructor(sets, closed) {
    this.sets = sets;
    this.closed = closed;
  }

  fit(simplification) {
    let outSets = [];
    for (const set of this.sets) {
      let length = set.length;
      let estLength = Math.floor(simplification * length);
      if (estLength < 5) {
        if (length <= 5) {
          continue;
        }
        estLength = 5;
      }
      outSets.push(this.reduce(set, estLength));
    }

    let d = '';
    for (const set of outSets) {
      for (let i = 0; i < set.length; i++) {
        let point = set[i];
        if (i === 0) {
          d += 'M' + point[0] + "," + point[1];
        } else {
          d += 'L' + point[0] + "," + point[1];
        }
      }
      if (this.closed) {
        d += 'z ';
      }
    }
    return d;
  }

  distance(p1, p2) {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
  }

  reduce(set, count) {
    if (set.length <= count) {
      return set;
    }
    let points = set.slice(0);
    while (points.length > count) {
      let minArea = -1;
      let minIndex = -1;
      for (let i = 1; i < (points.length - 1); i++) {
        let a = this.distance(points[i - 1], points[i]);
        let b = this.distance(points[i], points[i + 1]);
        let c = this.distance(points[i - 1], points[i + 1]);
        let s = (a + b + c) / 2.0;
        let area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
        if ((minArea < 0) || (area < minArea)) {
          minArea = area;
          minIndex = i;
        }
      }
      if (minIndex > 0) {
        points.splice(minIndex, 1);
      } else {
        break;
      }
    }
    return points;
  }
}

class RoughRenderer {
  line(x1, y1, x2, y2, o) {
    let ops = this._doubleLine(x1, y1, x2, y2, o);
    return { type: 'path', ops };
  }

  linearPath(points, close, o) {
    const len = (points || []).length;
    if (len > 2) {
      let ops = [];
      for (let i = 0; i < (len - 1); i++) {
        ops = ops.concat(this._doubleLine(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], o));
      }
      if (close) {
        ops = ops.concat(this._doubleLine(points[len - 1][0], points[len - 1][1], points[0][0], points[0][1], o));
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

  curve(points, o) {
    let o1 = this._curveWithOffset(points, 1 * (1 + o.roughness * 0.2), o);
    let o2 = this._curveWithOffset(points, 1.5 * (1 + o.roughness * 0.22), o);
    return { type: 'path', ops: o1.concat(o2) };
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

  arc(x, y, width, height, start, stop, closed, roughClosure, o) {
    let cx = x;
    let cy = y;
    let rx = Math.abs(width / 2);
    let ry = Math.abs(height / 2);
    rx += this._getOffset(-rx * 0.01, rx * 0.01, o);
    ry += this._getOffset(-ry * 0.01, ry * 0.01, o);
    let strt = start;
    let stp = stop;
    while (strt < 0) {
      strt += Math.PI * 2;
      stp += Math.PI * 2;
    }
    if ((stp - strt) > (Math.PI * 2)) {
      strt = 0;
      stp = Math.PI * 2;
    }
    let ellipseInc = (Math.PI * 2) / o.curveStepCount;
    let arcInc = Math.min(ellipseInc / 2, (stp - strt) / 2);
    let o1 = this._arc(arcInc, cx, cy, rx, ry, strt, stp, 1, o);
    let o2 = this._arc(arcInc, cx, cy, rx, ry, strt, stp, 1.5, o);
    let ops = o1.concat(o2);
    if (closed) {
      if (roughClosure) {
        ops = ops.concat(this._doubleLine(cx, cy, cx + rx * Math.cos(strt), cy + ry * Math.sin(strt), o));
        ops = ops.concat(this._doubleLine(cx, cy, cx + rx * Math.cos(stp), cy + ry * Math.sin(stp), o));
      } else {
        ops.push({ op: 'lineTo', data: [cx, cy] });
        ops.push({ op: 'lineTo', data: [cx + rx * Math.cos(strt), cy + ry * Math.sin(strt)] });
      }
    }
    return { type: 'path', ops };
  }

  hachureFillArc(x, y, width, height, start, stop, o) {
    let cx = x;
    let cy = y;
    let rx = Math.abs(width / 2);
    let ry = Math.abs(height / 2);
    rx += this._getOffset(-rx * 0.01, rx * 0.01, o);
    ry += this._getOffset(-ry * 0.01, ry * 0.01, o);
    let strt = start;
    let stp = stop;
    while (strt < 0) {
      strt += Math.PI * 2;
      stp += Math.PI * 2;
    }
    if ((stp - strt) > (Math.PI * 2)) {
      strt = 0;
      stp = Math.PI * 2;
    }
    let increment = (stp - strt) / o.curveStepCount;
    let xc = [], yc = [];
    for (let angle = strt; angle <= stp; angle = angle + increment) {
      xc.push(cx + rx * Math.cos(angle));
      yc.push(cy + ry * Math.sin(angle));
    }
    xc.push(cx + rx * Math.cos(stp));
    yc.push(cy + ry * Math.sin(stp));
    xc.push(cx);
    yc.push(cy);
    return this.hachureFillShape(xc, yc, o);
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
            ops = ops.concat(this._doubleLine(p1[0], p1[1], p2[0], p2[1], o));
          }
        }
      }
    }
    return { type: 'fillSketch', ops };
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
      ops = ops.concat(this._doubleLine(p1[0], p1[1], p2[0], p2[1], o));
    }
    return { type: 'fillSketch', ops };
  }

  svgPath(path, o) {
    path = (path || '').replace(/\n/g, " ").replace(/(-)/g, " -").replace(/(-\s)/g, "-").replace("/(\s\s)/g", " ");
    let p = new RoughPath(path);
    if (o.simplification) {
      let fitter = new PathFitter(p.linearPoints, p.closed);
      let d = fitter.fit(o.simplification);
      p = new RoughPath(d);
    }
    let ops = [];
    let segments = p.segments || [];
    for (let i = 0; i < segments.length; i++) {
      let s = segments[i];
      let prev = i > 0 ? segments[i - 1] : null;
      let opList = this._processSegment(p, s, prev, o);
      if (opList && opList.length) {
        ops = ops.concat(opList);
      }
    }
    return { type: 'path', ops };
  }

  // privates

  _bezierTo(x1, y1, x2, y2, x, y, path, o) {
    let ops = [];
    let ros = [o.maxRandomnessOffset || 1, (o.maxRandomnessOffset || 1) + 0.5];
    let f = null;
    for (let i = 0; i < 2; i++) {
      if (i === 0) {
        ops.push({ op: 'move', data: [path.x, path.y] });
      } else {
        ops.push({ op: 'move', data: [path.x + this._getOffset(-ros[0], ros[0], o), path.y + this._getOffset(-ros[0], ros[0], o)] });
      }
      f = [x + this._getOffset(-ros[i], ros[i], o), y + this._getOffset(-ros[i], ros[i], o)];
      ops.push({
        op: 'bcurveTo', data: [
          x1 + this._getOffset(-ros[i], ros[i], o), y1 + this._getOffset(-ros[i], ros[i], o),
          x2 + this._getOffset(-ros[i], ros[i], o), y2 + this._getOffset(-ros[i], ros[i], o),
          f[0], f[1]
        ]
      });
    }
    path.setPosition(f[0], f[1]);
    return ops;
  }

  _processSegment(path, seg, prevSeg, o) {
    let ops = [];
    switch (seg.key) {
      case 'M':
      case 'm': {
        let delta = seg.key === 'm';
        if (seg.data.length >= 2) {
          let x = +seg.data[0];
          let y = +seg.data[1];
          if (delta) {
            x += path.x;
            y += path.y;
          }
          let ro = 1 * (o.maxRandomnessOffset || 0);
          x = x + this._getOffset(-ro, ro, o);
          y = y + this._getOffset(-ro, ro, o);
          path.setPosition(x, y);
          ops.push({ op: 'move', data: [x, y] });
        }
        break;
      }
      case 'L':
      case 'l': {
        let delta = seg.key === 'l';
        if (seg.data.length >= 2) {
          let x = +seg.data[0];
          let y = +seg.data[1];
          if (delta) {
            x += path.x;
            y += path.y;
          }
          ops = ops.concat(this._doubleLine(path.x, path.y, x, y, o));
          path.setPosition(x, y);
        }
        break;
      }
      case 'H':
      case 'h': {
        const delta = seg.key === 'h';
        if (seg.data.length) {
          let x = +seg.data[0];
          if (delta) {
            x += path.x;
          }
          ops = ops.concat(this._doubleLine(path.x, path.y, x, path.y, o));
          path.setPosition(x, path.y);
        }
        break;
      }
      case 'V':
      case 'v': {
        const delta = seg.key === 'v';
        if (seg.data.length) {
          let y = +seg.data[0];
          if (delta) {
            y += path.y;
          }
          ops = ops.concat(this._doubleLine(path.x, path.y, path.x, y, o));
          path.setPosition(path.x, y);
        }
        break;
      }
      case 'Z':
      case 'z': {
        if (path.first) {
          ops = ops.concat(this._doubleLine(path.x, path.y, path.first[0], path.first[1], o));
          path.setPosition(path.first[0], path.first[1]);
          path.first = null;
        }
        break;
      }
      case 'C':
      case 'c': {
        const delta = seg.key === 'c';
        if (seg.data.length >= 6) {
          let x1 = +seg.data[0];
          let y1 = +seg.data[1];
          let x2 = +seg.data[2];
          let y2 = +seg.data[3];
          let x = +seg.data[4];
          let y = +seg.data[5];
          if (delta) {
            x1 += path.x;
            x2 += path.x;
            x += path.x;
            y1 += path.y;
            y2 += path.y;
            y += path.y;
          }
          let ob = this._bezierTo(x1, y1, x2, y2, x, y, path, o);
          ops = ops.concat(ob);
          path.bezierReflectionPoint = [x + (x - x2), y + (y - y2)];
        }
        break;
      }
      case 'S':
      case 's': {
        const delta = seg.key === 's';
        if (seg.data.length >= 4) {
          let x2 = +seg.data[0];
          let y2 = +seg.data[1];
          let x = +seg.data[2];
          let y = +seg.data[3];
          if (delta) {
            x2 += path.x;
            x += path.x;
            y2 += path.y;
            y += path.y;
          }
          let x1 = x2;
          let y1 = y2;
          let prevKey = prevSeg ? prevSeg.key : "";
          var ref = null;
          if (prevKey == 'c' || prevKey == 'C' || prevKey == 's' || prevKey == 'S') {
            ref = path.bezierReflectionPoint;
          }
          if (ref) {
            x1 = ref[0];
            y1 = ref[1];
          }
          let ob = this._bezierTo(x1, y1, x2, y2, x, y, path, o);
          ops = ops.concat(ob);
          path.bezierReflectionPoint = [x + (x - x2), y + (y - y2)];
        }
        break;
      }
      case 'Q':
      case 'q': {
        const delta = seg.key === 'q';
        if (seg.data.length >= 4) {
          let x1 = +seg.data[0];
          let y1 = +seg.data[1];
          let x = +seg.data[2];
          let y = +seg.data[3];
          if (delta) {
            x1 += path.x;
            x += path.x;
            y1 += path.y;
            y += path.y;
          }
          let offset1 = 1 * (1 + o.roughness * 0.2);
          let offset2 = 1.5 * (1 + o.roughness * 0.22);
          ops.push({ op: 'move', data: [path.x + this._getOffset(-offset1, offset1, o), path.y + this._getOffset(-offset1, offset1, o)] });
          let f = [x + this._getOffset(-offset1, offset1, o), y + this._getOffset(-offset1, offset1, o)];
          ops.push({
            op: 'qcurveTo', data: [
              x1 + this._getOffset(-offset1, offset1, o), y1 + this._getOffset(-offset1, offset1, o),
              f[0], f[1]
            ]
          });
          ops.push({ op: 'move', data: [path.x + this._getOffset(-offset2, offset2, o), path.y + this._getOffset(-offset2, offset2, o)] });
          f = [x + this._getOffset(-offset2, offset2, o), y + this._getOffset(-offset2, offset2, o)];
          ops.push({
            op: 'qcurveTo', data: [
              x1 + this._getOffset(-offset2, offset2, o), y1 + this._getOffset(-offset2, offset2, o),
              f[0], f[1]
            ]
          });
          path.setPosition(f[0], f[1]);
          path.quadReflectionPoint = [x + (x - x1), y + (y - y1)];
        }
        break;
      }
      case 'T':
      case 't': {
        const delta = seg.key === 't';
        if (seg.data.length >= 2) {
          let x = +seg.data[0];
          let y = +seg.data[1];
          if (delta) {
            x += path.x;
            y += path.y;
          }
          let x1 = x;
          let y1 = y;
          let prevKey = prevSeg ? prevSeg.key : "";
          var ref = null;
          if (prevKey == 'q' || prevKey == 'Q' || prevKey == 't' || prevKey == 'T') {
            ref = path.quadReflectionPoint;
          }
          if (ref) {
            x1 = ref[0];
            y1 = ref[1];
          }
          let offset1 = 1 * (1 + o.roughness * 0.2);
          let offset2 = 1.5 * (1 + o.roughness * 0.22);
          ops.push({ op: 'move', data: [path.x + this._getOffset(-offset1, offset1, o), path.y + this._getOffset(-offset1, offset1, o)] });
          let f = [x + this._getOffset(-offset1, offset1, o), y + this._getOffset(-offset1, offset1, o)];
          ops.push({
            op: 'qcurveTo', data: [
              x1 + this._getOffset(-offset1, offset1, o), y1 + this._getOffset(-offset1, offset1, o),
              f[0], f[1]
            ]
          });
          ops.push({ op: 'move', data: [path.x + this._getOffset(-offset2, offset2, o), path.y + this._getOffset(-offset2, offset2, o)] });
          f = [x + this._getOffset(-offset2, offset2, o), y + this._getOffset(-offset2, offset2, o)];
          ops.push({
            op: 'qcurveTo', data: [
              x1 + this._getOffset(-offset2, offset2, o), y1 + this._getOffset(-offset2, offset2, o),
              f[0], f[1]
            ]
          });
          path.setPosition(f[0], f[1]);
          path.quadReflectionPoint = [x + (x - x1), y + (y - y1)];
        }
        break;
      }
      case 'A':
      case 'a': {
        const delta = seg.key === 'a';
        if (seg.data.length >= 7) {
          let rx = +seg.data[0];
          let ry = +seg.data[1];
          let angle = +seg.data[2];
          let largeArcFlag = +seg.data[3];
          let sweepFlag = +seg.data[4];
          let x = +seg.data[5];
          let y = +seg.data[6];
          if (delta) {
            x += path.x;
            y += path.y;
          }
          if (x == path.x && y == path.y) {
            break;
          }
          if (rx == 0 || ry == 0) {
            ops = ops.concat(this._doubleLine(path.x, path.y, x, y, o));
            path.setPosition(x, y);
          } else {
            let ro = o.maxRandomnessOffset || 0;
            for (let i = 0; i < 1; i++) {
              let arcConverter = new RoughArcConverter(
                [path.x, path.y],
                [x, y],
                [rx, ry],
                angle,
                largeArcFlag ? true : false,
                sweepFlag ? true : false
              );
              let segment = arcConverter.getNextSegment();
              while (segment) {
                let ob = this._bezierTo(segment.cp1[0], segment.cp1[1], segment.cp2[0], segment.cp2[1], segment.to[0], segment.to[1], path, o);
                ops = ops.concat(ob);
                segment = arcConverter.getNextSegment();
              }
            }
          }
        }
        break;
      }
      default:
        break;
    }
    return ops;
  }

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

  _doubleLine(x1, y1, x2, y2, o) {
    const o1 = this._line(x1, y1, x2, y2, o, true, false);
    const o2 = this._line(x1, y1, x2, y2, o, true, true);
    return o1.concat(o2);
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
    let midDispY = o.bowing * o.maxRandomnessOffset * (x1 - x2) / 200;
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
      ops = ops.concat(this._doubleLine(points[0][0], points[0][1], points[1][0], points[1][1], o));
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

  _curveWithOffset(points, offset, o) {
    const ps = [];
    ps.push([
      points[0][0] + this._getOffset(-offset, offset, o),
      points[0][1] + this._getOffset(-offset, offset, o),
    ]);
    ps.push([
      points[0][0] + this._getOffset(-offset, offset, o),
      points[0][1] + this._getOffset(-offset, offset, o),
    ]);
    for (let i = 1; i < points.length; i++) {
      ps.push([
        points[i][0] + this._getOffset(-offset, offset, o),
        points[i][1] + this._getOffset(-offset, offset, o),
      ]);
      if (i === (points.length - 1)) {
        ps.push([
          points[i][0] + this._getOffset(-offset, offset, o),
          points[i][1] + this._getOffset(-offset, offset, o),
        ]);
      }
    }
    return this._curve(ps, null, o);
  }

  _arc(increment, cx, cy, rx, ry, strt, stp, offset, o) {
    const radOffset = strt + this._getOffset(-0.1, 0.1, o);
    const points = [];
    points.push([
      this._getOffset(-offset, offset, o) + cx + 0.9 * rx * Math.cos(radOffset - increment),
      this._getOffset(-offset, offset, o) + cy + 0.9 * ry * Math.sin(radOffset - increment)
    ]);
    for (let angle = radOffset; angle <= stp; angle = angle + increment) {
      points.push([
        this._getOffset(-offset, offset, o) + cx + rx * Math.cos(angle),
        this._getOffset(-offset, offset, o) + cy + ry * Math.sin(angle)
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
    return this._curve(points, null, o);
  }

  _getIntersectingLines(lineCoords, xCoords, yCoords) {
    let intersections = [];
    var s1 = new RoughSegment(lineCoords[0], lineCoords[1], lineCoords[2], lineCoords[3]);
    for (var i = 0; i < xCoords.length; i++) {
      let s2 = new RoughSegment(xCoords[i], yCoords[i], xCoords[(i + 1) % xCoords.length], yCoords[(i + 1) % xCoords.length]);
      if (s1.compare(s2) == RoughSegmentRelation().INTERSECTS) {
        intersections.push([s1.xi, s1.yi]);
      }
    }
    return intersections;
  }
}

self._roughScript = self.document && self.document.currentScript && self.document.currentScript.src;

class RoughGenerator {
  constructor(config, canvas) {
    this.config = config || {};
    this.canvas = canvas;
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
    if (this.config.options) {
      this.defaultOptions = this._options(this.config.options);
    }
  }

  _options(options) {
    return options ? Object.assign({}, this.defaultOptions, options) : this.defaultOptions;
  }

  _drawable(shape, sets, options) {
    return { shape, sets: sets || [], options: options || this.defaultOptions };
  }

  get lib() {
    if (!this._renderer) {
      if (self && self.workly && this.config.async && (!this.config.noWorker)) {
        const tos = Function.prototype.toString;
        const worklySource = this.config.worklyURL || 'https://cdn.jsdelivr.net/gh/pshihn/workly/dist/workly.min.js';
        const rendererSource = this.config.roughURL || self._roughScript;
        if (rendererSource && worklySource) {
          let code = `importScripts('${worklySource}', '${rendererSource}');\nworkly.expose(self.rough.createRenderer());`;
          let ourl = URL.createObjectURL(new Blob([code]));
          this._renderer = workly.proxy(ourl);
        } else {
          this._renderer = new RoughRenderer();
        }
      } else {
        this._renderer = new RoughRenderer();
      }
    }
    return this._renderer;
  }

  line(x1, y1, x2, y2, options) {
    const o = this._options(options);
    return this._drawable('line', [this.lib.line(x1, y1, x2, y2, o)], o);
  }

  rectangle(x, y, width, height, options) {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      const xc = [x, x + width, x + width, x];
      const yc = [y, y, y + height, y + height];
      if (o.fillStyle === 'solid') {
        paths.push(this.lib.solidFillShape(xc, yc, o));
      } else {
        paths.push(this.lib.hachureFillShape(xc, yc, o));
      }
    }
    paths.push(this.lib.rectangle(x, y, width, height, o));
    return this._drawable('rectangle', paths, o);
  }

  ellipse(x, y, width, height, options) {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        const shape = this.lib.ellipse(x, y, width, height, o);
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(this.lib.hachureFillEllipse(x, y, width, height, o));
      }
    }
    paths.push(this.lib.ellipse(x, y, width, height, o));
    return this._drawable('ellipse', paths, o);
  }

  circle(x, y, diameter, options) {
    let ret = this.ellipse(x, y, diameter, diameter, options);
    ret.shape = 'circle';
    return ret;
  }

  linearPath(points, options) {
    const o = this._options(options);
    return this._drawable('linearPath', [this.lib.linearPath(points, false, o)], o);
  }

  polygon(points, options) {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      let xc = [], yc = [];
      for (let p of points) {
        xc.push(p[0]);
        yc.push(p[1]);
      }
      if (o.fillStyle === 'solid') {
        paths.push(this.lib.solidFillShape(xc, yc, o));
      } else {
        paths.push(this.lib.hachureFillShape(xc, yc, o));
      }
    }
    paths.push(this.lib.linearPath(points, true, o));
    return this._drawable('polygon', paths, o);
  }

  arc(x, y, width, height, start, stop, closed, options) {
    const o = this._options(options);
    const paths = [];
    if (closed && o.fill) {
      if (o.fillStyle === 'solid') {
        let shape = this.lib.arc(x, y, width, height, start, stop, true, false, o);
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(this.lib.hachureFillArc(x, y, width, height, start, stop, o));
      }
    }
    paths.push(this.lib.arc(x, y, width, height, start, stop, closed, true, o));
    return this._drawable('arc', paths, o);
  }

  curve(points, options) {
    const o = this._options(options);
    return this._drawable('curve', [this.lib.curve(points, o)], o);
  }

  path(d, options) {
    const o = this._options(options);
    const paths = [];
    if (!d) {
      return this._drawable('path', paths, o);
    }
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        let shape = { type: 'path2Dfill', path: d };
        paths.push(shape);
      } else {
        const size = this._computePathSize(d);
        let xc = [0, size[0], size[0], 0];
        let yc = [0, 0, size[1], size[1]];
        let shape = this.lib.hachureFillShape(xc, yc, o);
        shape.type = 'path2Dpattern';
        shape.size = size;
        shape.path = d;
        paths.push(shape);
      }
    }
    paths.push(this.lib.svgPath(d, o));
    return this._drawable('path', paths, o);
  }

  _computePathSize(d) {
    let size = [0, 0];
    if (self.document) {
      try {
        const ns = "http://www.w3.org/2000/svg";
        let svg = self.document.createElementNS(ns, "svg");
        svg.setAttribute("width", "0");
        svg.setAttribute("height", "0");
        let pathNode = self.document.createElementNS(ns, "path");
        pathNode.setAttribute('d', d);
        svg.appendChild(pathNode);
        self.document.body.appendChild(svg);
        let bb = pathNode.getBBox();
        if (bb) {
          size[0] = bb.width || 0;
          size[1] = bb.height || 0;
        }
        self.document.body.removeChild(svg);
      } catch (err) { }
    }
    if (!(size[0] * size[1])) {
      size = [this.canvas.width || 100, this.canvas.height || 100];
    }
    size[0] = Math.min(size[0] * 4, this.canvas.width);
    size[1] = Math.min(size[1] * 4, this.canvas.height);
    return size;
  }
}

class RoughGeneratorAsync extends RoughGenerator {
  async line(x1, y1, x2, y2, options) {
    const o = this._options(options);
    return this._drawable('line', [await this.lib.line(x1, y1, x2, y2, o)], o);
  }

  async rectangle(x, y, width, height, options) {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      const xc = [x, x + width, x + width, x];
      const yc = [y, y, y + height, y + height];
      if (o.fillStyle === 'solid') {
        paths.push(await this.lib.solidFillShape(xc, yc, o));
      } else {
        paths.push(await this.lib.hachureFillShape(xc, yc, o));
      }
    }
    paths.push(await this.lib.rectangle(x, y, width, height, o));
    return this._drawable('rectangle', paths, o);
  }

  async ellipse(x, y, width, height, options) {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        const shape = await this.lib.ellipse(x, y, width, height, o);
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(await this.lib.hachureFillEllipse(x, y, width, height, o));
      }
    }
    paths.push(await this.lib.ellipse(x, y, width, height, o));
    return this._drawable('ellipse', paths, o);
  }

  async circle(x, y, diameter, options) {
    let ret = await this.ellipse(x, y, diameter, diameter, options);
    ret.shape = 'circle';
    return ret;
  }

  async linearPath(points, options) {
    const o = this._options(options);
    return this._drawable('linearPath', [await this.lib.linearPath(points, false, o)], o);
  }

  async polygon(points, options) {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      let xc = [], yc = [];
      for (let p of points) {
        xc.push(p[0]);
        yc.push(p[1]);
      }
      if (o.fillStyle === 'solid') {
        paths.push(await this.lib.solidFillShape(xc, yc, o));
      } else {
        paths.push(await this.lib.hachureFillShape(xc, yc, o));
      }
    }
    paths.push(await this.lib.linearPath(points, true, o));
    return this._drawable('polygon', paths, o);
  }

  async arc(x, y, width, height, start, stop, closed, options) {
    const o = this._options(options);
    const paths = [];
    if (closed && o.fill) {
      if (o.fillStyle === 'solid') {
        let shape = await this.lib.arc(x, y, width, height, start, stop, true, false, o);
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(await this.lib.hachureFillArc(x, y, width, height, start, stop, o));
      }
    }
    paths.push(await this.lib.arc(x, y, width, height, start, stop, closed, true, o));
    return this._drawable('arc', paths, o);
  }

  async curve(points, options) {
    const o = this._options(options);
    return this._drawable('curve', [await this.lib.curve(points, o)], o);
  }

  async path(d, options) {
    const o = this._options(options);
    const paths = [];
    if (!d) {
      return this._drawable('path', paths, o);
    }
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        let shape = { type: 'path2Dfill', path: d };
        paths.push(shape);
      } else {
        const size = this._computePathSize(d);
        let xc = [0, size[0], size[0], 0];
        let yc = [0, 0, size[1], size[1]];
        let shape = await this.lib.hachureFillShape(xc, yc, o);
        shape.type = 'path2Dpattern';
        shape.size = size;
        shape.path = d;
        paths.push(shape);
      }
    }
    paths.push(await this.lib.svgPath(d, o));
    return this._drawable('path', paths, o);
  }
}

class RoughCanvas {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this._init(config);
  }

  _init(config) {
    this.gen = new RoughGenerator(config, this.canvas);
  }

  get generator() {
    return this.gen;
  }

  static createRenderer() {
    return new RoughRenderer();
  }

  line(x1, y1, x2, y2, options) {
    let d = this.gen.line(x1, y1, x2, y2, options);
    this.draw(d);
    return d;
  }

  rectangle(x, y, width, height, options) {
    let d = this.gen.rectangle(x, y, width, height, options);
    this.draw(d);
    return d;
  }

  ellipse(x, y, width, height, options) {
    let d = this.gen.ellipse(x, y, width, height, options);
    this.draw(d);
    return d;
  }

  circle(x, y, diameter, options) {
    let d = this.gen.circle(x, y, diameter, options);
    this.draw(d);
    return d;
  }

  linearPath(points, options) {
    let d = this.gen.linearPath(points, options);
    this.draw(d);
    return d;
  }

  polygon(points, options) {
    let d = this.gen.polygon(points, options);
    this.draw(d);
    return d;
  }

  arc(x, y, width, height, start, stop, closed, options) {
    let d = this.gen.arc(x, y, width, height, start, stop, closed, options);
    this.draw(d);
    return d;
  }

  curve(points, options) {
    let d = this.gen.curve(points, options);
    this.draw(d);
    return d;
  }

  path(d, options) {
    let drawing = this.gen.path(d, options);
    this.draw(drawing);
    return drawing;
  }

  draw(drawable) {
    let sets = drawable.sets || [];
    let o = drawable.options || this.gen.defaultOptions;
    let ctx = this.ctx;
    for (let drawing of sets) {
      switch (drawing.type) {
        case 'path':
          ctx.save();
          ctx.strokeStyle = o.stroke;
          ctx.lineWidth = o.strokeWidth;
          this._drawToContext(ctx, drawing);
          ctx.restore();
          break;
        case 'fillPath':
          ctx.save();
          ctx.fillStyle = o.fill;
          this._drawToContext(ctx, drawing, o);
          ctx.restore();
          break;
        case 'fillSketch':
          this._fillSketch(ctx, drawing, o);
          break;
        case 'path2Dfill': {
          this.ctx.save();
          this.ctx.fillStyle = o.fill;
          let p2d = new Path2D(drawing.path);
          this.ctx.fill(p2d);
          this.ctx.restore();
          break;
        }
        case 'path2Dpattern': {
          let size = drawing.size;
          let hcanvas = document.createElement('canvas');
          hcanvas.width = size[0];
          hcanvas.height = size[1];
          this._fillSketch(hcanvas.getContext("2d"), drawing, o);
          this.ctx.save();
          this.ctx.fillStyle = this.ctx.createPattern(hcanvas, 'repeat');
          let p2d = new Path2D(drawing.path);
          this.ctx.fill(p2d);
          this.ctx.restore();
          break;
        }
      }
    }
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

  _drawToContext(ctx, drawing) {
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
        case 'qcurveTo':
          ctx.quadraticCurveTo(data[0], data[1], data[2], data[3]);
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

class RoughCanvasAsync extends RoughCanvas {
  _init(config) {
    this.gen = new RoughGeneratorAsync(config, this.canvas);
  }

  async line(x1, y1, x2, y2, options) {
    let d = await this.gen.line(x1, y1, x2, y2, options);
    this.draw(d);
    return d;
  }

  async rectangle(x, y, width, height, options) {
    let d = await this.gen.rectangle(x, y, width, height, options);
    this.draw(d);
    return d;
  }

  async ellipse(x, y, width, height, options) {
    let d = await this.gen.ellipse(x, y, width, height, options);
    this.draw(d);
    return d;
  }

  async circle(x, y, diameter, options) {
    let d = await this.gen.circle(x, y, diameter, options);
    this.draw(d);
    return d;
  }

  async linearPath(points, options) {
    let d = await this.gen.linearPath(points, options);
    this.draw(d);
    return d;
  }

  async polygon(points, options) {
    let d = await this.gen.polygon(points, options);
    this.draw(d);
    return d;
  }

  async arc(x, y, width, height, start, stop, closed, options) {
    let d = await this.gen.arc(x, y, width, height, start, stop, closed, options);
    this.draw(d);
    return d;
  }

  async curve(points, options) {
    let d = await this.gen.curve(points, options);
    this.draw(d);
    return d;
  }

  async path(d, options) {
    let drawing = await this.gen.path(d, options);
    this.draw(drawing);
    return drawing;
  }
}

var index = {
  canvas(canvas, config) {
    if (config && config.async) {
      return new RoughCanvasAsync(canvas, config);
    }
    return new RoughCanvas(canvas, config);
  },
  createRenderer() {
    return RoughCanvas.createRenderer();
  },
  generator(config, size) {
    if (config && config.async) {
      return new RoughGeneratorAsync(config, size);
    }
    return new RoughGenerator(config, size);
  }
};

return index;

}());
