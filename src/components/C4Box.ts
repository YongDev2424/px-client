// src/components/C4Box.ts

import { Container, Graphics, Application, FederatedPointerEvent, Circle } from 'pixi.js';
import { makeDraggable } from '../utils/draggable';
import { createEditableLabel } from './EditableLabel';
import { fadeIn, fadeOut } from '../utils/animations';
import { connectionStateManager } from '../utils/connectionState';
import { edgeStateManager } from '../utils/edgeState';
import { createPreviewEdge, createEdge } from './Edge';

/**
 * Type สำหรับระบุตำแหน่งของ Connection Point บน C4Box
 * ใช้สำหรับกำหนดว่า Connection Point จะอยู่ด้านไหนของกล่อง
 */
type ConnectionSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * ฟังก์ชัน Helper: สร้างจุดเชื่อมต่อ (วงกลมเล็กๆ) พร้อม Dynamic Hit Area
 * จุดเชื่อมต่อจะเริ่มต้นในสถานะซ่อนอยู่ และจะแสดงเฉพาะเมื่อ hover หรือ click Node
 * @param side - ตำแหน่งของ Connection Point บนกล่อง (top, right, bottom, left)
 * @returns - วัตถุ Graphics ของจุดเชื่อมต่อ
 */
function createConnectionPoint(side: ConnectionSide): Graphics {
  // 1. สร้าง "ผืนผ้าใบ" Graphics ที่ว่างเปล่าขึ้นมาก่อน
  const point = new Graphics();

  // 2. ใช้เมธอดต่างๆ เพื่อ "สั่ง" ให้วาดลงบนผืนผ้าใบนั้น (ตาม PixiJS v8 API)
  point.circle(0, 0, 5); // วาดวงกลมรัศมี 5 pixels
  point.fill(0x000000); // สีดำ (เรียกหลังวาดใน v8)

  // 3. ตั้งค่าการโต้ตอบให้กับ "ผืนผ้าใบ" โดยตรง (เฉพาะเมื่อแสดงผล)
  point.eventMode = 'static';
  point.cursor = 'crosshair'; // เปลี่ยน cursor เพื่อแสดงว่าสามารถสร้าง edge ได้

  // 4. ตั้งค่า hit area เริ่มต้น (รัศมี 5)
  point.hitArea = new Circle(0, 0, 5);

  // 5. ตั้งค่าให้เริ่มต้นในสถานะซ่อนอยู่
  point.visible = false;
  point.alpha = 0;

  // 6. เก็บข้อมูลด้านที่ Connection Point นี้อยู่
  (point as any).side = side;

  // 7. เพิ่มฟังก์ชัน helper สำหรับขยาง/ย่อ hit area
  (point as any).setHitAreaRadius = function(radius: number) {
    this.hitArea = new Circle(0, 0, radius);
  };

  // 8. คืนค่า "ผืนผ้าใบ" (Graphics) ที่วาดเสร็จแล้วออกไป
  return point;
}

/**
 * สร้างจุดเชื่อมต่อทั้ง 4 ด้านของกล่อง C4 
 * และกำหนดตำแหน่งที่ถูกต้องสำหรับแต่ละด้าน
 * @param boxWidth - ความกว้างของกล่อง
 * @param boxHeight - ความสูงของกล่อง  
 * @returns - Object ที่มี ConnectionPoint สำหรับทุกด้าน
 */
function createAllConnectionPoints(boxWidth: number, boxHeight: number): {
  top: Graphics;
  right: Graphics;
  bottom: Graphics;
  left: Graphics;
} {
  // สร้าง Connection Points สำหรับทุกด้าน
  const top = createConnectionPoint('top');
  const right = createConnectionPoint('right');
  const bottom = createConnectionPoint('bottom');
  const left = createConnectionPoint('left');

  // กำหนดตำแหน่งสำหรับแต่ละด้าน
  top.x = boxWidth / 2;    // กึ่งกลางด้านบน
  top.y = 0;               // ที่ขอบด้านบน

  right.x = boxWidth;      // ขอบด้านขวา
  right.y = boxHeight / 2; // กึ่งกลางด้านขวา

  bottom.x = boxWidth / 2; // กึ่งกลางด้านล่าง
  bottom.y = boxHeight;    // ที่ขอบด้านล่าง

  left.x = 0;              // ขอบด้านซ้าย
  left.y = boxHeight / 2;  // กึ่งกลางด้านซ้าย

  return { top, right, bottom, left };
}

/**
 * Setup Event Handlers สำหรับ Connection Point เดียว
 * เพื่อให้สามารถใช้ซ้ำกับ Connection Point ทุกจุดได้
 * @param connectionPoint - จุดเชื่อมต่อที่ต้องการติดตั้ง events
 * @param boxContainer - Container ของ Node ที่ connection point นี้สังกัด
 */
function setupConnectionPointEvents(connectionPoint: Graphics, boxContainer: Container): void {
  // เมื่อ click ที่ Connection Point - เริ่มหรือเสร็จสิ้นการสร้าง Edge
  connectionPoint.on('pointerdown', (event: FederatedPointerEvent) => {
    event.stopPropagation(); // หยุดไม่ให้ไป trigger Container events
    
    // ถ้ากำลังสร้าง edge อยู่แล้ว ให้เสร็จสิ้น edge ที่ connection point นี้
    if (edgeStateManager.isCreatingEdge()) {
      completeEdgeCreation(boxContainer, connectionPoint, event);
    } else {
      // เริ่มสร้าง edge ใหม่จาก connection point นี้
      startEdgeCreation(boxContainer, connectionPoint, event);
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
  // สร้าง Label ที่แก้ไขได้สำหรับ Node
  const boxLabel = createEditableLabel({
    text: labelText,
    fontSize: 18,
    textColor: 0xFFFFFF, // ใช้สีขาวเพื่อให้เห็นชัดบนพื้นหลังสี
    hasBackground: false, // Node label ไม่มีพื้นหลัง
    onTextChange: (newText, oldText) => {
      console.log(`Node label เปลี่ยนจาก "${oldText}" เป็น "${newText}"`);
      // อัปเดต metadata ของ Node
      (boxContainer as any).nodeData = {
        ...(boxContainer as any).nodeData,
        labelText: newText
      };
    },
    onEditStart: () => {
      console.log('เริ่มแก้ไข Node label');
    },
    onEditEnd: () => {
      console.log('จบการแก้ไข Node label');
    }
  });
  const connectionPoints = createAllConnectionPoints(200, 100);

  // 2. นำส่วนประกอบทั้งหมดมาใส่ใน Container (ประกอบร่าง)
  boxContainer.addChild(boxGraphics);
  boxContainer.addChild(boxLabel);
  // เพิ่ม ConnectionPoint ทั้งหมดลงใน Container
  boxContainer.addChild(connectionPoints.top);
  boxContainer.addChild(connectionPoints.right);
  boxContainer.addChild(connectionPoints.bottom);
  boxContainer.addChild(connectionPoints.left);

  // 3. จัดตำแหน่งส่วนประกอบย่อย โดยอิงกับขนาดของ Graphics ที่คงที่
  // EditableLabel ใช้ pivot แล้ว ดังนั้นแค่ต้องวางไว้กึ่งกลาง box
  boxLabel.x = boxGraphics.width / 2;
  boxLabel.y = boxGraphics.height / 2;
  
  // ConnectionPoint ถูกจัดตำแหน่งแล้วใน createAllConnectionPoints()

  // 4. กำหนดตำแหน่งเริ่มต้นของ Container ทั้งหมดบนฉาก
  // ใช้ random offset เพื่อป้องกันการซ้อนทับกัน
  const offsetX = (Math.random() - 0.5) * 400; // -200 ถึง +200 pixels
  const offsetY = (Math.random() - 0.5) * 300; // -150 ถึง +150 pixels
  boxContainer.x = (app.screen.width / 2) + offsetX;
  boxContainer.y = (app.screen.height / 2) + offsetY;

  // 5. เก็บ reference ของ components และ metadata ไว้ใน Container เพื่อใช้ใน events
  (boxContainer as any).boxGraphics = boxGraphics;
  (boxContainer as any).connectionPoints = connectionPoints;
  (boxContainer as any).nodeLabel = boxLabel;
  
  // เก็บ metadata ของ Node
  (boxContainer as any).nodeData = {
    labelText: labelText,
    boxColor: boxColor,
    nodeType: 'c4box' // ระบุประเภทของ Node
  };

  // 6. เพิ่ม Event Handlers สำหรับการจัดการ hover และ click effects
  
  // เมื่อ pointer เข้ามา hover บน Container (Node area แต่ไม่ใช่ connection point)
  boxContainer.on('pointerover', (event: FederatedPointerEvent) => {
    event.stopPropagation();
    
    // ปกติ: แสดง connection points ทั้งหมดเมื่อ hover
    connectionStateManager.setHoveredNode(boxContainer);
    fadeIn(connectionPoints.top, 150);
    fadeIn(connectionPoints.right, 150);
    fadeIn(connectionPoints.bottom, 150);
    fadeIn(connectionPoints.left, 150);
  });
  
  // เมื่อ pointer ออกจาก Container
  boxContainer.on('pointerout', (event: FederatedPointerEvent) => {
    event.stopPropagation();
    
    // ปกติ: ซ่อน connection points เมื่อออกจาก hover (เว้นแต่ถูก pin)
    connectionStateManager.setHoveredNode(null);
    
    if (!connectionStateManager.isPinned(boxContainer)) {
      fadeOut(connectionPoints.top, 150);
      fadeOut(connectionPoints.right, 150);
      fadeOut(connectionPoints.bottom, 150);
      fadeOut(connectionPoints.left, 150);
    }
  });
  
  // เมื่อ click บน Container (Node area)
  boxContainer.on('pointerdown', (event: FederatedPointerEvent) => {
    event.stopPropagation();
    
    // ปกติ: คลิกบน Node area = pin/unpin connection points
    const isPinned = connectionStateManager.togglePin(boxContainer);
    
    if (isPinned) {
      fadeIn(connectionPoints.top, 150);
      fadeIn(connectionPoints.right, 150);
      fadeIn(connectionPoints.bottom, 150);
      fadeIn(connectionPoints.left, 150);
    } else if (!connectionStateManager.shouldShowConnections(boxContainer)) {
      fadeOut(connectionPoints.top, 150);
      fadeOut(connectionPoints.right, 150);
      fadeOut(connectionPoints.bottom, 150);
      fadeOut(connectionPoints.left, 150);
    }
  });
  
  // เพิ่ม Event Handlers สำหรับ Connection Point ทั้งหมด (แยกจาก Container)
  setupConnectionPointEvents(connectionPoints.top, boxContainer);
  setupConnectionPointEvents(connectionPoints.right, boxContainer);
  setupConnectionPointEvents(connectionPoints.bottom, boxContainer);
  setupConnectionPointEvents(connectionPoints.left, boxContainer);


  // 7. ทำให้ Container ทั้งหมดสามารถลากได้ (เฉพาะเมื่อคลิกที่ Node area)
  makeDraggable(boxContainer, app);

  // 8. คืนค่า Container ที่สมบูรณ์แล้วออกไป
  return boxContainer;
}

/**
 * เริ่มต้นการสร้าง Edge จาก Connection Point
 * @param sourceNode - Node ที่เป็นจุดเริ่มต้น
 * @param sourceConnectionPoint - Connection Point ที่เป็นจุดเริ่มต้น
 * @param event - Pointer event จากการคลิก
 */
function startEdgeCreation(sourceNode: Container, sourceConnectionPoint: Graphics, event: FederatedPointerEvent): void {
  console.log('เริ่มสร้าง Edge จาก Node:', sourceNode, 'ด้าน:', (sourceConnectionPoint as any).side);
  
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
  
  // เริ่มต้นการสร้าง edge พร้อมส่ง source connection point
  edgeStateManager.startEdgeCreation(sourceNode, startPoint, previewLine, sourceConnectionPoint);
}

/**
 * เสร็จสิ้นการสร้าง Edge เมื่อคลิกที่ Connection Point ของ Node ปลายทาง
 * @param targetNode - Node ที่เป็นจุดปลายทาง
 * @param targetConnectionPoint - Connection Point ที่เป็นจุดปลายทาง
 * @param event - Pointer event จากการคลิก
 */
function completeEdgeCreation(targetNode: Container, targetConnectionPoint: Graphics, _event: FederatedPointerEvent): void {
  console.log('เสร็จสิ้นการสร้าง Edge ที่ Node:', targetNode, 'ด้าน:', (targetConnectionPoint as any).side);
  
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
  
  // ได้ข้อมูล side จาก connection points
  const sourceConnectionPoint = edgeStateManager.getSourceConnectionPoint();
  const sourceSide = sourceConnectionPoint ? (sourceConnectionPoint as any).side : 'right';
  const targetSide = (targetConnectionPoint as any).side;
  
  // สร้าง edge จริงด้วย createEdge() พร้อม side information
  const edgeContainer = createEdge(sourceNode, targetNode, 'relationship', 0x000000, 2, true, sourceSide, targetSide);
  
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