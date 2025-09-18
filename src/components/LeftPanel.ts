// src/components/LeftPanel.ts
import { ComponentTree } from './ComponentTree';
import { Application } from 'pixi.js';

export interface PanelState {
  isCollapsed: boolean;
  width: number;
  isResizing: boolean;
}

export class LeftPanel {
  private panel!: HTMLElement;
  private content!: HTMLElement;
  private toggleBtn!: HTMLElement;
  private expandBtn!: HTMLElement;
  private resizeHandle!: HTMLElement;
  private title!: HTMLElement;
  private componentTree?: ComponentTree;

  private state: PanelState = {
    isCollapsed: false,
    width: 20, // percentage
    isResizing: false
  };

  private readonly MIN_WIDTH = 200; // pixels
  private readonly MAX_WIDTH = 400; // pixels

  private onStateChange?: (state: PanelState) => void;

  constructor(panelId: string = 'left-panel', pixiApp?: Application) {
    this.initializeElements(panelId);
    this.setupEventListeners();
    this.loadPanelState();
    
    // Initialize ComponentTree if PixiJS app is provided
    if (pixiApp) {
      this.initializeComponentTree(pixiApp);
    }
  }

  private initializeElements(panelId: string): void {
    this.panel = this.getElement(panelId);
    this.content = this.getElement('panel-content', this.panel);
    this.toggleBtn = this.getElement('toggle-panel-btn', this.panel);
    this.expandBtn = this.getElement('expand-panel-btn'); // Global element, not inside panel
    this.resizeHandle = this.getElement('resize-handle', this.panel);
    this.title = this.getElement('panel-title', this.panel);
  }

  private getElement(id: string, parent?: HTMLElement): HTMLElement {
    const element = parent 
      ? parent.querySelector(`#${id}`) as HTMLElement || parent.querySelector(`.${id}`) as HTMLElement
      : document.getElementById(id);
    
    if (!element) {
      console.warn(`Element with id/class '${id}' not found`);
      // For expand button, create it if it doesn't exist
      if (id === 'expand-panel-btn') {
        return this.createExpandButton();
      }
      throw new Error(`Required element with id/class '${id}' not found`);
    }
    return element;
  }

  /**
   * Create expand button if it doesn't exist in HTML
   */
  private createExpandButton(): HTMLElement {
    const expandBtn = document.createElement('button');
    expandBtn.id = 'expand-panel-btn';
    expandBtn.className = 'expand-btn';
    expandBtn.setAttribute('aria-label', 'Expand left panel');
    expandBtn.innerHTML = '<span class="expand-icon">›</span>';
    
    // Add to body
    document.body.appendChild(expandBtn);
    
    console.log('✅ Created expand button dynamically');
    return expandBtn;
  }

  private setupEventListeners(): void {
    // Toggle button functionality (inside panel)
    this.toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔄 Toggle button clicked');
      this.toggle();
    });

    // Expand button functionality (outside panel, shown when collapsed)
    this.expandBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔄 Expand button clicked');
      this.expand();
    });

    // Resize handle functionality
    this.setupResizeHandle();

    // Keyboard accessibility
    this.setupKeyboardNavigation();
  }

  private setupResizeHandle(): void {
    let startX = 0;
    let startWidth = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (this.state.isCollapsed) return;
      
      this.state.isResizing = true;
      startX = e.clientX;
      startWidth = this.panel.offsetWidth;
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!this.state.isResizing) return;
      
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(
        this.MIN_WIDTH, 
        Math.min(this.MAX_WIDTH, startWidth + deltaX)
      );
      
      this.setWidth(newWidth);
    };

    const handleMouseUp = () => {
      this.state.isResizing = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      this.savePanelState();
      this.notifyStateChange();
    };

    this.resizeHandle.addEventListener('mousedown', handleMouseDown);

    // Touch support for mobile
    this.resizeHandle.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      handleMouseDown({ clientX: touch.clientX, preventDefault: () => e.preventDefault() } as MouseEvent);
    });
  }

  private setupKeyboardNavigation(): void {
    // Toggle with keyboard shortcut (Ctrl/Cmd + B)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        this.toggle();
      }
    });

    // Focus management
    this.toggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  public toggle(): void {
    this.state.isCollapsed = !this.state.isCollapsed;
    this.applyCollapseState();
  }

  /**
   * Apply collapse state to DOM elements
   */
  private applyCollapseState(): void {
    const appContainer = document.getElementById('app-container');
    if (!appContainer) return;

    if (this.state.isCollapsed) {
      appContainer.classList.add('panel-collapsed');
      this.panel.setAttribute('aria-hidden', 'true');
      this.expandBtn.style.display = 'flex';
    } else {
      appContainer.classList.remove('panel-collapsed');
      this.panel.setAttribute('aria-hidden', 'false');
      this.expandBtn.style.display = 'none';
    }

    // Update toggle button icon and aria-label
    this.updateToggleButton();

    // Save state and notify
    this.savePanelState();
    this.notifyStateChange();

    // Announce to screen readers
    this.announceStateChange();

    // Dispatch canvas resize event
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('layout-canvas-resize'));
    }, 300); // Wait for CSS transition
  }

  public collapse(): void {
    console.log('📁 Collapse called, current state:', this.state.isCollapsed);
    if (!this.state.isCollapsed) {
      this.state.isCollapsed = true;
      this.applyCollapseState();
      console.log('✅ Panel collapsed');
    } else {
      console.log('⚠️ Panel already collapsed');
    }
  }

  public expand(): void {
    console.log('📂 Expand called, current state:', this.state.isCollapsed);
    if (this.state.isCollapsed) {
      this.state.isCollapsed = false;
      this.applyCollapseState();
      console.log('✅ Panel expanded');
    } else {
      console.log('⚠️ Panel already expanded');
    }
  }

  public setWidth(widthInPixels: number): void {
    const clampedWidth = Math.max(
      this.MIN_WIDTH,
      Math.min(this.MAX_WIDTH, widthInPixels)
    );

    const percentage = (clampedWidth / window.innerWidth) * 100;
    this.state.width = percentage;

    document.documentElement.style.setProperty(
      '--left-panel-width', 
      `${percentage}%`
    );

    this.notifyStateChange();
  }

  public getState(): PanelState {
    return { ...this.state };
  }

  public isCollapsed(): boolean {
    return this.state.isCollapsed;
  }

  public getWidth(): number {
    return this.state.width;
  }

  public setTitle(title: string): void {
    this.title.textContent = title;
  }

  public setContent(content: HTMLElement | string): void {
    if (typeof content === 'string') {
      this.content.innerHTML = content;
    } else {
      this.content.innerHTML = '';
      this.content.appendChild(content);
    }
  }

  public onStateChanged(callback: (state: PanelState) => void): void {
    this.onStateChange = callback;
  }

  private updateToggleButton(): void {
    const icon = this.toggleBtn.querySelector('.toggle-icon');
    if (icon) {
      icon.textContent = this.state.isCollapsed ? '›' : '‹';
    }

    this.toggleBtn.setAttribute(
      'aria-label', 
      this.state.isCollapsed ? 'Expand left panel' : 'Collapse left panel'
    );
  }

  private announceStateChange(): void {
    const message = this.state.isCollapsed 
      ? 'Left panel collapsed' 
      : 'Left panel expanded';
    
    // Create temporary element for screen reader announcement
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }

    // Dispatch custom event
    const event = new CustomEvent('panel-state-change', {
      detail: this.getState()
    });
    window.dispatchEvent(event);
  }

  private savePanelState(): void {
    try {
      const stateToSave = {
        isCollapsed: this.state.isCollapsed,
        width: this.state.width
      };
      sessionStorage.setItem('left-panel-state', JSON.stringify(stateToSave));
      console.log('💾 Left Panel state saved:', stateToSave);
    } catch (error) {
      console.warn('Failed to save left panel state:', error);
    }
  }

  private loadPanelState(): void {
    try {
      const saved = sessionStorage.getItem('left-panel-state');
      if (saved) {
        const savedState = JSON.parse(saved);
        this.state.isCollapsed = savedState.isCollapsed || false;
        this.state.width = savedState.width || 20;
        
        this.applyState();
        console.log('📂 Left Panel state loaded:', savedState);
      } else {
        console.log('📂 No saved left panel state found, using defaults');
      }
    } catch (error) {
      console.warn('Failed to load left panel state:', error);
    }
  }

  private applyState(): void {
    const appContainer = document.getElementById('app-container');
    if (!appContainer) return;

    // Apply collapsed state
    if (this.state.isCollapsed) {
      appContainer.classList.add('panel-collapsed');
      this.panel.setAttribute('aria-hidden', 'true');
      this.expandBtn.style.display = 'flex';
    } else {
      appContainer.classList.remove('panel-collapsed');
      this.panel.setAttribute('aria-hidden', 'false');
      this.expandBtn.style.display = 'none';
    }

    // Apply width
    if (!this.state.isCollapsed) {
      document.documentElement.style.setProperty(
        '--left-panel-width', 
        `${this.state.width}%`
      );
    }

    // Update toggle button
    this.updateToggleButton();
  }

  /**
   * Initialize ComponentTree system
   * @param pixiApp - PixiJS Application instance
   */
  private initializeComponentTree(pixiApp: Application): void {
    this.componentTree = new ComponentTree(pixiApp);

    // Set tree as panel content
    this.setContent(this.componentTree.getTreeElement());
    this.setTitle('Components');

    // Load ComponentTree CSS
    this.loadComponentTreeStyles();
  }

  /**
   * Load CSS styles for ComponentTree
   */
  private loadComponentTreeStyles(): void {
    // ComponentTree styles are included in main style.css
    console.log('📄 ComponentTree styles loaded from main CSS');
  }

  /**
   * Get ComponentTree instance
   * @returns ComponentTree instance or undefined
   */
  public getComponentTree(): ComponentTree | undefined {
    return this.componentTree;
  }

  /**
   * Add a component to the tree from PixiJS node
   * @param pixiNode - PixiJS Container from createC4Box()
   */
  public addComponentFromPixiNode(pixiNode: any): void {
    if (this.componentTree) {
      this.componentTree.addComponentFromPixiNode(pixiNode);
    }
  }

  /**
   * Remove a component from the tree
   * @param componentId - ID of component to remove
   */
  public removeComponent(componentId: string): void {
    if (this.componentTree) {
      this.componentTree.removeComponent(componentId);
    }
  }

  public destroy(): void {
    // Cleanup ComponentTree
    if (this.componentTree) {
      this.componentTree.destroy();
      this.componentTree = undefined;
    }

    // ComponentTree styles are in main CSS, no need to remove

    // Cleanup event listeners if needed
    // This would be called when the component is destroyed
  }
}