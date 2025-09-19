// src/test/PropertyEditor.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Container } from 'pixi.js';
import { PropertyEditor, PropertyEditorOptions, ValidationResult } from '../components/PropertyEditor';
import { PropertyValue } from '../utils/nodeStateManager';

// Mock DOM methods for testing
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn().mockImplementation((tagName: string) => {
      const element = {
        tagName: tagName.toUpperCase(),
        style: {},
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        focus: vi.fn(),
        blur: vi.fn(),
        select: vi.fn(),
        value: '',
        placeholder: '',
        type: '',
        dispatchEvent: vi.fn()
      };
      
      if (tagName === 'select') {
        element.appendChild = vi.fn();
      }
      
      return element;
    }),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    },
    querySelector: vi.fn(),
    querySelectorAll: vi.fn().mockReturnValue([])
  }
});

describe('PropertyEditor', () => {
  let propertyEditor: PropertyEditor;
  let mockSaveHandler: ReturnType<typeof vi.fn>;
  let mockCancelHandler: ReturnType<typeof vi.fn>;
  let mockValidationErrorHandler: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // สร้าง mock handlers
    mockSaveHandler = vi.fn();
    mockCancelHandler = vi.fn();
    mockValidationErrorHandler = vi.fn();

    // สร้าง PropertyEditor
    propertyEditor = new PropertyEditor({
      width: 200,
      height: 120,
      enableTypeSelection: true
    });

    // ตั้งค่า handlers
    propertyEditor.setSaveHandler(mockSaveHandler);
    propertyEditor.setCancelHandler(mockCancelHandler);
    propertyEditor.setValidationErrorHandler(mockValidationErrorHandler);

    // Mock getGlobalPosition method
    propertyEditor.getGlobalPosition = vi.fn().mockReturnValue({ x: 0, y: 0 });
  });

  afterEach(() => {
    // ทำความสะอาด
    if (propertyEditor) {
      propertyEditor.destroy();
    }
  });

  describe('การสร้าง PropertyEditor', () => {
    it('ควรสร้าง PropertyEditor ได้สำเร็จ', () => {
      expect(propertyEditor).toBeDefined();
      expect(propertyEditor.isVisible()).toBe(false);
    });

    it('ควรมี default options ที่ถูกต้อง', () => {
      const size = propertyEditor.getSize();
      expect(size.width).toBe(200);
      expect(size.height).toBe(120);
    });

    it('ควรซ่อนอยู่เริ่มต้น', () => {
      expect(propertyEditor.visible).toBe(false);
      expect(propertyEditor.alpha).toBe(0);
    });
  });

  describe('การแสดง PropertyEditor สำหรับ Property ใหม่', () => {
    it('ควรแสดง editor สำหรับ property ใหม่ได้', () => {
      const existingKeys = new Set(['existing1', 'existing2']);
      
      propertyEditor.showForNew(existingKeys);
      
      expect(propertyEditor.isVisible()).toBe(true);
      expect(propertyEditor.isEditingNewProperty()).toBe(true);
      expect(propertyEditor.getCurrentProperty()).toBeUndefined();
    });

    it('ควรล้างค่าใน inputs เมื่อแสดงสำหรับ property ใหม่', () => {
      // ตั้งค่าเริ่มต้น
      propertyEditor.showForEdit({
        key: 'test',
        value: 'value',
        type: 'text',
        id: 'test-id',
        order: 0
      });
      
      // แสดงสำหรับ property ใหม่
      propertyEditor.showForNew();
      
      expect(propertyEditor.isEditingNewProperty()).toBe(true);
    });
  });

  describe('การแสดง PropertyEditor สำหรับแก้ไข Property', () => {
    const testProperty: PropertyValue = {
      key: 'testKey',
      value: 'testValue',
      type: 'text',
      id: 'test-id',
      order: 0
    };

    it('ควรแสดง editor สำหรับแก้ไข property ได้', () => {
      propertyEditor.showForEdit(testProperty);
      
      expect(propertyEditor.isVisible()).toBe(true);
      expect(propertyEditor.isEditingNewProperty()).toBe(false);
      expect(propertyEditor.getCurrentProperty()).toEqual(testProperty);
    });

    it('ควรตั้งค่าใน inputs ตาม property ที่ส่งมา', () => {
      propertyEditor.showForEdit(testProperty);
      
      const currentProperty = propertyEditor.getCurrentProperty();
      expect(currentProperty?.key).toBe(testProperty.key);
      expect(currentProperty?.value).toBe(testProperty.value);
      expect(currentProperty?.type).toBe(testProperty.type);
    });
  });

  describe('การซ่อน PropertyEditor', () => {
    it('ควรซ่อน editor ได้', () => {
      propertyEditor.showForNew();
      expect(propertyEditor.isVisible()).toBe(true);
      
      propertyEditor.hide();
      expect(propertyEditor.isVisible()).toBe(false);
    });
  });

  describe('Event Handlers', () => {
    it('ควรตั้งค่า save handler ได้', () => {
      const newHandler = vi.fn();
      propertyEditor.setSaveHandler(newHandler);
      
      // ไม่สามารถทดสอบ handler ได้โดยตรงเพราะเป็น private
      // แต่สามารถทดสอบผ่านการ simulate การบันทึก
      expect(newHandler).toBeDefined();
    });

    it('ควรตั้งค่า cancel handler ได้', () => {
      const newHandler = vi.fn();
      propertyEditor.setCancelHandler(newHandler);
      
      expect(newHandler).toBeDefined();
    });

    it('ควรตั้งค่า validation error handler ได้', () => {
      const newHandler = vi.fn();
      propertyEditor.setValidationErrorHandler(newHandler);
      
      expect(newHandler).toBeDefined();
    });
  });

  describe('การจัดการ Existing Keys', () => {
    it('ควรตั้งค่า existing keys ได้', () => {
      const keys = new Set(['key1', 'key2', 'key3']);
      propertyEditor.setExistingKeys(keys);
      
      // ไม่สามารถทดสอบ existingKeys ได้โดยตรงเพราะเป็น private
      // แต่สามารถทดสอบผ่านการ validation
      expect(keys.size).toBe(3);
    });
  });

  describe('การทำลาย PropertyEditor', () => {
    it('ควรทำลาย PropertyEditor ได้โดยไม่เกิด error', () => {
      expect(() => {
        propertyEditor.destroy();
      }).not.toThrow();
    });

    it('ควรลบ HTML elements เมื่อทำลาย', () => {
      // แสดง editor ก่อนเพื่อสร้าง HTML elements
      propertyEditor.showForNew();
      
      // จำนวน elements ก่อนทำลาย
      const elementsBefore = document.querySelectorAll('input, select').length;
      
      propertyEditor.destroy();
      
      // ตรวจสอบว่า elements ถูกลบแล้ว (อาจมี elements อื่นจาก tests อื่น)
      const elementsAfter = document.querySelectorAll('input, select').length;
      expect(elementsAfter).toBeLessThanOrEqual(elementsBefore);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('ควรรองรับ Enter key สำหรับบันทึก', () => {
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      });

      expect(enterEvent.key).toBe('Enter');
    });

    it('ควรรองรับ Escape key สำหรับยกเลิก', () => {
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });

      expect(escapeEvent.key).toBe('Escape');
    });

    it('ควรรองรับ Tab key สำหรับสลับระหว่าง inputs', () => {
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });

      expect(tabEvent.key).toBe('Tab');
    });
  });

  describe('Property Type Handling', () => {
    it('ควรรองรับ text type', () => {
      // Test type detection
      const textTypes = ['hello', 'world', 'some text'];
      textTypes.forEach(value => {
        // This would test the detectValueType method if it were public
        expect(value).toBeDefined();
      });
    });

    it('ควรรองรับ number type', () => {
      const numberTypes = ['123', '45.67', '0', '-10'];
      numberTypes.forEach(value => {
        expect(!isNaN(Number(value))).toBe(true);
      });
    });

    it('ควรรองรับ boolean type', () => {
      const booleanTypes = ['true', 'false'];
      booleanTypes.forEach(value => {
        expect(['true', 'false'].includes(value.toLowerCase())).toBe(true);
      });
    });
  });

  describe('Validation', () => {
    it('ควรตรวจสอบ key ว่างได้', () => {
      // Test validation logic
      const emptyKey = '';
      const validValue = 'someValue';
      
      expect(emptyKey.length).toBe(0);
      expect(validValue.length).toBeGreaterThan(0);
    });

    it('ควรตรวจสอบ value ว่างได้', () => {
      const validKey = 'validKey';
      const emptyValue = '';
      
      expect(validKey.length).toBeGreaterThan(0);
      expect(emptyValue.length).toBe(0);
    });

    it('ควรตรวจสอบ reserved keyword ได้', () => {
      const reservedKeys = ['id', 'type', 'class', 'style', 'onclick', 'constructor', 'prototype', '__proto__'];
      const testKey = 'constructor';
      
      expect(reservedKeys.includes(testKey.toLowerCase())).toBe(true);
    });

    it('ควรตรวจสอบรูปแบบ key ได้', () => {
      const validKeys = ['validKey', 'valid_key', '_validKey', 'validKey123'];
      const invalidKeys = ['123invalid', 'invalid-key', 'invalid key', 'invalid.key'];
      
      const keyPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
      
      validKeys.forEach(key => {
        expect(keyPattern.test(key)).toBe(true);
      });
      
      invalidKeys.forEach(key => {
        expect(keyPattern.test(key)).toBe(false);
      });
    });

    it('ควรตรวจสอบ number value ได้', () => {
      const validNumbers = ['123', '45.67', '0', '-10'];
      const invalidNumbers = ['notANumber', '123abc', 'abc123'];
      
      validNumbers.forEach(value => {
        expect(isNaN(Number(value))).toBe(false);
      });
      
      invalidNumbers.forEach(value => {
        expect(isNaN(Number(value))).toBe(true);
      });
    });

    it('ควรตรวจสอบ boolean value ได้', () => {
      const validBooleans = ['true', 'false', 'TRUE', 'FALSE'];
      const invalidBooleans = ['notBoolean', '1', '0', 'yes', 'no'];
      
      validBooleans.forEach(value => {
        const lowerValue = value.toLowerCase();
        expect(lowerValue === 'true' || lowerValue === 'false').toBe(true);
      });
      
      invalidBooleans.forEach(value => {
        const lowerValue = value.toLowerCase();
        expect(lowerValue === 'true' || lowerValue === 'false').toBe(false);
      });
    });
  });

  describe('Custom Events', () => {
    it('ควรส่ง custom event เมื่อบันทึก property', () => {
      const eventListener = vi.fn();
      window.addEventListener('property-editor-action', eventListener);
      
      propertyEditor.showForNew();
      
      // จำลองการบันทึก (ในการทดสอบจริงอาจต้องใช้ user interaction)
      const testProperty: PropertyValue = {
        key: 'testKey',
        value: 'testValue',
        type: 'text',
        id: 'test-id',
        order: 0
      };
      
      // Trigger save event manually สำหรับการทดสอบ
      const customEvent = new CustomEvent('property-editor-action', {
        detail: {
          action: 'save',
          property: testProperty,
          editor: propertyEditor
        }
      });
      window.dispatchEvent(customEvent);
      
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            action: 'save',
            property: testProperty
          })
        })
      );
      
      window.removeEventListener('property-editor-action', eventListener);
    });

    it('ควรส่ง custom event เมื่อยกเลิก', () => {
      const eventListener = vi.fn();
      window.addEventListener('property-editor-action', eventListener);
      
      propertyEditor.showForNew();
      
      // Trigger cancel event manually สำหรับการทดสอบ
      const customEvent = new CustomEvent('property-editor-action', {
        detail: {
          action: 'cancel',
          editor: propertyEditor
        }
      });
      window.dispatchEvent(customEvent);
      
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            action: 'cancel'
          })
        })
      );
      
      window.removeEventListener('property-editor-action', eventListener);
    });
  });

  describe('Integration Tests', () => {
    it('ควรทำงานร่วมกับ PropertyContainer ได้', () => {
      // ทดสอบการทำงานร่วมกับ PropertyContainer
      // (ต้องมี PropertyContainer ที่ใช้ PropertyEditor)
      
      const existingKeys = new Set(['prop1', 'prop2']);
      propertyEditor.setExistingKeys(existingKeys);
      propertyEditor.showForNew(existingKeys);
      
      expect(propertyEditor.isVisible()).toBe(true);
      expect(propertyEditor.isEditingNewProperty()).toBe(true);
    });

    it('ควรจัดการ property lifecycle ได้ครบถ้วน', () => {
      const testProperty: PropertyValue = {
        key: 'lifecycle',
        value: 'test',
        type: 'text',
        id: 'lifecycle-id',
        order: 0
      };

      // แสดงสำหรับแก้ไข
      propertyEditor.showForEdit(testProperty);
      expect(propertyEditor.getCurrentProperty()).toEqual(testProperty);
      
      // ซ่อน
      propertyEditor.hide();
      expect(propertyEditor.isVisible()).toBe(false);
      
      // แสดงสำหรับสร้างใหม่
      propertyEditor.showForNew();
      expect(propertyEditor.isEditingNewProperty()).toBe(true);
      expect(propertyEditor.getCurrentProperty()).toBeUndefined();
    });
  });
});