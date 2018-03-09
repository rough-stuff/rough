var __maxRandomnessOffset = 2;
var __roughness = 1;
var __bowing = 1;
var __curveTightness = 0;
var __curveStepCount = 9;

class Wires {
  _svgNode(tagName, attributes) {
    var n = document.createElementNS("http://www.w3.org/2000/svg", tagName);
    if (attributes) {
      for (var p in attributes) {
        if (attributes.hasOwnProperty(p)) {
          n.setAttributeNS(null, p, attributes[p]);
        }
      }
    }
    return n;
  }

  line(svg, x1, y1, x2, y2) {
    const path = this._line(x1, y1, x2, y2);
    const node = this._svgNode("path", { d: path.value });
    svg.appendChild(node);
    return node;
  }

  rectangle(svg, x, y, width, height) {
    x = x + 2;
    y = y + 2;
    width = width - 4;
    height = height - 4;
    let path = this._line(x, y, x + width, y);
    path = this._line(x + width, y, x + width, y + height, path);
    path = this._line(x + width, y + height, x, y + height, path);
    path = this._line(x, y + height, x, y, path);
    const node = this._svgNode("path", { d: path.value })
    svg.appendChild(node);
    return node;
  }

  polygon(svg, vertices) {
    let path = null;
    const vCount = vertices.length;
    if (vCount > 2) {
      for (let i = 0; i < 2; i++) {
        let move = true;
        for (let i = 1; i < vCount; i++) {
          path = this._continuousLine(vertices[i - 1][0], vertices[i - 1][1], vertices[i][0], vertices[i][1], move, i > 0, path);
          move = false;
        }
        path = this._continuousLine(vertices[vCount - 1][0], vertices[vCount - 1][1], vertices[0][0], vertices[0][1], move, i > 0, path);
      }
    } else if (vCount == 2) {
      path = this._line(vertices[0][0], vertices[0][1], vertices[1][0], vertices[1][1]);
    } else {
      path = new WiresPath();
    }

    const node = this._svgNode("path", { d: path.value })
    svg.appendChild(node);
    return node;
  }

  ellipse(svg, x, y, width, height) {
    width = Math.max(width > 10 ? width - 4 : width - 1, 1);
    height = Math.max(height > 10 ? height - 4 : height - 1, 1);
    const ellipseInc = (Math.PI * 2) / __curveStepCount;
    let rx = Math.abs(width / 2);
    let ry = Math.abs(height / 2);
    rx += this._getOffset(-rx * 0.05, rx * 0.05);
    ry += this._getOffset(-ry * 0.05, ry * 0.05);
    let path = this._ellipse(ellipseInc, x, y, rx, ry, 1, ellipseInc * this._getOffset(0.1, this._getOffset(0.4, 1)));
    path = this._ellipse(ellipseInc, x, y, rx, ry, 1.5, 0, path);
    const node = this._svgNode("path", { d: path.value })
    svg.appendChild(node);
    return node;
  }

  _ellipse(ellipseInc, cx, cy, rx, ry, offset, overlap, existingPath) {
    const radOffset = this._getOffset(-0.5, 0.5) - Math.PI / 2;
    const points = [];
    points.push([
      this._getOffset(-offset, offset) + cx + 0.9 * rx * Math.cos(radOffset - ellipseInc),
      this._getOffset(-offset, offset) + cy + 0.9 * ry * Math.sin(radOffset - ellipseInc)
    ]);
    for (let angle = radOffset; angle < (Math.PI * 2 + radOffset - 0.01); angle = angle + ellipseInc) {
      points.push([
        this._getOffset(-offset, offset) + cx + rx * Math.cos(angle),
        this._getOffset(-offset, offset) + cy + ry * Math.sin(angle)
      ]);
    }
    points.push([
      this._getOffset(-offset, offset) + cx + rx * Math.cos(radOffset + Math.PI * 2 + overlap * 0.5),
      this._getOffset(-offset, offset) + cy + ry * Math.sin(radOffset + Math.PI * 2 + overlap * 0.5)
    ]);
    points.push([
      this._getOffset(-offset, offset) + cx + 0.98 * rx * Math.cos(radOffset + overlap),
      this._getOffset(-offset, offset) + cy + 0.98 * ry * Math.sin(radOffset + overlap)
    ]);
    points.push([
      this._getOffset(-offset, offset) + cx + 0.9 * rx * Math.cos(radOffset + overlap * 0.5),
      this._getOffset(-offset, offset) + cy + 0.9 * ry * Math.sin(radOffset + overlap * 0.5)
    ]);
    return this._curve(points, existingPath);
  }

  _getOffset(min, max) {
    return __roughness * ((Math.random() * (max - min)) + min);
  }

  _line(x1, y1, x2, y2, existingPath) {
    const lengthSq = Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2);
    let offset = __maxRandomnessOffset || 0;
    if ((offset * offset * 100) > lengthSq) {
      offset = Math.sqrt(lengthSq) / 10;
    }
    const halfOffset = offset / 2;
    const divergePoint = 0.2 + Math.random() * 0.2;
    let midDispX = __bowing * __maxRandomnessOffset * (y2 - y1) / 200;
    let midDispY = __bowing * __maxRandomnessOffset * (x1, x2) / 200;
    midDispX = this._getOffset(-midDispX, midDispX);
    midDispY = this._getOffset(-midDispY, midDispY);

    let path = existingPath || new WiresPath();
    path.moveTo(x1 + this._getOffset(-offset, offset), y1 + this._getOffset(-offset, offset));
    path.bcurveTo(midDispX + x1 + (x2 - x1) * divergePoint + this._getOffset(-offset, offset),
      midDispY + y1 + (y2 - y1) * divergePoint + this._getOffset(-offset, offset),
      midDispX + x1 + 2 * (x2 - x1) * divergePoint + this._getOffset(-offset, offset),
      midDispY + y1 + 2 * (y2 - y1) * divergePoint + this._getOffset(-offset, offset),
      x2 + this._getOffset(-offset, offset),
      y2 + this._getOffset(-offset, offset)
    );
    path.moveTo(x1 + this._getOffset(-halfOffset, halfOffset), y1 + this._getOffset(-halfOffset, halfOffset));
    path.bcurveTo(midDispX + x1 + (x2 - x1) * divergePoint + this._getOffset(-halfOffset, halfOffset),
      midDispY + y1 + (y2 - y1) * divergePoint + this._getOffset(-halfOffset, halfOffset),
      midDispX + x1 + 2 * (x2 - x1) * divergePoint + this._getOffset(-halfOffset, halfOffset),
      midDispY + y1 + 2 * (y2 - y1) * divergePoint + this._getOffset(-halfOffset, halfOffset),
      x2 + this._getOffset(-halfOffset, halfOffset),
      y2 + this._getOffset(-halfOffset, halfOffset)
    );
    return path;
  }

  _continuousLine(x1, y1, x2, y2, move, overwrite, path) {
    path = path || new WiresPath();
    const lengthSq = Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2);
    let offset = __maxRandomnessOffset || 0;
    if ((offset * offset * 100) > lengthSq) {
      offset = Math.sqrt(lengthSq) / 10;
    }
    const halfOffset = offset / 2;
    const divergePoint = 0.2 + Math.random() * 0.2;
    let midDispX = __bowing * __maxRandomnessOffset * (y2 - y1) / 200;
    let midDispY = __bowing * __maxRandomnessOffset * (x1, x2) / 200;
    midDispX = this._getOffset(-midDispX, midDispX);
    midDispY = this._getOffset(-midDispY, midDispY);
    if (move) {
      path.moveTo(x1 + this._getOffset(-offset, offset), y1 + this._getOffset(-offset, offset));
    }
    if (!overwrite) {
      path.bcurveTo(midDispX + x1 + (x2 - x1) * divergePoint + this._getOffset(-offset, offset),
        midDispY + y1 + (y2 - y1) * divergePoint + this._getOffset(-offset, offset),
        midDispX + x1 + 2 * (x2 - x1) * divergePoint + this._getOffset(-offset, offset),
        midDispY + y1 + 2 * (y2 - y1) * divergePoint + this._getOffset(-offset, offset),
        x2 + this._getOffset(-offset, offset),
        y2 + this._getOffset(-offset, offset)
      );
    } else {
      path.bcurveTo(midDispX + x1 + (x2 - x1) * divergePoint + this._getOffset(-halfOffset, halfOffset),
        midDispY + y1 + (y2 - y1) * divergePoint + this._getOffset(-halfOffset, halfOffset),
        midDispX + x1 + 2 * (x2 - x1) * divergePoint + this._getOffset(-halfOffset, halfOffset),
        midDispY + y1 + 2 * (y2 - y1) * divergePoint + this._getOffset(-halfOffset, halfOffset),
        x2 + this._getOffset(-halfOffset, halfOffset),
        y2 + this._getOffset(-halfOffset, halfOffset)
      );
    }
    return path;
  }

  _curve(vertArray, existingPath) {
    const vertArrayLength = vertArray.length;
    let path = existingPath || new WiresPath();
    if (vertArrayLength > 3) {
      const b = [];
      const s = 1 - __curveTightness;
      path.moveTo(vertArray[1][0], vertArray[1][1]);
      for (let i = 1; (i + 2) < vertArrayLength; i++) {
        const cachedVertArray = vertArray[i];
        b[0] = [cachedVertArray[0], cachedVertArray[1]];
        b[1] = [cachedVertArray[0] + (s * vertArray[i + 1][0] - s * vertArray[i - 1][0]) / 6, cachedVertArray[1] + (s * vertArray[i + 1][1] - s * vertArray[i - 1][1]) / 6];
        b[2] = [vertArray[i + 1][0] + (s * vertArray[i][0] - s * vertArray[i + 2][0]) / 6, vertArray[i + 1][1] + (s * vertArray[i][1] - s * vertArray[i + 2][1]) / 6];
        b[3] = [vertArray[i + 1][0], vertArray[i + 1][1]];
        path.bcurveTo(b[1][0], b[1][1], b[2][0], b[2][1], b[3][0], b[3][1]);
      }
    } else if (vertArrayLength === 3) {
      path.moveTo(vertArray[0][0], vertArray[0][1]);
      path.bcurveTo(vertArray[1][0], vertArray[1][1],
        vertArray[2][0], vertArray[2][1],
        vertArray[2][0], vertArray[2][1]);
    } else if (vertArrayLength == 2) {
      path = this._line(vertArray[0][0], vertArray[0][1], vertArray[1][0], vertArray[1][1], path);
    }
    return path;
  }
}

class WiresPath {
  constructor() {
    this.p = "";
  }

  get value() {
    return this.p.trim();
  }

  moveTo(x, y) {
    this.p += "M " + x + " " + y + " ";
  }

  bcurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
    this.p += "C " + cp1x + " " + cp1y + ", " + cp2x + " " + cp2y + ", " + x + " " + y + " ";
  }
}

if (!window._WIRES_) {
  window._WIRES_ = new Wires();
}