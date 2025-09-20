// src/components/ActionButtonsContainer.ts

import { Container, FederatedPointerEvent } from 'pixi.js';
import { createActionButton, type ActionButtonType } from './ActionButton';
import { useNodeActions } from '../composables';

/**
 * ตัวเลือกสำหรับการสร้าง ActionButtonsContainer
 */
export interface ActionButtonsContainerOptions {
  buttonSize?: number;                          // ขนาดของปุ่ม (default: 32)
  spacing?: number;                             // ระยะห่างระหว่างปุ่ม (default: 8)
  position?: 'top' | 'bottom' | 'right';       // ตำแหน่งของปุ่มเทียบกับ node (default: 'top')
  showAnimation?: boolean;                      // เปิดใช้งาน animation หรือไม่ (default: true)
  offset?: { x: number; y: number };           // ระยะห่างจากขอบ node (default: { x: 0, y: -16 })
  animationDuration?: number;                   // ระยะเวลา animation (default: 200)
}

/**
 * Internal state interface for ActionButtonsContainer
 */
interface ActionButtonsContainerState {
  editButton: ReturnType<typeof createActionButton>;
  deleteButton: ReturnType<typeof createActionButton>;
  targetNode: Container;
  options: Required<ActionButtonsContainerOptions>;
  isVisible: boolean;
  isAnimating: boolean;
  onEditClick?: (node: Container, event: FederatedPointerEvent) => void;
  onDeleteClick?: (node: Container, event: FederatedPointerEvent) => void;
}

/**
 * สร้างปุ่ม Edit และ Delete
 */
function createButtons(container: Container, state: ActionButtonsContainerState): void {
  // สร้างปุ่ม Edit
  state.editButton = createActionButton('edit', {
    size: state.options.buttonSize,
    hoverScale: 1.1
  });

  // สร้างปุ่ม Delete
  state.deleteButton = createActionButton('delete', {
    size: state.options.buttonSize,
    hoverScale: 1.1
  });

  // ตั้งค่า click handlers
  state.editButton.setClickHandler((event) => handleEditClick(state, event));
  state.deleteButton.setClickHandler((event) => handleDeleteClick(state, event));

  // เพิ่มปุ่มเข้าใน container
  container.addChild(state.editButton);
  container.addChild(state.deleteButton);
}

/**
 * จัดตำแหน่งปุ่มตาม options
 */
function positionButtons(container: Container, state: ActionButtonsContainerState): void {
  const { buttonSize, spacing, position } = state.options;
  const totalWidth = (buttonSize * 2) + spacing;
  const halfWidth = totalWidth / 2;

  switch (position) {
    case 'top':
    case 'bottom':
      // จัดเรียงแนวนอน
      state.editButton.x = -halfWidth + (buttonSize / 2);
      state.editButton.y = 0;
      
      state.deleteButton.x = -halfWidth + buttonSize + spacing + (buttonSize / 2);
      state.deleteButton.y = 0;
      break;

    case 'right':
      // จัดเรียงแนวตั้ง
      state.editButton.x = 0;
      state.editButton.y = -halfWidth + (buttonSize / 2);
      
      state.deleteButton.x = 0;
      state.deleteButton.y = -halfWidth + buttonSize + spacing + (buttonSize / 2);
      break;
  }

  // อัปเดตตำแหน่งของ container เทียบกับ target node
  updateContainerPosition(container, state);
}

/**
 * อัปเดตตำแหน่งของ container เทียบกับ target node
 */
function updateContainerPosition(container: Container, state: ActionButtonsContainerState): void {
  const bounds = state.targetNode.getBounds();
  const { position, offset } = state.options;

  let x: number, y: number;

  switch (position) {
    case 'top':
      x = bounds.x + (bounds.width / 2) + offset.x;
      y = bounds.y + offset.y;
      break;
    case 'bottom':
      x = bounds.x + (bounds.width / 2) + offset.x;
      y = bounds.y + bounds.height - offset.y;
      break;
    case 'right':
      x = bounds.x + bounds.width - offset.x;
      y = bounds.y + (bounds.height / 2) + offset.y;
      break;
  }

  container.x = x;
  container.y = y;
}

/**
 * ตั้งค่าสถานะเริ่มต้น (ซ่อนอยู่)
 */
function setupInitialState(container: Container, state: ActionButtonsContainerState): void {
  container.visible = false;
  container.alpha = 0;
  container.scale.set(0.8); // เริ่มต้นด้วยขนาดเล็กกว่าปกติ
  state.isVisible = false;
  state.isAnimating = false;
}

/**
 * แสดงปุ่มพร้อม animation
 */
async function showButtons(container: Container, state: ActionButtonsContainerState, animated: boolean = true): Promise<void> {
  if (state.isVisible || state.isAnimating) {
    return;
  }

  state.isVisible = true;
  container.visible = true;

  // อัปเดตตำแหน่งก่อนแสดง
  updateContainerPosition(container, state);

  if (!animated || !state.options.showAnimation) {
    // แสดงทันทีไม่มี animation
    container.alpha = 1;
    container.scale.set(1);
    return;
  }

  // แสดงด้วย animation
  return new Promise<void>((resolve) => {
    state.isAnimating = true;
    const duration = state.options.animationDuration;
    const startTime = Date.now();
    const startAlpha = container.alpha;
    const startScale = container.scale.x;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      // Fade in
      container.alpha = startAlpha + (1 - startAlpha) * easeProgress;
      
      // Scale up
      const targetScale = 1;
      container.scale.set(startScale + (targetScale - startScale) * easeProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        state.isAnimating = false;
        resolve();
      }
    };

    animate();
  });
}

/**
 * ซ่อนปุ่มพร้อม animation
 */
async function hideButtons(container: Container, state: ActionButtonsContainerState, animated: boolean = true): Promise<void> {
  if (!state.isVisible || state.isAnimating) {
    return;
  }

  state.isVisible = false;

  if (!animated || !state.options.showAnimation) {
    // ซ่อนทันทีไม่มี animation
    container.visible = false;
    container.alpha = 0;
    container.scale.set(0.8);
    return;
  }

  // ซ่อนด้วย animation
  return new Promise<void>((resolve) => {
    state.isAnimating = true;
    const duration = state.options.animationDuration;
    const startTime = Date.now();
    const startAlpha = container.alpha;
    const startScale = container.scale.x;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-in animation
      const easeProgress = Math.pow(progress, 3);
      
      // Fade out
      container.alpha = startAlpha * (1 - easeProgress);
      
      // Scale down
      const targetScale = 0.8;
      container.scale.set(startScale + (targetScale - startScale) * easeProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        container.visible = false;
        state.isAnimating = false;
        resolve();
      }
    };

    animate();
  });
}

/**
 * จัดการ Edit Button Click
 */
function handleEditClick(state: ActionButtonsContainerState, event: FederatedPointerEvent): void {
  console.log('✏️ คลิกปุ่ม Edit สำหรับ Node:', state.targetNode);
  
  // เรียก external handler ถ้ามี
  if (state.onEditClick) {
    state.onEditClick(state.targetNode, event);
  }

  // ตั้งค่าสถานะ editing ใน NodeActions
  const nodeActions = useNodeActions(state.targetNode);
  nodeActions.startEditing();

  // ส่ง custom event
  dispatchActionEvent('edit', state, event);
}

/**
 * จัดการ Delete Button Click
 */
function handleDeleteClick(state: ActionButtonsContainerState, event: FederatedPointerEvent): void {
  console.log('🗑️ คลิกปุ่ม Delete สำหรับ Node:', state.targetNode);
  
  // เรียก external handler ถ้ามี
  if (state.onDeleteClick) {
    state.onDeleteClick(state.targetNode, event);
  }

  // ส่ง custom event
  dispatchActionEvent('delete', state, event);
}

/**
 * ส่ง Custom Event เมื่อมีการคลิกปุ่ม
 */
function dispatchActionEvent(action: ActionButtonType, state: ActionButtonsContainerState, event: FederatedPointerEvent): void {
  const customEvent = new CustomEvent('node-action-clicked', {
    detail: {
      node: state.targetNode,
      action: action,
      originalEvent: event,
      container: state
    }
  });
  window.dispatchEvent(customEvent);
}

/**
 * Function-based ActionButtonsContainer factory
 * สร้าง ActionButtonsContainer พร้อม internal state และ methods
 */
export function createActionButtonsContainer(
  targetNode: Container, 
  options: ActionButtonsContainerOptions = {}
): Container & {
  show: (animated?: boolean) => Promise<void>;
  hide: (animated?: boolean) => Promise<void>;
  getVisibility: () => boolean;
  isCurrentlyAnimating: () => boolean;
  updatePosition: () => void;
  getTargetNode: () => Container;
  setEditClickHandler: (handler: (node: Container, event: FederatedPointerEvent) => void) => void;
  setDeleteClickHandler: (handler: (node: Container, event: FederatedPointerEvent) => void) => void;
  destroy: () => void;
} {
  const container = new Container();
  
  // สร้าง state สำหรับ container
  const state: ActionButtonsContainerState = {
    editButton: createActionButton('edit'), // จะถูกสร้างใหม่ใน createButtons
    deleteButton: createActionButton('delete'), // จะถูกสร้างใหม่ใน createButtons
    targetNode,
    options: {
      buttonSize: 32,
      spacing: 8,
      position: 'top',
      showAnimation: true,
      offset: { x: 0, y: -16 },
      animationDuration: 200,
      ...options
    },
    isVisible: false,
    isAnimating: false,
    onEditClick: undefined,
    onDeleteClick: undefined
  };

  // สร้าง components
  createButtons(container, state);
  positionButtons(container, state);
  setupInitialState(container, state);

  console.log('🔘 สร้าง ActionButtonsContainer สำหรับ Node:', targetNode);

  // เพิ่ม methods ให้กับ container
  return Object.assign(container, {
    show: (animated: boolean = true) => showButtons(container, state, animated),
    
    hide: (animated: boolean = true) => hideButtons(container, state, animated),
    
    getVisibility: () => state.isVisible,
    
    isCurrentlyAnimating: () => state.isAnimating,
    
    updatePosition: () => updateContainerPosition(container, state),
    
    getTargetNode: () => state.targetNode,
    
    setEditClickHandler: (handler: (node: Container, event: FederatedPointerEvent) => void) => {
      state.onEditClick = handler;
    },
    
    setDeleteClickHandler: (handler: (node: Container, event: FederatedPointerEvent) => void) => {
      state.onDeleteClick = handler;
    },
    
    destroy: () => {
      // ซ่อนปุ่มก่อนทำลาย
      if (state.isVisible) {
        hideButtons(container, state, false); // ไม่ใช้ animation
      }

      // ทำลายปุ่ม
      state.editButton?.destroy();
      state.deleteButton?.destroy();
      
      console.log('🗑️ ทำลาย ActionButtonsContainer');
      
      // เรียก parent destroy
      container.destroy();
    }
  });
}

/**
 * Container สำหรับปุ่ม Edit และ Delete ที่แสดงเมื่อ Node ถูกเลือก
 * รองรับ show/hide animations และการจัดตำแหน่งแบบต่างๆ
 * 
 * @deprecated ใช้ createActionButtonsContainer แทน - function-based approach
 */
export class ActionButtonsContainer extends Container {
  private editButton!: ReturnType<typeof createActionButton>;
  private deleteButton!: ReturnType<typeof createActionButton>;
  private targetNode: Container;
  private options: Required<ActionButtonsContainerOptions>;
  private isVisible: boolean = false;
  private isAnimating: boolean = false;

  // Event handlers
  private onEditClick?: (node: Container, event: FederatedPointerEvent) => void;
  private onDeleteClick?: (node: Container, event: FederatedPointerEvent) => void;

  constructor(targetNode: Container, options: ActionButtonsContainerOptions = {}) {
    super();

    this.targetNode = targetNode;
    
    // ตั้งค่า default options
    this.options = {
      buttonSize: 32,
      spacing: 8,
      position: 'top',
      showAnimation: true,
      offset: { x: 0, y: -16 },
      animationDuration: 200,
      ...options
    };

    this.createButtons();
    this.positionButtons();
    this.setupInitialState();

    console.log('🔘 สร้าง ActionButtonsContainer สำหรับ Node:', targetNode);
  }

  /**
   * สร้างปุ่ม Edit และ Delete
   */
  private createButtons(): void {
    // สร้างปุ่ม Edit
    this.editButton = createActionButton('edit', {
      size: this.options.buttonSize,
      hoverScale: 1.1
    });

    // สร้างปุ่ม Delete
    this.deleteButton = createActionButton('delete', {
      size: this.options.buttonSize,
      hoverScale: 1.1
    });

    // ตั้งค่า click handlers
    this.editButton.setClickHandler(this.handleEditClick.bind(this));
    this.deleteButton.setClickHandler(this.handleDeleteClick.bind(this));

    // เพิ่มปุ่มเข้าใน container
    this.addChild(this.editButton);
    this.addChild(this.deleteButton);
  }

  /**
   * จัดตำแหน่งปุ่มตาม options
   */
  private positionButtons(): void {
    const { buttonSize, spacing, position } = this.options;
    const totalWidth = (buttonSize * 2) + spacing;
    const halfWidth = totalWidth / 2;

    switch (position) {
      case 'top':
      case 'bottom':
        // จัดเรียงแนวนอน
        this.editButton.x = -halfWidth + (buttonSize / 2);
        this.editButton.y = 0;
        
        this.deleteButton.x = -halfWidth + buttonSize + spacing + (buttonSize / 2);
        this.deleteButton.y = 0;
        break;

      case 'right':
        // จัดเรียงแนวตั้ง
        this.editButton.x = 0;
        this.editButton.y = -halfWidth + (buttonSize / 2);
        
        this.deleteButton.x = 0;
        this.deleteButton.y = -halfWidth + buttonSize + spacing + (buttonSize / 2);
        break;
    }

    // อัปเดตตำแหน่งของ container เทียบกับ target node
    this.updateContainerPosition();
  }

  /**
   * อัปเดตตำแหน่งของ container เทียบกับ target node
   */
  private updateContainerPosition(): void {
    const bounds = this.targetNode.getBounds();
    const { position, offset } = this.options;

    let x: number, y: number;

    switch (position) {
      case 'top':
        x = bounds.x + (bounds.width / 2) + offset.x;
        y = bounds.y + offset.y;
        break;
      case 'bottom':
        x = bounds.x + (bounds.width / 2) + offset.x;
        y = bounds.y + bounds.height - offset.y;
        break;
      case 'right':
        x = bounds.x + bounds.width - offset.x;
        y = bounds.y + (bounds.height / 2) + offset.y;
        break;
    }

    this.x = x;
    this.y = y;
  }

  /**
   * ตั้งค่าสถานะเริ่มต้น (ซ่อนอยู่)
   */
  private setupInitialState(): void {
    this.visible = false;
    this.alpha = 0;
    this.scale.set(0.8); // เริ่มต้นด้วยขนาดเล็กกว่าปกติ
  }

  /**
   * แสดงปุ่มพร้อม animation
   */
  public async show(animated: boolean = true): Promise<void> {
    if (this.isVisible || this.isAnimating) {
      return;
    }

    this.isVisible = true;
    this.visible = true;

    // อัปเดตตำแหน่งก่อนแสดง
    this.updateContainerPosition();

    if (!animated || !this.options.showAnimation) {
      // แสดงทันทีไม่มี animation
      this.alpha = 1;
      this.scale.set(1);
      return;
    }

    // แสดงด้วย animation
    return new Promise<void>((resolve) => {
      this.isAnimating = true;
      const duration = this.options.animationDuration;
      const startTime = Date.now();
      const startAlpha = this.alpha;
      const startScale = this.scale.x;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        // Fade in
        this.alpha = startAlpha + (1 - startAlpha) * easeProgress;
        
        // Scale up
        const targetScale = 1;
        this.scale.set(startScale + (targetScale - startScale) * easeProgress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.isAnimating = false;
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * ซ่อนปุ่มพร้อม animation
   */
  public async hide(animated: boolean = true): Promise<void> {
    if (!this.isVisible || this.isAnimating) {
      return;
    }

    this.isVisible = false;

    if (!animated || !this.options.showAnimation) {
      // ซ่อนทันทีไม่มี animation
      this.visible = false;
      this.alpha = 0;
      this.scale.set(0.8);
      return;
    }

    // ซ่อนด้วย animation
    return new Promise<void>((resolve) => {
      this.isAnimating = true;
      const duration = this.options.animationDuration;
      const startTime = Date.now();
      const startAlpha = this.alpha;
      const startScale = this.scale.x;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-in animation
        const easeProgress = Math.pow(progress, 3);
        
        // Fade out
        this.alpha = startAlpha * (1 - easeProgress);
        
        // Scale down
        const targetScale = 0.8;
        this.scale.set(startScale + (targetScale - startScale) * easeProgress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.visible = false;
          this.isAnimating = false;
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * จัดการ Edit Button Click
   */
  private handleEditClick(event: FederatedPointerEvent): void {
    console.log('✏️ คลิกปุ่ม Edit สำหรับ Node:', this.targetNode);
    
    // เรียก external handler ถ้ามี
    if (this.onEditClick) {
      this.onEditClick(this.targetNode, event);
    }

    // ตั้งค่าสถานะ editing ใน NodeActions
    const nodeActions = useNodeActions(this.targetNode);
    nodeActions.startEditing();

    // ส่ง custom event
    this.dispatchActionEvent('edit', event);
  }

  /**
   * จัดการ Delete Button Click
   */
  private handleDeleteClick(event: FederatedPointerEvent): void {
    console.log('🗑️ คลิกปุ่ม Delete สำหรับ Node:', this.targetNode);
    
    // เรียก external handler ถ้ามี
    if (this.onDeleteClick) {
      this.onDeleteClick(this.targetNode, event);
    }

    // ส่ง custom event
    this.dispatchActionEvent('delete', event);
  }

  /**
   * ส่ง Custom Event เมื่อมีการคลิกปุ่ม
   */
  private dispatchActionEvent(action: ActionButtonType, event: FederatedPointerEvent): void {
    const customEvent = new CustomEvent('node-action-clicked', {
      detail: {
        node: this.targetNode,
        action: action,
        originalEvent: event,
        container: this
      }
    });
    window.dispatchEvent(customEvent);
  }

  /**
   * ตั้งค่า Edit Click Handler
   */
  public setEditClickHandler(handler: (node: Container, event: FederatedPointerEvent) => void): void {
    this.onEditClick = handler;
  }

  /**
   * ตั้งค่า Delete Click Handler
   */
  public setDeleteClickHandler(handler: (node: Container, event: FederatedPointerEvent) => void): void {
    this.onDeleteClick = handler;
  }

  /**
   * ตรวจสอบว่าปุ่มแสดงอยู่หรือไม่
   */
  public getVisibility(): boolean {
    return this.isVisible;
  }

  /**
   * ตรวจสอบว่ากำลัง animate อยู่หรือไม่
   */
  public isCurrentlyAnimating(): boolean {
    return this.isAnimating;
  }

  /**
   * อัปเดตตำแหน่งปุ่ม (เรียกเมื่อ Node เปลี่ยนขนาดหรือตำแหน่ง)
   */
  public updatePosition(): void {
    this.updateContainerPosition();
  }

  /**
   * ได้ target node
   */
  public getTargetNode(): Container {
    return this.targetNode;
  }

  /**
   * ทำลาย component และ cleanup resources
   */
  public destroy(): void {
    // ซ่อนปุ่มก่อนทำลาย
    if (this.isVisible) {
      this.hide(false); // ไม่ใช้ animation
    }

    // ทำลายปุ่ม
    this.editButton?.destroy();
    this.deleteButton?.destroy();
    
    console.log('🗑️ ทำลาย ActionButtonsContainer');
    
    // เรียก parent destroy
    super.destroy();
  }
}

/**
 * Factory function สำหรับสร้าง ActionButtonsContainer (Class-based compatibility)
 * @param targetNode - Node ที่ต้องการเพิ่มปุ่ม action
 * @param options - ตัวเลือกสำหรับการสร้าง container
 * @returns ActionButtonsContainer instance
 * @deprecated ใช้ createActionButtonsContainer function แทน
 */
export function createActionButtonsContainerClass(
  targetNode: Container, 
  options?: ActionButtonsContainerOptions
): ActionButtonsContainer {
  return new ActionButtonsContainer(targetNode, options);
}