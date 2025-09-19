// src/test/setup.ts

// Mock CanvasRenderingContext2D
global.CanvasRenderingContext2D = class CanvasRenderingContext2D {
  canvas = new HTMLCanvasElement();
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  
  drawImage() {}
  getImageData() { return { data: new Uint8ClampedArray(4) }; }
  putImageData() {}
  createImageData() { return { data: new Uint8ClampedArray(4) }; }
  setTransform() {}
  resetTransform() {}
  clearRect() {}
  fillRect() {}
  strokeRect() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  fill() {}
  stroke() {}
  save() {}
  restore() {}
  translate() {}
  rotate() {}
  scale() {}
  measureText() { return { width: 100, height: 12 }; }
} as any;

// Mock PixiJS Application for testing
global.HTMLCanvasElement = class HTMLCanvasElement {
  width = 800;
  height = 600;
  
  getContext(contextType?: string) {
    if (contextType === '2d') {
      return new global.CanvasRenderingContext2D();
    }
    return {
      canvas: this,
      drawImage: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData: () => {},
      createImageData: () => ({ data: new Uint8ClampedArray(4) }),
      setTransform: () => {},
      resetTransform: () => {},
      clearRect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      measureText: () => ({ width: 100 }),
    };
  }
  
  toDataURL() {
    return 'data:image/png;base64,';
  }
} as any;

// Mock WebGL context
global.WebGLRenderingContext = class WebGLRenderingContext {
  canvas = new global.HTMLCanvasElement();
  
  getParameter() { return 'WebGL 1.0'; }
  getExtension() { return null; }
  createShader() { return {}; }
  createProgram() { return {}; }
  attachShader() {}
  linkProgram() {}
  useProgram() {}
  createBuffer() { return {}; }
  bindBuffer() {}
  bufferData() {}
  getAttribLocation() { return 0; }
  getUniformLocation() { return {}; }
  enableVertexAttribArray() {}
  vertexAttribPointer() {}
  uniform1f() {}
  uniform2f() {}
  uniform3f() {}
  uniform4f() {}
  uniformMatrix4fv() {}
  drawArrays() {}
  drawElements() {}
  enable() {}
  disable() {}
  blendFunc() {}
  clear() {}
  clearColor() {}
  viewport() {}
} as any;

global.WebGL2RenderingContext = global.WebGLRenderingContext;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 16);
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock document methods
Object.defineProperty(document, 'createElement', {
  value: (tagName: string) => {
    if (tagName === 'canvas') {
      return new global.HTMLCanvasElement();
    }
    return {
      style: {},
      setAttribute: () => {},
      getAttribute: () => null,
      appendChild: () => {},
      removeChild: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }
});