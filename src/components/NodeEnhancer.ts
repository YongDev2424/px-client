// src/components/NodeEnhancer.ts

import { Container, Rectangle } from 'pixi.js';
import { CollapseExpandButton, CollapseExpandButtonOptions } from './CollapseExpandButton';
import { ActionButtonsContainer, ActionButtonsContainerOptions } from './ActionButtonsContainer';
import { PropertyContainer, PropertyContainerOptions } from './PropertyContainer';
import { nodeStateManager, PropertyValue } from '../utils/nodeStateManager';
import { selectionManager, SelectableElement } from '../utils/selectionManager';

/**
 * ตัวเลือกสำหรับการ enhance Node
 */
export interface NodeEnhancementOptions {
  enableCollapse?: boolean;                          // เปิดใช้งาน collapse/expand (default: true)
  enableActionButtons?: boolean;                     // เปิดใช้งาน action buttons (default: true)
  enableProperties?: boolean;                        // เปิดใช้งาน property management (default: true)
  animationDuration?: number;                        // ระยะเวลา animation (default: 300)
  maxProperties?: number;                            // จำนวน properties สูงสุด (default: 20)
  
  // ตัวเลือกสำหรับ CollapseExpandButton
  collapseButton?: CollapseExpandButtonOptions;
  
  // ตัวเลือกสำหรับ ActionButtonsContainer
  actionButtons?: ActionButtonsContainerOptions;
  
  // ตัวเลือกสำหรับ PropertyContainer
  propertyContainer?: PropertyContainerOptions;
}

/**
 * Metadata ที่เก็บไว้ใน nodeData ของ enhanced node
 */
export interface EnhancedNodeData {
  // ข้อมูลเดิม
  labelText: string;
  boxColor: number;
  nodeType: string;
  
  // ข้อมูลใหม่สำหรับ enhancement
  isEnhanced: boolean;
  isCollapsed: boolean;
  properties: PropertyValue[];
  enhancementOptions: NodeEnhancementOptions;
  originalBounds: { width: number; height: number };
  collapsedBounds: { width: number; height: number };
}

/**
 * คลาสหลักสำหรับการ enhance C4Box nodes ด้วยฟีเจอร์ขั้นสูง
 * ประสานงานระหว่าง CollapseExpandButton, ActionButtonsContainer, และ PropertyContainer
 */
export class NodeEnhancer {
  private targetNode: Container;
  private options: Required<NodeEnhancementOptions>;
  private collapseButton?: CollapseExpandButton;
  private actionButtons?: ActionButtonsContainer;
  private propertyContainer?: PropertyContainer;
  private originalBounds: Rectangle;
  private selectableElement?: SelectableElement;
  
  // Event handlers
  private boundHandleNodeStateChange: (event: CustomEvent) => void;
  private boundHandleSelectionChange: (event: CustomEvent) => void;
  private boundHandleNodeAction: (event: CustomEvent) => void;

  constructor(targetNode: Container, options: NodeEnhancementOptions = {}) {
    this.targetNode = targetNode;
    
    // ตั้งค่า default options
    this.options = {
      enableCollapse: true,
      enableActionButtons: true,
      enableProperties: true,
      animationDuration: 300,
      maxProperties: 20,
      collapseButton: {},
      actionButtons: {},
      propertyContainer: {},
      ...options
    };

    // เก็บ bounds เดิม
    this.originalBounds = this.targetNode.getBounds();
    
    // Bind event handlers
    this.boundHandleNodeStateChange = this.handleNodeStateChange.bind(this);
    this.boundHandleSelectionChange = this.handleSelectionChange.bind(this);
    this.boundHandleNodeAction = this.handleNodeAction.bind(this);

    // เก็บ reference ใน node
    (targetNode as any).nodeEnhancer = this;
    
    // เริ่มต้นการ enhance
    this.initializeEnhancement();

    console.log('🚀 สร้าง NodeEnhancer สำหรับ Node:', targetNode);
  }

  /**
   * Static method สำหรับ enhance existing C4Box
   * @param node - C4Box Container ที่ต้องการ enhance
   * @param options - ตัวเลือกการ enhance
   * @returns NodeEnhancer instance
   */
  static enhance(node: Container, options: NodeEnhancementOptions = {}): NodeEnhancer {
    // ตรวจสอบว่า node ถูก enhance แล้วหรือไม่
    const existingEnhancer = (node as any).nodeEnhancer;
    if (existingEnhancer) {
      console.warn('Node ถูก enhance แล้ว:', node);
      return existingEnhancer;
    }

    // สร้าง NodeEnhancer ใหม่
    const enhancer = new NodeEnhancer(node, options);
    
    // เก็บ reference ใน node
    (node as any).nodeEnhancer = enhancer;
    
    return enhancer;
  }

  /**
   * เริ่มต้นการ enhance node
   */
  private initializeEnhancement(): void {
    // เริ่มต้น node state
    this.initializeNodeState();
    
    // ตั้งค่า enhancement metadata
    this.setupEnhancementMetadata();
    
    // ตั้งค่า components ต่างๆ
    if (this.options.enableCollapse) {
      this.setupCollapseExpand();
    }
    
    if (this.options.enableActionButtons) {
      this.setupActionButtons();
    }
    
    if (this.options.enableProperties) {
      this.setupPropertyManagement();
    }
    
    // ตั้งค่า selection integration
    this.setupSelectionIntegration();
    
    // ตั้งค่า event listeners
    this.setupEventListeners();
    
    // อัปเดตขนาด node เริ่มต้น
    this.updateNodeSize();
  }

  /**
   * เริ่มต้น node state ใน NodeStateManager
   */
  private initializeNodeState(): void {
    const initialState = {
      isCollapsed: false,
      isEditing: false,
      actionButtonsVisible: false,
      originalBounds: {
        width: this.originalBounds.width,
        height: this.originalBounds.height
      }
    };

    nodeStateManager.initializeNodeState(this.targetNode, initialState);
    nodeStateManager.setOriginalBounds(this.targetNode, {
      width: this.originalBounds.width,
      height: this.originalBounds.height
    });
  }

  /**
   * ตั้งค่า enhancement metadata ใน nodeData
   */
  private setupEnhancementMetadata(): void {
    const existingData = (this.targetNode as any).nodeData || {};
    
    const enhancedData: EnhancedNodeData = {
      ...existingData,
      isEnhanced: true,
      isCollapsed: false,
      properties: [],
      enhancementOptions: this.options,
      originalBounds: {
        width: this.originalBounds.width,
        height: this.originalBounds.height
      },
      collapsedBounds: {
        width: this.originalBounds.width,
        height: 40 // ความสูงเมื่อ collapse
      }
    };

    (this.targetNode as any).nodeData = enhancedData;
  }

  /**
   * ตั้งค่า collapse/expand functionality
   */
  private setupCollapseExpand(): void {
    this.collapseButton = new CollapseExpandButton(this.targetNode, {
      ...this.options.collapseButton,
      // ตั้งค่าตำแหน่งให้อยู่มุมบนขวา
      position: 'top-right',
      offset: { x: -8, y: 8 }
    });

    // เพิ่ม collapse button เข้าไปใน stage (ไม่ใช่ใน node)
    const stage = this.getStage();
    if (stage) {
      stage.addChild(this.collapseButton);
    }

    console.log('🔘 ตั้งค่า CollapseExpandButton สำเร็จ');
  }

  /**
   * ตั้งค่า action buttons functionality
   */
  private setupActionButtons(): void {
    this.actionButtons = new ActionButtonsContainer(this.targetNode, {
      ...this.options.actionButtons,
      // ตั้งค่าตำแหน่งให้อยู่ด้านบน
      position: 'top',
      offset: { x: 0, y: -16 }
    });

    // ตั้งค่า event handlers
    this.actionButtons.setEditClickHandler(this.handleEditAction.bind(this));
    this.actionButtons.setDeleteClickHandler(this.handleDeleteAction.bind(this));

    // เพิ่ม action buttons เข้าไปใน stage
    const stage = this.getStage();
    if (stage) {
      stage.addChild(this.actionButtons);
    }

    console.log('🔘 ตั้งค่า ActionButtonsContainer สำเร็จ');
  }

  /**
   * ตั้งค่า property management functionality
   */
  private setupPropertyManagement(): void {
    this.propertyContainer = new PropertyContainer(this.targetNode, {
      ...this.options.propertyContainer,
      // ตั้งค่าขนาดให้เท่ากับ node
      width: this.originalBounds.width
    });

    // วางตำแหน่ง property container ใต้ node
    this.propertyContainer.x = this.targetNode.x;
    this.propertyContainer.y = this.targetNode.y + this.originalBounds.height + 8;

    // เพิ่ม property container เข้าไปใน stage
    const stage = this.getStage();
    if (stage) {
      stage.addChild(this.propertyContainer);
    }

    console.log('📦 ตั้งค่า PropertyContainer สำเร็จ');
  }

  /**
   * ตั้งค่า selection integration
   */
  private setupSelectionIntegration(): void {
    // ได้ existing selectable element หรือสร้างใหม่
    this.selectableElement = (this.targetNode as any).selectableElement;
    
    if (this.selectableElement) {
      // อัปเดต existing selectable element ให้รองรับ enhanced node
      selectionManager.updateSelectableForEnhancedNode(this.targetNode);
      console.log('🔄 Updated existing SelectableElement for enhanced node');
    } else {
      // สร้าง SelectableElement ใหม่สำหรับ enhanced node
      // ใช้ makeSelectable function ที่ import แล้ว (หลีกเลี่ยง circular dependency)
      this.createNewSelectableElement();
      console.log('✨ Created new SelectableElement for enhanced node');
    }
  }

  /**
   * สร้าง SelectableElement ใหม่สำหรับ enhanced node
   * แยกออกมาเป็น method ต่างหากเพื่อหลีกเลี่ยง circular dependency
   */
  private createNewSelectableElement(): void {
    // สร้าง SelectableElement โดยตรงแทนการใช้ makeSelectable
    // เพื่อหลีกเลี่ยง circular dependency
    const element: SelectableElement = {
      container: this.targetNode,
      onSelect: () => {
        console.log('🎯 Enhanced node selected via new SelectableElement');
        // จัดการ action buttons
        if (this.actionButtons) {
          this.actionButtons.show();
        }
        // ส่ง event
        const event = new CustomEvent('pixi-selection-change', {
          detail: { 
            container: this.targetNode, 
            action: 'select',
            isEnhanced: true
          }
        });
        window.dispatchEvent(event);
      },
      onDeselect: () => {
        console.log('⭕ Enhanced node deselected via new SelectableElement');
        // จัดการ action buttons
        if (this.actionButtons) {
          this.actionButtons.hide();
        }
        // ส่ง event
        const event = new CustomEvent('pixi-selection-change', {
          detail: { 
            container: this.targetNode, 
            action: 'deselect',
            isEnhanced: true
          }
        });
        window.dispatchEvent(event);
      },
      isSelected: false
    };

    // เพิ่ม click handler
    this.targetNode.on('pointerdown', (event) => {
      event.stopPropagation();
      selectionManager.toggleSelection(element);
    });

    // เก็บ reference
    (this.targetNode as any).selectableElement = element;
    this.selectableElement = element;
  }

  /**
   * ตั้งค่า event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('node-state-changed', this.boundHandleNodeStateChange);
    window.addEventListener('pixi-selection-change', this.boundHandleSelectionChange);
    window.addEventListener('node-action-clicked', this.boundHandleNodeAction);
  }

  /**
   * จัดการ node state changes
   */
  private handleNodeStateChange(event: CustomEvent): void {
    if (event.detail.node !== this.targetNode) return;

    const { changeType } = event.detail;

    switch (changeType) {
      case 'collapse':
        this.handleCollapseChange(event.detail.isCollapsed);
        break;
      case 'editing':
        this.handleEditingChange(event.detail.isEditing);
        break;
      case 'property-added':
      case 'property-removed':
      case 'property-updated':
        this.handlePropertyChange();
        break;
    }
  }

  /**
   * จัดการ selection changes
   */
  private handleSelectionChange(event: CustomEvent): void {
    if (event.detail.container !== this.targetNode) return;

    const { action } = event.detail;
    
    if (action === 'select') {
      this.handleNodeSelected();
    } else if (action === 'deselect') {
      this.handleNodeDeselected();
    }
  }

  /**
   * จัดการ node action events
   */
  private handleNodeAction(event: CustomEvent): void {
    if (event.detail.node !== this.targetNode) return;

    const { action } = event.detail;
    
    switch (action) {
      case 'edit':
        this.handleEditAction();
        break;
      case 'delete':
        this.handleDeleteAction();
        break;
    }
  }

  /**
   * จัดการเมื่อ node ถูกเลือก (เรียกจาก SelectionManager)
   */
  private handleNodeSelected(): void {
    // Selection handling is now managed by SelectionManager
    // This method is kept for backward compatibility and internal use
    console.log('🎯 Node selection handled by SelectionManager');
  }

  /**
   * จัดการเมื่อ node ไม่ถูกเลือก (เรียกจาก SelectionManager)
   */
  private handleNodeDeselected(): void {
    // Deselection handling is now managed by SelectionManager
    // This method is kept for backward compatibility and internal use
    console.log('⭕ Node deselection handled by SelectionManager');
  }

  /**
   * จัดการ collapse state change
   */
  private handleCollapseChange(isCollapsed: boolean): void {
    if (isCollapsed) {
      this.handleCollapse(true);
    } else {
      this.handleExpand(true);
    }
  }

  /**
   * จัดการ editing state change
   */
  private handleEditingChange(isEditing: boolean): void {
    if (this.propertyContainer) {
      this.propertyContainer.setEditMode(isEditing);
    }
    
    console.log(`📝 Node ${isEditing ? 'เข้าสู่' : 'ออกจาก'} โหมด editing`);
  }

  /**
   * จัดการ property changes
   */
  private handlePropertyChange(): void {
    // อัปเดตขนาด node ตาม properties
    this.updateNodeSize();
    
    // อัปเดตตำแหน่ง components
    this.updateComponentPositions();
    
    console.log('📦 Properties เปลี่ยนแปลง - อัปเดตขนาด node');
  }

  /**
   * จัดการ edit action
   */
  private handleEditAction(): void {
    nodeStateManager.setEditing(this.targetNode, true);
    console.log('✏️ เริ่มแก้ไข Node');
  }

  /**
   * จัดการ delete action
   */
  private handleDeleteAction(): void {
    const nodeData = (this.targetNode as any).nodeData;
    const nodeName = nodeData?.labelText || 'Unknown Node';
    
    const confirmed = confirm(`Are you sure you want to delete "${nodeName}"?`);
    if (confirmed) {
      this.deleteNode();
    }
  }

  /**
   * จัดการ collapse node
   */
  private handleCollapse(animated: boolean): void {
    const collapsedBounds = { width: this.originalBounds.width, height: 40 };
    
    // อัปเดต collapsed bounds
    nodeStateManager.setCollapsedBounds(this.targetNode, collapsedBounds);
    
    // ซ่อน property container
    if (this.propertyContainer) {
      this.propertyContainer.setCollapsed(true);
    }
    
    // อัปเดตขนาด node
    this.updateNodeSize(animated);
    
    console.log('📦 Node collapsed');
  }

  /**
   * จัดการ expand node
   */
  private handleExpand(animated: boolean): void {
    // แสดง property container
    if (this.propertyContainer) {
      this.propertyContainer.setCollapsed(false);
    }
    
    // อัปเดตขนาด node
    this.updateNodeSize(animated);
    
    console.log('📦 Node expanded');
  }

  /**
   * อัปเดตขนาดของ node ตามสถานะปัจจุบัน
   */
  private updateNodeSize(animated: boolean = false): void {
    const isCollapsed = nodeStateManager.isCollapsed(this.targetNode);
    const propertyCount = nodeStateManager.getPropertyCount(this.targetNode);
    
    let targetHeight: number;
    
    if (isCollapsed) {
      targetHeight = 40; // ความสูงเมื่อ collapse
    } else {
      // ความสูงปกติ + ความสูงของ properties
      const propertyHeight = this.propertyContainer ? 
        this.propertyContainer.getCurrentSize().height : 0;
      targetHeight = this.originalBounds.height + propertyHeight;
    }

    // อัปเดต graphics ของ node
    const boxGraphics = (this.targetNode as any).boxGraphics;
    if (boxGraphics) {
      if (animated) {
        this.animateNodeResize(boxGraphics, targetHeight);
      } else {
        this.resizeNodeGraphics(boxGraphics, targetHeight);
      }
    }

    // อัปเดตตำแหน่ง components
    this.updateComponentPositions();
  }

  /**
   * Animate node resize
   */
  private animateNodeResize(graphics: any, targetHeight: number): void {
    const startHeight = graphics.height || this.originalBounds.height;
    const duration = this.options.animationDuration;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentHeight = startHeight + (targetHeight - startHeight) * easeProgress;
      
      this.resizeNodeGraphics(graphics, currentHeight);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Resize node graphics
   */
  private resizeNodeGraphics(graphics: any, height: number): void {
    // ใช้ PixiJS v8 API สำหรับการวาดใหม่
    graphics.clear();
    graphics
      .rect(0, 0, this.originalBounds.width, height)
      .fill(0x1e1e1e)
      .stroke({ width: 2, color: 0x999999 });
  }

  /**
   * อัปเดตตำแหน่งของ components ต่างๆ
   */
  private updateComponentPositions(): void {
    // อัปเดตตำแหน่ง collapse button
    if (this.collapseButton) {
      this.collapseButton.updateButtonPosition();
    }

    // อัปเดตตำแหน่ง action buttons
    if (this.actionButtons) {
      this.actionButtons.updatePosition();
    }

    // อัปเดตตำแหน่ง property container
    if (this.propertyContainer) {
      const nodeHeight = nodeStateManager.isCollapsed(this.targetNode) ? 40 : 
        this.originalBounds.height;
      
      this.propertyContainer.x = this.targetNode.x;
      this.propertyContainer.y = this.targetNode.y + nodeHeight + 8;
    }
  }

  /**
   * ลบ node และ cleanup
   */
  private deleteNode(): void {
    // ส่ง event ก่อนลบ
    const event = new CustomEvent('node-delete-requested', {
      detail: {
        node: this.targetNode,
        enhancer: this
      }
    });
    window.dispatchEvent(event);

    // ลบจาก selection
    if (this.selectableElement) {
      selectionManager.deselectElement(this.selectableElement);
    }

    // Cleanup enhancer
    this.destroy();

    // ลบ node จาก stage
    if (this.targetNode.parent) {
      this.targetNode.parent.removeChild(this.targetNode);
    }

    console.log('🗑️ ลบ Node สำเร็จ');
  }

  /**
   * ได้ stage container
   */
  private getStage(): Container | null {
    let current = this.targetNode.parent;
    while (current && current.parent) {
      current = current.parent as Container;
    }
    return current;
  }

  // === Public API Methods ===

  /**
   * ได้ target node
   */
  public getTargetNode(): Container {
    return this.targetNode;
  }

  /**
   * ได้ enhancement options
   */
  public getOptions(): NodeEnhancementOptions {
    return { ...this.options };
  }

  /**
   * ตรวจสอบว่า node ถูก enhance หรือไม่
   */
  public isEnhanced(): boolean {
    return true;
  }

  /**
   * ได้ collapse button component
   */
  public getCollapseButton(): CollapseExpandButton | undefined {
    return this.collapseButton;
  }

  /**
   * ได้ action buttons component
   */
  public getActionButtons(): ActionButtonsContainer | undefined {
    return this.actionButtons;
  }

  /**
   * ได้ property container component
   */
  public getPropertyContainer(): PropertyContainer | undefined {
    return this.propertyContainer;
  }

  /**
   * เพิ่ม property ใหม่
   */
  public addProperty(property: PropertyValue): boolean {
    return nodeStateManager.addProperty(this.targetNode, property);
  }

  /**
   * ลบ property
   */
  public removeProperty(key: string): boolean {
    return nodeStateManager.removeProperty(this.targetNode, key);
  }

  /**
   * อัปเดต property
   */
  public updateProperty(key: string, value: string, type?: PropertyValue['type']): boolean {
    return nodeStateManager.updateProperty(this.targetNode, key, value, type);
  }

  /**
   * ได้ properties ทั้งหมด
   */
  public getProperties(): PropertyValue[] {
    return nodeStateManager.getProperties(this.targetNode);
  }

  /**
   * ตั้งค่าสถานะ collapsed
   */
  public setCollapsed(collapsed: boolean): boolean {
    return nodeStateManager.setCollapsed(this.targetNode, collapsed);
  }

  /**
   * ตรวจสอบสถานะ collapsed
   */
  public isCollapsed(): boolean {
    return nodeStateManager.isCollapsed(this.targetNode);
  }

  /**
   * ตั้งค่าสถานะ editing
   */
  public setEditing(editing: boolean): boolean {
    return nodeStateManager.setEditing(this.targetNode, editing);
  }

  /**
   * ตรวจสอบสถานะ editing
   */
  public isEditing(): boolean {
    return nodeStateManager.isEditing(this.targetNode);
  }

  /**
   * ทำลาย enhancer และ cleanup resources
   */
  public destroy(): void {
    // ลบ event listeners
    window.removeEventListener('node-state-changed', this.boundHandleNodeStateChange);
    window.removeEventListener('pixi-selection-change', this.boundHandleSelectionChange);
    window.removeEventListener('node-action-clicked', this.boundHandleNodeAction);

    // ทำลาย components
    if (this.collapseButton) {
      if (this.collapseButton.parent) {
        this.collapseButton.parent.removeChild(this.collapseButton);
      }
      this.collapseButton.destroy();
    }

    if (this.actionButtons) {
      if (this.actionButtons.parent) {
        this.actionButtons.parent.removeChild(this.actionButtons);
      }
      this.actionButtons.destroy();
    }

    if (this.propertyContainer) {
      if (this.propertyContainer.parent) {
        this.propertyContainer.parent.removeChild(this.propertyContainer);
      }
      this.propertyContainer.destroy();
    }

    // ลบ node state
    nodeStateManager.removeNodeState(this.targetNode);

    // ลบ reference จาก node
    delete (this.targetNode as any).nodeEnhancer;

    console.log('🗑️ ทำลาย NodeEnhancer');
  }
}

/**
 * Factory function สำหรับ enhance existing C4Box
 * @param node - C4Box Container ที่ต้องการ enhance
 * @param options - ตัวเลือกการ enhance
 * @returns NodeEnhancer instance
 */
export function enhanceNode(node: Container, options?: NodeEnhancementOptions): NodeEnhancer {
  return NodeEnhancer.enhance(node, options);
}

/**
 * ตรวจสอบว่า node ถูก enhance แล้วหรือไม่
 * @param node - Container ที่ต้องการตรวจสอบ
 * @returns true ถ้าถูก enhance แล้ว
 */
export function isNodeEnhanced(node: Container): boolean {
  return !!(node as any).nodeEnhancer;
}

/**
 * ได้ NodeEnhancer จาก enhanced node
 * @param node - Enhanced node container
 * @returns NodeEnhancer instance หรือ null ถ้าไม่ได้ enhance
 */
export function getNodeEnhancer(node: Container): NodeEnhancer | null {
  return (node as any).nodeEnhancer || null;
}