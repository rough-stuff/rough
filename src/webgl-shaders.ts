export const vsSource = `
attribute vec2 a_vertexId;
attribute vec2 a_p1;
attribute vec2 a_p2;
attribute vec2 a_cp1;
attribute vec2 a_cp2;
attribute vec4 a_color;
attribute float a_thickness;
attribute float a_numVerts;

uniform vec2 u_resolution;

vec2 bezier(in vec2 p0, in vec2 p1, in vec2 p2, in vec2 p3, in float t) {
  float tt = (1.0 - t) * (1.0 - t);
  return  tt * (1.0 - t) * p0 +
          3.0 * t * tt * p1 +
          3.0 * t * t * (1.0 - t) * p2 +
          t * t * t * p3;
}

void main() {
  // calculate current, prev, next points
  vec2 current = bezier(a_p1, a_cp1, a_cp2, a_p2, a_vertexId.x / (a_numVerts - 1.0));
  vec2 prev = bezier(a_p1, a_cp1, a_cp2, a_p2, (a_vertexId.x - 1.0) / (a_numVerts - 1.0));
  vec2 next = bezier(a_p1, a_cp1, a_cp2, a_p2, (a_vertexId.x + 1.0) / (a_numVerts - 1.0));
  float directionOffset = a_vertexId.y;

  // Calculate tangent
  vec2 AB = normalize(current - prev);
  vec2 BC = normalize(next - current);
  vec2 tangent = normalize(AB + BC);

  // Normals - Orthogonal to tangents
  vec2 perp = vec2(-tangent.y, tangent.x);
  vec2 perpAB = vec2(-AB.y, AB.x);

  // miiter size
  float miterLength = a_thickness / dot(perp, perpAB);

  // compute position
  vec2 position = current + (directionOffset * perp * miterLength);

  vec2 zeroToOne = position / u_resolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clipSpace = zeroToTwo - 1.0;
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`;

export const fsSource = `
precision mediump float;

void main() {
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;