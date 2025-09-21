// src/types/drawerTypes.ts

import { Container } from 'pixi.js';
import type { PropertyValue } from './propertyTypes';

/**
 * Drawer Type Definitions
 * สำหรับ Property Drawer UI State Management
 */

/**
 * Element types ที่รองรับใน drawer
 */
export type DrawerElementType = 'node' | 'edge' | null;

/**
 * Drawer tabs ที่มีอยู่
 */
export type DrawerTab = 'properties' | 'details' | 'actions' | 'history';

/**
 * Drawer position บนหน้าจอ
 */
export type DrawerPosition = 'right' | 'left';

/**
 * Drawer animation states
 */
export type DrawerAnimationState = 'idle' | 'opening' | 'closing';

/**
 * Drawer size presets
 */
export type DrawerSize = 'small' | 'medium' | 'large' | 'custom';

/**
 * การแสดงผล properties ใน drawer
 */
export interface DrawerPropertyDisplay {
  groupByCategory: boolean;
  showEmptyProperties: boolean;
  expandedCategories: string[];
  sortBy: 'key' | 'type' | 'order' | 'category' | 'value';
  sortDirection: 'asc' | 'desc';
  searchQuery: string;
  selectedPropertyIds: string[];
}

/**
 * การตั้งค่า drawer appearance
 */
export interface DrawerAppearance {
  theme: 'light' | 'dark' | 'auto';
  showBackground: boolean;
  backgroundOpacity: number;
  borderRadius: number;
  shadow: boolean;
  animation: boolean;
  animationDuration: number;
}

/**
 * Element info ที่แสดงใน drawer
 */
export interface DrawerElementInfo {
  id: string;
  name?: string;
  type: DrawerElementType;
  description?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Drawer UI state
 */
export interface DrawerState {
  // === Core State ===
  isOpen: boolean;
  selectedElement: Container | null;
  selectedElementType: DrawerElementType;
  selectedElementId: string | null;
  activeTab: DrawerTab;
  
  // === Display Settings ===
  position: DrawerPosition;
  size: DrawerSize;
  width: number;
  height: number;
  propertyDisplay: DrawerPropertyDisplay;
  appearance: DrawerAppearance;
  
  // === Animation ===
  animationState: DrawerAnimationState;
  isAnimating: boolean;
  
  // === Data ===
  elementInfo: DrawerElementInfo | null;
  properties: PropertyValue[];
  filteredProperties: PropertyValue[];
  selectedProperties: PropertyValue[];
  
  // === UI State ===
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  lastOpenedElementId: string | null;
  
  // === Responsive ===
  isMobile: boolean;
  isTablet: boolean;
  isFullscreen: boolean;
}

/**
 * Drawer event types
 */
export type DrawerEventType = 
  | 'drawer-opened'
  | 'drawer-closed'
  | 'drawer-tab-changed'
  | 'drawer-element-selected'
  | 'drawer-property-selected'
  | 'drawer-search-changed'
  | 'drawer-resize'
  | 'drawer-animation-start'
  | 'drawer-animation-end';

/**
 * Drawer event data
 */
export interface DrawerEvent {
  type: DrawerEventType;
  elementId?: string;
  elementType?: DrawerElementType;
  tab?: DrawerTab;
  propertyId?: string;
  searchQuery?: string;
  size?: { width: number; height: number };
  timestamp: Date;
}

/**
 * Drawer keyboard shortcuts
 */
export interface DrawerKeyboardShortcuts {
  toggleDrawer: string[];        // ['Escape', 'Ctrl+D']
  nextTab: string[];            // ['Tab']
  previousTab: string[];        // ['Shift+Tab']
  focusSearch: string[];        // ['Ctrl+F', '/']
  selectAll: string[];          // ['Ctrl+A']
  clearSelection: string[];     // ['Escape']
  save: string[];              // ['Ctrl+S']
}

/**
 * Drawer action result
 */
export interface DrawerActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Drawer filter criteria
 */
export interface DrawerFilterCriteria {
  searchQuery?: string;
  propertyTypes?: string[];
  categories?: string[];
  hasValue?: boolean;
  isRequired?: boolean;
  tags?: string[];
}

/**
 * Drawer sort criteria
 */
export interface DrawerSortCriteria {
  sortBy: 'key' | 'type' | 'order' | 'category' | 'value';
  direction: 'asc' | 'desc';
  groupByCategory?: boolean;
}

/**
 * Drawer export options
 */
export interface DrawerExportOptions {
  format: 'json' | 'csv' | 'yaml';
  includeMetadata: boolean;
  includeEmptyProperties: boolean;
  selectedPropertiesOnly: boolean;
}

/**
 * Drawer import options
 */
export interface DrawerImportOptions {
  format: 'json' | 'csv' | 'yaml';
  mergeStrategy: 'replace' | 'merge' | 'skip';
  validateBeforeImport: boolean;
}

/**
 * Drawer configuration
 */
export interface DrawerConfig {
  defaultPosition: DrawerPosition;
  defaultSize: DrawerSize;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  defaultTab: DrawerTab;
  enableKeyboardShortcuts: boolean;
  keyboardShortcuts: DrawerKeyboardShortcuts;
  autoSave: boolean;
  autoSaveInterval: number; // milliseconds
  rememberLastState: boolean;
  enableSearch: boolean;
  enableGrouping: boolean;
  enableSorting: boolean;
  enableExport: boolean;
  enableImport: boolean;
  animationEnabled: boolean;
  animationDuration: number;
  showTooltips: boolean;
  responsiveBreakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

/**
 * Drawer responsive breakpoints
 */
export const DRAWER_BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200
} as const;

/**
 * Drawer size presets
 */
export const DRAWER_SIZES = {
  SMALL: 280,
  MEDIUM: 320,
  LARGE: 400,
  EXTRA_LARGE: 480
} as const;

/**
 * Default drawer configuration
 */
export const DEFAULT_DRAWER_CONFIG: DrawerConfig = {
  defaultPosition: 'right',
  defaultSize: 'medium',
  defaultWidth: DRAWER_SIZES.MEDIUM,
  minWidth: DRAWER_SIZES.SMALL,
  maxWidth: DRAWER_SIZES.EXTRA_LARGE,
  defaultTab: 'properties',
  enableKeyboardShortcuts: true,
  keyboardShortcuts: {
    toggleDrawer: ['Escape'],
    nextTab: ['Tab'],
    previousTab: ['Shift+Tab'],
    focusSearch: ['Ctrl+F', '/'],
    selectAll: ['Ctrl+A'],
    clearSelection: ['Escape'],
    save: ['Ctrl+S']
  },
  autoSave: true,
  autoSaveInterval: 5000,
  rememberLastState: true,
  enableSearch: true,
  enableGrouping: true,
  enableSorting: true,
  enableExport: true,
  enableImport: true,
  animationEnabled: true,
  animationDuration: 300,
  showTooltips: true,
  responsiveBreakpoints: {
    mobile: DRAWER_BREAKPOINTS.MOBILE,
    tablet: DRAWER_BREAKPOINTS.TABLET,
    desktop: DRAWER_BREAKPOINTS.DESKTOP
  }
};

/**
 * Drawer property group
 */
export interface DrawerPropertyGroup {
  category: string;
  displayName: string;
  properties: PropertyValue[];
  isExpanded: boolean;
  isCollapsible: boolean;
  count: number;
  icon?: string;
  description?: string;
}

/**
 * Drawer search result
 */
export interface DrawerSearchResult {
  property: PropertyValue;
  matchType: 'key' | 'value' | 'description' | 'tag';
  highlightStart: number;
  highlightEnd: number;
  score: number;
}

/**
 * Drawer history entry
 */
export interface DrawerHistoryEntry {
  id: string;
  timestamp: Date;
  action: string;
  description: string;
  elementId: string;
  propertyKey?: string;
  oldValue?: any;
  newValue?: any;
}

/**
 * Drawer validation state
 */
export interface DrawerValidationState {
  isValid: boolean;
  errors: Array<{
    propertyKey: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    propertyKey: string;
    message: string;
  }>;
}

/**
 * Drawer preferences (saved to localStorage)
 */
export interface DrawerPreferences {
  position: DrawerPosition;
  size: DrawerSize;
  width: number;
  lastTab: DrawerTab;
  propertyDisplay: Partial<DrawerPropertyDisplay>;
  appearance: Partial<DrawerAppearance>;
  keyboardShortcuts: Partial<DrawerKeyboardShortcuts>;
}

/**
 * Type guards for drawer types
 */

export function isValidDrawerTab(tab: string): tab is DrawerTab {
  return ['properties', 'details', 'actions', 'history'].includes(tab);
}

export function isValidDrawerPosition(position: string): position is DrawerPosition {
  return ['right', 'left'].includes(position);
}

export function isValidDrawerSize(size: string): size is DrawerSize {
  return ['small', 'medium', 'large', 'custom'].includes(size);
}

export function isValidElementType(type: string | null): type is DrawerElementType {
  return type !== null && ['node', 'edge'].includes(type);
}