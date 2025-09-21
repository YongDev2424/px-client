// src/composables/index.ts

/**
 * Export all composable functions และ custom hooks
 * สำหรับให้ import ได้สะดวกจากที่เดียว
 */

// Node Actions (Enhanced)
export {
  useNodeActions,
  useNodeBatchActions,
  useNodeStateReactive
} from './useNodeActions';

// Property Actions (NEW)
export {
  usePropertyActions,
  useGlobalPropertyActions
} from './usePropertyActions';

// Drawer Actions (NEW)
export {
  useDrawerActions,
  useDrawerKeyboardShortcuts
} from './useDrawerActions';

// Selection Actions  
export {
  useSelectionActions,
  useContainerSelection,
  useSelectionStateReactive,
  useMultiSelectionActions
} from './useSelectionActions';

// Theme Actions
export {
  useThemeActions,
  useThemeStateReactive,
  useThemePresets
} from './useThemeActions';

// Deletion Actions
export {
  useDeletionActions
} from './useDeletionActions';

// Enhanced Type exports
export type { NodeState } from '../stores/nodeState';
export type { SelectableElement } from '../stores/selectionState';
export type { ThemeConfig, AccessibilitySettings } from '../stores/themeState';

// Property Types (NEW)
export type {
  PropertyValue,
  PropertyValueType,
  PropertyType,
  PropertyMetadata,
  PropertyValidationResult,
  PropertyOperationResult,
  PropertySearchCriteria
} from '../types/propertyTypes';

// Drawer Types (NEW)
export type {
  DrawerState,
  DrawerElementType,
  DrawerTab,
  DrawerPosition,
  DrawerSize,
  DrawerConfig
} from '../types/drawerTypes';