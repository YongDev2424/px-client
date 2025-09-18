// src/layout/LayoutManager.ts
import { LeftPanel } from '../components/LeftPanel';
import type { PanelState } from '../components/LeftPanel';

export interface CanvasArea {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface LayoutState {
  leftPanelCollapsed: boolean;
  leftPanelWidth: number;
  toolbarHeight: number;
}

export class LayoutManager {
  private static instance: LayoutManager;
  private canvasContainer!: HTMLElement;
  private toolbar!: HTMLElement;
  private expandBtn!: HTMLElement;
  private leftPanel!: LeftPanel;
  
  private state: LayoutState = {
    leftPanelCollapsed: false,
    leftPanelWidth: 20, // percentage
    toolbarHeight: 5, // percentage
  };

  private readonly MIN_PANEL_WIDTH = 200; // pixels
  private readonly MIN_TOOLBAR_HEIGHT = 48; // pixels
  private readonly TRANSITION_DURATION = 300; // milliseconds

  private constructor() {
    this.initializeElements();
    this.initializeLeftPanel();
    this.setupEventListeners();
  }

  public static getInstance(): LayoutManager {
    if (!LayoutManager.instance) {
      LayoutManager.instance = new LayoutManager();
    }
    return LayoutManager.instance;
  }

  private initializeElements(): void {
    this.canvasContainer = this.getElement('canvas-container');
    this.toolbar = this.getElement('toolbar');
    this.expandBtn = this.getElement('expand-panel-btn');
  }

  private initializeLeftPanel(): void {
    this.leftPanel = new LeftPanel();
    
    // Listen to panel state changes
    this.leftPanel.onStateChanged((panelState: PanelState) => {
      this.state.leftPanelCollapsed = panelState.isCollapsed;
      this.state.leftPanelWidth = panelState.width;
      
      // Update canvas size after panel change
      setTimeout(() => {
        this.notifyCanvasResize();
      }, this.TRANSITION_DURATION);
    });
  }

  private getElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Required element with id '${id}' not found`);
    }
    return element;
  }

  private setupEventListeners(): void {
    // Expand button functionality (when panel is collapsed)
    this.expandBtn.addEventListener('click', () => {
      this.leftPanel.expand();
    });

    // Window resize handler with debouncing
    let resizeTimeout: number;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        this.handleWindowResize();
      }, 100);
    });
  }

  public toggleLeftPanel(): void {
    this.leftPanel.toggle();
  }

  public setPanelWidth(widthInPixels: number): void {
    this.leftPanel.setWidth(widthInPixels);
  }

  public getCanvasArea(): CanvasArea {
    if (!this.canvasContainer) {
      return { width: window.innerWidth, height: window.innerHeight, x: 0, y: 0 };
    }

    const rect = this.canvasContainer.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      x: rect.left,
      y: rect.top
    };
  }

  private handleWindowResize(): void {
    // Check for boundary violations and fix them
    this.enforceLayoutBoundaries();
    
    // Notify canvas of size change
    this.notifyCanvasResize();
  }

  private enforceLayoutBoundaries(): void {
    if (this.state.leftPanelCollapsed) return;

    const windowWidth = window.innerWidth;
    const currentPanelWidth = (this.state.leftPanelWidth / 100) * windowWidth;

    // Check if panel is too wide for current window
    if (currentPanelWidth > windowWidth * 0.4) {
      this.setPanelWidth(windowWidth * 0.3);
    }

    // Check if panel is too narrow
    if (currentPanelWidth < this.MIN_PANEL_WIDTH) {
      this.setPanelWidth(this.MIN_PANEL_WIDTH);
    }

    // Ensure toolbar has minimum height
    const toolbarHeight = this.toolbar.offsetHeight;
    if (toolbarHeight < this.MIN_TOOLBAR_HEIGHT) {
      document.documentElement.style.setProperty(
        '--toolbar-min-height', 
        `${this.MIN_TOOLBAR_HEIGHT}px`
      );
    }
  }

  private notifyCanvasResize(): void {
    // Dispatch custom event for canvas resize
    const canvasArea = this.getCanvasArea();
    const event = new CustomEvent('layout-canvas-resize', {
      detail: canvasArea
    });
    window.dispatchEvent(event);
  }

  public getLayoutState(): LayoutState {
    return { ...this.state };
  }

  public isLeftPanelCollapsed(): boolean {
    return this.state.leftPanelCollapsed;
  }

  public getLeftPanelWidth(): number {
    return this.state.leftPanelWidth;
  }



  public destroy(): void {
    // Cleanup event listeners if needed
    window.removeEventListener('resize', this.handleWindowResize);
    if (this.leftPanel) {
      this.leftPanel.destroy();
    }
  }
}