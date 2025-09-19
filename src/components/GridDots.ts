// src/components/GridDots.ts

import { Container, Graphics } from 'pixi.js';

/**
 * GridDots - สร้างจุดสีขาวเรียงเป็นตารางเต็มพื้นที่ canvas
 * ใช้แทน grid lines เพื่อให้ดูสะอาดและทันสมัยขึ้น
 */
export class GridDots {
  private container: Container;
  private dotSize: number;
  private spacing: number;
  private dotColor: number;
  private dotAlpha: number;

  constructor(
    dotSize: number = 2,
    spacing: number = 40,
    dotColor: number = 0xFFFFFF,
    dotAlpha: number = 0.15
  ) {
    this.container = new Container();
    this.dotSize = dotSize;
    this.spacing = spacing;
    this.dotColor = dotColor;
    this.dotAlpha = dotAlpha;
    
    // ปิด interaction เพื่อไม่ให้รบกวนการคลิกบน canvas
    this.container.eventMode = 'none';
    this.container.interactiveChildren = false;
  }

  /**
   * สร้างจุดตารางตามขนาด canvas ที่กำหนด
   * @param canvasWidth - ความกว้างของ canvas
   * @param canvasHeight - ความสูงของ canvas
   */
  createGrid(canvasWidth: number, canvasHeight: number): void {
    // ล้าง dots เดิม
    this.container.removeChildren();

    // คำนวณจำนวนจุดที่ต้องการ
    const dotsX = Math.ceil(canvasWidth / this.spacing) + 1;
    const dotsY = Math.ceil(canvasHeight / this.spacing) + 1;

    // สร้างจุดทีละจุด
    for (let x = 0; x < dotsX; x++) {
      for (let y = 0; y < dotsY; y++) {
        const dot = this.createSingleDot();
        
        // วางตำแหน่งจุด
        dot.x = x * this.spacing;
        dot.y = y * this.spacing;
        
        this.container.addChild(dot);
      }
    }

    console.log(`✅ Created grid with ${dotsX * dotsY} dots (${dotsX}x${dotsY})`);
  }

  /**
   * สร้างจุดเดียว
   */
  private createSingleDot(): Graphics {
    const dot = new Graphics();
    
    // วาดวงกลมเล็กๆ
    dot.circle(0, 0, this.dotSize);
    dot.fill({ color: this.dotColor, alpha: this.dotAlpha });
    
    return dot;
  }

  /**
   * อัพเดทขนาด grid เมื่อ canvas เปลี่ยนขนาด
   * @param canvasWidth - ความกว้างใหม่
   * @param canvasHeight - ความสูงใหม่
   */
  updateGrid(canvasWidth: number, canvasHeight: number): void {
    this.createGrid(canvasWidth, canvasHeight);
  }

  /**
   * เปลี่ยนความโปร่งใสของจุด
   * @param alpha - ค่าความโปร่งใส (0-1)
   */
  setAlpha(alpha: number): void {
    this.dotAlpha = Math.max(0, Math.min(1, alpha));
    this.container.alpha = this.dotAlpha;
  }

  /**
   * แสดง/ซ่อน grid
   * @param visible - แสดงหรือไม่
   */
  setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  /**
   * เปลี่ยนสีของจุด
   * @param color - สีใหม่ (hex)
   */
  setColor(color: number): void {
    this.dotColor = color;
    // อัพเดทสีของจุดทั้งหมด
    this.container.children.forEach(child => {
      if (child instanceof Graphics) {
        child.tint = color;
      }
    });
  }

  /**
   * เปลี่ยนระยะห่างระหว่างจุด
   * @param spacing - ระยะห่างใหม่ (pixels)
   * @param canvasWidth - ความกว้างของ canvas
   * @param canvasHeight - ความสูงของ canvas
   */
  setSpacing(spacing: number, canvasWidth: number, canvasHeight: number): void {
    this.spacing = spacing;
    this.createGrid(canvasWidth, canvasHeight);
  }

  /**
   * เปลี่ยนขนาดของจุด
   * @param size - ขนาดใหม่ (pixels)
   * @param canvasWidth - ความกว้างของ canvas
   * @param canvasHeight - ความสูงของ canvas
   */
  setDotSize(size: number, canvasWidth: number, canvasHeight: number): void {
    this.dotSize = size;
    this.createGrid(canvasWidth, canvasHeight);
  }

  /**
   * รับ Container สำหรับเพิ่มเข้า stage
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * ทำลาย GridDots และล้างหน่วยความจำ
   */
  destroy(): void {
    this.container.removeChildren();
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy();
  }

  /**
   * รับข้อมูลการตั้งค่าปัจจุบัน
   */
  getSettings() {
    return {
      dotSize: this.dotSize,
      spacing: this.spacing,
      dotColor: this.dotColor,
      dotAlpha: this.dotAlpha,
      visible: this.container.visible,
      totalDots: this.container.children.length
    };
  }
}

/**
 * Helper function สำหรับสร้าง GridDots แบบง่าย
 * @param canvasWidth - ความกว้างของ canvas
 * @param canvasHeight - ความสูงของ canvas
 * @param options - ตัวเลือกการตั้งค่า
 * @returns GridDots instance ที่พร้อมใช้งาน
 */
export function createGridDots(
  canvasWidth: number,
  canvasHeight: number,
  options?: {
    dotSize?: number;
    spacing?: number;
    dotColor?: number;
    dotAlpha?: number;
  }
): GridDots {
  const gridDots = new GridDots(
    options?.dotSize || 2,
    options?.spacing || 40,
    options?.dotColor || 0xFFFFFF,
    options?.dotAlpha || 0.15
  );
  
  gridDots.createGrid(canvasWidth, canvasHeight);
  return gridDots;
}