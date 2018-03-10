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

export class RoughPath {
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

export class RoughArcConverter {
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