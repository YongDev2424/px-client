// src/main.ts
import './style.css'
import { Application } from 'pixi.js';
import { createC4Box } from './components/C4Box';

// --- ตั้งค่า Pixi Application ---
const app = new Application();
await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1099bb,
    antialias: true,
});
document.body.appendChild(app.canvas);


// --- เชื่อมต่อปุ่ม HTML กับ PixiJS ---

// 1. ค้นหาปุ่ม "Add Person" จาก ID ของมัน
const addPersonButton = document.getElementById('add-person-btn');

// 2. ถ้าเจอปุ่ม, ให้เพิ่ม Event Listener สำหรับการ 'click'
addPersonButton?.addEventListener('click', () => {
  // 3. เมื่อถูกคลิก, ให้สร้างกล่อง Person และเพิ่มลงในฉาก
  const newPerson = createC4Box(app, 'Person', 0x0B61A4);
  app.stage.addChild(newPerson);
});

// ทำเช่นเดียวกันกับปุ่ม "Add System"
const addSystemButton = document.getElementById('add-system-btn');
addSystemButton?.addEventListener('click', () => {
  const newSystem = createC4Box(app, 'Software System', 0x242424);
  app.stage.addChild(newSystem);
});