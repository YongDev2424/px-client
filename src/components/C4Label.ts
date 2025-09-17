// src/components/C4Label.ts

import { Text, TextStyle } from 'pixi.js';

/**
 * สร้างส่วนประกอบ "ป้ายกำกับ" (Label) สำหรับใช้ใน C4 Box
 * @param labelText - ข้อความที่ต้องการให้แสดงผล
 * @param fontSize - ขนาดของตัวอักษร
 * @param textColor - สีของตัวอักษร
 * @returns - วัตถุ Text ที่สร้างและจัดสไตล์เรียบร้อยแล้ว
 */
// 1. นำ parameter ที่เคยทำไว้กลับมา
export function createC4Label(labelText: string, fontSize: number, textColor: number): Text {
  const style = new TextStyle({
    fontFamily: 'Arial',
    fontSize: fontSize,   // 2. ใช้ค่าจาก parameter
    fill: textColor,      // 3. ใช้ค่าจาก parameter
    align: 'center',
  });

  // ใช้  (syntax) ใหม่ของ v8 ในการสร้าง Text
  const label = new Text({
    text: labelText,
    style: style,
  });

  return label;
}