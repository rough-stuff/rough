import { RoughCanvas } from './canvas';
import { RoughGenerator } from './generator';
import { RoughGeneratorAsync } from './generator-async';
import { RoughCanvasAsync } from './canvas-async';
import { RoughSVG } from './svg';
import { RoughSVGAsync } from './svg-async';
export default {
    canvas(canvas, config) {
        if (config && config.async) {
            return new RoughCanvasAsync(canvas, config);
        }
        return new RoughCanvas(canvas, config);
    },
    svg(svg, config) {
        if (config && config.async) {
            return new RoughSVGAsync(svg, config);
        }
        return new RoughSVG(svg, config);
    },
    createRenderer() {
        return RoughCanvas.createRenderer();
    },
    generator(config, surface) {
        if (config && config.async) {
            return new RoughGeneratorAsync(config, surface);
        }
        return new RoughGenerator(config, surface);
    }
};
