// src/components/EdgeLabel.ts

import { Container, Graphics, Text, TextStyle, Point } from 'pixi.js';

/**
 * สร้าง Label สำหรับแสดงบน Edge (เส้นเชื่อม)
 * Label จะประกอบด้วยพื้นหลังและข้อความ
 * @param labelText - ข้อความที่ต้องการแสดง
 * @param fontSize - ขนาดตัวอักษร (ค่าเริ่มต้น 14)
 * @param textColor - สีตัวอักษร (ค่าเริ่มต้น สีดำ)
 * @param backgroundColor - สีพื้นหลัง (ค่าเริ่มต้น สีขาว)
 * @param padding - ระยะห่างรอบๆ ข้อความ (ค่าเริ่มต้น 4)
 * @returns Container ที่ประกอบด้วย background และ text
 */
export function createEdgeLabel(
  labelText: string,
  fontSize: number = 14,
  textColor: number = 0x000000,
  backgroundColor: number = 0xFFFFFF,
  padding: number = 4
): Container {
  // สร้าง Container หลักสำหรับ Label
  const labelContainer = new Container();

  // สร้าง Text Style
  const textStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: fontSize,
    fill: textColor,
    align: 'center',
    fontWeight: 'normal'
  });

  // สร้าง Text Object
  const labelTextObject = new Text({
    text: labelText,
    style: textStyle
  });

  // คำนวณขนาดของพื้นหลัง
  const backgroundWidth = labelTextObject.width + (padding * 2);
  const backgroundHeight = labelTextObject.height + (padding * 2);

  // สร้างพื้นหลัง (กล่องสี่เหลี่ยม)
  const backgroundGraphics = new Graphics();
  backgroundGraphics.fill(backgroundColor);
  backgroundGraphics.stroke({ width: 1, color: 0xCCCCCC }); // เส้นขอบสีเทาอ่อน
  backgroundGraphics.rect(0, 0, backgroundWidth, backgroundHeight);
  backgroundGraphics.fill();
  backgroundGraphics.stroke();

  // จัดตำแหน่งข้อความให้อยู่กึ่งกลางของพื้นหลัง
  labelTextObject.x = padding;
  labelTextObject.y = padding;

  // เพิ่มทั้งสองส่วนเข้าไปใน Container
  labelContainer.addChild(backgroundGraphics);
  labelContainer.addChild(labelTextObject);

  // ตั้งค่า anchor ให้อยู่กึ่งกลาง Container
  labelContainer.pivot.x = backgroundWidth / 2;
  labelContainer.pivot.y = backgroundHeight / 2;

  // เก็บข้อมูล metadata สำหรับใช้ในภายหลัง
  (labelContainer as any).labelData = {
    originalText: labelText,
    textObject: labelTextObject,
    backgroundGraphics: backgroundGraphics,
    fontSize: fontSize,
    textColor: textColor,
    backgroundColor: backgroundColor,
    padding: padding
  };

  return labelContainer;
}

/**
 * วาง Label ให้อยู่ตรงกลางของ Edge และหมุนให้ขนานกับเส้น
 * @param labelContainer - Container ของ Label
 * @param edgeMidPoint - จุดกึ่งกลางของ Edge
 * @param edgeAngle - มุมของ Edge (ในหน่วย radian)
 * @param offsetDistance - ระยะห่างจากเส้น (ค่าเริ่มต้น 0)
 */
export function positionLabelOnEdge(
  labelContainer: Container, 
  edgeMidPoint: Point, 
  edgeAngle: number,
  offsetDistance: number = 0
): void {
  // วางตำแหน่ง Label ที่จุดกึ่งกลางของ Edge
  labelContainer.x = edgeMidPoint.x;
  labelContainer.y = edgeMidPoint.y;

  // หมุน Label ให้ขนานกับเส้น แต่อ่านได้ง่าย
  let rotation = edgeAngle;
  
  // ถ้ามุมเกิน 90 องศา ให้หมุนกลับเพื่อไม่ให้ข้อความกลับหัว
  if (Math.abs(rotation) > Math.PI / 2) {
    rotation = rotation > 0 ? rotation - Math.PI : rotation + Math.PI;
  }
  
  labelContainer.rotation = rotation;

  // ถ้ามี offset ให้เลื่อนออกจากเส้น
  if (offsetDistance !== 0) {
    const offsetX = offsetDistance * Math.cos(edgeAngle + Math.PI / 2);
    const offsetY = offsetDistance * Math.sin(edgeAngle + Math.PI / 2);
    labelContainer.x += offsetX;
    labelContainer.y += offsetY;
  }
}

/**
 * อัปเดตข้อความของ Label
 * @param labelContainer - Container ของ Label
 * @param newText - ข้อความใหม่
 */
export function updateLabelText(labelContainer: Container, newText: string): void {
  const labelData = (labelContainer as any).labelData;
  if (!labelData) {
    console.warn('ไม่พบข้อมูล labelData ใน Container');
    return;
  }

  const { textObject, backgroundGraphics, padding } = labelData;

  // อัปเดตข้อความ
  textObject.text = newText;
  labelData.originalText = newText;

  // คำนวณขนาดพื้นหลังใหม่
  const newBackgroundWidth = textObject.width + (padding * 2);
  const newBackgroundHeight = textObject.height + (padding * 2);

  // วาดพื้นหลังใหม่
  backgroundGraphics.clear();
  backgroundGraphics.fill(labelData.backgroundColor);
  backgroundGraphics.stroke({ width: 1, color: 0xCCCCCC });
  backgroundGraphics.rect(0, 0, newBackgroundWidth, newBackgroundHeight);
  backgroundGraphics.fill();
  backgroundGraphics.stroke();

  // อัปเดต pivot ให้อยู่กึ่งกลางใหม่
  labelContainer.pivot.x = newBackgroundWidth / 2;
  labelContainer.pivot.y = newBackgroundHeight / 2;
}

/**
 * สร้าง Label แบบ editable (สามารถแก้ไขได้)
 * @param labelText - ข้อความเริ่มต้น
 * @param onTextChange - Callback function เมื่อข้อความเปลี่ยน
 * @param fontSize - ขนาดตัวอักษร
 * @param textColor - สีตัวอักษร
 * @param backgroundColor - สีพื้นหลัง
 * @returns Container ของ Label ที่สามารถแก้ไขได้
 */
export function createEditableEdgeLabel(
  labelText: string,
  onTextChange: (newText: string) => void,
  fontSize: number = 14,
  textColor: number = 0x000000,
  backgroundColor: number = 0xFFFFFF
): Container {
  // สร้าง Label พื้นฐาน
  const labelContainer = createEdgeLabel(labelText, fontSize, textColor, backgroundColor);
  
  // เพิ่มความสามารถในการโต้ตอบ
  labelContainer.eventMode = 'static';
  labelContainer.cursor = 'pointer';

  // เพิ่ม event listener สำหรับ double click
  let clickCount = 0;
  let clickTimer: number | null = null;

  labelContainer.on('pointerdown', () => {
    clickCount++;
    
    if (clickCount === 1) {
      // Single click - เริ่มจับเวลา
      clickTimer = window.setTimeout(() => {
        clickCount = 0;
      }, 300); // 300ms สำหรับ double click detection
    } else if (clickCount === 2) {
      // Double click - เข้าสู่โหมดแก้ไข
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
      clickCount = 0;
      
      // เข้าสู่โหมดแก้ไขข้อความ
      editLabelText(labelContainer, onTextChange);
    }
  });

  return labelContainer;
}

/**
 * เข้าสู่โหมดแก้ไขข้อความของ Label
 * @param labelContainer - Container ของ Label
 * @param onTextChange - Callback function เมื่อข้อความเปลี่ยน
 */
function editLabelText(labelContainer: Container, onTextChange: (newText: string) => void): void {
  const labelData = (labelContainer as any).labelData;
  if (!labelData) {
    return;
  }

  // สร้าง input element ชั่วคราว (HTML input)
  const input = document.createElement('input');
  input.type = 'text';
  input.value = labelData.originalText;
  input.style.position = 'absolute';
  input.style.left = '-9999px'; // ซ่อนนอกจอ แต่ยังใช้งานได้
  input.style.top = '-9999px';
  
  document.body.appendChild(input);
  input.focus();
  input.select();

  // Function สำหรับจบการแก้ไข
  const finishEditing = () => {
    const newText = input.value.trim();
    if (newText && newText !== labelData.originalText) {
      updateLabelText(labelContainer, newText);
      onTextChange(newText);
    }
    document.body.removeChild(input);
  };

  // Event listeners
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      document.body.removeChild(input);
    }
  });

  input.addEventListener('blur', finishEditing);
}

/**
 * ได้ขนาดของ Label
 * @param labelContainer - Container ของ Label
 * @returns Object ที่มี width และ height
 */
export function getLabelSize(labelContainer: Container): { width: number, height: number } {
  const bounds = labelContainer.getBounds();
  return {
    width: bounds.width,
    height: bounds.height
  };
}

/**
 * ซ่อน/แสดง Label
 * @param labelContainer - Container ของ Label
 * @param visible - true = แสดง, false = ซ่อน
 */
export function setLabelVisibility(labelContainer: Container, visible: boolean): void {
  labelContainer.visible = visible;
}

/**
 * เปลี่ยนสีพื้นหลังของ Label
 * @param labelContainer - Container ของ Label
 * @param newBackgroundColor - สีพื้นหลังใหม่
 */
export function changeLabelBackgroundColor(labelContainer: Container, newBackgroundColor: number): void {
  const labelData = (labelContainer as any).labelData;
  if (!labelData) {
    return;
  }

  labelData.backgroundColor = newBackgroundColor;
  
  // วาดพื้นหลังใหม่ด้วยสีใหม่
  const { backgroundGraphics, textObject, padding } = labelData;
  const width = textObject.width + (padding * 2);
  const height = textObject.height + (padding * 2);

  backgroundGraphics.clear();
  backgroundGraphics.fill(newBackgroundColor);
  backgroundGraphics.stroke({ width: 1, color: 0xCCCCCC });
  backgroundGraphics.rect(0, 0, width, height);
  backgroundGraphics.fill();
  backgroundGraphics.stroke();
}