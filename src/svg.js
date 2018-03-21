import { RoughGenerator, RoughGeneratorAsync } from './generator.js'

export class RoughSVG {
  constructor(svg, config) {
    this.svg = svg;
    this._init(config);
  }

  _init(config) {
    this.gen = new RoughGenerator(config, this.canvas);
  }

  get generator() {
    return this.gen;
  }

  line(x1, y1, x2, y2, options) {
    let d = this.gen.line(x1, y1, x2, y2, options);
    return this.draw(d);
  }

  rectangle(x, y, width, height, options) {
    let d = this.gen.rectangle(x, y, width, height, options);
    return this.draw(d);
  }

  ellipse(x, y, width, height, options) {
    let d = this.gen.ellipse(x, y, width, height, options);
    return this.draw(d);
  }

  circle(x, y, diameter, options) {
    let d = this.gen.circle(x, y, diameter, options);
    return this.draw(d);
  }

  linearPath(points, options) {
    let d = this.gen.linearPath(points, options);
    return this.draw(d);
  }

  polygon(points, options) {
    let d = this.gen.polygon(points, options);
    return this.draw(d);
  }

  arc(x, y, width, height, start, stop, closed, options) {
    let d = this.gen.arc(x, y, width, height, start, stop, closed, options);
    return this.draw(d);
  }

  curve(points, options) {
    let d = this.gen.curve(points, options);
    return this.draw(d);
  }

  path(d, options) {
    let drawing = this.gen.path(d, options);
    return this.draw(drawing);
  }

  draw(drawable) {
    let sets = drawable.sets || [];
    let o = drawable.options || this.gen.defaultOptions;
    let doc = this.svg.ownerDocument || document;
    let g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    for (let drawing of sets) {
      let path = null;
      switch (drawing.type) {
        case 'path': {
          path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', this._opsToPath(drawing));
          path.style.stroke = o.stroke;
          path.style.strokeWidth = o.strokeWidth;
          path.style.fill = 'none';
          break;
        }
        case 'fillPath': {
          path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', this._opsToPath(drawing));
          path.style.stroke = 'none';
          path.style.strokeWidth = 0;
          path.style.fill = o.fill;
          break;
        }
        case 'fillSketch': {
          let fweight = o.fillWeight;
          if (fweight < 0) {
            fweight = o.strokeWidth / 2;
          }
          path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', this._opsToPath(drawing));
          path.style.stroke = o.fill;
          path.style.strokeWidth = fweight;
          path.style.fill = 'none';
          break;
        }
        case 'path2Dfill': {
          path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', drawing.path);
          path.style.stroke = 'none';
          path.style.strokeWidth = 0;
          path.style.fill = o.fill;
          break;
        }
        case 'path2Dpattern': {
          break;
        }
      }
      if (path) {
        g.appendChild(path);
      }
    }
    return g;
  }

  _opsToPath(drawing) {
    let path = '';
    for (let item of drawing.ops) {
      const data = item.data;
      switch (item.op) {
        case 'move':
          path += `M${data[0]} ${data[1]} `;
          break;
        case 'bcurveTo':
          path += `C${data[0]} ${data[1]}, ${data[2]} ${data[3]}, ${data[4]} ${data[5]} `;
          break;
        case 'qcurveTo':
          path += `Q${data[0]} ${data[1]}, ${data[2]} ${data[3]} `;
          break;
        case 'lineTo':
          path += `L${data[0]} ${data[1]} `;
          break;
      }
    }
    return path.trim();
  }
}