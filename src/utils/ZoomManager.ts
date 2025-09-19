// src/utils/ZoomManager.ts
import { Application, Point } from 'pixi.js';

/**
 * ZoomManager - Utility class สำหรับจัดการ zoom operations และ coordinate transformations
 * 
 * 🛡️ ADDITIVE APPROACH: เพิ่มฟีเจอร์ zoom management โดยไม่แก้ไข existing PixiJS setup
 * - ให้บริการ utility functions สำหรับ zoom calculations
 * - จัดการ coordinate transformations
 * - รองรับ zoom-to-point และ zoom-to-fit functionality
 * - ไม่แก้ไข existing PixiJS application หรือ stage
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

export class ZoomManager {
  private static instance: ZoomManager;
  private pixiApp: Application | null = null;

  private constructor() {}

  /**
   * Singleton pattern สำหรับ ZoomManager
   */
  public static getInstance(): ZoomManager {
    if (!ZoomManager.instance) {
      ZoomManager.instance = new ZoomManager();
    }
    return ZoomManager.instance;
  }

  /**
   * Initialize ZoomManager กับ PixiJS Application
   */
  public initialize(app: Application): void {
    this.pixiApp = app;
    console.log('✅ ZoomManager initialized with PixiJS app');
  }

  /**
   * แปลง screen coordinates เป็น world coordinates
   */
  public screenToWorld(screenPoint: Point): Point {
    if (!this.pixiApp) {
      console.warn('ZoomManager not initialized');
      return screenPoint.clone();
    }

    // ใช้ toLocal เพื่อแปลง screen coordinates เป็น world coordinates
    return this.pixiApp.stage.toLocal(screenPoint);
  }

  /**
   * แปลง world coordinates เป็น screen coordinates
   */
  public worldToScreen(worldPoint: Point): Point {
    if (!this.pixiApp) {
      console.warn('ZoomManager not initialized');
      return worldPoint.clone();
    }

    // ใช้ toGlobal เพื่อแปลง world coordinates เป็น screen coordinates
    return this.pixiApp.stage.toGlobal(worldPoint);
  }

  /**
   * คำนวณ zoom level ที่เหมาะสมสำหรับ bounds ที่กำหนด
   */
  public calculateZoomToFit(bounds: ZoomBounds, options: ZoomToFitOptions = {}): number {
    if (!this.pixiApp) {
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
    const viewportWidth = this.pixiApp.screen.width - (padding * 2);
    const viewportHeight = this.pixiApp.screen.height - (padding * 2);

    // คำนวณ zoom ratio สำหรับแต่ละแกน
    const zoomX = viewportWidth / boundsWidth;
    const zoomY = viewportHeight / boundsHeight;

    // ใช้ zoom ratio ที่เล็กกว่าเพื่อให้ bounds พอดีในหน้าจอ
    const calculatedZoom = Math.min(zoomX, zoomY);

    // จำกัด zoom ตาม min/max
    return Math.max(minZoom, Math.min(maxZoom, calculatedZoom));
  }

  /**
   * คำนวณตำแหน่งที่ต้องเลื่อน stage เพื่อให้ bounds อยู่กึ่งกลาง
   */
  public calculateCenterPosition(bounds: ZoomBounds, zoomLevel: number): Point {
    if (!this.pixiApp) {
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
      this.pixiApp.screen.width / 2,
      this.pixiApp.screen.height / 2
    );

    // คำนวณตำแหน่งที่ stage ต้องอยู่
    return new Point(
      viewportCenter.x - (boundsCenter.x * zoomLevel),
      viewportCenter.y - (boundsCenter.y * zoomLevel)
    );
  }

  /**
   * Zoom ไปยังจุดที่กำหนดโดยคงจุดนั้นไว้ที่ตำแหน่งเดิม
   */
  public zoomToPoint(worldPoint: Point, zoomLevel: number, options: ZoomToPointOptions = {}): void {
    if (!this.pixiApp) {
      console.warn('ZoomManager not initialized');
      return;
    }

    const {
      animate = true,
      duration = 300,
      easing = this.easeOutCubic
    } = options;

    // แปลง world point เป็น screen coordinates ก่อน zoom
    const screenPoint = this.worldToScreen(worldPoint);

    if (animate) {
      this.animateZoomToPoint(screenPoint, zoomLevel, duration, easing);
    } else {
      this.applyZoomToPoint(screenPoint, zoomLevel);
    }
  }

  /**
   * Apply zoom ไปยังจุดที่กำหนดทันที
   */
  private applyZoomToPoint(screenPoint: Point, zoomLevel: number): void {
    if (!this.pixiApp) return;

    const stage = this.pixiApp.stage;
    
    // คำนวณตำแหน่งใหม่ของ stage
    const newX = screenPoint.x - (screenPoint.x - stage.x) * (zoomLevel / stage.scale.x);
    const newY = screenPoint.y - (screenPoint.y - stage.y) * (zoomLevel / stage.scale.y);

    // Apply zoom และตำแหน่งใหม่
    stage.scale.set(zoomLevel);
    stage.position.set(newX, newY);
  }

  /**
   * Animate zoom ไปยังจุดที่กำหนด
   */
  private animateZoomToPoint(
    screenPoint: Point,
    targetZoom: number,
    duration: number,
    easing: (t: number) => number
  ): void {
    if (!this.pixiApp) return;

    const stage = this.pixiApp.stage;
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
  }

  /**
   * Zoom เพื่อให้ bounds ที่กำหนดพอดีในหน้าจอ
   */
  public zoomToFit(bounds: ZoomBounds, options: ZoomToFitOptions = {}): void {
    if (!this.pixiApp) {
      console.warn('ZoomManager not initialized');
      return;
    }

    const {
      animate = true,
      duration = 500
    } = options;

    // คำนวณ zoom level และตำแหน่ง
    const zoomLevel = this.calculateZoomToFit(bounds, options);
    const centerPosition = this.calculateCenterPosition(bounds, zoomLevel);

    if (animate) {
      this.animateZoomToFit(zoomLevel, centerPosition, duration);
    } else {
      this.applyZoomToFit(zoomLevel, centerPosition);
    }
  }

  /**
   * Apply zoom to fit ทันที
   */
  private applyZoomToFit(zoomLevel: number, position: Point): void {
    if (!this.pixiApp) return;

    const stage = this.pixiApp.stage;
    stage.scale.set(zoomLevel);
    stage.position.copyFrom(position);
  }

  /**
   * Animate zoom to fit
   */
  private animateZoomToFit(targetZoom: number, targetPosition: Point, duration: number): void {
    if (!this.pixiApp) return;

    const stage = this.pixiApp.stage;
    const startZoom = stage.scale.x;
    const startPosition = stage.position.clone();
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = this.easeOutCubic(progress);

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
  }

  /**
   * คำนวณ bounds ของ objects ทั้งหมดใน stage
   */
  public calculateStageBounds(): ZoomBounds | null {
    if (!this.pixiApp) {
      console.warn('ZoomManager not initialized');
      return null;
    }

    const stage = this.pixiApp.stage;
    
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
  }

  /**
   * Zoom เพื่อให้เห็น objects ทั้งหมดใน stage
   */
  public zoomToFitAll(options: ZoomToFitOptions = {}): void {
    const bounds = this.calculateStageBounds();
    
    if (!bounds) {
      console.log('No objects to fit in view');
      return;
    }

    this.zoomToFit(bounds, options);
  }

  /**
   * Reset zoom และตำแหน่งเป็นค่าเริ่มต้น
   */
  public resetView(animate: boolean = true): void {
    if (!this.pixiApp) {
      console.warn('ZoomManager not initialized');
      return;
    }

    const stage = this.pixiApp.stage;
    const targetZoom = 1.0;
    const targetPosition = new Point(0, 0);

    if (animate) {
      this.animateZoomToFit(targetZoom, targetPosition, 300);
    } else {
      stage.scale.set(targetZoom);
      stage.position.copyFrom(targetPosition);
    }
  }

  /**
   * ได้ zoom level ปัจจุบัน
   */
  public getCurrentZoom(): number {
    if (!this.pixiApp) {
      console.warn('ZoomManager not initialized');
      return 1.0;
    }

    return this.pixiApp.stage.scale.x;
  }

  /**
   * ได้ตำแหน่งปัจจุบันของ stage
   */
  public getCurrentPosition(): Point {
    if (!this.pixiApp) {
      console.warn('ZoomManager not initialized');
      return new Point(0, 0);
    }

    return this.pixiApp.stage.position.clone();
  }

  /**
   * Easing function - ease out cubic
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Easing function - ease in out cubic
   */
  public easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * ตรวจสอบว่าจุดที่กำหนดอยู่ในมุมมองปัจจุบันหรือไม่
   */
  public isPointInView(worldPoint: Point, margin: number = 0): boolean {
    if (!this.pixiApp) {
      console.warn('ZoomManager not initialized');
      return false;
    }

    const screenPoint = this.worldToScreen(worldPoint);
    const screen = this.pixiApp.screen;

    return (
      screenPoint.x >= -margin &&
      screenPoint.y >= -margin &&
      screenPoint.x <= screen.width + margin &&
      screenPoint.y <= screen.height + margin
    );
  }

  /**
   * ทำลาย ZoomManager
   */
  public destroy(): void {
    this.pixiApp = null;
    console.log('🗑️ ZoomManager destroyed');
  }
}