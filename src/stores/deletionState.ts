// src/stores/deletionState.ts

import { createStore } from 'zustand/vanilla';
import { Container, Application } from 'pixi.js';
import type { SelectableElement } from './selectionState';

/**
 * Deletion Record สำหรับ tracking การลบ
 */
export interface DeletionRecord {
  nodeId: string;
  elementType: 'node' | 'edge';
  timestamp: number;
  success: boolean;
  error?: string;
}

/**
 * Deletion State Store Interface
 * ใช้ Function-based architecture ด้วย Zustand
 */
interface DeletionStateStore {
  // State
  deletingElements: Map<string, boolean>;
  deletionHistory: DeletionRecord[];
  
  // Actions - Element Deletion
  deleteNode: (element: SelectableElement) => Promise<boolean>;
  deleteEdge: (element: SelectableElement) => Promise<boolean>;
  deleteElement: (element: SelectableElement) => Promise<boolean>; // Generic method
  
  // Actions - State Management
  markAsDeleting: (nodeId: string) => void;
  unmarkAsDeleting: (nodeId: string) => void;
  addDeletionRecord: (record: DeletionRecord) => void;
  
  // Actions - Utilities
  isDeleting: (nodeId: string) => boolean;
  getDeletionHistory: () => DeletionRecord[];
  clearHistory: () => void;
  destroy: () => void;
}

/**
 * Helper function สำหรับสร้าง deletion record
 */
function createDeletionRecord(
  element: SelectableElement,
  success: boolean,
  error?: string
): DeletionRecord {
  return {
    nodeId: element.nodeId,
    elementType: element.type,
    timestamp: Date.now(),
    success,
    error
  };
}

/**
 * Zustand store สำหรับจัดการ Element Deletion
 * ใช้ Function-based pattern ตาม architecture ของโปรเจค
 */
export const useDeletionState = createStore<DeletionStateStore>((set, get) => ({
  // Initial State
  deletingElements: new Map(),
  deletionHistory: [],

  // === Element Deletion Actions ===
  deleteNode: async (element: SelectableElement): Promise<boolean> => {
    const { markAsDeleting, unmarkAsDeleting, addDeletionRecord } = get();
    
    console.log('🗑️ Starting node deletion:', element.nodeId);
    markAsDeleting(element.nodeId);
    
    try {
      // Import deletion utilities dynamically
      const { deleteNodeElement } = await import('../utils/elementDeletion');
      
      // ส่ง event ก่อนลบ
      const startEvent = new CustomEvent('element-deletion-started', {
        detail: { element, elementType: 'node' }
      });
      window.dispatchEvent(startEvent);
      
      // ลบ node element
      const success = await deleteNodeElement(element);
      
      if (success) {
        console.log('✅ Node deletion successful:', element.nodeId);
        
        // ส่ง event เมื่อลบสำเร็จ
        const completedEvent = new CustomEvent('element-deletion-completed', {
          detail: { element, elementType: 'node' }
        });
        window.dispatchEvent(completedEvent);
        
        // บันทึกประวัติ
        addDeletionRecord(createDeletionRecord(element, true));
      } else {
        throw new Error('Node deletion failed');
      }
      
      return success;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Node deletion failed:', element.nodeId, errorMessage);
      
      // ส่ง event เมื่อลบไม่สำเร็จ
      const failedEvent = new CustomEvent('element-deletion-failed', {
        detail: { element, elementType: 'node', error: errorMessage }
      });
      window.dispatchEvent(failedEvent);
      
      // บันทึกประวัติ
      addDeletionRecord(createDeletionRecord(element, false, errorMessage));
      
      return false;
      
    } finally {
      unmarkAsDeleting(element.nodeId);
    }
  },

  deleteEdge: async (element: SelectableElement): Promise<boolean> => {
    const { markAsDeleting, unmarkAsDeleting, addDeletionRecord } = get();
    
    console.log('🗑️ Starting edge deletion:', element.nodeId);
    markAsDeleting(element.nodeId);
    
    try {
      // Import deletion utilities dynamically
      const { deleteEdgeElement } = await import('../utils/elementDeletion');
      
      // ส่ง event ก่อนลบ
      const startEvent = new CustomEvent('element-deletion-started', {
        detail: { element, elementType: 'edge' }
      });
      window.dispatchEvent(startEvent);
      
      // ลบ edge element
      const success = await deleteEdgeElement(element);
      
      if (success) {
        console.log('✅ Edge deletion successful:', element.nodeId);
        
        // ส่ง event เมื่อลบสำเร็จ
        const completedEvent = new CustomEvent('element-deletion-completed', {
          detail: { element, elementType: 'edge' }
        });
        window.dispatchEvent(completedEvent);
        
        // บันทึกประวัติ
        addDeletionRecord(createDeletionRecord(element, true));
      } else {
        throw new Error('Edge deletion failed');
      }
      
      return success;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Edge deletion failed:', element.nodeId, errorMessage);
      
      // ส่ง event เมื่อลบไม่สำเร็จ
      const failedEvent = new CustomEvent('element-deletion-failed', {
        detail: { element, elementType: 'edge', error: errorMessage }
      });
      window.dispatchEvent(failedEvent);
      
      // บันทึกประวัติ
      addDeletionRecord(createDeletionRecord(element, false, errorMessage));
      
      return false;
      
    } finally {
      unmarkAsDeleting(element.nodeId);
    }
  },

  deleteElement: async (element: SelectableElement): Promise<boolean> => {
    const { deleteNode, deleteEdge } = get();
    
    // เลือกใช้ method ที่เหมาะสมตามประเภทของ element
    if (element.type === 'node') {
      return await deleteNode(element);
    } else if (element.type === 'edge') {
      return await deleteEdge(element);
    } else {
      console.error('❌ Unknown element type:', element.type);
      return false;
    }
  },

  // === State Management Actions ===
  markAsDeleting: (nodeId: string) => {
    set((state) => {
      const newDeletingElements = new Map(state.deletingElements);
      newDeletingElements.set(nodeId, true);
      return { deletingElements: newDeletingElements };
    });
    
    console.log('⏳ Marked as deleting:', nodeId);
  },

  unmarkAsDeleting: (nodeId: string) => {
    set((state) => {
      const newDeletingElements = new Map(state.deletingElements);
      newDeletingElements.delete(nodeId);
      return { deletingElements: newDeletingElements };
    });
    
    console.log('✅ Unmarked as deleting:', nodeId);
  },

  addDeletionRecord: (record: DeletionRecord) => {
    set((state) => ({
      deletionHistory: [...state.deletionHistory, record]
    }));
    
    console.log('📝 Added deletion record:', record);
  },

  // === Utility Actions ===
  isDeleting: (nodeId: string): boolean => {
    const { deletingElements } = get();
    return deletingElements.has(nodeId);
  },

  getDeletionHistory: (): DeletionRecord[] => {
    const { deletionHistory } = get();
    return [...deletionHistory]; // Return copy to prevent mutation
  },

  clearHistory: () => {
    set({ deletionHistory: [] });
    console.log('🧹 Deletion history cleared');
  },

  destroy: () => {
    console.log('🗑️ Destroying deletion state store');
    
    set({
      deletingElements: new Map(),
      deletionHistory: []
    });
  }
}));

/**
 * Compatibility wrapper สำหรับโค้ดเดิม (Backward compatibility)
 * ช่วยให้โค้ดเดิมที่ใช้ manager pattern ยังทำงานได้
 */
export const deletionManager = {
  deleteElement: (element: SelectableElement): Promise<boolean> => {
    return useDeletionState.getState().deleteElement(element);
  },
  
  deleteNode: (element: SelectableElement): Promise<boolean> => {
    return useDeletionState.getState().deleteNode(element);
  },
  
  deleteEdge: (element: SelectableElement): Promise<boolean> => {
    return useDeletionState.getState().deleteEdge(element);
  },
  
  isDeleting: (nodeId: string): boolean => {
    return useDeletionState.getState().isDeleting(nodeId);
  },
  
  getDeletionHistory: (): DeletionRecord[] => {
    return useDeletionState.getState().getDeletionHistory();
  },
  
  clearHistory: (): void => {
    useDeletionState.getState().clearHistory();
  }
};

/**
 * Export types สำหรับใช้งานภายนอก
 */
export type { DeletionStateStore };