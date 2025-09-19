// src/factories/zoomManager.ts

import { Application, Point } from 'pixi.js';

/**
 * Interface definitions for zoom operations
 */
export interface ZoomBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ZoomToFitOptions {
  padding?: number;
  maxZoom?: number;
  minZoom?: number;
  animate?: boolean;
  duration?: number;
}

export interface ZoomToPointOptions {
  animate?: boolean;
  duration?: number;
  easing?: (t: number) => number;
}

/**
 * ZoomManager instance interface
 */
export interface ZoomManagerInstance {
  // Initialization
  initialize: (app: Application) => void;
  
  // Coordinate Transformations
  screenToWorld: (screenPoint: Point) => Point;
  worldToScreen: (worldPoint: Point) => Point;
  
  // Zoom Calculations
  calculateZoomToFit: (bounds: ZoomBounds, options?: ZoomToFitOptions) => number;
  calculateCenterPosition: (bounds: ZoomBounds, zoomLevel: number) => Point;
  calculateStageBounds: () => ZoomBounds | null;
  
  // Zoom Operations
  zoomToPoint: (worldPoint: Point, zoomLevel: number, options?: ZoomToPointOptions) => void;
  zoomToFit: (bounds: ZoomBounds, options?: ZoomToFitOptions) => void;
  zoomToFitAll: (options?: ZoomToFitOptions) => void;
  resetView: (animate?: boolean) => void;
  
  // State Queries
  getCurrentZoom: () => number;
  getCurrentPosition: () => Point;
  isPointInView: (worldPoint: Point, margin?: number) => boolean;
  
  // Easing Functions
  easeInOutCubic: (t: number) => number;
  
  // Cleanup
  destroy: () => void;
}

/**
 * Factory function สำหรับสร้าง ZoomManager instance
 * @returns ZoomManager instance ใหม่
 */
export function createZoomManager(): ZoomManagerInstance {
  let pixiApp: Application | null = null;

  // Private helper functions
  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  };

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const applyZoomToPoint = (screenPoint: Point, zoomLevel: number): void => {
    if (!pixiApp) return;

    const stage = pixiApp.stage;
    
    // คำนวณตำแหน่งใหม่ของ stage
    const newX = screenPoint.x - (screenPoint.x - stage.x) * (zoomLevel / stage.scale.x);
    const newY = screenPoint.y - (screenPoint.y - stage.y) * (zoomLevel / stage.scale.y);

    // Apply zoom และตำแหน่งใหม่
    stage.scale.set(zoomLevel);
    stage.position.set(newX, newY);
  };

  const animateZoomToPoint = (
    screenPoint: Point,
    targetZoom: number,
    duration: number,
    easing: (t: number) => number
  ): void => {
    if (!pixiApp) return;

    const stage = pixiApp.stage;
    const startZoom = stage.scale.x;
    const startX = stage.x;
    const startY = stage.y;

    // คำนวณตำแหน่งปลายทาง
    const targetX = screenPoint.x - (screenPoint.x - startX) * (targetZoom / startZoom);
    const targetY = screenPoint.y - (screenPoint.y - startY) * (targetZoom / startZoom);

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      // Interpolate zoom และตำแหน่ง
      const currentZoom = startZoom + (targetZoom - startZoom) * easedProgress;
      const currentX = startX + (targetX - startX) * easedProgress;
      const currentY = startY + (targetY - startY) * easedProgress;

      // Apply ค่าใหม่
      stage.scale.set(currentZoom);
      stage.position.set(currentX, currentY);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  const applyZoomToFit = (zoomLevel: number, position: Point): void => {
    if (!pixiApp) return;

    const stage = pixiApp.stage;
    stage.scale.set(zoomLevel);
    stage.position.copyFrom(position);
  };

  const animateZoomToFit = (targetZoom: number, targetPosition: Point, duration: number): void => {
    if (!pixiApp) return;

    const stage = pixiApp.stage;
    const startZoom = stage.scale.x;
    const startPosition = stage.position.clone();
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      // Interpolate zoom และตำแหน่ง
      const currentZoom = startZoom + (targetZoom - startZoom) * easedProgress;
      const currentX = startPosition.x + (targetPosition.x - startPosition.x) * easedProgress;
      const currentY = startPosition.y + (targetPosition.y - startPosition.y) * easedProgress;

      // Apply ค่าใหม่
      stage.scale.set(currentZoom);
      stage.position.set(currentX, currentY);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  // Return ZoomManager instance
  return {
    // === Initialization ===
    initialize: (app: Application) => {
      pixiApp = app;
      console.log('✅ ZoomManager initialized with PixiJS app');
    },

    // === Coordinate Transformations ===
    screenToWorld: (screenPoint: Point) => {
      if (!pixiApp) {
        console.warn('ZoomManager not initialized');
        return screenPoint.clone();
      }

      // ใช้ toLocal เพื่อแปลง screen coordinates เป็น world coordinates
      return pixiApp.stage.toLocal(screenPoint);
    },

    worldToScreen: (worldPoint: Point) => {
      if (!pixiApp) {
        console.warn('ZoomManager not initialized');
        return worldPoint.clone();
      }

      // ใช้ toGlobal เพื่อแปลง world coordinates เป็น screen coordinates
      return pixiApp.stage.toGlobal(worldPoint);
    },

    // === Zoom Calculations ===
    calculateZoomToFit: (bounds: ZoomBounds, options: ZoomToFitOptions = {}) => {
      if (!pixiApp) {
        console.warn('ZoomManager not initialized');
        return 1.0;
      }

      const {
        padding = 50,
        maxZoom = 4.0,
        minZoom = 0.25
      } = options;

      // คำนวณขนาดของ bounds
      const boundsWidth = bounds.maxX - bounds.minX;
      const boundsHeight = bounds.maxY - bounds.minY;

      // คำนวณขนาดของ viewport (หัก padding)
      const viewportWidth = pixiApp.screen.width - (padding * 2);
      const viewportHeight = pixiApp.screen.height - (padding * 2);

      // คำนวณ zoom ratio สำหรับแต่ละแกน
      const zoomX = viewportWidth / boundsWidth;
      const zoomY = viewportHeight / boundsHeight;

      // ใช้ zoom ratio ที่เล็กกว่าเพื่อให้ bounds พอดีในหน้าจอ
      const calculatedZoom = Math.min(zoomX, zoomY);

      // จำกัด zoom ตาม min/max
      return Math.max(minZoom, Math.min(maxZoom, calculatedZoom));
    },

    calculateCenterPosition: (bounds: ZoomBounds, zoomLevel: number) => {
      if (!pixiApp) {
        console.warn('ZoomManager not initialized');
        return new Point(0, 0);
      }

      // คำนวณจุดกึ่งกลางของ bounds
      const boundsCenter = new Point(
        (bounds.minX + bounds.maxX) / 2,
        (bounds.minY + bounds.maxY) / 2
      );

      // คำนวณจุดกึ่งกลางของ viewport
      const viewportCenter = new Point(
        pixiApp.screen.width / 2,
        pixiApp.screen.height / 2
      );

      // คำนวณตำแหน่งที่ stage ต้องอยู่
      return new Point(
        viewportCenter.x - (boundsCenter.x * zoomLevel),
        viewportCenter.y - (boundsCenter.y * zoomLevel)
      );
    },

    calculateStageBounds: () => {
      if (!pixiApp) {
        console.warn('ZoomManager not initialized');
        return null;
      }

      const stage = pixiApp.stage;
      
      if (stage.children.length === 0) {
        return null;
      }

      // คำนวณ bounds จาก children ทั้งหมด
      const bounds = stage.getBounds();
      
      return {
        minX: bounds.x,
        minY: bounds.y,
        maxX: bounds.x + bounds.width,
        maxY: bounds.y + bounds.height
      };
    },

    // === Zoom Operations ===
    zoomToPoint: (worldPoint: Point, zoomLevel: number, options: ZoomToPointOptions = {}) => {
      if (!pixiApp) {
        console.warn('ZoomManager not initialized');
        return;
      }

      const {
        animate = true,
        duration = 300,
        easing = easeOutCubic
      } = options;

      // แปลง world point เป็น screen coordinates ก่อน zoom
      const screenPoint = pixiApp.stage.toGlobal(worldPoint);

      if (animate) {
        animateZoomToPoint(screenPoint, zoomLevel, duration, easing);
      } else {
        applyZoomToPoint(screenPoint, zoomLevel);
      }
    },

    zoomToFit: (bounds: ZoomBounds, options: ZoomToFitOptions = {}) => {
      if (!pixiApp) {
        console.warn('ZoomManager not initialized');
        return;
      }

      const {
        animate = true,
        duration = 500
      } = options;

      // คำนวณ zoom level และตำแหน่ง
      const zoomLevel = pixiApp.stage.toGlobal ? 
        // Use the exposed method on the instance
        (() => {
          const {
            padding = 50,
            maxZoom = 4.0,
            minZoom = 0.25
          } = options;

          const boundsWidth = bounds.maxX - bounds.minX;
          const boundsHeight = bounds.maxY - bounds.minY;
          const viewportWidth = pixiApp!.screen.width - (padding * 2);
          const viewportHeight = pixiApp!.screen.height - (padding * 2);
          const zoomX = viewportWidth / boundsWidth;
          const zoomY = viewportHeight / boundsHeight;
          const calculatedZoom = Math.min(zoomX, zoomY);
          return Math.max(minZoom, Math.min(maxZoom, calculatedZoom));
        })() : 1.0;

      const centerPosition = (() => {
        if (!pixiApp) return new Point(0, 0);
        const boundsCenter = new Point(
          (bounds.minX + bounds.maxX) / 2,
          (bounds.minY + bounds.maxY) / 2
        );
        const viewportCenter = new Point(
          pixiApp.screen.width / 2,
          pixiApp.screen.height / 2
        );
        return new Point(
          viewportCenter.x - (boundsCenter.x * zoomLevel),
          viewportCenter.y - (boundsCenter.y * zoomLevel)
        );
      })();

      if (animate) {
        animateZoomToFit(zoomLevel, centerPosition, duration);
      } else {
        applyZoomToFit(zoomLevel, centerPosition);
      }
    },

    zoomToFitAll: (options: ZoomToFitOptions = {}) => {
      if (!pixiApp) {
        console.warn('ZoomManager not initialized');
        return;
      }

      const stage = pixiApp.stage;
      
      if (stage.children.length === 0) {
        console.log('No objects to fit in view');
        return;
      }

      const bounds = stage.getBounds();
      const zoomBounds = {
        minX: bounds.x,
        minY: bounds.y,
        maxX: bounds.x + bounds.width,
        maxY: bounds.y + bounds.height
      };

      // Use the zoomToFit method
      const {
        animate = true,
        duration = 500
      } = options;

      const zoomLevel = (() => {
        const {
          padding = 50,
          maxZoom = 4.0,
          minZoom = 0.25
        } = options;

        const boundsWidth = zoomBounds.maxX - zoomBounds.minX;
        const boundsHeight = zoomBounds.maxY - zoomBounds.minY;
        const viewportWidth = pixiApp!.screen.width - (padding * 2);
        const viewportHeight = pixiApp!.screen.height - (padding * 2);
        const zoomX = viewportWidth / boundsWidth;
        const zoomY = viewportHeight / boundsHeight;
        const calculatedZoom = Math.min(zoomX, zoomY);
        return Math.max(minZoom, Math.min(maxZoom, calculatedZoom));
      })();

      const centerPosition = (() => {
        const boundsCenter = new Point(
          (zoomBounds.minX + zoomBounds.maxX) / 2,
          (zoomBounds.minY + zoomBounds.maxY) / 2
        );
        const viewportCenter = new Point(
          pixiApp!.screen.width / 2,
          pixiApp!.screen.height / 2
        );
        return new Point(
          viewportCenter.x - (boundsCenter.x * zoomLevel),
          viewportCenter.y - (boundsCenter.y * zoomLevel)
        );
      })();

      if (animate) {
        animateZoomToFit(zoomLevel, centerPosition, duration);
      } else {
        applyZoomToFit(zoomLevel, centerPosition);
      }
    },

    resetView: (animate: boolean = true) => {
      if (!pixiApp) {
        console.warn('ZoomManager not initialized');
        return;
      }

      const stage = pixiApp.stage;
      const targetZoom = 1.0;
      const targetPosition = new Point(0, 0);

      if (animate) {
        animateZoomToFit(targetZoom, targetPosition, 300);
      } else {
        stage.scale.set(targetZoom);
        stage.position.copyFrom(targetPosition);
      }
    },

    // === State Queries ===
    getCurrentZoom: () => {
      if (!pixiApp) {
        console.warn('ZoomManager not initialized');
        return 1.0;
      }

      return pixiApp.stage.scale.x;
    },

    getCurrentPosition: () => {
      if (!pixiApp) {
        console.warn('ZoomManager not initialized');
        return new Point(0, 0);
      }

      return pixiApp.stage.position.clone();
    },

    isPointInView: (worldPoint: Point, margin: number = 0) => {
      if (!pixiApp) {
        console.warn('ZoomManager not initialized');
        return false;
      }

      const screenPoint = pixiApp.stage.toGlobal(worldPoint);
      const screen = pixiApp.screen;

      return (
        screenPoint.x >= -margin &&
        screenPoint.y >= -margin &&
        screenPoint.x <= screen.width + margin &&
        screenPoint.y <= screen.height + margin
      );
    },

    // === Easing Functions ===
    easeInOutCubic,

    // === Cleanup ===
    destroy: () => {
      pixiApp = null;
      console.log('🗑️ ZoomManager destroyed');
    }
  };
}

/**
 * Singleton wrapper สำหรับ backward compatibility
 */
let singletonInstance: ZoomManagerInstance | null = null;

export const ZoomManager = {
  getInstance: (): ZoomManagerInstance => {
    if (!singletonInstance) {
      singletonInstance = createZoomManager();
    }
    return singletonInstance;
  }
};