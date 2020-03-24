// Adapted from from https://webglfundamentals.org/webgl/lessons/webgl-boilerplate.html

// General types
export interface ProgramInfo {
  program: WebGLProgram;
  uniformSetters: UniformSetters;
  attribSetters: AttributeSetters;
}

// Shader sources. first one is vertex, second fragment
export type ShaderSources = [string, string];

export interface BufferInfo {
  numElements: number;
  attribs: AttributeValues;
}
export interface BufferArray {
  numComponents: number;
  data: number[];
}
export type BufferArrays = { [name: string]: BufferArray };

// Uniform types
export type UniformSetter = (v: any) => void;
export type UniformSetters = { [name: string]: UniformSetter };
export type UniformValues = { [name: string]: Float32List | Int32List | number };

// Atrribute types
export interface AttributeValue {
  buffer: WebGLBuffer;
  numComponents: number;
  type?: number;
  normalize?: boolean;
  stride?: number;
  offset?: number;
}
export type AttributeValues = { [name: string]: AttributeValue };
export type AttributeSetter = (v: AttributeValue) => void;
export type AttributeSetters = { [name: string]: AttributeSetter };

export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, multiplier = 1): boolean {
  const width = canvas.clientWidth * multiplier | 0;
  const height = canvas.clientHeight * multiplier | 0;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}

export function createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    throw error;
  }
  return program;
}

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = new Error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw error;
  }
  return shader;
}

export function createUniformSetters(gl: WebGLRenderingContext, program: WebGLProgram): UniformSetters {
  const createUniformSetter = (program: WebGLProgram, uniformInfo: any): ((v: any) => void) => {
    const location = gl.getUniformLocation(program, uniformInfo.name);
    const type = uniformInfo.type;

    // Check if this uniform is an array
    const isArray = (uniformInfo.size > 1 && uniformInfo.name.substr(-3) === '[0]');
    if (type === gl.FLOAT && isArray) {
      return function (v: Float32List) {
        gl.uniform1fv(location, v);
      };
    }
    if (type === gl.FLOAT) {
      return function (v: number) {
        gl.uniform1f(location, v);
      };
    }
    if (type === gl.FLOAT_VEC2) {
      return function (v: Float32List) {
        gl.uniform2fv(location, v);
      };
    }
    if (type === gl.FLOAT_VEC3) {
      return function (v: Float32List) {
        gl.uniform3fv(location, v);
      };
    }
    if (type === gl.FLOAT_VEC4) {
      return function (v: Float32List) {
        gl.uniform4fv(location, v);
      };
    }
    if (type === gl.INT && isArray) {
      return function (v: Int32List) {
        gl.uniform1iv(location, v);
      };
    }
    if (type === gl.INT) {
      return function (v: number) {
        gl.uniform1i(location, v);
      };
    }
    if (type === gl.INT_VEC2) {
      return function (v: Int32List) {
        gl.uniform2iv(location, v);
      };
    }
    if (type === gl.INT_VEC3) {
      return function (v: Int32List) {
        gl.uniform3iv(location, v);
      };
    }
    if (type === gl.INT_VEC4) {
      return function (v: Int32List) {
        gl.uniform4iv(location, v);
      };
    }
    if (type === gl.BOOL) {
      return function (v: Int32List) {
        gl.uniform1iv(location, v);
      };
    }
    if (type === gl.BOOL_VEC2) {
      return function (v: Int32List) {
        gl.uniform2iv(location, v);
      };
    }
    if (type === gl.BOOL_VEC3) {
      return function (v: Int32List) {
        gl.uniform3iv(location, v);
      };
    }
    if (type === gl.BOOL_VEC4) {
      return function (v: Int32List) {
        gl.uniform4iv(location, v);
      };
    }
    if (type === gl.FLOAT_MAT2) {
      return function (v: Float32List) {
        gl.uniformMatrix2fv(location, false, v);
      };
    }
    if (type === gl.FLOAT_MAT3) {
      return function (v: Float32List) {
        gl.uniformMatrix3fv(location, false, v);
      };
    }
    if (type === gl.FLOAT_MAT4) {
      return function (v: Float32List) {
        gl.uniformMatrix4fv(location, false, v);
      };
    }
    throw ('unknown type: 0x' + type.toString(16)); // we should never get here.
  };

  const uniformSetters: UniformSetters = {};
  const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

  for (let ii = 0; ii < numUniforms; ++ii) {
    const uniformInfo = gl.getActiveUniform(program, ii);
    if (!uniformInfo) {
      break;
    }
    let name = uniformInfo.name;
    // remove the array suffix.
    if (name.substr(-3) === '[0]') {
      name = name.substr(0, name.length - 3);
    }
    const setter = createUniformSetter(program, uniformInfo);
    uniformSetters[name] = setter;
  }
  return uniformSetters;
}

export function setUniforms(setters: UniformSetters, values: UniformValues) {
  for (const key in values) {
    const setter = setters[key];
    if (setter) {
      setter(values[key]);
    }
  }
}

export function createAttributeSetters(gl: WebGLRenderingContext, program: WebGLProgram) {
  const attribSetters: AttributeSetters = {};

  function createAttribSetter(index: number) {
    return function (b: AttributeValue) {
      gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
      gl.enableVertexAttribArray(index);
      gl.vertexAttribPointer(index, b.numComponents, b.type || gl.FLOAT, b.normalize || false, b.stride || 0, b.offset || 0);
    };
  }

  const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  for (let ii = 0; ii < numAttribs; ++ii) {
    const attribInfo = gl.getActiveAttrib(program, ii);
    if (!attribInfo) {
      break;
    }
    const index = gl.getAttribLocation(program, attribInfo.name);
    attribSetters[attribInfo.name] = createAttribSetter(index);
  }

  return attribSetters;
}

export function setAttributes(setters: AttributeSetters, attribs: AttributeValues) {
  for (const key in attribs) {
    const setter = setters[key];
    if (setter) {
      setter(attribs[key]);
    }
  }
}

export function createProgramInfo(gl: WebGLRenderingContext, sources: ShaderSources): ProgramInfo {
  const program = createProgram(gl, ...sources);
  return {
    program,
    uniformSetters: createUniformSetters(gl, program),
    attribSetters: createAttributeSetters(gl, program)
  };
}

function createBufferFromTypedArray(gl: WebGLRenderingContext, array: Float32Array) {
  const buffer = gl.createBuffer();
  const type = gl.ARRAY_BUFFER;
  gl.bindBuffer(type, buffer);
  gl.bufferData(type, array, gl.STATIC_DRAW);
  return buffer!;
}

function createAttribsFromArrays(gl: WebGLRenderingContext, arrays: BufferArrays) {
  const attribs: AttributeValues = {};
  for (const bufferName in arrays) {
    const origArray = arrays[bufferName];
    const array = new Float32Array(origArray.data);
    attribs[`a_${bufferName}`] = {
      buffer: createBufferFromTypedArray(gl, array),
      numComponents: origArray.numComponents,
      type: gl.FLOAT
    };
  }
  return attribs;
}

export function createBufferInfoFromArrays(gl: WebGLRenderingContext, arrays: BufferArrays): BufferInfo {
  const array = arrays[Object.keys(arrays)[0]];
  return {
    attribs: createAttribsFromArrays(gl, arrays),
    numElements: array ? (array.data.length / array.numComponents) : 0
  };
}