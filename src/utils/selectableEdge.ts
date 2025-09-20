// src/utils/selectableEdge.ts

import { Container, Graphics } from 'pixi.js';
import { makeSelectable, type SelectableElement } from '../stores/selectionState';

/**
 * ทำให้ Edge Container เป็น selectable พร้อม hit area ที่ใหญ่ขึ้น
 * @param edgeContainer - Edge container ที่ต้องการทำให้ selectable
 * @param options - ตัวเลือกการตั้งค่า
 * @returns SelectableElement object
 */
export function makeSelectableEdge(
  edgeContainer: Container,
  options: {
    data?: any;
    onSelect?: () => void;
    onDeselect?: () => void;
    hitAreaPadding?: number;
  } = {}
): SelectableElement {
  const { hitAreaPadding = 10 } = options;

  // สร้าง hit area ที่ใหญ่ขึ้นสำหรับ easier selection
  const hitArea = createEdgeHitArea(edgeContainer, hitAreaPadding);
  
  // เพิ่ม hit area เข้าไปใน edge container
  edgeContainer.addChild(hitArea);
  
  // ตั้งค่า interaction
  edgeContainer.eventMode = 'static';
  edgeContainer.cursor = 'pointer';

  // สร้าง enhanced callbacks
  const enhancedOnSelect = () => {
    console.log('🔗 Edge selected:', edgeContainer);
    
    // เรียก original callback
    options.onSelect?.();
    
    // ส่ง event สำหรับ toolbar update
    const event = new CustomEvent('pixi-selection-change', {
      detail: {
        container: edgeContainer,
        action: 'select',
        type: 'edge'
      }
    });
    window.dispatchEvent(event);
  };

  const enhancedOnDeselect = () => {
    console.log('⭕ Edge deselected:', edgeContainer);
    
    // เรียก original callback
    options.onDeselect?.();
    
    // ส่ง event สำหรับ toolbar update
    const event = new CustomEvent('pixi-selection-change', {
      detail: {
        container: edgeContainer,
        action: 'deselect',
        type: 'edge'
      }
    });
    window.dispatchEvent(event);
  };

  // ทำให้ selectable ด้วย type = 'edge'
  const selectableElement = makeSelectable(edgeContainer, {
    type: 'edge',
    data: options.data,
    onSelect: enhancedOnSelect,
    onDeselect: enhancedOnDeselect,
    selectOnClick: true
  });

  console.log('🔗 Created selectable edge');
  return selectableElement;
}

/**
 * สร้าง hit area สำหรับ Edge เพื่อให้เลือกได้ง่ายขึ้น
 * @param edgeContainer - Edge container
 * @param padding - ระยะห่างเพิ่มเติมรอบ edge
 * @returns Graphics hit area
 */
function createEdgeHitArea(edgeContainer: Container, padding: number): Graphics {
  const hitArea = new Graphics();
  
  // ค้นหา line graphics ใน edge container
  const lineGraphics = findLineGraphics(edgeContainer);
  
  if (lineGraphics && lineGraphics.length > 0) {
    // ใช้ bounds ของ line เพื่อสร้าง hit area
    const bounds = lineGraphics[0].getBounds();
    
    // สร้าง rectangle hit area ที่ใหญ่ขึ้น
    hitArea
      .rect(
        bounds.x - padding,
        bounds.y - padding, 
        bounds.width + (padding * 2),
        bounds.height + (padding * 2)
      )
      .fill({ color: 0x000000, alpha: 0 }); // invisible
  } else {
    // fallback: สร้าง hit area จาก edge container bounds
    const bounds = edgeContainer.getBounds();
    
    hitArea
      .rect(
        bounds.x - padding,
        bounds.y - padding,
        bounds.width + (padding * 2), 
        bounds.height + (padding * 2)
      )
      .fill({ color: 0x000000, alpha: 0 }); // invisible
  }
  
  // ตั้งค่า hit area
  hitArea.eventMode = 'static';
  hitArea.label = 'edge-hit-area';
  
  return hitArea;
}

/**
 * ค้นหา line graphics ใน edge container
 * @param container - Container ที่ต้องการค้นหา
 * @returns Array ของ Graphics ที่เป็น line
 */
function findLineGraphics(container: Container): Graphics[] {
  const lineGraphics: Graphics[] = [];
  
  // วนหา Graphics children ที่มี line drawing
  container.children.forEach(child => {
    if (child instanceof Graphics) {
      // ตรวจสอบว่าเป็น line graphics หรือไม่
      // (สามารถปรับเงื่อนไขตาม naming convention ของโปรเจค)
      if (child.label?.includes('line') || child.label?.includes('edge')) {
        lineGraphics.push(child);
      }
    }
  });
  
  return lineGraphics;
}

/**
 * อัปเดต hit area เมื่อ edge เปลี่ยนตำแหน่งหรือขนาด
 * @param edgeContainer - Edge container
 * @param padding - ระยะห่างเพิ่มเติม
 */
export function updateEdgeHitArea(edgeContainer: Container, padding: number = 10): void {
  // ค้นหา hit area เดิม
  const existingHitArea = edgeContainer.children.find(
    child => child.label === 'edge-hit-area'
  ) as Graphics;
  
  if (existingHitArea) {
    // ลบ hit area เดิม
    edgeContainer.removeChild(existingHitArea);
    existingHitArea.destroy();
  }
  
  // สร้าง hit area ใหม่
  const newHitArea = createEdgeHitArea(edgeContainer, padding);
  edgeContainer.addChild(newHitArea);
}

/**
 * ลบ selectable capability จาก Edge
 * @param edgeContainer - Edge container
 */
export function removeSelectableEdge(edgeContainer: Container): void {
  // ค้นหาและลบ hit area
  const hitArea = edgeContainer.children.find(
    child => child.label === 'edge-hit-area'
  );
  
  if (hitArea) {
    edgeContainer.removeChild(hitArea);
    hitArea.destroy();
  }
  
  // ลบ event mode
  edgeContainer.eventMode = 'none';
  edgeContainer.cursor = 'default';
  
  // ลบ SelectableElement ผ่าน selection store
  // (ต้องใช้ removeSelectable function จาก selectionState)
  console.log('🗑️ Removed selectable capability from edge');
}