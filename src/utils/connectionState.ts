// src/utils/connectionState.ts

import { Container } from 'pixi.js';

/**
 * ระบบจัดการสถานะการแสดงผล Connection Points ของ C4 Boxes
 * ใช้สำหรับเก็บ reference ของ Nodes ที่ถูก "pin" ให้แสดง connection points ตลอดเวลา
 */
class ConnectionStateManager {
  // เก็บ Set ของ Container ที่ถูก pin ไว้ให้แสดง connection points
  private pinnedNodes: Set<Container> = new Set();
  
  // เก็บ reference ของ Node ที่กำลัง hover อยู่ในขณะนี้
  private currentHoveredNode: Container | null = null;

  /**
   * ตรวจสอบว่า Node นี้ถูก pin ไว้หรือไม่
   * @param node - Container ของ Node ที่ต้องการตรวจสอบ
   * @returns true ถ้า Node ถูก pin ไว้, false ถ้าไม่ได้ถูก pin
   */
  isPinned(node: Container): boolean {
    return this.pinnedNodes.has(node);
  }

  /**
   * Pin Node ให้แสดง connection points ตลอดเวลา
   * @param node - Container ของ Node ที่ต้องการ pin
   */
  pinNode(node: Container): void {
    this.pinnedNodes.add(node);
  }

  /**
   * ยกเลิก pin Node (ทำให้ connection points หายไปเมื่อไม่ได้ hover)
   * @param node - Container ของ Node ที่ต้องการยกเลิก pin
   */
  unpinNode(node: Container): void {
    this.pinnedNodes.delete(node);
  }

  /**
   * Toggle สถานะ pin ของ Node (ถ้า pin อยู่จะยกเลิก, ถ้าไม่ได้ pin จะ pin)
   * @param node - Container ของ Node ที่ต้องการ toggle
   * @returns true ถ้าหลังจาก toggle แล้ว Node ถูก pin, false ถ้าไม่ได้ถูก pin
   */
  togglePin(node: Container): boolean {
    if (this.isPinned(node)) {
      this.unpinNode(node);
      return false;
    } else {
      this.pinNode(node);
      return true;
    }
  }

  /**
   * ยกเลิก pin ทุก Nodes (clear ทั้งหมด)
   */
  clearAllPins(): void {
    this.pinnedNodes.clear();
  }

  /**
   * ตั้งค่า Node ที่กำลัง hover อยู่ในขณะนี้
   * @param node - Container ของ Node ที่กำลัง hover, หรือ null ถ้าไม่มี Node ที่กำลัง hover
   */
  setHoveredNode(node: Container | null): void {
    this.currentHoveredNode = node;
  }

  /**
   * ได้ Node ที่กำลัง hover อยู่ในขณะนี้
   * @returns Container ของ Node ที่กำลัง hover, หรือ null ถ้าไม่มี
   */
  getHoveredNode(): Container | null {
    return this.currentHoveredNode;
  }

  /**
   * ตรวจสอบว่า Node นี้ควรแสดง connection points หรือไม่
   * (แสดงถ้าถูก pin หรือกำลัง hover อยู่)
   * @param node - Container ของ Node ที่ต้องการตรวจสอบ
   * @returns true ถ้าควรแสดง connection points, false ถ้าไม่ควรแสดง
   */
  shouldShowConnections(node: Container): boolean {
    return this.isPinned(node) || this.currentHoveredNode === node;
  }

  /**
   * ได้จำนวน Nodes ที่ถูก pin ทั้งหมด
   * @returns จำนวน Nodes ที่ถูก pin
   */
  getPinnedCount(): number {
    return this.pinnedNodes.size;
  }

  /**
   * ได้ Array ของ Nodes ที่ถูก pin ทั้งหมด
   * @returns Array ของ Container ที่ถูก pin
   */
  getPinnedNodes(): Container[] {
    return Array.from(this.pinnedNodes);
  }
}

// สร้าง instance เดียวสำหรับใช้ทั่วทั้งแอปพลิเคชัน (Singleton pattern)
export const connectionStateManager = new ConnectionStateManager();