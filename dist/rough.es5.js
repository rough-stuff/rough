var rough = (function () {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

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
    var ParsedPath = /** @class */ (function () {
        function ParsedPath(d) {
            this.COMMAND = 0;
            this.NUMBER = 1;
            this.EOD = 2;
            this.segments = [];
            this.parseData(d);
            this.processPoints();
        }
        ParsedPath.prototype.tokenize = function (d) {
            var tokens = new Array();
            while (d !== '') {
                if (d.match(/^([ \t\r\n,]+)/)) {
                    d = d.substr(RegExp.$1.length);
                }
                else if (d.match(/^([aAcChHlLmMqQsStTvVzZ])/)) {
                    tokens[tokens.length] = { type: this.COMMAND, text: RegExp.$1 };
                    d = d.substr(RegExp.$1.length);
                }
                else if (d.match(/^(([-+]?[0-9]+(\.[0-9]*)?|[-+]?\.[0-9]+)([eE][-+]?[0-9]+)?)/)) {
                    tokens[tokens.length] = { type: this.NUMBER, text: "" + parseFloat(RegExp.$1) };
                    d = d.substr(RegExp.$1.length);
                }
                else {
                    console.error('Unrecognized segment command: ' + d);
                    return [];
                }
            }
            tokens[tokens.length] = { type: this.EOD, text: '' };
            return tokens;
        };
        ParsedPath.prototype.parseData = function (d) {
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
                    }
                    else {
                        this.parseData('M0,0' + d);
                        return;
                    }
                }
                else {
                    if (isType(token, this.NUMBER)) {
                        param_length = PARAMS[mode];
                    }
                    else {
                        index++;
                        param_length = PARAMS[token.text];
                        mode = token.text;
                    }
                }
                if ((index + param_length) < tokens.length) {
                    for (var i = index; i < index + param_length; i++) {
                        var numbeToken = tokens[i];
                        if (isType(numbeToken, this.NUMBER)) {
                            params[params.length] = +numbeToken.text;
                        }
                        else {
                            console.error('Parameter type is not a number: ' + mode + ',' + numbeToken.text);
                            return;
                        }
                    }
                    if (typeof PARAMS[mode] === 'number') {
                        var segment = { key: mode, data: params };
                        this.segments.push(segment);
                        index += param_length;
                        token = tokens[index];
                        if (mode === 'M')
                            mode = 'L';
                        if (mode === 'm')
                            mode = 'l';
                    }
                    else {
                        console.error('Unsupported segment type: ' + mode);
                        return;
                    }
                }
                else {
                    console.error('Path data ended before all parameters were found');
                }
            }
        };
        Object.defineProperty(ParsedPath.prototype, "closed", {
            get: function () {
                if (typeof this._closed === 'undefined') {
                    this._closed = false;
                    for (var _i = 0, _a = this.segments; _i < _a.length; _i++) {
                        var s = _a[_i];
                        if (s.key.toLowerCase() === 'z') {
                            this._closed = true;
                        }
                    }
                }
                return this._closed;
            },
            enumerable: true,
            configurable: true
        });
        ParsedPath.prototype.processPoints = function () {
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
        };
        return ParsedPath;
    }());
    var RoughPath = /** @class */ (function () {
        function RoughPath(d) {
            this._position = [0, 0];
            this._first = null;
            this.bezierReflectionPoint = null;
            this.quadReflectionPoint = null;
            this.parsed = new ParsedPath(d);
        }
        Object.defineProperty(RoughPath.prototype, "segments", {
            get: function () {
                return this.parsed.segments;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RoughPath.prototype, "closed", {
            get: function () {
                return this.parsed.closed;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RoughPath.prototype, "linearPoints", {
            get: function () {
                if (!this._linearPoints) {
                    var lp = [];
                    var points = [];
                    for (var _i = 0, _a = this.parsed.segments; _i < _a.length; _i++) {
                        var s = _a[_i];
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
                    if (points.length) {
                        lp.push(points);
                        points = [];
                    }
                    this._linearPoints = lp;
                }
                return this._linearPoints;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RoughPath.prototype, "first", {
            get: function () {
                return this._first;
            },
            set: function (v) {
                this._first = v;
            },
            enumerable: true,
            configurable: true
        });
        RoughPath.prototype.setPosition = function (x, y) {
            this._position = [x, y];
            if (!this._first) {
                this._first = [x, y];
            }
        };
        Object.defineProperty(RoughPath.prototype, "position", {
            get: function () {
                return this._position;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RoughPath.prototype, "x", {
            get: function () {
                return this._position[0];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RoughPath.prototype, "y", {
            get: function () {
                return this._position[1];
            },
            enumerable: true,
            configurable: true
        });
        return RoughPath;
    }());
    // Algorithm as described in https://www.w3.org/TR/SVG/implnote.html
    // Code adapted from nsSVGPathDataParser.cpp in Mozilla 
    // https://hg.mozilla.org/mozilla-central/file/17156fbebbc8/content/svg/content/src/nsSVGPathDataParser.cpp#l887
    var RoughArcConverter = /** @class */ (function () {
        function RoughArcConverter(from, to, radii, angle, largeArcFlag, sweepFlag) {
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
                var s = Math.sqrt(1 - (numerator / (this._rx * this._rx * this._ry * this._ry)));
                this._rx = this._rx * s;
                this._ry = this._ry * s;
                root = 0;
            }
            else {
                root = (largeArcFlag === sweepFlag ? -1.0 : 1.0) *
                    Math.sqrt(numerator / (this._rx * this._rx * y1dash * y1dash + this._ry * this._ry * x1dash * x1dash));
            }
            var cxdash = root * this._rx * y1dash / this._ry;
            var cydash = -root * this._ry * x1dash / this._rx;
            this._C = [0, 0];
            this._C[0] = this._cosPhi * cxdash - this._sinPhi * cydash + (from[0] + to[0]) / 2.0;
            this._C[1] = this._sinPhi * cxdash + this._cosPhi * cydash + (from[1] + to[1]) / 2.0;
            this._theta = this.calculateVectorAngle(1.0, 0.0, (x1dash - cxdash) / this._rx, (y1dash - cydash) / this._ry);
            var dtheta = this.calculateVectorAngle((x1dash - cxdash) / this._rx, (y1dash - cydash) / this._ry, (-x1dash - cxdash) / this._rx, (-y1dash - cydash) / this._ry);
            if ((!sweepFlag) && (dtheta > 0)) {
                dtheta -= 2 * Math.PI;
            }
            else if (sweepFlag && (dtheta < 0)) {
                dtheta += 2 * Math.PI;
            }
            this._numSegs = Math.ceil(Math.abs(dtheta / (Math.PI / 2)));
            this._delta = dtheta / this._numSegs;
            this._T = (8 / 3) * Math.sin(this._delta / 4) * Math.sin(this._delta / 4) / Math.sin(this._delta / 2);
        }
        RoughArcConverter.prototype.getNextSegment = function () {
            if (this._segIndex === this._numSegs) {
                return null;
            }
            var cosTheta1 = Math.cos(this._theta);
            var sinTheta1 = Math.sin(this._theta);
            var theta2 = this._theta + this._delta;
            var cosTheta2 = Math.cos(theta2);
            var sinTheta2 = Math.sin(theta2);
            var to = [
                this._cosPhi * this._rx * cosTheta2 - this._sinPhi * this._ry * sinTheta2 + this._C[0],
                this._sinPhi * this._rx * cosTheta2 + this._cosPhi * this._ry * sinTheta2 + this._C[1]
            ];
            var cp1 = [
                this._from[0] + this._T * (-this._cosPhi * this._rx * sinTheta1 - this._sinPhi * this._ry * cosTheta1),
                this._from[1] + this._T * (-this._sinPhi * this._rx * sinTheta1 + this._cosPhi * this._ry * cosTheta1)
            ];
            var cp2 = [
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
        };
        RoughArcConverter.prototype.calculateVectorAngle = function (ux, uy, vx, vy) {
            var ta = Math.atan2(uy, ux);
            var tb = Math.atan2(vy, vx);
            if (tb >= ta)
                return tb - ta;
            return 2 * Math.PI - (ta - tb);
        };
        return RoughArcConverter;
    }());
    var PathFitter = /** @class */ (function () {
        function PathFitter(sets, closed) {
            this.sets = sets;
            this.closed = closed;
        }
        PathFitter.prototype.fit = function (simplification) {
            var outSets = [];
            for (var _i = 0, _a = this.sets; _i < _a.length; _i++) {
                var set = _a[_i];
                var length = set.length;
                var estLength = Math.floor(simplification * length);
                if (estLength < 5) {
                    if (length <= 5) {
                        continue;
                    }
                    estLength = 5;
                }
                outSets.push(this.reduce(set, estLength));
            }
            var d = '';
            for (var _b = 0, outSets_1 = outSets; _b < outSets_1.length; _b++) {
                var set = outSets_1[_b];
                for (var i = 0; i < set.length; i++) {
                    var point = set[i];
                    if (i === 0) {
                        d += 'M' + point[0] + ',' + point[1];
                    }
                    else {
                        d += 'L' + point[0] + ',' + point[1];
                    }
                }
                if (this.closed) {
                    d += 'z ';
                }
            }
            return d;
        };
        PathFitter.prototype.distance = function (p1, p2) {
            return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
        };
        PathFitter.prototype.reduce = function (set, count) {
            if (set.length <= count) {
                return set;
            }
            var points = set.slice(0);
            while (points.length > count) {
                var minArea = -1;
                var minIndex = -1;
                for (var i = 1; i < (points.length - 1); i++) {
                    var a = this.distance(points[i - 1], points[i]);
                    var b = this.distance(points[i], points[i + 1]);
                    var c = this.distance(points[i - 1], points[i + 1]);
                    var s = (a + b + c) / 2.0;
                    var area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
                    if ((minArea < 0) || (area < minArea)) {
                        minArea = area;
                        minIndex = i;
                    }
                }
                if (minIndex > 0) {
                    points.splice(minIndex, 1);
                }
                else {
                    break;
                }
            }
            return points;
        };
        return PathFitter;
    }());

    var Segment = /** @class */ (function () {
        function Segment(p1, p2) {
            this.xi = Number.MAX_VALUE;
            this.yi = Number.MAX_VALUE;
            this.px1 = p1[0];
            this.py1 = p1[1];
            this.px2 = p2[0];
            this.py2 = p2[1];
            this.a = this.py2 - this.py1;
            this.b = this.px1 - this.px2;
            this.c = this.px2 * this.py1 - this.px1 * this.py2;
            this._undefined = ((this.a === 0) && (this.b === 0) && (this.c === 0));
        }
        Segment.prototype.isUndefined = function () {
            return this._undefined;
        };
        Segment.prototype.intersects = function (otherSegment) {
            if (this.isUndefined() || otherSegment.isUndefined()) {
                return false;
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
            if (grad1 === Number.MAX_VALUE) {
                if (grad2 === Number.MAX_VALUE) {
                    if ((-c / a) !== (-otherSegment.c / otherSegment.a)) {
                        return false;
                    }
                    if ((this.py1 >= Math.min(otherSegment.py1, otherSegment.py2)) && (this.py1 <= Math.max(otherSegment.py1, otherSegment.py2))) {
                        this.xi = this.px1;
                        this.yi = this.py1;
                        return true;
                    }
                    if ((this.py2 >= Math.min(otherSegment.py1, otherSegment.py2)) && (this.py2 <= Math.max(otherSegment.py1, otherSegment.py2))) {
                        this.xi = this.px2;
                        this.yi = this.py2;
                        return true;
                    }
                    return false;
                }
                this.xi = this.px1;
                this.yi = (grad2 * this.xi + int2);
                if (((this.py1 - this.yi) * (this.yi - this.py2) < -0.00001) || ((otherSegment.py1 - this.yi) * (this.yi - otherSegment.py2) < -0.00001)) {
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
                if (((otherSegment.py1 - this.yi) * (this.yi - otherSegment.py2) < -0.00001) || ((this.py1 - this.yi) * (this.yi - this.py2) < -0.00001)) {
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
                if ((this.px1 >= Math.min(otherSegment.px1, otherSegment.px2)) && (this.px1 <= Math.max(otherSegment.py1, otherSegment.py2))) {
                    this.xi = this.px1;
                    this.yi = this.py1;
                    return true;
                }
                if ((this.px2 >= Math.min(otherSegment.px1, otherSegment.px2)) && (this.px2 <= Math.max(otherSegment.px1, otherSegment.px2))) {
                    this.xi = this.px2;
                    this.yi = this.py2;
                    return true;
                }
                return false;
            }
            this.xi = ((int2 - int1) / (grad1 - grad2));
            this.yi = (grad1 * this.xi + int1);
            if (((this.px1 - this.xi) * (this.xi - this.px2) < -0.00001) || ((otherSegment.px1 - this.xi) * (this.xi - otherSegment.px2) < -0.00001)) {
                return false;
            }
            return true;
        };
        return Segment;
    }());

    var HachureIterator = /** @class */ (function () {
        function HachureIterator(top, bottom, left, right, gap, sinAngle, cosAngle, tanAngle) {
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
            }
            else if (Math.abs(sinAngle) > 0.9999) {
                this.pos = top + gap;
            }
            else {
                this.deltaX = (bottom - top) * Math.abs(tanAngle);
                this.pos = left - Math.abs(this.deltaX);
                this.hGap = Math.abs(gap / cosAngle);
                this.sLeft = new Segment([left, bottom], [left, top]);
                this.sRight = new Segment([right, bottom], [right, top]);
            }
        }
        HachureIterator.prototype.nextLine = function () {
            if (Math.abs(this.sinAngle) < 0.0001) {
                if (this.pos < this.right) {
                    var line = [this.pos, this.top, this.pos, this.bottom];
                    this.pos += this.gap;
                    return line;
                }
            }
            else if (Math.abs(this.sinAngle) > 0.9999) {
                if (this.pos < this.bottom) {
                    var line = [this.left, this.pos, this.right, this.pos];
                    this.pos += this.gap;
                    return line;
                }
            }
            else {
                var xLower = this.pos - this.deltaX / 2;
                var xUpper = this.pos + this.deltaX / 2;
                var yLower = this.bottom;
                var yUpper = this.top;
                if (this.pos < (this.right + this.deltaX)) {
                    while (((xLower < this.left) && (xUpper < this.left)) || ((xLower > this.right) && (xUpper > this.right))) {
                        this.pos += this.hGap;
                        xLower = this.pos - this.deltaX / 2;
                        xUpper = this.pos + this.deltaX / 2;
                        if (this.pos > (this.right + this.deltaX)) {
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
                    var line = [xLower, yLower, xUpper, yUpper];
                    this.pos += this.hGap;
                    return line;
                }
            }
            return null;
        };
        return HachureIterator;
    }());

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
        return [
            A + C * x + D * y,
            B + E * x + F * y
        ];
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
            var hachureAngle = (angle % 180) * radPerDeg;
            var cosAngle = Math.cos(hachureAngle);
            var sinAngle = Math.sin(hachureAngle);
            var tanAngle = Math.tan(hachureAngle);
            var it = new HachureIterator(top - 1, bottom + 1, left - 1, right + 1, gap, sinAngle, cosAngle, tanAngle);
            var rect = void 0;
            while ((rect = it.nextLine()) != null) {
                var lines = getIntersectingLines(rect, points);
                for (var i = 0; i < lines.length; i++) {
                    if (i < (lines.length - 1)) {
                        var p1 = lines[i];
                        var p2 = lines[i + 1];
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
        var hachureAngle = (angle % 180) * radPerDeg;
        var tanAngle = Math.tan(hachureAngle);
        var aspectRatio = ry / rx;
        var hyp = Math.sqrt(aspectRatio * tanAngle * aspectRatio * tanAngle + 1);
        var sinAnglePrime = aspectRatio * tanAngle / hyp;
        var cosAnglePrime = 1 / hyp;
        var gapPrime = gap / ((rx * ry / Math.sqrt((ry * cosAnglePrime) * (ry * cosAnglePrime) + (rx * sinAnglePrime) * (rx * sinAnglePrime))) / rx);
        var halfLen = Math.sqrt((rx * rx) - (cx - rx + gapPrime) * (cx - rx + gapPrime));
        for (var xPos = cx - rx + gapPrime; xPos < cx + rx; xPos += gapPrime) {
            halfLen = Math.sqrt((rx * rx) - (cx - xPos) * (cx - xPos));
            var p1 = affine(xPos, cy - halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
            var p2 = affine(xPos, cy + halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
            ret.push([p1, p2]);
        }
        return ret;
    }

    var HachureFiller = /** @class */ (function () {
        function HachureFiller(renderer) {
            this.renderer = renderer;
        }
        HachureFiller.prototype.fillPolygon = function (points, o) {
            return this._fillPolygon(points, o);
        };
        HachureFiller.prototype.fillEllipse = function (cx, cy, width, height, o) {
            return this._fillEllipse(cx, cy, width, height, o);
        };
        HachureFiller.prototype._fillPolygon = function (points, o, connectEnds) {
            if (connectEnds === void 0) { connectEnds = false; }
            var lines = hachureLinesForPolygon(points, o);
            var ops = this.renderLines(lines, o, connectEnds);
            return { type: 'fillSketch', ops: ops };
        };
        HachureFiller.prototype._fillEllipse = function (cx, cy, width, height, o, connectEnds) {
            if (connectEnds === void 0) { connectEnds = false; }
            var lines = hachureLinesForEllipse(cx, cy, width, height, o, this.renderer);
            var ops = this.renderLines(lines, o, connectEnds);
            return { type: 'fillSketch', ops: ops };
        };
        HachureFiller.prototype.renderLines = function (lines, o, connectEnds) {
            var ops = [];
            var prevPoint = null;
            for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                var line = lines_1[_i];
                ops = ops.concat(this.renderer.doubleLine(line[0][0], line[0][1], line[1][0], line[1][1], o));
                if (connectEnds && prevPoint) {
                    ops = ops.concat(this.renderer.doubleLine(prevPoint[0], prevPoint[1], line[0][0], line[0][1], o));
                }
                prevPoint = line[1];
            }
            return ops;
        };
        return HachureFiller;
    }());

    var ZigZagFiller = /** @class */ (function (_super) {
        __extends(ZigZagFiller, _super);
        function ZigZagFiller() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ZigZagFiller.prototype.fillPolygon = function (points, o) {
            return this._fillPolygon(points, o, true);
        };
        ZigZagFiller.prototype.fillEllipse = function (cx, cy, width, height, o) {
            return this._fillEllipse(cx, cy, width, height, o, true);
        };
        return ZigZagFiller;
    }(HachureFiller));

    var HatchFiller = /** @class */ (function (_super) {
        __extends(HatchFiller, _super);
        function HatchFiller() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        HatchFiller.prototype.fillPolygon = function (points, o) {
            var set = this._fillPolygon(points, o);
            var o2 = Object.assign({}, o, { hachureAngle: o.hachureAngle + 90 });
            var set2 = this._fillPolygon(points, o2);
            set.ops = set.ops.concat(set2.ops);
            return set;
        };
        HatchFiller.prototype.fillEllipse = function (cx, cy, width, height, o) {
            var set = this._fillEllipse(cx, cy, width, height, o);
            var o2 = Object.assign({}, o, { hachureAngle: o.hachureAngle + 90 });
            var set2 = this._fillEllipse(cx, cy, width, height, o2);
            set.ops = set.ops.concat(set2.ops);
            return set;
        };
        return HatchFiller;
    }(HachureFiller));

    var DotFiller = /** @class */ (function () {
        function DotFiller(renderer) {
            this.renderer = renderer;
        }
        DotFiller.prototype.fillPolygon = function (points, o) {
            o = Object.assign({}, o, { curveStepCount: 4, hachureAngle: 0 });
            var lines = hachureLinesForPolygon(points, o);
            return this.dotsOnLines(lines, o);
        };
        DotFiller.prototype.fillEllipse = function (cx, cy, width, height, o) {
            o = Object.assign({}, o, { curveStepCount: 4, hachureAngle: 0 });
            var lines = hachureLinesForEllipse(cx, cy, width, height, o, this.renderer);
            return this.dotsOnLines(lines, o);
        };
        DotFiller.prototype.dotsOnLines = function (lines, o) {
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
            for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                var line = lines_1[_i];
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
            return { type: 'fillSketch', ops: ops };
        };
        return DotFiller;
    }());

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

    var RoughRenderer = /** @class */ (function () {
        function RoughRenderer() {
        }
        RoughRenderer.prototype.line = function (x1, y1, x2, y2, o) {
            var ops = this.doubleLine(x1, y1, x2, y2, o);
            return { type: 'path', ops: ops };
        };
        RoughRenderer.prototype.linearPath = function (points, close, o) {
            var len = (points || []).length;
            if (len > 2) {
                var ops = [];
                for (var i = 0; i < (len - 1); i++) {
                    ops = ops.concat(this.doubleLine(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], o));
                }
                if (close) {
                    ops = ops.concat(this.doubleLine(points[len - 1][0], points[len - 1][1], points[0][0], points[0][1], o));
                }
                return { type: 'path', ops: ops };
            }
            else if (len === 2) {
                return this.line(points[0][0], points[0][1], points[1][0], points[1][1], o);
            }
            return { type: 'path', ops: [] };
        };
        RoughRenderer.prototype.polygon = function (points, o) {
            return this.linearPath(points, true, o);
        };
        RoughRenderer.prototype.rectangle = function (x, y, width, height, o) {
            var points = [
                [x, y], [x + width, y], [x + width, y + height], [x, y + height]
            ];
            return this.polygon(points, o);
        };
        RoughRenderer.prototype.curve = function (points, o) {
            var o1 = this._curveWithOffset(points, 1 * (1 + o.roughness * 0.2), o);
            var o2 = this._curveWithOffset(points, 1.5 * (1 + o.roughness * 0.22), o);
            return { type: 'path', ops: o1.concat(o2) };
        };
        RoughRenderer.prototype.ellipse = function (x, y, width, height, o) {
            var increment = (Math.PI * 2) / o.curveStepCount;
            var rx = Math.abs(width / 2);
            var ry = Math.abs(height / 2);
            rx += this.getOffset(-rx * 0.05, rx * 0.05, o);
            ry += this.getOffset(-ry * 0.05, ry * 0.05, o);
            var o1 = this._ellipse(increment, x, y, rx, ry, 1, increment * this.getOffset(0.1, this.getOffset(0.4, 1, o), o), o);
            var o2 = this._ellipse(increment, x, y, rx, ry, 1.5, 0, o);
            return { type: 'path', ops: o1.concat(o2) };
        };
        RoughRenderer.prototype.arc = function (x, y, width, height, start, stop, closed, roughClosure, o) {
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
            if ((stp - strt) > (Math.PI * 2)) {
                strt = 0;
                stp = Math.PI * 2;
            }
            var ellipseInc = (Math.PI * 2) / o.curveStepCount;
            var arcInc = Math.min(ellipseInc / 2, (stp - strt) / 2);
            var o1 = this._arc(arcInc, cx, cy, rx, ry, strt, stp, 1, o);
            var o2 = this._arc(arcInc, cx, cy, rx, ry, strt, stp, 1.5, o);
            var ops = o1.concat(o2);
            if (closed) {
                if (roughClosure) {
                    ops = ops.concat(this.doubleLine(cx, cy, cx + rx * Math.cos(strt), cy + ry * Math.sin(strt), o));
                    ops = ops.concat(this.doubleLine(cx, cy, cx + rx * Math.cos(stp), cy + ry * Math.sin(stp), o));
                }
                else {
                    ops.push({ op: 'lineTo', data: [cx, cy] });
                    ops.push({ op: 'lineTo', data: [cx + rx * Math.cos(strt), cy + ry * Math.sin(strt)] });
                }
            }
            return { type: 'path', ops: ops };
        };
        RoughRenderer.prototype.svgPath = function (path, o) {
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
        };
        RoughRenderer.prototype.solidFillPolygon = function (points, o) {
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
        };
        RoughRenderer.prototype.patternFillPolygon = function (points, o) {
            var filler = getFiller(this, o);
            return filler.fillPolygon(points, o);
        };
        RoughRenderer.prototype.patternFillEllipse = function (cx, cy, width, height, o) {
            var filler = getFiller(this, o);
            return filler.fillEllipse(cx, cy, width, height, o);
        };
        RoughRenderer.prototype.patternFillArc = function (x, y, width, height, start, stop, o) {
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
            if ((stp - strt) > (Math.PI * 2)) {
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
        };
        /// 
        RoughRenderer.prototype.getOffset = function (min, max, ops) {
            return ops.roughness * ((Math.random() * (max - min)) + min);
        };
        RoughRenderer.prototype.doubleLine = function (x1, y1, x2, y2, o) {
            var o1 = this._line(x1, y1, x2, y2, o, true, false);
            var o2 = this._line(x1, y1, x2, y2, o, true, true);
            return o1.concat(o2);
        };
        RoughRenderer.prototype._line = function (x1, y1, x2, y2, o, move, overlay) {
            var lengthSq = Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2);
            var offset = o.maxRandomnessOffset || 0;
            if ((offset * offset * 100) > lengthSq) {
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
                        op: 'move', data: [
                            x1 + this.getOffset(-halfOffset, halfOffset, o),
                            y1 + this.getOffset(-halfOffset, halfOffset, o)
                        ]
                    });
                }
                else {
                    ops.push({
                        op: 'move', data: [
                            x1 + this.getOffset(-offset, offset, o),
                            y1 + this.getOffset(-offset, offset, o)
                        ]
                    });
                }
            }
            if (overlay) {
                ops.push({
                    op: 'bcurveTo', data: [
                        midDispX + x1 + (x2 - x1) * divergePoint + this.getOffset(-halfOffset, halfOffset, o),
                        midDispY + y1 + (y2 - y1) * divergePoint + this.getOffset(-halfOffset, halfOffset, o),
                        midDispX + x1 + 2 * (x2 - x1) * divergePoint + this.getOffset(-halfOffset, halfOffset, o),
                        midDispY + y1 + 2 * (y2 - y1) * divergePoint + this.getOffset(-halfOffset, halfOffset, o),
                        x2 + this.getOffset(-halfOffset, halfOffset, o),
                        y2 + this.getOffset(-halfOffset, halfOffset, o)
                    ]
                });
            }
            else {
                ops.push({
                    op: 'bcurveTo', data: [
                        midDispX + x1 + (x2 - x1) * divergePoint + this.getOffset(-offset, offset, o),
                        midDispY + y1 + (y2 - y1) * divergePoint + this.getOffset(-offset, offset, o),
                        midDispX + x1 + 2 * (x2 - x1) * divergePoint + this.getOffset(-offset, offset, o),
                        midDispY + y1 + 2 * (y2 - y1) * divergePoint + this.getOffset(-offset, offset, o),
                        x2 + this.getOffset(-offset, offset, o),
                        y2 + this.getOffset(-offset, offset, o)
                    ]
                });
            }
            return ops;
        };
        RoughRenderer.prototype._curve = function (points, closePoint, o) {
            var len = points.length;
            var ops = [];
            if (len > 3) {
                var b = [];
                var s = 1 - o.curveTightness;
                ops.push({ op: 'move', data: [points[1][0], points[1][1]] });
                for (var i = 1; (i + 2) < len; i++) {
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
            }
            else if (len === 3) {
                ops.push({ op: 'move', data: [points[1][0], points[1][1]] });
                ops.push({
                    op: 'bcurveTo', data: [
                        points[1][0], points[1][1],
                        points[2][0], points[2][1],
                        points[2][0], points[2][1]
                    ]
                });
            }
            else if (len === 2) {
                ops = ops.concat(this.doubleLine(points[0][0], points[0][1], points[1][0], points[1][1], o));
            }
            return ops;
        };
        RoughRenderer.prototype._ellipse = function (increment, cx, cy, rx, ry, offset, overlap, o) {
            var radOffset = this.getOffset(-0.5, 0.5, o) - (Math.PI / 2);
            var points = [];
            points.push([
                this.getOffset(-offset, offset, o) + cx + 0.9 * rx * Math.cos(radOffset - increment),
                this.getOffset(-offset, offset, o) + cy + 0.9 * ry * Math.sin(radOffset - increment)
            ]);
            for (var angle = radOffset; angle < (Math.PI * 2 + radOffset - 0.01); angle = angle + increment) {
                points.push([
                    this.getOffset(-offset, offset, o) + cx + rx * Math.cos(angle),
                    this.getOffset(-offset, offset, o) + cy + ry * Math.sin(angle)
                ]);
            }
            points.push([
                this.getOffset(-offset, offset, o) + cx + rx * Math.cos(radOffset + Math.PI * 2 + overlap * 0.5),
                this.getOffset(-offset, offset, o) + cy + ry * Math.sin(radOffset + Math.PI * 2 + overlap * 0.5)
            ]);
            points.push([
                this.getOffset(-offset, offset, o) + cx + 0.98 * rx * Math.cos(radOffset + overlap),
                this.getOffset(-offset, offset, o) + cy + 0.98 * ry * Math.sin(radOffset + overlap)
            ]);
            points.push([
                this.getOffset(-offset, offset, o) + cx + 0.9 * rx * Math.cos(radOffset + overlap * 0.5),
                this.getOffset(-offset, offset, o) + cy + 0.9 * ry * Math.sin(radOffset + overlap * 0.5)
            ]);
            return this._curve(points, null, o);
        };
        RoughRenderer.prototype._curveWithOffset = function (points, offset, o) {
            var ps = [];
            ps.push([
                points[0][0] + this.getOffset(-offset, offset, o),
                points[0][1] + this.getOffset(-offset, offset, o),
            ]);
            ps.push([
                points[0][0] + this.getOffset(-offset, offset, o),
                points[0][1] + this.getOffset(-offset, offset, o),
            ]);
            for (var i = 1; i < points.length; i++) {
                ps.push([
                    points[i][0] + this.getOffset(-offset, offset, o),
                    points[i][1] + this.getOffset(-offset, offset, o),
                ]);
                if (i === (points.length - 1)) {
                    ps.push([
                        points[i][0] + this.getOffset(-offset, offset, o),
                        points[i][1] + this.getOffset(-offset, offset, o),
                    ]);
                }
            }
            return this._curve(ps, null, o);
        };
        RoughRenderer.prototype._arc = function (increment, cx, cy, rx, ry, strt, stp, offset, o) {
            var radOffset = strt + this.getOffset(-0.1, 0.1, o);
            var points = [];
            points.push([
                this.getOffset(-offset, offset, o) + cx + 0.9 * rx * Math.cos(radOffset - increment),
                this.getOffset(-offset, offset, o) + cy + 0.9 * ry * Math.sin(radOffset - increment)
            ]);
            for (var angle = radOffset; angle <= stp; angle = angle + increment) {
                points.push([
                    this.getOffset(-offset, offset, o) + cx + rx * Math.cos(angle),
                    this.getOffset(-offset, offset, o) + cy + ry * Math.sin(angle)
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
        };
        RoughRenderer.prototype._bezierTo = function (x1, y1, x2, y2, x, y, path, o) {
            var ops = [];
            var ros = [o.maxRandomnessOffset || 1, (o.maxRandomnessOffset || 1) + 0.5];
            var f = [0, 0];
            for (var i = 0; i < 2; i++) {
                if (i === 0) {
                    ops.push({ op: 'move', data: [path.x, path.y] });
                }
                else {
                    ops.push({ op: 'move', data: [path.x + this.getOffset(-ros[0], ros[0], o), path.y + this.getOffset(-ros[0], ros[0], o)] });
                }
                f = [x + this.getOffset(-ros[i], ros[i], o), y + this.getOffset(-ros[i], ros[i], o)];
                ops.push({
                    op: 'bcurveTo', data: [
                        x1 + this.getOffset(-ros[i], ros[i], o), y1 + this.getOffset(-ros[i], ros[i], o),
                        x2 + this.getOffset(-ros[i], ros[i], o), y2 + this.getOffset(-ros[i], ros[i], o),
                        f[0], f[1]
                    ]
                });
            }
            path.setPosition(f[0], f[1]);
            return ops;
        };
        RoughRenderer.prototype._processSegment = function (path, seg, prevSeg, o) {
            var ops = [];
            switch (seg.key) {
                case 'M':
                case 'm': {
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
                case 'l': {
                    var delta = seg.key === 'l';
                    if (seg.data.length >= 2) {
                        var x = +seg.data[0];
                        var y = +seg.data[1];
                        if (delta) {
                            x += path.x;
                            y += path.y;
                        }
                        ops = ops.concat(this.doubleLine(path.x, path.y, x, y, o));
                        path.setPosition(x, y);
                    }
                    break;
                }
                case 'H':
                case 'h': {
                    var delta = seg.key === 'h';
                    if (seg.data.length) {
                        var x = +seg.data[0];
                        if (delta) {
                            x += path.x;
                        }
                        ops = ops.concat(this.doubleLine(path.x, path.y, x, path.y, o));
                        path.setPosition(x, path.y);
                    }
                    break;
                }
                case 'V':
                case 'v': {
                    var delta = seg.key === 'v';
                    if (seg.data.length) {
                        var y = +seg.data[0];
                        if (delta) {
                            y += path.y;
                        }
                        ops = ops.concat(this.doubleLine(path.x, path.y, path.x, y, o));
                        path.setPosition(path.x, y);
                    }
                    break;
                }
                case 'Z':
                case 'z': {
                    if (path.first) {
                        ops = ops.concat(this.doubleLine(path.x, path.y, path.first[0], path.first[1], o));
                        path.setPosition(path.first[0], path.first[1]);
                        path.first = null;
                    }
                    break;
                }
                case 'C':
                case 'c': {
                    var delta = seg.key === 'c';
                    if (seg.data.length >= 6) {
                        var x1 = +seg.data[0];
                        var y1 = +seg.data[1];
                        var x2 = +seg.data[2];
                        var y2 = +seg.data[3];
                        var x = +seg.data[4];
                        var y = +seg.data[5];
                        if (delta) {
                            x1 += path.x;
                            x2 += path.x;
                            x += path.x;
                            y1 += path.y;
                            y2 += path.y;
                            y += path.y;
                        }
                        var ob = this._bezierTo(x1, y1, x2, y2, x, y, path, o);
                        ops = ops.concat(ob);
                        path.bezierReflectionPoint = [x + (x - x2), y + (y - y2)];
                    }
                    break;
                }
                case 'S':
                case 's': {
                    var delta = seg.key === 's';
                    if (seg.data.length >= 4) {
                        var x2 = +seg.data[0];
                        var y2 = +seg.data[1];
                        var x = +seg.data[2];
                        var y = +seg.data[3];
                        if (delta) {
                            x2 += path.x;
                            x += path.x;
                            y2 += path.y;
                            y += path.y;
                        }
                        var x1 = x2;
                        var y1 = y2;
                        var prevKey = prevSeg ? prevSeg.key : '';
                        var ref = null;
                        if (prevKey === 'c' || prevKey === 'C' || prevKey === 's' || prevKey === 'S') {
                            ref = path.bezierReflectionPoint;
                        }
                        if (ref) {
                            x1 = ref[0];
                            y1 = ref[1];
                        }
                        var ob = this._bezierTo(x1, y1, x2, y2, x, y, path, o);
                        ops = ops.concat(ob);
                        path.bezierReflectionPoint = [x + (x - x2), y + (y - y2)];
                    }
                    break;
                }
                case 'Q':
                case 'q': {
                    var delta = seg.key === 'q';
                    if (seg.data.length >= 4) {
                        var x1 = +seg.data[0];
                        var y1 = +seg.data[1];
                        var x = +seg.data[2];
                        var y = +seg.data[3];
                        if (delta) {
                            x1 += path.x;
                            x += path.x;
                            y1 += path.y;
                            y += path.y;
                        }
                        var offset1 = 1 * (1 + o.roughness * 0.2);
                        var offset2 = 1.5 * (1 + o.roughness * 0.22);
                        ops.push({ op: 'move', data: [path.x + this.getOffset(-offset1, offset1, o), path.y + this.getOffset(-offset1, offset1, o)] });
                        var f = [x + this.getOffset(-offset1, offset1, o), y + this.getOffset(-offset1, offset1, o)];
                        ops.push({
                            op: 'qcurveTo', data: [
                                x1 + this.getOffset(-offset1, offset1, o), y1 + this.getOffset(-offset1, offset1, o),
                                f[0], f[1]
                            ]
                        });
                        ops.push({ op: 'move', data: [path.x + this.getOffset(-offset2, offset2, o), path.y + this.getOffset(-offset2, offset2, o)] });
                        f = [x + this.getOffset(-offset2, offset2, o), y + this.getOffset(-offset2, offset2, o)];
                        ops.push({
                            op: 'qcurveTo', data: [
                                x1 + this.getOffset(-offset2, offset2, o), y1 + this.getOffset(-offset2, offset2, o),
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
                    var delta = seg.key === 't';
                    if (seg.data.length >= 2) {
                        var x = +seg.data[0];
                        var y = +seg.data[1];
                        if (delta) {
                            x += path.x;
                            y += path.y;
                        }
                        var x1 = x;
                        var y1 = y;
                        var prevKey = prevSeg ? prevSeg.key : '';
                        var ref = null;
                        if (prevKey === 'q' || prevKey === 'Q' || prevKey === 't' || prevKey === 'T') {
                            ref = path.quadReflectionPoint;
                        }
                        if (ref) {
                            x1 = ref[0];
                            y1 = ref[1];
                        }
                        var offset1 = 1 * (1 + o.roughness * 0.2);
                        var offset2 = 1.5 * (1 + o.roughness * 0.22);
                        ops.push({ op: 'move', data: [path.x + this.getOffset(-offset1, offset1, o), path.y + this.getOffset(-offset1, offset1, o)] });
                        var f = [x + this.getOffset(-offset1, offset1, o), y + this.getOffset(-offset1, offset1, o)];
                        ops.push({
                            op: 'qcurveTo', data: [
                                x1 + this.getOffset(-offset1, offset1, o), y1 + this.getOffset(-offset1, offset1, o),
                                f[0], f[1]
                            ]
                        });
                        ops.push({ op: 'move', data: [path.x + this.getOffset(-offset2, offset2, o), path.y + this.getOffset(-offset2, offset2, o)] });
                        f = [x + this.getOffset(-offset2, offset2, o), y + this.getOffset(-offset2, offset2, o)];
                        ops.push({
                            op: 'qcurveTo', data: [
                                x1 + this.getOffset(-offset2, offset2, o), y1 + this.getOffset(-offset2, offset2, o),
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
                            x += path.x;
                            y += path.y;
                        }
                        if (x === path.x && y === path.y) {
                            break;
                        }
                        if (rx === 0 || ry === 0) {
                            ops = ops.concat(this.doubleLine(path.x, path.y, x, y, o));
                            path.setPosition(x, y);
                        }
                        else {
                            for (var i = 0; i < 1; i++) {
                                var arcConverter = new RoughArcConverter([path.x, path.y], [x, y], [rx, ry], angle, largeArcFlag ? true : false, sweepFlag ? true : false);
                                var segment = arcConverter.getNextSegment();
                                while (segment) {
                                    var ob = this._bezierTo(segment.cp1[0], segment.cp1[1], segment.cp2[0], segment.cp2[1], segment.to[0], segment.to[1], path, o);
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
        };
        return RoughRenderer;
    }());

    var hasSelf = typeof self !== 'undefined';
    var roughScript = hasSelf && self && self.document && self.document.currentScript && self.document.currentScript.src;
    function createRenderer(config) {
        if (hasSelf && roughScript && self && self.workly && config.async && (!config.noWorker)) {
            var worklySource = config.worklyURL || 'https://cdn.jsdelivr.net/gh/pshihn/workly/dist/workly.min.js';
            if (worklySource) {
                var code = "importScripts('" + worklySource + "', '" + roughScript + "');\nworkly.expose(self.rough.createRenderer());";
                var ourl = URL.createObjectURL(new Blob([code]));
                return self.workly.proxy(ourl);
            }
        }
        return new RoughRenderer();
    }

    var hasSelf$1 = typeof self !== 'undefined';
    var RoughGeneratorBase = /** @class */ (function () {
        function RoughGeneratorBase(config, surface) {
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
        RoughGeneratorBase.prototype._options = function (options) {
            return options ? Object.assign({}, this.defaultOptions, options) : this.defaultOptions;
        };
        RoughGeneratorBase.prototype._drawable = function (shape, sets, options) {
            return { shape: shape, sets: sets || [], options: options || this.defaultOptions };
        };
        Object.defineProperty(RoughGeneratorBase.prototype, "lib", {
            get: function () {
                return this.renderer;
            },
            enumerable: true,
            configurable: true
        });
        RoughGeneratorBase.prototype.getCanvasSize = function () {
            var val = function (w) {
                if (w && typeof w === 'object') {
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
        };
        RoughGeneratorBase.prototype.computePolygonSize = function (points) {
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
                return [(right - left), (bottom - top)];
            }
            return [0, 0];
        };
        RoughGeneratorBase.prototype.polygonPath = function (points) {
            var d = '';
            if (points.length) {
                d = "M" + points[0][0] + "," + points[0][1];
                for (var i = 1; i < points.length; i++) {
                    d = d + " L" + points[i][0] + "," + points[i][1];
                }
            }
            return d;
        };
        RoughGeneratorBase.prototype.computePathSize = function (d) {
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
                }
                catch (err) { }
            }
            var canvasSize = this.getCanvasSize();
            if (!(size[0] * size[1])) {
                size = canvasSize;
            }
            return size;
        };
        RoughGeneratorBase.prototype.toPaths = function (drawable) {
            var sets = drawable.sets || [];
            var o = drawable.options || this.defaultOptions;
            var paths = [];
            for (var _i = 0, sets_1 = sets; _i < sets_1.length; _i++) {
                var drawing = sets_1[_i];
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
                    case 'path2Dpattern': {
                        var size = drawing.size;
                        var pattern = {
                            x: 0, y: 0, width: 1, height: 1,
                            viewBox: "0 0 " + Math.round(size[0]) + " " + Math.round(size[1]),
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
            return paths;
        };
        RoughGeneratorBase.prototype.fillSketch = function (drawing, o) {
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
        };
        RoughGeneratorBase.prototype.opsToPath = function (drawing) {
            var path = '';
            for (var _i = 0, _a = drawing.ops; _i < _a.length; _i++) {
                var item = _a[_i];
                var data = item.data;
                switch (item.op) {
                    case 'move':
                        path += "M" + data[0] + " " + data[1] + " ";
                        break;
                    case 'bcurveTo':
                        path += "C" + data[0] + " " + data[1] + ", " + data[2] + " " + data[3] + ", " + data[4] + " " + data[5] + " ";
                        break;
                    case 'qcurveTo':
                        path += "Q" + data[0] + " " + data[1] + ", " + data[2] + " " + data[3] + " ";
                        break;
                    case 'lineTo':
                        path += "L" + data[0] + " " + data[1] + " ";
                        break;
                }
            }
            return path.trim();
        };
        return RoughGeneratorBase;
    }());

    var RoughGenerator = /** @class */ (function (_super) {
        __extends(RoughGenerator, _super);
        function RoughGenerator(config, surface) {
            return _super.call(this, config, surface) || this;
        }
        RoughGenerator.prototype.line = function (x1, y1, x2, y2, options) {
            var o = this._options(options);
            return this._drawable('line', [this.lib.line(x1, y1, x2, y2, o)], o);
        };
        RoughGenerator.prototype.rectangle = function (x, y, width, height, options) {
            var o = this._options(options);
            var paths = [];
            if (o.fill) {
                var points = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
                if (o.fillStyle === 'solid') {
                    paths.push(this.lib.solidFillPolygon(points, o));
                }
                else {
                    paths.push(this.lib.patternFillPolygon(points, o));
                }
            }
            paths.push(this.lib.rectangle(x, y, width, height, o));
            return this._drawable('rectangle', paths, o);
        };
        RoughGenerator.prototype.ellipse = function (x, y, width, height, options) {
            var o = this._options(options);
            var paths = [];
            if (o.fill) {
                if (o.fillStyle === 'solid') {
                    var shape = this.lib.ellipse(x, y, width, height, o);
                    shape.type = 'fillPath';
                    paths.push(shape);
                }
                else {
                    paths.push(this.lib.patternFillEllipse(x, y, width, height, o));
                }
            }
            paths.push(this.lib.ellipse(x, y, width, height, o));
            return this._drawable('ellipse', paths, o);
        };
        RoughGenerator.prototype.circle = function (x, y, diameter, options) {
            var ret = this.ellipse(x, y, diameter, diameter, options);
            ret.shape = 'circle';
            return ret;
        };
        RoughGenerator.prototype.linearPath = function (points, options) {
            var o = this._options(options);
            return this._drawable('linearPath', [this.lib.linearPath(points, false, o)], o);
        };
        RoughGenerator.prototype.arc = function (x, y, width, height, start, stop, closed, options) {
            if (closed === void 0) { closed = false; }
            var o = this._options(options);
            var paths = [];
            if (closed && o.fill) {
                if (o.fillStyle === 'solid') {
                    var shape = this.lib.arc(x, y, width, height, start, stop, true, false, o);
                    shape.type = 'fillPath';
                    paths.push(shape);
                }
                else {
                    paths.push(this.lib.patternFillArc(x, y, width, height, start, stop, o));
                }
            }
            paths.push(this.lib.arc(x, y, width, height, start, stop, closed, true, o));
            return this._drawable('arc', paths, o);
        };
        RoughGenerator.prototype.curve = function (points, options) {
            var o = this._options(options);
            return this._drawable('curve', [this.lib.curve(points, o)], o);
        };
        RoughGenerator.prototype.polygon = function (points, options) {
            var o = this._options(options);
            var paths = [];
            if (o.fill) {
                if (o.fillStyle === 'solid') {
                    paths.push(this.lib.solidFillPolygon(points, o));
                }
                else {
                    var size = this.computePolygonSize(points);
                    var fillPoints = [
                        [0, 0],
                        [size[0], 0],
                        [size[0], size[1]],
                        [0, size[1]]
                    ];
                    var shape = this.lib.patternFillPolygon(fillPoints, o);
                    shape.type = 'path2Dpattern';
                    shape.size = size;
                    shape.path = this.polygonPath(points);
                    paths.push(shape);
                }
            }
            paths.push(this.lib.linearPath(points, true, o));
            return this._drawable('polygon', paths, o);
        };
        RoughGenerator.prototype.path = function (d, options) {
            var o = this._options(options);
            var paths = [];
            if (!d) {
                return this._drawable('path', paths, o);
            }
            if (o.fill) {
                if (o.fillStyle === 'solid') {
                    var shape = { type: 'path2Dfill', path: d, ops: [] };
                    paths.push(shape);
                }
                else {
                    var size = this.computePathSize(d);
                    var points = [
                        [0, 0],
                        [size[0], 0],
                        [size[0], size[1]],
                        [0, size[1]]
                    ];
                    var shape = this.lib.patternFillPolygon(points, o);
                    shape.type = 'path2Dpattern';
                    shape.size = size;
                    shape.path = d;
                    paths.push(shape);
                }
            }
            paths.push(this.lib.svgPath(d, o));
            return this._drawable('path', paths, o);
        };
        return RoughGenerator;
    }(RoughGeneratorBase));

    var hasDocument = typeof document !== 'undefined';
    var RoughCanvasBase = /** @class */ (function () {
        function RoughCanvasBase(canvas) {
            this.canvas = canvas;
            this.ctx = this.canvas.getContext('2d');
        }
        RoughCanvasBase.createRenderer = function () {
            return new RoughRenderer();
        };
        RoughCanvasBase.prototype.draw = function (drawable) {
            var sets = drawable.sets || [];
            var o = drawable.options || this.getDefaultOptions();
            var ctx = this.ctx;
            for (var _i = 0, sets_1 = sets; _i < sets_1.length; _i++) {
                var drawing = sets_1[_i];
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
                    case 'path2Dfill': {
                        this.ctx.save();
                        this.ctx.fillStyle = o.fill || '';
                        var p2d = new Path2D(drawing.path);
                        this.ctx.fill(p2d);
                        this.ctx.restore();
                        break;
                    }
                    case 'path2Dpattern': {
                        var doc = this.canvas.ownerDocument || (hasDocument && document);
                        if (doc) {
                            var size = drawing.size;
                            var hcanvas = doc.createElement('canvas');
                            var hcontext = hcanvas.getContext('2d');
                            var bbox = this.computeBBox(drawing.path);
                            if (bbox && (bbox.width || bbox.height)) {
                                hcanvas.width = this.canvas.width;
                                hcanvas.height = this.canvas.height;
                                hcontext.translate(bbox.x || 0, bbox.y || 0);
                            }
                            else {
                                hcanvas.width = size[0];
                                hcanvas.height = size[1];
                            }
                            this.fillSketch(hcontext, drawing, o);
                            this.ctx.save();
                            this.ctx.fillStyle = this.ctx.createPattern(hcanvas, 'repeat');
                            var p2d = new Path2D(drawing.path);
                            this.ctx.fill(p2d);
                            this.ctx.restore();
                        }
                        else {
                            console.error('Cannot render path2Dpattern. No defs/document defined.');
                        }
                        break;
                    }
                }
            }
        };
        RoughCanvasBase.prototype.computeBBox = function (d) {
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
                }
                catch (err) { }
            }
            return null;
        };
        RoughCanvasBase.prototype.fillSketch = function (ctx, drawing, o) {
            var fweight = o.fillWeight;
            if (fweight < 0) {
                fweight = o.strokeWidth / 2;
            }
            ctx.save();
            ctx.strokeStyle = o.fill || '';
            ctx.lineWidth = fweight;
            this._drawToContext(ctx, drawing);
            ctx.restore();
        };
        RoughCanvasBase.prototype._drawToContext = function (ctx, drawing) {
            ctx.beginPath();
            for (var _i = 0, _a = drawing.ops; _i < _a.length; _i++) {
                var item = _a[_i];
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
            if (drawing.type === 'fillPath') {
                ctx.fill();
            }
            else {
                ctx.stroke();
            }
        };
        return RoughCanvasBase;
    }());

    var RoughCanvas = /** @class */ (function (_super) {
        __extends(RoughCanvas, _super);
        function RoughCanvas(canvas, config) {
            var _this = _super.call(this, canvas) || this;
            _this.gen = new RoughGenerator(config || null, _this.canvas);
            return _this;
        }
        Object.defineProperty(RoughCanvas.prototype, "generator", {
            get: function () {
                return this.gen;
            },
            enumerable: true,
            configurable: true
        });
        RoughCanvas.prototype.getDefaultOptions = function () {
            return this.gen.defaultOptions;
        };
        RoughCanvas.prototype.line = function (x1, y1, x2, y2, options) {
            var d = this.gen.line(x1, y1, x2, y2, options);
            this.draw(d);
            return d;
        };
        RoughCanvas.prototype.rectangle = function (x, y, width, height, options) {
            var d = this.gen.rectangle(x, y, width, height, options);
            this.draw(d);
            return d;
        };
        RoughCanvas.prototype.ellipse = function (x, y, width, height, options) {
            var d = this.gen.ellipse(x, y, width, height, options);
            this.draw(d);
            return d;
        };
        RoughCanvas.prototype.circle = function (x, y, diameter, options) {
            var d = this.gen.circle(x, y, diameter, options);
            this.draw(d);
            return d;
        };
        RoughCanvas.prototype.linearPath = function (points, options) {
            var d = this.gen.linearPath(points, options);
            this.draw(d);
            return d;
        };
        RoughCanvas.prototype.polygon = function (points, options) {
            var d = this.gen.polygon(points, options);
            this.draw(d);
            return d;
        };
        RoughCanvas.prototype.arc = function (x, y, width, height, start, stop, closed, options) {
            if (closed === void 0) { closed = false; }
            var d = this.gen.arc(x, y, width, height, start, stop, closed, options);
            this.draw(d);
            return d;
        };
        RoughCanvas.prototype.curve = function (points, options) {
            var d = this.gen.curve(points, options);
            this.draw(d);
            return d;
        };
        RoughCanvas.prototype.path = function (d, options) {
            var drawing = this.gen.path(d, options);
            this.draw(drawing);
            return drawing;
        };
        return RoughCanvas;
    }(RoughCanvasBase));

    var RoughGeneratorAsync = /** @class */ (function (_super) {
        __extends(RoughGeneratorAsync, _super);
        function RoughGeneratorAsync() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        RoughGeneratorAsync.prototype.line = function (x1, y1, x2, y2, options) {
            return __awaiter(this, void 0, Promise, function () {
                var o, _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            o = this._options(options);
                            _a = this._drawable;
                            _b = ['line'];
                            return [4 /*yield*/, this.lib.line(x1, y1, x2, y2, o)];
                        case 1: return [2 /*return*/, _a.apply(this, _b.concat([[_c.sent()], o]))];
                    }
                });
            });
        };
        RoughGeneratorAsync.prototype.rectangle = function (x, y, width, height, options) {
            return __awaiter(this, void 0, Promise, function () {
                var o, paths, points, _a, _b, _c, _d, _e, _f;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0:
                            o = this._options(options);
                            paths = [];
                            if (!o.fill) return [3 /*break*/, 4];
                            points = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
                            if (!(o.fillStyle === 'solid')) return [3 /*break*/, 2];
                            _b = (_a = paths).push;
                            return [4 /*yield*/, this.lib.solidFillPolygon(points, o)];
                        case 1:
                            _b.apply(_a, [_g.sent()]);
                            return [3 /*break*/, 4];
                        case 2:
                            _d = (_c = paths).push;
                            return [4 /*yield*/, this.lib.patternFillPolygon(points, o)];
                        case 3:
                            _d.apply(_c, [_g.sent()]);
                            _g.label = 4;
                        case 4:
                            _f = (_e = paths).push;
                            return [4 /*yield*/, this.lib.rectangle(x, y, width, height, o)];
                        case 5:
                            _f.apply(_e, [_g.sent()]);
                            return [2 /*return*/, this._drawable('rectangle', paths, o)];
                    }
                });
            });
        };
        RoughGeneratorAsync.prototype.ellipse = function (x, y, width, height, options) {
            return __awaiter(this, void 0, Promise, function () {
                var o, paths, shape, _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            o = this._options(options);
                            paths = [];
                            if (!o.fill) return [3 /*break*/, 4];
                            if (!(o.fillStyle === 'solid')) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.lib.ellipse(x, y, width, height, o)];
                        case 1:
                            shape = _e.sent();
                            shape.type = 'fillPath';
                            paths.push(shape);
                            return [3 /*break*/, 4];
                        case 2:
                            _b = (_a = paths).push;
                            return [4 /*yield*/, this.lib.patternFillEllipse(x, y, width, height, o)];
                        case 3:
                            _b.apply(_a, [_e.sent()]);
                            _e.label = 4;
                        case 4:
                            _d = (_c = paths).push;
                            return [4 /*yield*/, this.lib.ellipse(x, y, width, height, o)];
                        case 5:
                            _d.apply(_c, [_e.sent()]);
                            return [2 /*return*/, this._drawable('ellipse', paths, o)];
                    }
                });
            });
        };
        RoughGeneratorAsync.prototype.circle = function (x, y, diameter, options) {
            return __awaiter(this, void 0, Promise, function () {
                var ret;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.ellipse(x, y, diameter, diameter, options)];
                        case 1:
                            ret = _a.sent();
                            ret.shape = 'circle';
                            return [2 /*return*/, ret];
                    }
                });
            });
        };
        RoughGeneratorAsync.prototype.linearPath = function (points, options) {
            return __awaiter(this, void 0, Promise, function () {
                var o, _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            o = this._options(options);
                            _a = this._drawable;
                            _b = ['linearPath'];
                            return [4 /*yield*/, this.lib.linearPath(points, false, o)];
                        case 1: return [2 /*return*/, _a.apply(this, _b.concat([[_c.sent()], o]))];
                    }
                });
            });
        };
        RoughGeneratorAsync.prototype.arc = function (x, y, width, height, start, stop, closed, options) {
            if (closed === void 0) { closed = false; }
            return __awaiter(this, void 0, Promise, function () {
                var o, paths, shape, _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            o = this._options(options);
                            paths = [];
                            if (!(closed && o.fill)) return [3 /*break*/, 4];
                            if (!(o.fillStyle === 'solid')) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.lib.arc(x, y, width, height, start, stop, true, false, o)];
                        case 1:
                            shape = _e.sent();
                            shape.type = 'fillPath';
                            paths.push(shape);
                            return [3 /*break*/, 4];
                        case 2:
                            _b = (_a = paths).push;
                            return [4 /*yield*/, this.lib.patternFillArc(x, y, width, height, start, stop, o)];
                        case 3:
                            _b.apply(_a, [_e.sent()]);
                            _e.label = 4;
                        case 4:
                            _d = (_c = paths).push;
                            return [4 /*yield*/, this.lib.arc(x, y, width, height, start, stop, closed, true, o)];
                        case 5:
                            _d.apply(_c, [_e.sent()]);
                            return [2 /*return*/, this._drawable('arc', paths, o)];
                    }
                });
            });
        };
        RoughGeneratorAsync.prototype.curve = function (points, options) {
            return __awaiter(this, void 0, Promise, function () {
                var o, _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            o = this._options(options);
                            _a = this._drawable;
                            _b = ['curve'];
                            return [4 /*yield*/, this.lib.curve(points, o)];
                        case 1: return [2 /*return*/, _a.apply(this, _b.concat([[_c.sent()], o]))];
                    }
                });
            });
        };
        RoughGeneratorAsync.prototype.polygon = function (points, options) {
            return __awaiter(this, void 0, Promise, function () {
                var o, paths, _a, _b, size, fillPoints, shape, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            o = this._options(options);
                            paths = [];
                            if (!o.fill) return [3 /*break*/, 4];
                            if (!(o.fillStyle === 'solid')) return [3 /*break*/, 2];
                            _b = (_a = paths).push;
                            return [4 /*yield*/, this.lib.solidFillPolygon(points, o)];
                        case 1:
                            _b.apply(_a, [_e.sent()]);
                            return [3 /*break*/, 4];
                        case 2:
                            size = this.computePolygonSize(points);
                            fillPoints = [
                                [0, 0],
                                [size[0], 0],
                                [size[0], size[1]],
                                [0, size[1]]
                            ];
                            return [4 /*yield*/, this.lib.patternFillPolygon(fillPoints, o)];
                        case 3:
                            shape = _e.sent();
                            shape.type = 'path2Dpattern';
                            shape.size = size;
                            shape.path = this.polygonPath(points);
                            paths.push(shape);
                            _e.label = 4;
                        case 4:
                            _d = (_c = paths).push;
                            return [4 /*yield*/, this.lib.linearPath(points, true, o)];
                        case 5:
                            _d.apply(_c, [_e.sent()]);
                            return [2 /*return*/, this._drawable('polygon', paths, o)];
                    }
                });
            });
        };
        RoughGeneratorAsync.prototype.path = function (d, options) {
            return __awaiter(this, void 0, Promise, function () {
                var o, paths, shape, size, points, shape, _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            o = this._options(options);
                            paths = [];
                            if (!d) {
                                return [2 /*return*/, this._drawable('path', paths, o)];
                            }
                            if (!o.fill) return [3 /*break*/, 3];
                            if (!(o.fillStyle === 'solid')) return [3 /*break*/, 1];
                            shape = { type: 'path2Dfill', path: d, ops: [] };
                            paths.push(shape);
                            return [3 /*break*/, 3];
                        case 1:
                            size = this.computePathSize(d);
                            points = [
                                [0, 0],
                                [size[0], 0],
                                [size[0], size[1]],
                                [0, size[1]]
                            ];
                            return [4 /*yield*/, this.lib.patternFillPolygon(points, o)];
                        case 2:
                            shape = _c.sent();
                            shape.type = 'path2Dpattern';
                            shape.size = size;
                            shape.path = d;
                            paths.push(shape);
                            _c.label = 3;
                        case 3:
                            _b = (_a = paths).push;
                            return [4 /*yield*/, this.lib.svgPath(d, o)];
                        case 4:
                            _b.apply(_a, [_c.sent()]);
                            return [2 /*return*/, this._drawable('path', paths, o)];
                    }
                });
            });
        };
        return RoughGeneratorAsync;
    }(RoughGeneratorBase));

    var RoughCanvasAsync = /** @class */ (function (_super) {
        __extends(RoughCanvasAsync, _super);
        function RoughCanvasAsync(canvas, config) {
            var _this = _super.call(this, canvas) || this;
            _this.genAsync = new RoughGeneratorAsync(config || null, _this.canvas);
            return _this;
        }
        Object.defineProperty(RoughCanvasAsync.prototype, "generator", {
            get: function () {
                return this.genAsync;
            },
            enumerable: true,
            configurable: true
        });
        RoughCanvasAsync.prototype.getDefaultOptions = function () {
            return this.genAsync.defaultOptions;
        };
        RoughCanvasAsync.prototype.line = function (x1, y1, x2, y2, options) {
            return __awaiter(this, void 0, Promise, function () {
                var d;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.line(x1, y1, x2, y2, options)];
                        case 1:
                            d = _a.sent();
                            this.draw(d);
                            return [2 /*return*/, d];
                    }
                });
            });
        };
        RoughCanvasAsync.prototype.rectangle = function (x, y, width, height, options) {
            return __awaiter(this, void 0, Promise, function () {
                var d;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.rectangle(x, y, width, height, options)];
                        case 1:
                            d = _a.sent();
                            this.draw(d);
                            return [2 /*return*/, d];
                    }
                });
            });
        };
        RoughCanvasAsync.prototype.ellipse = function (x, y, width, height, options) {
            return __awaiter(this, void 0, Promise, function () {
                var d;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.ellipse(x, y, width, height, options)];
                        case 1:
                            d = _a.sent();
                            this.draw(d);
                            return [2 /*return*/, d];
                    }
                });
            });
        };
        RoughCanvasAsync.prototype.circle = function (x, y, diameter, options) {
            return __awaiter(this, void 0, Promise, function () {
                var d;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.circle(x, y, diameter, options)];
                        case 1:
                            d = _a.sent();
                            this.draw(d);
                            return [2 /*return*/, d];
                    }
                });
            });
        };
        RoughCanvasAsync.prototype.linearPath = function (points, options) {
            return __awaiter(this, void 0, Promise, function () {
                var d;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.linearPath(points, options)];
                        case 1:
                            d = _a.sent();
                            this.draw(d);
                            return [2 /*return*/, d];
                    }
                });
            });
        };
        RoughCanvasAsync.prototype.polygon = function (points, options) {
            return __awaiter(this, void 0, Promise, function () {
                var d;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.polygon(points, options)];
                        case 1:
                            d = _a.sent();
                            this.draw(d);
                            return [2 /*return*/, d];
                    }
                });
            });
        };
        RoughCanvasAsync.prototype.arc = function (x, y, width, height, start, stop, closed, options) {
            if (closed === void 0) { closed = false; }
            return __awaiter(this, void 0, Promise, function () {
                var d;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.arc(x, y, width, height, start, stop, closed, options)];
                        case 1:
                            d = _a.sent();
                            this.draw(d);
                            return [2 /*return*/, d];
                    }
                });
            });
        };
        RoughCanvasAsync.prototype.curve = function (points, options) {
            return __awaiter(this, void 0, Promise, function () {
                var d;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.curve(points, options)];
                        case 1:
                            d = _a.sent();
                            this.draw(d);
                            return [2 /*return*/, d];
                    }
                });
            });
        };
        RoughCanvasAsync.prototype.path = function (d, options) {
            return __awaiter(this, void 0, Promise, function () {
                var drawing;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.path(d, options)];
                        case 1:
                            drawing = _a.sent();
                            this.draw(drawing);
                            return [2 /*return*/, drawing];
                    }
                });
            });
        };
        return RoughCanvasAsync;
    }(RoughCanvasBase));

    var hasDocument$1 = typeof document !== 'undefined';
    var RoughSVGBase = /** @class */ (function () {
        function RoughSVGBase(svg) {
            this.svg = svg;
        }
        RoughSVGBase.createRenderer = function () {
            return new RoughRenderer();
        };
        Object.defineProperty(RoughSVGBase.prototype, "defs", {
            get: function () {
                var doc = this.svg.ownerDocument || (hasDocument$1 && document);
                if (doc) {
                    if (!this._defs) {
                        var dnode = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
                        if (this.svg.firstChild) {
                            this.svg.insertBefore(dnode, this.svg.firstChild);
                        }
                        else {
                            this.svg.appendChild(dnode);
                        }
                        this._defs = dnode;
                    }
                }
                return this._defs || null;
            },
            enumerable: true,
            configurable: true
        });
        RoughSVGBase.prototype.draw = function (drawable) {
            var sets = drawable.sets || [];
            var o = drawable.options || this.getDefaultOptions();
            var doc = this.svg.ownerDocument || (hasDocument$1 && document);
            var g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
            for (var _i = 0, sets_1 = sets; _i < sets_1.length; _i++) {
                var drawing = sets_1[_i];
                var path = null;
                switch (drawing.type) {
                    case 'path': {
                        path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
                        path.setAttribute('d', this.opsToPath(drawing));
                        path.style.stroke = o.stroke;
                        path.style.strokeWidth = o.strokeWidth + '';
                        path.style.fill = 'none';
                        break;
                    }
                    case 'fillPath': {
                        path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
                        path.setAttribute('d', this.opsToPath(drawing));
                        path.style.stroke = 'none';
                        path.style.strokeWidth = '0';
                        path.style.fill = o.fill || null;
                        break;
                    }
                    case 'fillSketch': {
                        path = this.fillSketch(doc, drawing, o);
                        break;
                    }
                    case 'path2Dfill': {
                        path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
                        path.setAttribute('d', drawing.path || '');
                        path.style.stroke = 'none';
                        path.style.strokeWidth = '0';
                        path.style.fill = o.fill || null;
                        break;
                    }
                    case 'path2Dpattern': {
                        if (!this.defs) {
                            console.error('Cannot render path2Dpattern. No defs/document defined.');
                        }
                        else {
                            var size = drawing.size;
                            var pattern = doc.createElementNS('http://www.w3.org/2000/svg', 'pattern');
                            var id = "rough-" + Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER || 999999));
                            pattern.setAttribute('id', id);
                            pattern.setAttribute('x', '0');
                            pattern.setAttribute('y', '0');
                            pattern.setAttribute('width', '1');
                            pattern.setAttribute('height', '1');
                            pattern.setAttribute('height', '1');
                            pattern.setAttribute('viewBox', "0 0 " + Math.round(size[0]) + " " + Math.round(size[1]));
                            pattern.setAttribute('patternUnits', 'objectBoundingBox');
                            var patternPath = this.fillSketch(doc, drawing, o);
                            pattern.appendChild(patternPath);
                            this.defs.appendChild(pattern);
                            path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
                            path.setAttribute('d', drawing.path || '');
                            path.style.stroke = 'none';
                            path.style.strokeWidth = '0';
                            path.style.fill = "url(#" + id + ")";
                        }
                        break;
                    }
                }
                if (path) {
                    g.appendChild(path);
                }
            }
            return g;
        };
        RoughSVGBase.prototype.fillSketch = function (doc, drawing, o) {
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
        };
        return RoughSVGBase;
    }());

    var RoughSVG = /** @class */ (function (_super) {
        __extends(RoughSVG, _super);
        function RoughSVG(svg, config) {
            var _this = _super.call(this, svg) || this;
            _this.gen = new RoughGenerator(config || null, _this.svg);
            return _this;
        }
        Object.defineProperty(RoughSVG.prototype, "generator", {
            get: function () {
                return this.gen;
            },
            enumerable: true,
            configurable: true
        });
        RoughSVG.prototype.getDefaultOptions = function () {
            return this.gen.defaultOptions;
        };
        RoughSVG.prototype.opsToPath = function (drawing) {
            return this.gen.opsToPath(drawing);
        };
        RoughSVG.prototype.line = function (x1, y1, x2, y2, options) {
            var d = this.gen.line(x1, y1, x2, y2, options);
            return this.draw(d);
        };
        RoughSVG.prototype.rectangle = function (x, y, width, height, options) {
            var d = this.gen.rectangle(x, y, width, height, options);
            return this.draw(d);
        };
        RoughSVG.prototype.ellipse = function (x, y, width, height, options) {
            var d = this.gen.ellipse(x, y, width, height, options);
            return this.draw(d);
        };
        RoughSVG.prototype.circle = function (x, y, diameter, options) {
            var d = this.gen.circle(x, y, diameter, options);
            return this.draw(d);
        };
        RoughSVG.prototype.linearPath = function (points, options) {
            var d = this.gen.linearPath(points, options);
            return this.draw(d);
        };
        RoughSVG.prototype.polygon = function (points, options) {
            var d = this.gen.polygon(points, options);
            return this.draw(d);
        };
        RoughSVG.prototype.arc = function (x, y, width, height, start, stop, closed, options) {
            if (closed === void 0) { closed = false; }
            var d = this.gen.arc(x, y, width, height, start, stop, closed, options);
            return this.draw(d);
        };
        RoughSVG.prototype.curve = function (points, options) {
            var d = this.gen.curve(points, options);
            return this.draw(d);
        };
        RoughSVG.prototype.path = function (d, options) {
            var drawing = this.gen.path(d, options);
            return this.draw(drawing);
        };
        return RoughSVG;
    }(RoughSVGBase));

    var RoughSVGAsync = /** @class */ (function (_super) {
        __extends(RoughSVGAsync, _super);
        function RoughSVGAsync(svg, config) {
            var _this = _super.call(this, svg) || this;
            _this.genAsync = new RoughGeneratorAsync(config || null, _this.svg);
            return _this;
        }
        Object.defineProperty(RoughSVGAsync.prototype, "generator", {
            get: function () {
                return this.genAsync;
            },
            enumerable: true,
            configurable: true
        });
        RoughSVGAsync.prototype.getDefaultOptions = function () {
            return this.genAsync.defaultOptions;
        };
        RoughSVGAsync.prototype.opsToPath = function (drawing) {
            return this.genAsync.opsToPath(drawing);
        };
        RoughSVGAsync.prototype.line = function (x1, y1, x2, y2, options) {
            return __awaiter(this, void 0, Promise, function () {
                var d;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.line(x1, y1, x2, y2, options)];
                        case 1:
                            d = _a.sent();
                            return [2 /*return*/, this.draw(d)];
                    }
                });
            });
        };
        RoughSVGAsync.prototype.rectangle = function (x, y, width, height, options) {
            return __awaiter(this, void 0, Promise, function () {
                var d;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.rectangle(x, y, width, height, options)];
                        case 1:
                            d = _a.sent();
                            return [2 /*return*/, this.draw(d)];
                    }
                });
            });
        };
        RoughSVGAsync.prototype.ellipse = function (x, y, width, height, options) {
            return __awaiter(this, void 0, Promise, function () {
                var d;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.ellipse(x, y, width, height, options)];
                        case 1:
                            d = _a.sent();
                            return [2 /*return*/, this.draw(d)];
                    }
                });
            });
        };
        RoughSVGAsync.prototype.circle = function (x, y, diameter, options) {
            return __awaiter(this, void 0, Promise, function () {
                var d;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.circle(x, y, diameter, options)];
                        case 1:
                            d = _a.sent();
                            return [2 /*return*/, this.draw(d)];
                    }
                });
            });
        };
        RoughSVGAsync.prototype.linearPath = function (points, options) {
            return __awaiter(this, void 0, Promise, function () {
                var d;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.linearPath(points, options)];
                        case 1:
                            d = _a.sent();
                            return [2 /*return*/, this.draw(d)];
                    }
                });
            });
        };
        RoughSVGAsync.prototype.polygon = function (points, options) {
            return __awaiter(this, void 0, Promise, function () {
                var d;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.polygon(points, options)];
                        case 1:
                            d = _a.sent();
                            return [2 /*return*/, this.draw(d)];
                    }
                });
            });
        };
        RoughSVGAsync.prototype.arc = function (x, y, width, height, start, stop, closed, options) {
            if (closed === void 0) { closed = false; }
            return __awaiter(this, void 0, Promise, function () {
                var d;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.arc(x, y, width, height, start, stop, closed, options)];
                        case 1:
                            d = _a.sent();
                            return [2 /*return*/, this.draw(d)];
                    }
                });
            });
        };
        RoughSVGAsync.prototype.curve = function (points, options) {
            return __awaiter(this, void 0, Promise, function () {
                var d;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.curve(points, options)];
                        case 1:
                            d = _a.sent();
                            return [2 /*return*/, this.draw(d)];
                    }
                });
            });
        };
        RoughSVGAsync.prototype.path = function (d, options) {
            return __awaiter(this, void 0, Promise, function () {
                var drawing;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.genAsync.path(d, options)];
                        case 1:
                            drawing = _a.sent();
                            return [2 /*return*/, this.draw(drawing)];
                    }
                });
            });
        };
        return RoughSVGAsync;
    }(RoughSVGBase));

    var rough = {
        canvas: function (canvas, config) {
            if (config && config.async) {
                return new RoughCanvasAsync(canvas, config);
            }
            return new RoughCanvas(canvas, config);
        },
        svg: function (svg, config) {
            if (config && config.async) {
                return new RoughSVGAsync(svg, config);
            }
            return new RoughSVG(svg, config);
        },
        createRenderer: function () {
            return RoughCanvas.createRenderer();
        },
        generator: function (config, surface) {
            if (config && config.async) {
                return new RoughGeneratorAsync(config, surface);
            }
            return new RoughGenerator(config, surface);
        }
    };

    return rough;

}());
