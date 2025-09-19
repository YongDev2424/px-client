// src/composables/useNodeActions.ts

import { Container } from 'pixi.js';
import { useNodeState, PropertyValue, getNodeId } from '../stores/nodeState';

/**
 * Composable function สำหรับการจัดการ Node actions
 * @param container - PixiJS Container ของ Node
 * @returns Object ที่มี actions สำหรับจัดการ Node
 */
export function useNodeActions(container: Container) {
  const nodeId = getNodeId(container);
  
  // ได้ actions จาก store
  const {
    initializeNodeState,
    getNodeState,
    setCollapsed,
    toggleCollapse,
    isCollapsed,
    setEditing,
    isEditing,
    addProperty,
    removeProperty,
    updateProperty,
    getProperties,
    hasProperty,
    setActionButtonsVisible,
    areActionButtonsVisible,
    setOriginalBounds,
    setCollapsedBounds,
    getCurrentBounds
  } = useNodeState();

  return {
    // === Node State Management ===
    /**
     * เริ่มต้นสถานะของ Node
     */
    initialize: (initialState?: Partial<any>) => {
      return initializeNodeState(nodeId, initialState);
    },

    /**
     * ได้สถานะปัจจุบันของ Node
     */
    getState: () => {
      return getNodeState(nodeId);
    },

    // === Collapse/Expand Actions ===
    /**
     * กำหนดสถานะ collapsed
     */
    setCollapsed: (collapsed: boolean) => {
      return setCollapsed(nodeId, collapsed);
    },

    /**
     * สลับสถานะ collapse/expand
     */
    toggle: () => {
      return toggleCollapse(nodeId);
    },

    /**
     * ตรวจสอบว่า Node ถูก collapse หรือไม่
     */
    isCollapsed: () => {
      return isCollapsed(nodeId);
    },

    /**
     * Expand Node
     */
    expand: () => {
      return setCollapsed(nodeId, false);
    },

    /**
     * Collapse Node
     */
    collapse: () => {
      return setCollapsed(nodeId, true);
    },

    // === Editing Actions ===
    /**
     * เข้าสู่โหมด editing
     */
    startEditing: () => {
      return setEditing(nodeId, true);
    },

    /**
     * ออกจากโหมด editing
     */
    stopEditing: () => {
      return setEditing(nodeId, false);
    },

    /**
     * สลับโหมด editing
     */
    toggleEditing: () => {
      const currentlyEditing = isEditing(nodeId);
      return setEditing(nodeId, !currentlyEditing);
    },

    /**
     * ตรวจสอบว่ากำลัง editing หรือไม่
     */
    isEditing: () => {
      return isEditing(nodeId);
    },

    // === Property Actions ===
    /**
     * เพิ่ม Property ใหม่
     */
    addProperty: (property: PropertyValue) => {
      return addProperty(nodeId, property);
    },

    /**
     * ลบ Property
     */
    removeProperty: (key: string) => {
      return removeProperty(nodeId, key);
    },

    /**
     * อัปเดต Property
     */
    updateProperty: (key: string, newValue: string, newType?: PropertyValue['type']) => {
      return updateProperty(nodeId, key, newValue, newType);
    },

    /**
     * ได้ Properties ทั้งหมด
     */
    getProperties: () => {
      return getProperties(nodeId);
    },

    /**
     * ตรวจสอบว่ามี Property key นี้หรือไม่
     */
    hasProperty: (key: string) => {
      return hasProperty(nodeId, key);
    },

    // === Action Buttons Actions ===
    /**
     * แสดง Action Buttons
     */
    showActionButtons: () => {
      return setActionButtonsVisible(nodeId, true);
    },

    /**
     * ซ่อน Action Buttons
     */
    hideActionButtons: () => {
      return setActionButtonsVisible(nodeId, false);
    },

    /**
     * สลับการแสดง Action Buttons
     */
    toggleActionButtons: () => {
      const currentlyVisible = areActionButtonsVisible(nodeId);
      return setActionButtonsVisible(nodeId, !currentlyVisible);
    },

    /**
     * ตรวจสอบว่า Action Buttons แสดงอยู่หรือไม่
     */
    areActionButtonsVisible: () => {
      return areActionButtonsVisible(nodeId);
    },

    // === Bounds Actions ===
    /**
     * กำหนด bounds เดิมของ Node (ก่อน collapse)
     */
    setOriginalBounds: (bounds: { width: number; height: number }) => {
      return setOriginalBounds(nodeId, bounds);
    },

    /**
     * กำหนด bounds ของ Node เมื่อ collapsed
     */
    setCollapsedBounds: (bounds: { width: number; height: number }) => {
      return setCollapsedBounds(nodeId, bounds);
    },

    /**
     * ได้ bounds ปัจจุบันตามสถานะ
     */
    getCurrentBounds: () => {
      return getCurrentBounds(nodeId);
    },

    // === Utility ===
    /**
     * ได้ NodeId ของ Container นี้
     */
    getNodeId: () => {
      return nodeId;
    },

    /**
     * ได้ Container reference
     */
    getContainer: () => {
      return container;
    }
  };
}

/**
 * Batch actions สำหรับจัดการหลาย Nodes พร้อมกัน
 */
export function useNodeBatchActions() {
  const {
    exitAllEditingModes,
    clearAllStates,
    getNodeCount,
    getAllNodeIds
  } = useNodeState();

  return {
    /**
     * ยกเลิกโหมด editing ของทุก Node ยกเว้นที่ระบุ
     */
    exitAllEditingModes: (excludeContainer?: Container) => {
      const excludeNodeId = excludeContainer ? getNodeId(excludeContainer) : undefined;
      return exitAllEditingModes(excludeNodeId);
    },

    /**
     * ล้างสถานะของทุก Node
     */
    clearAllStates: () => {
      return clearAllStates();
    },

    /**
     * ได้จำนวน Node ทั้งหมด
     */
    getNodeCount: () => {
      return getNodeCount();
    },

    /**
     * ได้รายการ NodeId ทั้งหมด
     */
    getAllNodeIds: () => {
      return getAllNodeIds();
    },

    /**
     * สร้าง Property ใหม่พร้อม default values
     */
    createProperty: (key: string, value: string, type: PropertyValue['type'] = 'text'): PropertyValue => {
      return {
        key,
        value,
        type,
        id: '', // จะถูกสร้างใน store
        order: Date.now() // ใช้ timestamp เป็น order
      };
    }
  };
}

/**
 * Hook สำหรับ reactive state updates
 * ใช้เมื่อต้องการให้ component react ต่อการเปลี่ยนแปลงของ Node state
 */
export function useNodeStateReactive(container: Container) {
  const nodeId = getNodeId(container);
  
  // Subscribe ต่อ store state
  const nodeState = useNodeState.getState().nodeStates.get(nodeId);
  
  return {
    nodeState,
    exists: !!nodeState,
    isCollapsed: nodeState?.isCollapsed || false,
    isEditing: nodeState?.isEditing || false,
    actionButtonsVisible: nodeState?.actionButtonsVisible || false,
    properties: nodeState ? Array.from(nodeState.properties.values()) : [],
    propertyCount: nodeState?.properties.size || 0
  };
}