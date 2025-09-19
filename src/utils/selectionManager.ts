// src/utils/selectionManager.ts

import { Container, FederatedPointerEvent, Graphics } from 'pixi.js';

/**
 * Interface สำหรับ Selectable Element
 */
export interface SelectableElement {
  container: Container;
  onSelect?: () => void;
  onDeselect?: () => void;
  isSelected: boolean;
}

/**
 * ระบบจัดการการ Selection ของ Elements บน Stage
 * รองรับการ select/deselect elements และการ clear selection ทั้งหมด
 */
class SelectionManager {
  private selectedElements: Set<SelectableElement> = new Set();
  private selectionIndicators: Map<Container, Graphics> = new Map();

  /**
   * เพิ่ม Element เข้าไปใน selection
   * @param element - Element ที่ต้องการ select
   */
  selectElement(element: SelectableElement): void {
    if (this.selectedElements.has(element)) {
      return; // ถูก select อยู่แล้ว
    }

    // เพิ่มเข้าใน selection set
    this.selectedElements.add(element);
    element.isSelected = true;

    // สร้าง visual indicator
    this.createSelectionIndicator(element.container);

    // เรียก callback ถ้ามี
    element.onSelect?.();

    console.log('✅ Selected element:', element.container);
  }

  /**
   * ลบ Element ออกจาก selection
   * @param element - Element ที่ต้องการ deselect
   */
  deselectElement(element: SelectableElement): void {
    if (!this.selectedElements.has(element)) {
      return; // ไม่ได้ถูก select อยู่
    }

    // ลบออกจาก selection set
    this.selectedElements.delete(element);
    element.isSelected = false;

    // ลบ visual indicator
    this.removeSelectionIndicator(element.container);

    // เรียก callback ถ้ามี
    element.onDeselect?.();

    console.log('❌ Deselected element:', element.container);
  }

  /**
   * Toggle selection state ของ Element
   * @param element - Element ที่ต้องการ toggle
   */
  toggleSelection(element: SelectableElement): void {
    if (element.isSelected) {
      this.deselectElement(element);
    } else {
      this.selectElement(element);
    }
  }

  /**
   * ยกเลิกการ select ทุก elements (ฟีเจอร์หลักที่ต้องการ)
   */
  deselectAll(): void {
    const elementsToDeselect = Array.from(this.selectedElements);

    elementsToDeselect.forEach(element => {
      this.deselectElement(element);
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
  }

  /**
   * ตรวจสอบว่า Element ถูก select หรือไม่
   * @param element - Element ที่ต้องการตรวจสอบ
   * @returns true ถ้าถูก select
   */
  isSelected(element: SelectableElement): boolean {
    return this.selectedElements.has(element);
  }

  /**
   * ได้ Array ของ elements ที่ถูก select ทั้งหมด
   * @returns Array ของ selected elements
   */
  getSelectedElements(): SelectableElement[] {
    return Array.from(this.selectedElements);
  }

  /**
   * ได้จำนวน elements ที่ถูก select
   * @returns จำนวน selected elements
   */
  getSelectedCount(): number {
    return this.selectedElements.size;
  }

  /**
   * สร้าง visual indicator สำหรับ selected element
   * @param container - Container ที่ต้องการใส่ indicator
   */
  private createSelectionIndicator(container: Container): void {
    // ลบ indicator เก่าถ้ามี
    this.removeSelectionIndicator(container);

    // คำนวณ bounds ของ container ใน local coordinates
    const localBounds = container.getLocalBounds();
    const padding = 8; // ระยะห่างจากขอบ

    // สร้าง selection indicator (เส้นขอบสีน้ำเงิน)
    // ใช้ local bounds แทน global bounds เพื่อให้ตรงตำแหน่งเมื่อ zoom
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

    // เพิ่ม indicator เข้าไปใน container
    container.addChild(indicator);

    // เก็บ reference ไว้เพื่อลบภายหลัง
    this.selectionIndicators.set(container, indicator);
  }

  /**
   * ลบ visual indicator ของ container
   * @param container - Container ที่ต้องการลบ indicator
   */
  private removeSelectionIndicator(container: Container): void {
    const indicator = this.selectionIndicators.get(container);
    if (indicator && indicator.parent) {
      indicator.parent.removeChild(indicator);
      indicator.destroy();
    }
    this.selectionIndicators.delete(container);
  }

  /**
   * อัปเดต visual indicators ทั้งหมด (เมื่อ elements เคลื่อนที่)
   */
  updateAllIndicators(): void {
    this.selectedElements.forEach(element => {
      this.createSelectionIndicator(element.container);
    });
  }

  /**
   * อัปเดต SelectableElement ที่มีอยู่แล้วให้รองรับ enhanced nodes
   * เรียกใช้เมื่อ node ถูก enhance หลังจากที่ถูกทำให้ selectable แล้ว
   * @param container - Container ที่ถูก enhance
   */
  updateSelectableForEnhancedNode(container: Container): void {
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
  }

  /**
   * ตรวจสอบว่า container เป็น enhanced node หรือไม่
   * @param container - Container ที่ต้องการตรวจสอบ
   * @returns true ถ้าเป็น enhanced node
   */
  isEnhancedNode(container: Container): boolean {
    return !!(container as any).nodeEnhancer;
  }

  /**
   * ได้ SelectableElement จาก container
   * @param container - Container ที่ต้องการหา SelectableElement
   * @returns SelectableElement หรือ null ถ้าไม่พบ
   */
  getSelectableElement(container: Container): SelectableElement | null {
    return (container as any).selectableElement || null;
  }

  /**
   * ทำความสะอาด selection manager
   */
  destroy(): void {
    // Deselect ทุก elements
    this.deselectAll();

    // ลบ indicators ทั้งหมด
    this.selectionIndicators.forEach((_indicator, container) => {
      this.removeSelectionIndicator(container);
    });

    this.selectedElements.clear();
    this.selectionIndicators.clear();

    console.log('🗑️ Selection Manager destroyed');
  }
}

// สร้าง instance เดียวสำหรับใช้ทั่วทั้งแอปพลิเคชัน (Singleton pattern)
export const selectionManager = new SelectionManager();

/**
 * Helper function สำหรับเพิ่ม selection capability ให้กับ Container
 * พร้อม ToolbarActionButtons ที่แสดงใน toolbar เมื่อเลือก
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
    onSelect: enhancedOnSelect,
    onDeselect: enhancedOnDeselect,
    isSelected: false
  };

  // เพิ่ม click handler ถ้าต้องการ
  if (options.selectOnClick !== false) { // default = true
    container.on('pointerdown', (event: FederatedPointerEvent) => {
      event.stopPropagation();
      selectionManager.toggleSelection(element);
    });
  }

  // เก็บ reference ใน container metadata
  (container as any).selectableElement = element;

  return element;
}