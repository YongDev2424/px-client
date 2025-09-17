// src/components/C4Box.ts

import { Container, Graphics, Application, FederatedPointerEvent, Circle } from 'pixi.js';
import { makeDraggable } from '../utils/draggable';
import { createC4Label } from './C4Label';
import { fadeIn, fadeOut } from '../utils/animations';
import { connectionStateManager } from '../utils/connectionState';
import { edgeStateManager } from '../utils/edgeState';
import { createPreviewEdge, createEdge } from './Edge';

/**
 * ฟังก์ชัน Helper: สร้างจุดเชื่อมต่อ (วงกลมเล็กๆ) พร้อม Dynamic Hit Area
 * จุดเชื่อมต่อจะเริ่มต้นในสถานะซ่อนอยู่ และจะแสดงเฉพาะเมื่อ hover หรือ click Node
 * @returns - วัตถุ Graphics ของจุดเชื่อมต่อ
 */
function createConnectionPoint(): Graphics {
  // 1. สร้าง "ผืนผ้าใบ" Graphics ที่ว่างเปล่าขึ้นมาก่อน
  const point = new Graphics();

  // 2. ใช้เมธอดต่างๆ เพื่อ "สั่ง" ให้วาดลงบนผืนผ้าใบนั้น
  point.fill(0x000000); // สีดำ
  point.circle(0, 0, 5); // วาดวงกลมรัศมี 5 pixels
  point.fill(); // สั่งให้เติมสี (สำหรับ v8 ควรเรียกหลังวาด)

  // 3. ตั้งค่าการโต้ตอบให้กับ "ผืนผ้าใบ" โดยตรง (เฉพาะเมื่อแสดงผล)
  point.eventMode = 'static';
  point.cursor = 'crosshair'; // เปลี่ยน cursor เพื่อแสดงว่าสามารถสร้าง edge ได้

  // 4. ตั้งค่า hit area เริ่มต้น (รัศมี 5)
  point.hitArea = new Circle(0, 0, 5);

  // 5. ตั้งค่าให้เริ่มต้นในสถานะซ่อนอยู่
  point.visible = false;
  point.alpha = 0;

  // 6. เพิ่มฟังก์ชัน helper สำหรับขยาย/ย่อ hit area
  (point as any).setHitAreaRadius = function(radius: number) {
    this.hitArea = new Circle(0, 0, radius);
  };

  // 7. คืนค่า "ผืนผ้าใบ" (Graphics) ที่วาดเสร็จแล้วออกไป
  return point;
}

/**
 * สร้าง "ส่วนประกอบภาพ" ของกล่อง C4
 * ซึ่งประกอบด้วยรูปทรงสี่เหลี่ยม, ข้อความ, และจุดเชื่อมต่อ
 * จุดเชื่อมต่อจะแสดงเฉพาะเมื่อ hover หรือ click บน Node
 * @param app - ตัวแอปพลิเคชัน Pixi หลัก
 * @param labelText - ข้อความที่จะแสดงในกล่อง
 * @param boxColor - สีพื้นหลังของกล่อง
 * @returns - วัตถุ Container ของกล่องที่สร้างเสร็จแล้ว
 */
export function createC4Box(app: Application, labelText: string, boxColor: number): Container {
  // 1. สร้าง Container และส่วนประกอบภาพทั้งหมด
  const boxContainer = new Container();
  const boxGraphics = new Graphics()
    .fill(boxColor)
    .rect(0, 0, 200, 100)
    .fill();
  const boxLabel = createC4Label(labelText, 24, 0x000000);
  const connectionPoint = createConnectionPoint();

  // 2. นำส่วนประกอบทั้งหมดมาใส่ใน Container (ประกอบร่าง)
  boxContainer.addChild(boxGraphics);
  boxContainer.addChild(boxLabel);
  boxContainer.addChild(connectionPoint);

  // 3. จัดตำแหน่งส่วนประกอบย่อย โดยอิงกับขนาดของ Graphics ที่คงที่
  boxLabel.x = (boxGraphics.width - boxLabel.width) / 2;
  boxLabel.y = (boxGraphics.height - boxLabel.height) / 2;
  
  connectionPoint.x = boxGraphics.width;
  connectionPoint.y = boxGraphics.height / 2;

  // 4. กำหนดตำแหน่งเริ่มต้นของ Container ทั้งหมดบนฉาก
  boxContainer.x = app.screen.width / 2;
  boxContainer.y = app.screen.height / 2;

  // 5. เก็บ reference ของ boxGraphics และ connectionPoint ไว้ใน Container เพื่อใช้ใน events
  (boxContainer as any).boxGraphics = boxGraphics;
  (boxContainer as any).connectionPoint = connectionPoint;

  // 6. เพิ่ม Event Handlers สำหรับการจัดการ hover และ click effects
  
  // เมื่อ pointer เข้ามา hover บน Container (Node area แต่ไม่ใช่ connection point)
  boxContainer.on('pointerover', (event: FederatedPointerEvent) => {
    event.stopPropagation();
    
    // ปกติ: แสดง connection points เมื่อ hover
    connectionStateManager.setHoveredNode(boxContainer);
    fadeIn(connectionPoint, 150);
  });
  
  // เมื่อ pointer ออกจาก Container
  boxContainer.on('pointerout', (event: FederatedPointerEvent) => {
    event.stopPropagation();
    
    // ปกติ: ซ่อน connection points เมื่อออกจาก hover (เว้นแต่ถูก pin)
    connectionStateManager.setHoveredNode(null);
    
    if (!connectionStateManager.isPinned(boxContainer)) {
      fadeOut(connectionPoint, 150);
    }
  });
  
  // เมื่อ click บน Container (Node area)
  boxContainer.on('pointerdown', (event: FederatedPointerEvent) => {
    event.stopPropagation();
    
    // ปกติ: คลิกบน Node area = pin/unpin connection points
    const isPinned = connectionStateManager.togglePin(boxContainer);
    
    if (isPinned) {
      fadeIn(connectionPoint, 150);
    } else if (!connectionStateManager.shouldShowConnections(boxContainer)) {
      fadeOut(connectionPoint, 150);
    }
  });
  
  // เพิ่ม Event Handlers สำหรับ Connection Point (แยกจาก Container)
  
  // เมื่อ click ที่ Connection Point - เริ่มหรือเสร็จสิ้นการสร้าง Edge
  connectionPoint.on('pointerdown', (event: FederatedPointerEvent) => {
    event.stopPropagation(); // หยุดไม่ให้ไป trigger Container events
    
    // ถ้ากำลังสร้าง edge อยู่แล้ว ให้เสร็จสิ้น edge ที่ connection point นี้
    if (edgeStateManager.isCreatingEdge()) {
      completeEdgeCreation(boxContainer, event);
    } else {
      // เริ่มสร้าง edge ใหม่จาก connection point นี้
      startEdgeCreation(boxContainer, event);
    }
  });
  
  // เพิ่ม visual feedback เมื่อ hover บน connection point
  connectionPoint.on('pointerover', (event: FederatedPointerEvent) => {
    event.stopPropagation();
    // เปลี่ยนสี connection point เมื่อ hover
    connectionPoint.tint = 0x00FF00; // สีเขียว
  });
  
  connectionPoint.on('pointerout', (event: FederatedPointerEvent) => {
    event.stopPropagation();
    // เปลี่ยนกลับเป็นสีเดิม
    connectionPoint.tint = 0xFFFFFF; // สีขาว
  });


  // 7. ทำให้ Container ทั้งหมดสามารถลากได้ (เฉพาะเมื่อคลิกที่ Node area)
  makeDraggable(boxContainer, app);

  // 8. คืนค่า Container ที่สมบูรณ์แล้วออกไป
  return boxContainer;
}

/**
 * เริ่มต้นการสร้าง Edge จาก Connection Point
 * @param sourceNode - Node ที่เป็นจุดเริ่มต้น
 * @param event - Pointer event จากการคลิก
 */
function startEdgeCreation(sourceNode: Container, event: FederatedPointerEvent): void {
  console.log('เริ่มสร้าง Edge จาก Node:', sourceNode);
  
  // คำนวณจุดเริ่มต้น (พิกัด global ของ connection point)
  const startPoint = event.global.clone();
  
  // สร้าง preview line
  const previewLine = createPreviewEdge(startPoint, startPoint);
  
  // เพิ่ม preview line เข้าใน stage
  let currentParent = sourceNode.parent;
  while (currentParent && currentParent.parent) {
    currentParent = currentParent.parent as Container;
  }
  if (currentParent) {
    currentParent.addChild(previewLine);
  }
  
  // เริ่มต้นการสร้าง edge
  edgeStateManager.startEdgeCreation(sourceNode, startPoint, previewLine);
}

/**
 * เสร็จสิ้นการสร้าง Edge เมื่อคลิกที่ Connection Point ของ Node ปลายทาง
 * @param targetNode - Node ที่เป็นจุดปลายทาง
 * @param event - Pointer event จากการคลิก
 */
function completeEdgeCreation(targetNode: Container, _event: FederatedPointerEvent): void {
  console.log('เสร็จสิ้นการสร้าง Edge ที่ Node:', targetNode);
  
  // ได้ source node จาก edge state manager
  const sourceNode = edgeStateManager.getSourceNode();
  if (!sourceNode) {
    console.error('ไม่พบ source node');
    return;
  }
  
  // ตรวจสอบว่าไม่ใช่ Node เดียวกัน
  if (sourceNode === targetNode) {
    console.warn('ไม่สามารถสร้าง edge ไปยัง Node เดียวกันได้');
    edgeStateManager.cancelEdgeCreation();
    return;
  }
  
  // ลบ preview line ออกจาก stage ก่อน
  const previewLine = edgeStateManager.getPreviewLine();
  if (previewLine && previewLine.parent) {
    previewLine.parent.removeChild(previewLine);
  }
  
  // สร้าง edge จริงด้วย createEdge()
  const edgeContainer = createEdge(sourceNode, targetNode);
  
  // หา stage เพื่อเพิ่ม edge ลงไป
  let currentParent = targetNode.parent;
  while (currentParent && currentParent.parent) {
    currentParent = currentParent.parent as Container;
  }
  
  if (currentParent) {
    currentParent.addChild(edgeContainer);
    console.log('เพิ่ม Edge ลงใน stage แล้ว');
  }
  
  // เสร็จสิ้นการสร้าง edge ใน state manager
  const edgeData = edgeStateManager.completeEdge(targetNode, edgeContainer as any, 'เชื่อมต่อ');
  
  // Reset visual states
  // 1. Reset node tints กลับเป็นสีขาว
  const sourceGraphics = (sourceNode as any).boxGraphics;
  const targetGraphics = (targetNode as any).boxGraphics;
  if (sourceGraphics) sourceGraphics.tint = 0xFFFFFF;
  if (targetGraphics) targetGraphics.tint = 0xFFFFFF;
  
  // 2. Reset connection states (ถ้าไม่ถูก pin ไว้ ให้ซ่อน connection points)
  connectionStateManager.setHoveredNode(null);
  
  if (edgeData) {
    console.log('สร้าง Edge สำเร็จ:', edgeData.id);
  }
}