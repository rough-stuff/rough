import { HachureFiller } from './hachure-filler';
export class ZigZagFiller extends HachureFiller {
    fillPolygon(points, o) {
        return this._fillPolygon(points, o, true);
    }
    fillEllipse(cx, cy, width, height, o) {
        return this._fillEllipse(cx, cy, width, height, o, true);
    }
}
