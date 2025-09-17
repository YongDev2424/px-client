// src/main.ts
import './style.css'
import { Application } from 'pixi.js';
import { createC4Box } from './components/C4Box';
import { stageManager } from './utils/stageManager';

// --- ตั้งค่า Pixi Application ---
const app = new Application();
await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1099bb,
    antialias: true,
});
document.body.appendChild(app.canvas);

// --- เริ่มต้น Stage Manager สำหรับ Edge System ---
stageManager.initialize(app);
console.log('🎯 Edge System พร้อมใช้งาน - คลิกที่จุดเชื่อมต่อเพื่อสร้าง Edge!');


// --- เชื่อมต่อปุ่ม HTML กับ PixiJS ---

// 1. ค้นหาปุ่ม "Add Person" จาก ID ของมัน
const addPersonButton = document.getElementById('add-person-btn');

// 2. ถ้าเจอปุ่ม, ให้เพิ่ม Event Listener สำหรับการ 'click'
addPersonButton?.addEventListener('click', () => {
  // 3. เมื่อถูกคลิก, ให้สร้างกล่อง Person และเพิ่มลงในฉาก
  const newPerson = createC4Box(app, 'Person', 0x0B61A4);
  app.stage.addChild(newPerson);
  console.log('เพิ่ม Person Node ใหม่');
});

// ทำเช่นเดียวกันกับปุ่ม "Add System"
const addSystemButton = document.getElementById('add-system-btn');
addSystemButton?.addEventListener('click', () => {
  const newSystem = createC4Box(app, 'Software System', 0x242424);
  app.stage.addChild(newSystem);
  console.log('เพิ่ม System Node ใหม่');
});

// --- คำแนะนำการใช้งาน ---
console.log('📝 คำแนะนำการใช้งาน:');
console.log('1. คลิกปุ่ม "Add Person" หรือ "Add System" เพื่อเพิ่ม Node');
console.log('2. Hover บน Node เพื่อดูจุดเชื่อมต่อ');
console.log('3. คลิกที่จุดเชื่อมต่อ (จุดสีดำ) เพื่อเริ่มสร้าง Edge');
console.log('4. คลิกที่จุดเชื่อมต่อของ Node อื่นเพื่อเสร็จสิ้น Edge');
console.log('5. กด ESC หรือคลิกพื้นที่ว่างเพื่อยกเลิกการสร้าง Edge');
console.log('6. คลิกบนพื้นที่ Node เพื่อ pin/unpin จุดเชื่อมต่อ');

// --- เพิ่มการจัดการ cleanup เมื่อปิดหน้าต่าง ---
window.addEventListener('beforeunload', () => {
  stageManager.destroy();
});