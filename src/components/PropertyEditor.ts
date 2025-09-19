// src/components/PropertyEditor.ts

import { Container, Graphics, Text, FederatedPointerEvent } from 'pixi.js';
import { PropertyValue } from '../utils/nodeStateManager';
import { ActionButton } from './ActionButton';

/**
 * ตัวเลือกสำหรับการสร้าง PropertyEditor
 */
export interface PropertyEditorOptions {
  width?: number;                    // ความกว้างของ editor (default: 180)
  height?: number;                   // ความสูงของ editor (default: 120)
  backgroundColor?: number;          // สีพื้นหลัง (default: 0x2a2a2a)
  borderColor?: number;             // สีขอบ (default: 0x555555)
  textColor?: number;               // สีข้อความ (default: 0xffffff)
  fontSize?: number;                // ขนาดตัวอักษร (default: 12)
  padding?: number;                 // ระยะห่างภายใน (default: 8)
  inputHeight?: number;             // ความสูงของ input field (default: 24)
  buttonHeight?: number;            // ความสูงของปุ่ม (default: 28)
  enableTypeSelection?: boolean;    // เปิดใช้งานการเลือกประเภทข้อมูล (default: true)
}

/**
 * Interface สำหรับ validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Component สำหรับแก้ไขและเพิ่ม Property
 * ประกอบด้วย HTML input fields สำหรับ key และ value พร้อมปุ่ม save/cancel
 * รองรับ keyboard shortcuts และ validation
 */
export class PropertyEditor extends Container {
  private options: Required<PropertyEditorOptions>;
  private backgroundGraphics: Graphics;
  private keyLabel: Text;
  private valueLabel: Text;
  private typeLabel: Text;
  private keyInputContainer: HTMLDivElement;
  private valueInputContainer: HTMLDivElement;
  private typeSelectContainer: HTMLDivElement;
  private keyInput: HTMLInputElement;
  private valueInput: HTMLInputElement;
  private typeSelect: HTMLSelectElement;
  private saveButton: ActionButton;
  private cancelButton: ActionButton;
  private errorText: Text;
  
  private currentProperty?: PropertyValue;
  private isEditing: boolean = false;
  private isNewProperty: boolean = false;
  private existingKeys: Set<string> = new Set();
  
  // Event handlers
  private onSave?: (property: PropertyValue, isNew: boolean) => void;
  private onCancel?: () => void;
  private onValidationError?: (error: string) => void;
  
  // Keyboard event handlers
  private boundKeyDownHandler: (event: KeyboardEvent) => void;
  private boundInputHandler: () => void;

  constructor(options: PropertyEditorOptions = {}) {
    super();
    
    // ตั้งค่า default options
    this.options = {
      width: 180,
      height: 120,
      backgroundColor: 0x2a2a2a,
      borderColor: 0x555555,
      textColor: 0xffffff,
      fontSize: 12,
      padding: 8,
      inputHeight: 24,
      buttonHeight: 28,
      enableTypeSelection: true,
      ...options
    };

    // Bind event handlers
    this.boundKeyDownHandler = this.handleKeyDown.bind(this);
    this.boundInputHandler = this.handleInputChange.bind(this);

    this.createBackground();
    this.createLabels();
    this.createInputFields();
    this.createButtons();
    this.createErrorDisplay();
    this.setupEvents();
    this.layoutComponents();
    this.setupInitialState();

    console.log('📝 สร้าง PropertyEditor พร้อม HTML inputs และ validation');
  }

  /**
   * สร้างพื้นหลังของ PropertyEditor
   */
  private createBackground(): void {
    this.backgroundGraphics = new Graphics();
    this.addChild(this.backgroundGraphics);
    this.drawBackground();
  }

  /**
   * วาดพื้นหลัง
   */
  private drawBackground(): void {
    const { width, height, backgroundColor, borderColor } = this.options;

    this.backgroundGraphics.clear();
    
    // วาดพื้นหลัง
    this.backgroundGraphics
      .fill(backgroundColor)
      .rect(0, 0, width, height)
      .fill();

    // วาดขอบ
    this.backgroundGraphics
      .rect(0, 0, width, height)
      .stroke({ width: 2, color: borderColor });
  }

  /**
   * สร้าง Labels สำหรับ Key, Value และ Type
   */
  private createLabels(): void {
    const { textColor, fontSize } = this.options;

    this.keyLabel = new Text({
      text: 'Key:',
      style: {
        fontSize: fontSize,
        fill: textColor,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold'
      }
    });

    this.valueLabel = new Text({
      text: 'Value:',
      style: {
        fontSize: fontSize,
        fill: textColor,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold'
      }
    });

    this.typeLabel = new Text({
      text: 'Type:',
      style: {
        fontSize: fontSize,
        fill: textColor,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold'
      }
    });

    this.addChild(this.keyLabel);
    this.addChild(this.valueLabel);
    if (this.options.enableTypeSelection) {
      this.addChild(this.typeLabel);
    }
  }

  /**
   * สร้าง HTML Input Fields
   */
  private createInputFields(): void {
    const { width, padding, inputHeight, fontSize } = this.options;
    const inputWidth = width - (padding * 2);

    // สร้าง Key Input
    this.keyInputContainer = document.createElement('div');
    this.keyInputContainer.style.position = 'absolute';
    this.keyInputContainer.style.pointerEvents = 'auto';
    this.keyInputContainer.style.zIndex = '1000';

    this.keyInput = document.createElement('input');
    this.keyInput.type = 'text';
    this.keyInput.placeholder = 'Enter property key...';
    this.keyInput.style.width = `${inputWidth}px`;
    this.keyInput.style.height = `${inputHeight}px`;
    this.keyInput.style.fontSize = `${fontSize}px`;
    this.keyInput.style.fontFamily = 'Arial, sans-serif';
    this.keyInput.style.backgroundColor = '#1a1a1a';
    this.keyInput.style.color = '#ffffff';
    this.keyInput.style.border = '1px solid #444444';
    this.keyInput.style.borderRadius = '3px';
    this.keyInput.style.padding = '2px 6px';
    this.keyInput.style.outline = 'none';
    this.keyInput.style.boxSizing = 'border-box';

    this.keyInputContainer.appendChild(this.keyInput);
    document.body.appendChild(this.keyInputContainer);

    // สร้าง Value Input
    this.valueInputContainer = document.createElement('div');
    this.valueInputContainer.style.position = 'absolute';
    this.valueInputContainer.style.pointerEvents = 'auto';
    this.valueInputContainer.style.zIndex = '1000';

    this.valueInput = document.createElement('input');
    this.valueInput.type = 'text';
    this.valueInput.placeholder = 'Enter property value...';
    this.valueInput.style.width = `${inputWidth}px`;
    this.valueInput.style.height = `${inputHeight}px`;
    this.valueInput.style.fontSize = `${fontSize}px`;
    this.valueInput.style.fontFamily = 'Arial, sans-serif';
    this.valueInput.style.backgroundColor = '#1a1a1a';
    this.valueInput.style.color = '#ffffff';
    this.valueInput.style.border = '1px solid #444444';
    this.valueInput.style.borderRadius = '3px';
    this.valueInput.style.padding = '2px 6px';
    this.valueInput.style.outline = 'none';
    this.valueInput.style.boxSizing = 'border-box';

    this.valueInputContainer.appendChild(this.valueInput);
    document.body.appendChild(this.valueInputContainer);

    // สร้าง Type Select (ถ้าเปิดใช้งาน)
    if (this.options.enableTypeSelection) {
      this.typeSelectContainer = document.createElement('div');
      this.typeSelectContainer.style.position = 'absolute';
      this.typeSelectContainer.style.pointerEvents = 'auto';
      this.typeSelectContainer.style.zIndex = '1000';

      this.typeSelect = document.createElement('select');
      this.typeSelect.style.width = `${inputWidth}px`;
      this.typeSelect.style.height = `${inputHeight}px`;
      this.typeSelect.style.fontSize = `${fontSize}px`;
      this.typeSelect.style.fontFamily = 'Arial, sans-serif';
      this.typeSelect.style.backgroundColor = '#1a1a1a';
      this.typeSelect.style.color = '#ffffff';
      this.typeSelect.style.border = '1px solid #444444';
      this.typeSelect.style.borderRadius = '3px';
      this.typeSelect.style.outline = 'none';

      // เพิ่มตัวเลือกประเภทข้อมูล
      const types = [
        { value: 'text', label: 'Text' },
        { value: 'number', label: 'Number' },
        { value: 'boolean', label: 'Boolean' }
      ];

      types.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.label;
        option.style.backgroundColor = '#1a1a1a';
        option.style.color = '#ffffff';
        this.typeSelect.appendChild(option);
      });

      this.typeSelectContainer.appendChild(this.typeSelect);
      document.body.appendChild(this.typeSelectContainer);
    }

    this.setupInputEvents();
  }

  /**
   * ตั้งค่า Event Handlers สำหรับ HTML Input Elements
   */
  private setupInputEvents(): void {
    // Key Input Events
    this.keyInput.addEventListener('input', this.boundInputHandler);
    this.keyInput.addEventListener('keydown', this.boundKeyDownHandler);
    this.keyInput.addEventListener('focus', () => {
      this.keyInput.style.borderColor = '#007AFF';
      this.clearError();
    });
    this.keyInput.addEventListener('blur', () => {
      this.keyInput.style.borderColor = '#444444';
      this.validateKeyInput();
    });

    // Value Input Events
    this.valueInput.addEventListener('input', this.boundInputHandler);
    this.valueInput.addEventListener('keydown', this.boundKeyDownHandler);
    this.valueInput.addEventListener('focus', () => {
      this.valueInput.style.borderColor = '#007AFF';
      this.clearError();
    });
    this.valueInput.addEventListener('blur', () => {
      this.valueInput.style.borderColor = '#444444';
      this.validateValueInput();
    });

    // Type Select Events (ถ้ามี)
    if (this.typeSelect) {
      this.typeSelect.addEventListener('change', this.boundInputHandler);
      this.typeSelect.addEventListener('focus', () => {
        this.typeSelect.style.borderColor = '#007AFF';
      });
      this.typeSelect.addEventListener('blur', () => {
        this.typeSelect.style.borderColor = '#444444';
      });
    }
  }

  /**
   * สร้างปุ่ม Save และ Cancel
   */
  private createButtons(): void {
    const { buttonHeight } = this.options;

    this.saveButton = new ActionButton('edit', { // ใช้ edit icon สำหรับ save
      size: buttonHeight,
      backgroundColor: 0x007AFF,
      borderColor: 0x0056CC,
      iconColor: 0xffffff,
      hoverBackgroundColor: 0x0056CC,
      hoverScale: 1.05
    });

    this.cancelButton = new ActionButton('delete', { // ใช้ delete icon สำหรับ cancel
      size: buttonHeight,
      backgroundColor: 0x666666,
      borderColor: 0x555555,
      iconColor: 0xffffff,
      hoverBackgroundColor: 0x555555,
      hoverScale: 1.05
    });

    this.saveButton.setClickHandler(this.handleSaveClick.bind(this));
    this.cancelButton.setClickHandler(this.handleCancelClick.bind(this));

    this.addChild(this.saveButton);
    this.addChild(this.cancelButton);
  }

  /**
   * สร้าง Error Display
   */
  private createErrorDisplay(): void {
    const { textColor, fontSize } = this.options;

    this.errorText = new Text({
      text: '',
      style: {
        fontSize: fontSize - 1,
        fill: 0xFF4444, // สีแดงสำหรับ error
        fontFamily: 'Arial, sans-serif',
        wordWrap: true,
        wordWrapWidth: this.options.width - (this.options.padding * 2)
      }
    });

    this.errorText.visible = false;
    this.addChild(this.errorText);
  }

  /**
   * จัดตำแหน่งของ components ทั้งหมด
   */
  private layoutComponents(): void {
    const { width, padding, inputHeight, buttonHeight } = this.options;
    let currentY = padding;

    // จัดตำแหน่ง Key Label
    this.keyLabel.x = padding;
    this.keyLabel.y = currentY;
    currentY += this.keyLabel.height + 2;

    // HTML Input จะถูกจัดตำแหน่งใน updateInputPositions()
    currentY += inputHeight + 4;

    // จัดตำแหน่ง Value Label
    this.valueLabel.x = padding;
    this.valueLabel.y = currentY;
    currentY += this.valueLabel.height + 2;
    currentY += inputHeight + 4;

    // จัดตำแหน่ง Type Label (ถ้ามี)
    if (this.options.enableTypeSelection) {
      this.typeLabel.x = padding;
      this.typeLabel.y = currentY;
      currentY += this.typeLabel.height + 2;
      currentY += inputHeight + 4;
    }

    // จัดตำแหน่ง Error Text
    this.errorText.x = padding;
    this.errorText.y = currentY;
    currentY += this.errorText.height + 4;

    // จัดตำแหน่งปุ่ม
    const buttonSpacing = 8;
    const totalButtonWidth = (buttonHeight * 2) + buttonSpacing;
    const buttonStartX = (width - totalButtonWidth) / 2;

    this.saveButton.x = buttonStartX;
    this.saveButton.y = currentY;

    this.cancelButton.x = buttonStartX + buttonHeight + buttonSpacing;
    this.cancelButton.y = currentY;

    // อัปเดตตำแหน่ง HTML inputs
    this.updateInputPositions();
  }

  /**
   * ตั้งค่า Event Handlers
   */
  private setupEvents(): void {
    // HTML input events ถูกตั้งค่าใน setupInputEvents() แล้ว
  }

  /**
   * ตั้งค่าสถานะเริ่มต้น (ซ่อนอยู่)
   */
  private setupInitialState(): void {
    this.visible = false;
    this.alpha = 0;
  }

  /**
   * อัปเดตตำแหน่งของ HTML Input Elements
   */
  private updateInputPositions(): void {
    if (!this.visible) return;

    // คำนวณตำแหน่ง global ของ PropertyEditor
    const globalPos = this.getGlobalPosition();
    const { padding, inputHeight } = this.options;
    
    let currentY = globalPos.y + padding + this.keyLabel.height + 2;

    // ตำแหน่ง Key Input
    this.keyInputContainer.style.left = `${globalPos.x + padding}px`;
    this.keyInputContainer.style.top = `${currentY}px`;
    currentY += inputHeight + 4 + this.valueLabel.height + 2;

    // ตำแหน่ง Value Input
    this.valueInputContainer.style.left = `${globalPos.x + padding}px`;
    this.valueInputContainer.style.top = `${currentY}px`;
    currentY += inputHeight + 4;

    // ตำแหน่ง Type Select (ถ้ามี)
    if (this.typeSelectContainer) {
      currentY += this.typeLabel.height + 2;
      this.typeSelectContainer.style.left = `${globalPos.x + padding}px`;
      this.typeSelectContainer.style.top = `${currentY}px`;
    }
  }

  /**
   * จัดการ Input Change Events
   */
  private handleInputChange(): void {
    this.clearError();
    // Real-time validation อาจเพิ่มได้ที่นี่
  }

  /**
   * จัดการ Keyboard Events สำหรับ HTML Inputs
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.visible) return;

    // ตรวจสอบว่า event มาจาก input elements ของเราหรือไม่
    const target = event.target as HTMLElement;
    if (target !== this.keyInput && target !== this.valueInput && target !== this.typeSelect) {
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this.handleSaveClick();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.handleCancelClick();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      // สลับระหว่าง inputs
      if (target === this.keyInput) {
        this.valueInput.focus();
      } else if (target === this.valueInput && this.typeSelect) {
        this.typeSelect.focus();
      } else if (target === this.typeSelect) {
        this.keyInput.focus();
      } else {
        this.keyInput.focus();
      }
    }
  }



  /**
   * จัดการ Save Button Click
   */
  private handleSaveClick(): void {
    const key = this.keyInput.value.trim();
    const value = this.valueInput.value.trim();
    const selectedType = this.typeSelect ? this.typeSelect.value as PropertyValue['type'] : 'text';

    // Validate input
    const validation = this.validateInput(key, value);
    if (!validation.isValid) {
      console.warn('❌ Validation Error:', validation.errorMessage);
      this.showError(validation.errorMessage || 'Invalid input');
      if (this.onValidationError) {
        this.onValidationError(validation.errorMessage || 'Invalid input');
      }
      return;
    }

    // ตรวจสอบ key ซ้ำ (เฉพาะ property ใหม่หรือเปลี่ยน key)
    if (this.isNewProperty || (this.currentProperty && this.currentProperty.key !== key)) {
      if (this.existingKeys.has(key)) {
        const errorMsg = `Property key "${key}" already exists`;
        console.warn('❌ Duplicate Key Error:', errorMsg);
        this.showError(errorMsg);
        if (this.onValidationError) {
          this.onValidationError(errorMsg);
        }
        return;
      }
    }

    // สร้าง PropertyValue
    const property: PropertyValue = {
      key: key,
      value: value,
      type: selectedType,
      id: this.currentProperty?.id || `prop_${Date.now()}`,
      order: this.currentProperty?.order || 0
    };

    console.log(`💾 บันทึก Property: ${property.key} = ${property.value} (${property.type})`);

    if (this.onSave) {
      this.onSave(property, this.isNewProperty);
    }

    // ส่ง custom event
    this.dispatchEditorEvent('save', property);

    // ซ่อน editor
    this.hide();
  }

  /**
   * จัดการ Cancel Button Click
   */
  private handleCancelClick(): void {
    console.log('❌ ยกเลิกการแก้ไข Property');

    if (this.onCancel) {
      this.onCancel();
    }

    // ส่ง custom event
    this.dispatchEditorEvent('cancel');

    // ซ่อน editor
    this.hide();
  }

  /**
   * Validate input data
   */
  private validateInput(key: string, value: string): ValidationResult {
    // ตรวจสอบ key
    if (!key) {
      return { isValid: false, errorMessage: 'Key cannot be empty' };
    }

    if (key.length > 50) {
      return { isValid: false, errorMessage: 'Key is too long (max 50 characters)' };
    }

    // ตรวจสอบ key format (ต้องเป็น alphanumeric และ underscore เท่านั้น)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      return { isValid: false, errorMessage: 'Key must start with letter or underscore and contain only letters, numbers, and underscores' };
    }

    // ตรวจสอบ reserved keywords
    const reservedKeys = ['id', 'type', 'class', 'style', 'onclick', 'constructor', 'prototype', '__proto__'];
    if (reservedKeys.includes(key.toLowerCase())) {
      return { isValid: false, errorMessage: `"${key}" is a reserved keyword` };
    }

    // ตรวจสอบ value
    if (!value) {
      return { isValid: false, errorMessage: 'Value cannot be empty' };
    }

    if (value.length > 200) {
      return { isValid: false, errorMessage: 'Value is too long (max 200 characters)' };
    }

    // ตรวจสอบ value ตาม type ที่เลือก
    if (this.typeSelect) {
      const selectedType = this.typeSelect.value;
      if (selectedType === 'number') {
        if (isNaN(Number(value))) {
          return { isValid: false, errorMessage: 'Value must be a valid number' };
        }
      } else if (selectedType === 'boolean') {
        const lowerValue = value.toLowerCase();
        if (lowerValue !== 'true' && lowerValue !== 'false') {
          return { isValid: false, errorMessage: 'Boolean value must be "true" or "false"' };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Validate Key Input แบบ real-time
   */
  private validateKeyInput(): void {
    const key = this.keyInput.value.trim();
    if (!key) return;

    // ตรวจสอบ format
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      this.showError('Key must start with letter or underscore and contain only letters, numbers, and underscores');
      return;
    }

    // ตรวจสอบ reserved keywords
    const reservedKeys = ['id', 'type', 'class', 'style', 'onclick', 'constructor', 'prototype', '__proto__'];
    if (reservedKeys.includes(key.toLowerCase())) {
      this.showError(`"${key}" is a reserved keyword`);
      return;
    }

    // ตรวจสอบ key ซ้ำ
    if (this.isNewProperty || (this.currentProperty && this.currentProperty.key !== key)) {
      if (this.existingKeys.has(key)) {
        this.showError(`Property key "${key}" already exists`);
        return;
      }
    }

    this.clearError();
  }

  /**
   * Validate Value Input แบบ real-time
   */
  private validateValueInput(): void {
    const value = this.valueInput.value.trim();
    if (!value) return;

    if (this.typeSelect) {
      const selectedType = this.typeSelect.value;
      if (selectedType === 'number') {
        if (isNaN(Number(value))) {
          this.showError('Value must be a valid number');
          return;
        }
      } else if (selectedType === 'boolean') {
        const lowerValue = value.toLowerCase();
        if (lowerValue !== 'true' && lowerValue !== 'false') {
          this.showError('Boolean value must be "true" or "false"');
          return;
        }
      }
    }

    this.clearError();
  }

  /**
   * แสดง Error Message
   */
  private showError(message: string): void {
    this.errorText.text = message;
    this.errorText.visible = true;
    
    // อัปเดต layout เพื่อรองรับ error text
    this.layoutComponents();
  }

  /**
   * ล้าง Error Message
   */
  private clearError(): void {
    this.errorText.text = '';
    this.errorText.visible = false;
    
    // อัปเดต layout
    this.layoutComponents();
  }

  /**
   * ตรวจจับประเภทของ value
   */
  private detectValueType(value: string): PropertyValue['type'] {
    // ตรวจสอบ boolean
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      return 'boolean';
    }

    // ตรวจสอบ number
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return 'number';
    }

    // default เป็น text
    return 'text';
  }

  /**
   * ส่ง Custom Event
   */
  private dispatchEditorEvent(action: 'save' | 'cancel', property?: PropertyValue): void {
    const customEvent = new CustomEvent('property-editor-action', {
      detail: {
        action: action,
        property: property,
        editor: this
      }
    });
    window.dispatchEvent(customEvent);
  }

  /**
   * แสดง editor สำหรับเพิ่ม property ใหม่
   */
  public showForNew(existingKeys?: Set<string>): void {
    this.currentProperty = undefined;
    this.isNewProperty = true;
    this.existingKeys = existingKeys || new Set();
    
    // ล้างค่าใน inputs
    this.keyInput.value = '';
    this.valueInput.value = '';
    if (this.typeSelect) {
      this.typeSelect.value = 'text';
    }
    
    this.clearError();
    this.show();
    
    // Focus ที่ key input
    setTimeout(() => {
      this.keyInput.focus();
    }, 100);
    
    console.log('➕ แสดง PropertyEditor สำหรับ Property ใหม่');
  }

  /**
   * แสดง editor สำหรับแก้ไข property ที่มีอยู่
   */
  public showForEdit(property: PropertyValue, existingKeys?: Set<string>): void {
    this.currentProperty = { ...property };
    this.isNewProperty = false;
    this.existingKeys = existingKeys || new Set();
    
    // ตั้งค่าใน inputs
    this.keyInput.value = property.key;
    this.valueInput.value = property.value;
    if (this.typeSelect) {
      this.typeSelect.value = property.type;
    }
    
    this.clearError();
    this.show();
    
    // Focus ที่ key input
    setTimeout(() => {
      this.keyInput.focus();
      this.keyInput.select(); // เลือกข้อความทั้งหมดเพื่อแก้ไขง่าย
    }, 100);
    
    console.log(`✏️ แสดง PropertyEditor สำหรับแก้ไข: ${property.key}`);
  }

  /**
   * แสดง editor พร้อม animation
   */
  private show(): void {
    this.visible = true;
    this.alpha = 1;
    
    // แสดง HTML inputs
    this.keyInputContainer.style.display = 'block';
    this.valueInputContainer.style.display = 'block';
    if (this.typeSelectContainer) {
      this.typeSelectContainer.style.display = 'block';
    }
    
    // อัปเดตตำแหน่ง HTML inputs
    this.updateInputPositions();
  }

  /**
   * ซ่อน editor พร้อม animation
   */
  public hide(): void {
    this.visible = false;
    this.alpha = 0;
    
    // ซ่อน HTML inputs
    this.keyInputContainer.style.display = 'none';
    this.valueInputContainer.style.display = 'none';
    if (this.typeSelectContainer) {
      this.typeSelectContainer.style.display = 'none';
    }
    
    // ล้าง error
    this.clearError();
    
    // Blur inputs
    this.keyInput.blur();
    this.valueInput.blur();
    if (this.typeSelect) {
      this.typeSelect.blur();
    }
  }

  /**
   * ตั้งค่า Save Handler
   */
  public setSaveHandler(handler: (property: PropertyValue, isNew: boolean) => void): void {
    this.onSave = handler;
  }

  /**
   * ตั้งค่า Cancel Handler
   */
  public setCancelHandler(handler: () => void): void {
    this.onCancel = handler;
  }

  /**
   * ตั้งค่า Validation Error Handler
   */
  public setValidationErrorHandler(handler: (error: string) => void): void {
    this.onValidationError = handler;
  }

  /**
   * ตรวจสอบว่า editor แสดงอยู่หรือไม่
   */
  public isVisible(): boolean {
    return this.visible && this.alpha > 0;
  }

  /**
   * ได้ขนาดของ PropertyEditor
   */
  public getSize(): { width: number; height: number } {
    return {
      width: this.options.width,
      height: this.options.height
    };
  }

  /**
   * ตั้งค่า existing keys สำหรับ validation
   */
  public setExistingKeys(keys: Set<string>): void {
    this.existingKeys = keys;
  }

  /**
   * ได้ property ปัจจุบันที่กำลังแก้ไข
   */
  public getCurrentProperty(): PropertyValue | undefined {
    return this.currentProperty;
  }

  /**
   * ตรวจสอบว่ากำลังแก้ไข property ใหม่หรือไม่
   */
  public isEditingNewProperty(): boolean {
    return this.isNewProperty;
  }

  /**
   * ทำลาย component และ cleanup resources
   */
  public destroy(): void {
    // ลบ HTML elements
    if (this.keyInputContainer && this.keyInputContainer.parentNode) {
      this.keyInputContainer.parentNode.removeChild(this.keyInputContainer);
    }
    if (this.valueInputContainer && this.valueInputContainer.parentNode) {
      this.valueInputContainer.parentNode.removeChild(this.valueInputContainer);
    }
    if (this.typeSelectContainer && this.typeSelectContainer.parentNode) {
      this.typeSelectContainer.parentNode.removeChild(this.typeSelectContainer);
    }

    // ลบ event listeners
    if (this.keyInput) {
      this.keyInput.removeEventListener('input', this.boundInputHandler);
      this.keyInput.removeEventListener('keydown', this.boundKeyDownHandler);
    }
    if (this.valueInput) {
      this.valueInput.removeEventListener('input', this.boundInputHandler);
      this.valueInput.removeEventListener('keydown', this.boundKeyDownHandler);
    }
    if (this.typeSelect) {
      this.typeSelect.removeEventListener('change', this.boundInputHandler);
    }

    // ทำลาย PixiJS children
    this.backgroundGraphics?.destroy();
    this.keyLabel?.destroy();
    this.valueLabel?.destroy();
    this.typeLabel?.destroy();
    this.errorText?.destroy();
    this.saveButton?.destroy();
    this.cancelButton?.destroy();
    
    console.log('🗑️ ทำลาย PropertyEditor พร้อม HTML inputs');
    
    // เรียก parent destroy
    super.destroy();
  }
}