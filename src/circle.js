import { RoughEllipse } from './ellipse';

export class RoughCircle extends RoughEllipse {
  constructor(x, y, radius) {
    super(x, y, radius * 2);
  }

  get radius() {
    return this.width / 2;
  }

  set radius(value) {
    this.width = value * 2;
    this.height = value * 2;
  }
}