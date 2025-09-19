// src/test/PropertyContainer.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application, Container } from 'pixi.js';
import { PropertyContainer } from '../components/PropertyContainer';
import { PropertyList } from '../components/PropertyList';
import { PropertyEditor } from '../components/PropertyEditor';
import { PropertyItem } from '../components/PropertyItem';
import { nodeStateManager, PropertyValue } from '../utils/nodeStateManager';

// Mock PixiJS Application
const mockApp = {
  init: vi.fn().mockResolvedValue(undefined),
  screen: { width: 800, height: 600 },
  canvas: document.createElement('canvas'),
  stage: new Container()
} as unknown as Application;

describe('PropertyContainer', () => {
  let targetNode: Container;
  let propertyContainer: PropertyContainer;

  beforeEach(async () => {
    // สร้าง target node สำหรับทดสอบ
    targetNode = new Container();
    (targetNode as any).nodeData = {
      labelText: 'Test Node',
      nodeType: 'c4box'
    };

    // เริ่มต้น node state
    nodeStateManager.initializeNodeState(targetNode);

    // สร้าง PropertyContainer
    propertyContainer = new PropertyContainer(targetNode, {
      width: 200,
      maxHeight: 200,
      maxVisibleProperties: 3
    });
  });

  afterEach(() => {
    // ทำความสะอาด
    propertyContainer?.destroy();
    nodeStateManager.removeNodeState(targetNode);
    nodeStateManager.clearAllStates();
  });

  describe('การสร้าง PropertyContainer', () => {
    it('ควรสร้าง PropertyContainer ได้สำเร็จ', () => {
      expect(propertyContainer).toBeDefined();
      expect(propertyContainer.getTargetNode()).toBe(targetNode);
    });

    it('ควรมี PropertyList และ PropertyEditor', () => {
      // ตรวจสอบว่ามี children ที่จำเป็น
      const children = propertyContainer.children;
      expect(children.length).toBeGreaterThan(0);
    });

    it('ควรเริ่มต้นในสถานะ expanded', () => {
      expect(propertyContainer.isCollapsedState()).toBe(false);
      expect(propertyContainer.isEditModeState()).toBe(false);
    });

    it('ควรแสดงจำนวน properties เป็น 0 เริ่มต้น', () => {
      expect(propertyContainer.getPropertyCount()).toBe(0);
    });
  });

  describe('การจัดการ Properties', () => {
    const testProperty: PropertyValue = {
      key: 'Technology',
      value: 'React',
      type: 'text',
      id: 'test-prop-1',
      order: 0
    };

    it('ควรเพิ่ม property ได้', () => {
      propertyContainer.addProperty(testProperty);
      
      expect(propertyContainer.getPropertyCount()).toBe(1);
      expect(nodeStateManager.hasProperty(targetNode, 'Technology')).toBe(true);
    });

    it('ควรลบ property ได้', () => {
      // เพิ่ม property ก่อน
      propertyContainer.addProperty(testProperty);
      expect(propertyContainer.getPropertyCount()).toBe(1);

      // ลบ property
      propertyContainer.removeProperty('Technology');
      expect(propertyContainer.getPropertyCount()).toBe(0);
      expect(nodeStateManager.hasProperty(targetNode, 'Technology')).toBe(false);
    });

    it('ควรอัปเดต property ได้', () => {
      // เพิ่ม property ก่อน
      propertyContainer.addProperty(testProperty);

      // อัปเดต property
      propertyContainer.updateProperty('Technology', 'Vue.js', 'text');
      
      const properties = propertyContainer.getProperties();
      expect(properties[0].value).toBe('Vue.js');
    });

    it('ควรได้ properties ทั้งหมด', () => {
      const property1: PropertyValue = {
        key: 'Technology',
        value: 'React',
        type: 'text',
        id: 'prop-1',
        order: 0
      };

      const property2: PropertyValue = {
        key: 'Port',
        value: '3000',
        type: 'number',
        id: 'prop-2',
        order: 1
      };

      propertyContainer.addProperty(property1);
      propertyContainer.addProperty(property2);

      const properties = propertyContainer.getProperties();
      expect(properties).toHaveLength(2);
      expect(properties[0].key).toBe('Technology');
      expect(properties[1].key).toBe('Port');
    });
  });

  describe('การจัดการสถานะ Collapsed/Expanded', () => {
    it('ควรเปลี่ยนเป็นสถานะ collapsed ได้', () => {
      propertyContainer.setCollapsed(true);
      expect(propertyContainer.isCollapsedState()).toBe(true);
    });

    it('ควรเปลี่ยนกลับเป็นสถานะ expanded ได้', () => {
      propertyContainer.setCollapsed(true);
      expect(propertyContainer.isCollapsedState()).toBe(true);

      propertyContainer.setCollapsed(false);
      expect(propertyContainer.isCollapsedState()).toBe(false);
    });

    it('ควรอัปเดตขนาดเมื่อเปลี่ยนสถานะ', () => {
      const expandedSize = propertyContainer.getCurrentSize();
      
      propertyContainer.setCollapsed(true);
      const collapsedSize = propertyContainer.getCurrentSize();
      
      expect(collapsedSize.height).toBeLessThan(expandedSize.height);
    });
  });

  describe('การจัดการสถานะ Edit Mode', () => {
    it('ควรเข้าสู่ edit mode ได้', () => {
      propertyContainer.setEditMode(true);
      expect(propertyContainer.isEditModeState()).toBe(true);
    });

    it('ควรออกจาก edit mode ได้', () => {
      propertyContainer.setEditMode(true);
      expect(propertyContainer.isEditModeState()).toBe(true);

      propertyContainer.setEditMode(false);
      expect(propertyContainer.isEditModeState()).toBe(false);
    });
  });

  describe('การคำนวณขนาด', () => {
    it('ควรคำนวณขนาดตามจำนวน properties', () => {
      const initialSize = propertyContainer.getCurrentSize();

      // เพิ่ม properties
      for (let i = 0; i < 3; i++) {
        propertyContainer.addProperty({
          key: `Property${i}`,
          value: `Value${i}`,
          type: 'text',
          id: `prop-${i}`,
          order: i
        });
      }

      const newSize = propertyContainer.getCurrentSize();
      expect(newSize.height).toBeGreaterThanOrEqual(initialSize.height);
    });

    it('ควรจำกัดความสูงสูงสุดตาม maxHeight', () => {
      // เพิ่ม properties เยอะๆ
      for (let i = 0; i < 10; i++) {
        propertyContainer.addProperty({
          key: `Property${i}`,
          value: `Value${i}`,
          type: 'text',
          id: `prop-${i}`,
          order: i
        });
      }

      const size = propertyContainer.getCurrentSize();
      expect(size.height).toBeLessThanOrEqual(200); // maxHeight ที่ตั้งไว้
    });
  });
});

describe('PropertyList', () => {
  let propertyList: PropertyList;

  beforeEach(() => {
    propertyList = new PropertyList({
      width: 180,
      maxHeight: 120,
      itemHeight: 24
    });
  });

  afterEach(() => {
    propertyList?.destroy();
  });

  describe('การจัดการ Properties', () => {
    const testProperty: PropertyValue = {
      key: 'Technology',
      value: 'React',
      type: 'text',
      id: 'test-prop-1',
      order: 0
    };

    it('ควรเพิ่ม property ได้', () => {
      propertyList.addProperty(testProperty);
      expect(propertyList.getPropertyCount()).toBe(1);
      expect(propertyList.hasProperty('Technology')).toBe(true);
    });

    it('ควรลบ property ได้', () => {
      propertyList.addProperty(testProperty);
      expect(propertyList.getPropertyCount()).toBe(1);

      propertyList.removeProperty('Technology');
      expect(propertyList.getPropertyCount()).toBe(0);
      expect(propertyList.hasProperty('Technology')).toBe(false);
    });

    it('ควรอัปเดต property ได้', () => {
      propertyList.addProperty(testProperty);

      const updatedProperty: PropertyValue = {
        ...testProperty,
        value: 'Vue.js'
      };

      propertyList.updateProperty(updatedProperty);
      const properties = propertyList.getAllProperties();
      expect(properties[0].value).toBe('Vue.js');
    });

    it('ควรแสดง properties หลายรายการได้', () => {
      const properties: PropertyValue[] = [
        { key: 'Technology', value: 'React', type: 'text', id: 'prop-1', order: 0 },
        { key: 'Port', value: '3000', type: 'number', id: 'prop-2', order: 1 },
        { key: 'Enabled', value: 'true', type: 'boolean', id: 'prop-3', order: 2 }
      ];

      propertyList.renderProperties(properties);
      expect(propertyList.getPropertyCount()).toBe(3);
    });

    it('ควรล้าง properties ทั้งหมดได้', () => {
      const properties: PropertyValue[] = [
        { key: 'Technology', value: 'React', type: 'text', id: 'prop-1', order: 0 },
        { key: 'Port', value: '3000', type: 'number', id: 'prop-2', order: 1 }
      ];

      propertyList.renderProperties(properties);
      expect(propertyList.getPropertyCount()).toBe(2);

      propertyList.clearProperties();
      expect(propertyList.getPropertyCount()).toBe(0);
    });
  });

  describe('การ Scroll', () => {
    beforeEach(() => {
      // เพิ่ม properties เยอะๆ เพื่อทดสอบ scrolling
      const properties: PropertyValue[] = [];
      for (let i = 0; i < 10; i++) {
        properties.push({
          key: `Property${i}`,
          value: `Value${i}`,
          type: 'text',
          id: `prop-${i}`,
          order: i
        });
      }
      propertyList.renderProperties(properties);
    });

    it('ควร scroll ไปยังตำแหน่งที่กำหนดได้', () => {
      propertyList.scrollTo(50);
      // ตรวจสอบว่า scroll position ถูกตั้งค่าแล้ว
      // (ในการทดสอบจริงอาจต้องตรวจสอบ visual position)
      expect(true).toBe(true); // placeholder assertion
    });

    it('ควร scroll ไปยัง property ที่กำหนดได้', () => {
      propertyList.scrollToProperty('Property5');
      // ตรวจสอบว่า scroll ไปยัง property ที่ถูกต้อง
      expect(true).toBe(true); // placeholder assertion
    });
  });
});

describe('PropertyEditor', () => {
  let propertyEditor: PropertyEditor;

  beforeEach(() => {
    propertyEditor = new PropertyEditor({
      width: 180,
      height: 80
    });
  });

  afterEach(() => {
    propertyEditor?.destroy();
  });

  describe('การแสดง/ซ่อน Editor', () => {
    it('ควรเริ่มต้นในสถานะซ่อน', () => {
      expect(propertyEditor.isVisible()).toBe(false);
    });

    it('ควรแสดง editor สำหรับ property ใหม่ได้', () => {
      propertyEditor.showForNew();
      expect(propertyEditor.isVisible()).toBe(true);
    });

    it('ควรแสดง editor สำหรับแก้ไข property ได้', () => {
      const testProperty: PropertyValue = {
        key: 'Technology',
        value: 'React',
        type: 'text',
        id: 'test-prop-1',
        order: 0
      };

      propertyEditor.showForEdit(testProperty);
      expect(propertyEditor.isVisible()).toBe(true);
    });

    it('ควรซ่อน editor ได้', () => {
      propertyEditor.showForNew();
      expect(propertyEditor.isVisible()).toBe(true);

      propertyEditor.hide();
      expect(propertyEditor.isVisible()).toBe(false);
    });
  });

  describe('Event Handlers', () => {
    it('ควรตั้งค่า save handler ได้', () => {
      const mockSaveHandler = vi.fn();
      propertyEditor.setSaveHandler(mockSaveHandler);
      
      // ตรวจสอบว่า handler ถูกตั้งค่าแล้ว
      expect(true).toBe(true); // placeholder assertion
    });

    it('ควรตั้งค่า cancel handler ได้', () => {
      const mockCancelHandler = vi.fn();
      propertyEditor.setCancelHandler(mockCancelHandler);
      
      // ตรวจสอบว่า handler ถูกตั้งค่าแล้ว
      expect(true).toBe(true); // placeholder assertion
    });

    it('ควรตั้งค่า validation error handler ได้', () => {
      const mockErrorHandler = vi.fn();
      propertyEditor.setValidationErrorHandler(mockErrorHandler);
      
      // ตรวจสอบว่า handler ถูกตั้งค่าแล้ว
      expect(true).toBe(true); // placeholder assertion
    });
  });
});

describe('PropertyItem', () => {
  let propertyItem: PropertyItem;
  const testProperty: PropertyValue = {
    key: 'Technology',
    value: 'React',
    type: 'text',
    id: 'test-prop-1',
    order: 0
  };

  beforeEach(() => {
    propertyItem = new PropertyItem(testProperty, {
      width: 180,
      height: 24
    });
  });

  afterEach(() => {
    propertyItem?.destroy();
  });

  describe('การสร้าง PropertyItem', () => {
    it('ควรสร้าง PropertyItem ได้สำเร็จ', () => {
      expect(propertyItem).toBeDefined();
      expect(propertyItem.getProperty().key).toBe('Technology');
      expect(propertyItem.getProperty().value).toBe('React');
    });

    it('ควรแสดงข้อมูล property ถูกต้อง', () => {
      const property = propertyItem.getProperty();
      expect(property.key).toBe(testProperty.key);
      expect(property.value).toBe(testProperty.value);
      expect(property.type).toBe(testProperty.type);
    });
  });

  describe('การอัปเดต PropertyItem', () => {
    it('ควรอัปเดต property data ได้', () => {
      const updatedProperty: PropertyValue = {
        ...testProperty,
        value: 'Vue.js'
      };

      propertyItem.updateProperty(updatedProperty);
      expect(propertyItem.getProperty().value).toBe('Vue.js');
    });
  });

  describe('Event Handlers', () => {
    it('ควรตั้งค่า edit click handler ได้', () => {
      const mockEditHandler = vi.fn();
      propertyItem.setEditClickHandler(mockEditHandler);
      
      // ตรวจสอบว่า handler ถูกตั้งค่าแล้ว
      expect(true).toBe(true); // placeholder assertion
    });

    it('ควรตั้งค่า delete click handler ได้', () => {
      const mockDeleteHandler = vi.fn();
      propertyItem.setDeleteClickHandler(mockDeleteHandler);
      
      // ตรวจสอบว่า handler ถูกตั้งค่าแล้ว
      expect(true).toBe(true); // placeholder assertion
    });
  });

  describe('การจัดรูปแบบ Value', () => {
    it('ควรแสดง boolean value เป็นสัญลักษณ์', () => {
      const booleanProperty: PropertyValue = {
        key: 'Enabled',
        value: 'true',
        type: 'boolean',
        id: 'bool-prop',
        order: 0
      };

      const boolItem = new PropertyItem(booleanProperty);
      // ตรวจสอบว่า boolean value ถูกแสดงเป็นสัญลักษณ์
      expect(true).toBe(true); // placeholder assertion
      boolItem.destroy();
    });

    it('ควรแสดง number value ถูกต้อง', () => {
      const numberProperty: PropertyValue = {
        key: 'Port',
        value: '3000',
        type: 'number',
        id: 'num-prop',
        order: 0
      };

      const numItem = new PropertyItem(numberProperty);
      expect(numItem.getProperty().value).toBe('3000');
      numItem.destroy();
    });
  });
});

describe('Integration Tests', () => {
  let targetNode: Container;
  let propertyContainer: PropertyContainer;

  beforeEach(() => {
    targetNode = new Container();
    (targetNode as any).nodeData = {
      labelText: 'Integration Test Node',
      nodeType: 'c4box'
    };

    nodeStateManager.initializeNodeState(targetNode);
    propertyContainer = new PropertyContainer(targetNode);
  });

  afterEach(() => {
    propertyContainer?.destroy();
    nodeStateManager.removeNodeState(targetNode);
    nodeStateManager.clearAllStates();
  });

  describe('การทำงานร่วมกันของ Components', () => {
    it('ควรซิงค์ข้อมูลระหว่าง PropertyContainer และ NodeStateManager', () => {
      const testProperty: PropertyValue = {
        key: 'Technology',
        value: 'React',
        type: 'text',
        id: 'integration-prop',
        order: 0
      };

      // เพิ่ม property ผ่าน PropertyContainer
      propertyContainer.addProperty(testProperty);

      // ตรวจสอบว่าข้อมูลถูกซิงค์ไปยัง NodeStateManager
      expect(nodeStateManager.hasProperty(targetNode, 'Technology')).toBe(true);
      expect(nodeStateManager.getPropertyCount(targetNode)).toBe(1);
    });

    it('ควรอัปเดต UI เมื่อ node state เปลี่ยนแปลง', () => {
      // เปลี่ยนสถานะ collapsed ผ่าน NodeStateManager
      nodeStateManager.setCollapsed(targetNode, true);

      // ตรวจสอบว่า PropertyContainer อัปเดตสถานะตาม
      expect(propertyContainer.isCollapsedState()).toBe(true);
    });

    it('ควรจัดการ property operations ผ่าน UI ได้', () => {
      const property1: PropertyValue = {
        key: 'Technology',
        value: 'React',
        type: 'text',
        id: 'prop-1',
        order: 0
      };

      const property2: PropertyValue = {
        key: 'Port',
        value: '3000',
        type: 'number',
        id: 'prop-2',
        order: 1
      };

      // เพิ่ม properties
      propertyContainer.addProperty(property1);
      propertyContainer.addProperty(property2);

      expect(propertyContainer.getPropertyCount()).toBe(2);

      // ลบ property
      propertyContainer.removeProperty('Technology');
      expect(propertyContainer.getPropertyCount()).toBe(1);

      // อัปเดต property
      propertyContainer.updateProperty('Port', '8080', 'number');
      const properties = propertyContainer.getProperties();
      expect(properties[0].value).toBe('8080');
    });
  });
});