var rough = (function () {
  'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var inherits = function (subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  };

  var possibleConstructorReturn = function (self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  };

  function isType(token, type) {
      return token.type === type;
  }
  var PARAMS = {
      A: 7,
      a: 7,
      C: 6,
      c: 6,
      H: 1,
      h: 1,
      L: 2,
      l: 2,
      M: 2,
      m: 2,
      Q: 4,
      q: 4,
      S: 4,
      s: 4,
      T: 4,
      t: 2,
      V: 1,
      v: 1,
      Z: 0,
      z: 0
  };

  var ParsedPath = function () {
      function ParsedPath(d) {
          classCallCheck(this, ParsedPath);

          this.COMMAND = 0;
          this.NUMBER = 1;
          this.EOD = 2;
          this.segments = [];
          this.parseData(d);
          this.processPoints();
      }

      createClass(ParsedPath, [{
          key: 'tokenize',
          value: function tokenize(d) {
              var tokens = new Array();
              while (d !== '') {
                  if (d.match(/^([ \t\r\n,]+)/)) {
                      d = d.substr(RegExp.$1.length);
                  } else if (d.match(/^([aAcChHlLmMqQsStTvVzZ])/)) {
                      tokens[tokens.length] = { type: this.COMMAND, text: RegExp.$1 };
                      d = d.substr(RegExp.$1.length);
                  } else if (d.match(/^(([-+]?[0-9]+(\.[0-9]*)?|[-+]?\.[0-9]+)([eE][-+]?[0-9]+)?)/)) {
                      tokens[tokens.length] = { type: this.NUMBER, text: '' + parseFloat(RegExp.$1) };
                      d = d.substr(RegExp.$1.length);
                  } else {
                      console.error('Unrecognized segment command: ' + d);
                      return [];
                  }
              }
              tokens[tokens.length] = { type: this.EOD, text: '' };
              return tokens;
          }
      }, {
          key: 'parseData',
          value: function parseData(d) {
              var tokens = this.tokenize(d);
              var index = 0;
              var token = tokens[index];
              var mode = 'BOD';
              this.segments = new Array();
              while (!isType(token, this.EOD)) {
                  var param_length = void 0;
                  var params = new Array();
                  if (mode === 'BOD') {
                      if (token.text === 'M' || token.text === 'm') {
                          index++;
                          param_length = PARAMS[token.text];
                          mode = token.text;
                      } else {
                          this.parseData('M0,0' + d);
                          return;
                      }
                  } else {
                      if (isType(token, this.NUMBER)) {
                          param_length = PARAMS[mode];
                      } else {
                          index++;
                          param_length = PARAMS[token.text];
                          mode = token.text;
                      }
                  }
                  if (index + param_length < tokens.length) {
                      for (var i = index; i < index + param_length; i++) {
                          var numbeToken = tokens[i];
                          if (isType(numbeToken, this.NUMBER)) {
                              params[params.length] = +numbeToken.text;
                          } else {
                              console.error('Parameter type is not a number: ' + mode + ',' + numbeToken.text);
                              return;
                          }
                      }
                      if (typeof PARAMS[mode] === 'number') {
                          var segment = { key: mode, data: params };
                          this.segments.push(segment);
                          index += param_length;
                          token = tokens[index];
                          if (mode === 'M') mode = 'L';
                          if (mode === 'm') mode = 'l';
                      } else {
                          console.error('Unsupported segment type: ' + mode);
                          return;
                      }
                  } else {
                      console.error('Path data ended before all parameters were found');
                  }
              }
          }
      }, {
          key: 'processPoints',
          value: function processPoints() {
              var first = null;
              var currentPoint = [0, 0];
              for (var i = 0; i < this.segments.length; i++) {
                  var s = this.segments[i];
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
      }, {
          key: 'closed',
          get: function get$$1() {
              if (typeof this._closed === 'undefined') {
                  this._closed = false;
                  var _iteratorNormalCompletion = true;
                  var _didIteratorError = false;
                  var _iteratorError = undefined;

                  try {
                      for (var _iterator = this.segments[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                          var s = _step.value;

                          if (s.key.toLowerCase() === 'z') {
                              this._closed = true;
                          }
                      }
                  } catch (err) {
                      _didIteratorError = true;
                      _iteratorError = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion && _iterator.return) {
                              _iterator.return();
                          }
                      } finally {
                          if (_didIteratorError) {
                              throw _iteratorError;
                          }
                      }
                  }
              }
              return this._closed;
          }
      }]);
      return ParsedPath;
  }();

  var RoughPath = function () {
      function RoughPath(d) {
          classCallCheck(this, RoughPath);

          this._position = [0, 0];
          this._first = null;
          this.bezierReflectionPoint = null;
          this.quadReflectionPoint = null;
          this.parsed = new ParsedPath(d);
      }

      createClass(RoughPath, [{
          key: 'setPosition',
          value: function setPosition(x, y) {
              this._position = [x, y];
              if (!this._first) {
                  this._first = [x, y];
              }
          }
      }, {
          key: 'segments',
          get: function get$$1() {
              return this.parsed.segments;
          }
      }, {
          key: 'closed',
          get: function get$$1() {
              return this.parsed.closed;
          }
      }, {
          key: 'linearPoints',
          get: function get$$1() {
              if (!this._linearPoints) {
                  var lp = [];
                  var points = [];
                  var _iteratorNormalCompletion2 = true;
                  var _didIteratorError2 = false;
                  var _iteratorError2 = undefined;

                  try {
                      for (var _iterator2 = this.parsed.segments[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                          var s = _step2.value;

                          var key = s.key.toLowerCase();
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
                  } catch (err) {
                      _didIteratorError2 = true;
                      _iteratorError2 = err;
                  } finally {
                      try {
                          if (!_iteratorNormalCompletion2 && _iterator2.return) {
                              _iterator2.return();
                          }
                      } finally {
                          if (_didIteratorError2) {
                              throw _iteratorError2;
                          }
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
      }, {
          key: 'first',
          get: function get$$1() {
              return this._first;
          },
          set: function set$$1(v) {
              this._first = v;
          }
      }, {
          key: 'position',
          get: function get$$1() {
              return this._position;
          }
      }, {
          key: 'x',
          get: function get$$1() {
              return this._position[0];
          }
      }, {
          key: 'y',
          get: function get$$1() {
              return this._position[1];
          }
      }]);
      return RoughPath;
  }();
  // Algorithm as described in https://www.w3.org/TR/SVG/implnote.html
  // Code adapted from nsSVGPathDataParser.cpp in Mozilla 
  // https://hg.mozilla.org/mozilla-central/file/17156fbebbc8/content/svg/content/src/nsSVGPathDataParser.cpp#l887
  var RoughArcConverter = function () {
      function RoughArcConverter(from, to, radii, angle, largeArcFlag, sweepFlag) {
          classCallCheck(this, RoughArcConverter);

          this._segIndex = 0;
          this._numSegs = 0;
          this._rx = 0;
          this._ry = 0;
          this._sinPhi = 0;
          this._cosPhi = 0;
          this._C = [0, 0];
          this._theta = 0;
          this._delta = 0;
          this._T = 0;
          this._from = from;
          if (from[0] === to[0] && from[1] === to[1]) {
              return;
          }
          var radPerDeg = Math.PI / 180;
          this._rx = Math.abs(radii[0]);
          this._ry = Math.abs(radii[1]);
          this._sinPhi = Math.sin(angle * radPerDeg);
          this._cosPhi = Math.cos(angle * radPerDeg);
          var x1dash = this._cosPhi * (from[0] - to[0]) / 2.0 + this._sinPhi * (from[1] - to[1]) / 2.0;
          var y1dash = -this._sinPhi * (from[0] - to[0]) / 2.0 + this._cosPhi * (from[1] - to[1]) / 2.0;
          var root = 0;
          var numerator = this._rx * this._rx * this._ry * this._ry - this._rx * this._rx * y1dash * y1dash - this._ry * this._ry * x1dash * x1dash;
          if (numerator < 0) {
              var s = Math.sqrt(1 - numerator / (this._rx * this._rx * this._ry * this._ry));
              this._rx = this._rx * s;
              this._ry = this._ry * s;
              root = 0;
          } else {
              root = (largeArcFlag === sweepFlag ? -1.0 : 1.0) * Math.sqrt(numerator / (this._rx * this._rx * y1dash * y1dash + this._ry * this._ry * x1dash * x1dash));
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
      }

      createClass(RoughArcConverter, [{
          key: 'getNextSegment',
          value: function getNextSegment() {
              if (this._segIndex === this._numSegs) {
                  return null;
              }
              var cosTheta1 = Math.cos(this._theta);
              var sinTheta1 = Math.sin(this._theta);
              var theta2 = this._theta + this._delta;
              var cosTheta2 = Math.cos(theta2);
              var sinTheta2 = Math.sin(theta2);
              var to = [this._cosPhi * this._rx * cosTheta2 - this._sinPhi * this._ry * sinTheta2 + this._C[0], this._sinPhi * this._rx * cosTheta2 + this._cosPhi * this._ry * sinTheta2 + this._C[1]];
              var cp1 = [this._from[0] + this._T * (-this._cosPhi * this._rx * sinTheta1 - this._sinPhi * this._ry * cosTheta1), this._from[1] + this._T * (-this._sinPhi * this._rx * sinTheta1 + this._cosPhi * this._ry * cosTheta1)];
              var cp2 = [to[0] + this._T * (this._cosPhi * this._rx * sinTheta2 + this._sinPhi * this._ry * cosTheta2), to[1] + this._T * (this._sinPhi * this._rx * sinTheta2 - this._cosPhi * this._ry * cosTheta2)];
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
      return RoughArcConverter;
  }();
  var PathFitter = function () {
      function PathFitter(sets, closed) {
          classCallCheck(this, PathFitter);

          this.sets = sets;
          this.closed = closed;
      }

      createClass(PathFitter, [{
          key: 'fit',
          value: function fit(simplification) {
              var outSets = [];
              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                  for (var _iterator3 = this.sets[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                      var set$$1 = _step3.value;

                      var length = set$$1.length;
                      var estLength = Math.floor(simplification * length);
                      if (estLength < 5) {
                          if (length <= 5) {
                              continue;
                          }
                          estLength = 5;
                      }
                      outSets.push(this.reduce(set$$1, estLength));
                  }
              } catch (err) {
                  _didIteratorError3 = true;
                  _iteratorError3 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion3 && _iterator3.return) {
                          _iterator3.return();
                      }
                  } finally {
                      if (_didIteratorError3) {
                          throw _iteratorError3;
                      }
                  }
              }

              var d = '';
              var _iteratorNormalCompletion4 = true;
              var _didIteratorError4 = false;
              var _iteratorError4 = undefined;

              try {
                  for (var _iterator4 = outSets[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                      var _set = _step4.value;

                      for (var i = 0; i < _set.length; i++) {
                          var point = _set[i];
                          if (i === 0) {
                              d += 'M' + point[0] + ',' + point[1];
                          } else {
                              d += 'L' + point[0] + ',' + point[1];
                          }
                      }
                      if (this.closed) {
                          d += 'z ';
                      }
                  }
              } catch (err) {
                  _didIteratorError4 = true;
                  _iteratorError4 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion4 && _iterator4.return) {
                          _iterator4.return();
                      }
                  } finally {
                      if (_didIteratorError4) {
                          throw _iteratorError4;
                      }
                  }
              }

              return d;
          }
      }, {
          key: 'distance',
          value: function distance(p1, p2) {
              return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
          }
      }, {
          key: 'reduce',
          value: function reduce(set$$1, count) {
              if (set$$1.length <= count) {
                  return set$$1;
              }
              var points = set$$1.slice(0);
              while (points.length > count) {
                  var minArea = -1;
                  var minIndex = -1;
                  for (var i = 1; i < points.length - 1; i++) {
                      var a = this.distance(points[i - 1], points[i]);
                      var b = this.distance(points[i], points[i + 1]);
                      var c = this.distance(points[i - 1], points[i + 1]);
                      var s = (a + b + c) / 2.0;
                      var area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
                      if (minArea < 0 || area < minArea) {
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
      }]);
      return PathFitter;
  }();

  var Segment = function () {
      function Segment(p1, p2) {
          classCallCheck(this, Segment);

          this.xi = Number.MAX_VALUE;
          this.yi = Number.MAX_VALUE;
          this.px1 = p1[0];
          this.py1 = p1[1];
          this.px2 = p2[0];
          this.py2 = p2[1];
          this.a = this.py2 - this.py1;
          this.b = this.px1 - this.px2;
          this.c = this.px2 * this.py1 - this.px1 * this.py2;
          this._undefined = this.a === 0 && this.b === 0 && this.c === 0;
      }

      createClass(Segment, [{
          key: "isUndefined",
          value: function isUndefined() {
              return this._undefined;
          }
      }, {
          key: "intersects",
          value: function intersects(otherSegment) {
              if (this.isUndefined() || otherSegment.isUndefined()) {
                  return false;
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
              if (grad1 === Number.MAX_VALUE) {
                  if (grad2 === Number.MAX_VALUE) {
                      if (-c / a !== -otherSegment.c / otherSegment.a) {
                          return false;
                      }
                      if (this.py1 >= Math.min(otherSegment.py1, otherSegment.py2) && this.py1 <= Math.max(otherSegment.py1, otherSegment.py2)) {
                          this.xi = this.px1;
                          this.yi = this.py1;
                          return true;
                      }
                      if (this.py2 >= Math.min(otherSegment.py1, otherSegment.py2) && this.py2 <= Math.max(otherSegment.py1, otherSegment.py2)) {
                          this.xi = this.px2;
                          this.yi = this.py2;
                          return true;
                      }
                      return false;
                  }
                  this.xi = this.px1;
                  this.yi = grad2 * this.xi + int2;
                  if ((this.py1 - this.yi) * (this.yi - this.py2) < -0.00001 || (otherSegment.py1 - this.yi) * (this.yi - otherSegment.py2) < -0.00001) {
                      return false;
                  }
                  if (Math.abs(otherSegment.a) < 0.00001) {
                      if ((otherSegment.px1 - this.xi) * (this.xi - otherSegment.px2) < -0.00001) {
                          return false;
                      }
                      return true;
                  }
                  return true;
              }
              if (grad2 === Number.MAX_VALUE) {
                  this.xi = otherSegment.px1;
                  this.yi = grad1 * this.xi + int1;
                  if ((otherSegment.py1 - this.yi) * (this.yi - otherSegment.py2) < -0.00001 || (this.py1 - this.yi) * (this.yi - this.py2) < -0.00001) {
                      return false;
                  }
                  if (Math.abs(a) < 0.00001) {
                      if ((this.px1 - this.xi) * (this.xi - this.px2) < -0.00001) {
                          return false;
                      }
                      return true;
                  }
                  return true;
              }
              if (grad1 === grad2) {
                  if (int1 !== int2) {
                      return false;
                  }
                  if (this.px1 >= Math.min(otherSegment.px1, otherSegment.px2) && this.px1 <= Math.max(otherSegment.py1, otherSegment.py2)) {
                      this.xi = this.px1;
                      this.yi = this.py1;
                      return true;
                  }
                  if (this.px2 >= Math.min(otherSegment.px1, otherSegment.px2) && this.px2 <= Math.max(otherSegment.px1, otherSegment.px2)) {
                      this.xi = this.px2;
                      this.yi = this.py2;
                      return true;
                  }
                  return false;
              }
              this.xi = (int2 - int1) / (grad1 - grad2);
              this.yi = grad1 * this.xi + int1;
              if ((this.px1 - this.xi) * (this.xi - this.px2) < -0.00001 || (otherSegment.px1 - this.xi) * (this.xi - otherSegment.px2) < -0.00001) {
                  return false;
              }
              return true;
          }
      }]);
      return Segment;
  }();

  var HachureIterator = function () {
      function HachureIterator(top, bottom, left, right, gap, sinAngle, cosAngle, tanAngle) {
          classCallCheck(this, HachureIterator);

          this.deltaX = 0;
          this.hGap = 0;
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
              this.sLeft = new Segment([left, bottom], [left, top]);
              this.sRight = new Segment([right, bottom], [right, top]);
          }
      }

      createClass(HachureIterator, [{
          key: 'nextLine',
          value: function nextLine() {
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
                      var s = new Segment([xLower, yLower], [xUpper, yUpper]);
                      if (this.sLeft && s.intersects(this.sLeft)) {
                          xLower = s.xi;
                          yLower = s.yi;
                      }
                      if (this.sRight && s.intersects(this.sRight)) {
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

  function lineLength(line) {
      var p1 = line[0];
      var p2 = line[1];
      return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
  }
  function getIntersectingLines(line, points) {
      var intersections = [];
      var s1 = new Segment([line[0], line[1]], [line[2], line[3]]);
      for (var i = 0; i < points.length; i++) {
          var s2 = new Segment(points[i], points[(i + 1) % points.length]);
          if (s1.intersects(s2)) {
              intersections.push([s1.xi, s1.yi]);
          }
      }
      return intersections;
  }
  function affine(x, y, cx, cy, sinAnglePrime, cosAnglePrime, R) {
      var A = -cx * cosAnglePrime - cy * sinAnglePrime + cx;
      var B = R * (cx * sinAnglePrime - cy * cosAnglePrime) + cy;
      var C = cosAnglePrime;
      var D = sinAnglePrime;
      var E = -R * sinAnglePrime;
      var F = R * cosAnglePrime;
      return [A + C * x + D * y, B + E * x + F * y];
  }
  function hachureLinesForPolygon(points, o) {
      var ret = [];
      if (points && points.length) {
          var left = points[0][0];
          var right = points[0][0];
          var top = points[0][1];
          var bottom = points[0][1];
          for (var i = 1; i < points.length; i++) {
              left = Math.min(left, points[i][0]);
              right = Math.max(right, points[i][0]);
              top = Math.min(top, points[i][1]);
              bottom = Math.max(bottom, points[i][1]);
          }
          var angle = o.hachureAngle;
          var gap = o.hachureGap;
          if (gap < 0) {
              gap = o.strokeWidth * 4;
          }
          gap = Math.max(gap, 0.1);
          var radPerDeg = Math.PI / 180;
          var hachureAngle = angle % 180 * radPerDeg;
          var cosAngle = Math.cos(hachureAngle);
          var sinAngle = Math.sin(hachureAngle);
          var tanAngle = Math.tan(hachureAngle);
          var it = new HachureIterator(top - 1, bottom + 1, left - 1, right + 1, gap, sinAngle, cosAngle, tanAngle);
          var rect = void 0;
          while ((rect = it.nextLine()) != null) {
              var lines = getIntersectingLines(rect, points);
              for (var _i = 0; _i < lines.length; _i++) {
                  if (_i < lines.length - 1) {
                      var p1 = lines[_i];
                      var p2 = lines[_i + 1];
                      ret.push([p1, p2]);
                  }
              }
          }
      }
      return ret;
  }
  function hachureLinesForEllipse(cx, cy, width, height, o, renderer) {
      var ret = [];
      var rx = Math.abs(width / 2);
      var ry = Math.abs(height / 2);
      rx += renderer.getOffset(-rx * 0.05, rx * 0.05, o);
      ry += renderer.getOffset(-ry * 0.05, ry * 0.05, o);
      var angle = o.hachureAngle;
      var gap = o.hachureGap;
      if (gap <= 0) {
          gap = o.strokeWidth * 4;
      }
      var fweight = o.fillWeight;
      if (fweight < 0) {
          fweight = o.strokeWidth / 2;
      }
      var radPerDeg = Math.PI / 180;
      var hachureAngle = angle % 180 * radPerDeg;
      var tanAngle = Math.tan(hachureAngle);
      var aspectRatio = ry / rx;
      var hyp = Math.sqrt(aspectRatio * tanAngle * aspectRatio * tanAngle + 1);
      var sinAnglePrime = aspectRatio * tanAngle / hyp;
      var cosAnglePrime = 1 / hyp;
      var gapPrime = gap / (rx * ry / Math.sqrt(ry * cosAnglePrime * (ry * cosAnglePrime) + rx * sinAnglePrime * (rx * sinAnglePrime)) / rx);
      var halfLen = Math.sqrt(rx * rx - (cx - rx + gapPrime) * (cx - rx + gapPrime));
      for (var xPos = cx - rx + gapPrime; xPos < cx + rx; xPos += gapPrime) {
          halfLen = Math.sqrt(rx * rx - (cx - xPos) * (cx - xPos));
          var p1 = affine(xPos, cy - halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
          var p2 = affine(xPos, cy + halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
          ret.push([p1, p2]);
      }
      return ret;
  }

  var HachureFiller = function () {
      function HachureFiller(renderer) {
          classCallCheck(this, HachureFiller);

          this.renderer = renderer;
      }

      createClass(HachureFiller, [{
          key: 'fillPolygon',
          value: function fillPolygon(points, o) {
              return this._fillPolygon(points, o);
          }
      }, {
          key: 'fillEllipse',
          value: function fillEllipse(cx, cy, width, height, o) {
              return this._fillEllipse(cx, cy, width, height, o);
          }
      }, {
          key: '_fillPolygon',
          value: function _fillPolygon(points, o) {
              var connectEnds = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

              var lines = hachureLinesForPolygon(points, o);
              var ops = this.renderLines(lines, o, connectEnds);
              return { type: 'fillSketch', ops: ops };
          }
      }, {
          key: '_fillEllipse',
          value: function _fillEllipse(cx, cy, width, height, o) {
              var connectEnds = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;

              var lines = hachureLinesForEllipse(cx, cy, width, height, o, this.renderer);
              var ops = this.renderLines(lines, o, connectEnds);
              return { type: 'fillSketch', ops: ops };
          }
      }, {
          key: 'renderLines',
          value: function renderLines(lines, o, connectEnds) {
              var ops = [];
              var prevPoint = null;
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                  for (var _iterator = lines[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var line = _step.value;

                      ops = ops.concat(this.renderer.doubleLine(line[0][0], line[0][1], line[1][0], line[1][1], o));
                      if (connectEnds && prevPoint) {
                          ops = ops.concat(this.renderer.doubleLine(prevPoint[0], prevPoint[1], line[0][0], line[0][1], o));
                      }
                      prevPoint = line[1];
                  }
              } catch (err) {
                  _didIteratorError = true;
                  _iteratorError = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion && _iterator.return) {
                          _iterator.return();
                      }
                  } finally {
                      if (_didIteratorError) {
                          throw _iteratorError;
                      }
                  }
              }

              return ops;
          }
      }]);
      return HachureFiller;
  }();

  var ZigZagFiller = function (_HachureFiller) {
      inherits(ZigZagFiller, _HachureFiller);

      function ZigZagFiller() {
          classCallCheck(this, ZigZagFiller);
          return possibleConstructorReturn(this, (ZigZagFiller.__proto__ || Object.getPrototypeOf(ZigZagFiller)).apply(this, arguments));
      }

      createClass(ZigZagFiller, [{
          key: 'fillPolygon',
          value: function fillPolygon(points, o) {
              return this._fillPolygon(points, o, true);
          }
      }, {
          key: 'fillEllipse',
          value: function fillEllipse(cx, cy, width, height, o) {
              return this._fillEllipse(cx, cy, width, height, o, true);
          }
      }]);
      return ZigZagFiller;
  }(HachureFiller);

  var HatchFiller = function (_HachureFiller) {
      inherits(HatchFiller, _HachureFiller);

      function HatchFiller() {
          classCallCheck(this, HatchFiller);
          return possibleConstructorReturn(this, (HatchFiller.__proto__ || Object.getPrototypeOf(HatchFiller)).apply(this, arguments));
      }

      createClass(HatchFiller, [{
          key: 'fillPolygon',
          value: function fillPolygon(points, o) {
              var set$$1 = this._fillPolygon(points, o);
              var o2 = Object.assign({}, o, { hachureAngle: o.hachureAngle + 90 });
              var set2 = this._fillPolygon(points, o2);
              set$$1.ops = set$$1.ops.concat(set2.ops);
              return set$$1;
          }
      }, {
          key: 'fillEllipse',
          value: function fillEllipse(cx, cy, width, height, o) {
              var set$$1 = this._fillEllipse(cx, cy, width, height, o);
              var o2 = Object.assign({}, o, { hachureAngle: o.hachureAngle + 90 });
              var set2 = this._fillEllipse(cx, cy, width, height, o2);
              set$$1.ops = set$$1.ops.concat(set2.ops);
              return set$$1;
          }
      }]);
      return HatchFiller;
  }(HachureFiller);

  var DotFiller = function () {
      function DotFiller(renderer) {
          classCallCheck(this, DotFiller);

          this.renderer = renderer;
      }

      createClass(DotFiller, [{
          key: 'fillPolygon',
          value: function fillPolygon(points, o) {
              o = Object.assign({}, o, { curveStepCount: 4, hachureAngle: 0 });
              var lines = hachureLinesForPolygon(points, o);
              return this.dotsOnLines(lines, o);
          }
      }, {
          key: 'fillEllipse',
          value: function fillEllipse(cx, cy, width, height, o) {
              o = Object.assign({}, o, { curveStepCount: 4, hachureAngle: 0 });
              var lines = hachureLinesForEllipse(cx, cy, width, height, o, this.renderer);
              return this.dotsOnLines(lines, o);
          }
      }, {
          key: 'dotsOnLines',
          value: function dotsOnLines(lines, o) {
              var ops = [];
              var gap = o.hachureGap;
              if (gap < 0) {
                  gap = o.strokeWidth * 4;
              }
              gap = Math.max(gap, 0.1);
              var fweight = o.fillWeight;
              if (fweight < 0) {
                  fweight = o.strokeWidth / 2;
              }
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                  for (var _iterator = lines[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var line = _step.value;

                      var length = lineLength(line);
                      var dl = length / gap;
                      var count = Math.ceil(dl) - 1;
                      var alpha = Math.atan((line[1][1] - line[0][1]) / (line[1][0] - line[0][0]));
                      for (var i = 0; i < count; i++) {
                          var l = gap * (i + 1);
                          var dy = l * Math.sin(alpha);
                          var dx = l * Math.cos(alpha);
                          var c = [line[0][0] - dx, line[0][1] + dy];
                          var cx = this.renderer.getOffset(c[0] - gap / 4, c[0] + gap / 4, o);
                          var cy = this.renderer.getOffset(c[1] - gap / 4, c[1] + gap / 4, o);
                          var ellipse = this.renderer.ellipse(cx, cy, fweight, fweight, o);
                          ops = ops.concat(ellipse.ops);
                      }
                  }
              } catch (err) {
                  _didIteratorError = true;
                  _iteratorError = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion && _iterator.return) {
                          _iterator.return();
                      }
                  } finally {
                      if (_didIteratorError) {
                          throw _iteratorError;
                      }
                  }
              }

              return { type: 'fillSketch', ops: ops };
          }
      }]);
      return DotFiller;
  }();

  var fillers = {};
  function getFiller(renderer, o) {
      var fillerName = o.fillStyle || 'hachure';
      if (!fillers[fillerName]) {
          switch (fillerName) {
              case 'zigzag':
                  if (!fillers[fillerName]) {
                      fillers[fillerName] = new ZigZagFiller(renderer);
                  }
                  break;
              case 'cross-hatch':
                  if (!fillers[fillerName]) {
                      fillers[fillerName] = new HatchFiller(renderer);
                  }
                  break;
              case 'dots':
                  if (!fillers[fillerName]) {
                      fillers[fillerName] = new DotFiller(renderer);
                  }
                  break;
              case 'hachure':
              default:
                  fillerName = 'hachure';
                  if (!fillers[fillerName]) {
                      fillers[fillerName] = new HachureFiller(renderer);
                  }
                  break;
          }
      }
      return fillers[fillerName];
  }

  var RoughRenderer = function () {
      function RoughRenderer() {
          classCallCheck(this, RoughRenderer);
      }

      createClass(RoughRenderer, [{
          key: 'line',
          value: function line(x1, y1, x2, y2, o) {
              var ops = this.doubleLine(x1, y1, x2, y2, o);
              return { type: 'path', ops: ops };
          }
      }, {
          key: 'linearPath',
          value: function linearPath(points, close, o) {
              var len = (points || []).length;
              if (len > 2) {
                  var ops = [];
                  for (var i = 0; i < len - 1; i++) {
                      ops = ops.concat(this.doubleLine(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], o));
                  }
                  if (close) {
                      ops = ops.concat(this.doubleLine(points[len - 1][0], points[len - 1][1], points[0][0], points[0][1], o));
                  }
                  return { type: 'path', ops: ops };
              } else if (len === 2) {
                  return this.line(points[0][0], points[0][1], points[1][0], points[1][1], o);
              }
              return { type: 'path', ops: [] };
          }
      }, {
          key: 'polygon',
          value: function polygon(points, o) {
              return this.linearPath(points, true, o);
          }
      }, {
          key: 'rectangle',
          value: function rectangle(x, y, width, height, o) {
              var points = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
              return this.polygon(points, o);
          }
      }, {
          key: 'curve',
          value: function curve(points, o) {
              var o1 = this._curveWithOffset(points, 1 * (1 + o.roughness * 0.2), o);
              var o2 = this._curveWithOffset(points, 1.5 * (1 + o.roughness * 0.22), o);
              return { type: 'path', ops: o1.concat(o2) };
          }
      }, {
          key: 'ellipse',
          value: function ellipse(x, y, width, height, o) {
              var increment = Math.PI * 2 / o.curveStepCount;
              var rx = Math.abs(width / 2);
              var ry = Math.abs(height / 2);
              rx += this.getOffset(-rx * 0.05, rx * 0.05, o);
              ry += this.getOffset(-ry * 0.05, ry * 0.05, o);
              var o1 = this._ellipse(increment, x, y, rx, ry, 1, increment * this.getOffset(0.1, this.getOffset(0.4, 1, o), o), o);
              var o2 = this._ellipse(increment, x, y, rx, ry, 1.5, 0, o);
              return { type: 'path', ops: o1.concat(o2) };
          }
      }, {
          key: 'arc',
          value: function arc(x, y, width, height, start, stop, closed, roughClosure, o) {
              var cx = x;
              var cy = y;
              var rx = Math.abs(width / 2);
              var ry = Math.abs(height / 2);
              rx += this.getOffset(-rx * 0.01, rx * 0.01, o);
              ry += this.getOffset(-ry * 0.01, ry * 0.01, o);
              var strt = start;
              var stp = stop;
              while (strt < 0) {
                  strt += Math.PI * 2;
                  stp += Math.PI * 2;
              }
              if (stp - strt > Math.PI * 2) {
                  strt = 0;
                  stp = Math.PI * 2;
              }
              var ellipseInc = Math.PI * 2 / o.curveStepCount;
              var arcInc = Math.min(ellipseInc / 2, (stp - strt) / 2);
              var o1 = this._arc(arcInc, cx, cy, rx, ry, strt, stp, 1, o);
              var o2 = this._arc(arcInc, cx, cy, rx, ry, strt, stp, 1.5, o);
              var ops = o1.concat(o2);
              if (closed) {
                  if (roughClosure) {
                      ops = ops.concat(this.doubleLine(cx, cy, cx + rx * Math.cos(strt), cy + ry * Math.sin(strt), o));
                      ops = ops.concat(this.doubleLine(cx, cy, cx + rx * Math.cos(stp), cy + ry * Math.sin(stp), o));
                  } else {
                      ops.push({ op: 'lineTo', data: [cx, cy] });
                      ops.push({ op: 'lineTo', data: [cx + rx * Math.cos(strt), cy + ry * Math.sin(strt)] });
                  }
              }
              return { type: 'path', ops: ops };
          }
      }, {
          key: 'svgPath',
          value: function svgPath(path, o) {
              path = (path || '').replace(/\n/g, ' ').replace(/(-\s)/g, '-').replace('/(\s\s)/g', ' ');
              var p = new RoughPath(path);
              if (o.simplification) {
                  var fitter = new PathFitter(p.linearPoints, p.closed);
                  var d = fitter.fit(o.simplification);
                  p = new RoughPath(d);
              }
              var ops = [];
              var segments = p.segments || [];
              for (var i = 0; i < segments.length; i++) {
                  var s = segments[i];
                  var prev = i > 0 ? segments[i - 1] : null;
                  var opList = this._processSegment(p, s, prev, o);
                  if (opList && opList.length) {
                      ops = ops.concat(opList);
                  }
              }
              return { type: 'path', ops: ops };
          }
      }, {
          key: 'solidFillPolygon',
          value: function solidFillPolygon(points, o) {
              var ops = [];
              if (points.length) {
                  var offset = o.maxRandomnessOffset || 0;
                  var len = points.length;
                  if (len > 2) {
                      ops.push({ op: 'move', data: [points[0][0] + this.getOffset(-offset, offset, o), points[0][1] + this.getOffset(-offset, offset, o)] });
                      for (var i = 1; i < len; i++) {
                          ops.push({ op: 'lineTo', data: [points[i][0] + this.getOffset(-offset, offset, o), points[i][1] + this.getOffset(-offset, offset, o)] });
                      }
                  }
              }
              return { type: 'fillPath', ops: ops };
          }
      }, {
          key: 'patternFillPolygon',
          value: function patternFillPolygon(points, o) {
              var filler = getFiller(this, o);
              return filler.fillPolygon(points, o);
          }
      }, {
          key: 'patternFillEllipse',
          value: function patternFillEllipse(cx, cy, width, height, o) {
              var filler = getFiller(this, o);
              return filler.fillEllipse(cx, cy, width, height, o);
          }
      }, {
          key: 'patternFillArc',
          value: function patternFillArc(x, y, width, height, start, stop, o) {
              var cx = x;
              var cy = y;
              var rx = Math.abs(width / 2);
              var ry = Math.abs(height / 2);
              rx += this.getOffset(-rx * 0.01, rx * 0.01, o);
              ry += this.getOffset(-ry * 0.01, ry * 0.01, o);
              var strt = start;
              var stp = stop;
              while (strt < 0) {
                  strt += Math.PI * 2;
                  stp += Math.PI * 2;
              }
              if (stp - strt > Math.PI * 2) {
                  strt = 0;
                  stp = Math.PI * 2;
              }
              var increment = (stp - strt) / o.curveStepCount;
              var points = [];
              for (var angle = strt; angle <= stp; angle = angle + increment) {
                  points.push([cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)]);
              }
              points.push([cx + rx * Math.cos(stp), cy + ry * Math.sin(stp)]);
              points.push([cx, cy]);
              return this.patternFillPolygon(points, o);
          }
          /// 

      }, {
          key: 'getOffset',
          value: function getOffset(min, max, ops) {
              return ops.roughness * (Math.random() * (max - min) + min);
          }
      }, {
          key: 'doubleLine',
          value: function doubleLine(x1, y1, x2, y2, o) {
              var o1 = this._line(x1, y1, x2, y2, o, true, false);
              var o2 = this._line(x1, y1, x2, y2, o, true, true);
              return o1.concat(o2);
          }
      }, {
          key: '_line',
          value: function _line(x1, y1, x2, y2, o, move, overlay) {
              var lengthSq = Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
              var offset = o.maxRandomnessOffset || 0;
              if (offset * offset * 100 > lengthSq) {
                  offset = Math.sqrt(lengthSq) / 10;
              }
              var halfOffset = offset / 2;
              var divergePoint = 0.2 + Math.random() * 0.2;
              var midDispX = o.bowing * o.maxRandomnessOffset * (y2 - y1) / 200;
              var midDispY = o.bowing * o.maxRandomnessOffset * (x1 - x2) / 200;
              midDispX = this.getOffset(-midDispX, midDispX, o);
              midDispY = this.getOffset(-midDispY, midDispY, o);
              var ops = [];
              if (move) {
                  if (overlay) {
                      ops.push({
                          op: 'move', data: [x1 + this.getOffset(-halfOffset, halfOffset, o), y1 + this.getOffset(-halfOffset, halfOffset, o)]
                      });
                  } else {
                      ops.push({
                          op: 'move', data: [x1 + this.getOffset(-offset, offset, o), y1 + this.getOffset(-offset, offset, o)]
                      });
                  }
              }
              if (overlay) {
                  ops.push({
                      op: 'bcurveTo', data: [midDispX + x1 + (x2 - x1) * divergePoint + this.getOffset(-halfOffset, halfOffset, o), midDispY + y1 + (y2 - y1) * divergePoint + this.getOffset(-halfOffset, halfOffset, o), midDispX + x1 + 2 * (x2 - x1) * divergePoint + this.getOffset(-halfOffset, halfOffset, o), midDispY + y1 + 2 * (y2 - y1) * divergePoint + this.getOffset(-halfOffset, halfOffset, o), x2 + this.getOffset(-halfOffset, halfOffset, o), y2 + this.getOffset(-halfOffset, halfOffset, o)]
                  });
              } else {
                  ops.push({
                      op: 'bcurveTo', data: [midDispX + x1 + (x2 - x1) * divergePoint + this.getOffset(-offset, offset, o), midDispY + y1 + (y2 - y1) * divergePoint + this.getOffset(-offset, offset, o), midDispX + x1 + 2 * (x2 - x1) * divergePoint + this.getOffset(-offset, offset, o), midDispY + y1 + 2 * (y2 - y1) * divergePoint + this.getOffset(-offset, offset, o), x2 + this.getOffset(-offset, offset, o), y2 + this.getOffset(-offset, offset, o)]
                  });
              }
              return ops;
          }
      }, {
          key: '_curve',
          value: function _curve(points, closePoint, o) {
              var len = points.length;
              var ops = [];
              if (len > 3) {
                  var b = [];
                  var s = 1 - o.curveTightness;
                  ops.push({ op: 'move', data: [points[1][0], points[1][1]] });
                  for (var i = 1; i + 2 < len; i++) {
                      var cachedVertArray = points[i];
                      b[0] = [cachedVertArray[0], cachedVertArray[1]];
                      b[1] = [cachedVertArray[0] + (s * points[i + 1][0] - s * points[i - 1][0]) / 6, cachedVertArray[1] + (s * points[i + 1][1] - s * points[i - 1][1]) / 6];
                      b[2] = [points[i + 1][0] + (s * points[i][0] - s * points[i + 2][0]) / 6, points[i + 1][1] + (s * points[i][1] - s * points[i + 2][1]) / 6];
                      b[3] = [points[i + 1][0], points[i + 1][1]];
                      ops.push({ op: 'bcurveTo', data: [b[1][0], b[1][1], b[2][0], b[2][1], b[3][0], b[3][1]] });
                  }
                  if (closePoint && closePoint.length === 2) {
                      var ro = o.maxRandomnessOffset;
                      ops.push({ op: 'lineTo', data: [closePoint[0] + this.getOffset(-ro, ro, o), closePoint[1] + +this.getOffset(-ro, ro, o)] });
                  }
              } else if (len === 3) {
                  ops.push({ op: 'move', data: [points[1][0], points[1][1]] });
                  ops.push({
                      op: 'bcurveTo', data: [points[1][0], points[1][1], points[2][0], points[2][1], points[2][0], points[2][1]]
                  });
              } else if (len === 2) {
                  ops = ops.concat(this.doubleLine(points[0][0], points[0][1], points[1][0], points[1][1], o));
              }
              return ops;
          }
      }, {
          key: '_ellipse',
          value: function _ellipse(increment, cx, cy, rx, ry, offset, overlap, o) {
              var radOffset = this.getOffset(-0.5, 0.5, o) - Math.PI / 2;
              var points = [];
              points.push([this.getOffset(-offset, offset, o) + cx + 0.9 * rx * Math.cos(radOffset - increment), this.getOffset(-offset, offset, o) + cy + 0.9 * ry * Math.sin(radOffset - increment)]);
              for (var angle = radOffset; angle < Math.PI * 2 + radOffset - 0.01; angle = angle + increment) {
                  points.push([this.getOffset(-offset, offset, o) + cx + rx * Math.cos(angle), this.getOffset(-offset, offset, o) + cy + ry * Math.sin(angle)]);
              }
              points.push([this.getOffset(-offset, offset, o) + cx + rx * Math.cos(radOffset + Math.PI * 2 + overlap * 0.5), this.getOffset(-offset, offset, o) + cy + ry * Math.sin(radOffset + Math.PI * 2 + overlap * 0.5)]);
              points.push([this.getOffset(-offset, offset, o) + cx + 0.98 * rx * Math.cos(radOffset + overlap), this.getOffset(-offset, offset, o) + cy + 0.98 * ry * Math.sin(radOffset + overlap)]);
              points.push([this.getOffset(-offset, offset, o) + cx + 0.9 * rx * Math.cos(radOffset + overlap * 0.5), this.getOffset(-offset, offset, o) + cy + 0.9 * ry * Math.sin(radOffset + overlap * 0.5)]);
              return this._curve(points, null, o);
          }
      }, {
          key: '_curveWithOffset',
          value: function _curveWithOffset(points, offset, o) {
              var ps = [];
              ps.push([points[0][0] + this.getOffset(-offset, offset, o), points[0][1] + this.getOffset(-offset, offset, o)]);
              ps.push([points[0][0] + this.getOffset(-offset, offset, o), points[0][1] + this.getOffset(-offset, offset, o)]);
              for (var i = 1; i < points.length; i++) {
                  ps.push([points[i][0] + this.getOffset(-offset, offset, o), points[i][1] + this.getOffset(-offset, offset, o)]);
                  if (i === points.length - 1) {
                      ps.push([points[i][0] + this.getOffset(-offset, offset, o), points[i][1] + this.getOffset(-offset, offset, o)]);
                  }
              }
              return this._curve(ps, null, o);
          }
      }, {
          key: '_arc',
          value: function _arc(increment, cx, cy, rx, ry, strt, stp, offset, o) {
              var radOffset = strt + this.getOffset(-0.1, 0.1, o);
              var points = [];
              points.push([this.getOffset(-offset, offset, o) + cx + 0.9 * rx * Math.cos(radOffset - increment), this.getOffset(-offset, offset, o) + cy + 0.9 * ry * Math.sin(radOffset - increment)]);
              for (var angle = radOffset; angle <= stp; angle = angle + increment) {
                  points.push([this.getOffset(-offset, offset, o) + cx + rx * Math.cos(angle), this.getOffset(-offset, offset, o) + cy + ry * Math.sin(angle)]);
              }
              points.push([cx + rx * Math.cos(stp), cy + ry * Math.sin(stp)]);
              points.push([cx + rx * Math.cos(stp), cy + ry * Math.sin(stp)]);
              return this._curve(points, null, o);
          }
      }, {
          key: '_bezierTo',
          value: function _bezierTo(x1, y1, x2, y2, x, y, path, o) {
              var ops = [];
              var ros = [o.maxRandomnessOffset || 1, (o.maxRandomnessOffset || 1) + 0.5];
              var f = [0, 0];
              for (var i = 0; i < 2; i++) {
                  if (i === 0) {
                      ops.push({ op: 'move', data: [path.x, path.y] });
                  } else {
                      ops.push({ op: 'move', data: [path.x + this.getOffset(-ros[0], ros[0], o), path.y + this.getOffset(-ros[0], ros[0], o)] });
                  }
                  f = [x + this.getOffset(-ros[i], ros[i], o), y + this.getOffset(-ros[i], ros[i], o)];
                  ops.push({
                      op: 'bcurveTo', data: [x1 + this.getOffset(-ros[i], ros[i], o), y1 + this.getOffset(-ros[i], ros[i], o), x2 + this.getOffset(-ros[i], ros[i], o), y2 + this.getOffset(-ros[i], ros[i], o), f[0], f[1]]
                  });
              }
              path.setPosition(f[0], f[1]);
              return ops;
          }
      }, {
          key: '_processSegment',
          value: function _processSegment(path, seg, prevSeg, o) {
              var ops = [];
              switch (seg.key) {
                  case 'M':
                  case 'm':
                      {
                          var delta = seg.key === 'm';
                          if (seg.data.length >= 2) {
                              var x = +seg.data[0];
                              var y = +seg.data[1];
                              if (delta) {
                                  x += path.x;
                                  y += path.y;
                              }
                              var ro = 1 * (o.maxRandomnessOffset || 0);
                              x = x + this.getOffset(-ro, ro, o);
                              y = y + this.getOffset(-ro, ro, o);
                              path.setPosition(x, y);
                              ops.push({ op: 'move', data: [x, y] });
                          }
                          break;
                      }
                  case 'L':
                  case 'l':
                      {
                          var _delta = seg.key === 'l';
                          if (seg.data.length >= 2) {
                              var _x = +seg.data[0];
                              var _y = +seg.data[1];
                              if (_delta) {
                                  _x += path.x;
                                  _y += path.y;
                              }
                              ops = ops.concat(this.doubleLine(path.x, path.y, _x, _y, o));
                              path.setPosition(_x, _y);
                          }
                          break;
                      }
                  case 'H':
                  case 'h':
                      {
                          var _delta2 = seg.key === 'h';
                          if (seg.data.length) {
                              var _x2 = +seg.data[0];
                              if (_delta2) {
                                  _x2 += path.x;
                              }
                              ops = ops.concat(this.doubleLine(path.x, path.y, _x2, path.y, o));
                              path.setPosition(_x2, path.y);
                          }
                          break;
                      }
                  case 'V':
                  case 'v':
                      {
                          var _delta3 = seg.key === 'v';
                          if (seg.data.length) {
                              var _y2 = +seg.data[0];
                              if (_delta3) {
                                  _y2 += path.y;
                              }
                              ops = ops.concat(this.doubleLine(path.x, path.y, path.x, _y2, o));
                              path.setPosition(path.x, _y2);
                          }
                          break;
                      }
                  case 'Z':
                  case 'z':
                      {
                          if (path.first) {
                              ops = ops.concat(this.doubleLine(path.x, path.y, path.first[0], path.first[1], o));
                              path.setPosition(path.first[0], path.first[1]);
                              path.first = null;
                          }
                          break;
                      }
                  case 'C':
                  case 'c':
                      {
                          var _delta4 = seg.key === 'c';
                          if (seg.data.length >= 6) {
                              var x1 = +seg.data[0];
                              var y1 = +seg.data[1];
                              var x2 = +seg.data[2];
                              var y2 = +seg.data[3];
                              var _x3 = +seg.data[4];
                              var _y3 = +seg.data[5];
                              if (_delta4) {
                                  x1 += path.x;
                                  x2 += path.x;
                                  _x3 += path.x;
                                  y1 += path.y;
                                  y2 += path.y;
                                  _y3 += path.y;
                              }
                              var ob = this._bezierTo(x1, y1, x2, y2, _x3, _y3, path, o);
                              ops = ops.concat(ob);
                              path.bezierReflectionPoint = [_x3 + (_x3 - x2), _y3 + (_y3 - y2)];
                          }
                          break;
                      }
                  case 'S':
                  case 's':
                      {
                          var _delta5 = seg.key === 's';
                          if (seg.data.length >= 4) {
                              var _x4 = +seg.data[0];
                              var _y4 = +seg.data[1];
                              var _x5 = +seg.data[2];
                              var _y5 = +seg.data[3];
                              if (_delta5) {
                                  _x4 += path.x;
                                  _x5 += path.x;
                                  _y4 += path.y;
                                  _y5 += path.y;
                              }
                              var _x6 = _x4;
                              var _y6 = _y4;
                              var prevKey = prevSeg ? prevSeg.key : '';
                              var ref = null;
                              if (prevKey === 'c' || prevKey === 'C' || prevKey === 's' || prevKey === 'S') {
                                  ref = path.bezierReflectionPoint;
                              }
                              if (ref) {
                                  _x6 = ref[0];
                                  _y6 = ref[1];
                              }
                              var _ob = this._bezierTo(_x6, _y6, _x4, _y4, _x5, _y5, path, o);
                              ops = ops.concat(_ob);
                              path.bezierReflectionPoint = [_x5 + (_x5 - _x4), _y5 + (_y5 - _y4)];
                          }
                          break;
                      }
                  case 'Q':
                  case 'q':
                      {
                          var _delta6 = seg.key === 'q';
                          if (seg.data.length >= 4) {
                              var _x7 = +seg.data[0];
                              var _y7 = +seg.data[1];
                              var _x8 = +seg.data[2];
                              var _y8 = +seg.data[3];
                              if (_delta6) {
                                  _x7 += path.x;
                                  _x8 += path.x;
                                  _y7 += path.y;
                                  _y8 += path.y;
                              }
                              var offset1 = 1 * (1 + o.roughness * 0.2);
                              var offset2 = 1.5 * (1 + o.roughness * 0.22);
                              ops.push({ op: 'move', data: [path.x + this.getOffset(-offset1, offset1, o), path.y + this.getOffset(-offset1, offset1, o)] });
                              var f = [_x8 + this.getOffset(-offset1, offset1, o), _y8 + this.getOffset(-offset1, offset1, o)];
                              ops.push({
                                  op: 'qcurveTo', data: [_x7 + this.getOffset(-offset1, offset1, o), _y7 + this.getOffset(-offset1, offset1, o), f[0], f[1]]
                              });
                              ops.push({ op: 'move', data: [path.x + this.getOffset(-offset2, offset2, o), path.y + this.getOffset(-offset2, offset2, o)] });
                              f = [_x8 + this.getOffset(-offset2, offset2, o), _y8 + this.getOffset(-offset2, offset2, o)];
                              ops.push({
                                  op: 'qcurveTo', data: [_x7 + this.getOffset(-offset2, offset2, o), _y7 + this.getOffset(-offset2, offset2, o), f[0], f[1]]
                              });
                              path.setPosition(f[0], f[1]);
                              path.quadReflectionPoint = [_x8 + (_x8 - _x7), _y8 + (_y8 - _y7)];
                          }
                          break;
                      }
                  case 'T':
                  case 't':
                      {
                          var _delta7 = seg.key === 't';
                          if (seg.data.length >= 2) {
                              var _x9 = +seg.data[0];
                              var _y9 = +seg.data[1];
                              if (_delta7) {
                                  _x9 += path.x;
                                  _y9 += path.y;
                              }
                              var _x10 = _x9;
                              var _y10 = _y9;
                              var _prevKey = prevSeg ? prevSeg.key : '';
                              var _ref = null;
                              if (_prevKey === 'q' || _prevKey === 'Q' || _prevKey === 't' || _prevKey === 'T') {
                                  _ref = path.quadReflectionPoint;
                              }
                              if (_ref) {
                                  _x10 = _ref[0];
                                  _y10 = _ref[1];
                              }
                              var _offset = 1 * (1 + o.roughness * 0.2);
                              var _offset2 = 1.5 * (1 + o.roughness * 0.22);
                              ops.push({ op: 'move', data: [path.x + this.getOffset(-_offset, _offset, o), path.y + this.getOffset(-_offset, _offset, o)] });
                              var _f = [_x9 + this.getOffset(-_offset, _offset, o), _y9 + this.getOffset(-_offset, _offset, o)];
                              ops.push({
                                  op: 'qcurveTo', data: [_x10 + this.getOffset(-_offset, _offset, o), _y10 + this.getOffset(-_offset, _offset, o), _f[0], _f[1]]
                              });
                              ops.push({ op: 'move', data: [path.x + this.getOffset(-_offset2, _offset2, o), path.y + this.getOffset(-_offset2, _offset2, o)] });
                              _f = [_x9 + this.getOffset(-_offset2, _offset2, o), _y9 + this.getOffset(-_offset2, _offset2, o)];
                              ops.push({
                                  op: 'qcurveTo', data: [_x10 + this.getOffset(-_offset2, _offset2, o), _y10 + this.getOffset(-_offset2, _offset2, o), _f[0], _f[1]]
                              });
                              path.setPosition(_f[0], _f[1]);
                              path.quadReflectionPoint = [_x9 + (_x9 - _x10), _y9 + (_y9 - _y10)];
                          }
                          break;
                      }
                  case 'A':
                  case 'a':
                      {
                          var _delta8 = seg.key === 'a';
                          if (seg.data.length >= 7) {
                              var rx = +seg.data[0];
                              var ry = +seg.data[1];
                              var angle = +seg.data[2];
                              var largeArcFlag = +seg.data[3];
                              var sweepFlag = +seg.data[4];
                              var _x11 = +seg.data[5];
                              var _y11 = +seg.data[6];
                              if (_delta8) {
                                  _x11 += path.x;
                                  _y11 += path.y;
                              }
                              if (_x11 === path.x && _y11 === path.y) {
                                  break;
                              }
                              if (rx === 0 || ry === 0) {
                                  ops = ops.concat(this.doubleLine(path.x, path.y, _x11, _y11, o));
                                  path.setPosition(_x11, _y11);
                              } else {
                                  for (var i = 0; i < 1; i++) {
                                      var arcConverter = new RoughArcConverter([path.x, path.y], [_x11, _y11], [rx, ry], angle, largeArcFlag ? true : false, sweepFlag ? true : false);
                                      var segment = arcConverter.getNextSegment();
                                      while (segment) {
                                          var _ob2 = this._bezierTo(segment.cp1[0], segment.cp1[1], segment.cp2[0], segment.cp2[1], segment.to[0], segment.to[1], path, o);
                                          ops = ops.concat(_ob2);
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
      }]);
      return RoughRenderer;
  }();

  var hasSelf = typeof self !== 'undefined';
  var roughScript = hasSelf && self && self.document && self.document.currentScript && self.document.currentScript.src;
  function createRenderer(config) {
      if (hasSelf && roughScript && self && self.workly && config.async && !config.noWorker) {
          var worklySource = config.worklyURL || 'https://cdn.jsdelivr.net/gh/pshihn/workly/dist/workly.min.js';
          if (worklySource) {
              var code = 'importScripts(\'' + worklySource + '\', \'' + roughScript + '\');\nworkly.expose(self.rough.createRenderer());';
              var ourl = URL.createObjectURL(new Blob([code]));
              return self.workly.proxy(ourl);
          }
      }
      return new RoughRenderer();
  }

  var hasSelf$1 = typeof self !== 'undefined';
  var RoughGeneratorBase = function () {
      function RoughGeneratorBase(config, surface) {
          classCallCheck(this, RoughGeneratorBase);

          this.defaultOptions = {
              maxRandomnessOffset: 2,
              roughness: 1,
              bowing: 1,
              stroke: '#000',
              strokeWidth: 1,
              curveTightness: 0,
              curveStepCount: 9,
              fillStyle: 'hachure',
              fillWeight: -1,
              hachureAngle: -41,
              hachureGap: -1
          };
          this.config = config || {};
          this.surface = surface;
          this.renderer = createRenderer(this.config);
          if (this.config.options) {
              this.defaultOptions = this._options(this.config.options);
          }
      }

      createClass(RoughGeneratorBase, [{
          key: '_options',
          value: function _options(options) {
              return options ? Object.assign({}, this.defaultOptions, options) : this.defaultOptions;
          }
      }, {
          key: '_drawable',
          value: function _drawable(shape, sets, options) {
              return { shape: shape, sets: sets || [], options: options || this.defaultOptions };
          }
      }, {
          key: 'getCanvasSize',
          value: function getCanvasSize() {
              var val = function val(w) {
                  if (w && (typeof w === 'undefined' ? 'undefined' : _typeof(w)) === 'object') {
                      if (w.baseVal && w.baseVal.value) {
                          return w.baseVal.value;
                      }
                  }
                  return w || 100;
              };
              if (this.surface) {
                  return [val(this.surface.width), val(this.surface.height)];
              }
              return [100, 100];
          }
      }, {
          key: 'computePolygonSize',
          value: function computePolygonSize(points) {
              if (points.length) {
                  var left = points[0][0];
                  var right = points[0][0];
                  var top = points[0][1];
                  var bottom = points[0][1];
                  for (var i = 1; i < points.length; i++) {
                      left = Math.min(left, points[i][0]);
                      right = Math.max(right, points[i][0]);
                      top = Math.min(top, points[i][1]);
                      bottom = Math.max(bottom, points[i][1]);
                  }
                  return [right - left, bottom - top];
              }
              return [0, 0];
          }
      }, {
          key: 'polygonPath',
          value: function polygonPath(points) {
              var d = '';
              if (points.length) {
                  d = 'M' + points[0][0] + ',' + points[0][1];
                  for (var i = 1; i < points.length; i++) {
                      d = d + ' L' + points[i][0] + ',' + points[i][1];
                  }
              }
              return d;
          }
      }, {
          key: 'computePathSize',
          value: function computePathSize(d) {
              var size = [0, 0];
              if (hasSelf$1 && self.document) {
                  try {
                      var ns = 'http://www.w3.org/2000/svg';
                      var svg = self.document.createElementNS(ns, 'svg');
                      svg.setAttribute('width', '0');
                      svg.setAttribute('height', '0');
                      var pathNode = self.document.createElementNS(ns, 'path');
                      pathNode.setAttribute('d', d);
                      svg.appendChild(pathNode);
                      self.document.body.appendChild(svg);
                      var bb = pathNode.getBBox();
                      if (bb) {
                          size[0] = bb.width || 0;
                          size[1] = bb.height || 0;
                      }
                      self.document.body.removeChild(svg);
                  } catch (err) {}
              }
              var canvasSize = this.getCanvasSize();
              if (!(size[0] * size[1])) {
                  size = canvasSize;
              }
              return size;
          }
      }, {
          key: 'toPaths',
          value: function toPaths(drawable) {
              var sets = drawable.sets || [];
              var o = drawable.options || this.defaultOptions;
              var paths = [];
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                  for (var _iterator = sets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var drawing = _step.value;

                      var path = null;
                      switch (drawing.type) {
                          case 'path':
                              path = {
                                  d: this.opsToPath(drawing),
                                  stroke: o.stroke,
                                  strokeWidth: o.strokeWidth,
                                  fill: 'none'
                              };
                              break;
                          case 'fillPath':
                              path = {
                                  d: this.opsToPath(drawing),
                                  stroke: 'none',
                                  strokeWidth: 0,
                                  fill: o.fill || 'none'
                              };
                              break;
                          case 'fillSketch':
                              path = this.fillSketch(drawing, o);
                              break;
                          case 'path2Dfill':
                              path = {
                                  d: drawing.path || '',
                                  stroke: 'none',
                                  strokeWidth: 0,
                                  fill: o.fill || 'none'
                              };
                              break;
                          case 'path2Dpattern':
                              {
                                  var size = drawing.size;
                                  var pattern = {
                                      x: 0, y: 0, width: 1, height: 1,
                                      viewBox: '0 0 ' + Math.round(size[0]) + ' ' + Math.round(size[1]),
                                      patternUnits: 'objectBoundingBox',
                                      path: this.fillSketch(drawing, o)
                                  };
                                  path = {
                                      d: drawing.path,
                                      stroke: 'none',
                                      strokeWidth: 0,
                                      pattern: pattern
                                  };
                                  break;
                              }
                      }
                      if (path) {
                          paths.push(path);
                      }
                  }
              } catch (err) {
                  _didIteratorError = true;
                  _iteratorError = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion && _iterator.return) {
                          _iterator.return();
                      }
                  } finally {
                      if (_didIteratorError) {
                          throw _iteratorError;
                      }
                  }
              }

              return paths;
          }
      }, {
          key: 'fillSketch',
          value: function fillSketch(drawing, o) {
              var fweight = o.fillWeight;
              if (fweight < 0) {
                  fweight = o.strokeWidth / 2;
              }
              return {
                  d: this.opsToPath(drawing),
                  stroke: o.fill || 'none',
                  strokeWidth: fweight,
                  fill: 'none'
              };
          }
      }, {
          key: 'opsToPath',
          value: function opsToPath(drawing) {
              var path = '';
              var _iteratorNormalCompletion2 = true;
              var _didIteratorError2 = false;
              var _iteratorError2 = undefined;

              try {
                  for (var _iterator2 = drawing.ops[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                      var item = _step2.value;

                      var data = item.data;
                      switch (item.op) {
                          case 'move':
                              path += 'M' + data[0] + ' ' + data[1] + ' ';
                              break;
                          case 'bcurveTo':
                              path += 'C' + data[0] + ' ' + data[1] + ', ' + data[2] + ' ' + data[3] + ', ' + data[4] + ' ' + data[5] + ' ';
                              break;
                          case 'qcurveTo':
                              path += 'Q' + data[0] + ' ' + data[1] + ', ' + data[2] + ' ' + data[3] + ' ';
                              break;
                          case 'lineTo':
                              path += 'L' + data[0] + ' ' + data[1] + ' ';
                              break;
                      }
                  }
              } catch (err) {
                  _didIteratorError2 = true;
                  _iteratorError2 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion2 && _iterator2.return) {
                          _iterator2.return();
                      }
                  } finally {
                      if (_didIteratorError2) {
                          throw _iteratorError2;
                      }
                  }
              }

              return path.trim();
          }
      }, {
          key: 'lib',
          get: function get$$1() {
              return this.renderer;
          }
      }]);
      return RoughGeneratorBase;
  }();

  var RoughGenerator = function (_RoughGeneratorBase) {
      inherits(RoughGenerator, _RoughGeneratorBase);

      function RoughGenerator(config, surface) {
          classCallCheck(this, RoughGenerator);
          return possibleConstructorReturn(this, (RoughGenerator.__proto__ || Object.getPrototypeOf(RoughGenerator)).call(this, config, surface));
      }

      createClass(RoughGenerator, [{
          key: 'line',
          value: function line(x1, y1, x2, y2, options) {
              var o = this._options(options);
              return this._drawable('line', [this.lib.line(x1, y1, x2, y2, o)], o);
          }
      }, {
          key: 'rectangle',
          value: function rectangle(x, y, width, height, options) {
              var o = this._options(options);
              var paths = [];
              if (o.fill) {
                  var points = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
                  if (o.fillStyle === 'solid') {
                      paths.push(this.lib.solidFillPolygon(points, o));
                  } else {
                      paths.push(this.lib.patternFillPolygon(points, o));
                  }
              }
              paths.push(this.lib.rectangle(x, y, width, height, o));
              return this._drawable('rectangle', paths, o);
          }
      }, {
          key: 'ellipse',
          value: function ellipse(x, y, width, height, options) {
              var o = this._options(options);
              var paths = [];
              if (o.fill) {
                  if (o.fillStyle === 'solid') {
                      var shape = this.lib.ellipse(x, y, width, height, o);
                      shape.type = 'fillPath';
                      paths.push(shape);
                  } else {
                      paths.push(this.lib.patternFillEllipse(x, y, width, height, o));
                  }
              }
              paths.push(this.lib.ellipse(x, y, width, height, o));
              return this._drawable('ellipse', paths, o);
          }
      }, {
          key: 'circle',
          value: function circle(x, y, diameter, options) {
              var ret = this.ellipse(x, y, diameter, diameter, options);
              ret.shape = 'circle';
              return ret;
          }
      }, {
          key: 'linearPath',
          value: function linearPath(points, options) {
              var o = this._options(options);
              return this._drawable('linearPath', [this.lib.linearPath(points, false, o)], o);
          }
      }, {
          key: 'arc',
          value: function arc(x, y, width, height, start, stop) {
              var closed = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
              var options = arguments[7];

              var o = this._options(options);
              var paths = [];
              if (closed && o.fill) {
                  if (o.fillStyle === 'solid') {
                      var shape = this.lib.arc(x, y, width, height, start, stop, true, false, o);
                      shape.type = 'fillPath';
                      paths.push(shape);
                  } else {
                      paths.push(this.lib.patternFillArc(x, y, width, height, start, stop, o));
                  }
              }
              paths.push(this.lib.arc(x, y, width, height, start, stop, closed, true, o));
              return this._drawable('arc', paths, o);
          }
      }, {
          key: 'curve',
          value: function curve(points, options) {
              var o = this._options(options);
              return this._drawable('curve', [this.lib.curve(points, o)], o);
          }
      }, {
          key: 'polygon',
          value: function polygon(points, options) {
              var o = this._options(options);
              var paths = [];
              if (o.fill) {
                  if (o.fillStyle === 'solid') {
                      paths.push(this.lib.solidFillPolygon(points, o));
                  } else {
                      var size = this.computePolygonSize(points);
                      var fillPoints = [[0, 0], [size[0], 0], [size[0], size[1]], [0, size[1]]];
                      var shape = this.lib.patternFillPolygon(fillPoints, o);
                      shape.type = 'path2Dpattern';
                      shape.size = size;
                      shape.path = this.polygonPath(points);
                      paths.push(shape);
                  }
              }
              paths.push(this.lib.linearPath(points, true, o));
              return this._drawable('polygon', paths, o);
          }
      }, {
          key: 'path',
          value: function path(d, options) {
              var o = this._options(options);
              var paths = [];
              if (!d) {
                  return this._drawable('path', paths, o);
              }
              if (o.fill) {
                  if (o.fillStyle === 'solid') {
                      var shape = { type: 'path2Dfill', path: d, ops: [] };
                      paths.push(shape);
                  } else {
                      var size = this.computePathSize(d);
                      var points = [[0, 0], [size[0], 0], [size[0], size[1]], [0, size[1]]];
                      var _shape = this.lib.patternFillPolygon(points, o);
                      _shape.type = 'path2Dpattern';
                      _shape.size = size;
                      _shape.path = d;
                      paths.push(_shape);
                  }
              }
              paths.push(this.lib.svgPath(d, o));
              return this._drawable('path', paths, o);
          }
      }]);
      return RoughGenerator;
  }(RoughGeneratorBase);

  var hasDocument = typeof document !== 'undefined';
  var RoughCanvasBase = function () {
      function RoughCanvasBase(canvas) {
          classCallCheck(this, RoughCanvasBase);

          this.canvas = canvas;
          this.ctx = this.canvas.getContext('2d');
      }

      createClass(RoughCanvasBase, [{
          key: 'draw',
          value: function draw(drawable) {
              var sets = drawable.sets || [];
              var o = drawable.options || this.getDefaultOptions();
              var ctx = this.ctx;
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                  for (var _iterator = sets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var drawing = _step.value;

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
                              ctx.fillStyle = o.fill || '';
                              this._drawToContext(ctx, drawing);
                              ctx.restore();
                              break;
                          case 'fillSketch':
                              this.fillSketch(ctx, drawing, o);
                              break;
                          case 'path2Dfill':
                              {
                                  this.ctx.save();
                                  this.ctx.fillStyle = o.fill || '';
                                  var p2d = new Path2D(drawing.path);
                                  this.ctx.fill(p2d);
                                  this.ctx.restore();
                                  break;
                              }
                          case 'path2Dpattern':
                              {
                                  var doc = this.canvas.ownerDocument || hasDocument && document;
                                  if (doc) {
                                      var size = drawing.size;
                                      var hcanvas = doc.createElement('canvas');
                                      var hcontext = hcanvas.getContext('2d');
                                      var bbox = this.computeBBox(drawing.path);
                                      if (bbox && (bbox.width || bbox.height)) {
                                          hcanvas.width = this.canvas.width;
                                          hcanvas.height = this.canvas.height;
                                          hcontext.translate(bbox.x || 0, bbox.y || 0);
                                      } else {
                                          hcanvas.width = size[0];
                                          hcanvas.height = size[1];
                                      }
                                      this.fillSketch(hcontext, drawing, o);
                                      this.ctx.save();
                                      this.ctx.fillStyle = this.ctx.createPattern(hcanvas, 'repeat');
                                      var _p2d = new Path2D(drawing.path);
                                      this.ctx.fill(_p2d);
                                      this.ctx.restore();
                                  } else {
                                      console.error('Cannot render path2Dpattern. No defs/document defined.');
                                  }
                                  break;
                              }
                      }
                  }
              } catch (err) {
                  _didIteratorError = true;
                  _iteratorError = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion && _iterator.return) {
                          _iterator.return();
                      }
                  } finally {
                      if (_didIteratorError) {
                          throw _iteratorError;
                      }
                  }
              }
          }
      }, {
          key: 'computeBBox',
          value: function computeBBox(d) {
              if (hasDocument) {
                  try {
                      var ns = 'http://www.w3.org/2000/svg';
                      var svg = document.createElementNS(ns, 'svg');
                      svg.setAttribute('width', '0');
                      svg.setAttribute('height', '0');
                      var pathNode = self.document.createElementNS(ns, 'path');
                      pathNode.setAttribute('d', d);
                      svg.appendChild(pathNode);
                      document.body.appendChild(svg);
                      var bbox = pathNode.getBBox();
                      document.body.removeChild(svg);
                      return bbox;
                  } catch (err) {}
              }
              return null;
          }
      }, {
          key: 'fillSketch',
          value: function fillSketch(ctx, drawing, o) {
              var fweight = o.fillWeight;
              if (fweight < 0) {
                  fweight = o.strokeWidth / 2;
              }
              ctx.save();
              ctx.strokeStyle = o.fill || '';
              ctx.lineWidth = fweight;
              this._drawToContext(ctx, drawing);
              ctx.restore();
          }
      }, {
          key: '_drawToContext',
          value: function _drawToContext(ctx, drawing) {
              ctx.beginPath();
              var _iteratorNormalCompletion2 = true;
              var _didIteratorError2 = false;
              var _iteratorError2 = undefined;

              try {
                  for (var _iterator2 = drawing.ops[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                      var item = _step2.value;

                      var data = item.data;
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
              } catch (err) {
                  _didIteratorError2 = true;
                  _iteratorError2 = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion2 && _iterator2.return) {
                          _iterator2.return();
                      }
                  } finally {
                      if (_didIteratorError2) {
                          throw _iteratorError2;
                      }
                  }
              }

              if (drawing.type === 'fillPath') {
                  ctx.fill();
              } else {
                  ctx.stroke();
              }
          }
      }], [{
          key: 'createRenderer',
          value: function createRenderer() {
              return new RoughRenderer();
          }
      }]);
      return RoughCanvasBase;
  }();

  var RoughCanvas = function (_RoughCanvasBase) {
      inherits(RoughCanvas, _RoughCanvasBase);

      function RoughCanvas(canvas, config) {
          classCallCheck(this, RoughCanvas);

          var _this = possibleConstructorReturn(this, (RoughCanvas.__proto__ || Object.getPrototypeOf(RoughCanvas)).call(this, canvas));

          _this.gen = new RoughGenerator(config || null, _this.canvas);
          return _this;
      }

      createClass(RoughCanvas, [{
          key: 'getDefaultOptions',
          value: function getDefaultOptions() {
              return this.gen.defaultOptions;
          }
      }, {
          key: 'line',
          value: function line(x1, y1, x2, y2, options) {
              var d = this.gen.line(x1, y1, x2, y2, options);
              this.draw(d);
              return d;
          }
      }, {
          key: 'rectangle',
          value: function rectangle(x, y, width, height, options) {
              var d = this.gen.rectangle(x, y, width, height, options);
              this.draw(d);
              return d;
          }
      }, {
          key: 'ellipse',
          value: function ellipse(x, y, width, height, options) {
              var d = this.gen.ellipse(x, y, width, height, options);
              this.draw(d);
              return d;
          }
      }, {
          key: 'circle',
          value: function circle(x, y, diameter, options) {
              var d = this.gen.circle(x, y, diameter, options);
              this.draw(d);
              return d;
          }
      }, {
          key: 'linearPath',
          value: function linearPath(points, options) {
              var d = this.gen.linearPath(points, options);
              this.draw(d);
              return d;
          }
      }, {
          key: 'polygon',
          value: function polygon(points, options) {
              var d = this.gen.polygon(points, options);
              this.draw(d);
              return d;
          }
      }, {
          key: 'arc',
          value: function arc(x, y, width, height, start, stop) {
              var closed = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
              var options = arguments[7];

              var d = this.gen.arc(x, y, width, height, start, stop, closed, options);
              this.draw(d);
              return d;
          }
      }, {
          key: 'curve',
          value: function curve(points, options) {
              var d = this.gen.curve(points, options);
              this.draw(d);
              return d;
          }
      }, {
          key: 'path',
          value: function path(d, options) {
              var drawing = this.gen.path(d, options);
              this.draw(drawing);
              return drawing;
          }
      }, {
          key: 'generator',
          get: function get$$1() {
              return this.gen;
          }
      }]);
      return RoughCanvas;
  }(RoughCanvasBase);

  var RoughGeneratorAsync = function (_RoughGeneratorBase) {
      inherits(RoughGeneratorAsync, _RoughGeneratorBase);

      function RoughGeneratorAsync() {
          classCallCheck(this, RoughGeneratorAsync);
          return possibleConstructorReturn(this, (RoughGeneratorAsync.__proto__ || Object.getPrototypeOf(RoughGeneratorAsync)).apply(this, arguments));
      }

      createClass(RoughGeneratorAsync, [{
          key: 'line',
          value: async function line(x1, y1, x2, y2, options) {
              var o = this._options(options);
              return this._drawable('line', [await this.lib.line(x1, y1, x2, y2, o)], o);
          }
      }, {
          key: 'rectangle',
          value: async function rectangle(x, y, width, height, options) {
              var o = this._options(options);
              var paths = [];
              if (o.fill) {
                  var points = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
                  if (o.fillStyle === 'solid') {
                      paths.push((await this.lib.solidFillPolygon(points, o)));
                  } else {
                      paths.push((await this.lib.patternFillPolygon(points, o)));
                  }
              }
              paths.push((await this.lib.rectangle(x, y, width, height, o)));
              return this._drawable('rectangle', paths, o);
          }
      }, {
          key: 'ellipse',
          value: async function ellipse(x, y, width, height, options) {
              var o = this._options(options);
              var paths = [];
              if (o.fill) {
                  if (o.fillStyle === 'solid') {
                      var shape = await this.lib.ellipse(x, y, width, height, o);
                      shape.type = 'fillPath';
                      paths.push(shape);
                  } else {
                      paths.push((await this.lib.patternFillEllipse(x, y, width, height, o)));
                  }
              }
              paths.push((await this.lib.ellipse(x, y, width, height, o)));
              return this._drawable('ellipse', paths, o);
          }
      }, {
          key: 'circle',
          value: async function circle(x, y, diameter, options) {
              var ret = await this.ellipse(x, y, diameter, diameter, options);
              ret.shape = 'circle';
              return ret;
          }
      }, {
          key: 'linearPath',
          value: async function linearPath(points, options) {
              var o = this._options(options);
              return this._drawable('linearPath', [await this.lib.linearPath(points, false, o)], o);
          }
      }, {
          key: 'arc',
          value: async function arc(x, y, width, height, start, stop) {
              var closed = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
              var options = arguments[7];

              var o = this._options(options);
              var paths = [];
              if (closed && o.fill) {
                  if (o.fillStyle === 'solid') {
                      var shape = await this.lib.arc(x, y, width, height, start, stop, true, false, o);
                      shape.type = 'fillPath';
                      paths.push(shape);
                  } else {
                      paths.push((await this.lib.patternFillArc(x, y, width, height, start, stop, o)));
                  }
              }
              paths.push((await this.lib.arc(x, y, width, height, start, stop, closed, true, o)));
              return this._drawable('arc', paths, o);
          }
      }, {
          key: 'curve',
          value: async function curve(points, options) {
              var o = this._options(options);
              return this._drawable('curve', [await this.lib.curve(points, o)], o);
          }
      }, {
          key: 'polygon',
          value: async function polygon(points, options) {
              var o = this._options(options);
              var paths = [];
              if (o.fill) {
                  if (o.fillStyle === 'solid') {
                      paths.push((await this.lib.solidFillPolygon(points, o)));
                  } else {
                      var size = this.computePolygonSize(points);
                      var fillPoints = [[0, 0], [size[0], 0], [size[0], size[1]], [0, size[1]]];
                      var shape = await this.lib.patternFillPolygon(fillPoints, o);
                      shape.type = 'path2Dpattern';
                      shape.size = size;
                      shape.path = this.polygonPath(points);
                      paths.push(shape);
                  }
              }
              paths.push((await this.lib.linearPath(points, true, o)));
              return this._drawable('polygon', paths, o);
          }
      }, {
          key: 'path',
          value: async function path(d, options) {
              var o = this._options(options);
              var paths = [];
              if (!d) {
                  return this._drawable('path', paths, o);
              }
              if (o.fill) {
                  if (o.fillStyle === 'solid') {
                      var shape = { type: 'path2Dfill', path: d, ops: [] };
                      paths.push(shape);
                  } else {
                      var size = this.computePathSize(d);
                      var points = [[0, 0], [size[0], 0], [size[0], size[1]], [0, size[1]]];
                      var _shape = await this.lib.patternFillPolygon(points, o);
                      _shape.type = 'path2Dpattern';
                      _shape.size = size;
                      _shape.path = d;
                      paths.push(_shape);
                  }
              }
              paths.push((await this.lib.svgPath(d, o)));
              return this._drawable('path', paths, o);
          }
      }]);
      return RoughGeneratorAsync;
  }(RoughGeneratorBase);

  var RoughCanvasAsync = function (_RoughCanvasBase) {
      inherits(RoughCanvasAsync, _RoughCanvasBase);

      function RoughCanvasAsync(canvas, config) {
          classCallCheck(this, RoughCanvasAsync);

          var _this = possibleConstructorReturn(this, (RoughCanvasAsync.__proto__ || Object.getPrototypeOf(RoughCanvasAsync)).call(this, canvas));

          _this.genAsync = new RoughGeneratorAsync(config || null, _this.canvas);
          return _this;
      }

      createClass(RoughCanvasAsync, [{
          key: 'getDefaultOptions',
          value: function getDefaultOptions() {
              return this.genAsync.defaultOptions;
          }
      }, {
          key: 'line',
          value: async function line(x1, y1, x2, y2, options) {
              var d = await this.genAsync.line(x1, y1, x2, y2, options);
              this.draw(d);
              return d;
          }
      }, {
          key: 'rectangle',
          value: async function rectangle(x, y, width, height, options) {
              var d = await this.genAsync.rectangle(x, y, width, height, options);
              this.draw(d);
              return d;
          }
      }, {
          key: 'ellipse',
          value: async function ellipse(x, y, width, height, options) {
              var d = await this.genAsync.ellipse(x, y, width, height, options);
              this.draw(d);
              return d;
          }
      }, {
          key: 'circle',
          value: async function circle(x, y, diameter, options) {
              var d = await this.genAsync.circle(x, y, diameter, options);
              this.draw(d);
              return d;
          }
      }, {
          key: 'linearPath',
          value: async function linearPath(points, options) {
              var d = await this.genAsync.linearPath(points, options);
              this.draw(d);
              return d;
          }
      }, {
          key: 'polygon',
          value: async function polygon(points, options) {
              var d = await this.genAsync.polygon(points, options);
              this.draw(d);
              return d;
          }
      }, {
          key: 'arc',
          value: async function arc(x, y, width, height, start, stop) {
              var closed = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
              var options = arguments[7];

              var d = await this.genAsync.arc(x, y, width, height, start, stop, closed, options);
              this.draw(d);
              return d;
          }
      }, {
          key: 'curve',
          value: async function curve(points, options) {
              var d = await this.genAsync.curve(points, options);
              this.draw(d);
              return d;
          }
      }, {
          key: 'path',
          value: async function path(d, options) {
              var drawing = await this.genAsync.path(d, options);
              this.draw(drawing);
              return drawing;
          }
      }, {
          key: 'generator',
          get: function get$$1() {
              return this.genAsync;
          }
      }]);
      return RoughCanvasAsync;
  }(RoughCanvasBase);

  var hasDocument$1 = typeof document !== 'undefined';
  var RoughSVGBase = function () {
      function RoughSVGBase(svg) {
          classCallCheck(this, RoughSVGBase);

          this.svg = svg;
      }

      createClass(RoughSVGBase, [{
          key: 'draw',
          value: function draw(drawable) {
              var sets = drawable.sets || [];
              var o = drawable.options || this.getDefaultOptions();
              var doc = this.svg.ownerDocument || hasDocument$1 && document;
              var g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                  for (var _iterator = sets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var drawing = _step.value;

                      var path = null;
                      switch (drawing.type) {
                          case 'path':
                              {
                                  path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
                                  path.setAttribute('d', this.opsToPath(drawing));
                                  path.style.stroke = o.stroke;
                                  path.style.strokeWidth = o.strokeWidth + '';
                                  path.style.fill = 'none';
                                  break;
                              }
                          case 'fillPath':
                              {
                                  path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
                                  path.setAttribute('d', this.opsToPath(drawing));
                                  path.style.stroke = 'none';
                                  path.style.strokeWidth = '0';
                                  path.style.fill = o.fill || null;
                                  break;
                              }
                          case 'fillSketch':
                              {
                                  path = this.fillSketch(doc, drawing, o);
                                  break;
                              }
                          case 'path2Dfill':
                              {
                                  path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
                                  path.setAttribute('d', drawing.path || '');
                                  path.style.stroke = 'none';
                                  path.style.strokeWidth = '0';
                                  path.style.fill = o.fill || null;
                                  break;
                              }
                          case 'path2Dpattern':
                              {
                                  if (!this.defs) {
                                      console.error('Cannot render path2Dpattern. No defs/document defined.');
                                  } else {
                                      var size = drawing.size;
                                      var pattern = doc.createElementNS('http://www.w3.org/2000/svg', 'pattern');
                                      var id = 'rough-' + Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER || 999999));
                                      pattern.setAttribute('id', id);
                                      pattern.setAttribute('x', '0');
                                      pattern.setAttribute('y', '0');
                                      pattern.setAttribute('width', '1');
                                      pattern.setAttribute('height', '1');
                                      pattern.setAttribute('height', '1');
                                      pattern.setAttribute('viewBox', '0 0 ' + Math.round(size[0]) + ' ' + Math.round(size[1]));
                                      pattern.setAttribute('patternUnits', 'objectBoundingBox');
                                      var patternPath = this.fillSketch(doc, drawing, o);
                                      pattern.appendChild(patternPath);
                                      this.defs.appendChild(pattern);
                                      path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
                                      path.setAttribute('d', drawing.path || '');
                                      path.style.stroke = 'none';
                                      path.style.strokeWidth = '0';
                                      path.style.fill = 'url(#' + id + ')';
                                  }
                                  break;
                              }
                      }
                      if (path) {
                          g.appendChild(path);
                      }
                  }
              } catch (err) {
                  _didIteratorError = true;
                  _iteratorError = err;
              } finally {
                  try {
                      if (!_iteratorNormalCompletion && _iterator.return) {
                          _iterator.return();
                      }
                  } finally {
                      if (_didIteratorError) {
                          throw _iteratorError;
                      }
                  }
              }

              return g;
          }
      }, {
          key: 'fillSketch',
          value: function fillSketch(doc, drawing, o) {
              var fweight = o.fillWeight;
              if (fweight < 0) {
                  fweight = o.strokeWidth / 2;
              }
              var path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
              path.setAttribute('d', this.opsToPath(drawing));
              path.style.stroke = o.fill || null;
              path.style.strokeWidth = fweight + '';
              path.style.fill = 'none';
              return path;
          }
      }, {
          key: 'defs',
          get: function get$$1() {
              var doc = this.svg.ownerDocument || hasDocument$1 && document;
              if (doc) {
                  if (!this._defs) {
                      var dnode = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
                      if (this.svg.firstChild) {
                          this.svg.insertBefore(dnode, this.svg.firstChild);
                      } else {
                          this.svg.appendChild(dnode);
                      }
                      this._defs = dnode;
                  }
              }
              return this._defs || null;
          }
      }], [{
          key: 'createRenderer',
          value: function createRenderer() {
              return new RoughRenderer();
          }
      }]);
      return RoughSVGBase;
  }();

  var RoughSVG = function (_RoughSVGBase) {
      inherits(RoughSVG, _RoughSVGBase);

      function RoughSVG(svg, config) {
          classCallCheck(this, RoughSVG);

          var _this = possibleConstructorReturn(this, (RoughSVG.__proto__ || Object.getPrototypeOf(RoughSVG)).call(this, svg));

          _this.gen = new RoughGenerator(config || null, _this.svg);
          return _this;
      }

      createClass(RoughSVG, [{
          key: 'getDefaultOptions',
          value: function getDefaultOptions() {
              return this.gen.defaultOptions;
          }
      }, {
          key: 'opsToPath',
          value: function opsToPath(drawing) {
              return this.gen.opsToPath(drawing);
          }
      }, {
          key: 'line',
          value: function line(x1, y1, x2, y2, options) {
              var d = this.gen.line(x1, y1, x2, y2, options);
              return this.draw(d);
          }
      }, {
          key: 'rectangle',
          value: function rectangle(x, y, width, height, options) {
              var d = this.gen.rectangle(x, y, width, height, options);
              return this.draw(d);
          }
      }, {
          key: 'ellipse',
          value: function ellipse(x, y, width, height, options) {
              var d = this.gen.ellipse(x, y, width, height, options);
              return this.draw(d);
          }
      }, {
          key: 'circle',
          value: function circle(x, y, diameter, options) {
              var d = this.gen.circle(x, y, diameter, options);
              return this.draw(d);
          }
      }, {
          key: 'linearPath',
          value: function linearPath(points, options) {
              var d = this.gen.linearPath(points, options);
              return this.draw(d);
          }
      }, {
          key: 'polygon',
          value: function polygon(points, options) {
              var d = this.gen.polygon(points, options);
              return this.draw(d);
          }
      }, {
          key: 'arc',
          value: function arc(x, y, width, height, start, stop) {
              var closed = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
              var options = arguments[7];

              var d = this.gen.arc(x, y, width, height, start, stop, closed, options);
              return this.draw(d);
          }
      }, {
          key: 'curve',
          value: function curve(points, options) {
              var d = this.gen.curve(points, options);
              return this.draw(d);
          }
      }, {
          key: 'path',
          value: function path(d, options) {
              var drawing = this.gen.path(d, options);
              return this.draw(drawing);
          }
      }, {
          key: 'generator',
          get: function get$$1() {
              return this.gen;
          }
      }]);
      return RoughSVG;
  }(RoughSVGBase);

  var RoughSVGAsync = function (_RoughSVGBase) {
      inherits(RoughSVGAsync, _RoughSVGBase);

      function RoughSVGAsync(svg, config) {
          classCallCheck(this, RoughSVGAsync);

          var _this = possibleConstructorReturn(this, (RoughSVGAsync.__proto__ || Object.getPrototypeOf(RoughSVGAsync)).call(this, svg));

          _this.genAsync = new RoughGeneratorAsync(config || null, _this.svg);
          return _this;
      }

      createClass(RoughSVGAsync, [{
          key: 'getDefaultOptions',
          value: function getDefaultOptions() {
              return this.genAsync.defaultOptions;
          }
      }, {
          key: 'opsToPath',
          value: function opsToPath(drawing) {
              return this.genAsync.opsToPath(drawing);
          }
      }, {
          key: 'line',
          value: async function line(x1, y1, x2, y2, options) {
              var d = await this.genAsync.line(x1, y1, x2, y2, options);
              return this.draw(d);
          }
      }, {
          key: 'rectangle',
          value: async function rectangle(x, y, width, height, options) {
              var d = await this.genAsync.rectangle(x, y, width, height, options);
              return this.draw(d);
          }
      }, {
          key: 'ellipse',
          value: async function ellipse(x, y, width, height, options) {
              var d = await this.genAsync.ellipse(x, y, width, height, options);
              return this.draw(d);
          }
      }, {
          key: 'circle',
          value: async function circle(x, y, diameter, options) {
              var d = await this.genAsync.circle(x, y, diameter, options);
              return this.draw(d);
          }
      }, {
          key: 'linearPath',
          value: async function linearPath(points, options) {
              var d = await this.genAsync.linearPath(points, options);
              return this.draw(d);
          }
      }, {
          key: 'polygon',
          value: async function polygon(points, options) {
              var d = await this.genAsync.polygon(points, options);
              return this.draw(d);
          }
      }, {
          key: 'arc',
          value: async function arc(x, y, width, height, start, stop) {
              var closed = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
              var options = arguments[7];

              var d = await this.genAsync.arc(x, y, width, height, start, stop, closed, options);
              return this.draw(d);
          }
      }, {
          key: 'curve',
          value: async function curve(points, options) {
              var d = await this.genAsync.curve(points, options);
              return this.draw(d);
          }
      }, {
          key: 'path',
          value: async function path(d, options) {
              var drawing = await this.genAsync.path(d, options);
              return this.draw(drawing);
          }
      }, {
          key: 'generator',
          get: function get$$1() {
              return this.genAsync;
          }
      }]);
      return RoughSVGAsync;
  }(RoughSVGBase);

  var rough = {
      canvas: function canvas(_canvas, config) {
          if (config && config.async) {
              return new RoughCanvasAsync(_canvas, config);
          }
          return new RoughCanvas(_canvas, config);
      },
      svg: function svg(_svg, config) {
          if (config && config.async) {
              return new RoughSVGAsync(_svg, config);
          }
          return new RoughSVG(_svg, config);
      },
      createRenderer: function createRenderer() {
          return RoughCanvas.createRenderer();
      },
      generator: function generator(config, surface) {
          if (config && config.async) {
              return new RoughGeneratorAsync(config, surface);
          }
          return new RoughGenerator(config, surface);
      }
  };

  return rough;

}());
