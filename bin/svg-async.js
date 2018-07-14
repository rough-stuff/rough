import { RoughGeneratorAsync } from './generator-async';
import { RoughSVGBase } from './svg-base';
export class RoughSVGAsync extends RoughSVGBase {
    constructor(svg, config) {
        super(svg);
        this.genAsync = new RoughGeneratorAsync(config || null, this.svg);
    }
    get generator() {
        return this.genAsync;
    }
    getDefaultOptions() {
        return this.genAsync.defaultOptions;
    }
    opsToPath(drawing) {
        return this.genAsync.opsToPath(drawing);
    }
    async line(x1, y1, x2, y2, options) {
        const d = await this.genAsync.line(x1, y1, x2, y2, options);
        return this.draw(d);
    }
    async rectangle(x, y, width, height, options) {
        const d = await this.genAsync.rectangle(x, y, width, height, options);
        return this.draw(d);
    }
    async ellipse(x, y, width, height, options) {
        const d = await this.genAsync.ellipse(x, y, width, height, options);
        return this.draw(d);
    }
    async circle(x, y, diameter, options) {
        const d = await this.genAsync.circle(x, y, diameter, options);
        return this.draw(d);
    }
    async linearPath(points, options) {
        const d = await this.genAsync.linearPath(points, options);
        return this.draw(d);
    }
    async polygon(points, options) {
        const d = await this.genAsync.polygon(points, options);
        return this.draw(d);
    }
    async arc(x, y, width, height, start, stop, closed = false, options) {
        const d = await this.genAsync.arc(x, y, width, height, start, stop, closed, options);
        return this.draw(d);
    }
    async curve(points, options) {
        const d = await this.genAsync.curve(points, options);
        return this.draw(d);
    }
    async path(d, options) {
        const drawing = await this.genAsync.path(d, options);
        return this.draw(drawing);
    }
}
