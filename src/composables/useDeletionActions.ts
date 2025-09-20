// src/composables/useDeletionActions.ts

import type { SelectableElement } from '../stores/selectionState';
import type { DeletionRecord } from '../stores/deletionState';

/**
 * Composable สำหรับการจัดการ Element Deletion
 * ใช้ Function-based architecture พร้อม React Hook patterns
 */

/**
 * Hook สำหรับการลบ Elements
 * รวม actions และ utilities ไว้ในที่เดียว
 */
export function useDeletionActions() {
  
  /**
   * ลบ Element โดยใช้ Deletion Store
   * @param element - Element ที่ต้องการลบ
   * @returns Promise<boolean> - สถานะการลบ
   */
  async function deleteElement(element: SelectableElement): Promise<boolean> {
    try {
      const { useDeletionState } = await import('../stores/deletionState');
      const deletionState = useDeletionState.getState();
      
      console.log('🗑️ Initiating element deletion via composable:', element.nodeId);
      return await deletionState.deleteElement(element);
      
    } catch (error) {
      console.error('❌ Deletion composable error:', error);
      return false;
    }
  }

  /**
   * ลบ Node Element เฉพาะ
   * @param element - Node Element ที่ต้องการลบ
   * @returns Promise<boolean> - สถานะการลบ
   */
  async function deleteNode(element: SelectableElement): Promise<boolean> {
    if (element.type !== 'node') {
      console.warn('⚠️ Element is not a node type');
      return false;
    }

    try {
      const { useDeletionState } = await import('../stores/deletionState');
      const deletionState = useDeletionState.getState();
      
      return await deletionState.deleteNode(element);
      
    } catch (error) {
      console.error('❌ Node deletion composable error:', error);
      return false;
    }
  }

  /**
   * ลบ Edge Element เฉพาะ
   * @param element - Edge Element ที่ต้องการลบ
   * @returns Promise<boolean> - สถานะการลบ
   */
  async function deleteEdge(element: SelectableElement): Promise<boolean> {
    if (element.type !== 'edge') {
      console.warn('⚠️ Element is not an edge type');
      return false;
    }

    try {
      const { useDeletionState } = await import('../stores/deletionState');
      const deletionState = useDeletionState.getState();
      
      return await deletionState.deleteEdge(element);
      
    } catch (error) {
      console.error('❌ Edge deletion composable error:', error);
      return false;
    }
  }

  /**
   * ลบ Elements หลายตัวพร้อมกัน
   * @param elements - Array ของ Elements ที่ต้องการลบ
   * @returns Promise<boolean[]> - Array ของสถานะการลบแต่ละ element
   */
  async function deleteMultipleElements(elements: SelectableElement[]): Promise<boolean[]> {
    console.log(`🗑️ Starting bulk deletion of ${elements.length} elements`);
    
    const results: boolean[] = [];
    
    // ลบทีละตัวเพื่อรักษา order และ error handling
    for (const element of elements) {
      try {
        const success = await deleteElement(element);
        results.push(success);
        
        if (success) {
          console.log(`✅ Successfully deleted element: ${element.nodeId}`);
        } else {
          console.warn(`⚠️ Failed to delete element: ${element.nodeId}`);
        }
        
        // เว้นระยะห่างเล็กน้อยระหว่างการลบเพื่อให้ UI ตามทัน
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`❌ Error deleting element ${element.nodeId}:`, error);
        results.push(false);
      }
    }
    
    const successCount = results.filter(Boolean).length;
    console.log(`🎯 Bulk deletion completed: ${successCount}/${elements.length} successful`);
    
    return results;
  }

  /**
   * ตรวจสอบว่า Element กำลังถูกลบอยู่หรือไม่
   * @param nodeId - ID ของ Node
   * @returns boolean - สถานะการลบ
   */
  async function isDeleting(nodeId: string): Promise<boolean> {
    try {
      const { useDeletionState } = await import('../stores/deletionState');
      const deletionState = useDeletionState.getState();
      
      return deletionState.isDeleting(nodeId);
      
    } catch (error) {
      console.error('❌ Error checking deletion status:', error);
      return false;
    }
  }

  /**
   * ตรวจสอบว่า Element สามารถลบได้หรือไม่
   * @param element - Element ที่ต้องการตรวจสอบ
   * @returns Promise<{canDelete: boolean, reason?: string}> - สถานะและเหตุผล
   */
  async function canDeleteElement(element: SelectableElement): Promise<{
    canDelete: boolean;
    reason?: string;
  }> {
    try {
      const { calculateDeletionPermissions } = await import('../utils/elementDeletion');
      return calculateDeletionPermissions(element);
      
    } catch (error) {
      console.error('❌ Error checking deletion permissions:', error);
      return {
        canDelete: false,
        reason: 'Permission check failed'
      };
    }
  }

  /**
   * ได้ประวัติการลบ Elements
   * @returns Promise<DeletionRecord[]> - Array ของ deletion records
   */
  async function getDeletionHistory(): Promise<DeletionRecord[]> {
    try {
      const { useDeletionState } = await import('../stores/deletionState');
      const deletionState = useDeletionState.getState();
      
      return deletionState.getDeletionHistory();
      
    } catch (error) {
      console.error('❌ Error getting deletion history:', error);
      return [];
    }
  }

  /**
   * ล้างประวัติการลบ Elements
   * @returns Promise<void>
   */
  async function clearDeletionHistory(): Promise<void> {
    try {
      const { useDeletionState } = await import('../stores/deletionState');
      const deletionState = useDeletionState.getState();
      
      deletionState.clearHistory();
      console.log('🧹 Deletion history cleared via composable');
      
    } catch (error) {
      console.error('❌ Error clearing deletion history:', error);
    }
  }

  /**
   * สถิติการลบ Elements
   * @returns Promise<{total: number, successful: number, failed: number}> - สถิติการลบ
   */
  async function getDeletionStats(): Promise<{
    total: number;
    successful: number;
    failed: number;
  }> {
    try {
      const history = await getDeletionHistory();
      
      const total = history.length;
      const successful = history.filter(record => record.success).length;
      const failed = total - successful;
      
      return { total, successful, failed };
      
    } catch (error) {
      console.error('❌ Error calculating deletion stats:', error);
      return { total: 0, successful: 0, failed: 0 };
    }
  }

  // Return all actions และ utilities
  return {
    // Core deletion actions
    deleteElement,
    deleteNode,
    deleteEdge,
    deleteMultipleElements,
    
    // Status checks
    isDeleting,
    canDeleteElement,
    
    // History management
    getDeletionHistory,
    clearDeletionHistory,
    getDeletionStats
  };
}

/**
 * Hook สำหรับการ Monitor Deletion Events
 * ใช้สำหรับ components ที่ต้องการฟัง deletion events
 */
export function useDeletionEvents() {
  
  /**
   * เพิ่ม Event Listener สำหรับ Deletion Events
   * @param callback - Function ที่จะถูกเรียกเมื่อมี deletion event
   * @returns cleanup function
   */
  function onDeletionEvent(
    callback: (event: CustomEvent) => void
  ): () => void {
    const events = [
      'element-deletion-started',
      'element-deletion-completed',
      'element-deletion-failed'
    ];
    
    // เพิ่ม listeners สำหรับทุก deletion events
    events.forEach(eventType => {
      window.addEventListener(eventType, callback as EventListener);
    });
    
    console.log('👂 Deletion event listeners added');
    
    // Return cleanup function
    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, callback as EventListener);
      });
      console.log('🧹 Deletion event listeners removed');
    };
  }

  /**
   * เพิ่ม Event Listener สำหรับ Deletion Started Events
   * @param callback - Function ที่จะถูกเรียกเมื่อเริ่มลบ element
   * @returns cleanup function
   */
  function onDeletionStarted(
    callback: (detail: { element: SelectableElement; elementType: string }) => void
  ): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail);
    };
    
    window.addEventListener('element-deletion-started', handler as EventListener);
    
    return () => {
      window.removeEventListener('element-deletion-started', handler as EventListener);
    };
  }

  /**
   * เพิ่ม Event Listener สำหรับ Deletion Completed Events
   * @param callback - Function ที่จะถูกเรียกเมื่อลบ element สำเร็จ
   * @returns cleanup function
   */
  function onDeletionCompleted(
    callback: (detail: { element: SelectableElement; elementType: string }) => void
  ): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail);
    };
    
    window.addEventListener('element-deletion-completed', handler as EventListener);
    
    return () => {
      window.removeEventListener('element-deletion-completed', handler as EventListener);
    };
  }

  /**
   * เพิ่ม Event Listener สำหรับ Deletion Failed Events
   * @param callback - Function ที่จะถูกเรียกเมื่อลบ element ไม่สำเร็จ
   * @returns cleanup function
   */
  function onDeletionFailed(
    callback: (detail: { element: SelectableElement; elementType: string; error: string }) => void
  ): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail);
    };
    
    window.addEventListener('element-deletion-failed', handler as EventListener);
    
    return () => {
      window.removeEventListener('element-deletion-failed', handler as EventListener);
    };
  }

  return {
    onDeletionEvent,
    onDeletionStarted,
    onDeletionCompleted,
    onDeletionFailed
  };
}

/**
 * ตัวอย่างการใช้งาน Composables:
 * 
 * ```typescript
 * // ใน component
 * const { deleteElement, isDeleting, canDeleteElement } = useDeletionActions();
 * const { onDeletionCompleted } = useDeletionEvents();
 * 
 * // ลบ element
 * const handleDelete = async (element: SelectableElement) => {
 *   const permission = await canDeleteElement(element);
 *   if (permission.canDelete) {
 *     const success = await deleteElement(element);
 *     console.log('Delete result:', success);
 *   }
 * };
 * 
 * // ฟัง deletion events
 * useEffect(() => {
 *   const cleanup = onDeletionCompleted((detail) => {
 *     console.log('Element deleted:', detail.element.nodeId);
 *   });
 *   return cleanup;
 * }, []);
 * ```
 */