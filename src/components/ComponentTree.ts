// src/components/ComponentTree.ts
// Component Tree system สำหรับแสดง C4 hierarchy และ sync กับ PixiJS nodes

import { Container, Application } from 'pixi.js';
import { selectionManager, type SelectableElement } from '../utils/selectionManager';

/**
 * Interface สำหรับ C4 Component ใน Tree
 */
export interface C4Component {
  id: string;
  name: string;
  type: 'person' | 'system' | 'container' | 'component';
  pixiNode?: Container;  // Reference ไปยัง PixiJS Container จาก createC4Box()
  isExpanded: boolean;
  children: C4Component[];
}

/**
 * ComponentTree Class - จัดการ hierarchical C4 component data
 * และ sync กับ PixiJS nodes บน canvas
 */
export class ComponentTree {
  private components: Map<string, C4Component> = new Map();
  private treeContainer: HTMLElement;
  private nextId = 1;

  constructor(_pixiApp: Application) {
    this.treeContainer = this.createTreeContainer();
    this.setupSelectionSync();
  }

  /**
   * สร้าง HTML container สำหรับ tree
   */
  private createTreeContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'component-tree';
    container.setAttribute('role', 'tree');
    container.setAttribute('aria-label', 'C4 Component Hierarchy');

    // แสดง empty state เริ่มต้น
    this.showEmptyState(container);

    return container;
  }

  /**
   * Setup การ sync selection ระหว่าง tree และ PixiJS canvas
   */
  private setupSelectionSync(): void {
    // Listen for selection changes from PixiJS canvas
    window.addEventListener('pixi-selection-change', this.handlePixiSelectionChange);

    // Listen for selection manager deselect all events
    window.addEventListener('selection-cleared', this.handleSelectionCleared);

    // Listen for component name changes from PixiJS
    window.addEventListener('pixi-component-name-changed', this.handleComponentNameChange);
  }

  /**
   * เพิ่ม Component จาก PixiJS Node ที่มีอยู่แล้ว
   * @param pixiNode - PixiJS Container จาก createC4Box()
   */
  addComponentFromPixiNode(pixiNode: Container): void {
    // ใช้ metadata จาก pixiNode ตาม pattern ใน C4Box.ts
    const nodeData = (pixiNode as any).nodeData;
    if (!nodeData) {
      console.warn('PixiJS Node ไม่มี nodeData metadata');
      return;
    }

    const component: C4Component = {
      id: this.generateId(),
      name: nodeData.labelText || 'Unnamed Component',
      type: this.mapNodeTypeToC4Type(nodeData.nodeType),
      pixiNode: pixiNode,
      isExpanded: false,
      children: []
    };

    // เก็บ reference กลับไปใน pixiNode
    (pixiNode as any).treeComponent = component;

    // เพิ่มเข้าไปใน components map
    this.components.set(component.id, component);

    // อัปเดต tree display
    this.updateTreeDisplay();

    console.log('✅ Added component to tree:', component.name);
  }

  /**
   * Map node type จาก PixiJS metadata เป็น C4 type
   */
  private mapNodeTypeToC4Type(nodeType: string): 'person' | 'system' | 'container' | 'component' {
    switch (nodeType) {
      case 'person':
        return 'person';
      case 'system':
        return 'system';
      case 'container':
        return 'container';
      case 'component':
        return 'component';
      default:
        return 'person'; // default
    }
  }

  /**
   * Select component ใน tree และ sync กับ PixiJS
   */
  private selectComponent(component: C4Component): void {
    // Deselect ทุก tree nodes ก่อน
    this.clearAllTreeSelections();

    // Select tree node ที่ต้องการ
    const treeNode = this.treeContainer.querySelector(`[data-component-id="${component.id}"]`);
    if (treeNode) {
      treeNode.classList.add('selected');
      treeNode.setAttribute('aria-selected', 'true');
      
      // Scroll into view for better UX
      treeNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Sync กับ PixiJS selection ถ้ามี pixiNode
    if (component.pixiNode) {
      const selectableElement = (component.pixiNode as any).selectableElement as SelectableElement;
      if (selectableElement && !selectableElement.isSelected) {
        // Deselect ทุกอย่างใน PixiJS ก่อน
        selectionManager.deselectAll();
        // Select PixiJS node
        selectionManager.selectElement(selectableElement);
      }
    }

    console.log('🎯 Selected component in tree:', component.name);
  }

  /**
   * Deselect component ใน tree และ sync กับ PixiJS
   */
  private deselectComponent(component: C4Component): void {
    // Deselect tree node
    const treeNode = this.treeContainer.querySelector(`[data-component-id="${component.id}"]`);
    if (treeNode) {
      treeNode.classList.remove('selected');
      treeNode.setAttribute('aria-selected', 'false');
    }

    // Sync กับ PixiJS selection ถ้ามี pixiNode
    if (component.pixiNode) {
      const selectableElement = (component.pixiNode as any).selectableElement as SelectableElement;
      if (selectableElement && selectableElement.isSelected) {
        selectionManager.deselectElement(selectableElement);
      }
    }

    console.log('❌ Deselected component in tree:', component.name);
  }

  /**
   * Clear all tree selections without affecting PixiJS
   */
  private clearAllTreeSelections(): void {
    this.treeContainer.querySelectorAll('.tree-node').forEach(node => {
      node.classList.remove('selected');
      node.setAttribute('aria-selected', 'false');
    });
  }

  /**
   * Sync selection จาก PixiJS canvas มายัง tree
   */
  private syncSelectionFromPixi(pixiNode: Container): void {
    const treeComponent = (pixiNode as any).treeComponent as C4Component;
    if (treeComponent) {
      // Clear all tree selections first
      this.clearAllTreeSelections();

      // Select tree node ที่ตรงกับ PixiJS node
      const treeNode = this.treeContainer.querySelector(`[data-component-id="${treeComponent.id}"]`);
      if (treeNode) {
        treeNode.classList.add('selected');
        treeNode.setAttribute('aria-selected', 'true');
        treeNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        console.log('🔄 Synced selection from PixiJS to tree:', treeComponent.name);
      }
    }
  }

  /**
   * Sync deselection จาก PixiJS canvas มายัง tree
   */
  private syncDeselectionFromPixi(pixiNode: Container): void {
    const treeComponent = (pixiNode as any).treeComponent as C4Component;
    if (treeComponent) {
      // Deselect specific tree node
      const treeNode = this.treeContainer.querySelector(`[data-component-id="${treeComponent.id}"]`);
      if (treeNode) {
        treeNode.classList.remove('selected');
        treeNode.setAttribute('aria-selected', 'false');
        
        console.log('🔄 Synced deselection from PixiJS to tree:', treeComponent.name);
      }
    }
  }

  /**
   * อัปเดตการแสดงผล tree ทั้งหมด
   */
  private updateTreeDisplay(): void {
    // Clear container
    this.treeContainer.innerHTML = '';

    if (this.components.size === 0) {
      this.showEmptyState(this.treeContainer);
      return;
    }

    // สร้าง tree nodes
    const components = Array.from(this.components.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    components.forEach(component => {
      const nodeElement = this.createTreeNodeElement(component);
      this.treeContainer.appendChild(nodeElement);
    });
  }

  /**
   * สร้าง TreeNode element สำหรับ component
   */
  private createTreeNodeElement(component: C4Component): HTMLElement {
    const nodeElement = document.createElement('div');
    nodeElement.className = `tree-node ${component.type}`;
    nodeElement.setAttribute('role', 'treeitem');
    nodeElement.setAttribute('data-component-id', component.id);
    nodeElement.setAttribute('aria-selected', 'false');
    nodeElement.setAttribute('tabindex', '0');

    // สร้าง content
    nodeElement.innerHTML = `
      <div class="tree-node-content">
        <div class="tree-node-icon">
          ${this.getComponentIcon(component.type)}
        </div>
        <div class="tree-node-label" title="${component.name}">
          ${component.name}
        </div>
        ${component.pixiNode ? '<div class="connection-indicator" title="Connected to canvas"></div>' : '<div class="disconnected-indicator" title="Not connected to canvas"></div>'}
        <div class="selection-indicator"></div>
      </div>
    `;

    // เพิ่ม event listeners
    nodeElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleTreeNodeClick(component, nodeElement);
    });

    nodeElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleTreeNodeClick(component, nodeElement);
      }
    });

    // เพิ่ม hover effects
    nodeElement.addEventListener('mouseenter', () => {
      this.highlightCorrespondingPixiNode(component, true);
    });

    nodeElement.addEventListener('mouseleave', () => {
      this.highlightCorrespondingPixiNode(component, false);
    });

    return nodeElement;
  }

  /**
   * Handle tree node click with proper selection logic
   */
  private handleTreeNodeClick(component: C4Component, nodeElement: HTMLElement): void {
    const isCurrentlySelected = nodeElement.classList.contains('selected');
    
    if (isCurrentlySelected) {
      // Deselect if already selected
      this.deselectComponent(component);
    } else {
      // Select the component
      this.selectComponent(component);
    }
  }

  /**
   * Highlight corresponding PixiJS node when hovering over tree node
   */
  private highlightCorrespondingPixiNode(component: C4Component, highlight: boolean): void {
    if (component.pixiNode) {
      const boxGraphics = (component.pixiNode as any).boxGraphics;
      if (boxGraphics) {
        if (highlight) {
          // Add subtle highlight tint
          boxGraphics.tint = 0xE3F2FD; // Light blue tint
        } else {
          // Remove highlight tint (unless selected)
          const selectableElement = (component.pixiNode as any).selectableElement as SelectableElement;
          if (!selectableElement || !selectableElement.isSelected) {
            boxGraphics.tint = 0xFFFFFF; // White (normal)
          }
        }
      }
    }
  }

  /**
   * ได้ icon สำหรับ component type
   */
  private getComponentIcon(type: string): string {
    const iconMap = {
      person: '👤',
      system: '🏢',
      container: '📦',
      component: '⚙️'
    };
    return iconMap[type as keyof typeof iconMap] || '📋';
  }

  /**
   * แสดง empty state เมื่อไม่มี components
   */
  private showEmptyState(container: HTMLElement): void {
    container.innerHTML = `
      <div class="tree-empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">No Components</div>
        <div class="empty-description">Add C4 components to see them here</div>
      </div>
    `;
  }

  /**
   * Generate unique ID สำหรับ component ใหม่
   */
  private generateId(): string {
    return `component-${this.nextId++}`;
  }

  /**
   * ได้ HTML element ของ tree
   */
  getTreeElement(): HTMLElement {
    return this.treeContainer;
  }

  /**
   * ลบ component ออกจาก tree และ sync selection state
   */
  removeComponent(componentId: string): void {
    const component = this.components.get(componentId);
    if (component) {
      // ถ้า component ที่จะลบถูก select อยู่ ให้ deselect ก่อน
      if (component.pixiNode) {
        const selectableElement = (component.pixiNode as any).selectableElement as SelectableElement;
        if (selectableElement && selectableElement.isSelected) {
          selectionManager.deselectElement(selectableElement);
        }
        
        // ลบ reference ใน pixiNode
        delete (component.pixiNode as any).treeComponent;
      }
      
      this.components.delete(componentId);
      this.updateTreeDisplay();
      console.log('❌ Removed component from tree:', component.name);
    }
  }

  /**
   * ลบ component โดยใช้ PixiJS node reference
   */
  removeComponentByPixiNode(pixiNode: Container): void {
    const treeComponent = (pixiNode as any).treeComponent as C4Component;
    if (treeComponent) {
      this.removeComponent(treeComponent.id);
    }
  }

  /**
   * อัปเดต selection state consistency เมื่อมีการเปลี่ยนแปลง
   */
  updateSelectionConsistency(): void {
    // ตรวจสอบว่า selected elements ใน PixiJS ยังมีอยู่ใน tree หรือไม่
    const selectedElements = selectionManager.getSelectedElements();
    
    selectedElements.forEach(element => {
      const pixiNode = element.container;
      const treeComponent = (pixiNode as any).treeComponent as C4Component;
      
      if (!treeComponent || !this.components.has(treeComponent.id)) {
        // ถ้า component ไม่มีใน tree แล้ว ให้ deselect
        selectionManager.deselectElement(element);
      }
    });

    // ตรวจสอบ tree selections ว่ายังตรงกับ PixiJS หรือไม่
    this.treeContainer.querySelectorAll('.tree-node.selected').forEach(treeNode => {
      const componentId = treeNode.getAttribute('data-component-id');
      if (componentId) {
        const component = this.components.get(componentId);
        if (component && component.pixiNode) {
          const selectableElement = (component.pixiNode as any).selectableElement as SelectableElement;
          if (selectableElement && !selectableElement.isSelected) {
            // ถ้า PixiJS node ไม่ได้ถูก select แต่ tree node ถูก select ให้แก้ไข
            treeNode.classList.remove('selected');
            treeNode.setAttribute('aria-selected', 'false');
          }
        }
      }
    });
  }

  /**
   * ได้ components ทั้งหมด
   */
  getAllComponents(): C4Component[] {
    return Array.from(this.components.values());
  }

  /**
   * Get currently selected component
   */
  getSelectedComponent(): C4Component | null {
    const selectedNode = this.treeContainer.querySelector('.tree-node.selected');
    if (selectedNode) {
      const componentId = selectedNode.getAttribute('data-component-id');
      if (componentId) {
        return this.components.get(componentId) || null;
      }
    }
    return null;
  }

  /**
   * Check if a component is currently selected in the tree
   */
  isComponentSelected(componentId: string): boolean {
    const treeNode = this.treeContainer.querySelector(`[data-component-id="${componentId}"]`);
    return treeNode ? treeNode.classList.contains('selected') : false;
  }

  /**
   * Force refresh of all selection states
   */
  refreshSelectionStates(): void {
    this.components.forEach(component => {
      const treeNode = this.treeContainer.querySelector(`[data-component-id="${component.id}"]`);
      if (treeNode && component.pixiNode) {
        const selectableElement = (component.pixiNode as any).selectableElement as SelectableElement;
        const isPixiSelected = selectableElement ? selectableElement.isSelected : false;
        const isTreeSelected = treeNode.classList.contains('selected');

        // Sync tree selection with PixiJS selection
        if (isPixiSelected && !isTreeSelected) {
          treeNode.classList.add('selected');
          treeNode.setAttribute('aria-selected', 'true');
        } else if (!isPixiSelected && isTreeSelected) {
          treeNode.classList.remove('selected');
          treeNode.setAttribute('aria-selected', 'false');
        }
      }
    });
  }

  /**
   * Handle component name changes from PixiJS
   */
  updateComponentName(pixiNode: Container, newName: string): void {
    const treeComponent = (pixiNode as any).treeComponent as C4Component;
    if (treeComponent) {
      treeComponent.name = newName;
      
      // Update tree display
      const treeNode = this.treeContainer.querySelector(`[data-component-id="${treeComponent.id}"]`);
      if (treeNode) {
        const labelElement = treeNode.querySelector('.tree-node-label');
        if (labelElement) {
          labelElement.textContent = newName;
          labelElement.setAttribute('title', newName);
        }
      }
      
      console.log('📝 Updated component name in tree:', newName);
    }
  }

  /**
   * ทำความสะอาด ComponentTree
   */
  destroy(): void {
    // Remove event listeners
    window.removeEventListener('pixi-selection-change', this.handlePixiSelectionChange);
    window.removeEventListener('selection-cleared', this.handleSelectionCleared);
    window.removeEventListener('pixi-component-name-changed', this.handleComponentNameChange);

    // ลบ components ทั้งหมด
    this.components.clear();

    // ลบ HTML container
    if (this.treeContainer.parentNode) {
      this.treeContainer.parentNode.removeChild(this.treeContainer);
    }

    console.log('🗑️ ComponentTree destroyed');
  }

  /**
   * Event handler methods for proper cleanup
   */
  private handlePixiSelectionChange = (event: Event) => {
    const customEvent = event as CustomEvent;
    const selectedPixiNode = customEvent.detail?.container;
    const action = customEvent.detail?.action;
    
    if (selectedPixiNode) {
      if (action === 'select') {
        this.syncSelectionFromPixi(selectedPixiNode);
      } else if (action === 'deselect') {
        this.syncDeselectionFromPixi(selectedPixiNode);
      }
    }
  };

  private handleSelectionCleared = () => {
    this.clearAllTreeSelections();
  };

  private handleComponentNameChange = (event: Event) => {
    const customEvent = event as CustomEvent;
    const pixiNode = customEvent.detail?.container;
    const newName = customEvent.detail?.newName;
    
    if (pixiNode && newName) {
      this.updateComponentName(pixiNode, newName);
    }
  };
}