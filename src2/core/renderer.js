import { RoughHachureIterator } from './hachure.js';
import { RoughSegmentRelation, RoughSegment } from './segment.js';

export class RoughRenderer {
  line(x1, y1, x2, y2, o) {
    let o1 = this._line(x1, y1, x2, y2, o, true, false);
    let o2 = this._line(x1, y1, x2, y2, o, true, true);
    return {
      type: 'path',
      ops: o1.concat(o2)
    };
  }

  linearPath(points, close, o) {
    const len = (points || []).length;
    if (len > 2) {
      let ops = [];
      for (let i = 0; i < (len - 1); i++) {
        let o1 = this._line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], o, true, false);
        let o2 = this._line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], o, true, true);
        ops = ops.concat(o1, o2);
      }
      if (close) {
        let o1 = this._line(points[len - 1][0], points[len - 1][1], points[0][0], points[0][1], o, true, false);
        let o2 = this._line(points[len - 1][0], points[len - 1][1], points[0][0], points[0][1], o, true, true);
        ops = ops.concat(o1, o2);
      }
      return { type: 'path', ops };
    } else if (len === 2) {
      return this.line(points[0][0], points[0][1], points[1][0], points[1][1], o);
    }
  }

  polygon(points, o) {
    return this.linearPath(points, true, o);
  }

  rectangle(x, y, width, height, o) {
    let points = [
      [x, y], [x + width, y], [x + width, y + height], [x, y + height]
    ];
    return this.polygon(points, o);
  }

  curve(points, o) {
    let o1 = this._curveWithOffset(points, 1 * (1 + o.roughness * 0.2), o);
    let o2 = this._curveWithOffset(points, 1.5 * (1 + o.roughness * 0.22), o);
    return { type: 'path', ops: o1.concat(o2) };
  }

  ellipse(x, y, width, height, o) {
    const increment = (Math.PI * 2) / o.curveStepCount;
    let rx = Math.abs(width / 2);
    let ry = Math.abs(height / 2);
    rx += this._getOffset(-rx * 0.05, rx * 0.05, o);
    ry += this._getOffset(-ry * 0.05, ry * 0.05, o);
    let o1 = this._ellipse(increment, x, y, rx, ry, 1, increment * this._getOffset(0.1, this._getOffset(0.4, 1, o), o), o);
    let o2 = this._ellipse(increment, x, y, rx, ry, 1.5, 0, o);
    return { type: 'path', ops: o1.concat(o2) };
  }

  arc(x, y, width, height, start, stop, closed, roughClosure, o) {
    let cx = x;
    let cy = y;
    let rx = Math.abs(width / 2);
    let ry = Math.abs(height / 2);
    rx += this._getOffset(-rx * 0.01, rx * 0.01, o);
    ry += this._getOffset(-ry * 0.01, ry * 0.01, o);
    let strt = start;
    let stp = stop;
    while (strt < 0) {
      strt += Math.PI * 2;
      stp += Math.PI * 2;
    }
    if ((stp - strt) > (Math.PI * 2)) {
      strt = 0;
      stp = Math.PI * 2;
    }
    let ellipseInc = (Math.PI * 2) / o.curveStepCount;
    let arcInc = Math.min(ellipseInc / 2, (stp - strt) / 2);
    let o1 = this._arc(arcInc, cx, cy, rx, ry, strt, stp, 1, o);
    let o2 = this._arc(arcInc, cx, cy, rx, ry, strt, stp, 1.5, o);
    let ops = o1.concat(o2);
    if (closed) {
      if (roughClosure) {
        ops = ops.concat(this._line(cx, cy, cx + rx * Math.cos(strt), cy + ry * Math.sin(strt), o, true, false));
        ops = ops.concat(this._line(cx, cy, cx + rx * Math.cos(strt), cy + ry * Math.sin(strt), o, true, true));
        ops = ops.concat(this._line(cx, cy, cx + rx * Math.cos(stp), cy + ry * Math.sin(stp), o, true, false));
        ops = ops.concat(this._line(cx, cy, cx + rx * Math.cos(stp), cy + ry * Math.sin(stp), o, true, true));
      } else {
        ops.push({ op: 'lineTo', data: [cx, cy] });
        ops.push({ op: 'lineTo', data: [cx + rx * Math.cos(strt), cy + ry * Math.sin(strt)] });
      }
    }
    return { type: 'path', ops };
  }

  hachureFillArc(x, y, width, height, start, stop, o) {
    let cx = x;
    let cy = y;
    let rx = Math.abs(width / 2);
    let ry = Math.abs(height / 2);
    rx += this._getOffset(-rx * 0.01, rx * 0.01, o);
    ry += this._getOffset(-ry * 0.01, ry * 0.01, o);
    let strt = start;
    let stp = stop;
    while (strt < 0) {
      strt += Math.PI * 2;
      stp += Math.PI * 2;
    }
    if ((stp - strt) > (Math.PI * 2)) {
      strt = 0;
      stp = Math.PI * 2;
    }
    let increment = (stp - strt) / o.curveStepCount;
    let offset = 1;
    let xc = [], yc = [];
    for (let angle = strt; angle <= stp; angle = angle + increment) {
      xc.push(cx + rx * Math.cos(angle));
      yc.push(cy + ry * Math.sin(angle));
    }
    xc.push(cx + rx * Math.cos(stp));
    yc.push(cy + ry * Math.sin(stp));
    xc.push(cx);
    yc.push(cy);
    return this.hachureFillShape(xc, yc, o);
  }

  solidFillShape(xCoords, yCoords, o) {
    let ops = [];
    if (xCoords && yCoords && xCoords.length && yCoords.length && xCoords.length === yCoords.length) {
      let offset = o.maxRandomnessOffset || 0;
      const len = xCoords.length;
      if (len > 2) {
        ops.push({ op: 'move', data: [xCoords[0] + this._getOffset(-offset, offset, o), yCoords[0] + this._getOffset(-offset, offset, o)] });
        for (var i = 1; i < len; i++) {
          ops.push({ op: 'lineTo', data: [xCoords[i] + this._getOffset(-offset, offset, o), yCoords[i] + this._getOffset(-offset, offset, o)] });
        }
      }
    }
    return { type: 'fillPath', ops };
  }

  hachureFillShape(xCoords, yCoords, o) {
    let ops = [];
    if (xCoords && yCoords && xCoords.length && yCoords.length) {
      let left = xCoords[0];
      let right = xCoords[0];
      let top = yCoords[0];
      let bottom = yCoords[0];
      for (let i = 1; i < xCoords.length; i++) {
        left = Math.min(left, xCoords[i]);
        right = Math.max(right, xCoords[i]);
        top = Math.min(top, yCoords[i]);
        bottom = Math.max(bottom, yCoords[i]);
      }
      const angle = o.hachureAngle;
      let gap = o.hachureGap;
      if (gap < 0) {
        gap = o.strokeWidth * 4;
      }
      gap = Math.max(gap, 0.1);

      const radPerDeg = Math.PI / 180;
      const hachureAngle = (angle % 180) * radPerDeg;
      const cosAngle = Math.cos(hachureAngle);
      const sinAngle = Math.sin(hachureAngle);
      const tanAngle = Math.tan(hachureAngle);

      const it = new RoughHachureIterator(top - 1, bottom + 1, left - 1, right + 1, gap, sinAngle, cosAngle, tanAngle);
      let rectCoords;
      while ((rectCoords = it.getNextLine()) != null) {
        let lines = this._getIntersectingLines(rectCoords, xCoords, yCoords);
        for (let i = 0; i < lines.length; i++) {
          if (i < (lines.length - 1)) {
            let p1 = lines[i];
            let p2 = lines[i + 1];
            const o1 = this._line(p1[0], p1[1], p2[0], p2[1], o, true, false);
            const o2 = this._line(p1[0], p1[1], p2[0], p2[1], o, true, true);
            ops = ops.concat(o1, o2);
          }
        }
      }
    }
    return { type: 'path', ops };
  }

  hachureFillEllipse(cx, cy, width, height, o) {
    let ops = [];
    let rx = Math.abs(width / 2);
    let ry = Math.abs(height / 2);
    rx += this._getOffset(-rx * 0.05, rx * 0.05, o);
    ry += this._getOffset(-ry * 0.05, ry * 0.05, o);
    let angle = o.hachureAngle;
    let gap = o.hachureGap;
    if (gap <= 0) {
      gap = o.strokeWidth * 4;
    }
    let fweight = o.fillWeight;
    if (fweight < 0) {
      fweight = o.strokeWidth / 2;
    }
    const radPerDeg = Math.PI / 180;
    let hachureAngle = (angle % 180) * radPerDeg;
    let tanAngle = Math.tan(hachureAngle);
    let aspectRatio = ry / rx;
    let hyp = Math.sqrt(aspectRatio * tanAngle * aspectRatio * tanAngle + 1);
    let sinAnglePrime = aspectRatio * tanAngle / hyp;
    let cosAnglePrime = 1 / hyp;
    let gapPrime = gap / ((rx * ry / Math.sqrt((ry * cosAnglePrime) * (ry * cosAnglePrime) + (rx * sinAnglePrime) * (rx * sinAnglePrime))) / rx);
    let halfLen = Math.sqrt((rx * rx) - (cx - rx + gapPrime) * (cx - rx + gapPrime));
    for (var xPos = cx - rx + gapPrime; xPos < cx + rx; xPos += gapPrime) {
      halfLen = Math.sqrt((rx * rx) - (cx - xPos) * (cx - xPos));
      let p1 = this._affine(xPos, cy - halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
      let p2 = this._affine(xPos, cy + halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
      const o1 = this._line(p1[0], p1[1], p2[0], p2[1], o, true, false);
      const o2 = this._line(p1[0], p1[1], p2[0], p2[1], o, true, true);
      ops = ops.concat(o1, o2);
    }
    return { type: 'path', ops };
  }

  // privates

  _getOffset(min, max, ops) {
    return ops.roughness * ((Math.random() * (max - min)) + min);
  }

  _affine(x, y, cx, cy, sinAnglePrime, cosAnglePrime, R) {
    var A = -cx * cosAnglePrime - cy * sinAnglePrime + cx;
    var B = R * (cx * sinAnglePrime - cy * cosAnglePrime) + cy;
    var C = cosAnglePrime;
    var D = sinAnglePrime;
    var E = -R * sinAnglePrime;
    var F = R * cosAnglePrime;
    return [
      A + C * x + D * y,
      B + E * x + F * y
    ];
  }

  _line(x1, y1, x2, y2, o, move, overlay) {
    const lengthSq = Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2);
    let offset = o.maxRandomnessOffset || 0;
    if ((offset * offset * 100) > lengthSq) {
      offset = Math.sqrt(lengthSq) / 10;
    }
    const halfOffset = offset / 2;
    const divergePoint = 0.2 + Math.random() * 0.2;
    let midDispX = o.bowing * o.maxRandomnessOffset * (y2 - y1) / 200;
    let midDispY = o.bowing * o.maxRandomnessOffset * (x1, x2) / 200;
    midDispX = this._getOffset(-midDispX, midDispX, o);
    midDispY = this._getOffset(-midDispY, midDispY, o);
    let ops = [];
    if (move) {
      if (overlay) {
        ops.push({
          op: 'move', data: [
            x1 + this._getOffset(-halfOffset, halfOffset, o),
            y1 + this._getOffset(-halfOffset, halfOffset, o)
          ]
        });
      } else {
        ops.push({
          op: 'move', data: [
            x1 + this._getOffset(-offset, offset, o),
            y1 + this._getOffset(-offset, offset, o)
          ]
        });
      }
    }
    if (overlay) {
      ops.push({
        op: 'bcurveTo', data: [
          midDispX + x1 + (x2 - x1) * divergePoint + this._getOffset(-halfOffset, halfOffset, o),
          midDispY + y1 + (y2 - y1) * divergePoint + this._getOffset(-halfOffset, halfOffset, o),
          midDispX + x1 + 2 * (x2 - x1) * divergePoint + this._getOffset(-halfOffset, halfOffset, o),
          midDispY + y1 + 2 * (y2 - y1) * divergePoint + this._getOffset(-halfOffset, halfOffset, o),
          x2 + this._getOffset(-halfOffset, halfOffset, o),
          y2 + this._getOffset(-halfOffset, halfOffset, o)
        ]
      });
    } else {
      ops.push({
        op: 'bcurveTo', data: [
          midDispX + x1 + (x2 - x1) * divergePoint + this._getOffset(-offset, offset, o),
          midDispY + y1 + (y2 - y1) * divergePoint + this._getOffset(-offset, offset, o),
          midDispX + x1 + 2 * (x2 - x1) * divergePoint + this._getOffset(-offset, offset, o),
          midDispY + y1 + 2 * (y2 - y1) * divergePoint + this._getOffset(-offset, offset, o),
          x2 + this._getOffset(-offset, offset, o),
          y2 + this._getOffset(-offset, offset, o)
        ]
      });
    }
    return ops;
  }

  _curve(points, closePoint, o) {
    const len = points.length;
    let ops = [];
    if (len > 3) {
      const b = [];
      const s = 1 - o.curveTightness;
      ops.push({ op: 'move', data: [points[1][0], points[1][1]] });
      for (let i = 1; (i + 2) < len; i++) {
        const cachedVertArray = points[i];
        b[0] = [cachedVertArray[0], cachedVertArray[1]];
        b[1] = [cachedVertArray[0] + (s * points[i + 1][0] - s * points[i - 1][0]) / 6, cachedVertArray[1] + (s * points[i + 1][1] - s * points[i - 1][1]) / 6];
        b[2] = [points[i + 1][0] + (s * points[i][0] - s * points[i + 2][0]) / 6, points[i + 1][1] + (s * points[i][1] - s * points[i + 2][1]) / 6];
        b[3] = [points[i + 1][0], points[i + 1][1]];
        ops.push({ op: 'bcurveTo', data: [b[1][0], b[1][1], b[2][0], b[2][1], b[3][0], b[3][1]] });
      }
      if (closePoint && closePoint.length === 2) {
        let ro = o.maxRandomnessOffset;
        // TODO: more roughness here?
        ops.push({ ops: 'lineTo', data: [closePoint[0] + this._getOffset(-ro, ro, o), closePoint[1] + + this._getOffset(-ro, ro, o)] })
      }
    } else if (len === 3) {
      ops.push({ op: 'move', data: [points[1][0], points[1][1]] });
      ops.push({
        op: 'bcurveTo', data: [
          points[1][0], points[1][1],
          points[2][0], points[2][1],
          points[2][0], points[2][1]]
      });
    } else if (len === 2) {
      let o1 = this._line(points[0][0], points[0][1], points[1][0], points[1][1], o, true, false);
      let o2 = this._line(points[0][0], points[0][1], points[1][0], points[1][1], o, true, true);
      ops = ops.concat(o1, o2);
    }
    return ops;
  }

  _ellipse(increment, cx, cy, rx, ry, offset, overlap, o) {
    const radOffset = this._getOffset(-0.5, 0.5, o) - (Math.PI / 2);
    const points = [];
    points.push([
      this._getOffset(-offset, offset, o) + cx + 0.9 * rx * Math.cos(radOffset - increment),
      this._getOffset(-offset, offset, o) + cy + 0.9 * ry * Math.sin(radOffset - increment)
    ]);
    for (let angle = radOffset; angle < (Math.PI * 2 + radOffset - 0.01); angle = angle + increment) {
      points.push([
        this._getOffset(-offset, offset, o) + cx + rx * Math.cos(angle),
        this._getOffset(-offset, offset, o) + cy + ry * Math.sin(angle)
      ]);
    }
    points.push([
      this._getOffset(-offset, offset, o) + cx + rx * Math.cos(radOffset + Math.PI * 2 + overlap * 0.5),
      this._getOffset(-offset, offset, o) + cy + ry * Math.sin(radOffset + Math.PI * 2 + overlap * 0.5)
    ]);
    points.push([
      this._getOffset(-offset, offset, o) + cx + 0.98 * rx * Math.cos(radOffset + overlap),
      this._getOffset(-offset, offset, o) + cy + 0.98 * ry * Math.sin(radOffset + overlap)
    ]);
    points.push([
      this._getOffset(-offset, offset, o) + cx + 0.9 * rx * Math.cos(radOffset + overlap * 0.5),
      this._getOffset(-offset, offset, o) + cy + 0.9 * ry * Math.sin(radOffset + overlap * 0.5)
    ]);
    return this._curve(points, null, o);
  }

  _curveWithOffset(points, offset, o) {
    const ps = [];
    ps.push([
      points[0][0] + this._getOffset(-offset, offset, o),
      points[0][1] + this._getOffset(-offset, offset, o),
    ]);
    ps.push([
      points[0][0] + this._getOffset(-offset, offset, o),
      points[0][1] + this._getOffset(-offset, offset, o),
    ]);
    for (let i = 1; i < points.length; i++) {
      ps.push([
        points[i][0] + this._getOffset(-offset, offset, o),
        points[i][1] + this._getOffset(-offset, offset, o),
      ]);
      if (i === (points.length - 1)) {
        ps.push([
          points[i][0] + this._getOffset(-offset, offset, o),
          points[i][1] + this._getOffset(-offset, offset, o),
        ]);
      }
    }
    return this._curve(ps, null, o);
  }

  _arc(increment, cx, cy, rx, ry, strt, stp, offset, o) {
    const radOffset = strt + this._getOffset(-0.1, 0.1, o);
    const points = [];
    points.push([
      this._getOffset(-offset, offset, o) + cx + 0.9 * rx * Math.cos(radOffset - increment),
      this._getOffset(-offset, offset, o) + cy + 0.9 * ry * Math.sin(radOffset - increment)
    ]);
    for (let angle = radOffset; angle <= stp; angle = angle + increment) {
      points.push([
        this._getOffset(-offset, offset, o) + cx + rx * Math.cos(angle),
        this._getOffset(-offset, offset, o) + cy + ry * Math.sin(angle)
      ]);
    }
    points.push([
      cx + rx * Math.cos(stp),
      cy + ry * Math.sin(stp)
    ]);
    points.push([
      cx + rx * Math.cos(stp),
      cy + ry * Math.sin(stp)
    ]);
    return this._curve(points, null, o);
  }

  _getIntersectingLines(lineCoords, xCoords, yCoords) {
    let intersections = [];
    var s1 = new RoughSegment(lineCoords[0], lineCoords[1], lineCoords[2], lineCoords[3]);
    for (var i = 0; i < xCoords.length; i++) {
      let s2 = new RoughSegment(xCoords[i], yCoords[i], xCoords[(i + 1) % xCoords.length], yCoords[(i + 1) % xCoords.length]);
      if (s1.compare(s2) == RoughSegmentRelation.INTERSECTS) {
        intersections.push([s1.xi, s1.yi]);
      }
    }
    return intersections;
  }
}