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
 * Internal state interface for ActionButton
 */
interface ActionButtonState {
  buttonGraphics: Graphics;
  iconGraphics: Graphics;
  buttonType: ActionButtonType;
  options: Required<ActionButtonOptions>;
  isHovered: boolean;
  clickHandler?: (event: FederatedPointerEvent) => void;
}

/**
 * ได้สีไอคอนเริ่มต้นตามประเภทปุ่ม
 */
function getDefaultIconColor(type: ActionButtonType): number {
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
function createButtonGraphics(container: Container, state: ActionButtonState): void {
  state.buttonGraphics = new Graphics();
  container.addChild(state.buttonGraphics);
  drawButton(state);
}

/**
 * วาดปุ่มตามสถานะปัจจุบัน
 */
function drawButton(state: ActionButtonState): void {
  const { size, backgroundColor, borderColor, hoverBackgroundColor } = state.options;
  const radius = size / 2;
  const currentBgColor = state.isHovered ? hoverBackgroundColor : backgroundColor;

  state.buttonGraphics.clear();
  
  // วาดวงกลมพื้นหลัง
  state.buttonGraphics
    .fill(currentBgColor)
    .circle(0, 0, radius)
    .fill();

  // วาดขอบ
  state.buttonGraphics
    .circle(0, 0, radius)
    .stroke({ width: 2, color: borderColor });
}

/**
 * สร้าง Graphics สำหรับไอคอน
 */
function createIconGraphics(container: Container, state: ActionButtonState): void {
  state.iconGraphics = new Graphics();
  container.addChild(state.iconGraphics);
  drawIcon(state);
}

/**
 * วาดไอคอนตามประเภทปุ่ม
 */
function drawIcon(state: ActionButtonState): void {
  const { size, iconColor } = state.options;
  const iconSize = size * 0.4; // ไอคอนมีขนาด 40% ของปุ่ม

  state.iconGraphics.clear();

  switch (state.buttonType) {
    case 'edit':
      drawEditIcon(state.iconGraphics, iconSize, iconColor);
      break;
    case 'delete':
      drawDeleteIcon(state.iconGraphics, iconSize, iconColor);
      break;
  }
}

/**
 * วาดไอคอนดินสอ (Edit)
 */
function drawEditIcon(graphics: Graphics, size: number, color: number): void {
  const halfSize = size / 2;
  
  // วาดดินสอแบบง่ายๆ
  graphics
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
function drawDeleteIcon(graphics: Graphics, size: number, color: number): void {
  const halfSize = size / 2;
  
  // วาดถังขยะแบบง่ายๆ
  graphics
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
function setupEvents(container: Container, state: ActionButtonState): void {
  // ตั้งค่าให้สามารถ interact ได้
  container.eventMode = 'static';
  container.cursor = 'pointer';
  
  // ตั้งค่า hit area เป็นวงกลม
  const radius = state.options.size / 2;
  container.hitArea = new Circle(0, 0, radius);

  // Hover events
  container.on('pointerover', (event: FederatedPointerEvent) => handlePointerOver(container, state, event));
  container.on('pointerout', (event: FederatedPointerEvent) => handlePointerOut(container, state, event));

  // Click event
  container.on('pointerdown', (event: FederatedPointerEvent) => handleClick(state, event));
}

/**
 * จัดการ Pointer Over Event (Hover เข้า)
 */
function handlePointerOver(container: Container, state: ActionButtonState, event: FederatedPointerEvent): void {
  event.stopPropagation();
  
  if (!state.isHovered) {
    state.isHovered = true;
    animateHoverIn(container, state);
  }
}

/**
 * จัดการ Pointer Out Event (Hover ออก)
 */
function handlePointerOut(container: Container, state: ActionButtonState, event: FederatedPointerEvent): void {
  event.stopPropagation();
  
  if (state.isHovered) {
    state.isHovered = false;
    animateHoverOut(container, state);
  }
}

/**
 * จัดการ Click Event
 */
function handleClick(state: ActionButtonState, event: FederatedPointerEvent): void {
  event.stopPropagation();
  
  // เรียก click handler ถ้ามี
  if (state.clickHandler) {
    state.clickHandler(event);
  }

  console.log(`🖱️ คลิก ActionButton ประเภท: ${state.buttonType}`);
}

/**
 * Animation สำหรับ Hover เข้า
 */
function animateHoverIn(container: Container, state: ActionButtonState): void {
  // วาดปุ่มใหม่ด้วยสี hover
  drawButton(state);
  
  // Scale animation
  const targetScale = state.options.hoverScale;
  const duration = 150;
  const startScale = container.scale.x;
  const startTime = Date.now();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out animation
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentScale = startScale + (targetScale - startScale) * easeProgress;
    
    container.scale.set(currentScale);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  animate();
}

/**
 * Animation สำหรับ Hover ออก
 */
function animateHoverOut(container: Container, state: ActionButtonState): void {
  // วาดปุ่มใหม่ด้วยสีปกติ
  drawButton(state);
  
  // Scale animation กลับ
  const targetScale = 1.0;
  const duration = 150;
  const startScale = container.scale.x;
  const startTime = Date.now();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out animation
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentScale = startScale + (targetScale - startScale) * easeProgress;
    
    container.scale.set(currentScale);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  animate();
}

/**
 * Function-based ActionButton factory
 * สร้าง ActionButton พร้อม internal state และ methods
 */
export function createActionButton(type: ActionButtonType, options: ActionButtonOptions = {}): Container & {
  getButtonType: () => ActionButtonType;
  setClickHandler: (handler: (event: FederatedPointerEvent) => void) => void;
  destroy: () => void;
} {
  const container = new Container();
  
  // สร้าง state สำหรับ button
  const state: ActionButtonState = {
    buttonGraphics: new Graphics(),
    iconGraphics: new Graphics(),
    buttonType: type,
    options: {
      size: 32,
      backgroundColor: 0xffffff,
      borderColor: 0x666666,
      iconColor: getDefaultIconColor(type),
      hoverBackgroundColor: 0xf0f0f0,
      hoverScale: 1.1,
      ...options
    },
    isHovered: false,
    clickHandler: undefined
  };

  // สร้าง graphics components
  createButtonGraphics(container, state);
  createIconGraphics(container, state);
  setupEvents(container, state);

  console.log(`🔘 สร้าง ActionButton ประเภท: ${type}`);

  // เพิ่ม methods ให้กับ container
  return Object.assign(container, {
    getButtonType: () => state.buttonType,
    
    setClickHandler: (handler: (event: FederatedPointerEvent) => void) => {
      state.clickHandler = handler;
    },
    
    destroy: () => {
      // ลบ children และ destroy graphics
      state.buttonGraphics?.destroy();
      state.iconGraphics?.destroy();
      
      console.log(`🗑️ ทำลาย ActionButton ประเภท: ${state.buttonType}`);
      
      // เรียก parent destroy
      container.destroy();
    }
  });
}

/**
 * ปุ่มสำหรับการดำเนินการต่างๆ (Edit, Delete)
 * แสดงเป็นวงกลมพร้อมไอคอนและมี hover effects
 * 
 * @deprecated ใช้ createActionButton แทน - function-based approach
 */
export class ActionButton extends Container {
  private buttonGraphics!: Graphics;
  private iconGraphics!: Graphics;
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
      iconColor: getDefaultIconColor(type),
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
    return getDefaultIconColor(type);
  }

  /**
   * สร้าง Graphics สำหรับปุ่ม (วงกลมพื้นหลัง)
   */
  private createButtonGraphics(): void {
    const state = this.getState();
    createButtonGraphics(this, state);
    this.buttonGraphics = state.buttonGraphics;
  }

  /**
   * วาดปุ่มตามสถานะปัจจุบัน
   */
  private drawButton(): void {
    const state = this.getState();
    drawButton(state);
  }

  /**
   * สร้าง Graphics สำหรับไอคอน
   */
  private createIconGraphics(): void {
    const state = this.getState();
    createIconGraphics(this, state);
    this.iconGraphics = state.iconGraphics;
  }

  /**
   * วาดไอคอนตามประเภทปุ่ม
   */
  private drawIcon(): void {
    const state = this.getState();
    drawIcon(state);
  }

  /**
   * ได้ state object สำหรับ function calls
   */
  private getState(): ActionButtonState {
    return {
      buttonGraphics: this.buttonGraphics,
      iconGraphics: this.iconGraphics,
      buttonType: this.buttonType,
      options: this.options,
      isHovered: this.isHovered,
      clickHandler: this.clickHandler
    };
  }

  /**
   * ตั้งค่า Event Handlers
   */
  private setupEvents(): void {
    const state = this.getState();
    setupEvents(this, state);
  }

  /**
   * จัดการ Pointer Over Event (Hover เข้า)
   */
  private handlePointerOver(event: FederatedPointerEvent): void {
    const state = this.getState();
    handlePointerOver(this, state, event);
    this.isHovered = state.isHovered;
  }

  /**
   * จัดการ Pointer Out Event (Hover ออก)
   */
  private handlePointerOut(event: FederatedPointerEvent): void {
    const state = this.getState();
    handlePointerOut(this, state, event);
    this.isHovered = state.isHovered;
  }

  /**
   * จัดการ Click Event
   */
  private handleClick(event: FederatedPointerEvent): void {
    const state = this.getState();
    handleClick(state, event);
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
    const state = this.getState();
    animateHoverIn(this, state);
  }

  /**
   * Animation สำหรับ Hover ออก
   */
  private animateHoverOut(): void {
    const state = this.getState();
    animateHoverOut(this, state);
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