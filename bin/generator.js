import { RoughGeneratorBase } from './generator-base';
export class RoughGenerator extends RoughGeneratorBase {
    constructor(config, surface) {
        super(config, surface);
    }
    line(x1, y1, x2, y2, options) {
        const o = this._options(options);
        return this._drawable('line', [this.lib.line(x1, y1, x2, y2, o)], o);
    }
    rectangle(x, y, width, height, options) {
        const o = this._options(options);
        const paths = [];
        if (o.fill) {
            const points = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
            if (o.fillStyle === 'solid') {
                paths.push(this.lib.solidFillPolygon(points, o));
            }
            else {
                paths.push(this.lib.patternFillPolygon(points, o));
            }
        }
        paths.push(this.lib.rectangle(x, y, width, height, o));
        return this._drawable('rectangle', paths, o);
    }
    ellipse(x, y, width, height, options) {
        const o = this._options(options);
        const paths = [];
        if (o.fill) {
            if (o.fillStyle === 'solid') {
                const shape = this.lib.ellipse(x, y, width, height, o);
                shape.type = 'fillPath';
                paths.push(shape);
            }
            else {
                paths.push(this.lib.patternFillEllipse(x, y, width, height, o));
            }
        }
        paths.push(this.lib.ellipse(x, y, width, height, o));
        return this._drawable('ellipse', paths, o);
    }
    circle(x, y, diameter, options) {
        const ret = this.ellipse(x, y, diameter, diameter, options);
        ret.shape = 'circle';
        return ret;
    }
    linearPath(points, options) {
        const o = this._options(options);
        return this._drawable('linearPath', [this.lib.linearPath(points, false, o)], o);
    }
    arc(x, y, width, height, start, stop, closed = false, options) {
        const o = this._options(options);
        const paths = [];
        if (closed && o.fill) {
            if (o.fillStyle === 'solid') {
                const shape = this.lib.arc(x, y, width, height, start, stop, true, false, o);
                shape.type = 'fillPath';
                paths.push(shape);
            }
            else {
                paths.push(this.lib.patternFillArc(x, y, width, height, start, stop, o));
            }
        }
        paths.push(this.lib.arc(x, y, width, height, start, stop, closed, true, o));
        return this._drawable('arc', paths, o);
    }
    curve(points, options) {
        const o = this._options(options);
        return this._drawable('curve', [this.lib.curve(points, o)], o);
    }
    polygon(points, options) {
        const o = this._options(options);
        const paths = [];
        if (o.fill) {
            if (o.fillStyle === 'solid') {
                paths.push(this.lib.solidFillPolygon(points, o));
            }
            else {
                const size = this.computePolygonSize(points);
                const fillPoints = [
                    [0, 0],
                    [size[0], 0],
                    [size[0], size[1]],
                    [0, size[1]]
                ];
                const shape = this.lib.patternFillPolygon(fillPoints, o);
                shape.type = 'path2Dpattern';
                shape.size = size;
                shape.path = this.polygonPath(points);
                paths.push(shape);
            }
        }
        paths.push(this.lib.linearPath(points, true, o));
        return this._drawable('polygon', paths, o);
    }
    path(d, options) {
        const o = this._options(options);
        const paths = [];
        if (!d) {
            return this._drawable('path', paths, o);
        }
        if (o.fill) {
            if (o.fillStyle === 'solid') {
                const shape = { type: 'path2Dfill', path: d, ops: [] };
                paths.push(shape);
            }
            else {
                const size = this.computePathSize(d);
                const points = [
                    [0, 0],
                    [size[0], 0],
                    [size[0], size[1]],
                    [0, size[1]]
                ];
                const shape = this.lib.patternFillPolygon(points, o);
                shape.type = 'path2Dpattern';
                shape.size = size;
                shape.path = d;
                paths.push(shape);
            }
        }
        paths.push(this.lib.svgPath(d, o));
        return this._drawable('path', paths, o);
    }
}
