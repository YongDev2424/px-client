// src/stores/selectionState.ts

import { createStore } from 'zustand/vanilla';
import { Container, Graphics, FederatedPointerEvent } from 'pixi.js';

/**
 * Interface สำหรับ Selectable Element
 */
export interface SelectableElement {
  container: Container;
  nodeId: string; // เพิ่ม nodeId สำหรับ tracking
  onSelect?: () => void;
  onDeselect?: () => void;
  isSelected: boolean;
}

/**
 * Selection State Store Interface
 */
interface SelectionStateStore {
  // State
  selectedElements: Map<string, SelectableElement>;
  selectionIndicators: Map<string, Graphics>;
  
  // Actions - Selection Management
  selectElement: (element: SelectableElement) => void;
  deselectElement: (element: SelectableElement) => void;
  toggleSelection: (element: SelectableElement) => void;
  deselectAll: () => void;
  
  // Actions - Query
  isSelected: (element: SelectableElement) => boolean;
  getSelectedElements: () => SelectableElement[];
  getSelectedCount: () => number;
  
  // Actions - Visual Indicators
  createSelectionIndicator: (element: SelectableElement) => void;
  removeSelectionIndicator: (element: SelectableElement) => void;
  updateAllIndicators: () => void;
  
  // Actions - Enhanced Node Support
  updateSelectableForEnhancedNode: (container: Container) => void;
  isEnhancedNode: (container: Container) => boolean;
  getSelectableElement: (container: Container) => SelectableElement | null;
  
  // Utility Actions
  destroy: () => void;
}

/**
 * Helper function สำหรับสร้าง selection indicator
 */
function createIndicatorGraphics(container: Container): Graphics {
  const localBounds = container.getLocalBounds();
  const padding = 8;

  const indicator = new Graphics()
    .rect(
      localBounds.x - padding,
      localBounds.y - padding,
      localBounds.width + (padding * 2),
      localBounds.height + (padding * 2)
    )
    .stroke({
      width: 3,
      color: 0x007AFF, // สีน้ำเงิน iOS style
      alpha: 0.8
    });

  container.addChild(indicator);
  return indicator;
}

/**
 * Zustand store สำหรับจัดการ Selection
 */
export const useSelectionState = createStore<SelectionStateStore>((set, get) => ({
  // Initial State
  selectedElements: new Map(),
  selectionIndicators: new Map(),

  // === Selection Management ===
  selectElement: (element: SelectableElement) => {
    const { selectedElements, createSelectionIndicator } = get();
    
    if (selectedElements.has(element.nodeId)) {
      return; // ถูก select อยู่แล้ว
    }

    // เพิ่มเข้าใน selection set
    set((state) => {
      const newSelected = new Map(state.selectedElements);
      const updatedElement = { ...element, isSelected: true };
      newSelected.set(element.nodeId, updatedElement);
      return { selectedElements: newSelected };
    });

    // สร้าง visual indicator
    createSelectionIndicator(element);

    // เรียก callback ถ้ามี
    element.onSelect?.();

    console.log('✅ Selected element:', element.nodeId);
  },

  deselectElement: (element: SelectableElement) => {
    const { selectedElements, removeSelectionIndicator } = get();
    
    if (!selectedElements.has(element.nodeId)) {
      return; // ไม่ได้ถูก select อยู่
    }

    // ลบออกจาก selection set
    set((state) => {
      const newSelected = new Map(state.selectedElements);
      newSelected.delete(element.nodeId);
      return { selectedElements: newSelected };
    });

    // ลบ visual indicator
    removeSelectionIndicator(element);

    // เรียก callback ถ้ามี
    element.onDeselect?.();

    console.log('❌ Deselected element:', element.nodeId);
  },

  toggleSelection: (element: SelectableElement) => {
    const { selectedElements, selectElement, deselectElement } = get();
    
    if (selectedElements.has(element.nodeId)) {
      deselectElement(element);
    } else {
      selectElement(element);
    }
  },

  deselectAll: () => {
    const { selectedElements, deselectElement } = get();
    const elementsToDeselect = Array.from(selectedElements.values());

    elementsToDeselect.forEach(element => {
      deselectElement(element);
    });

    // ซ่อน toolbar action buttons เมื่อไม่มี element ถูกเลือก
    if (elementsToDeselect.length > 0) {
      if ((window as any).toolbarActionButtons) {
        (window as any).toolbarActionButtons.hide();
      }
    }

    // Dispatch event for ComponentTree sync
    if (elementsToDeselect.length > 0) {
      const event = new CustomEvent('selection-cleared');
      window.dispatchEvent(event);
    }

    console.log('🔄 Deselected all elements');
  },

  // === Query Methods ===
  isSelected: (element: SelectableElement) => {
    const { selectedElements } = get();
    return selectedElements.has(element.nodeId);
  },

  getSelectedElements: () => {
    const { selectedElements } = get();
    return Array.from(selectedElements.values());
  },

  getSelectedCount: () => {
    const { selectedElements } = get();
    return selectedElements.size;
  },

  // === Visual Indicators ===
  createSelectionIndicator: (element: SelectableElement) => {
    const { selectionIndicators, removeSelectionIndicator } = get();
    
    // ลบ indicator เก่าถ้ามี
    removeSelectionIndicator(element);

    // สร้าง indicator ใหม่
    const indicator = createIndicatorGraphics(element.container);

    // เก็บ reference
    set((state) => {
      const newIndicators = new Map(state.selectionIndicators);
      newIndicators.set(element.nodeId, indicator);
      return { selectionIndicators: newIndicators };
    });
  },

  removeSelectionIndicator: (element: SelectableElement) => {
    const { selectionIndicators } = get();
    const indicator = selectionIndicators.get(element.nodeId);
    
    if (indicator && indicator.parent) {
      indicator.parent.removeChild(indicator);
      indicator.destroy();
    }

    set((state) => {
      const newIndicators = new Map(state.selectionIndicators);
      newIndicators.delete(element.nodeId);
      return { selectionIndicators: newIndicators };
    });
  },

  updateAllIndicators: () => {
    const { selectedElements, createSelectionIndicator } = get();
    
    selectedElements.forEach(element => {
      createSelectionIndicator(element);
    });
  },

  // === Enhanced Node Support ===
  updateSelectableForEnhancedNode: (container: Container) => {
    const selectableElement = (container as any).selectableElement as SelectableElement;
    if (!selectableElement) {
      console.warn('Container is not selectable, cannot update for enhanced node');
      return;
    }

    const nodeEnhancer = (container as any).nodeEnhancer;
    if (!nodeEnhancer) {
      console.warn('Container does not have NodeEnhancer, cannot update');
      return;
    }

    // เก็บ original callbacks
    const originalOnSelect = selectableElement.onSelect;
    const originalOnDeselect = selectableElement.onDeselect;

    // สร้าง enhanced callbacks
    selectableElement.onSelect = () => {
      // เรียก original callback ก่อน (ถ้ามี)
      if (originalOnSelect) {
        originalOnSelect();
      }

      // จัดการ action buttons สำหรับ enhanced nodes
      const actionButtons = nodeEnhancer.getActionButtons?.();
      if (actionButtons) {
        actionButtons.show();
        console.log('🎯 Enhanced node selected - showing action buttons');
      }

      // ส่ง enhanced selection event
      const event = new CustomEvent('pixi-selection-change', {
        detail: {
          container: container,
          action: 'select',
          isEnhanced: true
        }
      });
      window.dispatchEvent(event);
    };

    selectableElement.onDeselect = () => {
      // เรียก original callback ก่อน (ถ้ามี)
      if (originalOnDeselect) {
        originalOnDeselect();
      }

      // จัดการ action buttons สำหรับ enhanced nodes
      const actionButtons = nodeEnhancer.getActionButtons?.();
      if (actionButtons) {
        actionButtons.hide();
        console.log('⭕ Enhanced node deselected - hiding action buttons');
      }

      // ส่ง enhanced deselection event
      const event = new CustomEvent('pixi-selection-change', {
        detail: {
          container: container,
          action: 'deselect',
          isEnhanced: true
        }
      });
      window.dispatchEvent(event);
    };

    console.log('🔄 Updated SelectableElement for enhanced node');
  },

  isEnhancedNode: (container: Container) => {
    return !!(container as any).nodeEnhancer;
  },

  getSelectableElement: (container: Container) => {
    return (container as any).selectableElement || null;
  },

  // === Utility ===
  destroy: () => {
    const { selectedElements, selectionIndicators, deselectAll } = get();
    
    // Deselect ทุก elements
    deselectAll();

    // ลบ indicators ทั้งหมด
    selectionIndicators.forEach((indicator) => {
      if (indicator.parent) {
        indicator.parent.removeChild(indicator);
        indicator.destroy();
      }
    });

    // ล้าง state
    set({
      selectedElements: new Map(),
      selectionIndicators: new Map()
    });

    console.log('🗑️ Selection Store destroyed');
  }
}));

/**
 * Map สำหรับเก็บ Container -> SelectableElement mapping
 */
const containerElementMap = new Map<Container, SelectableElement>();
let elementIdCounter = 0;

/**
 * Helper function สำหรับเพิ่ม selection capability ให้กับ Container
 * @param container - Container ที่ต้องการทำให้ selectable
 * @param options - ตัวเลือกการตั้งค่า
 * @returns SelectableElement object
 */
export function makeSelectable(
  container: Container,
  options: {
    onSelect?: () => void;
    onDeselect?: () => void;
    selectOnClick?: boolean;
  } = {}
): SelectableElement {
  // ตรวจสอบว่า container นี้เป็น selectable อยู่แล้วหรือไม่
  const existingElement = containerElementMap.get(container);
  if (existingElement) {
    return existingElement;
  }

  // สร้าง nodeId สำหรับ element นี้
  const nodeId = `element_${++elementIdCounter}`;

  // สร้าง selection callbacks
  const enhancedOnSelect = () => {
    // เรียก original callback ก่อน
    options.onSelect?.();

    // แสดง toolbar action buttons สำหรับ C4Box
    const isC4Box = (container as any).nodeData && (container as any).nodeData.nodeType === 'c4box';
    if (isC4Box) {
      // ใช้ global reference แทน dynamic import
      if ((window as any).toolbarActionButtons) {
        (window as any).toolbarActionButtons.show(container);
        console.log('🎯 C4Box selected - showing toolbar action buttons');
      } else {
        console.warn('⚠️ ToolbarActionButtons not available');
      }
    }

    // ส่ง selection event
    const event = new CustomEvent('pixi-selection-change', {
      detail: {
        container: container,
        action: 'select',
        isC4Box: isC4Box
      }
    });
    window.dispatchEvent(event);
  };

  const enhancedOnDeselect = () => {
    // เรียก original callback ก่อน
    options.onDeselect?.();

    // ซ่อน toolbar action buttons สำหรับ C4Box
    const isC4Box = (container as any).nodeData && (container as any).nodeData.nodeType === 'c4box';
    if (isC4Box) {
      // ใช้ global reference แทน dynamic import
      if ((window as any).toolbarActionButtons) {
        (window as any).toolbarActionButtons.hide();
        console.log('⭕ C4Box deselected - hiding toolbar action buttons');
      }
    }

    // ส่ง deselection event
    const event = new CustomEvent('pixi-selection-change', {
      detail: {
        container: container,
        action: 'deselect',
        isC4Box: isC4Box
      }
    });
    window.dispatchEvent(event);
  };

  const element: SelectableElement = {
    container,
    nodeId,
    onSelect: enhancedOnSelect,
    onDeselect: enhancedOnDeselect,
    isSelected: false
  };

  // เพิ่ม click handler ถ้าต้องการ
  if (options.selectOnClick !== false) { // default = true
    container.on('pointerdown', (event: FederatedPointerEvent) => {
      event.stopPropagation();
      useSelectionState.getState().toggleSelection(element);
    });
  }

  // เก็บ mapping
  containerElementMap.set(container, element);
  
  // เก็บ reference ใน container metadata
  (container as any).selectableElement = element;

  return element;
}

/**
 * ลบ SelectableElement ของ Container
 */
export function removeSelectable(container: Container): void {
  const element = containerElementMap.get(container);
  if (element) {
    // Deselect ถ้าถูกเลือกอยู่
    if (element.isSelected) {
      useSelectionState.getState().deselectElement(element);
    }
    
    // ลบ mapping
    containerElementMap.delete(container);
    delete (container as any).selectableElement;
  }
}

/**
 * Compatibility wrapper object สำหรับใช้แทน SelectionManager class
 * ช่วยให้โค้ดเดิมที่ใช้ selectionManager.method() ยังทำงานได้
 */
export const selectionManager = {
  selectElement: (element: SelectableElement) => {
    useSelectionState.getState().selectElement(element);
  },

  deselectElement: (element: SelectableElement) => {
    useSelectionState.getState().deselectElement(element);
  },

  toggleSelection: (element: SelectableElement) => {
    useSelectionState.getState().toggleSelection(element);
  },

  deselectAll: () => {
    useSelectionState.getState().deselectAll();
  },

  isSelected: (element: SelectableElement) => {
    return useSelectionState.getState().isSelected(element);
  },

  getSelectedElements: () => {
    return useSelectionState.getState().getSelectedElements();
  },

  getSelectedCount: () => {
    return useSelectionState.getState().getSelectedCount();
  },

  updateAllIndicators: () => {
    useSelectionState.getState().updateAllIndicators();
  },

  updateSelectableForEnhancedNode: (container: Container) => {
    useSelectionState.getState().updateSelectableForEnhancedNode(container);
  },

  isEnhancedNode: (container: Container) => {
    return useSelectionState.getState().isEnhancedNode(container);
  },

  getSelectableElement: (container: Container) => {
    return useSelectionState.getState().getSelectableElement(container);
  },

  destroy: () => {
    containerElementMap.clear();
    elementIdCounter = 0;
    useSelectionState.getState().destroy();
  }
};