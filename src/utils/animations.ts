// src/utils/animations.ts

import { Graphics } from 'pixi.js';

/**
 * ฟังก์ชันสำหรับสร้าง fade in animation (แสดงวัตถุแบบค่อยๆ ปรากฏ)
 * @param target - วัตถุ Graphics ที่ต้องการให้ fade in
 * @param duration - ระยะเวลาของ animation ในหน่วย milliseconds (ค่าเริ่มต้น 200ms)
 * @param startAlpha - ค่า alpha เริ่มต้น (ค่าเริ่มต้น 0)
 * @param endAlpha - ค่า alpha สุดท้าย (ค่าเริ่มต้น 1)
 */
export function fadeIn(
  target: Graphics, 
  duration: number = 200, 
  startAlpha: number = 0, 
  endAlpha: number = 1
): void {
  // 1. ตั้งค่าเริ่มต้นให้วัตถุแสดงผลและมี alpha เท่ากับค่าเริ่มต้น
  target.visible = true;
  target.alpha = startAlpha;
  
  // 2. คำนวณระยะเวลาเริ่มต้นและความแตกต่างของ alpha
  const startTime = Date.now();
  const alphaRange = endAlpha - startAlpha;
  
  // 3. สร้างฟังก์ชัน animation loop ด้วย recursive function
  function animate(): void {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1); // จำกัดค่าไม่ให้เกิน 1
    
    // 4. คำนวณค่า alpha ในขณะนั้นโดยใช้ linear interpolation
    target.alpha = startAlpha + (alphaRange * progress);
    
    // 5. ถ้ายังไม่เสร็จให้เรียก animation ต่อใน frame ถัดไป
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  // 6. เริ่มต้น animation
  requestAnimationFrame(animate);
}

/**
 * ฟังก์ชันสำหรับสร้าง fade out animation (ซ่อนวัตถุแบบค่อยๆ หายไป)
 * @param target - วัตถุ Graphics ที่ต้องการให้ fade out
 * @param duration - ระยะเวลาของ animation ในหน่วย milliseconds (ค่าเริ่มต้น 200ms)
 * @param startAlpha - ค่า alpha เริ่มต้น (ค่าเริ่มต้น 1)
 * @param endAlpha - ค่า alpha สุดท้าย (ค่าเริ่มต้น 0)
 */
export function fadeOut(
  target: Graphics, 
  duration: number = 200, 
  startAlpha: number = 1, 
  endAlpha: number = 0
): void {
  // 1. ตั้งค่าเริ่มต้นให้วัตถุมี alpha เท่ากับค่าเริ่มต้น
  target.alpha = startAlpha;
  
  // 2. คำนวณระยะเวลาเริ่มต้นและความแตกต่างของ alpha
  const startTime = Date.now();
  const alphaRange = endAlpha - startAlpha;
  
  // 3. สร้างฟังก์ชัน animation loop ด้วย recursive function
  function animate(): void {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1); // จำกัดค่าไม่ให้เกิน 1
    
    // 4. คำนวณค่า alpha ในขณะนั้นโดยใช้ linear interpolation
    target.alpha = startAlpha + (alphaRange * progress);
    
    // 5. ถ้ายังไม่เสร็จให้เรียก animation ต่อใน frame ถัดไป
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // 6. เมื่อ animation เสร็จแล้ว ถ้า alpha เป็น 0 ให้ซ่อนวัตถุเพื่อประหยัด performance
      if (target.alpha <= 0) {
        target.visible = false;
      }
    }
  }
  
  // 7. เริ่มต้น animation
  requestAnimationFrame(animate);
}

/**
 * ฟังก์ชันสำหรับหยุด animation ทันที (ถ้าจำเป็น)
 * @param target - วัตถุ Graphics ที่ต้องการหยุด animation
 * @param finalAlpha - ค่า alpha สุดท้ายที่ต้องการให้ตั้งไว้
 */
export function stopAnimation(target: Graphics, finalAlpha: number): void {
  target.alpha = finalAlpha;
  if (finalAlpha <= 0) {
    target.visible = false;
  } else {
    target.visible = true;
  }
}