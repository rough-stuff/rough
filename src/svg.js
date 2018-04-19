import { RoughGenerator, RoughGeneratorAsync } from './generator.js'

export class RoughSVG {
  constructor(svg, config) {
    this.svg = svg;
    this._init(config);
  }

  _init(config) {
    this.gen = new RoughGenerator(config, this.svg);
  }

  get generator() {
    return this.gen;
  }

  get defs() {
    if (!this._defs) {
      let doc = this.svg.ownerDocument || document;
      let dnode = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
      if (this.svg.firstChild) {
        this.svg.insertBefore(dnode, this.svg.firstChild);
      } else {
        this.svg.appendChild(dnode);
      }
      this._defs = dnode;
    }
    return this._defs;
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
          path = this._fillSketch(doc, drawing, o);
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
          const size = drawing.size;
          const pattern = doc.createElementNS('http://www.w3.org/2000/svg', 'pattern');
          const id = `rough-${Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER || 999999))}`;
          pattern.setAttribute('id', id);
          pattern.setAttribute('x', 0);
          pattern.setAttribute('y', 0);
          pattern.setAttribute('width', 1);
          pattern.setAttribute('height', 1);
          pattern.setAttribute('height', 1);
          pattern.setAttribute('viewBox', `0 0 ${Math.round(size[0])} ${Math.round(size[1])}`);
          pattern.setAttribute('patternUnits', 'objectBoundingBox');
          const patternPath = this._fillSketch(doc, drawing, o);
          pattern.appendChild(patternPath);
          this.defs.appendChild(pattern);

          path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', drawing.path);
          path.style.stroke = 'none';
          path.style.strokeWidth = 0;
          path.style.fill = `url(#${id})`;
          break;
        }
      }
      if (path) {
        g.appendChild(path);
      }
    }
    return g;
  }

  _fillSketch(doc, drawing, o) {
    let fweight = o.fillWeight;
    if (fweight < 0) {
      fweight = o.strokeWidth / 2;
    }
    let path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', this._opsToPath(drawing));
    path.style.stroke = o.fill;
    path.style.strokeWidth = fweight;
    path.style.fill = 'none';
    return path;
  }

  _opsToPath(drawing) {
    return this.gen.opsToPath(drawing);
  }
}

export class RoughSVGAsync extends RoughSVG {
  _init(config) {
    this.gen = new RoughGeneratorAsync(config, this.svg);
  }

  async line(x1, y1, x2, y2, options) {
    let d = await this.gen.line(x1, y1, x2, y2, options);
    return this.draw(d);
  }

  async rectangle(x, y, width, height, options) {
    let d = await this.gen.rectangle(x, y, width, height, options);
    return this.draw(d);
  }

  async ellipse(x, y, width, height, options) {
    let d = await this.gen.ellipse(x, y, width, height, options);
    return this.draw(d);
  }

  async circle(x, y, diameter, options) {
    let d = await this.gen.circle(x, y, diameter, options);
    return this.draw(d);
  }

  async linearPath(points, options) {
    let d = await this.gen.linearPath(points, options);
    return this.draw(d);
  }

  async polygon(points, options) {
    let d = await this.gen.polygon(points, options);
    return this.draw(d);
  }

  async arc(x, y, width, height, start, stop, closed, options) {
    let d = await this.gen.arc(x, y, width, height, start, stop, closed, options);
    return this.draw(d);
  }

  async curve(points, options) {
    let d = await this.gen.curve(points, options);
    return this.draw(d);
  }

  async path(d, options) {
    let drawing = await this.gen.path(d, options);
    return this.draw(drawing);
  }
}