// src/components/Edge.ts

import { Container, Graphics, Point, FederatedPointerEvent } from 'pixi.js';
import { createEditableLabel } from './EditableLabel';

// Enhanced Property System Integration (Function-Based)
import { usePropertyActions, useDrawerActions } from '../composables';
import { PropertyCountBadge, createPropertyCountBadge } from './PropertyCountBadge';
import { createSimpleDoubleClickHandler } from '../utils/doubleClickDetector';

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
 * สร้าง Floating Edge Label ที่มีดีไซน์คล้าย Node แต่โปร่งใสกว่า
 * @param labelText - ข้อความ label
 * @param onTextChange - callback เมื่อข้อความเปลี่ยน
 * @returns Container ของ floating label
 */
function createFloatingEdgeLabel(
  labelText: string,
  onTextChange?: (newText: string, oldText: string) => void
): Container {
  const labelContainer = new Container();
  
  // สร้างพื้นหลังกล่อง (คล้าย Node แต่โปร่งใสกว่า)
  const labelBackground = new Graphics();
  
  // คำนวณขนาดกล่องตามความยาวข้อความ
  const padding = 8;
  const textWidth = labelText.length * 7; // ประมาณการความกว้างข้อความ
  const boxWidth = Math.max(60, textWidth + padding * 2);
  const boxHeight = 24;
  
  // วาดกล่องพื้นหลังแบบ outlined พร้อม rounded corners (เหลี่ยมมากขึ้น)
  labelBackground
    .roundRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight, 4) // radius น้อยลง (เหลี่ยมมากขึ้น)
    .fill({ color: 0x1e1e1e, alpha: 0.6 }) // โปร่งใสมากขึ้น
    .stroke({ width: 1, color: 0x999999, alpha: 0.4 }); // ขอบโปร่งใสมากขึ้น
  
  // สร้าง label ด้วย createEditableLabel
  const textLabel = createEditableLabel({
    text: labelText,
    fontSize: 11,
    textColor: 0xFFFFFF,
    hasBackground: false, // ไม่ต้องการพื้นหลังเพิ่ม เพราะมีแล้ว
    onTextChange: onTextChange || (() => {}),
    onEditStart: () => {
      console.log('เริ่มแก้ไข Edge label');
    },
    onEditEnd: () => {
      console.log('จบการแก้ไข Edge label');
    }
  });
  
  // จัดตำแหน่งข้อความให้อยู่กึ่งกลางกล่อง
  textLabel.x = 0;
  textLabel.y = 0;
  
  // เพิ่มส่วนประกอบเข้าใน container
  labelContainer.addChild(labelBackground);
  labelContainer.addChild(textLabel);
  
  // เพิ่ม hover effects
  labelContainer.eventMode = 'static';
  labelContainer.cursor = 'pointer';
  
  labelContainer.on('pointerover', () => {
    labelBackground.alpha = 0.9; // เพิ่มความทึบเมื่อ hover (แต่ยังโปร่งใส)
  });
  
  labelContainer.on('pointerout', () => {
    labelBackground.alpha = 0.6; // กลับเป็นโปร่งใสเดิม
  });
  
  // เก็บ reference สำหรับการอัพเดทภายหลัง
  (labelContainer as any).labelBackground = labelBackground;
  (labelContainer as any).textLabel = textLabel;
  
  return labelContainer;
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
 * @param returnLocalCoordinates - คืนค่าเป็น local coordinates ของ stage หรือไม่ (default: false = global)
 * @returns ตำแหน่งจริงของ connection point บน Node
 */
function getConnectionPointPosition(node: Container, preferredSide?: string, returnLocalCoordinates: boolean = false): Point {
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
    
    const globalCenter = new Point(centerX, centerY);
    
    if (returnLocalCoordinates) {
      // หา stage และแปลงเป็น local coordinates
      let stage = node.parent;
      while (stage && stage.parent) {
        stage = stage.parent as Container;
      }
      return stage ? stage.toLocal(globalCenter) : globalCenter;
    }
    
    return globalCenter;
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
  
  if (returnLocalCoordinates) {
    // หา stage และแปลงเป็น local coordinates
    let stage = node.parent;
    while (stage && stage.parent) {
      stage = stage.parent as Container;
    }
    const localPos = stage ? stage.toLocal(globalPos) : globalPos;
    console.log('📍 Connection Point local position:', localPos);
    return localPos;
  }
  
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
 * @param sourceSide - ด้านของ source node (optional)
 * @param targetSide - ด้านของ target node (optional)
 * @param enhanced - เปิดใช้การปรับปรุงรูปแบบหรือไม่ (ค่าเริ่มต้น false)
 * @returns Container ที่ประกอบด้วยเส้น, ลูกศร และ Label
 */
export function createEdge(
  sourceNode: Container, 
  targetNode: Container,
  labelText: string = 'relationship',
  lineColor: number = 0x999999, // เปลี่ยนจากสีดำเป็นสีเทาออกขาว
  lineWidth: number = 2,
  showArrow: boolean = true,
  sourceSide?: string,
  targetSide?: string,
  enhanced: boolean = false
): Container {
  // สร้าง Container หลักสำหรับ Edge
  const edgeContainer = new Container();
  
  // สร้าง unique edgeId สำหรับ Enhanced Property System
  const edgeId = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // คำนวณตำแหน่งจุดเชื่อมต่อของทั้งสอง Node (ใช้ local coordinates เพื่อรองรับ zoom)
  const startPoint = getConnectionPointPosition(sourceNode, sourceSide, true);
  const endPoint = getConnectionPointPosition(targetNode, targetSide, true);
  
  console.log('✅ สร้าง Edge:');
  console.log('📍 Source (local):', startPoint, 'side:', sourceSide);
  console.log('📍 Target (local):', endPoint, 'side:', targetSide);
  
  // Initialize Enhanced Property System สำหรับ Edge (Function-Based)
  const propertyActions = usePropertyActions(edgeId);
  const drawerActions = useDrawerActions();
  
  // สร้าง default properties สำหรับ Edge
  propertyActions.createTextProperty('label', labelText, { 
    required: true, 
    metadata: { category: 'basic', order: 0 } 
  });
  propertyActions.createTextProperty('type', 'relationship', {
    metadata: { category: 'basic', order: 1 }
  });
  propertyActions.createTextProperty('description', '', {
    metadata: { category: 'basic', order: 2 }
  });
  propertyActions.createArrayProperty('tags', [], {
    metadata: { category: 'classification', order: 3, maxItems: 5 }
  });
  
  // สร้าง Graphics สำหรับเส้นเดียวกัน (ไม่แบ่งเป็นสองส่วน)
  const lineGraphics = new Graphics();
  lineGraphics
    .moveTo(startPoint.x, startPoint.y)
    .lineTo(endPoint.x, endPoint.y)
    .stroke({ width: lineWidth, color: lineColor });
  
  // เพิ่ม label สำหรับ hit area detection
  lineGraphics.label = 'edge-line';

  // เพิ่ม hover effects สำหรับ edge
  lineGraphics.eventMode = 'static';
  lineGraphics.cursor = 'pointer';
  
  lineGraphics.on('pointerover', () => {
    lineGraphics.tint = 0xFFFFFF; // เปลี่ยนเป็นสีขาวเมื่อ hover
  });
  
  lineGraphics.on('pointerout', () => {
    lineGraphics.tint = 0x999999; // กลับเป็นสีเทาออกขาว
  });
  
  // สร้าง Double-Click Handler สำหรับ Edge Line (Function-Based)
  const handleEdgeDoubleClick = createSimpleDoubleClickHandler(() => {
    console.log('🖱️ Double-click detected on Edge:', edgeId);
    
    // เปิด Property Drawer ด้วย Enhanced Property System
    drawerActions.openForEdge(edgeContainer, edgeId, {
      tab: 'properties',
      edgeName: propertyActions.getProperty('label')?.value as string || labelText,
      autoFocus: true
    });
  }, 300); // Doherty Threshold: 300ms
  
  // เพิ่ม double-click detection สำหรับ edge line
  lineGraphics.on('pointerdown', handleEdgeDoubleClick);
  
  // เพิ่มเส้นเข้าใน Container
  edgeContainer.addChild(lineGraphics);
  
  // สร้างลูกศรถ้าต้องการ
  let arrowGraphics: Graphics | null = null;
  if (showArrow) {
    const angle = getAngleBetweenPoints(startPoint, endPoint);
    arrowGraphics = createArrowHead(endPoint, angle, 12, lineColor);
    
    // เพิ่ม hover effects สำหรับลูกศรด้วย
    arrowGraphics.eventMode = 'static';
    arrowGraphics.cursor = 'pointer';
    
    arrowGraphics.on('pointerover', () => {
      arrowGraphics!.tint = 0xFFFFFF; // เปลี่ยนเป็นสีขาวเมื่อ hover
    });
    
    arrowGraphics.on('pointerout', () => {
      arrowGraphics!.tint = 0x999999; // กลับเป็นสีเทาออกขาว
    });
    
    edgeContainer.addChild(arrowGraphics);
  }

  // สร้าง Floating Label ที่มีดีไซน์คล้าย Node
  const labelContainer = createFloatingEdgeLabel(labelText, (newText: string, oldText: string) => {
    console.log(`Edge label เปลี่ยนจาก "${oldText}" เป็น "${newText}"`);
    // อัปเดต label property
    propertyActions.updateProperty('label', newText);
    // อัปเดต metadata
    (edgeContainer as any).edgeData.labelText = newText;
  });

  // เพิ่ม double-click สำหรับ label container ด้วย
  const handleLabelDoubleClick = createSimpleDoubleClickHandler(() => {
    console.log('🖱️ Double-click detected on Edge Label:', edgeId);
    drawerActions.openForEdge(edgeContainer, edgeId, {
      tab: 'properties',
      edgeName: propertyActions.getProperty('label')?.value as string || labelText,
      autoFocus: true
    });
  }, 300);
  
  labelContainer.on('pointerdown', handleLabelDoubleClick);

  // สร้าง PropertyCountBadge สำหรับ Edge (แสดงบน label)
  const propertyBadge = createPropertyCountBadge({
    count: propertyActions.getPropertyCount(),
    position: 'top-right',
    hasChanges: false,
    size: 'small', // ใช้ขนาดเล็กสำหรับ edge
    theme: 'auto',
    onClick: () => {
      console.log('🎯 Edge PropertyCountBadge คลิก - เปิด Property Drawer สำหรับ Edge:', edgeId);
      drawerActions.openForEdge(edgeContainer, edgeId, {
        tab: 'properties',
        edgeName: propertyActions.getProperty('label')?.value as string || labelText
      });
    }
  });

  // เพิ่ม badge เข้าใน label container
  labelContainer.addChild(propertyBadge);
  
  // จัดตำแหน่ง PropertyCountBadge (top-right of label)
  const badgeOffset = { x: 6, y: -6 }; // เล็กกว่า node badge
  propertyBadge.x = (labelContainer.width / 2) + badgeOffset.x;
  propertyBadge.y = -(labelContainer.height / 2) + badgeOffset.y;

  // วางตำแหน่ง Label ตรงกลาง Edge (floating เหนือเส้น)
  const labelMidPoint = getMidPoint(startPoint, endPoint);
  labelContainer.x = labelMidPoint.x;
  labelContainer.y = labelMidPoint.y - 15; // ยกขึ้นเหนือเส้นเล็กน้อย

  // เพิ่ม Label เข้าใน Edge Container
  edgeContainer.addChild(labelContainer);
  
  // เก็บ Enhanced metadata ไว้ใน Container (สำหรับใช้ภายหลัง)
  (edgeContainer as any).edgeData = {
    edgeId: edgeId,               // เพิ่ม unique edgeId
    sourceNode,
    targetNode,
    startPoint: startPoint.clone(),
    endPoint: endPoint.clone(),
    labelText: labelText,
    labelContainer: labelContainer,
    propertyBadge: propertyBadge, // เพิ่ม property badge reference
    sourceSide: sourceSide,       // เก็บ side ของ source
    targetSide: targetSide,       // เก็บ side ของ target
    hasProperties: true,          // รองรับ Enhanced Property System
    propertyCount: propertyActions.getPropertyCount(),
    edgeType: 'relationship'      // ประเภท edge
  };

  // Setup Property Event Listeners สำหรับ Edge (Function-Based)
  const updateEdgePropertyBadge = () => {
    const currentCount = propertyActions.getPropertyCount();
    propertyBadge.updateCount(currentCount, false);
    
    // อัพเดท metadata
    (edgeContainer as any).edgeData.propertyCount = currentCount;
    
    console.log('🏷️ Edge property count updated:', edgeId, 'Count:', currentCount);
  };

  // Listen for property changes สำหรับ Edge
  window.addEventListener('property-changed', (event: CustomEvent) => {
    if (event.detail.elementId === edgeId) {
      updateEdgePropertyBadge();
    }
  });

  window.addEventListener('properties-batch-updated', (event: CustomEvent) => {
    if (event.detail.elementId === edgeId) {
      updateEdgePropertyBadge();
    }
  });
  
  // 🔗 เพิ่ม selectable capability ให้กับ Edge
  const edgeData = {
    labelText,
    relationshipType: 'default',
    sourceId: (sourceNode as any).nodeData?.id || 'unknown-source',
    targetId: (targetNode as any).nodeData?.id || 'unknown-target',
    sourceSide,
    targetSide
  };

  // เพิ่ม selectable capability ใช้ dynamic import เพื่อหลีกเลี่ยง circular dependency)
  import('../utils/selectableEdge').then(({ makeSelectableEdge }) => {
    makeSelectableEdge(edgeContainer, {
      data: edgeData,
      hitAreaPadding: 15, // เพิ่ม hit area สำหรับ edge selection ที่ง่ายขึ้น
      onSelect: () => {
        console.log('🔗 Edge selected for toolbar actions:', labelText);
      },
      onDeselect: () => {
        console.log('⭕ Edge deselected from toolbar:', labelText);
      }
    });
  });

  // 🎨 ADDITIVE ENHANCEMENT: เพิ่มการปรับปรุงรูปแบบแบบ optional
  if (enhanced) {
    // Import EdgeStyler แบบ dynamic เพื่อไม่ให้กระทบกับ existing code
    import('./EdgeStyler').then(({ EdgeStyler }) => {
      import('../utils/EdgeThemes').then(({ EdgeThemes }) => {
        EdgeStyler.enhanceExistingEdge(edgeContainer, EdgeThemes.default);
      });
    }).catch(error => {
      console.warn('⚠️ ไม่สามารถโหลด EdgeStyler ได้:', error);
      // Edge ยังคงทำงานได้ปกติแม้ไม่มี enhancement
    });
  }
  
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
  lineColor: number = 0x999999, // ใช้สีเทาออกขาวเหมือน edge จริง
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
  
  // คำนวณตำแหน่งใหม่ โดยใช้ side ที่บันทึกไว้ (ใช้ local coordinates เพื่อรองรับ zoom)
  const sourceSide = (edgeContainer as any).edgeData?.sourceSide;
  const targetSide = (edgeContainer as any).edgeData?.targetSide;
  
  const newStartPoint = getConnectionPointPosition(sourceNode, sourceSide, true);
  const newEndPoint = getConnectionPointPosition(targetNode, targetSide, true);
  
  console.log('🔄 อัปเดต Edge position:');
  console.log('📍 Source Side:', sourceSide, '→ (local)', newStartPoint);
  console.log('📍 Target Side:', targetSide, '→ (local)', newEndPoint);
  
  // ล้างและวาดใหม่
  edgeContainer.removeChildren();
  
  // สร้างเส้นเดียวกัน (ไม่แบ่งเป็นสองส่วน)
  const lineGraphics = new Graphics();
  lineGraphics
    .moveTo(newStartPoint.x, newStartPoint.y)
    .lineTo(newEndPoint.x, newEndPoint.y)
    .stroke({ width: 2, color: 0x999999 }); // ใช้สีเทาออกขาว

  // เพิ่ม hover effects สำหรับเส้น
  lineGraphics.eventMode = 'static';
  lineGraphics.cursor = 'pointer';
  
  lineGraphics.on('pointerover', () => {
    lineGraphics.tint = 0xFFFFFF; // เปลี่ยนเป็นสีขาวเมื่อ hover
  });
  
  lineGraphics.on('pointerout', () => {
    lineGraphics.tint = 0x999999; // กลับเป็นสีเทาออกขาว
  });
  
  // สร้างลูกศรใหม่
  const angle = getAngleBetweenPoints(newStartPoint, newEndPoint);
  const arrowGraphics = createArrowHead(newEndPoint, angle, 12, 0x999999); // ใช้สีเทาออกขาว
  
  // เพิ่ม hover effects สำหรับลูกศรด้วย
  arrowGraphics.eventMode = 'static';
  arrowGraphics.cursor = 'pointer';
  
  arrowGraphics.on('pointerover', () => {
    arrowGraphics.tint = 0xFFFFFF; // เปลี่ยนเป็นสีขาวเมื่อ hover
  });
  
  arrowGraphics.on('pointerout', () => {
    arrowGraphics.tint = 0x999999; // กลับเป็นสีเทาออกขาว
  });
  
  // เพิ่มกลับเข้าไป
  edgeContainer.addChild(lineGraphics);
  edgeContainer.addChild(arrowGraphics);
  
  // อัปเดตตำแหน่ง Label ถ้ามี (floating เหนือเส้น)
  if (labelContainer) {
    const newMidPoint = getMidPoint(newStartPoint, newEndPoint);
    labelContainer.x = newMidPoint.x;
    labelContainer.y = newMidPoint.y - 15; // ยกขึ้นเหนือเส้นเล็กน้อย
    
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

/**
 * 🎨 ENHANCED EDGE CREATION - สร้าง Edge พร้อมการปรับปรุงรูปแบบ
 * Helper function สำหรับการสร้าง Edge ที่มีรูปแบบสวยงาม
 * @param sourceNode - Node ต้นทาง
 * @param targetNode - Node ปลายทาง
 * @param labelText - ข้อความ Label
 * @param relationshipType - ประเภทความสัมพันธ์ (เพื่อเลือก theme)
 * @param sourceSide - ด้านของ source node
 * @param targetSide - ด้านของ target node
 * @returns Container ของ Edge ที่ปรับปรุงแล้ว
 */
export function createEnhancedEdge(
  sourceNode: Container,
  targetNode: Container,
  labelText: string = 'relationship',
  relationshipType: string = 'default',
  sourceSide?: string,
  targetSide?: string
): Container {
  // สร้าง Edge พื้นฐานก่อน
  const edge = createEdge(
    sourceNode,
    targetNode,
    labelText,
    0x000000, // สีเริ่มต้น (จะถูกแทนที่โดย theme)
    2,        // ความหนาเริ่มต้น (จะถูกแทนที่โดย theme)
    true,     // แสดงลูกศร
    sourceSide,
    targetSide,
    false     // ไม่ใช้ auto enhancement เพื่อให้เราควบคุมเอง
  );
  
  // เพิ่ม enhancement แบบ manual พร้อม theme ที่เหมาะสม
  import('./EdgeStyler').then(({ EdgeStyler }) => {
    import('../utils/EdgeThemes').then(({ getThemeForRelationship }) => {
      const theme = getThemeForRelationship(relationshipType);
      EdgeStyler.enhanceExistingEdge(edge, theme);
      
      console.log(`✨ สร้าง Enhanced Edge สำเร็จ (theme: ${relationshipType})`);
    });
  }).catch(error => {
    console.warn('⚠️ ไม่สามารถโหลด EdgeStyler ได้:', error);
  });
  
  return edge;
}

/**
 * 🎯 SELECTABLE EDGE CREATION - สร้าง Edge ที่สามารถเลือกได้
 * สร้าง Edge พร้อมความสามารถในการ select สำหรับ toolbar actions
 * @param sourceNode - Node ต้นทาง
 * @param targetNode - Node ปลายทาง
 * @param labelText - ข้อความ Label
 * @param relationshipType - ประเภทความสัมพันธ์
 * @param sourceSide - ด้านของ source node
 * @param targetSide - ด้านของ target node
 * @returns Container ของ Edge ที่สามารถ select ได้
 */
export function createSelectableEdge(
  sourceNode: Container,
  targetNode: Container,
  labelText: string = 'relationship',
  relationshipType: string = 'default',
  sourceSide?: string,
  targetSide?: string
): Container {
  // สร้าง enhanced edge
  const edge = createEnhancedEdge(
    sourceNode,
    targetNode,
    labelText,
    relationshipType,
    sourceSide,
    targetSide
  );
  
  const edgeData = {
    labelText,
    relationshipType,
    sourceNode,
    targetNode,
    sourceSide,
    targetSide
  };
  
  // เพิ่ม selectable capability (ใช้ dynamic import เพื่อหลีกเลี่ยง circular dependency)
  import('../utils/selectableEdge').then(({ makeSelectableEdge }) => {
    makeSelectableEdge(edge, {
      data: edgeData,
      hitAreaPadding: 15, // เพิ่ม hit area สำหรับ edge selection ที่ง่ายขึ้น
      onSelect: () => {
        console.log('🔗 Edge selected for toolbar actions:', labelText);
      },
      onDeselect: () => {
        console.log('⭕ Edge deselected from toolbar:', labelText);
      }
    });
  });
  
  // เก็บ edge data สำหรับการใช้งานภายหลัง
  (edge as any).edgeData = edgeData;
  
  console.log(`🎯 สร้าง Selectable Edge สำเร็จ: ${labelText}`);
  return edge;
}

/**
 * 🔄 RETROFIT ENHANCEMENT - เพิ่มการปรับปรุงให้กับ Edge ที่มีอยู่แล้ว
 * @param existingEdge - Edge Container ที่มีอยู่แล้ว
 * @param relationshipType - ประเภทความสัมพันธ์ (เพื่อเลือก theme)
 * @returns Promise ที่ resolve เมื่อปรับปรุงเสร็จ
 */
export async function enhanceExistingEdge(
  existingEdge: Container,
  relationshipType: string = 'default'
): Promise<void> {
  try {
    const { EdgeStyler } = await import('./EdgeStyler');
    const { getThemeForRelationship } = await import('../utils/EdgeThemes');
    
    const theme = getThemeForRelationship(relationshipType);
    EdgeStyler.enhanceExistingEdge(existingEdge, theme);
    
    console.log(`✨ ปรับปรุง Edge เดิมสำเร็จ (theme: ${relationshipType})`);
  } catch (error) {
    console.warn('⚠️ ไม่สามารถปรับปรุง Edge ได้:', error);
    throw error;
  }
}