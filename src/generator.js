import { RoughRenderer } from './renderer.js';
self._roughScript = self.document && self.document.currentScript && self.document.currentScript.src;

export class RoughGenerator {
  constructor(config, canvas) {
    this.config = config || {};
    this.canvas = canvas;
    this.defaultOptions = {
      maxRandomnessOffset: 2,
      roughness: 1,
      bowing: 1,
      stroke: '#000',
      strokeWidth: 1,
      curveTightness: 0,
      curveStepCount: 9,
      fill: null,
      fillStyle: 'hachure',
      fillWeight: -1,
      hachureAngle: -41,
      hachureGap: -1
    };
    if (this.config.options) {
      this.defaultOptions = this._options(this.config.options);
    }
  }

  _options(options) {
    return options ? Object.assign({}, this.defaultOptions, options) : this.defaultOptions;
  }

  _drawable(shape, sets, options) {
    return { shape, sets: sets || [], options: options || this.defaultOptions };
  }

  get lib() {
    if (!this._renderer) {
      if (self && self.workly && this.config.async && (!this.config.noWorker)) {
        const tos = Function.prototype.toString;
        const worklySource = this.config.worklyURL || 'https://cdn.jsdelivr.net/gh/pshihn/workly/dist/workly.min.js';
        const rendererSource = this.config.roughURL || self._roughScript;
        if (rendererSource && worklySource) {
          let code = `importScripts('${worklySource}', '${rendererSource}');\nworkly.expose(self.rough.createRenderer());`;
          let ourl = URL.createObjectURL(new Blob([code]));
          this._renderer = workly.proxy(ourl);
        } else {
          this._renderer = new RoughRenderer();
        }
      } else {
        this._renderer = new RoughRenderer();
      }
    }
    return this._renderer;
  }

  line(x1, y1, x2, y2, options) {
    const o = this._options(options);
    return this._drawable('line', [this.lib.line(x1, y1, x2, y2, o)], o);
  }

  rectangle(x, y, width, height, options) {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      const xc = [x, x + width, x + width, x];
      const yc = [y, y, y + height, y + height];
      if (o.fillStyle === 'solid') {
        paths.push(this.lib.solidFillShape(xc, yc, o))
      } else {
        paths.push(this.lib.hachureFillShape(xc, yc, o));
      }
    }
    paths.push(this.lib.rectangle(x, y, width, height, o));
    return this._drawable('rectangle', paths, o);
  }

  ellipse(x, y, width, height, options) {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        const shape = this.lib.ellipse(x, y, width, height, o);
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(this.lib.hachureFillEllipse(x, y, width, height, o));
      }
    }
    paths.push(this.lib.ellipse(x, y, width, height, o));
    return this._drawable('ellipse', paths, o);
  }

  circle(x, y, diameter, options) {
    let ret = this.ellipse(x, y, diameter, diameter, options);
    ret.shape = 'circle';
    return ret;
  }

  linearPath(points, options) {
    const o = this._options(options);
    return this._drawable('linearPath', [this.lib.linearPath(points, false, o)], o);
  }

  polygon(points, options) {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      let xc = [], yc = [];
      for (let p of points) {
        xc.push(p[0]);
        yc.push(p[1]);
      }
      if (o.fillStyle === 'solid') {
        paths.push(this.lib.solidFillShape(xc, yc, o));
      } else {
        paths.push(this.lib.hachureFillShape(xc, yc, o));
      }
    }
    paths.push(this.lib.linearPath(points, true, o));
    return this._drawable('polygon', paths, o);
  }

  arc(x, y, width, height, start, stop, closed, options) {
    const o = this._options(options);
    const paths = [];
    if (closed && o.fill) {
      if (o.fillStyle === 'solid') {
        let shape = this.lib.arc(x, y, width, height, start, stop, true, false, o);
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(this.lib.hachureFillArc(x, y, width, height, start, stop, o));
      }
    }
    paths.push(this.lib.arc(x, y, width, height, start, stop, closed, true, o));
    return this._drawable('arc', paths, o);
  }

  curve(points, options) {
    const o = this._options(options);
    return this._drawable('curve', [this.lib.curve(points, o)], o);
  }

  path(d, options) {
    const o = this._options(options);
    const paths = [];
    if (!d) {
      return this._drawable('path', paths, o);
    }
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        let shape = { type: 'path2Dfill', path: d };
        paths.push(shape);
      } else {
        const size = this._computePathSize(d);
        let xc = [0, size[0], size[0], 0];
        let yc = [0, 0, size[1], size[1]];
        let shape = this.lib.hachureFillShape(xc, yc, o);
        shape.type = 'path2Dpattern';
        shape.size = size;
        shape.path = d;
        paths.push(shape);
      }
    }
    paths.push(this.lib.svgPath(d, o));
    return this._drawable('path', paths, o);
  }

  toPaths(drawable) {
    const sets = drawable.sets || [];
    const o = drawable.options || this.defaultOptions;
    const paths = [];
    for (const drawing of sets) {
      let path = null;
      switch (drawing.type) {
        case 'path':
          path = {
            d: this.opsToPath(drawing),
            stroke: o.stroke,
            strokeWidth: o.strokeWidth,
            fill: 'none'
          };
          break;
        case 'fillPath':
          path = {
            d: this.opsToPath(drawing),
            stroke: 'none',
            strokeWidth: 0,
            fill: o.fill
          };
          break;
        case 'fillSketch':
          path = this._fillSketch(drawing, o);
          break;
        case 'path2Dfill':
          path = {
            d: drawing.path,
            stroke: 'none',
            strokeWidth: 0,
            fill: o.fill
          };
          break;
        case 'path2Dpattern': {
          const size = drawing.size;
          const pattern = {
            x: 0, y: 0, width: 1, height: 1,
            viewBox: `0 0 ${Math.round(size[0])} ${Math.round(size[1])}`,
            patternUnits: 'objectBoundingBox',
            path: this._fillSketch(drawing, o)
          };
          path = {
            d: drawing.path,
            stroke: 'none',
            strokeWidth: 0,
            pattern: pattern
          };
          break;
        }
      }
      if (path) {
        paths.push(path);
      }
    }
    return paths;
  }

  _fillSketch(drawing, o) {
    let fweight = o.fillWeight;
    if (fweight < 0) {
      fweight = o.strokeWidth / 2;
    }
    return {
      d: this.opsToPath(drawing),
      stroke: o.fill,
      strokeWidth: fweight,
      fill: 'none'
    };
  }

  opsToPath(drawing) {
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

  _computePathSize(d) {
    let size = [0, 0];
    if (self.document) {
      try {
        const ns = "http://www.w3.org/2000/svg";
        let svg = self.document.createElementNS(ns, "svg");
        svg.setAttribute("width", "0");
        svg.setAttribute("height", "0");
        let pathNode = self.document.createElementNS(ns, "path");
        pathNode.setAttribute('d', d);
        svg.appendChild(pathNode);
        self.document.body.appendChild(svg);
        let bb = pathNode.getBBox()
        if (bb) {
          size[0] = bb.width || 0;
          size[1] = bb.height || 0;
        }
        self.document.body.removeChild(svg);
      } catch (err) { }
    }
    const canvasSize = this._canvasSize();
    if (!(size[0] * size[1])) {
      size = canvasSize;
    }
    size[0] = Math.min(size[0], canvasSize[0]);
    size[1] = Math.min(size[1], canvasSize[1]);
    return size;
  }

  _canvasSize() {
    const val = w => {
      if (w) {
        if (typeof w === 'object') {
          if (w.baseVal && w.baseVal.value) {
            return w.baseVal.value;
          }
        }
      }
      return w || 100;
    };
    return this.canvas ? [val(this.canvas.width), val(this.canvas.height)] : [100, 100];
  }
}

export class RoughGeneratorAsync extends RoughGenerator {
  async line(x1, y1, x2, y2, options) {
    const o = this._options(options);
    return this._drawable('line', [await this.lib.line(x1, y1, x2, y2, o)], o);
  }

  async rectangle(x, y, width, height, options) {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      const xc = [x, x + width, x + width, x];
      const yc = [y, y, y + height, y + height];
      if (o.fillStyle === 'solid') {
        paths.push(await this.lib.solidFillShape(xc, yc, o))
      } else {
        paths.push(await this.lib.hachureFillShape(xc, yc, o));
      }
    }
    paths.push(await this.lib.rectangle(x, y, width, height, o));
    return this._drawable('rectangle', paths, o);
  }

  async ellipse(x, y, width, height, options) {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        const shape = await this.lib.ellipse(x, y, width, height, o);
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(await this.lib.hachureFillEllipse(x, y, width, height, o));
      }
    }
    paths.push(await this.lib.ellipse(x, y, width, height, o));
    return this._drawable('ellipse', paths, o);
  }

  async circle(x, y, diameter, options) {
    let ret = await this.ellipse(x, y, diameter, diameter, options);
    ret.shape = 'circle';
    return ret;
  }

  async linearPath(points, options) {
    const o = this._options(options);
    return this._drawable('linearPath', [await this.lib.linearPath(points, false, o)], o);
  }

  async polygon(points, options) {
    const o = this._options(options);
    const paths = [];
    if (o.fill) {
      let xc = [], yc = [];
      for (let p of points) {
        xc.push(p[0]);
        yc.push(p[1]);
      }
      if (o.fillStyle === 'solid') {
        paths.push(await this.lib.solidFillShape(xc, yc, o));
      } else {
        paths.push(await this.lib.hachureFillShape(xc, yc, o));
      }
    }
    paths.push(await this.lib.linearPath(points, true, o));
    return this._drawable('polygon', paths, o);
  }

  async arc(x, y, width, height, start, stop, closed, options) {
    const o = this._options(options);
    const paths = [];
    if (closed && o.fill) {
      if (o.fillStyle === 'solid') {
        let shape = await this.lib.arc(x, y, width, height, start, stop, true, false, o);
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(await this.lib.hachureFillArc(x, y, width, height, start, stop, o));
      }
    }
    paths.push(await this.lib.arc(x, y, width, height, start, stop, closed, true, o));
    return this._drawable('arc', paths, o);
  }

  async curve(points, options) {
    const o = this._options(options);
    return this._drawable('curve', [await this.lib.curve(points, o)], o);
  }

  async path(d, options) {
    const o = this._options(options);
    const paths = [];
    if (!d) {
      return this._drawable('path', paths, o);
    }
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        let shape = { type: 'path2Dfill', path: d };
        paths.push(shape);
      } else {
        const size = this._computePathSize(d);
        let xc = [0, size[0], size[0], 0];
        let yc = [0, 0, size[1], size[1]];
        let shape = await this.lib.hachureFillShape(xc, yc, o);
        shape.type = 'path2Dpattern';
        shape.size = size;
        shape.path = d;
        paths.push(shape);
      }
    }
    paths.push(await this.lib.svgPath(d, o));
    return this._drawable('path', paths, o);
  }
}