// src/components/PropertyItem.ts

import { Container, Graphics, Text, FederatedPointerEvent, Circle } from 'pixi.js';
import { PropertyValue } from '../utils/nodeStateManager';
import { ActionButton } from './ActionButton';

/**
 * ตัวเลือกสำหรับการสร้าง PropertyItem
 */
export interface PropertyItemOptions {
  width?: number;                    // ความกว้างของ item (default: 180)
  height?: number;                   // ความสูงของ item (default: 24)
  backgroundColor?: number;          // สีพื้นหลัง (default: 0x2a2a2a)
  textColor?: number;               // สีข้อความ (default: 0xffffff)
  fontSize?: number;                // ขนาดตัวอักษร (default: 12)
  padding?: number;                 // ระยะห่างภายใน (default: 4)
  showEditButton?: boolean;         // แสดงปุ่ม edit หรือไม่ (default: true)
  showDeleteButton?: boolean;       // แสดงปุ่ม delete หรือไม่ (default: true)
  buttonSize?: number;              // ขนาดปุ่ม (default: 16)
}

/**
 * Component สำหรับแสดง Property แต่ละรายการ
 * ประกอบด้วย key: value และปุ่ม edit/delete
 */
export class PropertyItem extends Container {
  private property: PropertyValue;
  private options: Required<PropertyItemOptions>;
  private backgroundGraphics: Graphics;
  private keyText: Text;
  private valueText: Text;
  private editButton?: ActionButton;
  private deleteButton?: ActionButton;
  private isHovered: boolean = false;

  // Event handlers
  private onEditClick?: (property: PropertyValue) => void;
  private onDeleteClick?: (property: PropertyValue) => void;

  constructor(property: PropertyValue, options: PropertyItemOptions = {}) {
    super();

    this.property = { ...property }; // Clone เพื่อป้องกัน mutation
    
    // ตั้งค่า default options
    this.options = {
      width: 180,
      height: 24,
      backgroundColor: 0x2a2a2a,
      textColor: 0xffffff,
      fontSize: 12,
      padding: 4,
      showEditButton: true,
      showDeleteButton: true,
      buttonSize: 16,
      ...options
    };

    this.createBackground();
    this.createTexts();
    this.createButtons();
    this.setupEvents();
    this.layoutComponents();

    console.log(`📝 สร้าง PropertyItem: ${property.key} = ${property.value}`);
  }

  /**
   * สร้างพื้นหลังของ PropertyItem
   */
  private createBackground(): void {
    this.backgroundGraphics = new Graphics();
    this.addChild(this.backgroundGraphics);
    this.drawBackground();
  }

  /**
   * วาดพื้นหลังตามสถานะปัจจุบัน
   */
  private drawBackground(): void {
    const { width, height, backgroundColor } = this.options;
    const currentBgColor = this.isHovered ? backgroundColor + 0x0a0a0a : backgroundColor;

    this.backgroundGraphics.clear();
    
    // วาดสี่เหลี่ยมพื้นหลัง
    this.backgroundGraphics
      .fill(currentBgColor)
      .rect(0, 0, width, height)
      .fill();

    // วาดขอบบางๆ
    this.backgroundGraphics
      .rect(0, 0, width, height)
      .stroke({ width: 1, color: 0x444444 });
  }

  /**
   * สร้าง Text components สำหรับ key และ value
   */
  private createTexts(): void {
    const { textColor, fontSize } = this.options;

    // สร้าง Text สำหรับ key
    this.keyText = new Text({
      text: `${this.property.key}:`,
      style: {
        fontSize: fontSize,
        fill: textColor,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold'
      }
    });

    // สร้าง Text สำหรับ value
    this.valueText = new Text({
      text: this.formatValue(this.property.value, this.property.type),
      style: {
        fontSize: fontSize,
        fill: textColor,
        fontFamily: 'Arial, sans-serif'
      }
    });

    this.addChild(this.keyText);
    this.addChild(this.valueText);
  }

  /**
   * จัดรูปแบบ value ตาม type
   */
  private formatValue(value: string, type: PropertyValue['type']): string {
    switch (type) {
      case 'boolean':
        return value.toLowerCase() === 'true' ? '✓' : '✗';
      case 'number':
        return value;
      case 'text':
      default:
        return value;
    }
  }

  /**
   * สร้างปุ่ม Edit และ Delete
   */
  private createButtons(): void {
    const { showEditButton, showDeleteButton, buttonSize } = this.options;

    if (showEditButton) {
      this.editButton = new ActionButton('edit', {
        size: buttonSize,
        backgroundColor: 0x3a3a3a,
        borderColor: 0x555555,
        hoverBackgroundColor: 0x4a4a4a,
        hoverScale: 1.05
      });

      this.editButton.setClickHandler(this.handleEditClick.bind(this));
      this.addChild(this.editButton);
    }

    if (showDeleteButton) {
      this.deleteButton = new ActionButton('delete', {
        size: buttonSize,
        backgroundColor: 0x3a3a3a,
        borderColor: 0x555555,
        hoverBackgroundColor: 0x4a4a4a,
        hoverScale: 1.05
      });

      this.deleteButton.setClickHandler(this.handleDeleteClick.bind(this));
      this.addChild(this.deleteButton);
    }
  }

  /**
   * จัดตำแหน่งของ components ทั้งหมด
   */
  private layoutComponents(): void {
    const { width, height, padding, buttonSize } = this.options;
    const buttonSpacing = 2;
    const buttonsWidth = (this.editButton ? buttonSize + buttonSpacing : 0) + 
                        (this.deleteButton ? buttonSize : 0);
    const textAreaWidth = width - (buttonsWidth + padding * 3);

    // จัดตำแหน่ง key text
    this.keyText.x = padding;
    this.keyText.y = (height - this.keyText.height) / 2;

    // คำนวณความกว้างของ key text
    const keyWidth = this.keyText.width + padding;
    const valueWidth = textAreaWidth - keyWidth;

    // จัดตำแหน่ง value text
    this.valueText.x = padding + keyWidth;
    this.valueText.y = (height - this.valueText.height) / 2;

    // ตัด value text ถ้ายาวเกินไป
    if (this.valueText.width > valueWidth) {
      const originalText = this.valueText.text;
      let truncatedText = originalText;
      
      while (this.valueText.width > valueWidth - 20 && truncatedText.length > 3) {
        truncatedText = truncatedText.slice(0, -1);
        this.valueText.text = truncatedText + '...';
      }
    }

    // จัดตำแหน่งปุ่ม
    let buttonX = width - padding - buttonSize;

    if (this.deleteButton) {
      this.deleteButton.x = buttonX;
      this.deleteButton.y = height / 2;
      buttonX -= (buttonSize + buttonSpacing);
    }

    if (this.editButton) {
      this.editButton.x = buttonX;
      this.editButton.y = height / 2;
    }
  }

  /**
   * ตั้งค่า Event Handlers
   */
  private setupEvents(): void {
    // ตั้งค่าให้สามารถ interact ได้
    this.eventMode = 'static';
    this.cursor = 'default';
    
    // ตั้งค่า hit area
    this.hitArea = new Circle(this.options.width / 2, this.options.height / 2, 
                             Math.max(this.options.width, this.options.height) / 2);

    // Hover events
    this.on('pointerover', this.handlePointerOver.bind(this));
    this.on('pointerout', this.handlePointerOut.bind(this));
  }

  /**
   * จัดการ Pointer Over Event
   */
  private handlePointerOver(event: FederatedPointerEvent): void {
    event.stopPropagation();
    
    if (!this.isHovered) {
      this.isHovered = true;
      this.drawBackground();
    }
  }

  /**
   * จัดการ Pointer Out Event
   */
  private handlePointerOut(event: FederatedPointerEvent): void {
    event.stopPropagation();
    
    if (this.isHovered) {
      this.isHovered = false;
      this.drawBackground();
    }
  }

  /**
   * จัดการ Edit Button Click
   */
  private handleEditClick(event: FederatedPointerEvent): void {
    console.log(`✏️ แก้ไข Property: ${this.property.key}`);
    
    if (this.onEditClick) {
      this.onEditClick(this.property);
    }

    // ส่ง custom event
    this.dispatchPropertyEvent('edit', event);
  }

  /**
   * จัดการ Delete Button Click
   */
  private handleDeleteClick(event: FederatedPointerEvent): void {
    console.log(`🗑️ ลบ Property: ${this.property.key}`);
    
    if (this.onDeleteClick) {
      this.onDeleteClick(this.property);
    }

    // ส่ง custom event
    this.dispatchPropertyEvent('delete', event);
  }

  /**
   * ส่ง Custom Event เมื่อมีการดำเนินการกับ Property
   */
  private dispatchPropertyEvent(action: 'edit' | 'delete', event: FederatedPointerEvent): void {
    const customEvent = new CustomEvent('property-item-action', {
      detail: {
        property: this.property,
        action: action,
        originalEvent: event,
        item: this
      }
    });
    window.dispatchEvent(customEvent);
  }

  /**
   * อัปเดต Property data
   */
  public updateProperty(newProperty: PropertyValue): void {
    this.property = { ...newProperty };
    
    // อัปเดต texts
    this.keyText.text = `${this.property.key}:`;
    this.valueText.text = this.formatValue(this.property.value, this.property.type);
    
    // จัดตำแหน่งใหม่
    this.layoutComponents();
    
    console.log(`🔄 อัปเดต PropertyItem: ${this.property.key} = ${this.property.value}`);
  }

  /**
   * ได้ Property data
   */
  public getProperty(): PropertyValue {
    return { ...this.property };
  }

  /**
   * ตั้งค่า Edit Click Handler
   */
  public setEditClickHandler(handler: (property: PropertyValue) => void): void {
    this.onEditClick = handler;
  }

  /**
   * ตั้งค่า Delete Click Handler
   */
  public setDeleteClickHandler(handler: (property: PropertyValue) => void): void {
    this.onDeleteClick = handler;
  }

  /**
   * ได้ขนาดของ PropertyItem
   */
  public getSize(): { width: number; height: number } {
    return {
      width: this.options.width,
      height: this.options.height
    };
  }

  /**
   * ทำลาย component และ cleanup resources
   */
  public destroy(): void {
    // ทำลาย children
    this.backgroundGraphics?.destroy();
    this.keyText?.destroy();
    this.valueText?.destroy();
    this.editButton?.destroy();
    this.deleteButton?.destroy();
    
    console.log(`🗑️ ทำลาย PropertyItem: ${this.property.key}`);
    
    // เรียก parent destroy
    super.destroy();
  }
}