import { Segment } from '../geometry';

export class HachureIterator {
  top: number;
  bottom: number;
  left: number;
  right: number;
  gap: number;
  sinAngle: number;
  tanAngle: number;
  pos: number;
  deltaX: number = 0;
  hGap: number = 0;
  sLeft?: Segment;
  sRight?: Segment;

  constructor(top: number, bottom: number, left: number, right: number, gap: number, sinAngle: number, cosAngle: number, tanAngle: number) {
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

  nextLine(): number[] | null {
    if (Math.abs(this.sinAngle) < 0.0001) {
      if (this.pos < this.right) {
        const line = [this.pos, this.top, this.pos, this.bottom];
        this.pos += this.gap;
        return line;
      }
    } else if (Math.abs(this.sinAngle) > 0.9999) {
      if (this.pos < this.bottom) {
        const line = [this.left, this.pos, this.right, this.pos];
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
        const s = new Segment([xLower, yLower], [xUpper, yUpper]);
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
        const line = [xLower, yLower, xUpper, yUpper];
        this.pos += this.hGap;
        return line;
      }
    }
    return null;
  }
}