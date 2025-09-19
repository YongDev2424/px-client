// src/components/ToolbarActionButtons.ts

import { Container } from 'pixi.js';

/**
 * Toolbar Action Buttons ที่แสดงใน toolbar เมื่อมี element ถูกเลือก
 * ใช้ไอคอนและสไตล์เดียวกับปุ่มอื่นใน toolbar
 */
export class ToolbarActionButtons {
  private editButton: HTMLButtonElement;
  private deleteButton: HTMLButtonElement;
  private separatorElement: HTMLDivElement;
  private selectedNode: Container | null = null;
  private isVisible: boolean = false;

  constructor() {
    this.createButtons();
    this.addToToolbar();
    this.hide(); // เริ่มต้นซ่อนไว้
    
    console.log('🔧 สร้าง ToolbarActionButtons');
  }

  /**
   * สร้างปุ่ม Edit และ Delete ตามสไตล์ toolbar
   */
  private createButtons(): void {
    // สร้าง separator
    this.separatorElement = document.createElement('div');
    this.separatorElement.className = 'toolbar-separator';
    this.separatorElement.style.cssText = `
      width: 1px;
      height: 24px;
      background: rgba(255, 255, 255, 0.2);
      margin: 0 8px;
    `;

    // สร้างปุ่ม Edit
    this.editButton = document.createElement('button');
    this.editButton.className = 'toolbar-btn toolbar-btn-edit';
    this.editButton.title = 'Edit Selected Element';
    this.editButton.innerHTML = `
      <span class="btn-icon">✏️</span>
      <span class="btn-label">Edit</span>
    `;

    // สร้างปุ่ม Delete
    this.deleteButton = document.createElement('button');
    this.deleteButton.className = 'toolbar-btn toolbar-btn-delete';
    this.deleteButton.title = 'Delete Selected Element';
    this.deleteButton.innerHTML = `
      <span class="btn-icon">🗑️</span>
      <span class="btn-label">Delete</span>
    `;

    // เพิ่ม CSS สำหรับปุ่ม action
    this.addActionButtonStyles();

    // เพิ่ม event listeners
    this.setupEventListeners();
  }

  /**
   * เพิ่ม CSS สำหรับปุ่ม action
   */
  private addActionButtonStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .toolbar-btn-edit {
        background: linear-gradient(135deg, #4CAF50, #45a049);
        border: 1px solid #45a049;
      }
      
      .toolbar-btn-edit:hover {
        background: linear-gradient(135deg, #45a049, #3d8b40);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
      }
      
      .toolbar-btn-delete {
        background: linear-gradient(135deg, #f44336, #d32f2f);
        border: 1px solid #d32f2f;
      }
      
      .toolbar-btn-delete:hover {
        background: linear-gradient(135deg, #d32f2f, #b71c1c);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
      }
      
      .toolbar-separator {
        display: inline-block;
      }
      
      .toolbar-action-section {
        display: none;
        align-items: center;
        margin-left: 16px;
        padding-left: 16px;
        border-left: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .toolbar-action-section.visible {
        display: flex;
      }
      
      .toolbar-action-section .toolbar-btn {
        margin-left: 8px;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * เพิ่มปุ่มเข้าไปใน toolbar
   */
  private addToToolbar(): void {
    const toolbar = document.getElementById('toolbar');
    if (!toolbar) {
      console.error('❌ ไม่พบ toolbar element');
      return;
    }

    // สร้าง section สำหรับ action buttons
    const actionSection = document.createElement('div');
    actionSection.className = 'toolbar-action-section';
    actionSection.id = 'toolbar-action-section';

    // เพิ่มข้อความแสดงสถานะ
    const statusText = document.createElement('span');
    statusText.className = 'action-status-text';
    statusText.style.cssText = `
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
      margin-right: 8px;
    `;
    statusText.textContent = 'Selected:';

    // เพิ่ม elements เข้าไปใน action section
    actionSection.appendChild(statusText);
    actionSection.appendChild(this.editButton);
    actionSection.appendChild(this.deleteButton);

    // เพิ่ม action section เข้าไปใน toolbar
    toolbar.appendChild(actionSection);

    console.log('✅ เพิ่ม Action Buttons เข้าไปใน toolbar');
  }

  /**
   * ตั้งค่า event listeners
   */
  private setupEventListeners(): void {
    this.editButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.handleEditClick();
    });

    this.deleteButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.handleDeleteClick();
    });
  }

  /**
   * แสดงปุ่มเมื่อมี element ถูกเลือก
   */
  public show(selectedNode: Container): void {
    if (this.isVisible && this.selectedNode === selectedNode) return;

    this.selectedNode = selectedNode;
    this.isVisible = true;

    const actionSection = document.getElementById('toolbar-action-section');
    if (actionSection) {
      actionSection.classList.add('visible');
      
      // อัปเดตข้อความแสดงสถานะ
      const statusText = actionSection.querySelector('.action-status-text');
      if (statusText) {
        const nodeName = selectedNode.nodeData?.labelText || 'Unknown Element';
        statusText.textContent = `Selected: ${nodeName}`;
      }
    }

    console.log('🎯 แสดง Action Buttons ใน toolbar สำหรับ:', selectedNode.nodeData?.labelText);
  }

  /**
   * ซ่อนปุ่มเมื่อไม่มี element ถูกเลือก
   */
  public hide(): void {
    if (!this.isVisible) return;

    this.selectedNode = null;
    this.isVisible = false;

    const actionSection = document.getElementById('toolbar-action-section');
    if (actionSection) {
      actionSection.classList.remove('visible');
    }

    console.log('⭕ ซ่อน Action Buttons ใน toolbar');
  }

  /**
   * จัดการคลิก Edit
   */
  private handleEditClick(): void {
    if (!this.selectedNode) return;

    const nodeName = this.selectedNode.nodeData?.labelText || 'Unknown';
    console.log('✏️ Edit node:', nodeName);

    // ส่ง event
    const event = new CustomEvent('node-edit-requested', {
      detail: {
        node: this.selectedNode,
        nodeName: nodeName
      }
    });
    window.dispatchEvent(event);

    // TODO: เพิ่ม edit functionality
    // สำหรับตอนนี้แสดง prompt ให้แก้ไขชื่อ
    const newName = prompt(`Edit name for "${nodeName}":`, nodeName);
    if (newName && newName !== nodeName) {
      this.selectedNode.nodeData.labelText = newName;
      
      // อัปเดต label ใน node (ถ้ามี)
      const labelElement = this.selectedNode.children.find(child => 
        (child as any).text !== undefined
      );
      if (labelElement) {
        (labelElement as any).text = newName;
      }
      
      // อัปเดตข้อความใน toolbar
      this.show(this.selectedNode);
      
      console.log('✅ อัปเดตชื่อ node เป็น:', newName);
    }
  }

  /**
   * จัดการคลิก Delete
   */
  private handleDeleteClick(): void {
    if (!this.selectedNode) return;

    const nodeName = this.selectedNode.nodeData?.labelText || 'Unknown';
    console.log('🗑️ Delete node:', nodeName);

    const confirmed = confirm(`Are you sure you want to delete "${nodeName}"?`);
    if (confirmed) {
      // ส่ง event
      const event = new CustomEvent('node-delete-requested', {
        detail: {
          node: this.selectedNode,
          nodeName: nodeName
        }
      });
      window.dispatchEvent(event);

      // ลบ node
      this.deleteNode();
    }
  }

  /**
   * ลบ node จาก stage
   */
  private deleteNode(): void {
    if (!this.selectedNode) return;

    // ซ่อน action buttons ก่อน
    this.hide();

    // ลบ node จาก stage
    if (this.selectedNode.parent) {
      this.selectedNode.parent.removeChild(this.selectedNode);
    }

    // ลบจาก selection manager
    try {
      const { selectionManager } = require('../utils/selectionManager');
      const selectableElement = (this.selectedNode as any).selectableElement;
      if (selectableElement) {
        selectionManager.deselectElement(selectableElement);
      }
    } catch (error) {
      console.warn('⚠️ ไม่สามารถลบจาก selection manager:', error);
    }

    console.log('🗑️ ลบ node สำเร็จ:', this.selectedNode.nodeData?.labelText);
    this.selectedNode = null;
  }

  /**
   * ตรวจสอบว่าปุ่มแสดงอยู่หรือไม่
   */
  public getVisibility(): boolean {
    return this.isVisible;
  }

  /**
   * ได้ node ที่ถูกเลือก
   */
  public getSelectedNode(): Container | null {
    return this.selectedNode;
  }

  /**
   * ทำลาย component
   */
  public destroy(): void {
    // ลบ event listeners
    this.editButton?.removeEventListener('click', this.handleEditClick);
    this.deleteButton?.removeEventListener('click', this.handleDeleteClick);

    // ลบ elements จาก DOM
    const actionSection = document.getElementById('toolbar-action-section');
    if (actionSection && actionSection.parentNode) {
      actionSection.parentNode.removeChild(actionSection);
    }

    console.log('🗑️ ทำลาย ToolbarActionButtons');
  }
}

// สร้าง singleton instance
export const toolbarActionButtons = new ToolbarActionButtons();