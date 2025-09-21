// src/stores/index.ts

/**
 * Export all stores และ utilities
 * สำหรับให้ import ได้สะดวกจากที่เดียว
 */

// Node State Store (Enhanced)
export {
  useNodeState,
  nodeStateManager,
  getNodeId,
  getContainerByNodeId,
  removeContainerMapping,
  type NodeState
} from './nodeState';

// Property State Store (NEW)
export {
  usePropertyState,
  propertyState,
  type PropertyValue,
  type PropertyValueType,
  type PropertyType,
  type PropertyMetadata,
  type PropertyValidationResult,
  type PropertyOperationResult,
  type BatchPropertyOperation,
  type PropertySearchCriteria,
  type PropertyChangeEvent,
  type PropertyHistoryEntry
} from './propertyState';

// Drawer State Store (NEW)
export {
  useDrawerState,
  drawerState,
  type DrawerState,
  type DrawerElementType,
  type DrawerTab,
  type DrawerPosition,
  type DrawerSize,
  type DrawerConfig,
  type DrawerPreferences,
  DEFAULT_DRAWER_CONFIG,
  DRAWER_SIZES,
  DRAWER_BREAKPOINTS
} from './drawerState';

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

// Toolbar State Store
export {
  useToolbarState,
  type ToolbarButtonState
} from './toolbarState';

/**
 * Initialize all stores (Enhanced)
 */
export function initializeStores(): void {
  // Initialize theme system
  initializeTheme();
  
  // Property state is initialized automatically
  console.log('🔧 Property state initialized');
  
  // Drawer state is initialized automatically
  console.log('🗂️ Drawer state initialized');
  
  console.log('✅ All stores initialized (Enhanced Property System)');
}

/**
 * Cleanup all stores (Enhanced)
 */
export function destroyStores(): void {
  // Clear node state
  useNodeState.getState().clearAllStates();
  
  // Clear property state
  usePropertyState.getState().clearAllProperties();
  
  // Clear drawer state
  useDrawerState.getState().destroy();
  
  // Clear selection state
  useSelectionState.getState().destroy();
  
  // Clear deletion state
  useDeletionState.getState().destroy();
  
  // Destroy theme
  destroyTheme();
  
  console.log('🗑️ All stores destroyed (Enhanced Property System)');
}

/**
 * Get system statistics
 */
export function getSystemStats() {
  const propertyStore = usePropertyState.getState();
  const drawerStore = useDrawerState.getState();
  const nodeStore = useNodeState.getState();
  
  return {
    properties: {
      totalElements: propertyStore.getAllElements().length,
      totalProperties: propertyStore.getTotalPropertyCount(),
      averagePropertiesPerElement: propertyStore.getAllElements().length > 0 
        ? propertyStore.getTotalPropertyCount() / propertyStore.getAllElements().length 
        : 0
    },
    drawer: {
      isOpen: drawerStore.isOpen,
      selectedElementType: drawerStore.selectedElementType,
      activeTab: drawerStore.activeTab,
      propertyCount: drawerStore.properties.length,
      filteredPropertyCount: drawerStore.filteredProperties.length
    },
    nodes: {
      totalNodes: nodeStore.getNodeCount(),
      totalNodeStates: nodeStore.getAllNodeIds().length
    }
  };
}