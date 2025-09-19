// src/components/CanvasContainer.ts
import { Application } from 'pixi.js';
import { GridOverlay } from '../utils/GridOverlay';
import { SnapToGrid } from '../utils/SnapToGrid';

/**
 * CanvasContainer - Enhanced wrapper for PixiJS application
 * 
 * 🛡️ ADDITIVE APPROACH: This class enhances existing PixiJS app without modifying it
 * - Wraps existing Application instance (doesn't replace main.ts setup)
 * - Adds optional grid overlay and snap-to-grid functionality
 * - All enhancements can be toggled on/off to preserve existing behavior
 * - Existing PixiJS interactions remain unchanged
 */
export class CanvasContainer {
  private pixiApp: Application;
  private gridOverlay: GridOverlay;
  private snapToGrid: SnapToGrid;
  private canvasElement: HTMLElement;
  private isGridEnabled: boolean = false;
  private isSnapEnabled: boolean = false;

  /**
   * สร้าง CanvasContainer ที่ wrap existing PixiJS application
   * @param existingApp - PixiJS Application ที่มีอยู่แล้วจาก main.ts
   * @param canvasElement - HTML element ที่ใช้เป็น container
   */
  constructor(existingApp: Application, canvasElement: HTMLElement) {
    this.pixiApp = existingApp;
    this.canvasElement = canvasElement;
    
    // สร้าง enhancement components แต่ไม่เปิดใช้งานทันที
    this.gridOverlay = new GridOverlay(canvasElement);
    this.snapToGrid = new SnapToGrid(existingApp);
    
    this.initializeEnhancements();
    
    console.log('✅ CanvasContainer initialized as optional enhancement');
  }

  /**
   * เริ่มต้น enhancement features (ไม่เปิดใช้งานโดยอัตโนมัติ)
   */
  private initializeEnhancements(): void {
    // เพิ่ม resize handler เป็น enhancement ของ existing resize logic
    this.addResizeEnhancement();
    
    // เตรียม grid และ snap features แต่ไม่เปิดใช้งาน
    this.gridOverlay.initialize();
    this.snapToGrid.initialize();
  }

  /**
   * เปิด/ปิด grid overlay (optional enhancement)
   * @param enabled - true เพื่อเปิดใช้งาน grid, false เพื่อปิด
   */
  public enableGrid(enabled: boolean = true): void {
    this.isGridEnabled = enabled;
    
    if (enabled) {
      this.gridOverlay.show();
      console.log('🔲 Grid overlay enabled');
    } else {
      this.gridOverlay.hide();
      console.log('🔲 Grid overlay disabled');
    }
  }

  /**
   * เปิด/ปิด snap-to-grid functionality (optional enhancement)
   * @param enabled - true เพื่อเปิดใช้งาน snap, false เพื่อปิด
   */
  public enableSnapToGrid(enabled: boolean = true): void {
    this.isSnapEnabled = enabled;
    
    if (enabled) {
      this.snapToGrid.enable();
      console.log('🧲 Snap-to-grid enabled');
    } else {
      this.snapToGrid.disable();
      console.log('🧲 Snap-to-grid disabled');
    }
  }

  /**
   * ตั้งค่าขนาด grid (เฉพาะเมื่อ grid เปิดใช้งาน)
   * @param size - ขนาด grid ใน pixels
   */
  public setGridSize(size: number): void {
    this.gridOverlay.setGridSize(size);
    this.snapToGrid.setGridSize(size);
    console.log(`🔲 Grid size set to ${size}px`);
  }

  /**
   * ตั้งค่าสี grid (เฉพาะเมื่อ grid เปิดใช้งาน)
   * @param color - สี grid ในรูปแบบ CSS color
   */
  public setGridColor(color: string): void {
    this.gridOverlay.setGridColor(color);
    console.log(`🎨 Grid color set to ${color}`);
  }

  /**
   * เพิ่ม resize enhancement ที่ทำงานร่วมกับ existing resize logic
   */
  private addResizeEnhancement(): void {
    // เพิ่ม resize observer เป็น enhancement (ไม่แทนที่ existing logic)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.handleCanvasResize(width, height);
      }
    });

    resizeObserver.observe(this.canvasElement);
  }

  /**
   * จัดการ canvas resize เป็น enhancement ของ existing resize logic
   * @param width - ความกว้างใหม่
   * @param height - ความสูงใหม่
   */
  private handleCanvasResize(width: number, height: number): void {
    // อัปเดต grid overlay ให้ตรงกับขนาดใหม่
    if (this.isGridEnabled) {
      this.gridOverlay.updateSize(width, height);
    }
    
    // อัปเดต snap-to-grid boundaries
    if (this.isSnapEnabled) {
      this.snapToGrid.updateBoundaries(width, height);
    }
  }

  /**
   * ได้รับ reference ไปยัง existing PixiJS application
   * @returns PixiJS Application instance
   */
  public getPixiApp(): Application {
    return this.pixiApp;
  }

  /**
   * ตรวจสอบสถานะ grid
   * @returns true หาก grid เปิดใช้งาน
   */
  public isGridVisible(): boolean {
    return this.isGridEnabled;
  }

  /**
   * ตรวจสอบสถานะ snap-to-grid
   * @returns true หาก snap-to-grid เปิดใช้งาน
   */
  public isSnapToGridEnabled(): boolean {
    return this.isSnapEnabled;
  }

  /**
   * รีเซ็ต canvas enhancements กลับเป็นสถานะเริ่มต้น
   */
  public resetEnhancements(): void {
    this.enableGrid(false);
    this.enableSnapToGrid(false);
    console.log('🔄 Canvas enhancements reset to default state');
  }

  /**
   * ทำลาย CanvasContainer และ cleanup resources
   */
  public destroy(): void {
    this.gridOverlay.destroy();
    this.snapToGrid.destroy();
    console.log('🗑️ CanvasContainer destroyed');
  }
}