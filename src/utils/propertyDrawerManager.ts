// src/utils/propertyDrawerManager.ts

import { Application, Container, FederatedPointerEvent } from 'pixi.js';
import { PropertyDrawer } from '../components/PropertyDrawer';
import { useDrawerActions, usePropertyActions } from '../composables';

/**
 * Property Drawer Manager (Function-Based)
 * 
 * สร้างแบบ factory function ตาม Function-Based Architecture
 * จัดการ PropertyDrawer singleton และ lifecycle
 * ออกแบบตาม Laws of UX: Jakob's Law (familiar patterns), Doherty Threshold (< 400ms)
 */

export interface PropertyDrawerManagerOptions {
  /** PixiJS Application instance */
  app: Application;
  /** Auto-close เมื่อคลิกข้างนอก */
  autoClose: boolean;
  /** เปิดใช้ keyboard shortcuts */
  enableKeyboardShortcuts: boolean;
  /** Custom CSS selectors สำหรับ auto-close detection */
  excludeSelectors?: string[];
}

export interface DrawerState {
  isOpen: boolean;
  currentElementId: string | null;
  currentElementType: 'node' | 'edge' | null;
  currentTab: string;
  drawer: PropertyDrawer | null;
}

/**
 * สร้าง Property Drawer Manager แบบ function-based
 * ใช้ closure เพื่อเก็บ state และ manage lifecycle
 * 
 * @param options - ตัวเลือกการตั้งค่า drawer manager
 * @returns Object ที่มี methods สำหรับการจัดการ drawer
 */
export function createPropertyDrawerManager(
  options: PropertyDrawerManagerOptions
) {
  const { app, autoClose = true, enableKeyboardShortcuts = true, excludeSelectors = [] } = options;

  // State management ด้วย closure (Function-based pattern)
  const state: DrawerState = {
    isOpen: false,
    currentElementId: null,
    currentElementType: null,
    currentTab: 'properties',
    drawer: null
  };

  // Initialize drawer actions
  const drawerActions = useDrawerActions();

  /**
   * สร้างหรือรับ PropertyDrawer instance (lazy initialization)
   */
  const getOrCreateDrawer = (): PropertyDrawer => {
    if (!state.drawer) {
      console.log('🗂️ Creating PropertyDrawer instance');
      state.drawer = new PropertyDrawer();
      
      // เพิ่ม drawer เข้า stage
      app.stage.addChild(state.drawer);
      
      // Setup drawer event listeners
      setupDrawerEventListeners();
    }
    return state.drawer;
  };

  /**
   * เปิด drawer สำหรับ Node
   */
  const openForNode = (
    container: Container,
    nodeId: string,
    options: {
      tab?: string;
      nodeName?: string;
      autoFocus?: boolean;
    } = {}
  ): void => {
    console.log('🎯 Opening Property Drawer for Node:', nodeId);
    
    const drawer = getOrCreateDrawer();
    const { tab = 'properties', nodeName = 'Unnamed Node', autoFocus = false } = options;

    // อัพเดท state
    state.isOpen = true;
    state.currentElementId = nodeId;
    state.currentElementType = 'node';
    state.currentTab = tab;

    // ใช้ drawerActions เพื่อเปิด drawer
    drawerActions.openForNode(container, nodeId, {
      tab,
      nodeName,
      autoFocus
    });

    // Setup global event listeners
    if (autoClose) {
      setupAutoCloseListeners();
    }

    if (enableKeyboardShortcuts) {
      setupKeyboardShortcuts();
    }

    // Emit event
    const event = new CustomEvent('property-drawer-opened', {
      detail: { elementId: nodeId, elementType: 'node', tab }
    });
    window.dispatchEvent(event);
  };

  /**
   * เปิด drawer สำหรับ Edge
   */
  const openForEdge = (
    container: Container,
    edgeId: string,
    options: {
      tab?: string;
      edgeName?: string;
      autoFocus?: boolean;
    } = {}
  ): void => {
    console.log('🎯 Opening Property Drawer for Edge:', edgeId);
    
    const drawer = getOrCreateDrawer();
    const { tab = 'properties', edgeName = 'Unnamed Edge', autoFocus = false } = options;

    // อัพเดท state
    state.isOpen = true;
    state.currentElementId = edgeId;
    state.currentElementType = 'edge';
    state.currentTab = tab;

    // ใช้ drawerActions เพื่อเปิด drawer
    drawerActions.openForEdge(container, edgeId, {
      tab,
      edgeName,
      autoFocus
    });

    // Setup global event listeners
    if (autoClose) {
      setupAutoCloseListeners();
    }

    if (enableKeyboardShortcuts) {
      setupKeyboardShortcuts();
    }

    // Emit event
    const event = new CustomEvent('property-drawer-opened', {
      detail: { elementId: edgeId, elementType: 'edge', tab }
    });
    window.dispatchEvent(event);
  };

  /**
   * ปิด drawer
   */
  const close = (): void => {
    if (!state.isOpen) return;

    console.log('🗂️ Closing Property Drawer');
    
    // ใช้ drawerActions เพื่อปิด drawer
    drawerActions.close();

    // อัพเดท state
    const previousElementId = state.currentElementId;
    const previousElementType = state.currentElementType;
    
    state.isOpen = false;
    state.currentElementId = null;
    state.currentElementType = null;

    // Cleanup global event listeners
    cleanupGlobalListeners();

    // Emit event
    const event = new CustomEvent('property-drawer-closed', {
      detail: { elementId: previousElementId, elementType: previousElementType }
    });
    window.dispatchEvent(event);
  };

  /**
   * Toggle drawer (เปิด/ปิด)
   */
  const toggle = (): void => {
    if (state.isOpen) {
      close();
    } else {
      console.warn('Cannot toggle drawer - no element specified');
    }
  };

  /**
   * เปลี่ยน tab ใน drawer
   */
  const setTab = (tab: string): void => {
    if (!state.isOpen) return;

    state.currentTab = tab;
    drawerActions.setTab(tab);
  };

  /**
   * ตรวจสอบสถานะ drawer
   */
  const isOpen = (): boolean => state.isOpen;
  const getCurrentElement = () => ({
    id: state.currentElementId,
    type: state.currentElementType
  });
  const getCurrentTab = (): string => state.currentTab;

  /**
   * Setup drawer event listeners
   */
  const setupDrawerEventListeners = (): void => {
    if (!state.drawer) return;

    // Listen for drawer close events
    window.addEventListener('drawer-close-requested', handleDrawerCloseRequest);
    window.addEventListener('drawer-tab-changed', handleTabChange);
  };

  /**
   * Setup auto-close listeners (คลิกข้างนอก drawer)
   */
  const setupAutoCloseListeners = (): void => {
    // Click outside to close
    document.addEventListener('click', handleOutsideClick, true);
    
    // PixiJS stage click to close
    app.stage.on('pointerdown', handleStageClick);
  };

  /**
   * Setup keyboard shortcuts
   */
  const setupKeyboardShortcuts = (): void => {
    document.addEventListener('keydown', handleKeyboardShortcut);
  };

  /**
   * Cleanup global event listeners
   */
  const cleanupGlobalListeners = (): void => {
    document.removeEventListener('click', handleOutsideClick, true);
    document.removeEventListener('keydown', handleKeyboardShortcut);
    app.stage.off('pointerdown', handleStageClick);
  };

  /**
   * Event Handlers
   */
  const handleDrawerCloseRequest = (event: CustomEvent): void => {
    close();
  };

  const handleTabChange = (event: CustomEvent): void => {
    const { tab } = event.detail;
    state.currentTab = tab;
  };

  const handleOutsideClick = (event: MouseEvent): void => {
    if (!state.isOpen || !state.drawer) return;

    const target = event.target as HTMLElement;
    
    // ตรวจสอบว่าคลิกข้างนอก drawer หรือไม่
    const drawerElement = state.drawer.canvas || state.drawer;
    
    // Skip ถ้าคลิกใน excluded selectors
    for (const selector of excludeSelectors) {
      if (target.closest(selector)) {
        return;
      }
    }

    // ปิด drawer ถ้าคลิกข้างนอก
    if (!drawerElement.contains || !drawerElement.contains(target)) {
      close();
    }
  };

  const handleStageClick = (event: FederatedPointerEvent): void => {
    // ปิด drawer เมื่อคลิกบน stage (พื้นที่ว่าง)
    const target = event.target;
    
    // ตรวจสอบว่าคลิกบน stage จริงๆ (ไม่ใช่ elements)
    if (target === app.stage) {
      close();
    }
  };

  const handleKeyboardShortcut = (event: KeyboardEvent): void => {
    if (!state.isOpen) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        close();
        break;
        
      case '1':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          setTab('properties');
        }
        break;
        
      case '2':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          setTab('details');
        }
        break;
        
      case '3':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          setTab('actions');
        }
        break;
        
      case '4':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          setTab('history');
        }
        break;
    }
  };

  /**
   * Cleanup และ destroy
   */
  const destroy = (): void => {
    console.log('🗑️ Destroying PropertyDrawerManager');
    
    // ปิด drawer ก่อน
    close();
    
    // Cleanup event listeners
    cleanupGlobalListeners();
    window.removeEventListener('drawer-close-requested', handleDrawerCloseRequest);
    window.removeEventListener('drawer-tab-changed', handleTabChange);
    
    // Destroy drawer instance
    if (state.drawer) {
      state.drawer.destroy();
      state.drawer = null;
    }
    
    // Reset state
    state.isOpen = false;
    state.currentElementId = null;
    state.currentElementType = null;
  };

  /**
   * Get performance metrics
   */
  const getMetrics = () => ({
    isOpen: state.isOpen,
    currentElement: getCurrentElement(),
    currentTab: state.currentTab,
    hasDrawerInstance: !!state.drawer
  });

  // Return public API
  return {
    // Core methods
    openForNode,
    openForEdge,
    close,
    toggle,
    setTab,
    
    // State methods
    isOpen,
    getCurrentElement,
    getCurrentTab,
    
    // Lifecycle methods
    destroy,
    getMetrics
  };
}

/**
 * Global instance สำหรับการใช้งานทั่วไป
 * ใช้ lazy initialization pattern
 */
let globalPropertyDrawerManager: ReturnType<typeof createPropertyDrawerManager> | null = null;

/**
 * Get หรือสร้าง global PropertyDrawerManager instance
 */
export function getGlobalPropertyDrawerManager(
  app?: Application,
  options?: Partial<PropertyDrawerManagerOptions>
): ReturnType<typeof createPropertyDrawerManager> | null {
  
  if (!globalPropertyDrawerManager && app) {
    console.log('🌍 Creating global PropertyDrawerManager instance');
    globalPropertyDrawerManager = createPropertyDrawerManager({
      app,
      autoClose: true,
      enableKeyboardShortcuts: true,
      ...options
    });
  }
  
  return globalPropertyDrawerManager;
}

/**
 * Destroy global instance
 */
export function destroyGlobalPropertyDrawerManager(): void {
  if (globalPropertyDrawerManager) {
    globalPropertyDrawerManager.destroy();
    globalPropertyDrawerManager = null;
  }
}

/**
 * Helper functions สำหรับการใช้งานง่าย ๆ
 */
export function openPropertyDrawerForNode(
  app: Application,
  container: Container,
  nodeId: string,
  options?: { tab?: string; nodeName?: string; autoFocus?: boolean }
): void {
  const manager = getGlobalPropertyDrawerManager(app);
  if (manager) {
    manager.openForNode(container, nodeId, options);
  }
}

export function openPropertyDrawerForEdge(
  app: Application,
  container: Container,
  edgeId: string,
  options?: { tab?: string; edgeName?: string; autoFocus?: boolean }
): void {
  const manager = getGlobalPropertyDrawerManager(app);
  if (manager) {
    manager.openForEdge(container, edgeId, options);
  }
}

export function closePropertyDrawer(): void {
  if (globalPropertyDrawerManager) {
    globalPropertyDrawerManager.close();
  }
}

/**
 * Constants สำหรับ UX best practices
 */
export const DRAWER_CONSTANTS = {
  /** Animation duration (Doherty Threshold compliant) */
  ANIMATION_DURATION: 300,
  
  /** Keyboard shortcut response time */
  KEYBOARD_RESPONSE_TIME: 100,
  
  /** Auto-close delay */
  AUTO_CLOSE_DELAY: 150,
  
  /** Tab switch animation */
  TAB_SWITCH_DURATION: 200
} as const;