import { ResolvedOptions, Drawable } from './core';
export declare abstract class RoughCanvasBase {
    protected canvas: HTMLCanvasElement;
    protected ctx: CanvasRenderingContext2D;
    constructor(canvas: HTMLCanvasElement);
    abstract getDefaultOptions(): ResolvedOptions;
    draw(drawable: Drawable): void;
    private computeBBox;
    private fillSketch;
    private _drawToContext;
}
