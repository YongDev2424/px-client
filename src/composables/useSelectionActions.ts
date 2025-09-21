// src/composables/useSelectionActions.ts

import { Container } from 'pixi.js';
import { useSelectionState, makeSelectable, removeSelectable } from '../stores/selectionState';
import type { SelectableElement } from '../stores/selectionState';

/**
 * Composable function สำหรับการจัดการ Selection actions
 * @returns Object ที่มี actions สำหรับจัดการ Selection
 */
export function useSelectionActions() {
  const {
    selectElement,
    deselectElement,
    toggleSelection,
    deselectAll,
    isSelected,
    getSelectedElements,
    getSelectedCount,
    updateAllIndicators
  } = useSelectionState.getState();

  return {
    // === Selection Management ===
    /**
     * เลือก Element
     */
    select: (element: SelectableElement) => {
      selectElement(element);
    },

    /**
     * ยกเลิกการเลือก Element
     */
    deselect: (element: SelectableElement) => {
      deselectElement(element);
    },

    /**
     * สลับการเลือก Element
     */
    toggle: (element: SelectableElement) => {
      toggleSelection(element);
    },

    /**
     * ยกเลิกการเลือกทั้งหมด
     */
    clear: () => {
      deselectAll();
    },

    /**
     * เลือก Container โดยตรง (จะหา SelectableElement อัตโนมัติ)
     */
    selectContainer: (container: Container) => {
      const element = (container as any).selectableElement as SelectableElement;
      if (element) {
        selectElement(element);
      } else {
        console.warn('Container is not selectable');
      }
    },

    /**
     * ยกเลิกการเลือก Container โดยตรง
     */
    deselectContainer: (container: Container) => {
      const element = (container as any).selectableElement as SelectableElement;
      if (element) {
        deselectElement(element);
      }
    },

    /**
     * สลับการเลือก Container โดยตรง
     */
    toggleContainer: (container: Container) => {
      const element = (container as any).selectableElement as SelectableElement;
      if (element) {
        toggleSelection(element);
      } else {
        console.warn('Container is not selectable');
      }
    },

    // === Query Methods ===
    /**
     * ตรวจสอบว่า Element ถูกเลือกหรือไม่
     */
    isSelected: (element: SelectableElement) => {
      return isSelected(element);
    },

    /**
     * ตรวจสอบว่า Container ถูกเลือกหรือไม่
     */
    isContainerSelected: (container: Container) => {
      const element = (container as any).selectableElement as SelectableElement;
      return element ? isSelected(element) : false;
    },

    /**
     * ได้ Elements ที่ถูกเลือกทั้งหมด
     */
    getSelected: () => {
      return getSelectedElements();
    },

    /**
     * ได้ Containers ที่ถูกเลือกทั้งหมด
     */
    getSelectedContainers: () => {
      return getSelectedElements().map((element: SelectableElement) => element.container);
    },

    /**
     * ได้จำนวน Elements ที่ถูกเลือก
     */
    getCount: () => {
      return getSelectedCount();
    },

    /**
     * ตรวจสอบว่ามีการเลือกอะไรอยู่หรือไม่
     */
    hasSelection: () => {
      return getSelectedCount() > 0;
    },

    /**
     * ตรวจสอบว่าเลือกหลาย Elements หรือไม่
     */
    hasMultipleSelection: () => {
      return getSelectedCount() > 1;
    },

    // === Visual Management ===
    /**
     * อัปเดต visual indicators ทั้งหมด
     */
    updateIndicators: () => {
      updateAllIndicators();
    },

    // === Helper Functions ===
    /**
     * สร้าง SelectableElement จาก Container
     */
    makeSelectable: (
      container: Container,
      options?: {
        onSelect?: () => void;
        onDeselect?: () => void;
        selectOnClick?: boolean;
      }
    ) => {
      return makeSelectable(container, options);
    },

    /**
     * ลบ SelectableElement ของ Container
     */
    removeSelectable: (container: Container) => {
      removeSelectable(container);
    }
  };
}

/**
 * Hook สำหรับการจัดการ selection ของ Container ระบุ
 * @param container - Container ที่ต้องการจัดการ
 * @returns Object ที่มี actions เฉพาะสำหรับ Container นี้
 */
export function useContainerSelection(container: Container) {
  const selectionActions = useSelectionActions();

  // ได้ SelectableElement ของ Container นี้
  const element = (container as any).selectableElement as SelectableElement;

  return {
    // === Container-specific Actions ===
    /**
     * เลือก Container นี้
     */
    select: () => {
      if (element) {
        selectionActions.select(element);
      } else {
        console.warn('Container is not selectable');
      }
    },

    /**
     * ยกเลิกการเลือก Container นี้
     */
    deselect: () => {
      if (element) {
        selectionActions.deselect(element);
      }
    },

    /**
     * สลับการเลือก Container นี้
     */
    toggle: () => {
      if (element) {
        selectionActions.toggle(element);
      } else {
        console.warn('Container is not selectable');
      }
    },

    /**
     * ตรวจสอบว่า Container นี้ถูกเลือกหรือไม่
     */
    isSelected: () => {
      return element ? selectionActions.isSelected(element) : false;
    },

    /**
     * ตรวจสอบว่า Container นี้เป็น selectable หรือไม่
     */
    isSelectable: () => {
      return !!element;
    },

    /**
     * ได้ SelectableElement ของ Container นี้
     */
    getElement: () => {
      return element;
    },

    /**
     * ทำให้ Container นี้เป็น selectable
     */
    makeSelectable: (options?: {
      onSelect?: () => void;
      onDeselect?: () => void;
      selectOnClick?: boolean;
    }) => {
      return selectionActions.makeSelectable(container, options);
    },

    /**
     * ลบ selectable capability ของ Container นี้
     */
    removeSelectable: () => {
      selectionActions.removeSelectable(container);
    }
  };
}

/**
 * Hook สำหรับ reactive selection state
 * ใช้เมื่อต้องการให้ component react ต่อการเปลี่ยนแปลงของ selection
 */
export function useSelectionStateReactive() {
  // Subscribe ต่อ store state
  const selectedElements = useSelectionState.getState().selectedElements;
  const selectedCount = useSelectionState.getState().selectedElements.size;

  const selectedList = Array.from(selectedElements.values());

  return {
    selectedElements: selectedList,
    selectedContainers: selectedList.map(el => el.container),
    selectedCount,
    hasSelection: selectedCount > 0,
    hasMultipleSelection: selectedCount > 1,
    
    // Helper methods for common checks
    isAnyC4BoxSelected: () => {
      return selectedList.some(el => 
        (el.container as any).nodeData?.nodeType === 'c4box'
      );
    },
    
    isAnyEnhancedNodeSelected: () => {
      return selectedList.some(el => 
        !!(el.container as any).nodeEnhancer
      );
    },
    
    getSelectedNodeTypes: () => {
      return selectedList.map(el => 
        (el.container as any).nodeData?.nodeType || 'unknown'
      );
    }
  };
}

/**
 * Hook สำหรับการจัดการ multi-selection actions
 */
export function useMultiSelectionActions() {
  const selectionActions = useSelectionActions();
  const selectionState = useSelectionStateReactive();

  return {
    /**
     * เลือกทุก Containers ใน array
     */
    selectMultiple: (containers: Container[]) => {
      containers.forEach(container => {
        selectionActions.selectContainer(container);
      });
    },

    /**
     * ยกเลิกการเลือกทุก Containers ใน array
     */
    deselectMultiple: (containers: Container[]) => {
      containers.forEach(container => {
        selectionActions.deselectContainer(container);
      });
    },

    /**
     * เลือกทุก Containers ที่ตรงตาม predicate function
     */
    selectWhere: (predicate: (container: Container) => boolean, allContainers: Container[]) => {
      allContainers
        .filter(predicate)
        .forEach(container => {
          selectionActions.selectContainer(container);
        });
    },

    /**
     * เลือกทุก C4Box nodes
     */
    selectAllC4Boxes: (allContainers: Container[]) => {
      allContainers
        .filter(container => (container as any).nodeData?.nodeType === 'c4box')
        .forEach(container => {
          selectionActions.selectContainer(container);
        });
    },

    /**
     * ยกเลิกการเลือกทุก C4Box nodes
     */
    deselectAllC4Boxes: () => {
      selectionState.selectedContainers
        .filter(container => (container as any).nodeData?.nodeType === 'c4box')
        .forEach(container => {
          selectionActions.deselectContainer(container);
        });
    },

    // Expose selection state for convenience
    ...selectionState
  };
}