// src/components/ActionButton.ts

import { Container, Graphics, FederatedPointerEvent, Circle } from 'pixi.js';

/**
 * ประเภทของ Action Button
 */
export type ActionButtonType = 'edit' | 'delete';

/**
 * ตัวเลือกสำหรับการสร้าง ActionButton
 */
export interface ActionButtonOptions {
  size?: number;                    // ขนาดของปุ่ม (default: 32)
  backgroundColor?: number;         // สีพื้นหลังของปุ่ม (default: 0xffffff)
  borderColor?: number;             // สีขอบของปุ่ม (default: 0x666666)
  iconColor?: number;               // สีของไอคอน (default: 0x333333)
  hoverBackgroundColor?: number;    // สีพื้นหลังเมื่อ hover (default: 0xf0f0f0)
  hoverScale?: number;              // ขนาดเมื่อ hover (default: 1.1)
}

/**
 * ปุ่มสำหรับการดำเนินการต่างๆ (Edit, Delete)
 * แสดงเป็นวงกลมพร้อมไอคอนและมี hover effects
 */
export class ActionButton extends Container {
  private buttonGraphics: Graphics;
  private iconGraphics: Graphics;
  private buttonType: ActionButtonType;
  private options: Required<ActionButtonOptions>;
  private isHovered: boolean = false;
  private clickHandler?: (event: FederatedPointerEvent) => void;

  constructor(type: ActionButtonType, options: ActionButtonOptions = {}) {
    super();

    this.buttonType = type;
    
    // ตั้งค่า default options
    this.options = {
      size: 32,
      backgroundColor: 0xffffff,
      borderColor: 0x666666,
      iconColor: this.getDefaultIconColor(type),
      hoverBackgroundColor: 0xf0f0f0,
      hoverScale: 1.1,
      ...options
    };

    this.createButtonGraphics();
    this.createIconGraphics();
    this.setupEvents();

    console.log(`🔘 สร้าง ActionButton ประเภท: ${type}`);
  }

  /**
   * ได้สีไอคอนเริ่มต้นตามประเภทปุ่ม
   */
  private getDefaultIconColor(type: ActionButtonType): number {
    switch (type) {
      case 'edit':
        return 0x007AFF; // สีน้ำเงิน
      case 'delete':
        return 0xFF3B30; // สีแดง
      default:
        return 0x333333; // สีเทาเข้ม
    }
  }

  /**
   * สร้าง Graphics สำหรับปุ่ม (วงกลมพื้นหลัง)
   */
  private createButtonGraphics(): void {
    this.buttonGraphics = new Graphics();
    this.addChild(this.buttonGraphics);
    this.drawButton();
  }

  /**
   * วาดปุ่มตามสถานะปัจจุบัน
   */
  private drawButton(): void {
    const { size, backgroundColor, borderColor, hoverBackgroundColor } = this.options;
    const radius = size / 2;
    const currentBgColor = this.isHovered ? hoverBackgroundColor : backgroundColor;

    this.buttonGraphics.clear();
    
    // วาดวงกลมพื้นหลัง
    this.buttonGraphics
      .fill(currentBgColor)
      .circle(0, 0, radius)
      .fill();

    // วาดขอบ
    this.buttonGraphics
      .circle(0, 0, radius)
      .stroke({ width: 2, color: borderColor });
  }

  /**
   * สร้าง Graphics สำหรับไอคอน
   */
  private createIconGraphics(): void {
    this.iconGraphics = new Graphics();
    this.addChild(this.iconGraphics);
    this.drawIcon();
  }

  /**
   * วาดไอคอนตามประเภทปุ่ม
   */
  private drawIcon(): void {
    const { size, iconColor } = this.options;
    const iconSize = size * 0.4; // ไอคอนมีขนาด 40% ของปุ่ม

    this.iconGraphics.clear();

    switch (this.buttonType) {
      case 'edit':
        this.drawEditIcon(iconSize, iconColor);
        break;
      case 'delete':
        this.drawDeleteIcon(iconSize, iconColor);
        break;
    }
  }

  /**
   * วาดไอคอนดินสอ (Edit)
   */
  private drawEditIcon(size: number, color: number): void {
    const halfSize = size / 2;
    
    // วาดดินสอแบบง่ายๆ
    this.iconGraphics
      // ด้ามดินสอ
      .moveTo(-halfSize * 0.8, halfSize * 0.8)
      .lineTo(halfSize * 0.8, -halfSize * 0.8)
      .stroke({ width: 2, color: color })
      
      // หัวดินสอ
      .moveTo(halfSize * 0.6, -halfSize * 0.6)
      .lineTo(halfSize * 0.8, -halfSize * 0.8)
      .lineTo(halfSize * 0.8, -halfSize * 0.6)
      .fill(color)
      
      // จุดเล็กๆ ที่ปลายดินสอ
      .circle(-halfSize * 0.6, halfSize * 0.6, 1.5)
      .fill(color);
  }

  /**
   * วาดไอคอนถังขยะ (Delete)
   */
  private drawDeleteIcon(size: number, color: number): void {
    const halfSize = size / 2;
    
    // วาดถังขยะแบบง่ายๆ
    this.iconGraphics
      // ฝาถังขยะ
      .rect(-halfSize * 0.8, -halfSize * 0.8, size * 1.6, size * 0.2)
      .fill(color)
      
      // ตัวถังขยะ
      .rect(-halfSize * 0.6, -halfSize * 0.6, size * 1.2, size * 1.2)
      .stroke({ width: 2, color: color })
      
      // เส้นใน ถังขยะ
      .moveTo(-halfSize * 0.2, -halfSize * 0.4)
      .lineTo(-halfSize * 0.2, halfSize * 0.4)
      .stroke({ width: 1.5, color: color })
      
      .moveTo(0, -halfSize * 0.4)
      .lineTo(0, halfSize * 0.4)
      .stroke({ width: 1.5, color: color })
      
      .moveTo(halfSize * 0.2, -halfSize * 0.4)
      .lineTo(halfSize * 0.2, halfSize * 0.4)
      .stroke({ width: 1.5, color: color });
  }

  /**
   * ตั้งค่า Event Handlers
   */
  private setupEvents(): void {
    // ตั้งค่าให้สามารถ interact ได้
    this.eventMode = 'static';
    this.cursor = 'pointer';
    
    // ตั้งค่า hit area เป็นวงกลม
    const radius = this.options.size / 2;
    this.hitArea = new Circle(0, 0, radius);

    // Hover events
    this.on('pointerover', this.handlePointerOver.bind(this));
    this.on('pointerout', this.handlePointerOut.bind(this));

    // Click event
    this.on('pointerdown', this.handleClick.bind(this));
  }

  /**
   * จัดการ Pointer Over Event (Hover เข้า)
   */
  private handlePointerOver(event: FederatedPointerEvent): void {
    event.stopPropagation();
    
    if (!this.isHovered) {
      this.isHovered = true;
      this.animateHoverIn();
    }
  }

  /**
   * จัดการ Pointer Out Event (Hover ออก)
   */
  private handlePointerOut(event: FederatedPointerEvent): void {
    event.stopPropagation();
    
    if (this.isHovered) {
      this.isHovered = false;
      this.animateHoverOut();
    }
  }

  /**
   * จัดการ Click Event
   */
  private handleClick(event: FederatedPointerEvent): void {
    event.stopPropagation();
    
    // เรียก click handler ถ้ามี
    if (this.clickHandler) {
      this.clickHandler(event);
    }

    console.log(`🖱️ คลิก ActionButton ประเภท: ${this.buttonType}`);
  }

  /**
   * ตั้งค่า Click Handler
   */
  public setClickHandler(handler: (event: FederatedPointerEvent) => void): void {
    this.clickHandler = handler;
  }

  /**
   * Animation สำหรับ Hover เข้า
   */
  private animateHoverIn(): void {
    // วาดปุ่มใหม่ด้วยสี hover
    this.drawButton();
    
    // Scale animation
    const targetScale = this.options.hoverScale;
    const duration = 150;
    const startScale = this.scale.x;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentScale = startScale + (targetScale - startScale) * easeProgress;
      
      this.scale.set(currentScale);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Animation สำหรับ Hover ออก
   */
  private animateHoverOut(): void {
    // วาดปุ่มใหม่ด้วยสีปกติ
    this.drawButton();
    
    // Scale animation กลับ
    const targetScale = 1.0;
    const duration = 150;
    const startScale = this.scale.x;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentScale = startScale + (targetScale - startScale) * easeProgress;
      
      this.scale.set(currentScale);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * ได้ประเภทของปุ่ม
   */
  public getButtonType(): ActionButtonType {
    return this.buttonType;
  }

  /**
   * ทำลาย component และ cleanup resources
   */
  public destroy(): void {
    // ลบ children และ destroy graphics
    this.buttonGraphics?.destroy();
    this.iconGraphics?.destroy();
    
    console.log(`🗑️ ทำลาย ActionButton ประเภท: ${this.buttonType}`);
    
    // เรียก parent destroy
    super.destroy();
  }
}