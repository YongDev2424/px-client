// src/components/PropertyList.ts

import { Container, Graphics, Text } from 'pixi.js';
import { PropertyValue } from '../utils/nodeStateManager';
import { PropertyItem } from './PropertyItem';

/**
 * ตัวเลือกสำหรับการสร้าง PropertyList
 */
export interface PropertyListOptions {
  width?: number;                    // ความกว้างของ list (default: 180)
  maxHeight?: number;               // ความสูงสูงสุดของ list (default: 120)
  itemHeight?: number;              // ความสูงของแต่ละ item (default: 24)
  spacing?: number;                 // ระยะห่างระหว่าง items (default: 2)
  backgroundColor?: number;         // สีพื้นหลัง (default: 0x1e1e1e)
  borderColor?: number;             // สีขอบ (default: 0x444444)
  scrollbarColor?: number;          // สีของ scrollbar (default: 0x666666)
  scrollbarWidth?: number;          // ความกว้างของ scrollbar (default: 8)
  showScrollbar?: boolean;          // แสดง scrollbar หรือไม่ (default: true)
  emptyMessage?: string;            // ข้อความเมื่อไม่มี properties (default: 'No properties')
}

/**
 * Component สำหรับแสดงรายการ Properties พร้อมการ scroll
 * รองรับการแสดง PropertyItem หลายรายการและมี scrollbar เมื่อเนื้อหาเกิน
 */
export class PropertyList extends Container {
  private options: Required<PropertyListOptions>;
  private backgroundGraphics: Graphics;
  private scrollContainer: Container;
  private scrollbarContainer: Container;
  private scrollbarTrack: Graphics;
  private scrollbarThumb: Graphics;
  private emptyMessageText: Text;
  
  private properties: Map<string, PropertyItem> = new Map();
  private scrollPosition: number = 0;
  private maxScrollPosition: number = 0;
  private isDraggingScrollbar: boolean = false;
  private scrollbarVisible: boolean = false;

  // Event handlers
  private onPropertyEdit?: (property: PropertyValue) => void;
  private onPropertyDelete?: (property: PropertyValue) => void;

  constructor(options: PropertyListOptions = {}) {
    super();
    
    // ตั้งค่า default options
    this.options = {
      width: 180,
      maxHeight: 120,
      itemHeight: 24,
      spacing: 2,
      backgroundColor: 0x1e1e1e,
      borderColor: 0x444444,
      scrollbarColor: 0x666666,
      scrollbarWidth: 8,
      showScrollbar: true,
      emptyMessage: 'No properties',
      ...options
    };

    this.createBackground();
    this.createScrollContainer();
    this.createScrollbar();
    this.createEmptyMessage();
    this.setupEvents();
    this.updateLayout();

    console.log('📋 สร้าง PropertyList');
  }

  /**
   * สร้างพื้นหลังของ PropertyList
   */
  private createBackground(): void {
    this.backgroundGraphics = new Graphics();
    this.addChild(this.backgroundGraphics);
    this.drawBackground();
  }

  /**
   * วาดพื้นหลัง
   */
  private drawBackground(): void {
    const { width, maxHeight, backgroundColor, borderColor } = this.options;

    this.backgroundGraphics.clear();
    
    // วาดพื้นหลัง
    this.backgroundGraphics
      .fill(backgroundColor)
      .rect(0, 0, width, maxHeight)
      .fill();

    // วาดขอบ
    this.backgroundGraphics
      .rect(0, 0, width, maxHeight)
      .stroke({ width: 1, color: borderColor });
  }

  /**
   * สร้าง Scroll Container สำหรับเก็บ PropertyItems
   */
  private createScrollContainer(): void {
    this.scrollContainer = new Container();
    this.addChild(this.scrollContainer);

    // ตั้งค่า mask สำหรับ clipping
    const maskGraphics = new Graphics();
    maskGraphics
      .fill(0xffffff)
      .rect(0, 0, this.options.width - this.options.scrollbarWidth, this.options.maxHeight)
      .fill();
    
    this.scrollContainer.mask = maskGraphics;
    this.addChild(maskGraphics);
  }

  /**
   * สร้าง Scrollbar
   */
  private createScrollbar(): void {
    if (!this.options.showScrollbar) return;

    this.scrollbarContainer = new Container();
    this.addChild(this.scrollbarContainer);

    // สร้าง scrollbar track
    this.scrollbarTrack = new Graphics();
    this.scrollbarContainer.addChild(this.scrollbarTrack);

    // สร้าง scrollbar thumb
    this.scrollbarThumb = new Graphics();
    this.scrollbarContainer.addChild(this.scrollbarThumb);

    this.drawScrollbar();
    this.setupScrollbarEvents();
  }

  /**
   * วาด Scrollbar
   */
  private drawScrollbar(): void {
    if (!this.options.showScrollbar) return;

    const { width, maxHeight, scrollbarColor, scrollbarWidth } = this.options;
    const trackX = width - scrollbarWidth;

    // วาด scrollbar track
    this.scrollbarTrack.clear();
    this.scrollbarTrack
      .fill(scrollbarColor - 0x222222)
      .rect(trackX, 0, scrollbarWidth, maxHeight)
      .fill();

    // คำนวณขนาดและตำแหน่งของ thumb
    const contentHeight = this.getContentHeight();
    const thumbHeight = Math.max(20, (maxHeight / contentHeight) * maxHeight);
    const thumbY = (this.scrollPosition / this.maxScrollPosition) * (maxHeight - thumbHeight);

    // วาด scrollbar thumb
    this.scrollbarThumb.clear();
    if (this.scrollbarVisible) {
      this.scrollbarThumb
        .fill(scrollbarColor)
        .rect(trackX + 1, thumbY, scrollbarWidth - 2, thumbHeight)
        .fill();
    }
  }

  /**
   * ตั้งค่า Scrollbar Events
   */
  private setupScrollbarEvents(): void {
    if (!this.options.showScrollbar) return;

    this.scrollbarThumb.eventMode = 'static';
    this.scrollbarThumb.cursor = 'pointer';

    this.scrollbarThumb.on('pointerdown', (event) => {
      event.stopPropagation();
      this.isDraggingScrollbar = true;
    });

    // Global events สำหรับ scrollbar dragging
    document.addEventListener('pointermove', this.handleScrollbarDrag.bind(this));
    document.addEventListener('pointerup', this.handleScrollbarRelease.bind(this));
  }

  /**
   * จัดการ Scrollbar Drag
   */
  private handleScrollbarDrag(event: PointerEvent): void {
    if (!this.isDraggingScrollbar) return;

    const { maxHeight } = this.options;
    const contentHeight = this.getContentHeight();
    
    if (contentHeight <= maxHeight) return;

    // คำนวณตำแหน่งใหม่ของ scroll
    const localY = event.clientY; // ใช้ client coordinates แทน
    const scrollRatio = localY / maxHeight;
    this.scrollPosition = Math.max(0, Math.min(this.maxScrollPosition, scrollRatio * this.maxScrollPosition));

    this.updateScrollPosition();
  }

  /**
   * จัดการ Scrollbar Release
   */
  private handleScrollbarRelease(): void {
    this.isDraggingScrollbar = false;
  }

  /**
   * สร้างข้อความเมื่อไม่มี Properties
   */
  private createEmptyMessage(): void {
    this.emptyMessageText = new Text({
      text: this.options.emptyMessage,
      style: {
        fontSize: 12,
        fill: 0x888888,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'italic'
      }
    });

    this.emptyMessageText.anchor.set(0.5);
    this.addChild(this.emptyMessageText);
  }

  /**
   * ตั้งค่า Events
   */
  private setupEvents(): void {
    // Wheel event สำหรับ scrolling
    this.eventMode = 'static';
    this.on('wheel', this.handleWheel.bind(this));
  }

  /**
   * จัดการ Wheel Event สำหรับ scrolling
   */
  private handleWheel(event: any): void {
    event.stopPropagation();
    
    const deltaY = event.deltaY || 0;
    const scrollSpeed = 20;
    
    this.scrollPosition = Math.max(0, Math.min(this.maxScrollPosition, 
      this.scrollPosition + (deltaY > 0 ? scrollSpeed : -scrollSpeed)));
    
    this.updateScrollPosition();
  }

  /**
   * อัปเดตตำแหน่ง scroll
   */
  private updateScrollPosition(): void {
    this.scrollContainer.y = -this.scrollPosition;
    this.drawScrollbar();
  }

  /**
   * คำนวณความสูงของเนื้อหาทั้งหมด
   */
  private getContentHeight(): number {
    const { itemHeight, spacing } = this.options;
    const itemCount = this.properties.size;
    
    if (itemCount === 0) return 0;
    
    return (itemCount * itemHeight) + ((itemCount - 1) * spacing);
  }

  /**
   * อัปเดต Layout ของ PropertyList
   */
  private updateLayout(): void {
    const { width, maxHeight, itemHeight, spacing } = this.options;
    const contentHeight = this.getContentHeight();
    
    // อัปเดต max scroll position
    this.maxScrollPosition = Math.max(0, contentHeight - maxHeight);
    
    // แสดง/ซ่อน scrollbar
    this.scrollbarVisible = contentHeight > maxHeight;
    
    // จัดตำแหน่ง empty message
    this.emptyMessageText.x = width / 2;
    this.emptyMessageText.y = maxHeight / 2;
    this.emptyMessageText.visible = this.properties.size === 0;
    
    // จัดตำแหน่ง PropertyItems
    let currentY = 0;
    const sortedProperties = Array.from(this.properties.values())
      .sort((a, b) => a.getProperty().order - b.getProperty().order);
    
    sortedProperties.forEach((item) => {
      item.x = 0;
      item.y = currentY;
      currentY += itemHeight + spacing;
    });
    
    // อัปเดต scroll position ถ้าเกินขอบเขต
    if (this.scrollPosition > this.maxScrollPosition) {
      this.scrollPosition = this.maxScrollPosition;
    }
    
    this.updateScrollPosition();
  }

  /**
   * เพิ่ม Property ใหม่
   */
  public addProperty(property: PropertyValue): void {
    // ตรวจสอบว่ามี property นี้อยู่แล้วหรือไม่
    if (this.properties.has(property.key)) {
      console.warn(`Property "${property.key}" มีอยู่แล้วใน PropertyList`);
      return;
    }

    // สร้าง PropertyItem ใหม่
    const propertyItem = new PropertyItem(property, {
      width: this.options.width - (this.scrollbarVisible ? this.options.scrollbarWidth : 0),
      height: this.options.itemHeight
    });

    // ตั้งค่า event handlers
    propertyItem.setEditClickHandler(this.handlePropertyEdit.bind(this));
    propertyItem.setDeleteClickHandler(this.handlePropertyDelete.bind(this));

    // เพิ่มเข้าใน collections
    this.properties.set(property.key, propertyItem);
    this.scrollContainer.addChild(propertyItem);

    // อัปเดต layout
    this.updateLayout();

    console.log(`➕ เพิ่ม Property "${property.key}" ลงใน PropertyList`);
  }

  /**
   * ลบ Property
   */
  public removeProperty(key: string): void {
    const propertyItem = this.properties.get(key);
    if (!propertyItem) {
      console.warn(`ไม่พบ Property "${key}" ใน PropertyList`);
      return;
    }

    // ลบจาก collections
    this.properties.delete(key);
    this.scrollContainer.removeChild(propertyItem);
    propertyItem.destroy();

    // อัปเดต layout
    this.updateLayout();

    console.log(`➖ ลบ Property "${key}" จาก PropertyList`);
  }

  /**
   * อัปเดต Property
   */
  public updateProperty(property: PropertyValue): void {
    const propertyItem = this.properties.get(property.key);
    if (!propertyItem) {
      console.warn(`ไม่พบ Property "${property.key}" ใน PropertyList`);
      return;
    }

    propertyItem.updateProperty(property);
    console.log(`🔄 อัปเดต Property "${property.key}" ใน PropertyList`);
  }

  /**
   * แสดง Properties ทั้งหมด
   */
  public renderProperties(properties: PropertyValue[]): void {
    // ล้าง properties เดิม
    this.clearProperties();

    // เพิ่ม properties ใหม่
    properties.forEach(property => {
      this.addProperty(property);
    });

    console.log(`📋 แสดง ${properties.length} Properties ใน PropertyList`);
  }

  /**
   * ล้าง Properties ทั้งหมด
   */
  public clearProperties(): void {
    this.properties.forEach((item) => {
      this.scrollContainer.removeChild(item);
      item.destroy();
    });
    
    this.properties.clear();
    this.scrollPosition = 0;
    this.updateLayout();

    console.log('🧹 ล้าง Properties ทั้งหมดใน PropertyList');
  }

  /**
   * จัดการ Property Edit
   */
  private handlePropertyEdit(property: PropertyValue): void {
    console.log(`✏️ แก้ไข Property: ${property.key}`);
    
    if (this.onPropertyEdit) {
      this.onPropertyEdit(property);
    }

    // ส่ง custom event
    this.dispatchPropertyListEvent('edit', property);
  }

  /**
   * จัดการ Property Delete
   */
  private handlePropertyDelete(property: PropertyValue): void {
    console.log(`🗑️ ลบ Property: ${property.key}`);
    
    if (this.onPropertyDelete) {
      this.onPropertyDelete(property);
    }

    // ส่ง custom event
    this.dispatchPropertyListEvent('delete', property);
  }

  /**
   * ส่ง Custom Event
   */
  private dispatchPropertyListEvent(action: 'edit' | 'delete', property: PropertyValue): void {
    const customEvent = new CustomEvent('property-list-action', {
      detail: {
        action: action,
        property: property,
        list: this
      }
    });
    window.dispatchEvent(customEvent);
  }

  /**
   * ตั้งค่า Property Edit Handler
   */
  public setPropertyEditHandler(handler: (property: PropertyValue) => void): void {
    this.onPropertyEdit = handler;
  }

  /**
   * ตั้งค่า Property Delete Handler
   */
  public setPropertyDeleteHandler(handler: (property: PropertyValue) => void): void {
    this.onPropertyDelete = handler;
  }

  /**
   * ได้จำนวน Properties
   */
  public getPropertyCount(): number {
    return this.properties.size;
  }

  /**
   * ได้ Properties ทั้งหมด
   */
  public getAllProperties(): PropertyValue[] {
    return Array.from(this.properties.values())
      .map(item => item.getProperty())
      .sort((a, b) => a.order - b.order);
  }

  /**
   * ตรวจสอบว่ามี Property หรือไม่
   */
  public hasProperty(key: string): boolean {
    return this.properties.has(key);
  }

  /**
   * Scroll ไปยังตำแหน่งที่กำหนด
   */
  public scrollTo(position: number): void {
    this.scrollPosition = Math.max(0, Math.min(this.maxScrollPosition, position));
    this.updateScrollPosition();
  }

  /**
   * Scroll ไปยัง Property ที่กำหนด
   */
  public scrollToProperty(key: string): void {
    const propertyItem = this.properties.get(key);
    if (!propertyItem) return;

    const targetY = propertyItem.y;
    this.scrollTo(targetY);
  }

  /**
   * ได้ขนาดของ PropertyList
   */
  public getSize(): { width: number; height: number } {
    return {
      width: this.options.width,
      height: this.options.maxHeight
    };
  }

  /**
   * ทำลาย component และ cleanup resources
   */
  public destroy(): void {
    // ลบ event listeners
    document.removeEventListener('pointermove', this.handleScrollbarDrag.bind(this));
    document.removeEventListener('pointerup', this.handleScrollbarRelease.bind(this));

    // ล้าง properties
    this.clearProperties();

    // ทำลาย children
    this.backgroundGraphics?.destroy();
    this.scrollContainer?.destroy();
    this.scrollbarContainer?.destroy();
    this.scrollbarTrack?.destroy();
    this.scrollbarThumb?.destroy();
    this.emptyMessageText?.destroy();
    
    console.log('🗑️ ทำลาย PropertyList');
    
    // เรียก parent destroy
    super.destroy();
  }
}