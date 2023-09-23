export type Point = [number, number];
export type Line = [Point, Point];

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function lineLength(line: Line): number {
  const p1 = line[0];
  const p2 = line[1];
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}