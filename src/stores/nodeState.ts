// src/stores/nodeState.ts

import { createStore } from 'zustand/vanilla';
import { Container } from 'pixi.js';

/**
 * Interface สำหรับค่าของ Property
 */
export interface PropertyValue {
  key: string;
  value: string;
  type: 'text' | 'number' | 'boolean';
  id: string;
  order: number;
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
 * Store state interface
 */
interface NodeStateStore {
  // State
  nodeStates: Map<string, NodeState>;
  propertyIdCounter: number;
  
  // Actions - Node Management
  initializeNodeState: (nodeId: string, initialState?: Partial<NodeState>) => NodeState;
  getNodeState: (nodeId: string) => NodeState | null;
  hasNodeState: (nodeId: string) => boolean;
  removeNodeState: (nodeId: string) => boolean;
  
  // Actions - Collapse/Expand
  setCollapsed: (nodeId: string, collapsed: boolean) => boolean;
  toggleCollapse: (nodeId: string) => boolean | null;
  isCollapsed: (nodeId: string) => boolean;
  
  // Actions - Editing
  setEditing: (nodeId: string, editing: boolean) => boolean;
  isEditing: (nodeId: string) => boolean;
  exitAllEditingModes: (excludeNodeId?: string) => void;
  
  // Actions - Properties
  addProperty: (nodeId: string, property: PropertyValue) => boolean;
  removeProperty: (nodeId: string, key: string) => boolean;
  updateProperty: (nodeId: string, key: string, newValue: string, newType?: PropertyValue['type']) => boolean;
  getProperties: (nodeId: string) => PropertyValue[];
  getPropertyCount: (nodeId: string) => number;
  hasProperty: (nodeId: string, key: string) => boolean;
  
  // Actions - Action Buttons
  setActionButtonsVisible: (nodeId: string, visible: boolean) => boolean;
  areActionButtonsVisible: (nodeId: string) => boolean;
  
  // Actions - Bounds
  setOriginalBounds: (nodeId: string, bounds: { width: number; height: number }) => boolean;
  setCollapsedBounds: (nodeId: string, bounds: { width: number; height: number }) => boolean;
  getCurrentBounds: (nodeId: string) => { width: number; height: number } | null;
  
  // Utility Actions
  getNodeCount: () => number;
  getAllNodeIds: () => string[];
  clearAllStates: () => void;
}

/**
 * Helper function สำหรับ dispatch events
 */
function dispatchNodeStateChangeEvent(nodeId: string, changeType: string, details: any): void {
  const event = new CustomEvent('node-state-changed', {
    detail: {
      nodeId: nodeId,
      changeType: changeType,
      ...details
    }
  });
  window.dispatchEvent(event);
}

/**
 * Zustand store สำหรับจัดการ Node States
 */
export const useNodeState = createStore<NodeStateStore>((set, get) => ({
  // Initial State
  nodeStates: new Map(),
  propertyIdCounter: 0,

  // === Node Management ===
  initializeNodeState: (nodeId: string, initialState?: Partial<NodeState>) => {
    const { nodeStates } = get();
    
    // ถ้ามีสถานะอยู่แล้ว ให้คืนสถานะเดิม
    const existingState = nodeStates.get(nodeId);
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

    set((state) => ({
      nodeStates: new Map(state.nodeStates).set(nodeId, defaultState)
    }));

    console.log('🔧 เริ่มต้นสถานะ Node:', nodeId);
    return defaultState;
  },

  getNodeState: (nodeId: string) => {
    const { nodeStates } = get();
    return nodeStates.get(nodeId) || null;
  },

  hasNodeState: (nodeId: string) => {
    const { nodeStates } = get();
    return nodeStates.has(nodeId);
  },

  removeNodeState: (nodeId: string) => {
    const { nodeStates } = get();
    const hasState = nodeStates.has(nodeId);
    
    if (hasState) {
      set((state) => {
        const newStates = new Map(state.nodeStates);
        newStates.delete(nodeId);
        return { nodeStates: newStates };
      });
      console.log('🗑️ ลบสถานะของ Node:', nodeId);
    }
    
    return hasState;
  },

  // === Collapse/Expand Management ===
  setCollapsed: (nodeId: string, collapsed: boolean) => {
    const { nodeStates } = get();
    const state = nodeStates.get(nodeId);
    
    if (!state) {
      console.warn('ไม่พบสถานะของ Node สำหรับ setCollapsed');
      return false;
    }

    const previousState = state.isCollapsed;
    
    if (previousState !== collapsed) {
      set((storeState) => {
        const newStates = new Map(storeState.nodeStates);
        const nodeState = { ...newStates.get(nodeId)! };
        nodeState.isCollapsed = collapsed;
        newStates.set(nodeId, nodeState);
        return { nodeStates: newStates };
      });

      // Dispatch event สำหรับ UI updates
      dispatchNodeStateChangeEvent(nodeId, 'collapse', {
        isCollapsed: collapsed,
        previousState: previousState
      });
      console.log(`📦 Node ${collapsed ? 'collapsed' : 'expanded'}:`, nodeId);
    }

    return true;
  },

  toggleCollapse: (nodeId: string) => {
    const { nodeStates, setCollapsed } = get();
    const state = nodeStates.get(nodeId);
    
    if (!state) {
      console.warn('ไม่พบสถานะของ Node สำหรับ toggleCollapse');
      return null;
    }

    const newState = !state.isCollapsed;
    setCollapsed(nodeId, newState);
    return newState;
  },

  isCollapsed: (nodeId: string) => {
    const { nodeStates } = get();
    const state = nodeStates.get(nodeId);
    return state?.isCollapsed || false;
  },

  // === Editing Management ===
  setEditing: (nodeId: string, editing: boolean) => {
    const { nodeStates, exitAllEditingModes } = get();
    const state = nodeStates.get(nodeId);
    
    if (!state) {
      console.warn('ไม่พบสถานะของ Node สำหรับ setEditing');
      return false;
    }

    const previousState = state.isEditing;

    // ถ้าเริ่ม editing ให้ยกเลิก editing ของ Node อื่นๆ
    if (editing && !previousState) {
      exitAllEditingModes(nodeId);
    }

    set((storeState) => {
      const newStates = new Map(storeState.nodeStates);
      const nodeState = { ...newStates.get(nodeId)! };
      nodeState.isEditing = editing;
      newStates.set(nodeId, nodeState);
      return { nodeStates: newStates };
    });

    // Dispatch event สำหรับ UI updates
    if (previousState !== editing) {
      dispatchNodeStateChangeEvent(nodeId, 'editing', {
        isEditing: editing,
        previousState: previousState
      });
      console.log(`✏️ Node ${editing ? 'เข้าสู่' : 'ออกจาก'} โหมด editing:`, nodeId);
    }

    return true;
  },

  isEditing: (nodeId: string) => {
    const { nodeStates } = get();
    const state = nodeStates.get(nodeId);
    return state?.isEditing || false;
  },

  exitAllEditingModes: (excludeNodeId?: string) => {
    const { nodeStates, setEditing } = get();
    let exitedCount = 0;

    nodeStates.forEach((state, nodeId) => {
      if (state.isEditing && nodeId !== excludeNodeId) {
        setEditing(nodeId, false);
        exitedCount++;
      }
    });

    if (exitedCount > 0) {
      console.log(`🚪 ยกเลิกโหมด editing ของ ${exitedCount} Node(s)`);
    }
  },

  // === Property Management ===
  addProperty: (nodeId: string, property: PropertyValue) => {
    const { nodeStates, propertyIdCounter } = get();
    const state = nodeStates.get(nodeId);
    
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
    const newProperty = { ...property };
    if (!newProperty.id) {
      set((storeState) => ({
        propertyIdCounter: storeState.propertyIdCounter + 1
      }));
      newProperty.id = `prop_${propertyIdCounter + 1}`;
    }

    set((storeState) => {
      const newStates = new Map(storeState.nodeStates);
      const nodeState = { ...newStates.get(nodeId)! };
      nodeState.properties = new Map(nodeState.properties);
      nodeState.properties.set(newProperty.key, newProperty);
      newStates.set(nodeId, nodeState);
      return { nodeStates: newStates };
    });

    // Dispatch event สำหรับ UI updates
    dispatchNodeStateChangeEvent(nodeId, 'property-added', {
      property: newProperty,
      propertyCount: state.properties.size + 1
    });

    console.log(`➕ เพิ่ม Property "${newProperty.key}" ให้กับ Node:`, nodeId);
    return true;
  },

  removeProperty: (nodeId: string, key: string) => {
    const { nodeStates } = get();
    const state = nodeStates.get(nodeId);
    
    if (!state) {
      console.warn('ไม่พบสถานะของ Node สำหรับ removeProperty');
      return false;
    }

    const property = state.properties.get(key);
    if (!property) {
      console.warn(`ไม่พบ Property key "${key}"`);
      return false;
    }

    set((storeState) => {
      const newStates = new Map(storeState.nodeStates);
      const nodeState = { ...newStates.get(nodeId)! };
      nodeState.properties = new Map(nodeState.properties);
      nodeState.properties.delete(key);
      newStates.set(nodeId, nodeState);
      return { nodeStates: newStates };
    });

    // Dispatch event สำหรับ UI updates
    dispatchNodeStateChangeEvent(nodeId, 'property-removed', {
      property: property,
      propertyCount: state.properties.size - 1
    });

    console.log(`➖ ลบ Property "${key}" จาก Node:`, nodeId);
    return true;
  },

  updateProperty: (nodeId: string, key: string, newValue: string, newType?: PropertyValue['type']) => {
    const { nodeStates } = get();
    const state = nodeStates.get(nodeId);
    
    if (!state) {
      console.warn('ไม่พบสถานะของ Node สำหรับ updateProperty');
      return false;
    }

    const property = state.properties.get(key);
    if (!property) {
      console.warn(`ไม่พบ Property key "${key}"`);
      return false;
    }

    const oldValue = property.value;

    set((storeState) => {
      const newStates = new Map(storeState.nodeStates);
      const nodeState = { ...newStates.get(nodeId)! };
      nodeState.properties = new Map(nodeState.properties);
      const updatedProperty = { ...property };
      updatedProperty.value = newValue;
      if (newType) {
        updatedProperty.type = newType;
      }
      nodeState.properties.set(key, updatedProperty);
      newStates.set(nodeId, nodeState);
      return { nodeStates: newStates };
    });

    // Dispatch event สำหรับ UI updates
    dispatchNodeStateChangeEvent(nodeId, 'property-updated', {
      property: { ...property, value: newValue, type: newType || property.type },
      oldValue: oldValue,
      newValue: newValue
    });

    console.log(`🔄 อัปเดต Property "${key}" ของ Node:`, nodeId);
    return true;
  },

  getProperties: (nodeId: string) => {
    const { nodeStates } = get();
    const state = nodeStates.get(nodeId);
    
    if (!state) {
      return [];
    }

    return Array.from(state.properties.values()).sort((a, b) => a.order - b.order);
  },

  getPropertyCount: (nodeId: string) => {
    const { nodeStates } = get();
    const state = nodeStates.get(nodeId);
    return state?.properties.size || 0;
  },

  hasProperty: (nodeId: string, key: string) => {
    const { nodeStates } = get();
    const state = nodeStates.get(nodeId);
    return state?.properties.has(key) || false;
  },

  // === Action Buttons Management ===
  setActionButtonsVisible: (nodeId: string, visible: boolean) => {
    const { nodeStates } = get();
    const state = nodeStates.get(nodeId);
    
    if (!state) {
      console.warn('ไม่พบสถานะของ Node สำหรับ setActionButtonsVisible');
      return false;
    }

    const previousState = state.actionButtonsVisible;

    set((storeState) => {
      const newStates = new Map(storeState.nodeStates);
      const nodeState = { ...newStates.get(nodeId)! };
      nodeState.actionButtonsVisible = visible;
      newStates.set(nodeId, nodeState);
      return { nodeStates: newStates };
    });

    // Dispatch event สำหรับ UI updates
    if (previousState !== visible) {
      dispatchNodeStateChangeEvent(nodeId, 'action-buttons', {
        visible: visible,
        previousState: previousState
      });
      console.log(`🔘 Action Buttons ${visible ? 'แสดง' : 'ซ่อน'} สำหรับ Node:`, nodeId);
    }

    return true;
  },

  areActionButtonsVisible: (nodeId: string) => {
    const { nodeStates } = get();
    const state = nodeStates.get(nodeId);
    return state?.actionButtonsVisible || false;
  },

  // === Bounds Management ===
  setOriginalBounds: (nodeId: string, bounds: { width: number; height: number }) => {
    const { nodeStates } = get();
    const state = nodeStates.get(nodeId);
    
    if (!state) {
      console.warn('ไม่พบสถานะของ Node สำหรับ setOriginalBounds');
      return false;
    }

    set((storeState) => {
      const newStates = new Map(storeState.nodeStates);
      const nodeState = { ...newStates.get(nodeId)! };
      nodeState.originalBounds = { ...bounds };
      newStates.set(nodeId, nodeState);
      return { nodeStates: newStates };
    });

    return true;
  },

  setCollapsedBounds: (nodeId: string, bounds: { width: number; height: number }) => {
    const { nodeStates } = get();
    const state = nodeStates.get(nodeId);
    
    if (!state) {
      console.warn('ไม่พบสถานะของ Node สำหรับ setCollapsedBounds');
      return false;
    }

    set((storeState) => {
      const newStates = new Map(storeState.nodeStates);
      const nodeState = { ...newStates.get(nodeId)! };
      nodeState.collapsedBounds = { ...bounds };
      newStates.set(nodeId, nodeState);
      return { nodeStates: newStates };
    });

    return true;
  },

  getCurrentBounds: (nodeId: string) => {
    const { nodeStates } = get();
    const state = nodeStates.get(nodeId);
    
    if (!state) {
      return null;
    }

    if (state.isCollapsed && state.collapsedBounds) {
      return { ...state.collapsedBounds };
    } else if (state.originalBounds) {
      return { ...state.originalBounds };
    }

    return null;
  },

  // === Utility Methods ===
  getNodeCount: () => {
    const { nodeStates } = get();
    return nodeStates.size;
  },

  getAllNodeIds: () => {
    const { nodeStates } = get();
    return Array.from(nodeStates.keys());
  },

  clearAllStates: () => {
    set({
      nodeStates: new Map(),
      propertyIdCounter: 0
    });
    console.log('🧹 ล้างสถานะทั้งหมด');
  }
}));

/**
 * Helper functions สำหรับทำงานกับ Container objects
 * รักษา compatibility กับโค้ดเดิมที่ใช้ Container instances
 */

// Map สำหรับเก็บ Container -> NodeId mapping
const containerNodeIdMap = new Map<Container, string>();
let nodeIdCounter = 0;

/**
 * ได้ NodeId จาก Container (สร้างใหม่ถ้าไม่มี)
 */
export function getNodeId(container: Container): string {
  let nodeId = containerNodeIdMap.get(container);
  
  if (!nodeId) {
    nodeId = `node_${++nodeIdCounter}`;
    containerNodeIdMap.set(container, nodeId);
    
    // เก็บ reference กลับไปใน container ด้วย
    (container as any)._nodeId = nodeId;
  }
  
  return nodeId;
}

/**
 * ได้ Container จาก NodeId
 */
export function getContainerByNodeId(nodeId: string): Container | null {
  for (const [container, id] of containerNodeIdMap.entries()) {
    if (id === nodeId) {
      return container;
    }
  }
  return null;
}

/**
 * ลบ mapping ของ Container
 */
export function removeContainerMapping(container: Container): void {
  const nodeId = containerNodeIdMap.get(container);
  if (nodeId) {
    containerNodeIdMap.delete(container);
    useNodeState.getState().removeNodeState(nodeId);
  }
}

/**
 * Compatibility wrapper functions สำหรับใช้แทน NodeStateManager class
 * ช่วยให้โค้ดเดิมที่ใช้ nodeStateManager.method() ยังทำงานได้
 */
export const nodeStateManager = {
  initializeNodeState: (container: Container, initialState?: Partial<NodeState>) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().initializeNodeState(nodeId, initialState);
  },
  
  getNodeState: (container: Container) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().getNodeState(nodeId);
  },
  
  hasNodeState: (container: Container) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().hasNodeState(nodeId);
  },
  
  setCollapsed: (container: Container, collapsed: boolean) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().setCollapsed(nodeId, collapsed);
  },
  
  toggleCollapse: (container: Container) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().toggleCollapse(nodeId);
  },
  
  isCollapsed: (container: Container) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().isCollapsed(nodeId);
  },
  
  setEditing: (container: Container, editing: boolean) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().setEditing(nodeId, editing);
  },
  
  isEditing: (container: Container) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().isEditing(nodeId);
  },
  
  exitAllEditingModes: (excludeContainer?: Container) => {
    const excludeNodeId = excludeContainer ? getNodeId(excludeContainer) : undefined;
    return useNodeState.getState().exitAllEditingModes(excludeNodeId);
  },
  
  addProperty: (container: Container, property: PropertyValue) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().addProperty(nodeId, property);
  },
  
  removeProperty: (container: Container, key: string) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().removeProperty(nodeId, key);
  },
  
  updateProperty: (container: Container, key: string, newValue: string, newType?: PropertyValue['type']) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().updateProperty(nodeId, key, newValue, newType);
  },
  
  getProperties: (container: Container) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().getProperties(nodeId);
  },
  
  getPropertyCount: (container: Container) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().getPropertyCount(nodeId);
  },
  
  hasProperty: (container: Container, key: string) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().hasProperty(nodeId, key);
  },
  
  setActionButtonsVisible: (container: Container, visible: boolean) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().setActionButtonsVisible(nodeId, visible);
  },
  
  areActionButtonsVisible: (container: Container) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().areActionButtonsVisible(nodeId);
  },
  
  setOriginalBounds: (container: Container, bounds: { width: number; height: number }) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().setOriginalBounds(nodeId, bounds);
  },
  
  setCollapsedBounds: (container: Container, bounds: { width: number; height: number }) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().setCollapsedBounds(nodeId, bounds);
  },
  
  getCurrentBounds: (container: Container) => {
    const nodeId = getNodeId(container);
    return useNodeState.getState().getCurrentBounds(nodeId);
  },
  
  removeNodeState: (container: Container) => {
    const nodeId = containerNodeIdMap.get(container);
    if (nodeId) {
      containerNodeIdMap.delete(container);
      return useNodeState.getState().removeNodeState(nodeId);
    }
    return false;
  },
  
  getNodeCount: () => {
    return useNodeState.getState().getNodeCount();
  },
  
  getAllNodes: () => {
    const nodeIds = useNodeState.getState().getAllNodeIds();
    return nodeIds.map(id => getContainerByNodeId(id)).filter(Boolean) as Container[];
  },
  
  clearAllStates: () => {
    containerNodeIdMap.clear();
    nodeIdCounter = 0;
    return useNodeState.getState().clearAllStates();
  }
};