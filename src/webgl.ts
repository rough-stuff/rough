import { ProgramInfo, createProgramInfo, resizeCanvasToDisplaySize, setUniforms, AttributeValues, setAttributes } from './webgl-utils';
import { Point, BezCurve, estBezLength } from './geometry';
import { Drawable, Op } from './core';
import { DEFAULT_OPTIONS } from './generator';
import { parseColor } from './colors';
import { vsSource, fsSource } from './webgl-shaders';

interface AttributeInfo {
  name: string;
  numComponents: number;
  offset: number;
}
const FRAME_SIZE = 16;
const STRIDE = FRAME_SIZE * 4;

const ATTRIBUTES: AttributeInfo[] = [
  { name: 'a_p1', numComponents: 2, offset: 0 },
  { name: 'a_cp1', numComponents: 2, offset: 2 },
  { name: 'a_cp2', numComponents: 2, offset: 4 },
  { name: 'a_p2', numComponents: 2, offset: 6 },
  { name: 'a_color', numComponents: 4, offset: 8 },
  { name: 'a_thickness', numComponents: 1, offset: 12 },
  { name: 'a_numVerts', numComponents: 1, offset: 13 },
  { name: 'a_vertexId', numComponents: 2, offset: 14 }
];

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
            const aa = performance.now();
            // const curvePoints = this.extractCurvePoints(drawing.ops);
            let curves: BezCurve[] = [
              [
                [10, 30],
                [120, 160],
                [180, 10],
                [220, 140]
              ],
              [
                [10, 80],
                [120, 210],
                [180, 60],
                [220, 190]
              ],
              [
                [10, 110],
                [120, 240],
                [180, 90],
                [220, 220]
              ]
            ];
            curves = [...curves, ...curves];
            curves = [...curves, ...curves];
            curves = [...curves, ...curves];
            curves = [...curves, ...curves];
            curves = [...curves, ...curves];
            curves = [...curves, ...curves];
            curves = [...curves, ...curves];
            curves = [...curves, ...curves];
            const aa2 = performance.now();

            this.drawCurves(curves, o.strokeWidth, o.stroke === 'none' ? 'transparent' : o.stroke);

            const aa3 = performance.now();
            console.log(aa2 - aa, aa3 - aa2, aa3 - aa);
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

  private extractCurvePoints(ops: Op[]): BezCurve[] {
    const curves: BezCurve[] = [];
    let lastPoint: Point = [0, 0];
    for (const op of ops) {
      switch (op.op) {
        case 'move':
          lastPoint = op.data as Point;
          break;
        case 'bcurveTo':
          const curve: BezCurve = [
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
    // TODO: need this?
    resizeCanvasToDisplaySize(this.canvas);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
  }

  private drawCurves(curves: BezCurve[], lineWidth: number, color: string) {
    console.log('curve count', curves.length);

    // Initialize buffer data
    const parsedColor = parseColor(color);
    const thickness = lineWidth / (window.devicePixelRatio || 1);
    const data: number[] = [];
    let curveIndex = 0;
    for (const curve of curves) {
      // validate curve
      const numVerts = Math.ceil(estBezLength(curve) / 2);
      if (numVerts < 3) {
        continue;
      }
      for (let i = 0; i < numVerts; i++) {
        curve.forEach((p) => data.push(...p)); // 8
        data.push(
          ...parsedColor, // 4
          thickness,      // 1
          numVerts,       // 1
          i, -1           // 2
        );
        curve.forEach((p) => data.push(...p)); // 8
        data.push(
          ...parsedColor, // 4
          thickness,      // 1
          numVerts,       // 1
          i, 1           // 2
        );
      }
      curveIndex++;
    }

    // Initialize buffer
    const attributeBuffer = this.gl.createBuffer()!;
    const bufferType = this.gl.ARRAY_BUFFER;
    this.gl.bindBuffer(bufferType, attributeBuffer);
    this.gl.bufferData(bufferType, new Float32Array(data), this.gl.STATIC_DRAW);

    // use program
    this.gl.useProgram(this.pi.program);

    // set attributes
    const attrValues: AttributeValues = {};
    ATTRIBUTES.forEach((attr) => {
      attrValues[attr.name] = {
        buffer: attributeBuffer,
        numComponents: attr.numComponents,
        offset: attr.offset * 4,
        stride: STRIDE
      };
    });
    setAttributes(this.pi.attribSetters, attrValues);

    // set uniforms
    setUniforms(this.pi.uniformSetters, {
      u_resolution: [this.gl.canvas.width, this.gl.canvas.height]
    });

    console.log('data', data.length, data.length / FRAME_SIZE);

    // Draw
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, data.length / FRAME_SIZE);
  }
}