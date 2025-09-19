// src/components/CollapseExpandButton.ts

import { Container, Graphics, Text, FederatedPointerEvent, Circle } from 'pixi.js';
import { nodeStateManager } from '../utils/nodeStateManager';

/**
 * ตัวเลือกสำหรับการสร้าง CollapseExpandButton
 */
export interface CollapseExpandButtonOptions {
  size?: number;                                    // ขนาดของปุ่ม (default: 24)
  position?: 'top-right' | 'top-left';             // ตำแหน่งของปุ่ม (default: 'top-right')
  expandedIcon?: string;                            // ไอคอนสำหรับสถานะ expanded (default: '▼')
  collapsedIcon?: string;                           // ไอคอนสำหรับสถานะ collapsed (default: '▶')
  backgroundColor?: number;                         // สีพื้นหลังของปุ่ม (default: 0xffffff)
  borderColor?: number;                             // สีขอบของปุ่ม (default: 0x666666)
  iconColor?: number;                               // สีของไอคอน (default: 0x333333)
  hoverBackgroundColor?: number;                    // สีพื้นหลังเมื่อ hover (default: 0xf0f0f0)
  offset?: { x: number; y: number };               // ระยะห่างจากขอบ node (default: { x: -8, y: 8 })
}

/**
 * ปุ่มสำหรับ toggle การ collapse/expand ของ Node
 * แสดงในมุมบนขวาของ Node และมี hover effects
 */
export class CollapseExpandButton extends Container {
  private buttonGraphics: Graphics;
  private iconText: Text;
  private targetNode: Container;
  private options: Required<CollapseExpandButtonOptions>;
  private isHovered: boolean = false;
  private isCollapsed: boolean = false;

  constructor(targetNode: Container, options: CollapseExpandButtonOptions = {}) {
    super();

    this.targetNode = targetNode;
    
    // ตั้งค่า default options
    this.options = {
      size: 24,
      position: 'top-right',
      expandedIcon: '▼',
      collapsedIcon: '▶',
      backgroundColor: 0xffffff,
      borderColor: 0x666666,
      iconColor: 0x333333,
      hoverBackgroundColor: 0xf0f0f0,
      offset: { x: -8, y: 8 },
      ...options
    };

    this.createButtonGraphics();
    this.createIconText();
    this.setupEvents();
    this.updatePosition();
    this.updateVisualState();

    console.log('🔘 สร้าง CollapseExpandButton สำหรับ Node:', targetNode);
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
      .stroke({ width: 1, color: borderColor });
  }

  /**
   * สร้าง Text สำหรับไอคอน
   */
  private createIconText(): void {
    this.iconText = new Text({
      text: this.options.expandedIcon,
      style: {
        fontSize: this.options.size * 0.6,
        fill: this.options.iconColor,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold'
      }
    });

    // จัดให้อยู่กึ่งกลางปุ่ม
    this.iconText.anchor.set(0.5);
    this.addChild(this.iconText);
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

    // Click event - toggle collapse/expand
    this.on('pointerdown', this.handleClick.bind(this));

    // Hover events
    this.on('pointerover', this.handlePointerOver.bind(this));
    this.on('pointerout', this.handlePointerOut.bind(this));

    // ฟัง event การเปลี่ยนแปลงสถานะของ Node
    window.addEventListener('node-state-changed', this.handleNodeStateChange.bind(this));
  }

  /**
   * จัดการ Click Event
   */
  private handleClick(event: FederatedPointerEvent): void {
    event.stopPropagation();
    
    // Toggle collapse state ผ่าน NodeStateManager
    const newState = nodeStateManager.toggleCollapse(this.targetNode);
    
    if (newState !== null) {
      console.log(`🔄 Toggle Node collapse state เป็น: ${newState ? 'collapsed' : 'expanded'}`);
      
      // อัปเดต visual state
      this.isCollapsed = newState;
      this.updateVisualState();
      
      // ส่ง custom event สำหรับ components อื่นๆ
      this.dispatchCollapseEvent(newState);
    }
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
   * จัดการ Node State Change Event
   */
  private handleNodeStateChange(event: CustomEvent): void {
    const { node, changeType } = event.detail;
    
    // ตรวจสอบว่าเป็น event ของ Node ที่เราดูแลหรือไม่
    if (node === this.targetNode && changeType === 'collapse') {
      const { isCollapsed } = event.detail;
      this.isCollapsed = isCollapsed;
      this.updateVisualState();
    }
  }

  /**
   * อัปเดตสถานะ visual ของปุ่ม
   */
  private updateVisualState(): void {
    const icon = this.isCollapsed ? this.options.collapsedIcon : this.options.expandedIcon;
    this.iconText.text = icon;
    
    console.log(`🎨 อัปเดต CollapseExpandButton icon เป็น: ${icon}`);
  }

  /**
   * อัปเดตตำแหน่งของปุ่มตาม Node
   */
  private updatePosition(): void {
    // ได้ bounds ของ target node
    const bounds = this.targetNode.getBounds();
    const { position, offset, size } = this.options;
    const radius = size / 2;

    let x: number, y: number;

    switch (position) {
      case 'top-left':
        x = bounds.x + offset.x + radius;
        y = bounds.y + offset.y + radius;
        break;
      case 'top-right':
      default:
        x = bounds.x + bounds.width + offset.x - radius;
        y = bounds.y + offset.y + radius;
        break;
    }

    this.x = x;
    this.y = y;
  }

  /**
   * Animation สำหรับ Hover เข้า
   */
  private animateHoverIn(): void {
    // วาดปุ่มใหม่ด้วยสี hover
    this.drawButton();
    
    // Scale animation
    const targetScale = 1.1;
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
   * ส่ง Custom Event เมื่อมีการ collapse/expand
   */
  private dispatchCollapseEvent(isCollapsed: boolean): void {
    const event = new CustomEvent('node-collapse-toggled', {
      detail: {
        node: this.targetNode,
        isCollapsed: isCollapsed,
        button: this
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * อัปเดตตำแหน่งปุ่ม (เรียกเมื่อ Node เปลี่ยนขนาดหรือตำแหน่ง)
   */
  public updateButtonPosition(): void {
    this.updatePosition();
  }

  /**
   * ตั้งค่าสถานะ collapsed โดยตรง (ไม่ trigger event)
   */
  public setCollapsedState(collapsed: boolean): void {
    this.isCollapsed = collapsed;
    this.updateVisualState();
  }

  /**
   * ได้สถานะ collapsed ปัจจุบัน
   */
  public getCollapsedState(): boolean {
    return this.isCollapsed;
  }

  /**
   * ทำลาย component และ cleanup resources
   */
  public destroy(): void {
    // ลบ event listeners
    window.removeEventListener('node-state-changed', this.handleNodeStateChange.bind(this));
    
    // ลบ children และ destroy graphics
    this.buttonGraphics?.destroy();
    this.iconText?.destroy();
    
    console.log('🗑️ ทำลาย CollapseExpandButton');
    
    // เรียก parent destroy
    super.destroy();
  }
}

/**
 * Factory function สำหรับสร้าง CollapseExpandButton
 * @param targetNode - Node ที่ต้องการเพิ่มปุ่ม collapse/expand
 * @param options - ตัวเลือกสำหรับการสร้างปุ่ม
 * @returns CollapseExpandButton instance
 */
export function createCollapseExpandButton(
  targetNode: Container, 
  options?: CollapseExpandButtonOptions
): CollapseExpandButton {
  return new CollapseExpandButton(targetNode, options);
}