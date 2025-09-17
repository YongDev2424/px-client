// src/components/Edge.ts

import { Container, Graphics, Point } from 'pixi.js';

/**
 * คำนวณจุดกึ่งกลางระหว่างสองจุด
 * @param point1 - จุดที่ 1
 * @param point2 - จุดที่ 2
 * @returns จุดกึ่งกลาง
 */
function getMidPoint(point1: Point, point2: Point): Point {
  return new Point(
    (point1.x + point2.x) / 2,
    (point1.y + point2.y) / 2
  );
}

/**
 * คำนวณมุมของเส้นระหว่างสองจุด (ในหน่วย radian)
 * @param from - จุดเริ่มต้น
 * @param to - จุดปลายทาง
 * @returns มุมในหน่วย radian
 */
function getAngleBetweenPoints(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * คำนวณตำแหน่งของจุดเชื่อมต่อบน Node (ตำแหน่งจริงของ connection point)
 * @param node - Container ของ Node
 * @returns ตำแหน่งจริงของ connection point บน Node
 */
function getConnectionPointPosition(node: Container): Point {
  // หา connection point ที่อยู่ใน Node (child ที่มี cursor = 'crosshair')
  const connectionPoint = node.children.find(child => 
    (child as any).cursor === 'crosshair'
  );
  
  if (connectionPoint) {
    // ใช้ตำแหน่งจริงของ connection point
    const globalPos = node.toGlobal(new Point(connectionPoint.x, connectionPoint.y));
    return globalPos;
  } else {
    // fallback: ใช้จุดกึ่งกลางของ Node ถ้าหา connection point ไม่เจอ
    const bounds = node.getBounds();
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    return new Point(centerX, centerY);
  }
}

/**
 * สร้าง "ส่วนประกอบภาพ" ของลูกศร (Arrow Head)
 * @param tipPosition - ตำแหน่งของปลายลูกศร
 * @param angle - มุมของลูกศร (ในหน่วย radian)
 * @param size - ขนาดของลูกศร (ค่าเริ่มต้น 10)
 * @param color - สีของลูกศร (ค่าเริ่มต้น สีดำ)
 * @returns Graphics object ของลูกศร
 */
function createArrowHead(tipPosition: Point, angle: number, size: number = 10, color: number = 0x000000): Graphics {
  const arrow = new Graphics();
  
  // คำนวณจุดต่างๆ ของลูกศร (รูปสามเหลี่ยม)
  const arrowLength = size;
  const arrowWidth = size * 0.6;
  
  // จุดปลายของลูกศร
  const tip = tipPosition;
  
  // จุดฐานซ้ายและขวาของลูกศร
  const baseLeft = new Point(
    tip.x - arrowLength * Math.cos(angle) + arrowWidth * Math.cos(angle + Math.PI / 2),
    tip.y - arrowLength * Math.sin(angle) + arrowWidth * Math.sin(angle + Math.PI / 2)
  );
  
  const baseRight = new Point(
    tip.x - arrowLength * Math.cos(angle) + arrowWidth * Math.cos(angle - Math.PI / 2),
    tip.y - arrowLength * Math.sin(angle) + arrowWidth * Math.sin(angle - Math.PI / 2)
  );
  
  // วาดสามเหลี่ยมลูกศร
  arrow.fill(color);
  arrow.moveTo(tip.x, tip.y);
  arrow.lineTo(baseLeft.x, baseLeft.y);
  arrow.lineTo(baseRight.x, baseRight.y);
  arrow.lineTo(tip.x, tip.y);
  arrow.fill();
  
  return arrow;
}

/**
 * สร้าง Edge (เส้นเชื่อม) แบบ static ระหว่างสอง Node
 * @param sourceNode - Node ต้นทาง
 * @param targetNode - Node ปลายทาง
 * @param lineColor - สีของเส้น (ค่าเริ่มต้น สีดำ)
 * @param lineWidth - ความหนาของเส้น (ค่าเริ่มต้น 2)
 * @param showArrow - แสดงลูกศรหรือไม่ (ค่าเริ่มต้น true)
 * @returns Container ที่ประกอบด้วยเส้นและลูกศร
 */
export function createEdge(
  sourceNode: Container, 
  targetNode: Container,
  lineColor: number = 0x000000,
  lineWidth: number = 2,
  showArrow: boolean = true
): Container {
  // สร้าง Container หลักสำหรับ Edge
  const edgeContainer = new Container();
  
  // คำนวณตำแหน่งจุดเชื่อมต่อของทั้งสอง Node
  const startPoint = getConnectionPointPosition(sourceNode);
  const endPoint = getConnectionPointPosition(targetNode);
  
  // สร้าง Graphics สำหรับเส้น
  const lineGraphics = new Graphics();
  lineGraphics.stroke({ width: lineWidth, color: lineColor });
  lineGraphics.moveTo(startPoint.x, startPoint.y);
  lineGraphics.lineTo(endPoint.x, endPoint.y);
  lineGraphics.stroke();
  
  // เพิ่มเส้นเข้าใน Container
  edgeContainer.addChild(lineGraphics);
  
  // สร้างลูกศรถ้าต้องการ
  if (showArrow) {
    const angle = getAngleBetweenPoints(startPoint, endPoint);
    const arrowGraphics = createArrowHead(endPoint, angle, 12, lineColor);
    edgeContainer.addChild(arrowGraphics);
  }
  
  // เก็บข้อมูล metadata ไว้ใน Container (สำหรับใช้ภายหลัง)
  (edgeContainer as any).edgeData = {
    sourceNode,
    targetNode,
    startPoint: startPoint.clone(),
    endPoint: endPoint.clone()
  };
  
  return edgeContainer;
}

/**
 * สร้าง Preview Edge (เส้นเชื่อมชั่วคราว) ที่ตามเมาส์
 * ใช้สำหรับแสดงระหว่างที่ผู้ใช้กำลังลากเส้นเพื่อสร้าง Edge
 * @param startPoint - จุดเริ่มต้น (พิกัด global)
 * @param endPoint - จุดปลายทาง (พิกัด global, ตำแหน่งเมาส์)
 * @param lineColor - สีของเส้น (ค่าเริ่มต้น สีเทา)
 * @param lineWidth - ความหนาของเส้น (ค่าเริ่มต้น 2)
 * @param alpha - ความโปร่งใส (ค่าเริ่มต้น 0.7)
 * @returns Graphics object ของเส้น preview
 */
export function createPreviewEdge(
  startPoint: Point,
  endPoint: Point,
  lineColor: number = 0x666666,
  lineWidth: number = 2,
  alpha: number = 0.7
): Graphics {
  const previewLine = new Graphics();
  
  // ปิด hit testing เพื่อไม่ให้บัง target Node
  previewLine.eventMode = 'none';
  
  // ตั้งค่าความโปร่งใส
  previewLine.alpha = alpha;
  
  // วาดเส้นจาก startPoint ไป endPoint
  previewLine.stroke({ width: lineWidth, color: lineColor });
  previewLine.moveTo(startPoint.x, startPoint.y);
  previewLine.lineTo(endPoint.x, endPoint.y);
  previewLine.stroke();
  
  return previewLine;
}

/**
 * อัปเดตตำแหน่งของ Edge เมื่อ Node เคลื่อนที่
 * @param edgeContainer - Container ของ Edge ที่ต้องการอัปเดต
 */
export function updateEdgePosition(edgeContainer: Container): void {
  const edgeData = (edgeContainer as any).edgeData;
  if (!edgeData) {
    console.warn('ไม่พบข้อมูล edgeData ใน Container');
    return;
  }
  
  const { sourceNode, targetNode } = edgeData;
  
  // คำนวณตำแหน่งใหม่
  const newStartPoint = getConnectionPointPosition(sourceNode);
  const newEndPoint = getConnectionPointPosition(targetNode);
  
  // ล้างและวาดใหม่
  edgeContainer.removeChildren();
  
  // สร้างเส้นใหม่
  const lineGraphics = new Graphics();
  lineGraphics.stroke({ width: 2, color: 0x000000 });
  lineGraphics.moveTo(newStartPoint.x, newStartPoint.y);
  lineGraphics.lineTo(newEndPoint.x, newEndPoint.y);
  lineGraphics.stroke();
  
  // สร้างลูกศรใหม่
  const angle = getAngleBetweenPoints(newStartPoint, newEndPoint);
  const arrowGraphics = createArrowHead(newEndPoint, angle);
  
  // เพิ่มกลับเข้าไป
  edgeContainer.addChild(lineGraphics);
  edgeContainer.addChild(arrowGraphics);
  
  // อัปเดต metadata
  edgeData.startPoint = newStartPoint;
  edgeData.endPoint = newEndPoint;
}

/**
 * คำนวณตำแหน่งกึ่งกลางของ Edge สำหรับวาง Label
 * @param edgeContainer - Container ของ Edge
 * @returns จุดกึ่งกลางของเส้น หรือ null ถ้าไม่พบข้อมูล
 */
export function getEdgeMidPoint(edgeContainer: Container): Point | null {
  const edgeData = (edgeContainer as any).edgeData;
  if (!edgeData) {
    return null;
  }
  
  return getMidPoint(edgeData.startPoint, edgeData.endPoint);
}

/**
 * คำนวณมุมของ Edge สำหรับหมุน Label ให้ขนานกับเส้น
 * @param edgeContainer - Container ของ Edge
 * @returns มุมในหน่วย radian หรือ 0 ถ้าไม่พบข้อมูล
 */
export function getEdgeAngle(edgeContainer: Container): number {
  const edgeData = (edgeContainer as any).edgeData;
  if (!edgeData) {
    return 0;
  }
  
  return getAngleBetweenPoints(edgeData.startPoint, edgeData.endPoint);
}

/**
 * ตรวจสอบว่า Edge เชื่อมต่อกับ Node ที่ระบุหรือไม่
 * @param edgeContainer - Container ของ Edge
 * @param node - Node ที่ต้องการตรวจสอบ
 * @returns true ถ้า Edge เชื่อมต่อกับ Node นี้
 */
export function isEdgeConnectedToNode(edgeContainer: Container, node: Container): boolean {
  const edgeData = (edgeContainer as any).edgeData;
  if (!edgeData) {
    return false;
  }
  
  return edgeData.sourceNode === node || edgeData.targetNode === node;
}