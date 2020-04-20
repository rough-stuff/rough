export type Point = [number, number];
export type Line = [Point, Point];

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function rotatePoints(points: Point[], center: Point, degrees: number): void {
  if (points && points.length) {
    const [cx, cy] = center;
    const angle = (Math.PI / 180) * degrees;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    points.forEach((p) => {
      const [x, y] = p;
      p[0] = ((x - cx) * cos) - ((y - cy) * sin) + cx;
      p[1] = ((x - cx) * sin) + ((y - cy) * cos) + cy;
    });
  }
}

export function rotateLines(lines: Line[], center: Point, degrees: number): void {
  const points: Point[] = [];
  lines.forEach((line) => points.push(...line));
  rotatePoints(points, center, degrees);
}

export function lineLength(line: Line): number {
  const p1 = line[0];
  const p2 = line[1];
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}

export function lineIntersection(a: Point, b: Point, c: Point, d: Point): Point | null {
  const a1 = b[1] - a[1];
  const b1 = a[0] - b[0];
  const c1 = a1 * (a[0]) + b1 * (a[1]);
  const a2 = d[1] - c[1];
  const b2 = c[0] - d[0];
  const c2 = a2 * (c[0]) + b2 * (c[1]);
  const determinant = a1 * b2 - a2 * b1;
  return determinant ? [(b2 * c1 - b1 * c2) / determinant, (a1 * c2 - a2 * c1) / determinant] : null;
}

export function isPointInPolygon(points: Point[], x: number, y: number, ): boolean {
  const vertices = points.length;

  // There must be at least 3 vertices in polygon
  if (vertices < 3) {
    return false;
  }
  const extreme: Point = [Number.MAX_SAFE_INTEGER, y];
  const p: Point = [x, y];
  let count = 0;
  for (let i = 0; i < vertices; i++) {
    const current = points[i];
    const next = points[(i + 1) % vertices];
    if (doIntersect(current, next, p, extreme)) {
      if (orientation(current, p, next) === 0) {
        return onSegment(current, p, next);
      }
      count++;
    }
  }
  // true if count is off
  return count % 2 === 1;
}

// Check if q lies on the line segment pr
function onSegment(p: Point, q: Point, r: Point) {
  return (
    q[0] <= Math.max(p[0], r[0]) &&
    q[0] >= Math.min(p[0], r[0]) &&
    q[1] <= Math.max(p[1], r[1]) &&
    q[1] >= Math.min(p[1], r[1])
  );
}

// For the ordered points p, q, r, return
// 0 if p, q, r are collinear
// 1 if Clockwise
// 2 if counterclickwise
function orientation(p: Point, q: Point, r: Point) {
  const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
  if (val === 0) {
    return 0;
  }
  return val > 0 ? 1 : 2;
}

// Check is p1q1 intersects with p2q2
export function doIntersect(p1: Point, q1: Point, p2: Point, q2: Point) {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) {
    return true;
  }

  // p1, q1 and p2 are colinear and p2 lies on segment p1q1
  if (o1 === 0 && onSegment(p1, p2, q1)) {
    return true;
  }

  // p1, q1 and p2 are colinear and q2 lies on segment p1q1
  if (o2 === 0 && onSegment(p1, q2, q1)) {
    return true;
  }

  // p2, q2 and p1 are colinear and p1 lies on segment p2q2
  if (o3 === 0 && onSegment(p2, p1, q2)) {
    return true;
  }

  // p2, q2 and q1 are colinear and q1 lies on segment p2q2
  if (o4 === 0 && onSegment(p2, q1, q2)) {
    return true;
  }

  return false;
}