// src/utils/edgeState.ts

import { Container, Graphics, Point } from 'pixi.js';

/**
 * Interface สำหรับข้อมูล Edge ที่สร้างเสร็จแล้ว
 */
export interface EdgeData {
  id: string;                    // ID เฉพาะของ Edge
  sourceNode: Container;         // Node ต้นทาง
  targetNode: Container;         // Node ปลายทาง
  edgeGraphics: Container;       // Container ของ Edge (เปลี่ยนจาก Graphics เป็น Container)
  labelText: string;             // ข้อความ label บนเส้น
}

/**
 * สถานะต่างๆ ของระบบ Edge
 */
export const EdgeCreationMode = {
  IDLE: 'idle' as const,                 // ไม่มีการสร้าง edge
  CREATING: 'creating' as const,         // กำลังสร้าง edge (กำลังลากเส้น)
  COMPLETED: 'completed' as const        // สร้าง edge เสร็จแล้ว
} as const;

export type EdgeCreationMode = typeof EdgeCreationMode[keyof typeof EdgeCreationMode];

/**
 * ระบบจัดการสถานะการสร้าง Edge และเก็บข้อมูล Edge ทั้งหมด
 * ใช้สำหรับควบคุมกระบวนการสร้างเส้นเชื่อมระหว่าง Nodes
 */
class EdgeStateManager {
  // สถานะปัจจุบันของการสร้าง edge
  private currentMode: EdgeCreationMode = EdgeCreationMode.IDLE;
  
  // Node ที่เริ่มต้นการสร้าง edge (เมื่อคลิกที่ connection point)
  private sourceNode: Container | null = null;
  
  // Connection Point ที่เริ่มต้นการสร้าง edge
  private sourceConnectionPoint: Graphics | null = null;
  
  // Graphics object สำหรับเส้น preview ที่ตามเมาส์
  private previewLine: Graphics | null = null;
  
  // จุดเริ่มต้นของเส้น preview (พิกัดบน stage)
  private previewStartPoint: Point = new Point(0, 0);
  
  // Array เก็บ Edge ทั้งหมดที่สร้างเสร็จแล้ว
  private edges: EdgeData[] = [];
  
  // Counter สำหรับสร้าง unique ID
  private edgeIdCounter: number = 0;

  /**
   * เริ่มต้นกระบวนการสร้าง Edge
   * @param sourceNode - Node ที่เป็นจุดเริ่มต้นของ edge
   * @param startPoint - จุดเริ่มต้นบน stage (พิกัด global)
   * @param previewGraphics - Graphics object สำหรับวาดเส้น preview
   * @param sourceConnectionPoint - Connection Point ที่เป็นจุดเริ่มต้น (optional)
   */
  startEdgeCreation(sourceNode: Container, startPoint: Point, previewGraphics: Graphics, sourceConnectionPoint?: Graphics): void {
    // ตรวจสอบว่าไม่ได้อยู่ในขณะสร้าง edge อื่นอยู่
    if (this.currentMode !== EdgeCreationMode.IDLE) {
      console.warn('กำลังสร้าง edge อยู่แล้ว ไม่สามารถเริ่มใหม่ได้');
      return;
    }

    // เปลี่ยนสถานะเป็น creating
    this.currentMode = EdgeCreationMode.CREATING;
    this.sourceNode = sourceNode;
    this.sourceConnectionPoint = sourceConnectionPoint || null;
    this.previewLine = previewGraphics;
    this.previewStartPoint.copyFrom(startPoint);

    console.log('เริ่มสร้าง Edge จาก Node:', sourceNode);
  }

  /**
   * อัปเดตตำแหน่งปลายของเส้น preview ตามตำแหน่งเมาส์
   * @param endPoint - ตำแหน่งปลายทางปัจจุบัน (พิกัด global)
   */
  updatePreview(endPoint: Point): void {
    if (this.currentMode !== EdgeCreationMode.CREATING || !this.previewLine) {
      return;
    }

    // ล้างเส้นเก่าและวาดเส้นใหม่
    this.previewLine.clear();
    this.previewLine.stroke({ width: 2, color: 0x666666, alpha: 0.7 });
    this.previewLine.moveTo(this.previewStartPoint.x, this.previewStartPoint.y);
    this.previewLine.lineTo(endPoint.x, endPoint.y);
    this.previewLine.stroke();
  }

  /**
   * เสร็จสิ้นการสร้าง Edge เมื่อคลิกที่ connection point ของ Node ปลายทาง
   * @param targetNode - Node ปลายทาง
   * @param edgeContainer - Container สำหรับ edge ที่สร้างเสร็จ (เปลี่ยนจาก Graphics)
   * @param labelText - ข้อความ label บนเส้น (ค่าเริ่มต้น)
   * @returns EdgeData ของ edge ที่สร้างเสร็จ หรือ null ถ้าไม่สามารถสร้างได้
   */
  completeEdge(targetNode: Container, edgeContainer: Container, labelText: string = ''): EdgeData | null {
    if (this.currentMode !== EdgeCreationMode.CREATING || !this.sourceNode) {
      console.warn('ไม่ได้อยู่ในสถานะสร้าง edge');
      return null;
    }

    // ตรวจสอบว่าไม่ใช่ Node เดียวกัน
    if (this.sourceNode === targetNode) {
      console.warn('ไม่สามารถสร้าง edge ไปยัง Node เดียวกันได้');
      this.cancelEdgeCreation();
      return null;
    }

    // สร้าง EdgeData
    const edgeData: EdgeData = {
      id: `edge_${++this.edgeIdCounter}`,
      sourceNode: this.sourceNode,
      targetNode: targetNode,
      edgeGraphics: edgeContainer,
      labelText: labelText
    };

    // เพิ่มใน array
    this.edges.push(edgeData);

    // ล้างสถานะ
    this.resetState();

    console.log('สร้าง Edge สำเร็จ:', edgeData.id);
    return edgeData;
  }

  /**
   * ยกเลิกการสร้าง Edge
   */
  cancelEdgeCreation(): void {
    if (this.currentMode === EdgeCreationMode.CREATING) {
      console.log('ยกเลิกการสร้าง Edge');
      
      // ซ่อนหรือลบเส้น preview
      if (this.previewLine) {
        this.previewLine.clear();
        this.previewLine.visible = false;
      }
    }

    this.resetState();
  }

  /**
   * รีเซ็ตสถานะกลับเป็น IDLE
   */
  private resetState(): void {
    this.currentMode = EdgeCreationMode.IDLE;
    this.sourceNode = null;
    this.sourceConnectionPoint = null;
    this.previewLine = null;
    this.previewStartPoint.set(0, 0);
  }

  /**
   * ตรวจสอบสถานะปัจจุบัน
   */
  getCurrentMode(): EdgeCreationMode {
    return this.currentMode;
  }

  /**
   * ตรวจสอบว่ากำลังอยู่ในขั้นตอนการสร้าง edge หรือไม่
   */
  isCreatingEdge(): boolean {
    return this.currentMode === EdgeCreationMode.CREATING;
  }

  /**
   * ได้ Node ต้นทางปัจจุบัน (ถ้ากำลังสร้าง edge)
   */
  getSourceNode(): Container | null {
    return this.sourceNode;
  }

  /**
   * ได้ Connection Point ต้นทางปัจจุบัน (ถ้ากำลังสร้าง edge)
   */
  getSourceConnectionPoint(): Graphics | null {
    return this.sourceConnectionPoint;
  }

  /**
   * ได้ Graphics object ของเส้น preview
   */
  getPreviewLine(): Graphics | null {
    return this.previewLine;
  }

  /**
   * ได้ Array ของ Edge ทั้งหมด
   */
  getAllEdges(): EdgeData[] {
    return [...this.edges]; // คืน copy เพื่อป้องกันการแก้ไขโดยตรง
  }

  /**
   * ลบ Edge ตาม ID
   * @param edgeId - ID ของ Edge ที่ต้องการลบ
   * @returns true ถ้าลบสำเร็จ, false ถ้าไม่พบ
   */
  removeEdge(edgeId: string): boolean {
    const index = this.edges.findIndex(edge => edge.id === edgeId);
    if (index >= 0) {
      // ลบ graphics object ออกจาก stage
      const edge = this.edges[index];
      if (edge.edgeGraphics.parent) {
        edge.edgeGraphics.parent.removeChild(edge.edgeGraphics);
      }
      
      // ลบออกจาก array
      this.edges.splice(index, 1);
      console.log('ลบ Edge สำเร็จ:', edgeId);
      return true;
    }
    return false;
  }

  /**
   * หา Edge ทั้งหมดที่เชื่อมต่อกับ Node ที่ระบุ
   * @param node - Node ที่ต้องการค้นหา
   * @returns Array ของ EdgeData ที่เชื่อมต่อกับ Node นี้
   */
  getEdgesConnectedToNode(node: Container): EdgeData[] {
    return this.edges.filter(edge => 
      edge.sourceNode === node || edge.targetNode === node
    );
  }

  /**
   * ลบ Edge ทั้งหมดที่เชื่อมต่อกับ Node ที่ระบุ
   * @param node - Node ที่ต้องการตัดการเชื่อมต่อ
   * @returns จำนวน Edge ที่ถูกลบ
   */
  removeEdgesConnectedToNode(node: Container): number {
    const connectedEdges = this.getEdgesConnectedToNode(node);
    let removedCount = 0;

    connectedEdges.forEach(edge => {
      if (this.removeEdge(edge.id)) {
        removedCount++;
      }
    });

    return removedCount;
  }

  /**
   * ได้จำนวน Edge ทั้งหมด
   */
  getEdgeCount(): number {
    return this.edges.length;
  }

  /**
   * อัปเดต label text ของ Edge
   * @param edgeId - ID ของ Edge
   * @param newLabelText - ข้อความ label ใหม่
   * @returns true ถ้าอัปเดตสำเร็จ, false ถ้าไม่พบ Edge
   */
  updateEdgeLabel(edgeId: string, newLabelText: string): boolean {
    const edgeData = this.edges.find(edge => edge.id === edgeId);
    if (edgeData) {
      edgeData.labelText = newLabelText;
      // อัปเดต metadata ของ edge container ด้วย
      const edgeContainer = edgeData.edgeGraphics;
      if ((edgeContainer as any).edgeData) {
        (edgeContainer as any).edgeData.labelText = newLabelText;
      }
      return true;
    }
    return false;
  }

  /**
   * หา EdgeData จาก Container
   * @param edgeContainer - Container ของ Edge
   * @returns EdgeData หรือ null ถ้าไม่พบ
   */
  getEdgeDataByContainer(edgeContainer: Container): EdgeData | null {
    return this.edges.find(edge => edge.edgeGraphics === edgeContainer) || null;
  }
}

// สร้าง instance เดียวสำหรับใช้ทั่วทั้งแอปพลิเคชัน (Singleton pattern)
export const edgeStateManager = new EdgeStateManager();