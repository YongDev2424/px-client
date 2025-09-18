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
    window.addEventListener('pixi-selection-change', (event: Event) => {
      const customEvent = event as CustomEvent;
      const selectedPixiNode = customEvent.detail?.container;
      if (selectedPixiNode && customEvent.detail?.action === 'select') {
        this.syncSelectionFromPixi(selectedPixiNode);
      }
    });
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
    this.treeContainer.querySelectorAll('.tree-node').forEach(node => {
      node.classList.remove('selected');
      node.setAttribute('aria-selected', 'false');
    });

    // Select tree node ที่ต้องการ
    const treeNode = this.treeContainer.querySelector(`[data-component-id="${component.id}"]`);
    if (treeNode) {
      treeNode.classList.add('selected');
      treeNode.setAttribute('aria-selected', 'true');
    }

    // Sync กับ PixiJS selection ถ้ามี pixiNode
    if (component.pixiNode) {
      const selectableElement = (component.pixiNode as any).selectableElement as SelectableElement;
      if (selectableElement) {
        // Deselect ทุกอย่างใน PixiJS ก่อน
        selectionManager.deselectAll();
        // Select PixiJS node
        selectionManager.selectElement(selectableElement);
      }
    }

    console.log('🎯 Selected component in tree:', component.name);
  }

  /**
   * Sync selection จาก PixiJS canvas มายัง tree
   */
  private syncSelectionFromPixi(pixiNode: Container): void {
    const treeComponent = (pixiNode as any).treeComponent as C4Component;
    if (treeComponent) {
      // Deselect ทุก tree nodes ก่อน
      this.treeContainer.querySelectorAll('.tree-node').forEach(node => {
        node.classList.remove('selected');
        node.setAttribute('aria-selected', 'false');
      });

      // Select tree node ที่ตรงกับ PixiJS node
      const treeNode = this.treeContainer.querySelector(`[data-component-id="${treeComponent.id}"]`);
      if (treeNode) {
        treeNode.classList.add('selected');
        treeNode.setAttribute('aria-selected', 'true');
        treeNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
        ${component.pixiNode ? '<div class="connection-indicator"></div>' : ''}
      </div>
    `;

    // เพิ่ม event listeners
    nodeElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectComponent(component);
    });

    nodeElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.selectComponent(component);
      }
    });

    return nodeElement;
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
   * ลบ component ออกจาก tree
   */
  removeComponent(componentId: string): void {
    const component = this.components.get(componentId);
    if (component) {
      this.components.delete(componentId);
      this.updateTreeDisplay();
      console.log('❌ Removed component from tree:', component.name);
    }
  }

  /**
   * ได้ components ทั้งหมด
   */
  getAllComponents(): C4Component[] {
    return Array.from(this.components.values());
  }

  /**
   * ทำความสะอาด ComponentTree
   */
  destroy(): void {
    // ลบ components ทั้งหมด
    this.components.clear();

    // ลบ HTML container
    if (this.treeContainer.parentNode) {
      this.treeContainer.parentNode.removeChild(this.treeContainer);
    }

    console.log('🗑️ ComponentTree destroyed');
  }
}