// src/components/Edge.ts

import { Container, Graphics, Point } from 'pixi.js';
import { createEditableLabel } from './EditableLabel';
import { positionLabelOnEdge } from './EdgeLabel';

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
 * @param preferredSide - ด้านที่ต้องการ (optional) หากไม่ระบุจะใช้ connection point แรกที่เจอ
 * @returns ตำแหน่งจริงของ connection point บน Node
 */
function getConnectionPointPosition(node: Container, preferredSide?: string): Point {
  // หา connection points ทั้งหมดที่อยู่ใน Node (children ที่มี cursor = 'crosshair')
  const connectionPoints = node.children.filter(child => 
    (child as any).cursor === 'crosshair'
  );
  
  if (connectionPoints.length === 0) {
    // fallback: ใช้จุดกึ่งกลางของ Node ถ้าหา connection point ไม่เจอ
    const bounds = node.getBounds();
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    console.warn('⚠️ ไม่พบ Connection Points ใน Node, ใช้จุดกึ่งกลาง');
    return new Point(centerX, centerY);
  }
  
  let selectedConnectionPoint = connectionPoints[0]; // default เป็นตัวแรก
  console.log('🎯 Connection Points ที่พบ:', connectionPoints.length, 'จุด');
  console.log('🔍 กำลังหา preferredSide:', preferredSide);
  
  // ถ้าระบุ side ที่ต้องการ ให้หา connection point ที่ตรงกัน
  if (preferredSide) {
    console.log('📋 Connection Points ทั้งหมด:');
    connectionPoints.forEach((point, index) => {
      console.log(`   [${index}] side: ${(point as any).side || 'undefined'}`);
    });
    
    const matchingPoint = connectionPoints.find(point => 
      (point as any).side === preferredSide
    );
    
    if (matchingPoint) {
      console.log('✅ พบ Connection Point ที่ตรงกับ side:', preferredSide);
      selectedConnectionPoint = matchingPoint;
    } else {
      console.warn('❌ ไม่พบ Connection Point สำหรับ side:', preferredSide, 'ใช้ตัวแรก');
    }
  }
  
  // ใช้ตำแหน่งจริงของ connection point ที่เลือก (PixiJS v8 API)
  const globalPos = selectedConnectionPoint.getGlobalPosition();
  console.log('🔍 Connection Point global position:', globalPos, 'side:', (selectedConnectionPoint as any).side);
  return globalPos;
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
  arrow
    .moveTo(tip.x, tip.y)
    .lineTo(baseLeft.x, baseLeft.y)
    .lineTo(baseRight.x, baseRight.y)
    .lineTo(tip.x, tip.y)
    .fill({ color });
  
  return arrow;
}

/**
 * สร้าง Edge (เส้นเชื่อม) แบบ static ระหว่างสอง Node พร้อม Label
 * แบ่งเส้นออกเป็น 2 ส่วนเพื่อสร้างช่องว่างสำหรับ Label
 * @param sourceNode - Node ต้นทาง
 * @param targetNode - Node ปลายทาง
 * @param labelText - ข้อความ Label บน Edge (ค่าเริ่มต้น "relationship")
 * @param lineColor - สีของเส้น (ค่าเริ่มต้น สีดำ)
 * @param lineWidth - ความหนาของเส้น (ค่าเริ่มต้น 2)
 * @param showArrow - แสดงลูกศรหรือไม่ (ค่าเริ่มต้น true)
 * @returns Container ที่ประกอบด้วยเส้น, ลูกศร และ Label
 */
export function createEdge(
  sourceNode: Container, 
  targetNode: Container,
  labelText: string = 'relationship',
  lineColor: number = 0x000000,
  lineWidth: number = 2,
  showArrow: boolean = true,
  sourceSide?: string,
  targetSide?: string
): Container {
  // สร้าง Container หลักสำหรับ Edge
  const edgeContainer = new Container();
  
  // คำนวณตำแหน่งจุดเชื่อมต่อของทั้งสอง Node
  const startPoint = getConnectionPointPosition(sourceNode, sourceSide);
  const endPoint = getConnectionPointPosition(targetNode, targetSide);
  
  console.log('✅ สร้าง Edge:');
  console.log('📍 Source:', startPoint, 'side:', sourceSide);
  console.log('📍 Target:', endPoint, 'side:', targetSide);
  
  // คำนวณจุดกึ่งกลางและช่องว่างสำหรับ label
  const midPoint = getMidPoint(startPoint, endPoint);
  const totalDistance = Math.sqrt((endPoint.x - startPoint.x) ** 2 + (endPoint.y - startPoint.y) ** 2);
  const labelGapSize = 60; // ขนาดช่องว่างสำหรับ label (pixels)
  
  // คำนวณจุดที่เส้นจะหยุดและเริ่มใหม่
  const gapRatio = labelGapSize / totalDistance;
  const gapStart = {
    x: midPoint.x - (endPoint.x - startPoint.x) * gapRatio * 0.5,
    y: midPoint.y - (endPoint.y - startPoint.y) * gapRatio * 0.5
  };
  const gapEnd = {
    x: midPoint.x + (endPoint.x - startPoint.x) * gapRatio * 0.5,
    y: midPoint.y + (endPoint.y - startPoint.y) * gapRatio * 0.5
  };
  
  // สร้าง Graphics สำหรับเส้นส่วนแรก (จาก start ถึง gap start)
  const lineGraphics1 = new Graphics();
  lineGraphics1
    .moveTo(startPoint.x, startPoint.y)
    .lineTo(gapStart.x, gapStart.y)
    .stroke({ width: lineWidth, color: lineColor });
  
  // สร้าง Graphics สำหรับเส้นส่วนที่สอง (จาก gap end ถึง end)
  const lineGraphics2 = new Graphics();
  lineGraphics2
    .moveTo(gapEnd.x, gapEnd.y)
    .lineTo(endPoint.x, endPoint.y)
    .stroke({ width: lineWidth, color: lineColor });
  
  // เพิ่มเส้นทั้งสองส่วนเข้าใน Container
  edgeContainer.addChild(lineGraphics1);
  edgeContainer.addChild(lineGraphics2);
  
  // สร้างลูกศรถ้าต้องการ
  if (showArrow) {
    const angle = getAngleBetweenPoints(startPoint, endPoint);
    const arrowGraphics = createArrowHead(endPoint, angle, 12, lineColor);
    edgeContainer.addChild(arrowGraphics);
  }

  // สร้าง Label สำหรับ Edge ด้วย unified system
  const labelContainer = createEditableLabel({
    text: labelText,
    fontSize: 12, // เล็กกว่า Node label
    textColor: 0x000000,
    backgroundColor: 0xFFFFFF,
    hasBackground: true, // Edge label มีพื้นหลัง
    padding: 4,
    borderColor: 0xCCCCCC,
    borderWidth: 1,
    onTextChange: (newText: string, oldText: string) => {
      console.log(`Edge label เปลี่ยนจาก "${oldText}" เป็น "${newText}"`);
      // อัปเดต metadata
      (edgeContainer as any).edgeData.labelText = newText;
    },
    onEditStart: () => {
      console.log('เริ่มแก้ไข Edge label');
    },
    onEditEnd: () => {
      console.log('จบการแก้ไข Edge label');
    }
  });

  // วางตำแหน่ง Label ตรงกลาง Edge
  const labelMidPoint = getMidPoint(startPoint, endPoint);
  const angle = getAngleBetweenPoints(startPoint, endPoint);
  positionLabelOnEdge(labelContainer, labelMidPoint, angle, 0);

  // เพิ่ม Label เข้าใน Edge Container
  edgeContainer.addChild(labelContainer);
  
  // เก็บข้อมูล metadata ไว้ใน Container (สำหรับใช้ภายหลัง)
  (edgeContainer as any).edgeData = {
    sourceNode,
    targetNode,
    startPoint: startPoint.clone(),
    endPoint: endPoint.clone(),
    labelText: labelText,
    labelContainer: labelContainer,
    sourceSide: sourceSide,    // เก็บ side ของ source
    targetSide: targetSide     // เก็บ side ของ target
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
  previewLine
    .moveTo(startPoint.x, startPoint.y)
    .lineTo(endPoint.x, endPoint.y)
    .stroke({ width: lineWidth, color: lineColor });
  
  return previewLine;
}

/**
 * อัปเดตตำแหน่งของ Edge และ Label เมื่อ Node เคลื่อนที่
 * รองรับการวาดเส้นแบบแบ่งเป็น 2 ส่วนมีช่องว่างสำหรับ label
 * @param edgeContainer - Container ของ Edge ที่ต้องการอัปเดต
 */
export function updateEdgePosition(edgeContainer: Container): void {
  const edgeData = (edgeContainer as any).edgeData;
  if (!edgeData) {
    console.warn('ไม่พบข้อมูล edgeData ใน Container');
    return;
  }
  
  const { sourceNode, targetNode, labelContainer } = edgeData;
  
  // คำนวณตำแหน่งใหม่ โดยใช้ side ที่บันทึกไว้
  const sourceSide = (edgeContainer as any).edgeData?.sourceSide;
  const targetSide = (edgeContainer as any).edgeData?.targetSide;
  
  const newStartPoint = getConnectionPointPosition(sourceNode, sourceSide);
  const newEndPoint = getConnectionPointPosition(targetNode, targetSide);
  
  console.log('🔄 อัปเดต Edge position:');
  console.log('📍 Source Side:', sourceSide, '→', newStartPoint);
  console.log('📍 Target Side:', targetSide, '→', newEndPoint);
  
  // ล้างและวาดใหม่
  edgeContainer.removeChildren();
  
  // คำนวณจุดกึ่งกลางและช่องว่างสำหรับ label (เหมือนใน createEdge)
  const midPoint = getMidPoint(newStartPoint, newEndPoint);
  const totalDistance = Math.sqrt((newEndPoint.x - newStartPoint.x) ** 2 + (newEndPoint.y - newStartPoint.y) ** 2);
  const labelGapSize = 60; // ขนาดช่องว่างสำหรับ label (pixels)
  
  // คำนวณจุดที่เส้นจะหยุดและเริ่มใหม่
  const gapRatio = labelGapSize / totalDistance;
  const gapStart = {
    x: midPoint.x - (newEndPoint.x - newStartPoint.x) * gapRatio * 0.5,
    y: midPoint.y - (newEndPoint.y - newStartPoint.y) * gapRatio * 0.5
  };
  const gapEnd = {
    x: midPoint.x + (newEndPoint.x - newStartPoint.x) * gapRatio * 0.5,
    y: midPoint.y + (newEndPoint.y - newStartPoint.y) * gapRatio * 0.5
  };
  
  // สร้างเส้นส่วนแรก
  const lineGraphics1 = new Graphics();
  lineGraphics1
    .moveTo(newStartPoint.x, newStartPoint.y)
    .lineTo(gapStart.x, gapStart.y)
    .stroke({ width: 2, color: 0x000000 });
  
  // สร้างเส้นส่วนที่สอง
  const lineGraphics2 = new Graphics();
  lineGraphics2
    .moveTo(gapEnd.x, gapEnd.y)
    .lineTo(newEndPoint.x, newEndPoint.y)
    .stroke({ width: 2, color: 0x000000 });
  
  // สร้างลูกศรใหม่
  const angle = getAngleBetweenPoints(newStartPoint, newEndPoint);
  const arrowGraphics = createArrowHead(newEndPoint, angle);
  
  // เพิ่มกลับเข้าไป
  edgeContainer.addChild(lineGraphics1);
  edgeContainer.addChild(lineGraphics2);
  edgeContainer.addChild(arrowGraphics);
  
  // อัปเดตตำแหน่ง Label ถ้ามี
  if (labelContainer) {
    const newMidPoint = getMidPoint(newStartPoint, newEndPoint);
    const newAngle = getAngleBetweenPoints(newStartPoint, newEndPoint);
    positionLabelOnEdge(labelContainer, newMidPoint, newAngle, 0);
    
    // เพิ่ม Label กลับเข้าไป
    edgeContainer.addChild(labelContainer);
  }
  
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
    console.warn('❌ ไม่พบ edgeData ใน container');
    return false;
  }
  
  const isSource = edgeData.sourceNode === node;
  const isTarget = edgeData.targetNode === node;
  const isConnected = isSource || isTarget;
  
  console.log('🔍 ตรวจสอบการเชื่อมต่อ:');
  console.log('   - edgeData.sourceNode === node:', isSource);
  console.log('   - edgeData.targetNode === node:', isTarget);
  console.log('   - ผลลัพธ์:', isConnected);
  
  return isConnected;
}