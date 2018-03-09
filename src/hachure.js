import { RoughSegmentRelation, RoughSegment } from "./segment";

export class RoughHachureIterator {
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