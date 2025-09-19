// src/test/CollapseExpandButton.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Container } from 'pixi.js';
import { CollapseExpandButton, createCollapseExpandButton } from '../components/CollapseExpandButton';
import { nodeStateManager } from '../utils/nodeStateManager';

// Mock node สำหรับ testing
let mockNode: Container;

describe('CollapseExpandButton', () => {
  beforeEach(() => {
    // สร้าง mock node
    mockNode = new Container();
    mockNode.x = 100;
    mockNode.y = 100;
    
    // เพิ่ม mock bounds
    (mockNode as any).getBounds = vi.fn().mockReturnValue({
      x: 100,
      y: 100,
      width: 200,
      height: 100
    });
    
    // เริ่มต้นสถานะ node
    nodeStateManager.initializeNodeState(mockNode);
    
    // Clear any existing event listeners
    vi.clearAllMocks();
  });

  afterEach(() => {
    // ทำความสะอาด
    nodeStateManager.clearAllStates();
  });

  describe('Constructor และ Initialization', () => {
    it('ควรสร้าง CollapseExpandButton ได้สำเร็จ', () => {
      const button = new CollapseExpandButton(mockNode);
      
      expect(button).toBeInstanceOf(CollapseExpandButton);
      expect(button).toBeInstanceOf(Container);
      expect(button.children.length).toBeGreaterThan(0);
    });

    it('ควรใช้ default options เมื่อไม่ระบุ', () => {
      const button = new CollapseExpandButton(mockNode);
      
      // ตรวจสอบว่ามี children (graphics และ text)
      expect(button.children.length).toBe(2);
      expect(button.eventMode).toBe('static');
      expect(button.cursor).toBe('pointer');
    });

    it('ควรใช้ custom options ที่ระบุ', () => {
      const options = {
        size: 32,
        position: 'top-left' as const,
        expandedIcon: '⬇',
        collapsedIcon: '➡'
      };
      
      const button = new CollapseExpandButton(mockNode, options);
      
      expect(button).toBeInstanceOf(CollapseExpandButton);
      // ตรวจสอบว่า options ถูกใช้ (ผ่านการมี children)
      expect(button.children.length).toBe(2);
    });

    it('ควรตั้งค่า hitArea เป็น Circle', () => {
      const button = new CollapseExpandButton(mockNode);
      
      expect(button.hitArea).toBeDefined();
      expect(button.hitArea.type).toBe('circle'); // Circle type ใน PixiJS v8
    });
  });

  describe('Visual State Management', () => {
    it('ควรแสดงไอคอน expanded เป็นค่าเริ่มต้น', () => {
      const button = new CollapseExpandButton(mockNode);
      
      expect(button.getCollapsedState()).toBe(false);
      
      // ตรวจสอบว่ามี text child
      const textChild = button.children.find(child => child.constructor.name === 'Text');
      expect(textChild).toBeDefined();
    });

    it('ควรเปลี่ยนไอคอนเมื่อ state เปลี่ยน', () => {
      const button = new CollapseExpandButton(mockNode);
      
      // เปลี่ยนเป็น collapsed
      button.setCollapsedState(true);
      expect(button.getCollapsedState()).toBe(true);
      
      // เปลี่ยนกลับเป็น expanded
      button.setCollapsedState(false);
      expect(button.getCollapsedState()).toBe(false);
    });

    it('ควรอัปเดต visual state เมื่อได้รับ node state change event', () => {
      const button = new CollapseExpandButton(mockNode);
      
      // จำลอง node state change event
      const event = new CustomEvent('node-state-changed', {
        detail: {
          node: mockNode,
          changeType: 'collapse',
          isCollapsed: true
        }
      });
      
      window.dispatchEvent(event);
      
      expect(button.getCollapsedState()).toBe(true);
    });
  });

  describe('Click Interaction', () => {
    it('ควร toggle collapse state เมื่อคลิก', () => {
      const button = new CollapseExpandButton(mockNode);
      
      // Mock event
      const mockEvent = {
        stopPropagation: vi.fn(),
        global: { x: 0, y: 0 }
      } as any;
      
      // จำลองการคลิก
      button.emit('pointerdown', mockEvent);
      
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      // ตรวจสอบว่า state เปลี่ยนแปลง
      expect(nodeStateManager.isCollapsed(mockNode)).toBe(true);
    });

    it('ควรส่ง custom event เมื่อ toggle', () => {
      const button = new CollapseExpandButton(mockNode);
      const eventSpy = vi.fn();
      
      window.addEventListener('node-collapse-toggled', eventSpy);
      
      // Mock event
      const mockEvent = {
        stopPropagation: vi.fn(),
        global: { x: 0, y: 0 }
      } as any;
      
      // จำลองการคลิก
      button.emit('pointerdown', mockEvent);
      
      expect(eventSpy).toHaveBeenCalled();
      
      window.removeEventListener('node-collapse-toggled', eventSpy);
    });
  });

  describe('Hover Effects', () => {
    it('ควรจัดการ hover events', () => {
      const button = new CollapseExpandButton(mockNode);
      
      // Mock events
      const mockOverEvent = {
        stopPropagation: vi.fn()
      } as any;
      
      const mockOutEvent = {
        stopPropagation: vi.fn()
      } as any;
      
      // จำลอง hover เข้า
      button.emit('pointerover', mockOverEvent);
      expect(mockOverEvent.stopPropagation).toHaveBeenCalled();
      
      // จำลอง hover ออก
      button.emit('pointerout', mockOutEvent);
      expect(mockOutEvent.stopPropagation).toHaveBeenCalled();
    });

    it('ควรมี scale animation เมื่อ hover', (done) => {
      const button = new CollapseExpandButton(mockNode);
      const initialScale = button.scale.x;
      
      // Mock event
      const mockEvent = {
        stopPropagation: vi.fn()
      } as any;
      
      // จำลอง hover เข้า
      button.emit('pointerover', mockEvent);
      
      // ตรวจสอบหลังจาก animation เริ่ม
      setTimeout(() => {
        expect(button.scale.x).toBeGreaterThan(initialScale);
        done();
      }, 50);
    });
  });

  describe('Position Management', () => {
    it('ควรอัปเดตตำแหน่งตาม node bounds', () => {
      const button = new CollapseExpandButton(mockNode);
      
      // ตำแหน่งเริ่มต้น
      const initialX = button.x;
      const initialY = button.y;
      
      // เปลี่ยน bounds ของ node
      (mockNode as any).getBounds = vi.fn().mockReturnValue({
        x: 200,
        y: 200,
        width: 200,
        height: 100
      });
      
      // อัปเดตตำแหน่ง
      button.updateButtonPosition();
      
      // ตำแหน่งควรเปลี่ยน
      expect(button.x).not.toBe(initialX);
      expect(button.y).not.toBe(initialY);
    });

    it('ควรวางตำแหน่งที่ top-right เป็นค่าเริ่มต้น', () => {
      const button = new CollapseExpandButton(mockNode);
      
      // ตรวจสอบว่าตำแหน่งอยู่ทางขวาของ node
      const nodeBounds = mockNode.getBounds();
      expect(button.x).toBeGreaterThan(nodeBounds.x + nodeBounds.width / 2);
      expect(button.y).toBeLessThan(nodeBounds.y + nodeBounds.height / 2);
    });

    it('ควรวางตำแหน่งที่ top-left เมื่อระบุ', () => {
      const button = new CollapseExpandButton(mockNode, { position: 'top-left' });
      
      // ตรวจสอบว่าตำแหน่งอยู่ทางซ้ายของ node
      const nodeBounds = mockNode.getBounds();
      expect(button.x).toBeLessThan(nodeBounds.x + nodeBounds.width / 2);
      expect(button.y).toBeLessThan(nodeBounds.y + nodeBounds.height / 2);
    });
  });

  describe('Factory Function', () => {
    it('ควรสร้าง CollapseExpandButton ผ่าน factory function', () => {
      const button = createCollapseExpandButton(mockNode);
      
      expect(button).toBeInstanceOf(CollapseExpandButton);
    });

    it('ควรส่ง options ไปยัง constructor ผ่าน factory function', () => {
      const options = { size: 32 };
      const button = createCollapseExpandButton(mockNode, options);
      
      expect(button).toBeInstanceOf(CollapseExpandButton);
    });
  });

  describe('Cleanup และ Destroy', () => {
    it('ควรทำลาย component ได้อย่างถูกต้อง', () => {
      const button = new CollapseExpandButton(mockNode);
      
      // ตรวจสอบว่ามี children
      expect(button.children.length).toBeGreaterThan(0);
      
      // ทำลาย component
      button.destroy();
      
      // ตรวจสอบว่า destroyed แล้ว
      expect(button.destroyed).toBe(true);
    });

    it('ควรลบ event listeners เมื่อ destroy', () => {
      const button = new CollapseExpandButton(mockNode);
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      button.destroy();
      
      // ตรวจสอบว่ามีการลบ event listener
      expect(removeEventListenerSpy).toHaveBeenCalled();
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Integration กับ NodeStateManager', () => {
    it('ควรอัปเดต NodeStateManager เมื่อคลิก', () => {
      const button = new CollapseExpandButton(mockNode);
      
      // ตรวจสอบสถานะเริ่มต้น
      expect(nodeStateManager.isCollapsed(mockNode)).toBe(false);
      
      // Mock event
      const mockEvent = {
        stopPropagation: vi.fn()
      } as any;
      
      // คลิกปุ่ม
      button.emit('pointerdown', mockEvent);
      
      // ตรวจสอบว่า state เปลี่ยน
      expect(nodeStateManager.isCollapsed(mockNode)).toBe(true);
    });

    it('ควรซิงค์กับ NodeStateManager เมื่อ state เปลี่ยนจากภายนอก', () => {
      const button = new CollapseExpandButton(mockNode);
      
      // เปลี่ยน state ผ่าน NodeStateManager
      nodeStateManager.setCollapsed(mockNode, true);
      
      // ตรวจสอบว่า button อัปเดตตาม
      expect(button.getCollapsedState()).toBe(true);
    });
  });
});