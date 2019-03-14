import { ResolvedOptions, Op, OpSet } from './core';
import { Point } from './geometry';
import { RoughPath, PathFitter, Segment, RoughArcConverter } from './path.js';
import { getFiller } from './fillers/filler';
import { RenderHelper } from './fillers/filler-interface';

const helper: RenderHelper = {
  randOffset,
  randOffsetWithRange,
  ellipse,
  doubleLineOps
};

export function line(x1: number, y1: number, x2: number, y2: number, o: ResolvedOptions): OpSet {
  return { type: 'path', ops: _doubleLine(x1, y1, x2, y2, o) };
}

export function linearPath(points: Point[], close: boolean, o: ResolvedOptions): OpSet {
  const len = (points || []).length;
  if (len > 2) {
    let ops: Op[] = [];
    for (let i = 0; i < (len - 1); i++) {
      ops = ops.concat(_doubleLine(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], o));
    }
    if (close) {
      ops = ops.concat(_doubleLine(points[len - 1][0], points[len - 1][1], points[0][0], points[0][1], o));
    }
    return { type: 'path', ops };
  } else if (len === 2) {
    return line(points[0][0], points[0][1], points[1][0], points[1][1], o);
  }
  return { type: 'path', ops: [] };
}

export function polygon(points: Point[], o: ResolvedOptions): OpSet {
  return linearPath(points, true, o);
}

export function rectangle(x: number, y: number, width: number, height: number, o: ResolvedOptions): OpSet {
  const points: Point[] = [
    [x, y], [x + width, y], [x + width, y + height], [x, y + height]
  ];
  return polygon(points, o);
}

export function curve(points: Point[], o: ResolvedOptions): OpSet {
  const o1 = _curveWithOffset(points, 1 * (1 + o.roughness * 0.2), o);
  const o2 = _curveWithOffset(points, 1.5 * (1 + o.roughness * 0.22), o);
  return { type: 'path', ops: o1.concat(o2) };
}

export function ellipse(x: number, y: number, width: number, height: number, o: ResolvedOptions): OpSet {
  const increment = (Math.PI * 2) / o.curveStepCount;
  let rx = Math.abs(width / 2);
  let ry = Math.abs(height / 2);
  rx += _offsetOpt(rx * 0.05, o);
  ry += _offsetOpt(ry * 0.05, o);
  const o1 = _ellipse(increment, x, y, rx, ry, 1, increment * _offset(0.1, _offset(0.4, 1, o), o), o);
  const o2 = _ellipse(increment, x, y, rx, ry, 1.5, 0, o);
  return { type: 'path', ops: o1.concat(o2) };
}

export function arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean, roughClosure: boolean, o: ResolvedOptions): OpSet {
  const cx = x;
  const cy = y;
  let rx = Math.abs(width / 2);
  let ry = Math.abs(height / 2);
  rx += _offsetOpt(rx * 0.01, o);
  ry += _offsetOpt(ry * 0.01, o);
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
  const ellipseInc = (Math.PI * 2) / o.curveStepCount;
  const arcInc = Math.min(ellipseInc / 2, (stp - strt) / 2);
  const o1 = _arc(arcInc, cx, cy, rx, ry, strt, stp, 1, o);
  const o2 = _arc(arcInc, cx, cy, rx, ry, strt, stp, 1.5, o);
  let ops = o1.concat(o2);
  if (closed) {
    if (roughClosure) {
      ops = ops.concat(_doubleLine(cx, cy, cx + rx * Math.cos(strt), cy + ry * Math.sin(strt), o));
      ops = ops.concat(_doubleLine(cx, cy, cx + rx * Math.cos(stp), cy + ry * Math.sin(stp), o));
    } else {
      ops.push({ op: 'lineTo', data: [cx, cy] });
      ops.push({ op: 'lineTo', data: [cx + rx * Math.cos(strt), cy + ry * Math.sin(strt)] });
    }
  }
  return { type: 'path', ops };
}

export function svgPath(path: string, o: ResolvedOptions): OpSet {
  path = (path || '').replace(/\n/g, ' ').replace(/(-\s)/g, '-').replace('/(\s\s)/g', ' ');
  let p = new RoughPath(path);
  if (o.simplification) {
    const fitter = new PathFitter(p.linearPoints, p.closed);
    const d = fitter.fit(o.simplification);
    p = new RoughPath(d);
  }
  let ops: Op[] = [];
  const segments = p.segments || [];
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const prev = i > 0 ? segments[i - 1] : null;
    const opList = _processSegment(p, s, prev, o);
    if (opList && opList.length) {
      ops = ops.concat(opList);
    }
  }
  return { type: 'path', ops };
}

// Fills

export function solidFillPolygon(points: Point[], o: ResolvedOptions): OpSet {
  const ops: Op[] = [];
  if (points.length) {
    const offset = o.maxRandomnessOffset || 0;
    const len = points.length;
    if (len > 2) {
      ops.push({ op: 'move', data: [points[0][0] + _offsetOpt(offset, o), points[0][1] + _offsetOpt(offset, o)] });
      for (let i = 1; i < len; i++) {
        ops.push({ op: 'lineTo', data: [points[i][0] + _offsetOpt(offset, o), points[i][1] + _offsetOpt(offset, o)] });
      }
    }
  }
  return { type: 'fillPath', ops };
}

export function patternFillPolygon(points: Point[], o: ResolvedOptions): OpSet {
  return getFiller(o, helper).fillPolygon(points, o);
}

export function patternFillEllipse(cx: number, cy: number, width: number, height: number, o: ResolvedOptions): OpSet {
  return getFiller(o, helper).fillEllipse(cx, cy, width, height, o);
}

export function patternFillArc(x: number, y: number, width: number, height: number, start: number, stop: number, o: ResolvedOptions): OpSet {
  const arcfill = getFiller(o, helper).fillArc(x, y, width, height, start, stop, o);
  if (arcfill) {
    return arcfill;
  }
  // fall back to polygon approximation
  const cx = x;
  const cy = y;
  let rx = Math.abs(width / 2);
  let ry = Math.abs(height / 2);
  rx += _offsetOpt(rx * 0.01, o);
  ry += _offsetOpt(ry * 0.01, o);
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
  const increment = (stp - strt) / o.curveStepCount;
  const points: Point[] = [];
  for (let angle = strt; angle <= stp; angle = angle + increment) {
    points.push([cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)]);
  }
  points.push([cx + rx * Math.cos(stp), cy + ry * Math.sin(stp)]);
  points.push([cx, cy]);
  return patternFillPolygon(points, o);
}

export function randOffset(x: number, o: ResolvedOptions): number {
  return _offsetOpt(x, o);
}

export function randOffsetWithRange(min: number, max: number, o: ResolvedOptions): number {
  return _offset(min, max, o);
}

export function doubleLineOps(x1: number, y1: number, x2: number, y2: number, o: ResolvedOptions): Op[] {
  return _doubleLine(x1, y1, x2, y2, o);
}

// Private helpers

function _offset(min: number, max: number, ops: ResolvedOptions): number {
  return ops.roughness * ((Math.random() * (max - min)) + min);
}

function _offsetOpt(x: number, ops: ResolvedOptions): number {
  return _offset(-x, x, ops);
}

function _doubleLine(x1: number, y1: number, x2: number, y2: number, o: ResolvedOptions): Op[] {
  const o1 = _line(x1, y1, x2, y2, o, true, false);
  const o2 = _line(x1, y1, x2, y2, o, true, true);
  return o1.concat(o2);
}

function _line(x1: number, y1: number, x2: number, y2: number, o: ResolvedOptions, move: boolean, overlay: boolean): Op[] {
  const lengthSq = Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2);
  let offset = o.maxRandomnessOffset || 0;
  if ((offset * offset * 100) > lengthSq) {
    offset = Math.sqrt(lengthSq) / 10;
  }
  const halfOffset = offset / 2;
  const divergePoint = 0.2 + Math.random() * 0.2;
  let midDispX = o.bowing * o.maxRandomnessOffset * (y2 - y1) / 200;
  let midDispY = o.bowing * o.maxRandomnessOffset * (x1 - x2) / 200;
  midDispX = _offsetOpt(midDispX, o);
  midDispY = _offsetOpt(midDispY, o);
  const ops: Op[] = [];
  const randomHalf = () => _offsetOpt(halfOffset, o);
  const randomFull = () => _offsetOpt(offset, o);
  if (move) {
    if (overlay) {
      ops.push({
        op: 'move', data: [
          x1 + randomHalf(),
          y1 + randomHalf()
        ]
      });
    } else {
      ops.push({
        op: 'move', data: [
          x1 + _offsetOpt(offset, o),
          y1 + _offsetOpt(offset, o)
        ]
      });
    }
  }
  if (overlay) {
    ops.push({
      op: 'bcurveTo', data: [
        midDispX + x1 + (x2 - x1) * divergePoint + randomHalf(),
        midDispY + y1 + (y2 - y1) * divergePoint + randomHalf(),
        midDispX + x1 + 2 * (x2 - x1) * divergePoint + randomHalf(),
        midDispY + y1 + 2 * (y2 - y1) * divergePoint + randomHalf(),
        x2 + randomHalf(),
        y2 + randomHalf()
      ]
    });
  } else {
    ops.push({
      op: 'bcurveTo', data: [
        midDispX + x1 + (x2 - x1) * divergePoint + randomFull(),
        midDispY + y1 + (y2 - y1) * divergePoint + randomFull(),
        midDispX + x1 + 2 * (x2 - x1) * divergePoint + randomFull(),
        midDispY + y1 + 2 * (y2 - y1) * divergePoint + randomFull(),
        x2 + randomFull(),
        y2 + randomFull()
      ]
    });
  }
  return ops;
}

function _curveWithOffset(points: Point[], offset: number, o: ResolvedOptions): Op[] {
  const ps: Point[] = [];
  ps.push([
    points[0][0] + _offsetOpt(offset, o),
    points[0][1] + _offsetOpt(offset, o),
  ]);
  ps.push([
    points[0][0] + _offsetOpt(offset, o),
    points[0][1] + _offsetOpt(offset, o),
  ]);
  for (let i = 1; i < points.length; i++) {
    ps.push([
      points[i][0] + _offsetOpt(offset, o),
      points[i][1] + _offsetOpt(offset, o),
    ]);
    if (i === (points.length - 1)) {
      ps.push([
        points[i][0] + _offsetOpt(offset, o),
        points[i][1] + _offsetOpt(offset, o),
      ]);
    }
  }
  return _curve(ps, null, o);
}

function _curve(points: Point[], closePoint: Point | null, o: ResolvedOptions): Op[] {
  const len = points.length;
  let ops: Op[] = [];
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
      const ro = o.maxRandomnessOffset;
      ops.push({ op: 'lineTo', data: [closePoint[0] + _offsetOpt(ro, o), closePoint[1] + _offsetOpt(ro, o)] });
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
    ops = ops.concat(_doubleLine(points[0][0], points[0][1], points[1][0], points[1][1], o));
  }
  return ops;
}

function _ellipse(increment: number, cx: number, cy: number, rx: number, ry: number, offset: number, overlap: number, o: ResolvedOptions): Op[] {
  const radOffset = _offsetOpt(0.5, o) - (Math.PI / 2);
  const points: Point[] = [];
  points.push([
    _offsetOpt(offset, o) + cx + 0.9 * rx * Math.cos(radOffset - increment),
    _offsetOpt(offset, o) + cy + 0.9 * ry * Math.sin(radOffset - increment)
  ]);
  for (let angle = radOffset; angle < (Math.PI * 2 + radOffset - 0.01); angle = angle + increment) {
    points.push([
      _offsetOpt(offset, o) + cx + rx * Math.cos(angle),
      _offsetOpt(offset, o) + cy + ry * Math.sin(angle)
    ]);
  }
  points.push([
    _offsetOpt(offset, o) + cx + rx * Math.cos(radOffset + Math.PI * 2 + overlap * 0.5),
    _offsetOpt(offset, o) + cy + ry * Math.sin(radOffset + Math.PI * 2 + overlap * 0.5)
  ]);
  points.push([
    _offsetOpt(offset, o) + cx + 0.98 * rx * Math.cos(radOffset + overlap),
    _offsetOpt(offset, o) + cy + 0.98 * ry * Math.sin(radOffset + overlap)
  ]);
  points.push([
    _offsetOpt(offset, o) + cx + 0.9 * rx * Math.cos(radOffset + overlap * 0.5),
    _offsetOpt(offset, o) + cy + 0.9 * ry * Math.sin(radOffset + overlap * 0.5)
  ]);
  return _curve(points, null, o);
}

function _arc(increment: number, cx: number, cy: number, rx: number, ry: number, strt: number, stp: number, offset: number, o: ResolvedOptions) {
  const radOffset = strt + _offsetOpt(0.1, o);
  const points: Point[] = [];
  points.push([
    _offsetOpt(offset, o) + cx + 0.9 * rx * Math.cos(radOffset - increment),
    _offsetOpt(offset, o) + cy + 0.9 * ry * Math.sin(radOffset - increment)
  ]);
  for (let angle = radOffset; angle <= stp; angle = angle + increment) {
    points.push([
      _offsetOpt(offset, o) + cx + rx * Math.cos(angle),
      _offsetOpt(offset, o) + cy + ry * Math.sin(angle)
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
  return _curve(points, null, o);
}

function _bezierTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number, path: RoughPath, o: ResolvedOptions): Op[] {
  const ops: Op[] = [];
  const ros = [o.maxRandomnessOffset || 1, (o.maxRandomnessOffset || 1) + 0.5];
  let f: Point = [0, 0];
  for (let i = 0; i < 2; i++) {
    if (i === 0) {
      ops.push({ op: 'move', data: [path.x, path.y] });
    } else {
      ops.push({ op: 'move', data: [path.x + _offsetOpt(ros[0], o), path.y + _offsetOpt(ros[0], o)] });
    }
    f = [x + _offsetOpt(ros[i], o), y + _offsetOpt(ros[i], o)];
    ops.push({
      op: 'bcurveTo', data: [
        x1 + _offsetOpt(ros[i], o), y1 + _offsetOpt(ros[i], o),
        x2 + _offsetOpt(ros[i], o), y2 + _offsetOpt(ros[i], o),
        f[0], f[1]
      ]
    });
  }
  path.setPosition(f[0], f[1]);
  return ops;
}

function _processSegment(path: RoughPath, seg: Segment, prevSeg: Segment | null, o: ResolvedOptions): Op[] {
  let ops: Op[] = [];
  switch (seg.key) {
    case 'M':
    case 'm': {
      const delta = seg.key === 'm';
      if (seg.data.length >= 2) {
        let x = +seg.data[0];
        let y = +seg.data[1];
        if (delta) {
          x += path.x;
          y += path.y;
        }
        const ro = 1 * (o.maxRandomnessOffset || 0);
        x = x + _offsetOpt(ro, o);
        y = y + _offsetOpt(ro, o);
        path.setPosition(x, y);
        ops.push({ op: 'move', data: [x, y] });
      }
      break;
    }
    case 'L':
    case 'l': {
      const delta = seg.key === 'l';
      if (seg.data.length >= 2) {
        let x = +seg.data[0];
        let y = +seg.data[1];
        if (delta) {
          x += path.x;
          y += path.y;
        }
        ops = ops.concat(_doubleLine(path.x, path.y, x, y, o));
        path.setPosition(x, y);
      }
      break;
    }
    case 'H':
    case 'h': {
      const delta = seg.key === 'h';
      if (seg.data.length) {
        let x = +seg.data[0];
        if (delta) {
          x += path.x;
        }
        ops = ops.concat(_doubleLine(path.x, path.y, x, path.y, o));
        path.setPosition(x, path.y);
      }
      break;
    }
    case 'V':
    case 'v': {
      const delta = seg.key === 'v';
      if (seg.data.length) {
        let y = +seg.data[0];
        if (delta) {
          y += path.y;
        }
        ops = ops.concat(_doubleLine(path.x, path.y, path.x, y, o));
        path.setPosition(path.x, y);
      }
      break;
    }
    case 'Z':
    case 'z': {
      if (path.first) {
        ops = ops.concat(_doubleLine(path.x, path.y, path.first[0], path.first[1], o));
        path.setPosition(path.first[0], path.first[1]);
        path.first = null;
      }
      break;
    }
    case 'C':
    case 'c': {
      const delta = seg.key === 'c';
      if (seg.data.length >= 6) {
        let x1 = +seg.data[0];
        let y1 = +seg.data[1];
        let x2 = +seg.data[2];
        let y2 = +seg.data[3];
        let x = +seg.data[4];
        let y = +seg.data[5];
        if (delta) {
          x1 += path.x;
          x2 += path.x;
          x += path.x;
          y1 += path.y;
          y2 += path.y;
          y += path.y;
        }
        const ob = _bezierTo(x1, y1, x2, y2, x, y, path, o);
        ops = ops.concat(ob);
        path.bezierReflectionPoint = [x + (x - x2), y + (y - y2)];
      }
      break;
    }
    case 'S':
    case 's': {
      const delta = seg.key === 's';
      if (seg.data.length >= 4) {
        let x2 = +seg.data[0];
        let y2 = +seg.data[1];
        let x = +seg.data[2];
        let y = +seg.data[3];
        if (delta) {
          x2 += path.x;
          x += path.x;
          y2 += path.y;
          y += path.y;
        }
        let x1 = x2;
        let y1 = y2;
        const prevKey = prevSeg ? prevSeg.key : '';
        let ref: Point | null = null;
        if (prevKey === 'c' || prevKey === 'C' || prevKey === 's' || prevKey === 'S') {
          ref = path.bezierReflectionPoint;
        }
        if (ref) {
          x1 = ref[0];
          y1 = ref[1];
        }
        const ob = _bezierTo(x1, y1, x2, y2, x, y, path, o);
        ops = ops.concat(ob);
        path.bezierReflectionPoint = [x + (x - x2), y + (y - y2)];
      }
      break;
    }
    case 'Q':
    case 'q': {
      const delta = seg.key === 'q';
      if (seg.data.length >= 4) {
        let x1 = +seg.data[0];
        let y1 = +seg.data[1];
        let x = +seg.data[2];
        let y = +seg.data[3];
        if (delta) {
          x1 += path.x;
          x += path.x;
          y1 += path.y;
          y += path.y;
        }
        const offset1 = 1 * (1 + o.roughness * 0.2);
        const offset2 = 1.5 * (1 + o.roughness * 0.22);
        ops.push({ op: 'move', data: [path.x + _offsetOpt(offset1, o), path.y + _offsetOpt(offset1, o)] });
        let f = [x + _offsetOpt(offset1, o), y + _offsetOpt(offset1, o)];
        ops.push({
          op: 'qcurveTo', data: [
            x1 + _offsetOpt(offset1, o), y1 + _offsetOpt(offset1, o),
            f[0], f[1]
          ]
        });
        ops.push({ op: 'move', data: [path.x + _offsetOpt(offset2, o), path.y + _offsetOpt(offset2, o)] });
        f = [x + _offsetOpt(offset2, o), y + _offsetOpt(offset2, o)];
        ops.push({
          op: 'qcurveTo', data: [
            x1 + _offsetOpt(offset2, o), y1 + _offsetOpt(offset2, o),
            f[0], f[1]
          ]
        });
        path.setPosition(f[0], f[1]);
        path.quadReflectionPoint = [x + (x - x1), y + (y - y1)];
      }
      break;
    }
    case 'T':
    case 't': {
      const delta = seg.key === 't';
      if (seg.data.length >= 2) {
        let x = +seg.data[0];
        let y = +seg.data[1];
        if (delta) {
          x += path.x;
          y += path.y;
        }
        let x1 = x;
        let y1 = y;
        const prevKey = prevSeg ? prevSeg.key : '';
        let ref: Point | null = null;
        if (prevKey === 'q' || prevKey === 'Q' || prevKey === 't' || prevKey === 'T') {
          ref = path.quadReflectionPoint;
        }
        if (ref) {
          x1 = ref[0];
          y1 = ref[1];
        }
        const offset1 = 1 * (1 + o.roughness * 0.2);
        const offset2 = 1.5 * (1 + o.roughness * 0.22);
        ops.push({ op: 'move', data: [path.x + _offsetOpt(offset1, o), path.y + _offsetOpt(offset1, o)] });
        let f = [x + _offsetOpt(offset1, o), y + _offsetOpt(offset1, o)];
        ops.push({
          op: 'qcurveTo', data: [
            x1 + _offsetOpt(offset1, o), y1 + _offsetOpt(offset1, o),
            f[0], f[1]
          ]
        });
        ops.push({ op: 'move', data: [path.x + _offsetOpt(offset2, o), path.y + _offsetOpt(offset2, o)] });
        f = [x + _offsetOpt(offset2, o), y + _offsetOpt(offset2, o)];
        ops.push({
          op: 'qcurveTo', data: [
            x1 + _offsetOpt(offset2, o), y1 + _offsetOpt(offset2, o),
            f[0], f[1]
          ]
        });
        path.setPosition(f[0], f[1]);
        path.quadReflectionPoint = [x + (x - x1), y + (y - y1)];
      }
      break;
    }
    case 'A':
    case 'a': {
      const delta = seg.key === 'a';
      if (seg.data.length >= 7) {
        const rx = +seg.data[0];
        const ry = +seg.data[1];
        const angle = +seg.data[2];
        const largeArcFlag = +seg.data[3];
        const sweepFlag = +seg.data[4];
        let x = +seg.data[5];
        let y = +seg.data[6];
        if (delta) {
          x += path.x;
          y += path.y;
        }
        if (x === path.x && y === path.y) {
          break;
        }
        if (rx === 0 || ry === 0) {
          ops = ops.concat(_doubleLine(path.x, path.y, x, y, o));
          path.setPosition(x, y);
        } else {
          for (let i = 0; i < 1; i++) {
            const arcConverter = new RoughArcConverter(
              [path.x, path.y],
              [x, y],
              [rx, ry],
              angle,
              largeArcFlag ? true : false,
              sweepFlag ? true : false
            );
            let segment = arcConverter.getNextSegment();
            while (segment) {
              const ob = _bezierTo(segment.cp1[0], segment.cp1[1], segment.cp2[0], segment.cp2[1], segment.to[0], segment.to[1], path, o);
              ops = ops.concat(ob);
              segment = arcConverter.getNextSegment();
            }
          }
        }
      }
      break;
    }
    default:
      break;
  }
  return ops;
}