// src/components/C4Box.ts

import { Container, Graphics, Application } from 'pixi.js';
import { makeDraggable } from '../utils/draggable';
import { createC4Label } from './C4Label';

/**
 * ฟังก์ชัน Helper: สร้างจุดเชื่อมต่อ (วงกลมเล็กๆ)
 * @returns - วัตถุ Graphics ของจุดเชื่อมต่อ
 */
function createConnectionPoint(): Graphics {
  // 1. สร้าง "ผืนผ้าใบ" Graphics ที่ว่างเปล่าขึ้นมาก่อน
  const point = new Graphics();

  // 2. ใช้เมธอดต่างๆ เพื่อ "สั่ง" ให้วาดลงบนผืนผ้าใบนั้น
  point.fill(0x000000); // สีดำ
  point.circle(0, 0, 5); // วาดวงกลมรัศมี 5 pixels
  point.fill(); // สั่งให้เติมสี (สำหรับ v8 ควรเรียกหลังวาด)

  // 3. ตั้งค่าการโต้ตอบให้กับ "ผืนผ้าใบ" โดยตรง
  point.eventMode = 'static';
  point.cursor = 'pointer';

  // 4. คืนค่า "ผืนผ้าใบ" (Graphics) ที่วาดเสร็จแล้วออกไป
  return point;
}

/**
 * สร้าง "ส่วนประกอบภาพ" ของกล่อง C4
 * ซึ่งประกอบด้วยรูปทรงสี่เหลี่ยม, ข้อความ, และจุดเชื่อมต่อ
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

  // 5. ทำให้ Container ทั้งหมดสามารถลากได้
  makeDraggable(boxContainer, app);

  // 6. คืนค่า Container ที่สมบูรณ์แล้วออกไป
  return boxContainer;
}