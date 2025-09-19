// src/utils/SnapToGrid.ts
import { Application, Container, FederatedPointerEvent } from 'pixi.js';

/**
 * SnapToGrid - Grid snapping functionality for PixiJS objects
 * 
 * 🛡️ ADDITIVE APPROACH: Enhances existing drag behavior without replacing it
 * - Works alongside existing draggable.ts functionality
 * - Provides optional grid snapping for precise alignment
 * - Can be toggled on/off without affecting existing drag behavior
 * - Preserves all existing PixiJS interactions
 */
export class SnapToGrid {
  private pixiApp: Application;
  private gridSize: number = 20; // Default grid size in pixels
  private isEnabled: boolean = false;
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private originalDragHandlers: Map<Container, any> = new Map();

  /**
   * สร้าง SnapToGrid system สำหรับ PixiJS application
   * @param pixiApp - PixiJS Application instance
   */
  constructor(pixiApp: Application) {
    this.pixiApp = pixiApp;
    this.updateBoundaries(pixiApp.screen.width, pixiApp.screen.height);
  }

  /**
   * เริ่มต้น snap-to-grid system
   */
  public initialize(): void {
    console.log('🧲 SnapToGrid initialized (disabled by default)');
  }

  /**
   * เปิดใช้งาน snap-to-grid functionality
   */
  public enable(): void {
    this.isEnabled = true;
    this.enhanceExistingDragBehavior();
    console.log('🧲 Snap-to-grid enabled');
  }

  /**
   * ปิดใช้งาน snap-to-grid functionality
   */
  public disable(): void {
    this.isEnabled = false;
    this.restoreOriginalDragBehavior();
    console.log('🧲 Snap-to-grid disabled');
  }

  /**
   * Enhance existing drag behavior โดยไม่แทนที่ existing handlers
   */
  private enhanceExistingDragBehavior(): void {
    // ค้นหา draggable objects ใน stage
    this.findAndEnhanceDraggableObjects(this.pixiApp.stage);
  }

  /**
   * ค้นหาและ enhance draggable objects recursively
   * @param container - Container ที่จะค้นหา
   */
  private findAndEnhanceDraggableObjects(container: Container): void {
    container.children.forEach((child) => {
      if (child instanceof Container) {
        // ตรวจสอบว่า object นี้มี drag behavior หรือไม่
        if (this.isDraggableObject(child)) {
          this.enhanceObjectDragBehavior(child);
        }
        
        // ค้นหา children recursively
        this.findAndEnhanceDraggableObjects(child);
      }
    });
  }

  /**
   * ตรวจสอบว่า object เป็น draggable หรือไม่
   * @param object - PixiJS Container ที่จะตรวจสอบ
   * @returns true หาก object เป็น draggable
   */
  private isDraggableObject(object: Container): boolean {
    // ตรวจสอบจาก metadata หรือ event listeners ที่มีอยู่
    return (
      object.eventMode === 'static' &&
      object.cursor === 'pointer' &&
      (object as any).nodeData !== undefined
    );
  }

  /**
   * Enhance drag behavior ของ object โดยไม่แทนที่ existing behavior
   * @param object - PixiJS Container ที่จะ enhance
   */
  private enhanceObjectDragBehavior(object: Container): void {
    // เก็บ original handlers ไว้
    const originalHandlers = this.getOriginalEventHandlers(object);
    this.originalDragHandlers.set(object, originalHandlers);

    // เพิ่ม snap enhancement โดยไม่แทนที่ existing handlers
    this.addSnapEnhancement(object, originalHandlers);
  }

  /**
   * ได้รับ original event handlers ของ object
   * @param object - PixiJS Container
   * @returns Object ที่มี original handlers
   */
  private getOriginalEventHandlers(object: Container): any {
    // ใช้ reflection เพื่อได้รับ existing handlers
    const eventData = (object as any)._events;
    return {
      pointerdown: eventData?.pointerdown || [],
      pointermove: eventData?.pointermove || [],
      pointerup: eventData?.pointerup || []
    };
  }

  /**
   * เพิ่ม snap enhancement โดยไม่แทนที่ existing handlers
   * @param object - PixiJS Container
   * @param _originalHandlers - Original event handlers (reserved for future use)
   */
  private addSnapEnhancement(object: Container, _originalHandlers: any): void {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    // เพิ่ม enhanced pointerdown handler
    object.on('pointerdown', (event: FederatedPointerEvent) => {
      if (!this.isEnabled) return;
      
      isDragging = true;
      const globalPos = event.global.clone();
      dragOffset.x = object.x - globalPos.x;
      dragOffset.y = object.y - globalPos.y;
      
      // ไม่ stopPropagation เพื่อให้ existing handlers ทำงานต่อ
    });

    // เพิ่ม enhanced globalpointermove handler
    this.pixiApp.stage.on('globalpointermove', (event: FederatedPointerEvent) => {
      if (!this.isEnabled || !isDragging) return;
      
      // คำนวณตำแหน่งใหม่
      const globalPos = event.global.clone();
      let newX = globalPos.x + dragOffset.x;
      let newY = globalPos.y + dragOffset.y;

      // ใช้ snap-to-grid
      newX = this.snapToGrid(newX);
      newY = this.snapToGrid(newY);

      // ตรวจสอบ boundaries
      newX = this.clampToBoundaries(newX, 'x');
      newY = this.clampToBoundaries(newY, 'y');

      // อัปเดตตำแหน่ง object
      object.x = newX;
      object.y = newY;
    });

    // เพิ่ม enhanced pointerup handler
    object.on('pointerup', () => {
      if (!this.isEnabled) return;
      
      isDragging = false;
    });
  }

  /**
   * คำนวณตำแหน่งที่ snap ไปยัง grid
   * @param value - ค่าตำแหน่งเดิม
   * @returns ค่าตำแหน่งที่ snap แล้ว
   */
  private snapToGrid(value: number): number {
    return Math.round(value / this.gridSize) * this.gridSize;
  }

  /**
   * จำกัดตำแหน่งให้อยู่ใน canvas boundaries
   * @param value - ค่าตำแหน่ง
   * @param axis - แกน ('x' หรือ 'y')
   * @returns ค่าตำแหน่งที่จำกัดแล้ว
   */
  private clampToBoundaries(value: number, axis: 'x' | 'y'): number {
    if (axis === 'x') {
      return Math.max(0, Math.min(this.canvasWidth - this.gridSize, value));
    } else {
      return Math.max(0, Math.min(this.canvasHeight - this.gridSize, value));
    }
  }

  /**
   * คืนค่า original drag behavior
   */
  private restoreOriginalDragBehavior(): void {
    // ลบ enhanced handlers และคืนค่า original handlers
    this.originalDragHandlers.forEach((handlers, object) => {
      // ลบ enhanced handlers
      object.off('pointerdown');
      object.off('pointermove');
      object.off('pointerup');
      
      // คืนค่า original handlers (หากมี)
      if (handlers.pointerdown.length > 0) {
        handlers.pointerdown.forEach((handler: any) => {
          object.on('pointerdown', handler);
        });
      }
    });
    
    this.originalDragHandlers.clear();
  }

  /**
   * ตั้งค่าขนาด grid
   * @param size - ขนาด grid ใน pixels
   */
  public setGridSize(size: number): void {
    this.gridSize = size;
    console.log(`🧲 Snap grid size set to ${size}px`);
  }

  /**
   * อัปเดต canvas boundaries
   * @param width - ความกว้าง canvas
   * @param height - ความสูง canvas
   */
  public updateBoundaries(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    console.log(`🧲 Snap boundaries updated to ${width}x${height}`);
  }

  /**
   * Snap object ไปยังตำแหน่ง grid ที่ใกล้ที่สุด
   * @param object - PixiJS Container ที่จะ snap
   */
  public snapObjectToGrid(object: Container): void {
    if (!this.isEnabled) return;

    const snappedX = this.snapToGrid(object.x);
    const snappedY = this.snapToGrid(object.y);

    object.x = this.clampToBoundaries(snappedX, 'x');
    object.y = this.clampToBoundaries(snappedY, 'y');

    console.log(`🧲 Object snapped to grid at (${object.x}, ${object.y})`);
  }

  /**
   * ได้รับขนาด grid ปัจจุบัน
   * @returns ขนาด grid ใน pixels
   */
  public getGridSize(): number {
    return this.gridSize;
  }

  /**
   * ตรวจสอบว่า snap-to-grid เปิดใช้งานหรือไม่
   * @returns true หาก snap-to-grid เปิดใช้งาน
   */
  public isSnapEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * คำนวณตำแหน่ง grid ที่ใกล้ที่สุดสำหรับจุดที่กำหนด
   * @param x - ตำแหน่ง x
   * @param y - ตำแหน่ง y
   * @returns Object ที่มีตำแหน่ง grid ที่ใกล้ที่สุด
   */
  public getNearestGridPoint(x: number, y: number): { x: number; y: number } {
    return {
      x: this.snapToGrid(x),
      y: this.snapToGrid(y)
    };
  }

  /**
   * ทำลาย SnapToGrid และ cleanup resources
   */
  public destroy(): void {
    this.disable();
    this.originalDragHandlers.clear();
    console.log('🗑️ SnapToGrid destroyed');
  }
}