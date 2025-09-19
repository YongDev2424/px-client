// src/utils/stageManager.ts

import { Application, FederatedPointerEvent, Point } from 'pixi.js';
import { edgeStateManager } from './edgeState';
import { selectionManager } from './selectionManager';

/**
 * ระบบจัดการ Stage Events สำหรับประสานงานระหว่าง
 * - การลาก Node (Dragging)
 * - การสร้าง Edge (Edge Creation)
 * - การยกเลิกการดำเนินการต่างๆ
 */
class StageManager {
  private app: Application | null = null;
  private isInitialized: boolean = false;

  /**
   * เริ่มต้นระบบจัดการ Stage Events
   * @param app - ตัวแอปพลิเคชัน PixiJS หลัก
   */
  initialize(app: Application): void {
    if (this.isInitialized) {
      console.warn('StageManager ถูกเริ่มต้นแล้ว');
      return;
    }

    this.app = app;
    this.setupStageEvents();
    this.isInitialized = true;
    
    console.log('StageManager เริ่มต้นแล้ว');
  }

  /**
   * ตั้งค่า Event Listeners สำหรับ Stage
   */
  private setupStageEvents(): void {
    if (!this.app) return;

    const stage = this.app.stage;
    
    // ตั้งค่าให้ stage สามารถรับ events ได้
    stage.eventMode = 'static';
    stage.hitArea = this.app.screen;

    // Event: การเคลื่อนไหวของเมาส์บน stage (ใช้ global เพื่อไม่ถูกบังโดย preview line)
    stage.on('globalpointermove', this.handleStagePointerMove.bind(this));

    // Event: การคลิกบน stage (พื้นที่ว่าง)
    stage.on('pointerdown', this.handleStagePointerDown.bind(this));

    // Event: การปล่อยเมาส์บน stage
    stage.on('pointerup', this.handleStagePointerUp.bind(this));

    // Event: กดปุ่ม ESC เพื่อยกเลิกการดำเนินการ
    this.setupKeyboardEvents();
  }

  /**
   * จัดการเหตุการณ์การเคลื่อนไหวของเมาส์บน stage
   * @param event - FederatedPointerEvent
   */
  private handleStagePointerMove(event: FederatedPointerEvent): void {
    // อัปเดต preview line ถ้ากำลังสร้าง edge
    if (edgeStateManager.isCreatingEdge()) {
      // แปลงพิกัด global เป็น local coordinates ของ stage เพื่อรองรับ zoom
      const localMousePosition = this.globalToStageLocal(event.global);
      edgeStateManager.updatePreview(localMousePosition);
      
      // ขยาง hit area ของ connection points ทุกตัวเมื่อกำลังสร้าง edge
      this.updateAllConnectionPointsHitArea(true);
    } else {
      // ย่อ hit area กลับเป็นปกติเมื่อไม่ได้สร้าง edge
      this.updateAllConnectionPointsHitArea(false);
    }
  }

  /**
   * จัดการเหตุการณ์การคลิกบนพื้นที่ว่างของ stage
   * @param event - FederatedPointerEvent
   */
  private handleStagePointerDown(_event: FederatedPointerEvent): void {
    // ถ้ากำลังสร้าง edge อยู่ ให้ยกเลิก
    if (edgeStateManager.isCreatingEdge()) {
      console.log('ยกเลิกการสร้าง Edge เนื่องจากคลิกพื้นที่ว่าง');
      edgeStateManager.cancelEdgeCreation();
      return;
    }

    // ถ้าไม่ได้กำลังสร้าง edge และคลิกพื้นที่ว่าง
    // ให้ยกเลิกการ select ทุก elements
    console.log('คลิกบนพื้นที่ว่างของ stage - ยกเลิกการ select ทั้งหมด');
    selectionManager.deselectAll();
  }

  /**
   * จัดการเหตุการณ์การปล่อยเมาส์บน stage
   * @param event - FederatedPointerEvent
   */
  private handleStagePointerUp(_event: FederatedPointerEvent): void {
    // ใช้สำหรับ dragging system และการสร้าง edge
    // (ปัจจุบันมี logic ใน draggable.ts อยู่แล้ว แต่อาจต้องประสานงาน)
  }

  /**
   * ตั้งค่า Keyboard Events
   */
  private setupKeyboardEvents(): void {
    // เพิ่ม event listener สำหรับ ESC key
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * จัดการเหตุการณ์การกดปุ่มคีย์บอร์ด
   * @param event - KeyboardEvent
   */
  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.handleEscapeKey();
        break;
      
      // สามารถเพิ่มปุ่มอื่นๆ ได้ในอนาคต
      // case 'Delete':
      //   this.handleDeleteKey();
      //   break;
    }
  }

  /**
   * จัดการเมื่อกดปุ่ม ESC
   */
  private handleEscapeKey(): void {
    if (edgeStateManager.isCreatingEdge()) {
      console.log('ยกเลิกการสร้าง Edge ด้วยปุ่ม ESC');
      edgeStateManager.cancelEdgeCreation();
    }
  }

  /**
   * ได้ตำแหน่งเมาส์ปัจจุบันบน stage
   * @returns จุดพิกัดของเมาส์ หรือ null ถ้าไม่สามารถหาได้
   */
  getCurrentMousePosition(): Point | null {
    if (!this.app) return null;
    
    // ใช้ global mouse position จาก app.renderer
    // TODO: อาจต้องปรับปรุงให้ถูกต้องกับ PixiJS v8
    return new Point(0, 0); // placeholder
  }

  /**
   * บังคับให้อัปเดต stage
   */
  forceStageUpdate(): void {
    if (this.app) {
      this.app.render();
    }
  }

  /**
   * ตรวจสอบว่า stage manager ถูกเริ่มต้นแล้วหรือไม่
   */
  isStageManagerInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * ได้ reference ของ Application
   */
  getApplication(): Application | null {
    return this.app;
  }

  /**
   * ปิดการทำงานและล้าง event listeners
   */
  destroy(): void {
    if (!this.isInitialized) return;

    // ลบ keyboard event listeners
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));

    // ลบ stage event listeners
    if (this.app && this.app.stage) {
      this.app.stage.off('globalpointermove', this.handleStagePointerMove.bind(this));
      this.app.stage.off('pointerdown', this.handleStagePointerDown.bind(this));
      this.app.stage.off('pointerup', this.handleStagePointerUp.bind(this));
    }

    this.app = null;
    this.isInitialized = false;
    
    console.log('StageManager ถูกปิดการทำงาน');
  }

  /**
   * เพิ่ม custom event handler สำหรับ stage
   * @param eventName - ชื่อ event
   * @param handler - ฟังก์ชัน handler
   */
  addStageEventListener(eventName: string, handler: (event: FederatedPointerEvent) => void): void {
    if (this.app && this.app.stage) {
      this.app.stage.on(eventName, handler);
    }
  }

  /**
   * ลบ custom event handler จาก stage
   * @param eventName - ชื่อ event
   * @param handler - ฟังก์ชัน handler
   */
  removeStageEventListener(eventName: string, handler: (event: FederatedPointerEvent) => void): void {
    if (this.app && this.app.stage) {
      this.app.stage.off(eventName, handler);
    }
  }

  /**
   * ตั้งค่า cursor สำหรับ stage
   * @param cursor - ชนิดของ cursor
   */
  setStageCursor(cursor: string): void {
    if (this.app && this.app.canvas) {
      this.app.canvas.style.cursor = cursor;
    }
  }

  /**
   * รีเซ็ต cursor กลับเป็นค่าเริ่มต้น
   */
  resetStageCursor(): void {
    this.setStageCursor('default');
  }

  /**
   * แปลงพิกัด global (หน้าจอ) เป็น local coordinates ของ stage
   * เพื่อรองรับการ zoom และ pan ของ stage
   * @param globalPoint - พิกัด global จาก event.global
   * @returns พิกัด local บน stage ที่ปรับตาม zoom แล้ว
   */
  private globalToStageLocal(globalPoint: Point): Point {
    if (!this.app) return globalPoint.clone();
    
    // ใช้ toLocal() ของ stage เพื่อแปลงพิกัด global เป็น local
    // ฟังก์ชันนี้จะคำนวณ zoom scale และ position offset ให้อัตโนมัติ
    return this.app.stage.toLocal(globalPoint);
  }



  /**
   * อัปเดต hit area ของ connection points ทั้งหมดบน stage
   * @param expanded - true = ขยาย hit area เป็น 2 เท่า, false = ย่อกลับเป็นปกติ
   */
  private updateAllConnectionPointsHitArea(expanded: boolean): void {
    if (!this.app) return;

    const radius = expanded ? 10 : 5; // 2 เท่าเมื่อกำลังสร้าง edge

    // วนหา Node containers ทั้งหมดบน stage
    this.app.stage.children.forEach((child: any) => {
      if (child.connectionPoint && child.connectionPoint.setHitAreaRadius) {
        child.connectionPoint.setHitAreaRadius(radius);
      }
    });
  }
}

// สร้าง instance เดียวสำหรับใช้ทั่วทั้งแอปพลิเคชัน (Singleton pattern)
export const stageManager = new StageManager();