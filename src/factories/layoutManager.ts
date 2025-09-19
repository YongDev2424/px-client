// src/factories/layoutManager.ts

import { LeftPanel } from '../components/LeftPanel';
import type { PanelState } from '../components/LeftPanel';

/**
 * Interface definitions for layout management
 */
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

/**
 * LayoutManager instance interface
 */
export interface LayoutManagerInstance {
  // Panel Management
  toggleLeftPanel: () => void;
  setPanelWidth: (widthInPixels: number) => void;
  
  // Layout Information
  getCanvasArea: () => CanvasArea;
  getLayoutState: () => LayoutState;
  isLeftPanelCollapsed: () => boolean;
  getLeftPanelWidth: () => number;
  
  // Cleanup
  destroy: () => void;
}

/**
 * Factory function สำหรับสร้าง LayoutManager instance
 * @returns LayoutManager instance ใหม่
 */
export function createLayoutManager(): LayoutManagerInstance {
  // Private state
  let canvasContainer: HTMLElement;
  let toolbar: HTMLElement;
  let expandBtn: HTMLElement;
  let leftPanel: LeftPanel;
  
  const state: LayoutState = {
    leftPanelCollapsed: false,
    leftPanelWidth: 20, // percentage
    toolbarHeight: 5, // percentage
  };

  // Constants
  const MIN_PANEL_WIDTH = 200; // pixels
  const MIN_TOOLBAR_HEIGHT = 48; // pixels
  const TRANSITION_DURATION = 300; // milliseconds

  // Event handler references for cleanup
  let resizeHandler: (() => void) | null = null;
  let expandBtnHandler: (() => void) | null = null;

  // Private helper functions
  const getElement = (id: string): HTMLElement => {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Required element with id '${id}' not found`);
    }
    return element;
  };

  const initializeElements = (): void => {
    canvasContainer = getElement('canvas-container');
    toolbar = getElement('toolbar');
    expandBtn = getElement('expand-panel-btn');
  };

  const initializeLeftPanel = (): void => {
    leftPanel = new LeftPanel();
    
    // Listen to panel state changes
    leftPanel.onStateChanged((panelState: PanelState) => {
      state.leftPanelCollapsed = panelState.isCollapsed;
      state.leftPanelWidth = panelState.width;
      
      // Update canvas size after panel change
      setTimeout(() => {
        notifyCanvasResize();
      }, TRANSITION_DURATION);
    });
  };

  const setupEventListeners = (): void => {
    // Expand button functionality (when panel is collapsed)
    expandBtnHandler = () => {
      leftPanel.expand();
    };
    expandBtn.addEventListener('click', expandBtnHandler);

    // Window resize handler with debouncing
    let resizeTimeout: number;
    resizeHandler = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        handleWindowResize();
      }, 100);
    };
    window.addEventListener('resize', resizeHandler);
  };

  const handleWindowResize = (): void => {
    // Check for boundary violations and fix them
    enforceLayoutBoundaries();
    
    // Notify canvas of size change
    notifyCanvasResize();
  };

  const enforceLayoutBoundaries = (): void => {
    if (state.leftPanelCollapsed) return;

    const windowWidth = window.innerWidth;
    const currentPanelWidth = (state.leftPanelWidth / 100) * windowWidth;

    // Check if panel is too wide for current window
    if (currentPanelWidth > windowWidth * 0.4) {
      leftPanel.setWidth(windowWidth * 0.3);
    }

    // Check if panel is too narrow
    if (currentPanelWidth < MIN_PANEL_WIDTH) {
      leftPanel.setWidth(MIN_PANEL_WIDTH);
    }

    // Ensure toolbar has minimum height
    const toolbarHeight = toolbar.offsetHeight;
    if (toolbarHeight < MIN_TOOLBAR_HEIGHT) {
      document.documentElement.style.setProperty(
        '--toolbar-min-height', 
        `${MIN_TOOLBAR_HEIGHT}px`
      );
    }
  };

  const notifyCanvasResize = (): void => {
    // Dispatch custom event for canvas resize
    const canvasArea = getCanvasArea();
    const event = new CustomEvent('layout-canvas-resize', {
      detail: canvasArea
    });
    window.dispatchEvent(event);
  };

  const getCanvasArea = (): CanvasArea => {
    if (!canvasContainer) {
      return { width: window.innerWidth, height: window.innerHeight, x: 0, y: 0 };
    }

    const rect = canvasContainer.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      x: rect.left,
      y: rect.top
    };
  };

  // Initialize the layout manager
  const initialize = (): void => {
    try {
      initializeElements();
      initializeLeftPanel();
      setupEventListeners();
      console.log('✅ LayoutManager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize LayoutManager:', error);
      throw error;
    }
  };

  // Initialize immediately
  initialize();

  // Return LayoutManager instance
  return {
    // === Panel Management ===
    toggleLeftPanel: () => {
      leftPanel.toggle();
    },

    setPanelWidth: (widthInPixels: number) => {
      leftPanel.setWidth(widthInPixels);
    },

    // === Layout Information ===
    getCanvasArea,

    getLayoutState: () => {
      return { ...state };
    },

    isLeftPanelCollapsed: () => {
      return state.leftPanelCollapsed;
    },

    getLeftPanelWidth: () => {
      return state.leftPanelWidth;
    },

    // === Cleanup ===
    destroy: () => {
      // Cleanup event listeners
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
      }
      
      if (expandBtnHandler && expandBtn) {
        expandBtn.removeEventListener('click', expandBtnHandler);
        expandBtnHandler = null;
      }

      // Cleanup left panel
      if (leftPanel) {
        leftPanel.destroy();
      }

      console.log('🗑️ LayoutManager destroyed');
    }
  };
}

/**
 * Singleton wrapper สำหรับ backward compatibility
 */
let singletonInstance: LayoutManagerInstance | null = null;

export const LayoutManager = {
  getInstance: (): LayoutManagerInstance => {
    if (!singletonInstance) {
      singletonInstance = createLayoutManager();
    }
    return singletonInstance;
  }
};