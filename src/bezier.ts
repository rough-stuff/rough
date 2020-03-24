import { Point, lerp, distanceToSegmentSq } from './geometry';

export function getPointsOnBezierCurves(points: Point[], tolerance: number): Point[] {
  const newPoints: Point[] = [];
  const numSegments = (points.length - 1) / 3;
  for (let i = 0; i < numSegments; i++) {
    const offset = i * 3;
    getPointsOnBezierCurveWithSplitting(points, offset, tolerance, newPoints);
  }
  return newPoints;
}

// Uses the Ramer–Douglas–Peucker algorithm
// https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm
export function simplifyPoints(points: Point[], start: number, end: number, epsilon: number, newPoints?: Point[]): Point[] {
  const outPoints: Point[] = newPoints || [];

  // find the most distant point from the line formed by the endpoints
  const s = points[start];
  const e = points[end - 1];
  let maxDistSq = 0;
  let maxNdx = 1;
  for (let i = start + 1; i < end - 1; ++i) {
    const distSq = distanceToSegmentSq(points[i], s, e);
    if (distSq > maxDistSq) {
      maxDistSq = distSq;
      maxNdx = i;
    }
  }

  // if that point is too far
  if (Math.sqrt(maxDistSq) > epsilon) {
    // split
    simplifyPoints(points, start, maxNdx + 1, epsilon, outPoints);
    simplifyPoints(points, maxNdx, end, epsilon, outPoints);
  } else {
    // add the 2 end points
    outPoints.push(s, e);
  }

  return outPoints;
}

// Compute the flateness of a curve
// https://seant23.files.wordpress.com/2010/11/piecewise_linear_approzimation.pdf
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
    // just add the end points of this curve
    outPoints.push(points[offset + 0]);
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