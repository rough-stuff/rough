import { hachureLinesForPolygon, hachureLinesForEllipse, lineLength } from './filler-utils';
import { randOffsetWithRange, ellipse } from '../renderer';
export class DotFiller {
    fillPolygon(points, o) {
        o = Object.assign({}, o, { curveStepCount: 4, hachureAngle: 0 });
        const lines = hachureLinesForPolygon(points, o);
        return this.dotsOnLines(lines, o);
    }
    fillEllipse(cx, cy, width, height, o) {
        o = Object.assign({}, o, { curveStepCount: 4, hachureAngle: 0 });
        const lines = hachureLinesForEllipse(cx, cy, width, height, o);
        return this.dotsOnLines(lines, o);
    }
    dotsOnLines(lines, o) {
        let ops = [];
        let gap = o.hachureGap;
        if (gap < 0) {
            gap = o.strokeWidth * 4;
        }
        gap = Math.max(gap, 0.1);
        let fweight = o.fillWeight;
        if (fweight < 0) {
            fweight = o.strokeWidth / 2;
        }
        for (const line of lines) {
            const length = lineLength(line);
            const dl = length / gap;
            const count = Math.ceil(dl) - 1;
            const alpha = Math.atan((line[1][1] - line[0][1]) / (line[1][0] - line[0][0]));
            for (let i = 0; i < count; i++) {
                const l = gap * (i + 1);
                const dy = l * Math.sin(alpha);
                const dx = l * Math.cos(alpha);
                const c = [line[0][0] - dx, line[0][1] + dy];
                const cx = randOffsetWithRange(c[0] - gap / 4, c[0] + gap / 4, o);
                const cy = randOffsetWithRange(c[1] - gap / 4, c[1] + gap / 4, o);
                const el = ellipse(cx, cy, fweight, fweight, o);
                ops = ops.concat(el.ops);
            }
        }
        return { type: 'fillSketch', ops };
    }
}
