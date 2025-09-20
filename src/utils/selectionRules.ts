// src/utils/selectionRules.ts

import { useSelectionState } from '../stores/selectionState';

/**
 * Selection Rules ตาม Requirements 1-7
 * 
 * Requirements Summary:
 * 1. เลือก Node เดียว → แสดง edit/delete
 * 2. เลือก Edge เดียว → แสดง edit/delete  
 * 3. คลิก edit → เข้าสู่โหมด edit
 * 4. คลิก delete → แสดง confirmation dialog
 * 5. ไม่เลือกอะไร → ซ่อน edit/delete
 * 6. เลือกหลายตัว (same type) → ซ่อน edit/delete
 * 7. เลือกหลายตัว (mixed type) → ซ่อน edit/delete
 */

export interface ToolbarVisibilityConfig {
  showEditButton: boolean;
  showDeleteButton: boolean;
  canEdit: boolean;
  canDelete: boolean;
  reason?: string; // สำหรับ debugging
}

/**
 * คำนวณว่าควรแสดง toolbar buttons หรือไม่ตาม Selection Rules
 * @returns ToolbarVisibilityConfig
 */
export function calculateToolbarVisibility(): ToolbarVisibilityConfig {
  const selectionState = useSelectionState.getState();
  const selectedElements = selectionState.getSelectedElements();
  const selectionType = selectionState.getSelectionType();
  const selectedTypes = selectionState.getSelectedTypes();

  // Requirement 5: ไม่เลือกอะไร → ซ่อน edit/delete
  if (selectionType === 'none') {
    return {
      showEditButton: false,
      showDeleteButton: false,
      canEdit: false,
      canDelete: false,
      reason: 'No selection (Requirement 5)'
    };
  }

  // Requirements 6-7: เลือกหลายตัว (same type หรือ mixed type) → ซ่อน edit/delete
  if (selectionType === 'multiple' || selectionType === 'mixed') {
    return {
      showEditButton: false,
      showDeleteButton: false,
      canEdit: false,
      canDelete: false,
      reason: `Multiple/Mixed selection: ${selectionType} (Requirements 6-7)`
    };
  }

  // Requirements 1-2: เลือกตัวเดียว (Node หรือ Edge) → แสดง edit/delete
  if (selectionType === 'single') {
    const selectedElement = selectedElements[0];
    const elementType = selectedElement.type;

    return {
      showEditButton: true,
      showDeleteButton: true,
      canEdit: true,
      canDelete: true,
      reason: `Single ${elementType} selected (Requirements 1-2)`
    };
  }

  // Fallback case (shouldn't happen)
  return {
    showEditButton: false,
    showDeleteButton: false,
    canEdit: false,
    canDelete: false,
    reason: 'Unknown selection state'
  };
}

/**
 * ตรวจสอบว่าสามารถแสดง Edit Actions ได้หรือไม่
 * (ใช้ร่วมกับ selectionState.canShowEditActions())
 * @returns boolean
 */
export function canShowEditActions(): boolean {
  const config = calculateToolbarVisibility();
  return config.showEditButton && config.showDeleteButton;
}

/**
 * ตรวจสอบว่าสามารถ Edit ได้หรือไม่ (Requirement 3)
 * @returns boolean
 */
export function canEdit(): boolean {
  const config = calculateToolbarVisibility();
  return config.canEdit;
}

/**
 * ตรวจสอบว่าสามารถ Delete ได้หรือไม่ (Requirement 4)
 * @returns boolean
 */
export function canDelete(): boolean {
  const config = calculateToolbarVisibility();
  return config.canDelete;
}

/**
 * ตรวจสอบประเภทของ element ที่เลือก
 * @returns 'node' | 'edge' | 'mixed' | 'none'
 */
export function getSelectedElementType(): 'node' | 'edge' | 'mixed' | 'none' {
  const selectionState = useSelectionState.getState();
  const selectedTypes = selectionState.getSelectedTypes();
  const selectionType = selectionState.getSelectionType();

  if (selectionType === 'none') {
    return 'none';
  }

  if (selectedTypes.size > 1) {
    return 'mixed';
  }

  if (selectedTypes.has('node')) {
    return 'node';
  }

  if (selectedTypes.has('edge')) {
    return 'edge';
  }

  return 'none';
}

/**
 * ได้รับ element ที่เลือกในขณะนี้ (สำหรับ single selection)
 * @returns SelectableElement | null
 */
export function getCurrentSelectedElement() {
  const selectionState = useSelectionState.getState();
  const selectedElements = selectionState.getSelectedElements();
  const selectionType = selectionState.getSelectionType();

  if (selectionType === 'single' && selectedElements.length === 1) {
    return selectedElements[0];
  }

  return null;
}

/**
 * สร้าง Selection Rules Event Handler
 * ใช้สำหรับ listen การเปลี่ยนแปลงของ selection และอัปเดต toolbar
 */
export class SelectionRulesManager {
  private listeners: Set<(config: ToolbarVisibilityConfig) => void> = new Set();
  private currentConfig: ToolbarVisibilityConfig;

  constructor() {
    this.currentConfig = calculateToolbarVisibility();
    this.setupSelectionListener();
  }

  /**
   * เพิ่ม listener สำหรับการเปลี่ยนแปลง toolbar visibility
   */
  addListener(callback: (config: ToolbarVisibilityConfig) => void): void {
    this.listeners.add(callback);
    // ส่ง current config ให้ listener ใหม่ทันที
    callback(this.currentConfig);
  }

  /**
   * ลบ listener
   */
  removeListener(callback: (config: ToolbarVisibilityConfig) => void): void {
    this.listeners.delete(callback);
  }

  /**
   * อัปเดต toolbar visibility และแจ้ง listeners
   */
  private updateToolbarVisibility(): void {
    const newConfig = calculateToolbarVisibility();
    
    // เปรียบเทียบกับ config เก่า
    const hasChanged = 
      this.currentConfig.showEditButton !== newConfig.showEditButton ||
      this.currentConfig.showDeleteButton !== newConfig.showDeleteButton ||
      this.currentConfig.canEdit !== newConfig.canEdit ||
      this.currentConfig.canDelete !== newConfig.canDelete;

    if (hasChanged) {
      this.currentConfig = newConfig;
      console.log('🔄 Toolbar visibility changed:', newConfig.reason);
      
      // แจ้ง listeners ทั้งหมด
      this.listeners.forEach(listener => {
        listener(this.currentConfig);
      });
    }
  }

  /**
   * ตั้งค่า listener สำหรับ selection changes
   */
  private setupSelectionListener(): void {
    window.addEventListener('pixi-selection-change', () => {
      this.updateToolbarVisibility();
    });

    window.addEventListener('selection-cleared', () => {
      this.updateToolbarVisibility();
    });
  }

  /**
   * ได้รับ current config
   */
  getCurrentConfig(): ToolbarVisibilityConfig {
    return { ...this.currentConfig };
  }

  /**
   * ทำลาย manager และลบ listeners
   */
  destroy(): void {
    this.listeners.clear();
    // หมายเหตุ: ไม่สามารถลบ window event listeners ได้เพราะไม่ได้เก็บ reference
    // ในการใช้งานจริงควรใช้ AbortController หรือเก็บ reference ของ listener functions
  }
}

/**
 * Global instance ของ SelectionRulesManager
 * ใช้สำหรับจัดการ selection rules ทั่วทั้งแอป
 */
export const selectionRulesManager = new SelectionRulesManager();

/**
 * Utility function สำหรับ debug selection state
 */
export function debugSelectionState(): void {
  const selectionState = useSelectionState.getState();
  const config = calculateToolbarVisibility();
  
  console.group('🔍 Selection Debug Info');
  console.log('Selected Elements:', selectionState.getSelectedElements());
  console.log('Selection Type:', selectionState.getSelectionType());
  console.log('Selected Types:', Array.from(selectionState.getSelectedTypes()));
  console.log('Can Show Edit Actions:', selectionState.canShowEditActions());
  console.log('Toolbar Config:', config);
  console.groupEnd();
}