import { Segment } from '../geometry';
import { HachureIterator } from '../utils/hachure';
export class HachureFiller {
    constructor(renderer) {
        this.renderer = renderer;
    }
    fillPolygon(points, o) {
        return this._fillPolygon(points, o);
    }
    fillEllipse(cx, cy, width, height, o) {
        return this._fillEllipse(cx, cy, width, height, o);
    }
    _fillPolygon(points, o, connectEnds = false) {
        let ops = [];
        if (points && points.length) {
            let left = points[0][0];
            let right = points[0][0];
            let top = points[0][1];
            let bottom = points[0][1];
            for (let i = 1; i < points.length; i++) {
                left = Math.min(left, points[i][0]);
                right = Math.max(right, points[i][0]);
                top = Math.min(top, points[i][1]);
                bottom = Math.max(bottom, points[i][1]);
            }
            const angle = o.hachureAngle;
            let gap = o.hachureGap;
            if (gap < 0) {
                gap = o.strokeWidth * 4;
            }
            gap = Math.max(gap, 0.1);
            const radPerDeg = Math.PI / 180;
            const hachureAngle = (angle % 180) * radPerDeg;
            const cosAngle = Math.cos(hachureAngle);
            const sinAngle = Math.sin(hachureAngle);
            const tanAngle = Math.tan(hachureAngle);
            const it = new HachureIterator(top - 1, bottom + 1, left - 1, right + 1, gap, sinAngle, cosAngle, tanAngle);
            let rect;
            let prevPoint = null;
            while ((rect = it.nextLine()) != null) {
                const lines = this.getIntersectingLines(rect, points);
                for (let i = 0; i < lines.length; i++) {
                    if (i < (lines.length - 1)) {
                        const p1 = lines[i];
                        const p2 = lines[i + 1];
                        ops = ops.concat(this.renderer.doubleLine(p1[0], p1[1], p2[0], p2[1], o));
                        if (connectEnds && prevPoint) {
                            ops = ops.concat(this.renderer.doubleLine(prevPoint[0], prevPoint[1], p1[0], p1[1], o));
                        }
                        prevPoint = p2;
                    }
                }
            }
        }
        return { type: 'fillSketch', ops };
    }
    _fillEllipse(cx, cy, width, height, o, connectEnds = false) {
        let ops = [];
        let rx = Math.abs(width / 2);
        let ry = Math.abs(height / 2);
        rx += this.renderer.getOffset(-rx * 0.05, rx * 0.05, o);
        ry += this.renderer.getOffset(-ry * 0.05, ry * 0.05, o);
        const angle = o.hachureAngle;
        let gap = o.hachureGap;
        if (gap <= 0) {
            gap = o.strokeWidth * 4;
        }
        let fweight = o.fillWeight;
        if (fweight < 0) {
            fweight = o.strokeWidth / 2;
        }
        const radPerDeg = Math.PI / 180;
        const hachureAngle = (angle % 180) * radPerDeg;
        const tanAngle = Math.tan(hachureAngle);
        const aspectRatio = ry / rx;
        const hyp = Math.sqrt(aspectRatio * tanAngle * aspectRatio * tanAngle + 1);
        const sinAnglePrime = aspectRatio * tanAngle / hyp;
        const cosAnglePrime = 1 / hyp;
        const gapPrime = gap / ((rx * ry / Math.sqrt((ry * cosAnglePrime) * (ry * cosAnglePrime) + (rx * sinAnglePrime) * (rx * sinAnglePrime))) / rx);
        let halfLen = Math.sqrt((rx * rx) - (cx - rx + gapPrime) * (cx - rx + gapPrime));
        let prevPoint = null;
        for (let xPos = cx - rx + gapPrime; xPos < cx + rx; xPos += gapPrime) {
            halfLen = Math.sqrt((rx * rx) - (cx - xPos) * (cx - xPos));
            const p1 = this.affine(xPos, cy - halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
            const p2 = this.affine(xPos, cy + halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
            ops = ops.concat(this.renderer.doubleLine(p1[0], p1[1], p2[0], p2[1], o));
            if (connectEnds && prevPoint) {
                ops = ops.concat(this.renderer.doubleLine(prevPoint[0], prevPoint[1], p1[0], p1[1], o));
            }
            prevPoint = p2;
        }
        return { type: 'fillSketch', ops };
    }
    getIntersectingLines(line, points) {
        const intersections = [];
        const s1 = new Segment([line[0], line[1]], [line[2], line[3]]);
        for (let i = 0; i < points.length; i++) {
            const s2 = new Segment(points[i], points[(i + 1) % points.length]);
            if (s1.intersects(s2)) {
                intersections.push([s1.xi, s1.yi]);
            }
        }
        return intersections;
    }
    affine(x, y, cx, cy, sinAnglePrime, cosAnglePrime, R) {
        const A = -cx * cosAnglePrime - cy * sinAnglePrime + cx;
        const B = R * (cx * sinAnglePrime - cy * cosAnglePrime) + cy;
        const C = cosAnglePrime;
        const D = sinAnglePrime;
        const E = -R * sinAnglePrime;
        const F = R * cosAnglePrime;
        return [
            A + C * x + D * y,
            B + E * x + F * y
        ];
    }
}
