// src/utils/nodeStateManager.ts

import { Container } from 'pixi.js';

/**
 * Interface สำหรับค่าของ Property
 */
export interface PropertyValue {
  key: string;
  value: string;
  type: 'text' | 'number' | 'boolean';
  id: string;      // Unique identifier
  order: number;   // Display order
}

/**
 * Interface สำหรับสถานะของ Node
 */
export interface NodeState {
  isCollapsed: boolean;
  isEditing: boolean;
  properties: Map<string, PropertyValue>;
  actionButtonsVisible: boolean;
  originalBounds?: { width: number; height: number };
  collapsedBounds?: { width: number; height: number };
}

/**
 * ระบบจัดการสถานะของ Enhanced Nodes
 * รองรับการจัดการ collapse/expand, property management, และ editing states
 */
class NodeStateManager {
  private nodeStates: Map<Container, NodeState> = new Map();
  private propertyIdCounter: number = 0;

  /**
   * เริ่มต้นสถานะสำหรับ Node ใหม่
   * @param node - Container ของ Node
   * @param initialState - สถานะเริ่มต้น (optional)
   * @returns NodeState ที่สร้างขึ้น
   */
  initializeNodeState(node: Container, initialState?: Partial<NodeState>): NodeState {
    // ถ้ามีสถานะอยู่แล้ว ให้คืนสถานะเดิม
    const existingState = this.nodeStates.get(node);
    if (existingState) {
      return existingState;
    }

    const defaultState: NodeState = {
      isCollapsed: false,
      isEditing: false,
      properties: new Map(),
      actionButtonsVisible: false,
      ...initialState
    };

    this.nodeStates.set(node, defaultState);
    console.log('🔧 เริ่มต้นสถานะ Node:', node);
    return defaultState;
  }

  /**
   * ได้สถานะของ Node
   * @param node - Container ของ Node
   * @returns NodeState หรือ null ถ้าไม่พบ
   */
  getNodeState(node: Container): NodeState | null {
    return this.nodeStates.get(node) || null;
  }

  /**
   * ตรวจสอบว่า Node มีสถานะหรือไม่
   * @param node - Container ของ Node
   * @returns true ถ้ามีสถานะ
   */
  hasNodeState(node: Container): boolean {
    return this.nodeStates.has(node);
  }

  // === Collapse/Expand State Management ===

  /**
   * ตั้งค่าสถานะ collapsed ของ Node
   * @param node - Container ของ Node
   * @param collapsed - สถานะ collapsed ใหม่
   * @returns true ถ้าสำเร็จ, false ถ้าไม่พบ Node
   */
  setCollapsed(node: Container, collapsed: boolean): boolean {
    const state = this.getNodeState(node);
    if (!state) {
      console.warn('ไม่พบสถานะของ Node สำหรับ setCollapsed');
      return false;
    }

    const previousState = state.isCollapsed;
    state.isCollapsed = collapsed;

    // Dispatch event สำหรับ UI updates
    if (previousState !== collapsed) {
      this.dispatchNodeStateChangeEvent(node, 'collapse', {
        isCollapsed: collapsed,
        previousState: previousState
      });
      console.log(`📦 Node ${collapsed ? 'collapsed' : 'expanded'}:`, node);
    }

    return true;
  }

  /**
   * สลับสถานะ collapsed ของ Node
   * @param node - Container ของ Node
   * @returns สถานะใหม่หลังจาก toggle หรือ null ถ้าไม่พบ Node
   */
  toggleCollapse(node: Container): boolean | null {
    const state = this.getNodeState(node);
    if (!state) {
      console.warn('ไม่พบสถานะของ Node สำหรับ toggleCollapse');
      return null;
    }

    const newState = !state.isCollapsed;
    this.setCollapsed(node, newState);
    return newState;
  }

  /**
   * ตรวจสอบว่า Node อยู่ในสถานะ collapsed หรือไม่
   * @param node - Container ของ Node
   * @returns true ถ้า collapsed, false ถ้า expanded หรือไม่พบ Node
   */
  isCollapsed(node: Container): boolean {
    const state = this.getNodeState(node);
    return state?.isCollapsed || false;
  }

  // === Editing State Management ===

  /**
   * ตั้งค่าสถานะ editing ของ Node
   * @param node - Container ของ Node
   * @param editing - สถานะ editing ใหม่
   * @returns true ถ้าสำเร็จ, false ถ้าไม่พบ Node
   */
  setEditing(node: Container, editing: boolean): boolean {
    const state = this.getNodeState(node);
    if (!state) {
      console.warn('ไม่พบสถานะของ Node สำหรับ setEditing');
      return false;
    }

    const previousState = state.isEditing;
    state.isEditing = editing;

    // ถ้าเริ่ม editing ให้ยกเลิก editing ของ Node อื่นๆ
    if (editing && !previousState) {
      // ส่ง node ปัจจุบันเป็น excludeNode เพื่อไม่ให้ถูกยกเลิก
      this.exitAllEditingModes(node);
    }

    // Dispatch event สำหรับ UI updates
    if (previousState !== editing) {
      this.dispatchNodeStateChangeEvent(node, 'editing', {
        isEditing: editing,
        previousState: previousState
      });
      console.log(`✏️ Node ${editing ? 'เข้าสู่' : 'ออกจาก'} โหมด editing:`, node);
    }

    return true;
  }

  /**
   * ตรวจสอบว่า Node อยู่ในสถานะ editing หรือไม่
   * @param node - Container ของ Node
   * @returns true ถ้ากำลัง editing
   */
  isEditing(node: Container): boolean {
    const state = this.getNodeState(node);
    return state?.isEditing || false;
  }

  /**
   * ยกเลิกโหมด editing ของ Node ทั้งหมด ยกเว้น Node ที่ระบุ
   * @param excludeNode - Node ที่ไม่ต้องการยกเลิก editing (optional)
   */
  exitAllEditingModes(excludeNode?: Container): void {
    let exitedCount = 0;

    this.nodeStates.forEach((state, node) => {
      if (state.isEditing && node !== excludeNode) {
        this.setEditing(node, false);
        exitedCount++;
      }
    });

    if (exitedCount > 0) {
      console.log(`🚪 ยกเลิกโหมด editing ของ ${exitedCount} Node(s)`);
    }
  }

  // === Property Management ===

  /**
   * เพิ่ม Property ใหม่ให้กับ Node
   * @param node - Container ของ Node
   * @param property - PropertyValue ที่ต้องการเพิ่ม
   * @returns true ถ้าสำเร็จ, false ถ้าไม่สำเร็จ (key ซ้ำหรือไม่พบ Node)
   */
  addProperty(node: Container, property: PropertyValue): boolean {
    const state = this.getNodeState(node);
    if (!state) {
      console.warn('ไม่พบสถานะของ Node สำหรับ addProperty');
      return false;
    }

    // ตรวจสอบ key ซ้ำ
    if (state.properties.has(property.key)) {
      console.warn(`Property key "${property.key}" มีอยู่แล้ว`);
      return false;
    }

    // สร้าง ID ถ้าไม่มี
    if (!property.id) {
      property.id = `prop_${++this.propertyIdCounter}`;
    }

    // เพิ่ม property
    state.properties.set(property.key, { ...property });

    // อัปเดต nodeData ใน Container
    this.syncPropertiesToNodeData(node);

    // Dispatch event สำหรับ UI updates
    this.dispatchNodeStateChangeEvent(node, 'property-added', {
      property: property,
      propertyCount: state.properties.size
    });

    console.log(`➕ เพิ่ม Property "${property.key}" ให้กับ Node:`, node);
    return true;
  }

  /**
   * ลบ Property จาก Node
   * @param node - Container ของ Node
   * @param key - Key ของ Property ที่ต้องการลบ
   * @returns true ถ้าสำเร็จ, false ถ้าไม่พบ Property หรือ Node
   */
  removeProperty(node: Container, key: string): boolean {
    const state = this.getNodeState(node);
    if (!state) {
      console.warn('ไม่พบสถานะของ Node สำหรับ removeProperty');
      return false;
    }

    const property = state.properties.get(key);
    if (!property) {
      console.warn(`ไม่พบ Property key "${key}"`);
      return false;
    }

    // ลบ property
    state.properties.delete(key);

    // อัปเดต nodeData ใน Container
    this.syncPropertiesToNodeData(node);

    // Dispatch event สำหรับ UI updates
    this.dispatchNodeStateChangeEvent(node, 'property-removed', {
      property: property,
      propertyCount: state.properties.size
    });

    console.log(`➖ ลบ Property "${key}" จาก Node:`, node);
    return true;
  }

  /**
   * อัปเดต Property ของ Node
   * @param node - Container ของ Node
   * @param key - Key ของ Property ที่ต้องการอัปเดต
   * @param newValue - ค่าใหม่
   * @param newType - ประเภทใหม่ (optional)
   * @returns true ถ้าสำเร็จ, false ถ้าไม่พบ Property หรือ Node
   */
  updateProperty(node: Container, key: string, newValue: string, newType?: PropertyValue['type']): boolean {
    const state = this.getNodeState(node);
    if (!state) {
      console.warn('ไม่พบสถานะของ Node สำหรับ updateProperty');
      return false;
    }

    const property = state.properties.get(key);
    if (!property) {
      console.warn(`ไม่พบ Property key "${key}"`);
      return false;
    }

    // อัปเดตค่า
    const oldValue = property.value;
    property.value = newValue;
    if (newType) {
      property.type = newType;
    }

    // อัปเดต nodeData ใน Container
    this.syncPropertiesToNodeData(node);

    // Dispatch event สำหรับ UI updates
    this.dispatchNodeStateChangeEvent(node, 'property-updated', {
      property: property,
      oldValue: oldValue,
      newValue: newValue
    });

    console.log(`🔄 อัปเดต Property "${key}" ของ Node:`, node);
    return true;
  }

  /**
   * ได้ Property ทั้งหมดของ Node
   * @param node - Container ของ Node
   * @returns Array ของ PropertyValue หรือ empty array ถ้าไม่พบ Node
   */
  getProperties(node: Container): PropertyValue[] {
    const state = this.getNodeState(node);
    if (!state) {
      return [];
    }

    return Array.from(state.properties.values())
      .sort((a, b) => a.order - b.order);
  }

  /**
   * ได้จำนวน Property ของ Node
   * @param node - Container ของ Node
   * @returns จำนวน Property
   */
  getPropertyCount(node: Container): number {
    const state = this.getNodeState(node);
    return state?.properties.size || 0;
  }

  /**
   * ตรวจสอบว่า Property key มีอยู่แล้วหรือไม่
   * @param node - Container ของ Node
   * @param key - Key ที่ต้องการตรวจสอบ
   * @returns true ถ้ามี key อยู่แล้ว
   */
  hasProperty(node: Container, key: string): boolean {
    const state = this.getNodeState(node);
    return state?.properties.has(key) || false;
  }

  // === Action Buttons Visibility ===

  /**
   * ตั้งค่าการแสดงผล Action Buttons
   * @param node - Container ของ Node
   * @param visible - สถานะการแสดงผล
   * @returns true ถ้าสำเร็จ, false ถ้าไม่พบ Node
   */
  setActionButtonsVisible(node: Container, visible: boolean): boolean {
    const state = this.getNodeState(node);
    if (!state) {
      console.warn('ไม่พบสถานะของ Node สำหรับ setActionButtonsVisible');
      return false;
    }

    const previousState = state.actionButtonsVisible;
    state.actionButtonsVisible = visible;

    // Dispatch event สำหรับ UI updates
    if (previousState !== visible) {
      this.dispatchNodeStateChangeEvent(node, 'action-buttons', {
        visible: visible,
        previousState: previousState
      });
      console.log(`🔘 Action Buttons ${visible ? 'แสดง' : 'ซ่อน'} สำหรับ Node:`, node);
    }

    return true;
  }

  /**
   * ตรวจสอบว่า Action Buttons แสดงอยู่หรือไม่
   * @param node - Container ของ Node
   * @returns true ถ้าแสดงอยู่
   */
  areActionButtonsVisible(node: Container): boolean {
    const state = this.getNodeState(node);
    return state?.actionButtonsVisible || false;
  }

  // === Bounds Management ===

  /**
   * ตั้งค่า bounds เดิมของ Node (ก่อน collapse)
   * @param node - Container ของ Node
   * @param bounds - ขนาด bounds เดิม
   * @returns true ถ้าสำเร็จ, false ถ้าไม่พบ Node
   */
  setOriginalBounds(node: Container, bounds: { width: number; height: number }): boolean {
    const state = this.getNodeState(node);
    if (!state) {
      console.warn('ไม่พบสถานะของ Node สำหรับ setOriginalBounds');
      return false;
    }

    state.originalBounds = { ...bounds };
    return true;
  }

  /**
   * ตั้งค่า bounds ของ Node ในสถานะ collapsed
   * @param node - Container ของ Node
   * @param bounds - ขนาด bounds ในสถานะ collapsed
   * @returns true ถ้าสำเร็จ, false ถ้าไม่พบ Node
   */
  setCollapsedBounds(node: Container, bounds: { width: number; height: number }): boolean {
    const state = this.getNodeState(node);
    if (!state) {
      console.warn('ไม่พบสถานะของ Node สำหรับ setCollapsedBounds');
      return false;
    }

    state.collapsedBounds = { ...bounds };
    return true;
  }

  /**
   * ได้ bounds ปัจจุบันของ Node ตามสถานะ
   * @param node - Container ของ Node
   * @returns bounds ปัจจุบัน หรือ null ถ้าไม่พบ
   */
  getCurrentBounds(node: Container): { width: number; height: number } | null {
    const state = this.getNodeState(node);
    if (!state) {
      return null;
    }

    if (state.isCollapsed && state.collapsedBounds) {
      return { ...state.collapsedBounds };
    } else if (state.originalBounds) {
      return { ...state.originalBounds };
    }

    return null;
  }

  // === Utility Methods ===

  /**
   * ลบสถานะของ Node
   * @param node - Container ของ Node
   * @returns true ถ้าสำเร็จ, false ถ้าไม่พบ Node
   */
  removeNodeState(node: Container): boolean {
    const hasState = this.nodeStates.has(node);
    if (hasState) {
      this.nodeStates.delete(node);
      console.log('🗑️ ลบสถานะของ Node:', node);
    }
    return hasState;
  }

  /**
   * ได้จำนวน Node ทั้งหมดที่มีสถานะ
   * @returns จำนวน Node
   */
  getNodeCount(): number {
    return this.nodeStates.size;
  }

  /**
   * ได้ Array ของ Node ทั้งหมดที่มีสถานะ
   * @returns Array ของ Container
   */
  getAllNodes(): Container[] {
    return Array.from(this.nodeStates.keys());
  }

  /**
   * ล้างสถานะทั้งหมด
   */
  clearAllStates(): void {
    const nodeCount = this.nodeStates.size;
    this.nodeStates.clear();
    this.propertyIdCounter = 0;
    console.log(`🧹 ล้างสถานะของ ${nodeCount} Node(s)`);
  }

  // === Private Helper Methods ===

  /**
   * ซิงค์ Properties จาก NodeState ไปยัง nodeData ใน Container
   * @param node - Container ของ Node
   */
  private syncPropertiesToNodeData(node: Container): void {
    const state = this.getNodeState(node);
    if (!state) return;

    // อัปเดต nodeData ใน Container
    const nodeData = (node as any).nodeData || {};
    nodeData.properties = Array.from(state.properties.values());
    (node as any).nodeData = nodeData;
  }

  /**
   * ส่ง Custom Event เมื่อสถานะของ Node เปลี่ยนแปลง
   * @param node - Container ของ Node
   * @param changeType - ประเภทของการเปลี่ยนแปลง
   * @param details - รายละเอียดเพิ่มเติม
   */
  private dispatchNodeStateChangeEvent(node: Container, changeType: string, details: any): void {
    const event = new CustomEvent('node-state-changed', {
      detail: {
        node: node,
        changeType: changeType,
        ...details
      }
    });
    window.dispatchEvent(event);
  }
}

// สร้าง instance เดียวสำหรับใช้ทั่วทั้งแอปพลิเคชัน (Singleton pattern)
export const nodeStateManager = new NodeStateManager();