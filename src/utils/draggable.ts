// src/utils/draggable.ts

import { Application, Container, FederatedPointerEvent, Point } from 'pixi.js';
import { edgeStateManager } from './edgeState';
import { updateEdgePosition, isEdgeConnectedToNode } from '../components/Edge';

/**
 * ฟังก์ชันนี้จะรับวัตถุ (target) เข้ามา แล้วเพิ่มความสามารถในการลากและวางให้
 * @param target - วัตถุ PixiJS ที่ต้องการทำให้ลากได้ (ควรเป็น Container หรือ Sprite)
 * @param app - ตัวแอปพลิเคชัน Pixi หลัก
 */
export function makeDraggable(target: Container, app: Application): void {
    // --- ตั้งค่าพื้นฐานให้วัตถุโต้ตอบได้ ---
    target.eventMode = 'static';
    target.cursor = 'pointer';

    // --- ตัวแปรสำหรับจัดการสถานะการลาก ---
    let dragOffset = new Point();
    let isDragging = false;


    // --- Event Listeners สำหรับการลาก ---

    // เมื่อ "กด" เมาส์ลงบนวัตถุเป้าหมาย
    target.on('pointerdown', (event: FederatedPointerEvent) => {
        isDragging = true;
        // คำนวณและจำระยะห่างระหว่างจุดที่คลิกกับมุมของวัตถุ
        dragOffset.x = target.x - event.global.x;
        dragOffset.y = target.y - event.global.y;
    });

    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;

    // เมื่อ "ปล่อย" เมาส์ (เราดักฟังที่ stage ทั้งหมด)
    app.stage.on('pointerup', () => {
        isDragging = false;
    });

    // เมื่อ "ขยับ" เมาส์ (เราดักฟังที่ stage ทั้งหมด)
    app.stage.on('globalpointermove', (event: FederatedPointerEvent) => {
        if (isDragging) {
            // อัปเดตตำแหน่งของวัตถุโดยใช้ระยะห่างที่จำไว้
            target.x = event.global.x + dragOffset.x;
            target.y = event.global.y + dragOffset.y;
            
            // อัปเดตตำแหน่งของ edges ที่เชื่อมต่อกับ node นี้
            const allEdges = edgeStateManager.getAllEdges();
            console.log('🚀 Node เคลื่อนที่, ตรวจสอบ', allEdges.length, 'edges');
            
            allEdges.forEach(edgeData => {
                const isConnected = isEdgeConnectedToNode(edgeData.edgeGraphics, target);
                console.log('🔗 Edge', edgeData.id, 'เชื่อมต่อกับ Node นี้:', isConnected);
                
                if (isConnected) {
                    console.log('⚡ กำลังอัปเดต Edge:', edgeData.id);
                    updateEdgePosition(edgeData.edgeGraphics);
                }
            });
        }
    });
}