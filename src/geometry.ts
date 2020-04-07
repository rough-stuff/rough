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

export function getPointsOnBezierCurves(points: Point[], tolerance: number): Point[] {
  const newPoints: Point[] = [];
  const numSegments = (points.length - 1) / 3;
  for (let i = 0; i < numSegments; i++) {
    const offset = i * 3;
    getPointsOnBezierCurveWithSplitting(points, offset, tolerance, newPoints);
  }
  return newPoints;
}

function lerp(a: Point, b: Point, t: number): Point {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ];
}

function flatness(points: Point[], offset: number): number {
  const p1 = points[offset + 0];
  const p2 = points[offset + 1];
  const p3 = points[offset + 2];
  const p4 = points[offset + 3];

  let ux = 3 * p2[0] - 2 * p1[0] - p4[0]; ux *= ux;
  let uy = 3 * p2[1] - 2 * p1[1] - p4[1]; uy *= uy;
  let vx = 3 * p3[0] - 2 * p4[0] - p1[0]; vx *= vx;
  let vy = 3 * p3[1] - 2 * p4[1] - p1[1]; vy *= vy;

  if (ux < vx) {
    ux = vx;
  }

  if (uy < vy) {
    uy = vy;
  }

  return ux + uy;
}

function getPointsOnBezierCurveWithSplitting(points: Point[], offset: number, tolerance: number, newPoints: Point[]) {
  const outPoints = newPoints || [];
  if (flatness(points, offset) < tolerance) {
    const p0 = points[offset + 0];
    if (outPoints.length) {
      const d = lineLength([outPoints[outPoints.length - 1], p0]);
      if (d > 1) {
        outPoints.push(p0);
      }
    } else {
      outPoints.push(p0);
    }
    outPoints.push(points[offset + 3]);
  } else {
    // subdivide
    const t = .5;
    const p1 = points[offset + 0];
    const p2 = points[offset + 1];
    const p3 = points[offset + 2];
    const p4 = points[offset + 3];

    const q1 = lerp(p1, p2, t);
    const q2 = lerp(p2, p3, t);
    const q3 = lerp(p3, p4, t);

    const r1 = lerp(q1, q2, t);
    const r2 = lerp(q2, q3, t);

    const red = lerp(r1, r2, t);

    getPointsOnBezierCurveWithSplitting([p1, q1, r1, red], 0, tolerance, outPoints);
    getPointsOnBezierCurveWithSplitting([red, r2, q3, p4], 0, tolerance, outPoints);
  }
  return outPoints;
}