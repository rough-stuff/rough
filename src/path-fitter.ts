import { Segment } from 'path-data-parser/lib/parser';
import { Point, lineLength } from './geometry';

export function simplify(segments: Segment[], simplification: number): Segment[] {
  const sets: Point[][] = [];
  const setClosed: boolean[] = [];
  let points: Point[] = [];
  let start: Point = [0, 0];
  let closed = false;
  const pushPoints = () => {
    if (points.length) {
      sets.push(points);
      setClosed.push(closed);
    }
    closed = false;
    points = [];
  };
  for (const { key, data } of segments) {
    if (sets.length > 0) {
      break;
    }
    switch (key) {
      case 'M':
        pushPoints();
        start = [data[0], data[1]];
        points.push(start);
        break;
      case 'L':
        points.push([data[0], data[1]]);
        break;
      case 'Z':
        closed = true;
        pushPoints();
        break;
    }
  }
  pushPoints();

  const out: Segment[] = [];
  for (let si = 0; si < sets.length; si++) {
    const set = sets[si];
    let estLength = Math.floor(simplification * set.length);
    if (estLength < 5) {
      if (length <= 5) {
        continue;
      }
      estLength = 5;
    }
    const reduced = reduce(set, estLength);
    reduced.forEach((d, i) => {
      out.push({
        key: i === 0 ? 'M' : 'L',
        data: d
      });
    });
    if (setClosed[si]) {
      out.push({ key: 'Z', data: [] });
    }
  }
  return out;
}

function reduce(set: Point[], count: number): Point[] {
  if (set.length <= count) {
    return set;
  }
  const points: Point[] = set.slice(0);
  while (points.length > count) {
    const areas = [];
    let minArea = -1;
    let minIndex = -1;
    for (let i = 1; i < (points.length - 1); i++) {
      const a = lineLength([points[i - 1], points[i]]);
      const b = lineLength([points[i], points[i + 1]]);
      const c = lineLength([points[i - 1], points[i + 1]]);
      const s = (a + b + c) / 2.0;
      const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
      areas.push(area);
      if ((minArea < 0) || (area < minArea)) {
        minArea = area;
        minIndex = i;
      }
    }
    if (minIndex > 0) {
      points.splice(minIndex, 1);
    } else {
      break;
    }
  }
  return points;
}