import { RoughSVG } from './svg';
import { RoughGeneratorAsync } from './generator-async';
export class RoughSVGAsync extends RoughSVG {
    constructor(svg, config) {
        super(svg, config);
        this.genAsync = new RoughGeneratorAsync(config || null, this.svg);
    }
    // @ts-ignore
    get generator() {
        return this.genAsync;
    }
    // @ts-ignore
    async line(x1, y1, x2, y2, options) {
        const d = await this.genAsync.line(x1, y1, x2, y2, options);
        return this.draw(d);
    }
    // @ts-ignore
    async rectangle(x, y, width, height, options) {
        const d = await this.genAsync.rectangle(x, y, width, height, options);
        return this.draw(d);
    }
    // @ts-ignore
    async ellipse(x, y, width, height, options) {
        const d = await this.genAsync.ellipse(x, y, width, height, options);
        return this.draw(d);
    }
    // @ts-ignore
    async circle(x, y, diameter, options) {
        const d = await this.genAsync.circle(x, y, diameter, options);
        return this.draw(d);
    }
    // @ts-ignore
    async linearPath(points, options) {
        const d = await this.genAsync.linearPath(points, options);
        return this.draw(d);
    }
    // @ts-ignore
    async polygon(points, options) {
        const d = await this.genAsync.polygon(points, options);
        return this.draw(d);
    }
    // @ts-ignore
    async arc(x, y, width, height, start, stop, closed = false, options) {
        const d = await this.genAsync.arc(x, y, width, height, start, stop, closed, options);
        return this.draw(d);
    }
    // @ts-ignore
    async curve(points, options) {
        const d = await this.genAsync.curve(points, options);
        return this.draw(d);
    }
    // @ts-ignore
    async path(d, options) {
        const drawing = await this.genAsync.path(d, options);
        return this.draw(drawing);
    }
}
