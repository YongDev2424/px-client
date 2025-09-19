// src/components/PropertyContainer.ts

import { Container, Graphics, Text, FederatedPointerEvent } from 'pixi.js';
import { PropertyValue, nodeStateManager } from '../utils/nodeStateManager';
import { PropertyList } from './PropertyList';
import { PropertyEditor } from './PropertyEditor';
import { ActionButton } from './ActionButton';

/**
 * ตัวเลือกสำหรับการสร้าง PropertyContainer
 */
export interface PropertyContainerOptions {
  width?: number;                    // ความกว้างของ container (default: 200)
  maxHeight?: number;               // ความสูงสูงสุด (default: 200)
  backgroundColor?: number;         // สีพื้นหลัง (default: 0x1a1a1a)
  borderColor?: number;             // สีขอบ (default: 0x555555)
  headerColor?: number;             // สีพื้นหลัง header (default: 0x2a2a2a)
  textColor?: number;               // สีข้อความ (default: 0xffffff)
  maxVisibleProperties?: number;    // จำนวน properties สูงสุดที่แสดงโดยไม่ต้อง scroll (default: 5)
  enableScrolling?: boolean;        // เปิดใช้งาน scrolling หรือไม่ (default: true)
  propertyHeight?: number;          // ความสูงของแต่ละ property (default: 24)
  headerHeight?: number;            // ความสูงของ header (default: 32)
  padding?: number;                 // ระยะห่างภายใน (default: 8)
  showAddButton?: boolean;          // แสดงปุ่มเพิ่ม property หรือไม่ (default: true)
  showPropertyCount?: boolean;      // แสดงจำนวน properties หรือไม่ (default: true)
  collapsedIndicatorText?: string;  // ข้อความแสดงใน collapsed view (default: 'Properties')
}

/**
 * Container หลักสำหรับจัดการ Properties ของ Node
 * ประกอบด้วย PropertyList, PropertyEditor และ controls ต่างๆ
 */
export class PropertyContainer extends Container {
  private targetNode: Container;
  private options: Required<PropertyContainerOptions>;
  private backgroundGraphics: Graphics;
  private headerGraphics: Graphics;
  private headerText: Text;
  private propertyCountText: Text;
  private addButton: ActionButton;
  private propertyList: PropertyList;
  private propertyEditor: PropertyEditor;
  private collapsedIndicator: Container;
  private collapsedText: Text;
  private collapsedCountBadge: Graphics;
  private collapsedCountText: Text;
  
  private isCollapsed: boolean = false;
  private isEditMode: boolean = false;
  private currentHeight: number = 0;

  constructor(targetNode: Container, options: PropertyContainerOptions = {}) {
    super();

    this.targetNode = targetNode;
    
    // ตั้งค่า default options
    this.options = {
      width: 200,
      maxHeight: 200,
      backgroundColor: 0x1a1a1a,
      borderColor: 0x555555,
      headerColor: 0x2a2a2a,
      textColor: 0xffffff,
      maxVisibleProperties: 5,
      enableScrolling: true,
      propertyHeight: 24,
      headerHeight: 32,
      padding: 8,
      showAddButton: true,
      showPropertyCount: true,
      collapsedIndicatorText: 'Properties',
      ...options
    };

    this.createBackground();
    this.createHeader();
    this.createPropertyList();
    this.createPropertyEditor();
    this.createCollapsedIndicator();
    this.setupEvents();
    this.updateLayout();
    this.syncWithNodeState();

    console.log('📦 สร้าง PropertyContainer สำหรับ Node:', targetNode);
  }

  /**
   * สร้างพื้นหลังของ PropertyContainer
   */
  private createBackground(): void {
    this.backgroundGraphics = new Graphics();
    this.addChild(this.backgroundGraphics);
  }

  /**
   * วาดพื้นหลัง
   */
  private drawBackground(): void {
    const { width, backgroundColor, borderColor } = this.options;

    this.backgroundGraphics.clear();
    
    // วาดพื้นหลัง
    this.backgroundGraphics
      .fill(backgroundColor)
      .rect(0, 0, width, this.currentHeight)
      .fill();

    // วาดขอบ
    this.backgroundGraphics
      .rect(0, 0, width, this.currentHeight)
      .stroke({ width: 2, color: borderColor });
  }

  /**
   * สร้าง Header พร้อมชื่อและปุ่มเพิ่ม
   */
  private createHeader(): void {
    const { width, headerHeight, headerColor, textColor, padding, showAddButton } = this.options;

    // สร้างพื้นหลัง header
    this.headerGraphics = new Graphics();
    this.addChild(this.headerGraphics);

    this.headerGraphics
      .fill(headerColor)
      .rect(0, 0, width, headerHeight)
      .fill()
      .rect(0, 0, width, headerHeight)
      .stroke({ width: 1, color: 0x444444 });

    // สร้างข้อความ header
    this.headerText = new Text({
      text: 'Properties',
      style: {
        fontSize: 14,
        fill: textColor,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold'
      }
    });

    this.headerText.x = padding;
    this.headerText.y = (headerHeight - this.headerText.height) / 2;
    this.addChild(this.headerText);

    // สร้างข้อความจำนวน properties
    this.propertyCountText = new Text({
      text: '(0)',
      style: {
        fontSize: 12,
        fill: 0x888888,
        fontFamily: 'Arial, sans-serif'
      }
    });

    this.propertyCountText.x = this.headerText.x + this.headerText.width + 4;
    this.propertyCountText.y = (headerHeight - this.propertyCountText.height) / 2;
    this.addChild(this.propertyCountText);

    // สร้างปุ่มเพิ่ม property
    if (showAddButton) {
      this.addButton = new ActionButton('edit', { // ใช้ edit icon สำหรับ add
        size: 20,
        backgroundColor: 0x007AFF,
        borderColor: 0x0056CC,
        iconColor: 0xffffff,
        hoverBackgroundColor: 0x0056CC,
        hoverScale: 1.1
      });

      this.addButton.x = width - padding - 10;
      this.addButton.y = headerHeight / 2;
      this.addButton.setClickHandler(this.handleAddButtonClick.bind(this));
      this.addChild(this.addButton);
    }
  }

  /**
   * สร้าง PropertyList
   */
  private createPropertyList(): void {
    const { width, maxHeight, headerHeight, propertyHeight, maxVisibleProperties, enableScrolling } = this.options;
    
    const listMaxHeight = Math.min(
      maxHeight - headerHeight,
      propertyHeight * maxVisibleProperties
    );

    this.propertyList = new PropertyList({
      width: width,
      maxHeight: listMaxHeight,
      itemHeight: propertyHeight,
      showScrollbar: enableScrolling
    });

    this.propertyList.x = 0;
    this.propertyList.y = headerHeight;
    this.propertyList.setPropertyEditHandler(this.handlePropertyEdit.bind(this));
    this.propertyList.setPropertyDeleteHandler(this.handlePropertyDelete.bind(this));
    this.addChild(this.propertyList);
  }

  /**
   * สร้าง PropertyEditor
   */
  private createPropertyEditor(): void {
    const { width } = this.options;

    this.propertyEditor = new PropertyEditor({
      width: width - 4,
      height: 80
    });

    this.propertyEditor.x = 2;
    this.propertyEditor.y = this.options.headerHeight + 2;
    this.propertyEditor.setSaveHandler(this.handlePropertySave.bind(this));
    this.propertyEditor.setCancelHandler(this.handlePropertyCancel.bind(this));
    this.propertyEditor.setValidationErrorHandler(this.handleValidationError.bind(this));
    this.addChild(this.propertyEditor);
  }

  /**
   * สร้าง Collapsed Indicator
   */
  private createCollapsedIndicator(): void {
    const { width, headerHeight, textColor, collapsedIndicatorText } = this.options;

    this.collapsedIndicator = new Container();
    this.addChild(this.collapsedIndicator);

    // ข้อความ collapsed
    this.collapsedText = new Text({
      text: collapsedIndicatorText,
      style: {
        fontSize: 12,
        fill: textColor,
        fontFamily: 'Arial, sans-serif'
      }
    });

    this.collapsedText.x = 8;
    this.collapsedText.y = (headerHeight - this.collapsedText.height) / 2;
    this.collapsedIndicator.addChild(this.collapsedText);

    // Property count badge
    this.collapsedCountBadge = new Graphics();
    this.collapsedIndicator.addChild(this.collapsedCountBadge);

    this.collapsedCountText = new Text({
      text: '0',
      style: {
        fontSize: 10,
        fill: 0xffffff,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold'
      }
    });

    this.collapsedIndicator.addChild(this.collapsedCountText);

    // ซ่อน collapsed indicator เริ่มต้น
    this.collapsedIndicator.visible = false;
  }

  /**
   * วาด Property Count Badge
   */
  private drawPropertyCountBadge(count: number): void {
    const badgeSize = 16;
    const badgeX = this.options.width - this.options.padding - badgeSize;
    const badgeY = (this.options.headerHeight - badgeSize) / 2;

    this.collapsedCountBadge.clear();
    
    if (count > 0) {
      // วาดวงกลมสำหรับ badge
      this.collapsedCountBadge
        .fill(0x007AFF)
        .circle(badgeX + badgeSize/2, badgeY + badgeSize/2, badgeSize/2)
        .fill();

      // อัปเดตข้อความจำนวน
      this.collapsedCountText.text = count.toString();
      this.collapsedCountText.x = badgeX + (badgeSize - this.collapsedCountText.width) / 2;
      this.collapsedCountText.y = badgeY + (badgeSize - this.collapsedCountText.height) / 2;
      this.collapsedCountText.visible = true;
    } else {
      this.collapsedCountText.visible = false;
    }
  }

  /**
   * ตั้งค่า Events
   */
  private setupEvents(): void {
    // ฟัง node state changes
    window.addEventListener('node-state-changed', this.handleNodeStateChange.bind(this));
  }

  /**
   * จัดการ Node State Change
   */
  private handleNodeStateChange(event: CustomEvent): void {
    if (event.detail.node !== this.targetNode) return;

    const { changeType } = event.detail;

    switch (changeType) {
      case 'collapse':
        this.setCollapsed(event.detail.isCollapsed);
        break;
      case 'editing':
        this.setEditMode(event.detail.isEditing);
        break;
      case 'property-added':
      case 'property-removed':
      case 'property-updated':
        this.syncWithNodeState();
        break;
    }
  }

  /**
   * จัดการ Add Button Click
   */
  private handleAddButtonClick(): void {
    console.log('➕ เพิ่ม Property ใหม่');
    this.propertyEditor.showForNew();
  }

  /**
   * จัดการ Property Edit
   */
  private handlePropertyEdit(property: PropertyValue): void {
    console.log(`✏️ แก้ไข Property: ${property.key}`);
    this.propertyEditor.showForEdit(property);
  }

  /**
   * จัดการ Property Delete
   */
  private handlePropertyDelete(property: PropertyValue): void {
    console.log(`🗑️ ลบ Property: ${property.key}`);
    
    // ยืนยันการลบ
    const confirmed = confirm(`Are you sure you want to delete property "${property.key}"?`);
    if (confirmed) {
      nodeStateManager.removeProperty(this.targetNode, property.key);
    }
  }

  /**
   * จัดการ Property Save
   */
  private handlePropertySave(property: PropertyValue, isNew: boolean): void {
    console.log(`💾 บันทึก Property: ${property.key} = ${property.value} (${isNew ? 'ใหม่' : 'แก้ไข'})`);
    
    if (isNew) {
      // ตรวจสอบ key ซ้ำ
      if (nodeStateManager.hasProperty(this.targetNode, property.key)) {
        this.handleValidationError(`Property key "${property.key}" already exists`);
        return;
      }
      
      nodeStateManager.addProperty(this.targetNode, property);
    } else {
      nodeStateManager.updateProperty(this.targetNode, property.key, property.value, property.type);
    }
  }

  /**
   * จัดการ Property Cancel
   */
  private handlePropertyCancel(): void {
    console.log('❌ ยกเลิกการแก้ไข Property');
  }

  /**
   * จัดการ Validation Error
   */
  private handleValidationError(error: string): void {
    console.warn('❌ Validation Error:', error);
    // ในการใช้งานจริงอาจแสดง toast notification หรือ error message
    alert(`Validation Error: ${error}`);
  }

  /**
   * ซิงค์ข้อมูลกับ NodeStateManager
   */
  private syncWithNodeState(): void {
    const properties = nodeStateManager.getProperties(this.targetNode);
    this.propertyList.renderProperties(properties);
    this.updatePropertyCount(properties.length);
    this.updateLayout();
  }

  /**
   * อัปเดตจำนวน Properties
   */
  private updatePropertyCount(count: number): void {
    if (this.options.showPropertyCount) {
      this.propertyCountText.text = `(${count})`;
      this.propertyCountText.x = this.headerText.x + this.headerText.width + 4;
    }

    // อัปเดต collapsed badge
    this.drawPropertyCountBadge(count);
  }

  /**
   * อัปเดต Layout
   */
  private updateLayout(): void {
    const { headerHeight, propertyHeight, padding } = this.options;
    const propertyCount = this.propertyList.getPropertyCount();
    
    if (this.isCollapsed) {
      // Collapsed view - แสดงเฉพาะ header
      this.currentHeight = headerHeight;
      this.propertyList.visible = false;
      this.propertyEditor.visible = false;
      this.collapsedIndicator.visible = true;
      this.headerText.visible = false;
      this.propertyCountText.visible = false;
      this.addButton.visible = false;
    } else {
      // Expanded view
      this.collapsedIndicator.visible = false;
      this.headerText.visible = true;
      this.propertyCountText.visible = this.options.showPropertyCount;
      this.addButton.visible = this.options.showAddButton;
      
      if (this.isEditMode && this.propertyEditor.isVisible()) {
        // Edit mode - แสดง editor
        this.propertyList.visible = false;
        this.propertyEditor.visible = true;
        this.currentHeight = headerHeight + this.propertyEditor.getSize().height + padding;
      } else {
        // Normal view - แสดง property list
        this.propertyList.visible = true;
        this.propertyEditor.visible = false;
        
        const listHeight = Math.min(
          propertyCount * propertyHeight,
          this.propertyList.getSize().height
        );
        this.currentHeight = headerHeight + listHeight + padding;
      }
    }

    this.drawBackground();
  }

  /**
   * ตั้งค่าสถานะ collapsed
   */
  public setCollapsed(collapsed: boolean): void {
    if (this.isCollapsed === collapsed) return;

    this.isCollapsed = collapsed;
    this.updateLayout();

    console.log(`📦 PropertyContainer ${collapsed ? 'collapsed' : 'expanded'}`);
  }

  /**
   * ตั้งค่าสถานะ edit mode
   */
  public setEditMode(editMode: boolean): void {
    if (this.isEditMode === editMode) return;

    this.isEditMode = editMode;
    
    if (!editMode && this.propertyEditor.isVisible()) {
      this.propertyEditor.hide();
    }
    
    this.updateLayout();

    console.log(`📝 PropertyContainer ${editMode ? 'เข้าสู่' : 'ออกจาก'} edit mode`);
  }

  /**
   * เพิ่ม Property ใหม่
   */
  public addProperty(property: PropertyValue): void {
    nodeStateManager.addProperty(this.targetNode, property);
  }

  /**
   * ลบ Property
   */
  public removeProperty(key: string): void {
    nodeStateManager.removeProperty(this.targetNode, key);
  }

  /**
   * อัปเดต Property
   */
  public updateProperty(key: string, newValue: string, newType?: PropertyValue['type']): void {
    nodeStateManager.updateProperty(this.targetNode, key, newValue, newType);
  }

  /**
   * ได้ Properties ทั้งหมด
   */
  public getProperties(): PropertyValue[] {
    return nodeStateManager.getProperties(this.targetNode);
  }

  /**
   * ได้จำนวน Properties
   */
  public getPropertyCount(): number {
    return nodeStateManager.getPropertyCount(this.targetNode);
  }

  /**
   * ตรวจสอบว่าอยู่ในสถานะ collapsed หรือไม่
   */
  public isCollapsedState(): boolean {
    return this.isCollapsed;
  }

  /**
   * ตรวจสอบว่าอยู่ในสถานะ edit mode หรือไม่
   */
  public isEditModeState(): boolean {
    return this.isEditMode;
  }

  /**
   * ได้ target node
   */
  public getTargetNode(): Container {
    return this.targetNode;
  }

  /**
   * ได้ขนาดปัจจุบันของ PropertyContainer
   */
  public getCurrentSize(): { width: number; height: number } {
    return {
      width: this.options.width,
      height: this.currentHeight
    };
  }

  /**
   * ทำลาย component และ cleanup resources
   */
  public destroy(): void {
    // ลบ event listeners
    window.removeEventListener('node-state-changed', this.handleNodeStateChange.bind(this));

    // ทำลาย children
    this.backgroundGraphics?.destroy();
    this.headerGraphics?.destroy();
    this.headerText?.destroy();
    this.propertyCountText?.destroy();
    this.addButton?.destroy();
    this.propertyList?.destroy();
    this.propertyEditor?.destroy();
    this.collapsedIndicator?.destroy();
    this.collapsedText?.destroy();
    this.collapsedCountBadge?.destroy();
    this.collapsedCountText?.destroy();
    
    console.log('🗑️ ทำลาย PropertyContainer');
    
    // เรียก parent destroy
    super.destroy();
  }
}

/**
 * Factory function สำหรับสร้าง PropertyContainer
 * @param targetNode - Node ที่ต้องการเพิ่ม property management
 * @param options - ตัวเลือกสำหรับการสร้าง container
 * @returns PropertyContainer instance
 */
export function createPropertyContainer(
  targetNode: Container, 
  options?: PropertyContainerOptions
): PropertyContainer {
  return new PropertyContainer(targetNode, options);
}