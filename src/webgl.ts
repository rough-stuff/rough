import { ProgramInfo, createProgramInfo, createBufferInfoFromArrays, resizeCanvasToDisplaySize, setAttributes, UniformValues, setUniforms } from './webgl-utils';
import { Point } from './geometry';
import { getPointsOnBezierCurves, simplifyPoints } from './bezier';
import { Drawable, Op } from './core';
import { DEFAULT_OPTIONS } from './generator';
import { parseColor } from './colors';

export interface RoughWebGLRenderOptions {
  tolerance: number;
  distance: number;
}

const DEFAULT_GL_OPTS: RoughWebGLRenderOptions = {
  tolerance: 0.15,
  distance: .4
};

//Defines shaders
const vsSource = `
attribute vec2 a_position;
uniform vec2 u_resolution;

void main() {
  vec2 zeroToOne = a_position / u_resolution;
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
      console.log(drawable);
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

  private extractCurvePoints(ops: Op[]): Point[][] {
    const curves: Point[][] = [];
    let currentCurve: Point[] = [];
    for (const op of ops) {
      switch (op.op) {
        case 'move':
          if (currentCurve.length > 1) {
            curves.push(currentCurve);
            currentCurve = [];
          }
          currentCurve.push(op.data as Point);
          break;
        case 'bcurveTo':
          currentCurve.push([op.data[0], op.data[1]]);
          currentCurve.push([op.data[2], op.data[3]]);
          currentCurve.push([op.data[4], op.data[5]]);
          break;
      }
    }
    if (currentCurve.length > 1) {
      curves.push(currentCurve);
      currentCurve = [];
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

  private drawCurves(curves: Point[][], _lineWidth: number, color: string, options?: RoughWebGLRenderOptions) {
    // Calculate curve points
    const opts = options || DEFAULT_GL_OPTS;
    let data: number[] = [];
    for (const curve of curves) {
      const curvePoints = getPointsOnBezierCurves(curve, opts.tolerance);
      data = simplifyPoints(curvePoints, 0, curvePoints.length, opts.distance, data);
    }

    // Initialize buffer
    const bufferInfo = createBufferInfoFromArrays(this.gl, {
      position: { numComponents: 2, data }
    });

    // use program
    this.gl.useProgram(this.pi.program);

    // set attributes
    setAttributes(this.pi.attribSetters, bufferInfo.attribs);

    // set uniform
    const uniformValues: UniformValues = {
      u_resolution: [this.gl.canvas.width, this.gl.canvas.height],
      u_color: parseColor(color)
    };
    setUniforms(this.pi.uniformSetters, uniformValues);

    // Draw
    this.gl.drawArrays(this.gl.LINES, 0, bufferInfo.numElements);
  }
}