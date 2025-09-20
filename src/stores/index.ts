// src/stores/index.ts

/**
 * Export all stores และ utilities
 * สำหรับให้ import ได้สะดวกจากที่เดียว
 */

// Node State Store
export {
  useNodeState,
  nodeStateManager,
  getNodeId,
  getContainerByNodeId,
  removeContainerMapping,
  type PropertyValue,
  type NodeState
} from './nodeState';

// Selection State Store
export {
  useSelectionState,
  selectionManager,
  makeSelectable,
  removeSelectable,
  type SelectableElement
} from './selectionState';

// Theme State Store
export {
  useThemeState,
  themeManager,
  initializeTheme,
  destroyTheme,
  type ThemeConfig,
  type AccessibilitySettings
} from './themeState';

// Deletion State Store
export {
  useDeletionState,
  deletionManager,
  type DeletionRecord,
  type DeletionStateStore
} from './deletionState';

/**
 * Initialize all stores
 */
export function initializeStores(): void {
  // Initialize theme system
  initializeTheme();
  
  console.log('✅ All stores initialized');
}

/**
 * Cleanup all stores
 */
export function destroyStores(): void {
  // Clear node state
  useNodeState.getState().clearAllStates();
  
  // Clear selection state
  useSelectionState.getState().destroy();
  
  // Clear deletion state
  useDeletionState.getState().destroy();
  
  // Destroy theme
  destroyTheme();
  
  console.log('🗑️ All stores destroyed');
}