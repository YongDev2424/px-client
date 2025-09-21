// src/utils/doubleClickDetector.ts

import { FederatedPointerEvent } from 'pixi.js';

/**
 * Double-Click Detection Utility (Function-Based)
 * 
 * สร้างแบบ pure function ตาม Function-Based Architecture
 * รองรับ PixiJS v8 FederatedPointerEvent patterns
 * ออกแบบตาม Laws of UX: Doherty Threshold (< 400ms response time)
 */

export interface DoubleClickOptions {
  /** Time threshold สำหรับ double-click detection (ms) */
  threshold: number;
  /** ป้องกัน single-click events หรือไม่ */
  preventSingleClick: boolean;
  /** Delay สำหรับ single-click callback (ms) */
  singleClickDelay: number;
}

export interface DoubleClickDetectorState {
  lastClickTime: number;
  clickCount: number;
  singleClickTimeout: NodeJS.Timeout | null;
}

/**
 * สร้าง Double-Click Detector แบบ function-based
 * ใช้ closure เพื่อเก็บ state ภายใน function
 * 
 * @param options - ตัวเลือกการตั้งค่า double-click detection
 * @returns Factory function สำหรับสร้าง event handler
 */
export function createDoubleClickDetector(
  options: Partial<DoubleClickOptions> = {}
): (
  onDoubleClick: () => void,
  onSingleClick?: () => void
) => (event: FederatedPointerEvent) => void {
  
  // Default options ตาม UX best practices
  const config: DoubleClickOptions = {
    threshold: 300,           // Doherty Threshold: < 400ms
    preventSingleClick: true, // ป้องกัน conflict กับ single-click
    singleClickDelay: 350,    // Delay สำหรับ single-click detection
    ...options
  };

  // State management ด้วย closure (Function-based pattern)
  const state: DoubleClickDetectorState = {
    lastClickTime: 0,
    clickCount: 0,
    singleClickTimeout: null
  };

  /**
   * Factory function สำหรับสร้าง event handler
   * รองรับทั้ง double-click และ single-click callbacks
   */
  return (
    onDoubleClick: () => void,
    onSingleClick?: () => void
  ) => (event: FederatedPointerEvent) => {
    
    const currentTime = Date.now();
    const timeDiff = currentTime - state.lastClickTime;

    // Clear existing single-click timeout
    if (state.singleClickTimeout) {
      clearTimeout(state.singleClickTimeout);
      state.singleClickTimeout = null;
    }

    // ตรวจสอบว่าเป็น double-click หรือไม่
    if (timeDiff < config.threshold && state.clickCount === 1) {
      // Double-click detected!
      console.log('🖱️ Double-click detected:', timeDiff + 'ms');
      
      event.stopPropagation(); // ป้องกัน event bubbling
      state.clickCount = 0;    // Reset click count
      state.lastClickTime = 0; // Reset timestamp
      
      // Execute double-click callback
      onDoubleClick();
      
    } else {
      // First click หรือ single-click
      state.clickCount = 1;
      state.lastClickTime = currentTime;
      
      // Handle single-click with delay (ถ้ามี callback)
      if (onSingleClick && !config.preventSingleClick) {
        state.singleClickTimeout = setTimeout(() => {
          if (state.clickCount === 1) {
            console.log('🖱️ Single-click detected after delay');
            onSingleClick();
          }
          state.clickCount = 0;
        }, config.singleClickDelay);
      }
    }
  };
}

/**
 * Helper function สำหรับสร้าง simple double-click handler
 * สำหรับการใช้งานแบบง่าย ๆ ที่ไม่ต้องการ single-click handling
 */
export function createSimpleDoubleClickHandler(
  onDoubleClick: () => void,
  threshold: number = 300
): (event: FederatedPointerEvent) => void {
  
  const detector = createDoubleClickDetector({ 
    threshold, 
    preventSingleClick: true 
  });
  
  return detector(onDoubleClick);
}

/**
 * Advanced double-click detector พร้อม analytics และ debugging
 * สำหรับการติดตาม performance และ UX metrics
 */
export function createAdvancedDoubleClickDetector(
  options: Partial<DoubleClickOptions> & {
    /** เปิดใช้ analytics logging */
    analytics?: boolean;
    /** Custom analytics callback */
    onAnalytics?: (data: {
      timeDiff: number;
      isDoubleClick: boolean;
      timestamp: number;
    }) => void;
  } = {}
): (
  onDoubleClick: () => void,
  onSingleClick?: () => void
) => (event: FederatedPointerEvent) => void {

  const config = {
    threshold: 300,
    preventSingleClick: true,
    singleClickDelay: 350,
    analytics: false,
    ...options
  };

  // State ด้วย closure
  let lastClickTime = 0;
  let clickCount = 0;
  let singleClickTimeout: NodeJS.Timeout | null = null;

  return (
    onDoubleClick: () => void,
    onSingleClick?: () => void
  ) => (event: FederatedPointerEvent) => {

    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;

    // Analytics logging
    if (config.analytics) {
      const analyticsData = {
        timeDiff,
        isDoubleClick: timeDiff < config.threshold && clickCount === 1,
        timestamp: currentTime
      };
      
      if (config.onAnalytics) {
        config.onAnalytics(analyticsData);
      } else {
        console.log('📊 Click Analytics:', analyticsData);
      }
    }

    // Clear existing timeout
    if (singleClickTimeout) {
      clearTimeout(singleClickTimeout);
      singleClickTimeout = null;
    }

    // Double-click detection
    if (timeDiff < config.threshold && clickCount === 1) {
      event.stopPropagation();
      clickCount = 0;
      lastClickTime = 0;
      
      console.log('🎯 Advanced Double-click:', timeDiff + 'ms');
      onDoubleClick();
      
    } else {
      clickCount = 1;
      lastClickTime = currentTime;
      
      if (onSingleClick && !config.preventSingleClick) {
        singleClickTimeout = setTimeout(() => {
          if (clickCount === 1) {
            onSingleClick();
          }
          clickCount = 0;
        }, config.singleClickDelay);
      }
    }
  };
}

/**
 * Utility สำหรับ testing double-click detection
 * ใช้สำหรับ unit tests และ debugging
 */
export function createTestableDoubleClickDetector() {
  let lastClickTime = 0;
  let clickCount = 0;
  
  const simulate = (timestamp: number) => {
    const timeDiff = timestamp - lastClickTime;
    const isDoubleClick = timeDiff < 300 && clickCount === 1;
    
    if (isDoubleClick) {
      clickCount = 0;
      lastClickTime = 0;
    } else {
      clickCount = 1;
      lastClickTime = timestamp;
    }
    
    return { isDoubleClick, timeDiff, clickCount };
  };
  
  const reset = () => {
    lastClickTime = 0;
    clickCount = 0;
  };
  
  return { simulate, reset };
}

/**
 * Type guards และ utilities
 */
export function isDoubleClickEvent(
  timeDiff: number, 
  threshold: number = 300
): boolean {
  return timeDiff < threshold;
}

export function getClickTiming(
  startTime: number, 
  endTime: number = Date.now()
): number {
  return endTime - startTime;
}

/**
 * Constants สำหรับ UX best practices
 */
export const DOUBLE_CLICK_CONSTANTS = {
  /** Standard double-click threshold (Doherty Threshold compliant) */
  STANDARD_THRESHOLD: 300,
  
  /** Fast double-click สำหรับ power users */
  FAST_THRESHOLD: 200,
  
  /** Slow double-click สำหรับ accessibility */
  SLOW_THRESHOLD: 500,
  
  /** Single-click delay เพื่อป้องกัน conflicts */
  SINGLE_CLICK_DELAY: 350
} as const;