// src/utils/elementDeletion.ts

import { Container, Application } from 'pixi.js';
import type { SelectableElement } from '../stores/selectionState';

/**
 * Element Deletion Utilities
 * Pure functions สำหรับการลบ elements ต่างๆ
 * ใช้ Function-based architecture ตาม CLAUDE.md
 */

/**
 * ลบ element ออกจาก PixiJS stage
 * @param container - Container ที่ต้องการลบ
 * @param _app - PixiJS Application (optional, จะหาจาก global ถ้าไม่ระบุ)
 * @returns success status
 */
export function removeElementFromStage(container: Container, _app?: Application): boolean {
  try {
    if (!container || !container.parent) {
      console.warn('⚠️ Container not found or not added to stage');
      return false;
    }

    // ลบ container ออกจาก parent (stage)
    container.parent.removeChild(container);
    
    // ทำลาย container เพื่อปล่อย memory
    container.destroy({
      children: true,    // ลบ children ด้วย
      texture: false     // เก็บ textures ไว้ (อาจใช้ซ้ำ)
    });
    
    console.log('✅ Removed element from stage successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to remove element from stage:', error);
    return false;
  }
}

/**
 * ลบ element ออกจาก ComponentTree
 * @param container - Container ที่ต้องการลบ
 * @returns success status
 */
export function removeElementFromComponentTree(container: Container): boolean {
  try {
    // ส่ง event เพื่อแจ้ง ComponentTree ให้ลบ component
    const event = new CustomEvent('pixi-component-removed', {
      detail: { container }
    });
    window.dispatchEvent(event);
    
    console.log('✅ Notified ComponentTree to remove element');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to remove element from ComponentTree:', error);
    return false;
  }
}

/**
 * หา edges ที่เชื่อมต่อกับ node container นี้
 * @param nodeContainer - Node container ที่ต้องการหา connected edges
 * @returns array ของ edge containers ที่เชื่อมต่อ
 */
export function findConnectedEdges(nodeContainer: Container): Container[] {
  const connectedEdges: Container[] = [];
  
  try {
    // หา app จาก nodeContainer.parent hierarchy
    let currentParent = nodeContainer.parent;
    while (currentParent && !currentParent.children) {
      currentParent = currentParent.parent;
    }
    
    if (!currentParent) {
      console.warn('⚠️ Could not find stage to search for connected edges');
      return connectedEdges;
    }
    
    // วนหาทุก children ใน stage เพื่อหา edges ที่เชื่อมต่อ
    currentParent.children.forEach(child => {
      if (child instanceof Container && (child as any).edgeData) {
        const edgeData = (child as any).edgeData;
        
        // ตรวจสอบว่า edge นี้เชื่อมต่อกับ node ที่ต้องการลบหรือไม่
        if (edgeData.sourceNode === nodeContainer || edgeData.targetNode === nodeContainer) {
          connectedEdges.push(child);
          console.log('🔗 Found connected edge:', edgeData.labelText);
        }
      }
    });
    
    console.log(`🔍 Found ${connectedEdges.length} connected edges`);
    return connectedEdges;
    
  } catch (error) {
    console.error('❌ Failed to find connected edges:', error);
    return connectedEdges;
  }
}

/**
 * ลบ edge connections และ references
 * @param edgeContainer - Edge container ที่ต้องการลบ connections
 * @returns success status
 */
export function removeEdgeConnections(edgeContainer: Container): boolean {
  try {
    const edgeData = (edgeContainer as any).edgeData;
    
    if (!edgeData) {
      console.warn('⚠️ Edge data not found, cannot remove connections');
      return false;
    }
    
    // ลบ reference จาก source และ target nodes (ถ้ามี)
    if (edgeData.sourceNode) {
      const sourceData = (edgeData.sourceNode as any).nodeData;
      if (sourceData && sourceData.connectedEdges) {
        sourceData.connectedEdges = sourceData.connectedEdges.filter(
          (edge: Container) => edge !== edgeContainer
        );
      }
    }
    
    if (edgeData.targetNode) {
      const targetData = (edgeData.targetNode as any).nodeData;
      if (targetData && targetData.connectedEdges) {
        targetData.connectedEdges = targetData.connectedEdges.filter(
          (edge: Container) => edge !== edgeContainer
        );
      }
    }
    
    console.log('✅ Removed edge connections successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to remove edge connections:', error);
    return false;
  }
}

/**
 * ทำความสะอาด references และ metadata ของ element
 * @param container - Container ที่ต้องการทำความสะอาด
 */
export function cleanupElementReferences(container: Container): void {
  try {
    // ลบ selection state references
    if ((container as any).selectableElement) {
      delete (container as any).selectableElement;
    }
    
    // ลบ node data references
    if ((container as any).nodeData) {
      delete (container as any).nodeData;
    }
    
    // ลบ edge data references
    if ((container as any).edgeData) {
      delete (container as any).edgeData;
    }
    
    // ลบ event listeners
    container.removeAllListeners();
    
    console.log('✅ Cleaned up element references');
    
  } catch (error) {
    console.error('❌ Failed to cleanup element references:', error);
  }
}

/**
 * ลบ Node element และทุกอย่างที่เกี่ยวข้อง
 * @param element - SelectableElement ที่ต้องการลบ
 * @returns success status
 */
export async function deleteNodeElement(element: SelectableElement): Promise<boolean> {
  try {
    console.log('🗑️ Starting node element deletion process');
    
    const container = element.container;
    
    // 1. หา connected edges และลบก่อน
    const connectedEdges = findConnectedEdges(container);
    console.log(`🔗 Deleting ${connectedEdges.length} connected edges`);
    
    for (const edgeContainer of connectedEdges) {
      const success = await deleteEdgeElement({
        container: edgeContainer,
        nodeId: `edge_${Date.now()}`,
        type: 'edge',
        isSelected: false
      } as SelectableElement);
      
      if (!success) {
        console.warn('⚠️ Failed to delete connected edge, continuing...');
      }
    }
    
    // 2. ลบจาก selection state
    const { useSelectionState } = await import('../stores/selectionState');
    const selectionState = useSelectionState.getState();
    selectionState.deselectElement(element);
    
    // 3. ลบจาก node state
    const { useNodeState } = await import('../stores/nodeState');
    const nodeState = useNodeState.getState();
    if (nodeState.removeNodeState) {
      nodeState.removeNodeState(element.nodeId);
    }
    
    // 4. ลบจาก ComponentTree
    removeElementFromComponentTree(container);
    
    // 5. ลบจาก stage
    removeElementFromStage(container);
    
    // 6. ทำความสะอาด references
    cleanupElementReferences(container);
    
    console.log('✅ Node element deletion completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Node element deletion failed:', error);
    return false;
  }
}

/**
 * ลบ Edge element และทุกอย่างที่เกี่ยวข้อง
 * @param element - SelectableElement ที่ต้องการลบ
 * @returns success status
 */
export async function deleteEdgeElement(element: SelectableElement): Promise<boolean> {
  try {
    console.log('🗑️ Starting edge element deletion process');
    
    const container = element.container;
    
    // 1. ลบจาก selection state
    const { useSelectionState } = await import('../stores/selectionState');
    const selectionState = useSelectionState.getState();
    selectionState.deselectElement(element);
    
    // 2. ลบ edge connections
    removeEdgeConnections(container);
    
    // 3. ลบจาก ComponentTree (ถ้า edges ถูกแสดงใน tree)
    removeElementFromComponentTree(container);
    
    // 4. ลบจาก stage
    removeElementFromStage(container);
    
    // 5. ทำความสะอาด references
    cleanupElementReferences(container);
    
    console.log('✅ Edge element deletion completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Edge element deletion failed:', error);
    return false;
  }
}

/**
 * ตรวจสอบว่า element สามารถลบได้หรือไม่
 * @param element - SelectableElement ที่ต้องการตรวจสอบ
 * @returns permission object
 */
export function calculateDeletionPermissions(element: SelectableElement): {
  canDelete: boolean;
  reason?: string;
} {
  try {
    // ตรวจสอบว่า container ยังมีอยู่หรือไม่
    if (!element.container) {
      return {
        canDelete: false,
        reason: 'Container not found'
      };
    }
    
    // ตรวจสอบว่า element อยู่ใน stage หรือไม่
    if (!element.container.parent) {
      return {
        canDelete: false,
        reason: 'Element not in stage'
      };
    }
    
    // ตรวจสอบว่ากำลัง delete อยู่หรือไม่ (skip for now due to import issues)
    
    // สามารถลบได้
    return {
      canDelete: true
    };
    
  } catch (error) {
    console.error('❌ Failed to calculate deletion permissions:', error);
    return {
      canDelete: false,
      reason: 'Permission check failed'
    };
  }
}

/**
 * สร้าง fade out animation ก่อนลบ element (UX enhancement)
 * @param container - Container ที่ต้องการ animate
 * @param duration - ระยะเวลา animation (ms)
 * @returns Promise ที่ resolve เมื่อ animation เสร็จ
 */
export function fadeOutElement(container: Container, duration: number = 300): Promise<void> {
  return new Promise((resolve) => {
    if (!container || !container.parent) {
      resolve();
      return;
    }
    
    const startAlpha = container.alpha;
    const startTime = Date.now();
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out animation curve
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      container.alpha = startAlpha * (1 - easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }
    
    requestAnimationFrame(animate);
  });
}