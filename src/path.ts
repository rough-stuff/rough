import { Point } from './geometry';

interface PathToken {
  type: number;
  text: string;
}

function isType(token: PathToken, type: number) {
  return token.type === type;
}

export interface Segment {
  key: string;
  data: number[];
  point?: Point;
}

const PARAMS: { [key: string]: number } = {
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

class ParsedPath {
  private COMMAND = 0;
  private NUMBER = 1;
  private EOD = 2;
  private _closed?: boolean;
  segments: Segment[] = [];

  constructor(d: string) {
    this.parseData(d);
    this.processPoints();
  }

  private tokenize(d: string): PathToken[] {
    const tokens: PathToken[] = new Array();
    while (d !== '') {
      if (d.match(/^([ \t\r\n,]+)/)) {
        d = d.substr(RegExp.$1.length);
      } else if (d.match(/^([aAcChHlLmMqQsStTvVzZ])/)) {
        tokens[tokens.length] = { type: this.COMMAND, text: RegExp.$1 };
        d = d.substr(RegExp.$1.length);
      } else if (d.match(/^(([-+]?[0-9]+(\.[0-9]*)?|[-+]?\.[0-9]+)([eE][-+]?[0-9]+)?)/)) {
        tokens[tokens.length] = { type: this.NUMBER, text: `${parseFloat(RegExp.$1)}` };
        d = d.substr(RegExp.$1.length);
      } else {
        console.error('Unrecognized segment command: ' + d);
        return [];
      }
    }
    tokens[tokens.length] = { type: this.EOD, text: '' };
    return tokens;
  }

  private parseData(d: string) {
    const tokens = this.tokenize(d);
    let index = 0;
    let token = tokens[index];
    let mode: string = 'BOD';
    this.segments = new Array();
    while (!isType(token, this.EOD)) {
      let param_length: number;
      const params: number[] = new Array();
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
      if ((index + param_length) < tokens.length) {
        for (let i = index; i < index + param_length; i++) {
          const numbeToken = tokens[i];
          if (isType(numbeToken, this.NUMBER)) {
            params[params.length] = +numbeToken.text;
          }
          else {
            console.error('Parameter type is not a number: ' + mode + ',' + numbeToken.text);
            return;
          }
        }
        if (typeof PARAMS[mode] === 'number') {
          const segment: Segment = { key: mode, data: params };
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

  get closed() {
    if (typeof this._closed === 'undefined') {
      this._closed = false;
      for (const s of this.segments) {
        if (s.key.toLowerCase() === 'z') {
          this._closed = true;
        }
      }
    }
    return this._closed;
  }

  processPoints() {
    let first: Point | null = null;
    let currentPoint: Point = [0, 0];
    for (let i = 0; i < this.segments.length; i++) {
      const s = this.segments[i];
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
}

export class RoughPath {
  private parsed: ParsedPath;
  private _position: Point = [0, 0];
  private _first: Point | null = null;
  private _linearPoints?: Point[][];
  bezierReflectionPoint: Point | null = null;
  quadReflectionPoint: Point | null = null;

  constructor(d: string) {
    this.parsed = new ParsedPath(d);
  }

  get segments(): Segment[] {
    return this.parsed.segments;
  }

  get closed(): boolean {
    return this.parsed.closed;
  }

  get linearPoints(): Point[][] {
    if (!this._linearPoints) {
      const lp: Point[][] = [];
      let points: Point[] = [];
      for (const s of this.parsed.segments) {
        const key = s.key.toLowerCase();
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

  get first(): Point | null {
    return this._first;
  }

  set first(v: Point | null) {
    this._first = v;
  }

  setPosition(x: number, y: number) {
    this._position = [x, y];
    if (!this._first) {
      this._first = [x, y];
    }
  }

  get position(): Point {
    return this._position;
  }

  get x(): number {
    return this._position[0];
  }

  get y(): number {
    return this._position[1];
  }
}


export interface RoughArcSegment {
  cp1: Point;
  cp2: Point;
  to: Point;
}

// Algorithm as described in https://www.w3.org/TR/SVG/implnote.html
// Code adapted from nsSVGPathDataParser.cpp in Mozilla 
// https://hg.mozilla.org/mozilla-central/file/17156fbebbc8/content/svg/content/src/nsSVGPathDataParser.cpp#l887
export class RoughArcConverter {
  private _segIndex = 0;
  private _numSegs = 0;
  private _rx = 0;
  private _ry = 0;
  private _sinPhi = 0;
  private _cosPhi = 0;
  private _C: Point = [0, 0];
  private _theta = 0;
  private _delta = 0;
  private _T = 0;
  private _from: Point;

  constructor(from: Point, to: Point, radii: Point, angle: number, largeArcFlag: boolean, sweepFlag: boolean) {
    this._from = from;
    if (from[0] === to[0] && from[1] === to[1]) {
      return;
    }
    const radPerDeg = Math.PI / 180;
    this._rx = Math.abs(radii[0]);
    this._ry = Math.abs(radii[1]);
    this._sinPhi = Math.sin(angle * radPerDeg);
    this._cosPhi = Math.cos(angle * radPerDeg);
    const x1dash = this._cosPhi * (from[0] - to[0]) / 2.0 + this._sinPhi * (from[1] - to[1]) / 2.0;
    const y1dash = -this._sinPhi * (from[0] - to[0]) / 2.0 + this._cosPhi * (from[1] - to[1]) / 2.0;
    let root = 0;
    const numerator = this._rx * this._rx * this._ry * this._ry - this._rx * this._rx * y1dash * y1dash - this._ry * this._ry * x1dash * x1dash;
    if (numerator < 0) {
      const s = Math.sqrt(1 - (numerator / (this._rx * this._rx * this._ry * this._ry)));
      this._rx = this._rx * s;
      this._ry = this._ry * s;
      root = 0;
    } else {
      root = (largeArcFlag === sweepFlag ? -1.0 : 1.0) *
        Math.sqrt(numerator / (this._rx * this._rx * y1dash * y1dash + this._ry * this._ry * x1dash * x1dash));
    }
    const cxdash = root * this._rx * y1dash / this._ry;
    const cydash = -root * this._ry * x1dash / this._rx;
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
  }

  getNextSegment(): RoughArcSegment | null {
    if (this._segIndex === this._numSegs) {
      return null;
    }
    const cosTheta1 = Math.cos(this._theta);
    const sinTheta1 = Math.sin(this._theta);
    const theta2 = this._theta + this._delta;
    const cosTheta2 = Math.cos(theta2);
    const sinTheta2 = Math.sin(theta2);

    const to: Point = [
      this._cosPhi * this._rx * cosTheta2 - this._sinPhi * this._ry * sinTheta2 + this._C[0],
      this._sinPhi * this._rx * cosTheta2 + this._cosPhi * this._ry * sinTheta2 + this._C[1]
    ];
    const cp1: Point = [
      this._from[0] + this._T * (- this._cosPhi * this._rx * sinTheta1 - this._sinPhi * this._ry * cosTheta1),
      this._from[1] + this._T * (- this._sinPhi * this._rx * sinTheta1 + this._cosPhi * this._ry * cosTheta1)
    ];
    const cp2: Point = [
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

  calculateVectorAngle(ux: number, uy: number, vx: number, vy: number): number {
    const ta = Math.atan2(uy, ux);
    const tb = Math.atan2(vy, vx);
    if (tb >= ta)
      return tb - ta;
    return 2 * Math.PI - (ta - tb);
  }
}

export class PathFitter {
  sets: Point[][];
  closed: boolean;

  constructor(sets: Point[][], closed: boolean) {
    this.sets = sets;
    this.closed = closed;
  }

  fit(simplification: number): string {
    const outSets: Point[][] = [];
    for (const set of this.sets) {
      const length = set.length;
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
        const point = set[i];
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
    return d;
  }

  distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
  }

  reduce(set: Point[], count: number): Point[] {
    if (set.length <= count) {
      return set;
    }
    const points: Point[] = set.slice(0);
    while (points.length > count) {
      const areas = [];
      let minArea = -1;
      let minIndex = -1;
      for (let i = 1; i < (points.length - 1); i++) {
        const a = this.distance(points[i - 1], points[i]);
        const b = this.distance(points[i], points[i + 1]);
        const c = this.distance(points[i - 1], points[i + 1]);
        const s = (a + b + c) / 2.0;
        const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
        areas.push(area);
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