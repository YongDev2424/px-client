// src/test/ActionButtonsContainer.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container, Graphics } from 'pixi.js';
import { ActionButtonsContainer } from '../components/ActionButtonsContainer';
import { nodeStateManager } from '../utils/nodeStateManager';

// Mock nodeStateManager
vi.mock('../utils/nodeStateManager', () => ({
  nodeStateManager: {
    setEditing: vi.fn(),
    initializeNodeState: vi.fn(),
    getNodeState: vi.fn(() => ({
      isCollapsed: false,
      isEditing: false,
      properties: new Map(),
      actionButtonsVisible: false
    }))
  }
}));

describe('ActionButtonsContainer', () => {
  let mockNode: Container;

  beforeEach(() => {
    // สร้าง mock node พร้อม bounds
    mockNode = new Container();
    const mockGraphics = new Graphics();
    mockNode.addChild(mockGraphics);
    mockNode.x = 100;
    mockNode.y = 100;
    
    // เพิ่ม mock getBounds method
    (mockNode as any).getBounds = vi.fn().mockReturnValue({
      x: 100,
      y: 100,
      width: 200,
      height: 100
    });
    
    // Clear mocks
    vi.clearAllMocks();
  });

  describe('การสร้าง ActionButtonsContainer', () => {
    it('ควรสร้าง ActionButtonsContainer ได้', () => {
      const container = new ActionButtonsContainer(mockNode);
      
      expect(container).toBeDefined();
      expect(container.children.length).toBe(2); // editButton + deleteButton
      expect(container.getTargetNode()).toBe(mockNode);
    });

    it('ควรใช้ options ที่กำหนดได้', () => {
      const options = {
        buttonSize: 40,
        spacing: 12,
        position: 'bottom' as const,
        showAnimation: false
      };
      
      const container = new ActionButtonsContainer(mockNode, options);
      
      expect(container).toBeDefined();
      expect(container.children.length).toBe(2);
    });

    it('ควรเริ่มต้นในสถานะซ่อนอยู่', () => {
      const container = new ActionButtonsContainer(mockNode);
      
      expect(container.getVisibility()).toBe(false);
      expect(container.visible).toBe(false);
      expect(container.alpha).toBe(0);
    });
  });

  describe('การจัดตำแหน่งปุ่ม', () => {
    it('ควรจัดตำแหน่งปุ่มแนวนอนสำหรับ position top', () => {
      const container = new ActionButtonsContainer(mockNode, { position: 'top' });
      
      const editButton = container.children[0];
      const deleteButton = container.children[1];
      
      // ปุ่มควรอยู่ในแนวนอน (y เท่ากัน)
      expect(editButton.y).toBe(deleteButton.y);
      // ปุ่ม delete ควรอยู่ทางขวาของปุ่ม edit
      expect(deleteButton.x).toBeGreaterThan(editButton.x);
    });

    it('ควรจัดตำแหน่งปุ่มแนวตั้งสำหรับ position right', () => {
      const container = new ActionButtonsContainer(mockNode, { position: 'right' });
      
      const editButton = container.children[0];
      const deleteButton = container.children[1];
      
      // ปุ่มควรอยู่ในแนวตั้ง (x เท่ากัน)
      expect(editButton.x).toBe(deleteButton.x);
      // ปุ่ม delete ควรอยู่ด้านล่างของปุ่ม edit
      expect(deleteButton.y).toBeGreaterThan(editButton.y);
    });

    it('ควรอัปเดตตำแหน่งตาม target node', () => {
      const container = new ActionButtonsContainer(mockNode, { position: 'top' });
      
      // ตำแหน่งเริ่มต้น
      const initialX = container.x;
      const initialY = container.y;
      
      // เปลี่ยน bounds ของ node
      (mockNode as any).getBounds = vi.fn().mockReturnValue({
        x: 200,
        y: 200,
        width: 300,
        height: 150
      });
      
      // อัปเดตตำแหน่ง
      container.updatePosition();
      
      // ตำแหน่งควรเปลี่ยนตาม
      expect(container.x).not.toBe(initialX);
      expect(container.y).not.toBe(initialY);
    });
  });

  describe('Show/Hide Animation', () => {
    it('ควรแสดงปุ่มได้', async () => {
      const container = new ActionButtonsContainer(mockNode);
      
      expect(container.getVisibility()).toBe(false);
      
      await container.show(false); // ไม่ใช้ animation
      
      expect(container.getVisibility()).toBe(true);
      expect(container.visible).toBe(true);
      expect(container.alpha).toBe(1);
    });

    it('ควรซ่อนปุ่มได้', async () => {
      const container = new ActionButtonsContainer(mockNode);
      
      // แสดงก่อน
      await container.show(false);
      expect(container.getVisibility()).toBe(true);
      
      // ซ่อน
      await container.hide(false);
      
      expect(container.getVisibility()).toBe(false);
      expect(container.visible).toBe(false);
    });

    it('ควรมี animation เมื่อ show พร้อม animation', async () => {
      const container = new ActionButtonsContainer(mockNode, { 
        showAnimation: true,
        animationDuration: 100 
      });
      
      // เริ่มต้น alpha ควรเป็น 0
      expect(container.alpha).toBe(0);
      
      // เริ่ม animation
      const showPromise = container.show(true);
      
      // ระหว่าง animation alpha ควรเปลี่ยน (ตรวจสอบหลังจาก 50ms)
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(container.alpha).toBeGreaterThan(0);
      expect(container.alpha).toBeLessThan(1);
      
      // รอให้ animation เสร็จ
      await showPromise;
      
      // หลัง animation เสร็จ alpha ควรเป็น 1
      expect(container.alpha).toBe(1);
      expect(container.scale.x).toBe(1);
    });

    it('ไม่ควรแสดงซ้ำถ้าแสดงอยู่แล้ว', async () => {
      const container = new ActionButtonsContainer(mockNode);
      
      await container.show(false);
      expect(container.getVisibility()).toBe(true);
      
      // พยายามแสดงอีกครั้ง
      await container.show(false);
      expect(container.getVisibility()).toBe(true); // ยังคงแสดงอยู่
    });
  });

  describe('Button Click Handling', () => {
    it('ควรจัดการ edit button click ได้', () => {
      const container = new ActionButtonsContainer(mockNode);
      const mockEditHandler = vi.fn();
      
      container.setEditClickHandler(mockEditHandler);
      
      // จำลอง click edit button
      const editButton = container.children[0];
      const mockEvent = {
        stopPropagation: vi.fn(),
        global: { x: 0, y: 0 }
      };
      
      editButton.emit('pointerdown', mockEvent);
      
      expect(mockEditHandler).toHaveBeenCalledWith(mockNode, mockEvent);
      expect(nodeStateManager.setEditing).toHaveBeenCalledWith(mockNode, true);
    });

    it('ควรจัดการ delete button click ได้', () => {
      const container = new ActionButtonsContainer(mockNode);
      const mockDeleteHandler = vi.fn();
      
      container.setDeleteClickHandler(mockDeleteHandler);
      
      // จำลอง click delete button
      const deleteButton = container.children[1];
      const mockEvent = {
        stopPropagation: vi.fn(),
        global: { x: 0, y: 0 }
      };
      
      deleteButton.emit('pointerdown', mockEvent);
      
      expect(mockDeleteHandler).toHaveBeenCalledWith(mockNode, mockEvent);
    });

    it('ควรส่ง custom event เมื่อคลิกปุ่ม', () => {
      const container = new ActionButtonsContainer(mockNode);
      const mockEventListener = vi.fn();
      
      // ฟัง custom event
      window.addEventListener('node-action-clicked', mockEventListener);
      
      // จำลอง click edit button
      const editButton = container.children[0];
      editButton.emit('pointerdown', { stopPropagation: vi.fn() });
      
      expect(mockEventListener).toHaveBeenCalled();
      
      // ตรวจสอบ event detail
      const eventDetail = mockEventListener.mock.calls[0][0].detail;
      expect(eventDetail.node).toBe(mockNode);
      expect(eventDetail.action).toBe('edit');
      
      // ลบ event listener
      window.removeEventListener('node-action-clicked', mockEventListener);
    });
  });

  describe('Animation State', () => {
    it('ควรตรวจสอบสถานะ animation ได้', async () => {
      const container = new ActionButtonsContainer(mockNode, { 
        animationDuration: 100 
      });
      
      expect(container.isCurrentlyAnimating()).toBe(false);
      
      // เริ่ม animation
      const showPromise = container.show(true);
      
      // ระหว่าง animation
      expect(container.isCurrentlyAnimating()).toBe(true);
      
      // รอให้ animation เสร็จ
      await showPromise;
      
      expect(container.isCurrentlyAnimating()).toBe(false);
    });

    it('ไม่ควรเริ่ม animation ใหม่ถ้ากำลัง animate อยู่', async () => {
      const container = new ActionButtonsContainer(mockNode, { 
        animationDuration: 200 
      });
      
      // เริ่ม show animation
      const showPromise = container.show(true);
      
      // พยายาม hide ระหว่าง animate
      await container.hide(true);
      
      // show animation ควรยังคงทำงาน
      expect(container.isCurrentlyAnimating()).toBe(true);
      
      await showPromise;
    });
  });

  describe('Cleanup', () => {
    it('ควรทำลาย resources เมื่อเรียก destroy()', () => {
      const container = new ActionButtonsContainer(mockNode);
      
      expect(container.children.length).toBe(2);
      
      container.destroy();
      
      expect(container.destroyed).toBe(true);
    });

    it('ควรซ่อนปุ่มก่อนทำลาย', async () => {
      const container = new ActionButtonsContainer(mockNode);
      
      // แสดงปุ่มก่อน
      await container.show(false);
      expect(container.getVisibility()).toBe(true);
      
      // ทำลาย
      container.destroy();
      
      // ควรถูกซ่อนและทำลาย
      expect(container.destroyed).toBe(true);
    });
  });
});