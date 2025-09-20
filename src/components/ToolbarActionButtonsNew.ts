// src/components/ToolbarActionButtonsNew.ts

import { useToolbarState } from '../stores/toolbarState';
import type { SelectableElement } from '../stores/selectionState';

/**
 * Function-based Toolbar Action Buttons
 * แทนที่ class-based version เดิมด้วย function-based architecture
 * 
 * ตาม Laws of UX:
 * - Jakob's Law: ใช้ไอคอนและสไตล์ที่คุ้นเคย (✏️ สำหรับ Edit, 🗑️ สำหรับ Delete)
 * - Fitts's Law: ทำปุ่มใหญ่พอและวางตำแหน่งให้เข้าถึงง่าย
 * - Aesthetic-Usability Effect: ออกแบบสวยงามด้วย gradient และ hover effects
 * - Doherty Threshold: ตอบสนองไว < 400ms ด้วย immediate visual feedback
 */

interface ToolbarUIElements {
  actionSection: HTMLDivElement;
  statusText: HTMLSpanElement;
  editButton: HTMLButtonElement;
  deleteButton: HTMLButtonElement;
  separator: HTMLDivElement;
}

/**
 * Global reference สำหรับ UI elements
 */
let toolbarUI: ToolbarUIElements | null = null;
let isInitialized = false;

/**
 * สร้าง UI elements สำหรับ toolbar action buttons
 */
function createToolbarUI(): ToolbarUIElements {
  console.log('🎨 Creating function-based toolbar UI elements');

  // สร้าง action section
  const actionSection = document.createElement('div');
  actionSection.className = 'toolbar-action-section';
  actionSection.id = 'toolbar-action-section-new';

  // สร้าง status text
  const statusText = document.createElement('span');
  statusText.className = 'action-status-text';
  statusText.style.cssText = `
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    margin-right: 8px;
    transition: all 0.2s ease;
  `;

  // สร้าง separator
  const separator = document.createElement('div');
  separator.className = 'toolbar-separator';
  separator.style.cssText = `
    width: 1px;
    height: 24px;
    background: rgba(255, 255, 255, 0.2);
    margin: 0 8px;
  `;

  // สร้าง edit button
  const editButton = document.createElement('button');
  editButton.className = 'toolbar-btn toolbar-btn-edit';
  editButton.title = 'Edit Selected Element';
  editButton.innerHTML = `
    <span class="btn-icon">✏️</span>
    <span class="btn-label">Edit</span>
  `;

  // สร้าง delete button
  const deleteButton = document.createElement('button');
  deleteButton.className = 'toolbar-btn toolbar-btn-delete';
  deleteButton.title = 'Delete Selected Element';
  deleteButton.innerHTML = `
    <span class="btn-icon">🗑️</span>
    <span class="btn-label">Delete</span>
  `;

  // เพิ่ม elements เข้าไปใน action section
  actionSection.appendChild(statusText);
  actionSection.appendChild(separator);
  actionSection.appendChild(editButton);
  actionSection.appendChild(deleteButton);

  return {
    actionSection,
    statusText,
    editButton,
    deleteButton,
    separator
  };
}

/**
 * เพิ่ม CSS styles สำหรับ action buttons
 */
function addActionButtonStyles(): void {
  // ตรวจสอบว่าได้เพิ่ม styles แล้วหรือยัง
  if (document.getElementById('toolbar-action-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'toolbar-action-styles';
  style.textContent = `
    /* Action Section Styles */
    .toolbar-action-section {
      display: none;
      align-items: center;
      margin-left: 16px;
      padding-left: 16px;
      border-left: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
    }
    
    .toolbar-action-section.visible {
      display: flex;
      animation: slideInRight 0.3s ease;
    }
    
    /* Button Styles */
    .toolbar-btn-edit {
      background: linear-gradient(135deg, #4CAF50, #45a049);
      border: 1px solid #45a049;
      transition: all 0.2s ease;
    }
    
    .toolbar-btn-edit:hover:not(:disabled) {
      background: linear-gradient(135deg, #45a049, #3d8b40);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
    }
    
    .toolbar-btn-edit:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
    }
    
    .toolbar-btn-delete {
      background: linear-gradient(135deg, #f44336, #d32f2f);
      border: 1px solid #d32f2f;
      margin-left: 8px;
      transition: all 0.2s ease;
    }
    
    .toolbar-btn-delete:hover:not(:disabled) {
      background: linear-gradient(135deg, #d32f2f, #b71c1c);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
    }
    
    .toolbar-btn-delete:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);
    }
    
    /* Disabled State */
    .toolbar-btn-edit:disabled,
    .toolbar-btn-delete:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: none !important;
    }
    
    /* Loading State */
    .toolbar-btn.loading {
      position: relative;
      color: transparent !important;
    }
    
    .toolbar-btn.loading::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    /* Separator */
    .toolbar-separator {
      display: inline-block;
    }
    
    /* Animation */
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes spin {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }
    
    /* Mobile Optimization - Fitts's Law */
    @media (max-width: 768px) {
      .toolbar-btn {
        min-width: 44px;
        min-height: 44px;
        font-size: 14px;
      }
      
      .toolbar-action-section {
        margin-left: 8px;
        padding-left: 8px;
      }
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * ตั้งค่า event listeners สำหรับ buttons
 */
function setupEventListeners(ui: ToolbarUIElements): void {
  // Edit button click handler
  ui.editButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const toolbarState = useToolbarState.getState();
    toolbarState.handleEditAction();
  });

  // Delete button click handler  
  ui.deleteButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const toolbarState = useToolbarState.getState();
    toolbarState.handleDeleteAction();
  });

  console.log('🎯 Event listeners setup complete');
}

/**
 * อัปเดต UI elements ตาม toolbar state
 */
function updateToolbarUI(): void {
  if (!toolbarUI) return;

  const toolbarState = useToolbarState.getState();
  const { editButton, deleteButton, isVisible, currentSelectedElement } = toolbarState;

  // อัปเดต visibility ของ action section
  if (isVisible) {
    toolbarUI.actionSection.classList.add('visible');
  } else {
    toolbarUI.actionSection.classList.remove('visible');
  }

  // อัปเดต edit button
  updateButtonState(toolbarUI.editButton, editButton);
  
  // อัปเดต delete button
  updateButtonState(toolbarUI.deleteButton, deleteButton);

  // อัปเดต status text
  updateStatusText(currentSelectedElement);
}

/**
 * อัปเดต state ของ button แต่ละตัว
 */
function updateButtonState(
  buttonElement: HTMLButtonElement, 
  buttonState: any
): void {
  // Visibility
  buttonElement.style.display = buttonState.visible ? 'flex' : 'none';
  
  // Enabled/Disabled
  buttonElement.disabled = !buttonState.enabled;
  
  // Loading state
  if (buttonState.loading) {
    buttonElement.classList.add('loading');
  } else {
    buttonElement.classList.remove('loading');
  }
  
  // Tooltip
  if (buttonState.tooltip) {
    buttonElement.title = buttonState.tooltip;
  }
}

/**
 * อัปเดต status text ตาม current element
 */
function updateStatusText(currentElement: SelectableElement | null): void {
  if (!toolbarUI) return;

  if (currentElement) {
    const elementType = currentElement.type === 'node' ? 'Node' : 'Edge';
    toolbarUI.statusText.textContent = `${elementType}:`;
    toolbarUI.statusText.style.opacity = '1';
  } else {
    toolbarUI.statusText.textContent = 'Selected:';
    toolbarUI.statusText.style.opacity = '0.6';
  }
}

/**
 * เพิ่ม toolbar UI เข้าไปใน DOM
 */
function addToolbarToDOM(ui: ToolbarUIElements): void {
  const toolbar = document.getElementById('toolbar');
  if (!toolbar) {
    console.error('❌ ไม่พบ toolbar element');
    return;
  }

  // ลบ action section เก่าถ้ามี
  const existingSection = document.getElementById('toolbar-action-section');
  if (existingSection) {
    existingSection.remove();
  }

  // เพิ่ม action section ใหม่
  toolbar.appendChild(ui.actionSection);
  console.log('✅ Function-based toolbar UI added to DOM');
}

/**
 * Initialize function-based toolbar action buttons
 */
export function initializeToolbarActionButtons(): void {
  if (isInitialized) {
    console.log('⚠️ Toolbar action buttons already initialized');
    return;
  }

  console.log('🚀 Initializing function-based toolbar action buttons');

  // เพิ่ม CSS styles
  addActionButtonStyles();

  // สร้าง UI elements
  toolbarUI = createToolbarUI();

  // เพิ่ม event listeners
  setupEventListeners(toolbarUI);

  // เพิ่มเข้าไปใน DOM
  addToolbarToDOM(toolbarUI);

  // ตั้งค่า state listeners
  setupStateListeners();

  // อัปเดต UI ครั้งแรก
  updateToolbarUI();

  isInitialized = true;
  console.log('✅ Function-based toolbar action buttons initialized');
}

/**
 * ตั้งค่า listeners สำหรับ state changes
 */
function setupStateListeners(): void {
  // ฟัง toolbar state changes
  window.addEventListener('toolbar-visibility-change', () => {
    updateToolbarUI();
  });

  window.addEventListener('toolbar-buttons-update', () => {
    updateToolbarUI();
  });

  // Subscribe to zustand store changes
  const unsubscribe = useToolbarState.subscribe(() => {
    updateToolbarUI();
  });

  // เก็บ unsubscribe function สำหรับ cleanup
  (window as any).__toolbarUnsubscribe = unsubscribe;
}

/**
 * ทำลาย toolbar action buttons
 */
export function destroyToolbarActionButtons(): void {
  if (!isInitialized) return;

  console.log('🗑️ Destroying function-based toolbar action buttons');

  // ลบ UI elements
  if (toolbarUI?.actionSection.parentNode) {
    toolbarUI.actionSection.parentNode.removeChild(toolbarUI.actionSection);
  }

  // ลบ CSS styles
  const styleElement = document.getElementById('toolbar-action-styles');
  if (styleElement) {
    styleElement.remove();
  }

  // Cleanup zustand subscription
  if ((window as any).__toolbarUnsubscribe) {
    (window as any).__toolbarUnsubscribe();
    delete (window as any).__toolbarUnsubscribe;
  }

  // Reset variables
  toolbarUI = null;
  isInitialized = false;

  console.log('✅ Function-based toolbar action buttons destroyed');
}

/**
 * Compatibility functions สำหรับ migration จาก class-based
 */
export const toolbarActionButtons = {
  show: async (selectedContainer: any) => {
    // Convert container เป็น SelectableElement (ใช้ใน transition period)
    const { selectionManager } = await import('../stores/selectionState');
    const element = selectionManager.getSelectableElement(selectedContainer);
    
    if (element) {
      const toolbarState = useToolbarState.getState();
      toolbarState.setCurrentElement(element);
    }
  },
  
  hide: () => {
    const toolbarState = useToolbarState.getState();
    toolbarState.hideToolbar();
  },
  
  destroy: destroyToolbarActionButtons,
  
  // Getters สำหรับ debug
  getUI: () => toolbarUI,
  isInitialized: () => isInitialized
};

/**
 * Auto-initialize เมื่อ import module
 */
if (typeof window !== 'undefined') {
  // เพิ่ม global reference สำหรับ modalManager
  import('../components/ModalFramework').then(({ modalManager }) => {
    (window as any).modalManager = modalManager;
  });

  // ใช้ timeout เพื่อให้ DOM โหลดเสร็จก่อน
  setTimeout(() => {
    initializeToolbarActionButtons();
  }, 100);
}