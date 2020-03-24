import { ProgramInfo, createProgramInfo, createBufferInfoFromArrays, resizeCanvasToDisplaySize, setAttributes, UniformValues, setUniforms } from './webgl-utils';
import { Point } from './geometry';
import { getPointsOnBezierCurves, simplifyPoints } from './bezier';

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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl')!;
    if (!this.gl) {
      throw new Error('Unable to initialize WebGL. Your browser or machine may not support it.');
    }
    this.pi = createProgramInfo(this.gl, [vsSource, fsSource]);
  }

  drawCurves(curves: Point[][], options?: RoughWebGLRenderOptions) {
    // Calculate curve points
    const opts = options || DEFAULT_GL_OPTS;
    const data: number[] = [];
    for (const curve of curves) {
      const curvePoints = getPointsOnBezierCurves(curve, opts.tolerance);
      const simplifiedPoints = simplifyPoints(curvePoints, 0, curvePoints.length, opts.distance);
      simplifiedPoints.forEach((d) => {
        data.push(...d);
      });
    }

    // Initialize buffer
    const bufferInfo = createBufferInfoFromArrays(this.gl, {
      position: { numComponents: 2, data }
    });

    // initialize canvas
    // TODO: probbaly not do this or make it optional
    resizeCanvasToDisplaySize(this.canvas);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // use program
    this.gl.useProgram(this.pi.program);

    // set attributes
    setAttributes(this.pi.attribSetters, bufferInfo.attribs);

    // set uniform
    const uniformValues: UniformValues = {
      u_resolution: [this.gl.canvas.width, this.gl.canvas.height],
      u_color: [Math.random(), Math.random(), Math.random(), 1]
    };
    setUniforms(this.pi.uniformSetters, uniformValues);

    // Draw
    this.gl.drawArrays(this.gl.LINES, 0, bufferInfo.numElements);
  }
}