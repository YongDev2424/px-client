// src/stores/toolbarState.ts

import { createStore } from 'zustand/vanilla';
import type { SelectableElement } from './selectionState';
import { 
  calculateToolbarVisibility, 
  type ToolbarVisibilityConfig,
  selectionRulesManager 
} from '../utils/selectionRules';
import { showModal, showConfirmModal, modalManager } from '../components/ModalFramework';

/**
 * Toolbar Action Types
 */
export type ToolbarAction = 'edit' | 'delete';

/**
 * Toolbar Button State
 */
export interface ToolbarButtonState {
  visible: boolean;
  enabled: boolean;
  loading: boolean;
  tooltip?: string;
}

/**
 * Toolbar State Interface
 */
interface ToolbarStateStore {
  // State
  editButton: ToolbarButtonState;
  deleteButton: ToolbarButtonState;
  currentSelectedElement: SelectableElement | null;
  isVisible: boolean;
  
  // Actions - Button Management
  showToolbar: () => void;
  hideToolbar: () => void;
  updateButtonStates: (config: ToolbarVisibilityConfig) => void;
  setButtonLoading: (action: ToolbarAction, loading: boolean) => void;
  setButtonEnabled: (action: ToolbarAction, enabled: boolean) => void;
  
  // Actions - Element Management
  setCurrentElement: (element: SelectableElement | null) => void;
  getCurrentElement: () => SelectableElement | null;
  
  // Actions - Button Handlers
  handleEditAction: () => void;
  handleDeleteAction: () => void;
  
  // Actions - Utility
  reset: () => void;
  getButtonState: (action: ToolbarAction) => ToolbarButtonState;
  isActionAvailable: (action: ToolbarAction) => boolean;
}

/**
 * Initial button states
 */
const createInitialButtonState = (): ToolbarButtonState => ({
  visible: false,
  enabled: false,
  loading: false,
  tooltip: undefined
});

/**
 * Zustand store สำหรับจัดการ Toolbar State
 */
export const useToolbarState = createStore<ToolbarStateStore>((set, get) => ({
  // Initial State
  editButton: createInitialButtonState(),
  deleteButton: createInitialButtonState(),
  currentSelectedElement: null,
  isVisible: false,

  // === Button Management ===
  showToolbar: () => {
    console.log('📱 Showing toolbar');
    set({ isVisible: true });
    
    // ส่ง event สำหรับ DOM updates
    const event = new CustomEvent('toolbar-visibility-change', {
      detail: { visible: true }
    });
    window.dispatchEvent(event);
  },

  hideToolbar: () => {
    console.log('📱 Hiding toolbar');
    set({ isVisible: false });
    
    // Reset button states เมื่อซ่อน toolbar
    set({
      editButton: createInitialButtonState(),
      deleteButton: createInitialButtonState(),
      currentSelectedElement: null
    });
    
    // ส่ง event สำหรับ DOM updates
    const event = new CustomEvent('toolbar-visibility-change', {
      detail: { visible: false }
    });
    window.dispatchEvent(event);
  },

  updateButtonStates: (config: ToolbarVisibilityConfig) => {
    console.log('🔄 Updating toolbar button states:', config.reason);
    
    // อัปเดต edit button
    const editButton: ToolbarButtonState = {
      visible: config.showEditButton,
      enabled: config.canEdit,
      loading: false,
      tooltip: config.canEdit ? 'Edit selected element' : 'Cannot edit multiple elements'
    };

    // อัปเดต delete button
    const deleteButton: ToolbarButtonState = {
      visible: config.showDeleteButton,
      enabled: config.canDelete,
      loading: false,
      tooltip: config.canDelete ? 'Delete selected element' : 'Cannot delete multiple elements'
    };

    set({ editButton, deleteButton });

    // แสดง/ซ่อน toolbar ตาม button visibility
    const shouldShowToolbar = config.showEditButton || config.showDeleteButton;
    if (shouldShowToolbar && !get().isVisible) {
      get().showToolbar();
    } else if (!shouldShowToolbar && get().isVisible) {
      get().hideToolbar();
    }

    // ส่ง event สำหรับ DOM updates
    const event = new CustomEvent('toolbar-buttons-update', {
      detail: { editButton, deleteButton, config }
    });
    window.dispatchEvent(event);
  },

  setButtonLoading: (action: ToolbarAction, loading: boolean) => {
    const state = get();
    
    if (action === 'edit') {
      set({
        editButton: {
          ...state.editButton,
          loading,
          enabled: loading ? false : state.editButton.enabled
        }
      });
    } else if (action === 'delete') {
      set({
        deleteButton: {
          ...state.deleteButton,
          loading,
          enabled: loading ? false : state.deleteButton.enabled
        }
      });
    }

    console.log(`⏳ ${action} button loading: ${loading}`);
  },

  setButtonEnabled: (action: ToolbarAction, enabled: boolean) => {
    const state = get();
    
    if (action === 'edit') {
      set({
        editButton: {
          ...state.editButton,
          enabled: enabled && !state.editButton.loading
        }
      });
    } else if (action === 'delete') {
      set({
        deleteButton: {
          ...state.deleteButton,
          enabled: enabled && !state.deleteButton.loading
        }
      });
    }

    console.log(`🔧 ${action} button enabled: ${enabled}`);
  },

  // === Element Management ===
  setCurrentElement: (element: SelectableElement | null) => {
    set({ currentSelectedElement: element });
    
    if (element) {
      console.log(`🎯 Current element set: ${element.type} (${element.nodeId})`);
    } else {
      console.log('🎯 Current element cleared');
    }
  },

  getCurrentElement: () => {
    return get().currentSelectedElement;
  },

  // === Button Handlers ===
  handleEditAction: () => {
    const { currentSelectedElement, editButton, setButtonLoading } = get();
    
    if (!currentSelectedElement || !editButton.enabled || editButton.loading) {
      console.warn('⚠️ Edit action not available');
      return;
    }

    console.log('✏️ Edit action triggered for:', currentSelectedElement.type);
    
    // Set loading state
    setButtonLoading('edit', true);
    
    try {
      // Requirement 3: เข้าสู่โหมด edit ด้วย Modal
      const modalId = `edit-${currentSelectedElement.type}-${Date.now()}`;
      const elementType = currentSelectedElement.type === 'node' ? 'Node' : 'Edge';
      
      const elements = showModal(modalId, {
        title: `Edit ${elementType}`,
        size: 'medium',
        closable: true,
        onOpen: () => {
          console.log('🎯 Edit modal opened for:', currentSelectedElement.nodeId);
        },
        onClose: () => {
          console.log('📝 Edit modal closed');
        }
      });

      // เพิ่ม temporary content (จะถูกแทนที่ด้วย actual editor ใน Phase 3)
      elements.content.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #6b7280;">
          <div style="font-size: 24px; margin-bottom: 16px;">✏️</div>
          <h3 style="margin: 0 0 8px 0; color: #374151;">Edit ${elementType}</h3>
          <p style="margin: 0; line-height: 1.5;">
            Editing functionality for ${elementType.toLowerCase()} will be implemented in Phase 3.<br>
            <strong>Element ID:</strong> ${currentSelectedElement.nodeId}<br>
            <strong>Type:</strong> ${currentSelectedElement.type}
          </p>
        </div>
      `;

      // เพิ่ม footer กับปุ่ม
      const footer = modalManager.addFooter(modalId);
      footer.innerHTML = `
        <button type="button" class="btn btn-secondary" onclick="window.modalManager.closeModal('${modalId}')">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="alert('Save functionality coming in Phase 3')">Save Changes</button>
      `;

      // ส่ง event สำหรับ tracking
      const event = new CustomEvent('toolbar-edit-action', {
        detail: { 
          element: currentSelectedElement,
          elementType: currentSelectedElement.type,
          modalId
        }
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('❌ Edit action failed:', error);
    } finally {
      // ปล่อย loading state หลังจาก 200ms
      setTimeout(() => {
        setButtonLoading('edit', false);
      }, 200);
    }
  },

  handleDeleteAction: () => {
    const { currentSelectedElement, deleteButton, setButtonLoading } = get();
    
    if (!currentSelectedElement || !deleteButton.enabled || deleteButton.loading) {
      console.warn('⚠️ Delete action not available');
      return;
    }

    console.log('🗑️ Delete action triggered for:', currentSelectedElement.type);
    
    // Set loading state
    setButtonLoading('delete', true);
    
    try {
      // Requirement 4: แสดง confirmation dialog
      const elementType = currentSelectedElement.type === 'node' ? 'Node' : 'Edge';
      const message = `Are you sure you want to delete this ${elementType.toLowerCase()}?<br><br><strong>Element ID:</strong> ${currentSelectedElement.nodeId}<br><strong>Type:</strong> ${currentSelectedElement.type}<br><br>This action cannot be undone.`;
      
      showConfirmModal(
        message,
        `Delete ${elementType}`,
        async () => {
          // Confirm delete
          console.log('🎯 Delete confirmed for:', currentSelectedElement.nodeId);
          
          try {
            // Import deletion store dynamically
            const { useDeletionState } = await import('./deletionState');
            const deletionState = useDeletionState.getState();
            
            // Set delete button loading state
            setButtonLoading('delete', true);
            
            // Perform actual deletion
            const success = await deletionState.deleteElement(currentSelectedElement);
            
            if (success) {
              console.log('✅ Element deleted successfully:', currentSelectedElement.nodeId);
              
              // ส่ง success event
              const successEvent = new CustomEvent('toolbar-delete-success', {
                detail: { 
                  element: currentSelectedElement,
                  elementType: currentSelectedElement.type
                }
              });
              window.dispatchEvent(successEvent);
              
              // Hide toolbar เพราะ element ถูกลบแล้ว
              get().hideToolbar();
              
            } else {
              console.error('❌ Element deletion failed:', currentSelectedElement.nodeId);
              
              // แสดง error message
              const errorEvent = new CustomEvent('toolbar-delete-error', {
                detail: { 
                  element: currentSelectedElement,
                  elementType: currentSelectedElement.type,
                  error: 'Deletion failed'
                }
              });
              window.dispatchEvent(errorEvent);
              
              // Show error alert
              setTimeout(() => {
                alert(`Failed to delete ${elementType.toLowerCase()}. Please try again.`);
              }, 100);
            }
            
          } catch (error) {
            console.error('❌ Delete operation error:', error);
            
            // Show error alert
            setTimeout(() => {
              alert(`Error deleting ${elementType.toLowerCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }, 100);
            
          } finally {
            // ปล่อย loading state
            setButtonLoading('delete', false);
          }
        },
        () => {
          // Cancel delete
          console.log('❌ Delete cancelled for:', currentSelectedElement.nodeId);
        }
      );
      
      // ส่ง event สำหรับ tracking
      const event = new CustomEvent('toolbar-delete-action', {
        detail: { 
          element: currentSelectedElement,
          elementType: currentSelectedElement.type
        }
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('❌ Delete action failed:', error);
    } finally {
      // ปล่อย loading state หลังจาก 200ms
      setTimeout(() => {
        setButtonLoading('delete', false);
      }, 200);
    }
  },

  // === Utility ===
  reset: () => {
    console.log('🔄 Resetting toolbar state');
    
    set({
      editButton: createInitialButtonState(),
      deleteButton: createInitialButtonState(),
      currentSelectedElement: null,
      isVisible: false
    });
  },

  getButtonState: (action: ToolbarAction) => {
    const state = get();
    return action === 'edit' ? state.editButton : state.deleteButton;
  },

  isActionAvailable: (action: ToolbarAction) => {
    const state = get();
    const buttonState = state.getButtonState(action);
    return buttonState.visible && buttonState.enabled && !buttonState.loading;
  }
}));

/**
 * Toolbar Manager Class
 * จัดการการเชื่อมต่อระหว่าง Selection และ Toolbar
 */
class ToolbarManager {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize toolbar manager
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    console.log('🚀 Initializing Toolbar Manager');

    // เชื่อมต่อกับ Selection Rules Manager
    selectionRulesManager.addListener((config: ToolbarVisibilityConfig) => {
      this.handleSelectionChange(config);
    });

    // ฟัง selection change events
    window.addEventListener('pixi-selection-change', () => {
      this.updateFromSelectionState();
    });

    window.addEventListener('selection-cleared', () => {
      this.handleSelectionCleared();
    });

    this.isInitialized = true;
    console.log('✅ Toolbar Manager initialized');
  }

  /**
   * Handle selection change
   */
  private handleSelectionChange(config: ToolbarVisibilityConfig): void {
    const toolbarState = useToolbarState.getState();
    
    // อัปเดต button states
    toolbarState.updateButtonStates(config);
    
    // อัปเดต current element
    this.updateCurrentElement();
  }

  /**
   * Update current element from selection state
   */
  private async updateCurrentElement(): Promise<void> {
    const { getCurrentSelectedElement } = await import('../utils/selectionRules');
    const currentElement = getCurrentSelectedElement();
    
    const toolbarState = useToolbarState.getState();
    toolbarState.setCurrentElement(currentElement);
  }

  /**
   * Handle selection cleared
   */
  private handleSelectionCleared(): void {
    const toolbarState = useToolbarState.getState();
    toolbarState.hideToolbar();
  }

  /**
   * Update from selection state
   */
  private updateFromSelectionState(): void {
    const config = calculateToolbarVisibility();
    this.handleSelectionChange(config);
  }

  /**
   * Destroy toolbar manager
   */
  destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    const toolbarState = useToolbarState.getState();
    toolbarState.reset();
    
    this.isInitialized = false;
    console.log('🗑️ Toolbar Manager destroyed');
  }
}

/**
 * Global toolbar manager instance
 */
export const toolbarManager = new ToolbarManager();

/**
 * Compatibility wrapper สำหรับโค้ดเดิม
 */
export const toolbarState = {
  show: () => useToolbarState.getState().showToolbar(),
  hide: () => useToolbarState.getState().hideToolbar(),
  reset: () => useToolbarState.getState().reset(),
  
  // Button states
  getEditButton: () => useToolbarState.getState().editButton,
  getDeleteButton: () => useToolbarState.getState().deleteButton,
  
  // Actions
  edit: () => useToolbarState.getState().handleEditAction(),
  delete: () => useToolbarState.getState().handleDeleteAction(),
  
  // Current element
  getCurrentElement: () => useToolbarState.getState().getCurrentElement(),
  setCurrentElement: (element: SelectableElement | null) => {
    useToolbarState.getState().setCurrentElement(element);
  }
};