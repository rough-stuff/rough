export declare type Point = [number, number];

export declare type Line = [Point, Point];

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Segment {
  px1: number;
  px2: number;
  py1: number;
  py2: number;
  xi = Number.MAX_VALUE;
  yi = Number.MAX_VALUE;
  a: number;
  b: number;
  c: number;
  _undefined: boolean;

  constructor(p1: Point, p2: Point) {
    this.px1 = p1[0];
    this.py1 = p1[1];
    this.px2 = p2[0];
    this.py2 = p2[1];
    this.a = this.py2 - this.py1;
    this.b = this.px1 - this.px2;
    this.c = this.px2 * this.py1 - this.px1 * this.py2;
    this._undefined = ((this.a === 0) && (this.b === 0) && (this.c === 0));
  }

  isUndefined() {
    return this._undefined;
  }

  intersects(otherSegment: Segment): boolean {
    if (this.isUndefined() || otherSegment.isUndefined()) {
      return false;
    }
    let grad1 = Number.MAX_VALUE;
    let grad2 = Number.MAX_VALUE;
    let int1 = 0, int2 = 0;
    const a = this.a, b = this.b, c = this.c;

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
  }
}

export function linerIntersection(l1: Line, l2: Line): Point | null {
  const a1 = l1[1][1] - l1[0][1];
  const b1 = l1[0][0] - l1[1][0];
  const c1 = a1 * l1[0][0] + b1 * l1[0][1];

  const a2 = l2[1][1] - l2[0][1];
  const b2 = l2[0][0] - l2[1][0];
  const c2 = a2 * l2[0][0] + b2 * l2[0][1];

  const determinant = a1 * b2 - a2 * b1;

  if (determinant) {
    return [
      Math.round((b2 * c1 - b1 * c2) / determinant),
      Math.round((a1 * c2 - a2 * c1) / determinant)
    ];
  }
  return null;
}

export function centroid(points: Point[]): Point {
  let area = 0, cx = 0, cy = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const next = i === (points.length - 1) ? points[0] : points[i + 1];
    area += p[0] * next[1] - next[0] * p[1];
  }
  area = area / 2;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const next = i === (points.length - 1) ? points[0] : points[i + 1];
    cx += (p[0] + next[0]) * (p[0] * next[1] - next[0] * p[1]);
    cy += (p[1] + next[1]) * (p[0] * next[1] - next[0] * p[1]);
  }
  return [cx / (6 * area), cy / (6 * area)];
}