import { ProgramInfo, createProgramInfo, createBufferInfoFromArrays, resizeCanvasToDisplaySize, setAttributes, setUniforms } from './webgl-utils';
import { Point } from './geometry';
import { Drawable, Op } from './core';
import { DEFAULT_OPTIONS } from './generator';
import { parseColor } from './colors';

//Defines shaders
const vsSource = `
attribute float a_vertexId;
uniform float u_numVerts;
uniform vec2 u_resolution;
uniform vec2 u_p1;
uniform vec2 u_p2;
uniform vec2 u_cp1;
uniform vec2 u_cp2;

vec2 bezier(in vec2 p0, in vec2 p1, in vec2 p2, in vec2 p3, in float t) {
  float tt = (1.0 - t) * (1.0 - t);
  return  tt * (1.0 - t) * p0 +
          3.0 * t * tt * p1 +
          3.0 * t * t * (1.0 - t) * p2 +
          t * t * t * p3;
}

vec2 bezier2(in vec2 p0, in vec2 p1, in vec2 p2, in vec2 p3, in float t) {
    vec2 q0 = mix(p0, p1, t);
    vec2 q1 = mix(p1, p2, t);
    vec2 q2 = mix(p2, p3, t);
    vec2 r0 = mix(q0, q1, t);
    vec2 r1 = mix(q1, q2, t);
    return mix(r0, r1, t);
}

void main() {
  float t = a_vertexId / u_numVerts;
  vec2 point = bezier(u_p1, u_cp1, u_cp2, u_p2, t);

  vec2 zeroToOne = point / u_resolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clipSpace = zeroToTwo - 1.0;
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`;

const fsSource = `
precision mediump float;
uniform vec4 u_color;

void main() {
  gl_FragColor = u_color;
}
`;

type BCURVE = [Point, Point, Point, Point];

export class RoughWebGL {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private pi: ProgramInfo;
  private defaultOptions = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl')!;
    if (!this.gl) {
      throw new Error('Unable to initialize WebGL. Your browser or machine may not support it.');
    }
    this.pi = createProgramInfo(this.gl, [vsSource, fsSource]);
  }

  draw(drawings: Drawable | Drawable[], clearScene = false) {
    const drawables = Array.isArray(drawings) ? drawings : [drawings];
    if (clearScene) {
      this.clearCanvas();
    }
    this.initializeCanvas();

    for (const drawable of drawables) {
      const sets = drawable.sets || [];
      const o = drawable.options || this.defaultOptions;
      for (const drawing of sets) {
        switch (drawing.type) {
          case 'path':
            const curvePoints = this.extractCurvePoints(drawing.ops);
            this.drawCurves(curvePoints, o.strokeWidth, o.stroke === 'none' ? 'transparent' : o.stroke);
            break;
          case 'fillSketch': {
            let fweight = o.fillWeight;
            if (fweight < 0) {
              fweight = o.strokeWidth / 2;
            }
            const curvePoints = this.extractCurvePoints(drawing.ops);
            this.drawCurves(curvePoints, fweight, o.fill || '');
            break;
          }
        }
      }
    }
  }

  private extractCurvePoints(ops: Op[]): BCURVE[] {
    const curves: BCURVE[] = [];
    let lastPoint: Point = [0, 0];
    for (const op of ops) {
      switch (op.op) {
        case 'move':
          lastPoint = op.data as Point;
          break;
        case 'bcurveTo':
          const curve: BCURVE = [
            lastPoint,
            [op.data[0], op.data[1]],
            [op.data[2], op.data[3]],
            [op.data[4], op.data[5]]
          ];
          curves.push(curve);
          lastPoint = curve[3];
          break;
      }
    }
    return curves;
  }

  clearCanvas() {
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  private initializeCanvas() {
    resizeCanvasToDisplaySize(this.canvas);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
  }

  private drawCurves(curves: BCURVE[], _lineWidth: number, color: string) {
    console.log('curve count', curves.length);
    for (const curve of curves) {
      // Initialize sample size
      const numVerts = 150;
      const vertIds: number[] = [];
      for (let i = 0; i < numVerts; i++) {
        vertIds.push(i);
      }

      // Load Ids to buffer
      const bufferInfo = createBufferInfoFromArrays(this.gl, {
        vertexId: {
          numComponents: 1,
          data: vertIds
        }
      });

      // use program
      this.gl.useProgram(this.pi.program);

      // set attributes
      setAttributes(this.pi.attribSetters, bufferInfo.attribs);

      // set uniform
      setUniforms(this.pi.uniformSetters, {
        u_numVerts: numVerts - 1,
        u_resolution: [this.gl.canvas.width, this.gl.canvas.height],
        u_p1: curve[0],
        u_cp1: curve[1],
        u_cp2: curve[2],
        u_p2: curve[3],
        u_color: parseColor(color)
      });

      // Draw
      this.gl.drawArrays(this.gl.LINE_STRIP, 0, bufferInfo.numElements);
    }
  }
}