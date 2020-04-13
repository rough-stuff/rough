import { Config, Options, OpSet, ResolvedOptions, Drawable, SVGNS } from './core';
import { RoughGenerator } from './generator';
import { Point } from './geometry';

export class RoughSVG {
  private gen: RoughGenerator;
  private svg: SVGSVGElement;

  constructor(svg: SVGSVGElement, config?: Config) {
    this.svg = svg;
    this.gen = new RoughGenerator(config);
  }

  draw(drawable: Drawable): SVGGElement {
    const sets = drawable.sets || [];
    const o = drawable.options || this.getDefaultOptions();
    const doc = this.svg.ownerDocument || window.document;
    const g = doc.createElementNS(SVGNS, 'g');
    for (const drawing of sets) {
      let path = null;
      switch (drawing.type) {
        case 'path': {
          path = doc.createElementNS(SVGNS, 'path');
          path.setAttribute('d', this.opsToPath(drawing));
          path.style.stroke = o.stroke;
          path.style.strokeWidth = o.strokeWidth + '';
          path.style.fill = 'none';
          break;
        }
        case 'fillPath': {
          path = doc.createElementNS(SVGNS, 'path');
          path.setAttribute('d', this.opsToPath(drawing));
          path.style.stroke = 'none';
          path.style.strokeWidth = '0';
          path.style.fill = o.fill || '';
          break;
        }
        case 'fillSketch': {
          path = this.fillSketch(doc, drawing, o);
          break;
        }
      }
      if (path) {
        g.appendChild(path);
      }
    }
    return g;
  }

  private fillSketch(doc: Document, drawing: OpSet, o: ResolvedOptions): SVGPathElement {
    let fweight = o.fillWeight;
    if (fweight < 0) {
      fweight = o.strokeWidth / 2;
    }
    const path = doc.createElementNS(SVGNS, 'path');
    path.setAttribute('d', this.opsToPath(drawing));
    path.style.stroke = o.fill || '';
    path.style.strokeWidth = fweight + '';
    path.style.fill = 'none';
    return path;
  }

  get generator(): RoughGenerator {
    return this.gen;
  }

  getDefaultOptions(): ResolvedOptions {
    return this.gen.defaultOptions;
  }

  opsToPath(drawing: OpSet): string {
    return this.gen.opsToPath(drawing);
  }

  line(x1: number, y1: number, x2: number, y2: number, options?: Options): SVGGElement {
    const d = this.gen.line(x1, y1, x2, y2, options);
    return this.draw(d);
  }

  rectangle(x: number, y: number, width: number, height: number, options?: Options): SVGGElement {
    const d = this.gen.rectangle(x, y, width, height, options);
    return this.draw(d);
  }

  ellipse(x: number, y: number, width: number, height: number, options?: Options): SVGGElement {
    const d = this.gen.ellipse(x, y, width, height, options);
    return this.draw(d);
  }

  circle(x: number, y: number, diameter: number, options?: Options): SVGGElement {
    const d = this.gen.circle(x, y, diameter, options);
    return this.draw(d);
  }

  linearPath(points: Point[], options?: Options): SVGGElement {
    const d = this.gen.linearPath(points, options);
    return this.draw(d);
  }

  polygon(points: Point[], options?: Options): SVGGElement {
    const d = this.gen.polygon(points, options);
    return this.draw(d);
  }

  arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean = false, options?: Options): SVGGElement {
    const d = this.gen.arc(x, y, width, height, start, stop, closed, options);
    return this.draw(d);
  }

  curve(points: Point[], options?: Options): SVGGElement {
    const d = this.gen.curve(points, options);
    return this.draw(d);
  }

  path(d: string, options?: Options): SVGGElement {
    const drawing = this.gen.path(d, options);
    return this.draw(drawing);
  }
}