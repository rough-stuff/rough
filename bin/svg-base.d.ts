import { Drawable, OpSet, ResolvedOptions } from './core';
export declare abstract class RoughSVGBase {
    protected svg: SVGSVGElement;
    protected _defs?: SVGDefsElement;
    constructor(svg: SVGSVGElement);
    abstract getDefaultOptions(): ResolvedOptions;
    abstract opsToPath(drawing: OpSet): string;
    readonly defs: SVGDefsElement | null;
    draw(drawable: Drawable): SVGGElement;
    private fillSketch;
}
