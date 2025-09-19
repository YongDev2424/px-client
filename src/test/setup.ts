// src/test/setup.ts

// Mock PixiJS Application for testing
global.HTMLCanvasElement = class HTMLCanvasElement {
  getContext() {
    return {};
  }
} as any;

// Mock WebGL context
global.WebGLRenderingContext = class WebGLRenderingContext {} as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 16);
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};