export function RoughSegmentRelation() {
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

export class RoughSegment {
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