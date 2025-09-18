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

    // คำนวณ bounds ของ container
    const bounds = container.getBounds();
    const padding = 8; // ระยะห่างจากขอบ

    // สร้าง selection indicator (เส้นขอบสีน้ำเงิน)
    const indicator = new Graphics()
      .rect(
        bounds.x - container.x - padding,
        bounds.y - container.y - padding,
        bounds.width + (padding * 2),
        bounds.height + (padding * 2)
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
  const element: SelectableElement = {
    container,
    onSelect: options.onSelect,
    onDeselect: options.onDeselect,
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