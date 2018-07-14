import { ResolvedOptions, Drawable } from './core';
import { RoughRenderer } from './renderer';
export declare abstract class RoughCanvasBase {
    protected canvas: HTMLCanvasElement;
    protected ctx: CanvasRenderingContext2D;
    constructor(canvas: HTMLCanvasElement);
    static createRenderer(): RoughRenderer;
    abstract getDefaultOptions(): ResolvedOptions;
    draw(drawable: Drawable): void;
    private computeBBox;
    private fillSketch;
    private _drawToContext;
}
