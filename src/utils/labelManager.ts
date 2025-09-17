// src/utils/labelManager.ts

import { Container } from 'pixi.js';
import { isLabelEditing, finishLabelEditing, getLabelText } from '../components/EditableLabel';

/**
 * Interface สำหรับข้อมูล Label ที่จัดการโดย LabelManager
 */
interface ManagedLabel {
  id: string;                      // ID เฉพาะของ Label
  container: Container;            // Container ของ Label
  type: 'node' | 'edge';          // ประเภทของ Label
  parentId: string;                // ID ของ parent (Node หรือ Edge)
  isEditable: boolean;             // สามารถแก้ไขได้หรือไม่
}

/**
 * ระบบจัดการ Labels ทั้งหมดในแอปพลิเคชัน
 * รับผิดชอบการจัดการสถานะ, การแก้ไข, และการ export/import ข้อมูล
 * 
 * คุณสมบัติหลัก:
 * - ป้องกันการแก้ไข Label มากกว่า 1 ตัวพร้อมกัน
 * - จัดการ focus และ navigation ระหว่าง Labels
 * - Export/Import ข้อมูล Labels สำหรับการบันทึก
 * - API สำหรับการจัดการ Labels แบบ programmatic
 */
class LabelManager {
  // เก็บ Labels ทั้งหมดที่จัดการ
  private labels: Map<string, ManagedLabel> = new Map();
  
  // ID ของ Label ที่กำลังแก้ไขอยู่ (มีได้เพียง 1 ตัว)
  private currentEditingLabelId: string | null = null;
  
  // Counter สำหรับสร้าง unique ID
  private labelIdCounter: number = 0;

  /**
   * ลงทะเบียน Label ใหม่เข้าระบบจัดการ
   * @param container - Container ของ Label
   * @param type - ประเภทของ Label ('node' หรือ 'edge')
   * @param parentId - ID ของ parent (Node หรือ Edge ID)
   * @param isEditable - สามารถแก้ไขได้หรือไม่ (ค่าเริ่มต้น true)
   * @returns ID ของ Label ที่สร้างขึ้น
   */
  registerLabel(
    container: Container, 
    type: 'node' | 'edge', 
    parentId: string,
    isEditable: boolean = true
  ): string {
    const labelId = `label_${++this.labelIdCounter}`;
    
    const managedLabel: ManagedLabel = {
      id: labelId,
      container: container,
      type: type,
      parentId: parentId,
      isEditable: isEditable
    };

    this.labels.set(labelId, managedLabel);
    
    // เพิ่ม event listeners เพื่อจัดการ edit state
    this.setupLabelEventListeners(managedLabel);
    
    console.log(`ลงทะเบียน ${type} label: ${labelId} สำหรับ parent: ${parentId}`);
    return labelId;
  }

  /**
   * ลบ Label ออกจากระบบจัดการ
   * @param labelId - ID ของ Label ที่ต้องการลบ
   * @returns true ถ้าลบสำเร็จ, false ถ้าไม่พบ
   */
  unregisterLabel(labelId: string): boolean {
    const label = this.labels.get(labelId);
    if (!label) {
      return false;
    }

    // ถ้ากำลังแก้ไขอยู่ ให้จบการแก้ไขก่อน
    if (this.currentEditingLabelId === labelId) {
      this.finishCurrentEditing(true);
    }

    this.labels.delete(labelId);
    console.log(`ลบ label ออกจากระบบ: ${labelId}`);
    return true;
  }

  /**
   * ตั้งค่า Event Listeners สำหรับ Label
   * @param managedLabel - ข้อมูล Label ที่จัดการ
   */
  private setupLabelEventListeners(managedLabel: ManagedLabel): void {
    const { container } = managedLabel;

    // เพิ่ม custom event listeners
    container.on('pointerdown', () => {
      this.handleLabelClick(managedLabel.id);
    });

    // Monitor editing state changes
    const checkEditingState = () => {
      const isEditing = isLabelEditing(container);
      
      if (isEditing && this.currentEditingLabelId !== managedLabel.id) {
        // Label นี้เริ่มแก้ไข แต่ยังไม่ได้ register
        this.handleEditStart(managedLabel.id);
      } else if (!isEditing && this.currentEditingLabelId === managedLabel.id) {
        // Label นี้จบการแก้ไขแล้ว
        this.handleEditEnd(managedLabel.id);
      }
    };

    // Check editing state ทุก 100ms (simple polling)
    setInterval(checkEditingState, 100);
  }

  /**
   * จัดการเมื่อมีการคลิก Label
   * @param labelId - ID ของ Label ที่ถูกคลิก
   */
  private handleLabelClick(labelId: string): void {
    const label = this.labels.get(labelId);
    if (!label || !label.isEditable) {
      return;
    }

    // ถ้ามี Label อื่นกำลังแก้ไขอยู่ ให้จบการแก้ไขก่อน
    if (this.currentEditingLabelId && this.currentEditingLabelId !== labelId) {
      this.finishCurrentEditing(true);
    }
  }

  /**
   * จัดการเมื่อเริ่มแก้ไข Label
   * @param labelId - ID ของ Label ที่เริ่มแก้ไข
   */
  private handleEditStart(labelId: string): void {
    // ถ้ามี Label อื่นกำลังแก้ไขอยู่ ให้จบการแก้ไขก่อน
    if (this.currentEditingLabelId && this.currentEditingLabelId !== labelId) {
      this.finishCurrentEditing(true);
    }

    this.currentEditingLabelId = labelId;
    console.log(`เริ่มแก้ไข label: ${labelId}`);
  }

  /**
   * จัดการเมื่อจบการแก้ไข Label
   * @param labelId - ID ของ Label ที่จบการแก้ไข
   */
  private handleEditEnd(labelId: string): void {
    if (this.currentEditingLabelId === labelId) {
      this.currentEditingLabelId = null;
      console.log(`จบการแก้ไข label: ${labelId}`);
    }
  }

  /**
   * บังคับให้จบการแก้ไข Label ปัจจุบัน
   * @param save - บันทึกการเปลี่ยนแปลงหรือไม่ (ค่าเริ่มต้น true)
   */
  finishCurrentEditing(save: boolean = true): void {
    if (!this.currentEditingLabelId) {
      return;
    }

    const label = this.labels.get(this.currentEditingLabelId);
    if (label) {
      finishLabelEditing(label.container, save);
    }
  }

  /**
   * แก้ไข Label ตาม ID
   * @param labelId - ID ของ Label
   * @param newText - ข้อความใหม่
   * @returns Promise<boolean> - true ถ้าอัปเดตสำเร็จ, false ถ้าไม่พบหรือไม่สามารถแก้ไขได้
   */
  async setLabelText(labelId: string, newText: string): Promise<boolean> {
    const label = this.labels.get(labelId);
    if (!label || !label.isEditable) {
      return false;
    }

    // ใช้ API ของ EditableLabel
    const { updateLabelText } = await import('../components/EditableLabel');
    updateLabelText(label.container, newText);
    
    console.log(`อัปเดต label ${labelId}: "${newText}"`);
    return true;
  }

  /**
   * ได้ข้อความปัจจุบันของ Label
   * @param labelId - ID ของ Label
   * @returns ข้อความปัจจุบัน หรือ null ถ้าไม่พบ
   */
  getLabelText(labelId: string): string | null {
    const label = this.labels.get(labelId);
    if (!label) {
      return null;
    }

    return getLabelText(label.container);
  }

  /**
   * ได้รายการ Label ทั้งหมดตามประเภท
   * @param type - ประเภทของ Label ('node', 'edge', หรือ undefined สำหรับทั้งหมด)
   * @returns Array ของ Label IDs
   */
  getLabelsByType(type?: 'node' | 'edge'): string[] {
    const labelIds: string[] = [];
    
    this.labels.forEach((label, labelId) => {
      if (!type || label.type === type) {
        labelIds.push(labelId);
      }
    });

    return labelIds;
  }

  /**
   * ได้รายการ Label ทั้งหมดของ Parent ที่ระบุ
   * @param parentId - ID ของ Parent (Node หรือ Edge)
   * @returns Array ของ Label IDs
   */
  getLabelsByParent(parentId: string): string[] {
    const labelIds: string[] = [];
    
    this.labels.forEach((label, labelId) => {
      if (label.parentId === parentId) {
        labelIds.push(labelId);
      }
    });

    return labelIds;
  }

  /**
   * ตรวจสอบว่ามี Label ใดกำลังแก้ไขอยู่หรือไม่
   * @returns true ถ้ามี Label กำลังแก้ไขอยู่
   */
  hasLabelEditing(): boolean {
    return this.currentEditingLabelId !== null;
  }

  /**
   * ได้ ID ของ Label ที่กำลังแก้ไขอยู่
   * @returns Label ID หรือ null ถ้าไม่มี
   */
  getCurrentEditingLabelId(): string | null {
    return this.currentEditingLabelId;
  }

  /**
   * Export ข้อมูล Labels ทั้งหมดเป็น JSON
   * @returns Object ที่มีข้อมูล Labels
   */
  exportLabelsToJSON(): Record<string, any> {
    const exportData: Record<string, any> = {};
    
    this.labels.forEach((label, labelId) => {
      exportData[labelId] = {
        id: labelId,
        type: label.type,
        parentId: label.parentId,
        text: getLabelText(label.container),
        isEditable: label.isEditable
      };
    });

    return {
      labels: exportData,
      totalCount: this.labels.size,
      nodeLabels: this.getLabelsByType('node').length,
      edgeLabels: this.getLabelsByType('edge').length
    };
  }

  /**
   * ลบ Labels ทั้งหมดที่เกี่ยวข้องกับ Parent ที่ระบุ
   * @param parentId - ID ของ Parent ที่ต้องการลบ Labels
   * @returns จำนวน Labels ที่ถูกลบ
   */
  removeLabelsOfParent(parentId: string): number {
    const labelIds = this.getLabelsByParent(parentId);
    let removedCount = 0;

    labelIds.forEach(labelId => {
      if (this.unregisterLabel(labelId)) {
        removedCount++;
      }
    });

    console.log(`ลบ ${removedCount} labels ของ parent: ${parentId}`);
    return removedCount;
  }

  /**
   * ได้สถิติการใช้งาน Labels
   * @returns Object ที่มีข้อมูลสถิติ
   */
  getStatistics(): Record<string, any> {
    return {
      totalLabels: this.labels.size,
      nodeLabels: this.getLabelsByType('node').length,
      edgeLabels: this.getLabelsByType('edge').length,
      editableLabels: Array.from(this.labels.values()).filter(l => l.isEditable).length,
      currentlyEditing: this.currentEditingLabelId,
      hasActiveEdit: this.hasLabelEditing()
    };
  }

  /**
   * ล้างข้อมูล Labels ทั้งหมด (ใช้เมื่อ reset หรือ clear canvas)
   */
  clearAll(): void {
    // จบการแก้ไขปัจจุบันก่อน
    this.finishCurrentEditing(false);
    
    // ลบ Labels ทั้งหมด
    this.labels.clear();
    this.currentEditingLabelId = null;
    this.labelIdCounter = 0;
    
    console.log('ล้างข้อมูล Labels ทั้งหมดแล้ว');
  }
}

// สร้าง instance เดียวสำหรับใช้ทั่วทั้งแอปพลิเคชัน (Singleton pattern)
export const labelManager = new LabelManager();

/**
 * Helper Functions สำหรับการใช้งานง่าย
 */

/**
 * ลงทะเบียน Node Label
 * @param labelContainer - Container ของ Label
 * @param nodeId - ID ของ Node
 * @returns Label ID
 */
export function registerNodeLabel(labelContainer: Container, nodeId: string): string {
  return labelManager.registerLabel(labelContainer, 'node', nodeId);
}

/**
 * ลงทะเบียน Edge Label
 * @param labelContainer - Container ของ Label
 * @param edgeId - ID ของ Edge
 * @returns Label ID
 */
export function registerEdgeLabel(labelContainer: Container, edgeId: string): string {
  return labelManager.registerLabel(labelContainer, 'edge', edgeId);
}

/**
 * อัปเดต Node Label
 * @param nodeId - ID ของ Node
 * @param newText - ข้อความใหม่
 * @returns Promise<boolean> - true ถ้าอัปเดตสำเร็จ
 */
export async function setNodeLabel(nodeId: string, newText: string): Promise<boolean> {
  const labelIds = labelManager.getLabelsByParent(nodeId);
  if (labelIds.length > 0) {
    return await labelManager.setLabelText(labelIds[0], newText);
  }
  return false;
}

/**
 * อัปเดต Edge Label
 * @param edgeId - ID ของ Edge
 * @param newText - ข้อความใหม่
 * @returns Promise<boolean> - true ถ้าอัปเดตสำเร็จ
 */
export async function setEdgeLabel(edgeId: string, newText: string): Promise<boolean> {
  const labelIds = labelManager.getLabelsByParent(edgeId);
  if (labelIds.length > 0) {
    return await labelManager.setLabelText(labelIds[0], newText);
  }
  return false;
}

/**
 * Export ข้อมูล Labels เป็น JSON string
 * @returns JSON string ของข้อมูล Labels
 */
export function exportLabelsToJSON(): string {
  return JSON.stringify(labelManager.exportLabelsToJSON(), null, 2);
}