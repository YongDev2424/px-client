// src/factories/index.ts

/**
 * Export all factory functions และ interfaces
 * สำหรับให้ import ได้สะดวกจากที่เดียว
 */

// ZoomManager Factory
export {
  createZoomManager,
  ZoomManager as ZoomManagerSingleton,
  type ZoomManagerInstance,
  type ZoomBounds,
  type ZoomToFitOptions,
  type ZoomToPointOptions
} from './zoomManager';

// LayoutManager Factory
export {
  createLayoutManager,
  LayoutManager as LayoutManagerSingleton,
  type LayoutManagerInstance,
  type CanvasArea,
  type LayoutState
} from './layoutManager';

/**
 * Factory function types สำหรับ type checking
 */
export type FactoryFunction<T> = () => T;

/**
 * Common factory utility functions
 */
export const createFactoryUtilities = () => {
  // Utility สำหรับ factory pattern
  const instanceCache = new Map<string, any>();

  return {
    /**
     * สร้าง singleton instance ด้วย factory function
     */
    getSingleton: <T>(key: string, factory: FactoryFunction<T>): T => {
      if (!instanceCache.has(key)) {
        instanceCache.set(key, factory());
      }
      return instanceCache.get(key);
    },

    /**
     * ลบ singleton instance
     */
    clearSingleton: (key: string): boolean => {
      return instanceCache.delete(key);
    },

    /**
     * ลบ singleton instances ทั้งหมด
     */
    clearAllSingletons: (): void => {
      instanceCache.clear();
    },

    /**
     * ตรวจสอบว่ามี singleton instance หรือไม่
     */
    hasSingleton: (key: string): boolean => {
      return instanceCache.has(key);
    },

    /**
     * ได้รายการ keys ทั้งหมดของ singleton instances
     */
    getSingletonKeys: (): string[] => {
      return Array.from(instanceCache.keys());
    }
  };
};