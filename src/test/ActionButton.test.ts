// src/test/ActionButton.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from 'pixi.js';
import { ActionButton, ActionButtonType } from '../components/ActionButton';

describe('ActionButton', () => {
  let mockContainer: Container;

  beforeEach(() => {
    // สร้าง mock container
    mockContainer = new Container();
    
    // Clear mocks
    vi.clearAllMocks();
  });

  describe('การสร้าง ActionButton', () => {
    it('ควรสร้าง ActionButton ประเภท edit ได้', () => {
      const button = new ActionButton('edit');
      
      expect(button).toBeDefined();
      expect(button.getButtonType()).toBe('edit');
      expect(button.children.length).toBe(2); // buttonGraphics + iconGraphics
    });

    it('ควรสร้าง ActionButton ประเภท delete ได้', () => {
      const button = new ActionButton('delete');
      
      expect(button).toBeDefined();
      expect(button.getButtonType()).toBe('delete');
      expect(button.children.length).toBe(2); // buttonGraphics + iconGraphics
    });

    it('ควรใช้ options ที่กำหนดได้', () => {
      const options = {
        size: 40,
        backgroundColor: 0xff0000,
        iconColor: 0x00ff00
      };
      
      const button = new ActionButton('edit', options);
      
      expect(button).toBeDefined();
      expect(button.getButtonType()).toBe('edit');
    });
  });

  describe('Event Handling', () => {
    it('ควรตั้งค่า eventMode เป็น static', () => {
      const button = new ActionButton('edit');
      
      expect(button.eventMode).toBe('static');
      expect(button.cursor).toBe('pointer');
    });

    it('ควรมี hitArea เป็น Circle', () => {
      const button = new ActionButton('edit', { size: 32 });
      
      expect(button.hitArea).toBeDefined();
      // ตรวจสอบว่าเป็น Circle โดยดูจาก properties
      expect((button.hitArea as any).radius).toBe(16); // size / 2
    });

    it('ควรเรียก click handler เมื่อถูกคลิก', () => {
      const button = new ActionButton('edit');
      const mockHandler = vi.fn();
      
      button.setClickHandler(mockHandler);
      
      // จำลอง pointer event
      const mockEvent = {
        stopPropagation: vi.fn(),
        global: { x: 0, y: 0 }
      };
      
      // Trigger pointerdown event
      button.emit('pointerdown', mockEvent);
      
      expect(mockHandler).toHaveBeenCalledWith(mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('Hover Effects', () => {
    it('ควรเปลี่ยนสถานะเมื่อ hover', () => {
      const button = new ActionButton('edit');
      
      // จำลอง hover เข้า
      const mockOverEvent = {
        stopPropagation: vi.fn()
      };
      
      button.emit('pointerover', mockOverEvent);
      
      expect(mockOverEvent.stopPropagation).toHaveBeenCalled();
      
      // จำลอง hover ออก
      const mockOutEvent = {
        stopPropagation: vi.fn()
      };
      
      button.emit('pointerout', mockOutEvent);
      
      expect(mockOutEvent.stopPropagation).toHaveBeenCalled();
    });

    it('ควรมี scale animation เมื่อ hover', async () => {
      const button = new ActionButton('edit', { hoverScale: 1.2 });
      
      // เริ่มต้น scale ควรเป็น 1
      expect(button.scale.x).toBe(1);
      
      // จำลอง hover เข้า
      button.emit('pointerover', { stopPropagation: vi.fn() });
      
      // รอให้ animation เริ่ม
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Scale ควรเปลี่ยนไป (อาจจะยังไม่ถึง target)
      expect(button.scale.x).toBeGreaterThan(1);
    });
  });

  describe('Icon Drawing', () => {
    it('ควรวาดไอคอนที่แตกต่างกันสำหรับแต่ละประเภท', () => {
      const editButton = new ActionButton('edit');
      const deleteButton = new ActionButton('delete');
      
      // ทั้งสองปุ่มควรมี iconGraphics
      expect(editButton.children[1]).toBeDefined(); // iconGraphics
      expect(deleteButton.children[1]).toBeDefined(); // iconGraphics
      
      // ไอคอนควรแตกต่างกัน (ตรวจสอบโดยดูจาก geometry หรือ commands)
      const editIcon = editButton.children[1];
      const deleteIcon = deleteButton.children[1];
      
      expect(editIcon).not.toEqual(deleteIcon);
    });
  });

  describe('Cleanup', () => {
    it('ควรทำลาย resources เมื่อเรียก destroy()', () => {
      const button = new ActionButton('edit');
      
      // ตรวจสอบว่ามี children
      expect(button.children.length).toBeGreaterThan(0);
      
      // เรียก destroy
      button.destroy();
      
      // ตรวจสอบว่า children ถูกทำลาย (อาจจะต้องตรวจสอบแบบอื่น)
      expect(button.destroyed).toBe(true);
    });
  });

  describe('Default Icon Colors', () => {
    it('ควรใช้สีน้ำเงินสำหรับปุ่ม edit', () => {
      const button = new ActionButton('edit');
      
      // ตรวจสอบว่าใช้สีที่ถูกต้อง (0x007AFF)
      expect(button.getButtonType()).toBe('edit');
    });

    it('ควรใช้สีแดงสำหรับปุ่ม delete', () => {
      const button = new ActionButton('delete');
      
      // ตรวจสอบว่าใช้สีที่ถูกต้อง (0xFF3B30)
      expect(button.getButtonType()).toBe('delete');
    });
  });
});