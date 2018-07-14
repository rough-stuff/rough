import { RoughGeneratorAsync } from './generator-async';
import { RoughCanvasBase } from './canvas-base';
export class RoughCanvasAsync extends RoughCanvasBase {
    constructor(canvas, config) {
        super(canvas);
        this.genAsync = new RoughGeneratorAsync(config || null, this.canvas);
    }
    get generator() {
        return this.genAsync;
    }
    getDefaultOptions() {
        return this.genAsync.defaultOptions;
    }
    async line(x1, y1, x2, y2, options) {
        const d = await this.genAsync.line(x1, y1, x2, y2, options);
        this.draw(d);
        return d;
    }
    async rectangle(x, y, width, height, options) {
        const d = await this.genAsync.rectangle(x, y, width, height, options);
        this.draw(d);
        return d;
    }
    async ellipse(x, y, width, height, options) {
        const d = await this.genAsync.ellipse(x, y, width, height, options);
        this.draw(d);
        return d;
    }
    async circle(x, y, diameter, options) {
        const d = await this.genAsync.circle(x, y, diameter, options);
        this.draw(d);
        return d;
    }
    async linearPath(points, options) {
        const d = await this.genAsync.linearPath(points, options);
        this.draw(d);
        return d;
    }
    async polygon(points, options) {
        const d = await this.genAsync.polygon(points, options);
        this.draw(d);
        return d;
    }
    async arc(x, y, width, height, start, stop, closed = false, options) {
        const d = await this.genAsync.arc(x, y, width, height, start, stop, closed, options);
        this.draw(d);
        return d;
    }
    async curve(points, options) {
        const d = await this.genAsync.curve(points, options);
        this.draw(d);
        return d;
    }
    async path(d, options) {
        const drawing = await this.genAsync.path(d, options);
        this.draw(drawing);
        return drawing;
    }
}
