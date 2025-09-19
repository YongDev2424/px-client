// src/components/EditableLabel.ts

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

/**
 * Configuration options สำหรับการสร้าง Editable Label
 */
export interface EditableLabelOptions {
  text: string;                    // ข้อความเริ่มต้น
  fontSize?: number;               // ขนาดตัวอักษร (ค่าเริ่มต้น 14)
  textColor?: number;              // สีตัวอักษร (ค่าเริ่มต้น สีดำ)
  backgroundColor?: number;        // สีพื้นหลัง (ค่าเริ่มต้น สีขาว)
  hasBackground?: boolean;         // มีพื้นหลังหรือไม่ (ค่าเริ่มต้น false)
  padding?: number;                // ระยะห่างรอบข้อความ (ค่าเริ่มต้น 4)
  borderColor?: number;            // สีขอบ (ค่าเริ่มต้น สีเทาอ่อน)
  borderWidth?: number;            // ความหนาขอบ (ค่าเริ่มต้น 1)
  maxWidth?: number;               // ความกว้างสูงสุด (ไม่จำกัด)
  onTextChange?: (newText: string, oldText: string) => void; // Callback เมื่อข้อความเปลี่ยน
  onEditStart?: () => void;        // Callback เมื่อเริ่มแก้ไข
  onEditEnd?: () => void;          // Callback เมื่อจบการแก้ไข
}

/**
 * Metadata ที่เก็บไว้ใน Label Container สำหรับการจัดการ
 */
interface EditableLabelData {
  originalText: string;
  textObject: Text;
  backgroundGraphics?: Graphics;
  options: EditableLabelOptions;
  isEditing: boolean;
  editInput?: HTMLInputElement;
}

/**
 * สร้าง Label ที่สามารถแก้ไขได้ (Universal สำหรับทั้ง Node และ Edge)
 * 
 * @example
 * // สำหรับ Node (ไม่มีพื้นหลัง)
 * const nodeLabel = createEditableLabel({
 *   text: "User",
 *   fontSize: 16,
 *   hasBackground: false,
 *   onTextChange: (newText) => console.log(newText)
 * });
 * 
 * // สำหรับ Edge (มีพื้นหลัง)
 * const edgeLabel = createEditableLabel({
 *   text: "relationship",
 *   fontSize: 12,
 *   hasBackground: true,
 *   backgroundColor: 0xFFFFFF,
 *   onTextChange: (newText) => console.log(newText)
 * });
 * 
 * @param options - การตั้งค่าสำหรับ label
 * @returns Container ที่ประกอบด้วย label ที่แก้ไขได้
 */
export function createEditableLabel(options: EditableLabelOptions): Container {
  // ตั้งค่าเริ่มต้น
  const config: Required<EditableLabelOptions> = {
    text: options.text || '',
    fontSize: options.fontSize || 14,
    textColor: options.textColor || 0x000000,
    backgroundColor: options.backgroundColor || 0xFFFFFF,
    hasBackground: options.hasBackground || false,
    padding: options.padding || 4,
    borderColor: options.borderColor || 0xCCCCCC,
    borderWidth: options.borderWidth || 1,
    maxWidth: options.maxWidth || 0,
    onTextChange: options.onTextChange || (() => {}),
    onEditStart: options.onEditStart || (() => {}),
    onEditEnd: options.onEditEnd || (() => {})
  };

  // สร้าง Container หลัก
  const labelContainer = new Container();

  // สร้าง Text Object
  const textStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: config.fontSize,
    fill: config.textColor,
    align: 'center',
    fontWeight: 'normal',
    wordWrap: config.maxWidth > 0,
    wordWrapWidth: config.maxWidth
  });

  const textObject = new Text({
    text: config.text,
    style: textStyle
  });

  // สร้างพื้นหลังถ้าต้องการ
  let backgroundGraphics: Graphics | undefined = undefined;
  if (config.hasBackground) {
    backgroundGraphics = createLabelBackground(textObject, config);
    labelContainer.addChild(backgroundGraphics);
  }

  // เพิ่ม Text เข้าไปใน Container
  labelContainer.addChild(textObject);

  // จัดตำแหน่ง Text
  if (config.hasBackground && backgroundGraphics) {
    // ถ้ามีพื้นหลัง ให้ Text อยู่กึ่งกลางพื้นหลัง
    textObject.x = config.padding;
    textObject.y = config.padding;
    
    // ตั้งค่า pivot ให้ Container อยู่กึ่งกลาง
    const backgroundWidth = textObject.width + (config.padding * 2);
    const backgroundHeight = textObject.height + (config.padding * 2);
    labelContainer.pivot.x = backgroundWidth / 2;
    labelContainer.pivot.y = backgroundHeight / 2;
  } else {
    // ถ้าไม่มีพื้นหลัง ให้ Text อยู่กึ่งกลาง Container
    labelContainer.pivot.x = textObject.width / 2;
    labelContainer.pivot.y = textObject.height / 2;
  }

  // เพิ่มความสามารถในการโต้ตอบ
  setupLabelInteractivity(labelContainer);

  // เก็บ metadata
  const labelData: EditableLabelData = {
    originalText: config.text,
    textObject: textObject,
    backgroundGraphics: backgroundGraphics,
    options: config,
    isEditing: false
  };

  (labelContainer as any).editableLabelData = labelData;

  // เพิ่มฟังก์ชันสำหรับอัปเดต text resolution เมื่อ zoom
  (labelContainer as any).updateTextResolution = function(resolution: number) {
    const data = (this as any).editableLabelData as EditableLabelData;
    if (data && data.textObject) {
      // อัปเดต resolution ของ Text object
      if ((data.textObject as any).resolution !== resolution) {
        (data.textObject as any).resolution = resolution;
        
        // บังคับให้ re-render text ด้วย resolution ใหม่
        // ใน PixiJS v8 ใช้ dirty flag เพื่อบังคับ re-render
        (data.textObject as any)._didTextUpdate = true;
        
        // หรือสร้าง TextStyle ใหม่เพื่อบังคับ update
        const currentStyle = data.textObject.style;
        data.textObject.style = new TextStyle({
          fontFamily: currentStyle.fontFamily,
          fontSize: currentStyle.fontSize,
          fill: currentStyle.fill,
          align: currentStyle.align,
          fontWeight: currentStyle.fontWeight,
          wordWrap: currentStyle.wordWrap,
          wordWrapWidth: currentStyle.wordWrapWidth
        });
      }
    }
  };

  return labelContainer;
}

/**
 * สร้างพื้นหลังสำหรับ Label
 * @param textObject - Text object ที่ต้องการสร้างพื้นหลังให้
 * @param config - การตั้งค่า
 * @returns Graphics object ของพื้นหลัง
 */
function createLabelBackground(textObject: Text, config: Required<EditableLabelOptions>): Graphics {
  const backgroundWidth = textObject.width + (config.padding * 2);
  const backgroundHeight = textObject.height + (config.padding * 2);

  const background = new Graphics();
  
  // เพิ่มขอบถ้าต้องการ
  if (config.borderWidth > 0) {
    background.stroke({ width: config.borderWidth, color: config.borderColor });
  }
  
  background.fill(config.backgroundColor);
  background.rect(0, 0, backgroundWidth, backgroundHeight);

  return background;
}

/**
 * ตั้งค่า Event Handlers สำหรับการโต้ตอบกับ Label
 * @param labelContainer - Container ของ label
 */
function setupLabelInteractivity(labelContainer: Container): void {
  labelContainer.eventMode = 'static';
  labelContainer.cursor = 'text';

  // เพิ่ม visual feedback เมื่อ hover
  labelContainer.on('pointerover', () => {
    const labelData = (labelContainer as any).editableLabelData as EditableLabelData;
    if (!labelData.isEditing && labelData.backgroundGraphics) {
      // เปลี่ยนสีพื้นหลังเล็กน้อยเมื่อ hover (ถ้ามีพื้นหลัง)
      labelData.backgroundGraphics.tint = 0xF0F0F0;
    }
  });

  labelContainer.on('pointerout', () => {
    const labelData = (labelContainer as any).editableLabelData as EditableLabelData;
    if (!labelData.isEditing && labelData.backgroundGraphics) {
      // เปลี่ยนกลับเป็นสีเดิม
      labelData.backgroundGraphics.tint = 0xFFFFFF;
    }
  });

  // Double-click detection
  let clickCount = 0;
  let clickTimer: number | null = null;

  labelContainer.on('pointerdown', (event) => {
    event.stopPropagation(); // ป้องกันไม่ให้ไป trigger parent events
    
    clickCount++;
    
    if (clickCount === 1) {
      // Single click - เริ่มจับเวลา
      clickTimer = window.setTimeout(() => {
        clickCount = 0;
        // Single click behavior (optional)
        handleSingleClick();
      }, 300); // 300ms สำหรับ double click detection
    } else if (clickCount === 2) {
      // Double click - เข้าสู่โหมดแก้ไข
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
      clickCount = 0;
      
      startEditMode(labelContainer);
    }
  });
}

/**
 * จัดการ Single Click บน Label (optional behavior)
 */
function handleSingleClick(): void {
  // ปัจจุบันไม่ทำอะไร แต่สามารถเพิ่ม behavior ได้
  // เช่น highlight label หรือ show tooltip
}

/**
 * เข้าสู่โหมดแก้ไข Label
 * @param labelContainer - Container ของ label
 */
function startEditMode(labelContainer: Container): void {
  const labelData = (labelContainer as any).editableLabelData as EditableLabelData;
  
  if (labelData.isEditing) {
    return; // ถ้ากำลังแก้ไขอยู่แล้วไม่ต้องทำอะไร
  }

  labelData.isEditing = true;
  labelData.options.onEditStart?.();

  // สร้าง HTML input element ชั่วคราว
  const input = document.createElement('input');
  input.type = 'text';
  input.value = labelData.originalText;
  input.style.position = 'fixed';
  input.style.left = '50%';
  input.style.top = '50%';
  input.style.transform = 'translate(-50%, -50%)';
  input.style.zIndex = '10000';
  input.style.fontSize = `${labelData.options.fontSize}px`;
  input.style.fontFamily = 'Arial';
  input.style.border = '2px solid #0066CC';
  input.style.outline = 'none';
  input.style.backgroundColor = 'white';
  input.style.padding = '4px 8px';
  input.style.borderRadius = '4px';
  input.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
  
  document.body.appendChild(input);
  
  // ใช้ timeout เล็กน้อยเพื่อให้ browser render element ก่อน focus
  setTimeout(() => {
    input.focus();
    input.select();
  }, 10);
  
  labelData.editInput = input;

  // Visual feedback ขณะแก้ไข
  if (labelData.backgroundGraphics) {
    labelData.backgroundGraphics.tint = 0xE0E0FF; // สีฟ้าอ่อนเมื่อกำลังแก้ไข
  } else {
    // ถ้าไม่มีพื้นหลัง ให้เปลี่ยนสีตัวอักษร
    labelData.textObject.tint = 0x0066CC;
  }

  // Event listeners สำหรับการจบการแก้ไข
  const finishEditing = (save: boolean = true) => {
    if (!labelData.editInput) return;

    const newText = save ? labelData.editInput.value.trim() : labelData.originalText;
    const oldText = labelData.originalText;
    
    if (save && newText && newText !== oldText) {
      updateLabelText(labelContainer, newText);
      labelData.options.onTextChange?.(newText, oldText);
    }
    
    // Cleanup
    document.body.removeChild(labelData.editInput);
    labelData.editInput = undefined;
    labelData.isEditing = false;

    // รีเซ็ต visual feedback
    if (labelData.backgroundGraphics) {
      labelData.backgroundGraphics.tint = 0xFFFFFF;
    } else {
      labelData.textObject.tint = 0xFFFFFF;
    }

    labelData.options.onEditEnd?.();
  };

  // Keyboard shortcuts
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    
    switch (e.key) {
      case 'Enter':
        finishEditing(true);
        break;
      case 'Escape':
        finishEditing(false);
        break;
      case 'Tab':
        e.preventDefault();
        finishEditing(true);
        // TODO: Focus ไปยัง label ถัดไป
        break;
    }
  });

  // Auto-save เมื่อ blur (ใช้ timeout เพื่อป้องกัน immediate blur)
  input.addEventListener('blur', () => {
    // ใช้ timeout เล็กน้อยเพื่อให้ user มีโอกาส interact
    setTimeout(() => {
      if (labelData.isEditing && labelData.editInput === input) {
        finishEditing(true);
      }
    }, 100);
  });
}

/**
 * อัปเดตข้อความของ Label
 * @param labelContainer - Container ของ label
 * @param newText - ข้อความใหม่
 */
export function updateLabelText(labelContainer: Container, newText: string): void {
  const labelData = (labelContainer as any).editableLabelData as EditableLabelData;
  if (!labelData) {
    console.warn('ไม่พบข้อมูล editableLabelData ใน Container');
    return;
  }

  // อัปเดตข้อความ
  labelData.textObject.text = newText;
  labelData.originalText = newText;

  // อัปเดตพื้นหลังถ้ามี
  if (labelData.backgroundGraphics && labelData.options.hasBackground) {
    // ลบพื้นหลังเก่า
    labelContainer.removeChild(labelData.backgroundGraphics);
    
    // สร้างพื้นหลังใหม่ (cast เป็น Required เพราะมีการตรวจสอบ hasBackground แล้ว)
    labelData.backgroundGraphics = createLabelBackground(labelData.textObject, labelData.options as Required<EditableLabelOptions>);
    labelContainer.addChildAt(labelData.backgroundGraphics, 0); // เพิ่มไว้ข้างหลัง text

    // อัปเดตตำแหน่ง text
    const padding = labelData.options.padding || 4;
    labelData.textObject.x = padding;
    labelData.textObject.y = padding;

    // อัปเดต pivot
    const backgroundWidth = labelData.textObject.width + (padding * 2);
    const backgroundHeight = labelData.textObject.height + (padding * 2);
    labelContainer.pivot.x = backgroundWidth / 2;
    labelContainer.pivot.y = backgroundHeight / 2;
  } else {
    // ถ้าไม่มีพื้นหลัง อัปเดต pivot ตาม text
    labelContainer.pivot.x = labelData.textObject.width / 2;
    labelContainer.pivot.y = labelData.textObject.height / 2;
  }
}

/**
 * ได้ข้อความปัจจุบันของ Label
 * @param labelContainer - Container ของ label
 * @returns ข้อความปัจจุบัน หรือ empty string ถ้าไม่พบ
 */
export function getLabelText(labelContainer: Container): string {
  const labelData = (labelContainer as any).editableLabelData as EditableLabelData;
  return labelData ? labelData.originalText : '';
}

/**
 * ตรวจสอบว่า Label กำลังอยู่ในโหมดแก้ไขหรือไม่
 * @param labelContainer - Container ของ label
 * @returns true ถ้ากำลังแก้ไข, false ถ้าไม่ใช่
 */
export function isLabelEditing(labelContainer: Container): boolean {
  const labelData = (labelContainer as any).editableLabelData as EditableLabelData;
  return labelData ? labelData.isEditing : false;
}

/**
 * บังคับให้จบการแก้ไข Label (ถ้ากำลังแก้ไขอยู่)
 * @param labelContainer - Container ของ label
 * @param save - บันทึกการเปลี่ยนแปลงหรือไม่ (ค่าเริ่มต้น true)
 */
export function finishLabelEditing(labelContainer: Container, save: boolean = true): void {
  const labelData = (labelContainer as any).editableLabelData as EditableLabelData;
  if (labelData && labelData.isEditing && labelData.editInput) {
    // Simulate blur event เพื่อให้จบการแก้ไข
    if (save) {
      labelData.editInput.blur();
    } else {
      // Simulate escape key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      labelData.editInput.dispatchEvent(escapeEvent);
    }
  }
}