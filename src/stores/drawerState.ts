// src/stores/drawerState.ts

import { Container } from 'pixi.js';
import { createStore } from 'zustand/vanilla';
import type {
  DrawerAppearance,
  DrawerConfig,
  DrawerElementInfo,
  DrawerElementType,
  DrawerEvent,
  DrawerEventType,
  DrawerFilterCriteria,
  DrawerPosition,
  DrawerPreferences,
  DrawerSize,
  DrawerSortCriteria,
  DrawerState,
  DrawerTab
} from '../types/drawerTypes';
import {
  DEFAULT_DRAWER_CONFIG,
  DRAWER_BREAKPOINTS,
  DRAWER_SIZES,
  isValidDrawerPosition,
  isValidDrawerSize,
  isValidDrawerTab
} from '../types/drawerTypes';
import type { PropertyValue } from '../types/propertyTypes';

/**
 * Drawer State Store interface
 */
interface DrawerStateStore extends DrawerState {
  // === Core Actions ===
  openDrawer: (element: Container, elementType: DrawerElementType, elementId: string) => void;
  closeDrawer: () => void;
  toggleDrawer: (element?: Container, elementType?: DrawerElementType, elementId?: string) => void;
  
  // === Tab Management ===
  setActiveTab: (tab: DrawerTab) => void;
  nextTab: () => void;
  previousTab: () => void;
  
  // === Element Management ===
  setSelectedElement: (element: Container | null, elementType: DrawerElementType, elementId: string | null) => void;
  updateElementInfo: (info: Partial<DrawerElementInfo>) => void;
  
  // === Property Management ===
  setProperties: (properties: PropertyValue[]) => void;
  updateProperty: (property: PropertyValue) => void;
  selectProperty: (propertyId: string) => void;
  selectMultipleProperties: (propertyIds: string[]) => void;
  clearPropertySelection: () => void;
  togglePropertySelection: (propertyId: string) => void;
  
  // === Search & Filter ===
  setSearchQuery: (query: string) => void;
  applyFilter: (criteria: DrawerFilterCriteria) => void;
  clearFilter: () => void;
  
  // === Sorting ===
  setSortCriteria: (criteria: DrawerSortCriteria) => void;
  toggleSortDirection: () => void;
  
  // === Display Settings ===
  setPosition: (position: DrawerPosition) => void;
  setSize: (size: DrawerSize, customWidth?: number) => void;
  setWidth: (width: number) => void;
  toggleGroupByCategory: () => void;
  toggleShowEmptyProperties: () => void;
  expandCategory: (category: string) => void;
  collapseCategory: (category: string) => void;
  toggleCategory: (category: string) => void;
  expandAllCategories: () => void;
  collapseAllCategories: () => void;
  
  // === Appearance ===
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  updateAppearance: (appearance: Partial<DrawerAppearance>) => void;
  
  // === Animation ===
  startAnimation: (type: 'opening' | 'closing') => void;
  endAnimation: () => void;
  
  // === State Management ===
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  
  // === Responsive ===
  updateResponsiveState: (windowWidth: number) => void;
  toggleFullscreen: () => void;
  
  // === Persistence ===
  savePreferences: () => void;
  loadPreferences: () => void;
  resetToDefaults: () => void;
  
  // === Utilities ===
  getConfig: () => DrawerConfig;
  updateConfig: (config: Partial<DrawerConfig>) => void;
  destroy: () => void;
}

/**
 * Helper function to dispatch drawer events
 */
function dispatchDrawerEvent(type: DrawerEventType, data?: Partial<DrawerEvent>): void {
  const event: DrawerEvent = {
    type,
    timestamp: new Date(),
    ...data
  };
  
  const customEvent = new CustomEvent('drawer-event', { detail: event });
  window.dispatchEvent(customEvent);
  
  // Dispatch specific event type
  const specificEvent = new CustomEvent(type, { detail: event });
  window.dispatchEvent(specificEvent);
}

/**
 * Helper function to filter properties based on criteria
 */
function filterProperties(properties: PropertyValue[], criteria: DrawerFilterCriteria): PropertyValue[] {
  return properties.filter(property => {
    // Search query
    if (criteria.searchQuery) {
      const query = criteria.searchQuery.toLowerCase();
      const matchesKey = property.key.toLowerCase().includes(query);
      const matchesValue = String(property.value).toLowerCase().includes(query);
      const matchesDescription = property.metadata?.description?.toLowerCase().includes(query) || false;
      
      if (!matchesKey && !matchesValue && !matchesDescription) {
        return false;
      }
    }
    
    // Property types
    if (criteria.propertyTypes && criteria.propertyTypes.length > 0) {
      if (!criteria.propertyTypes.includes(property.type)) {
        return false;
      }
    }
    
    // Categories
    if (criteria.categories && criteria.categories.length > 0) {
      const category = property.metadata?.category || 'Basic Properties';
      if (!criteria.categories.includes(category)) {
        return false;
      }
    }
    
    // Has value
    if (criteria.hasValue !== undefined) {
      const hasValue = property.value !== null && property.value !== undefined && property.value !== '';
      if (criteria.hasValue !== hasValue) {
        return false;
      }
    }
    
    // Is required
    if (criteria.isRequired !== undefined) {
      const isRequired = property.metadata?.isRequired || false;
      if (criteria.isRequired !== isRequired) {
        return false;
      }
    }
    
    // Tags
    if (criteria.tags && criteria.tags.length > 0) {
      const propertyTags = property.metadata?.tags || [];
      const hasMatchingTag = criteria.tags.some(tag => propertyTags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Helper function to sort properties
 */
function sortProperties(properties: PropertyValue[], criteria: DrawerSortCriteria): PropertyValue[] {
  const sorted = [...properties].sort((a, b) => {
    let comparison = 0;
    
    switch (criteria.sortBy) {
      case 'key':
        comparison = a.key.localeCompare(b.key);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'order':
        comparison = a.order - b.order;
        break;
      case 'category':
        const aCat = a.metadata?.category || '';
        const bCat = b.metadata?.category || '';
        comparison = aCat.localeCompare(bCat);
        break;
      case 'value':
        comparison = String(a.value).localeCompare(String(b.value));
        break;
    }
    
    return criteria.direction === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
}

/**
 * Helper function to save preferences to localStorage
 */
function saveToLocalStorage(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

/**
 * Helper function to load preferences from localStorage
 */
function loadFromLocalStorage(key: string): any {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * Create initial drawer state
 */
function createInitialState(): DrawerState {
  return {
    // Core state
    isOpen: false,
    selectedElement: null,
    selectedElementType: null,
    selectedElementId: null,
    activeTab: DEFAULT_DRAWER_CONFIG.defaultTab,
    
    // Display settings
    position: DEFAULT_DRAWER_CONFIG.defaultPosition,
    size: DEFAULT_DRAWER_CONFIG.defaultSize,
    width: DEFAULT_DRAWER_CONFIG.defaultWidth,
    height: 0, // Will be set based on window height
    
    propertyDisplay: {
      groupByCategory: true,
      showEmptyProperties: false,
      expandedCategories: ['Basic Properties'],
      sortBy: 'order',
      sortDirection: 'asc',
      searchQuery: '',
      selectedPropertyIds: []
    },
    
    appearance: {
      theme: 'auto',
      showBackground: true,
      backgroundOpacity: 0.3,
      borderRadius: 8,
      shadow: true,
      animation: DEFAULT_DRAWER_CONFIG.animationEnabled,
      animationDuration: DEFAULT_DRAWER_CONFIG.animationDuration
    },
    
    // Animation
    animationState: 'idle',
    isAnimating: false,
    
    // Data
    elementInfo: null,
    properties: [],
    filteredProperties: [],
    selectedProperties: [],
    
    // UI state
    isLoading: false,
    error: null,
    hasUnsavedChanges: false,
    lastOpenedElementId: null,
    
    // Responsive
    isMobile: false,
    isTablet: false,
    isFullscreen: false
  };
}

/**
 * Drawer State Store implementation
 */
export const useDrawerState = createStore<DrawerStateStore>((set, get) => ({
  // Initial state
  ...createInitialState(),
  
  // === Core Actions ===
  openDrawer: (element: Container, elementType: DrawerElementType, elementId: string) => {
    const currentState = get();
    
    // Don't open if already open with same element
    if (currentState.isOpen && currentState.selectedElementId === elementId) {
      return;
    }
    
    set((state) => ({
      ...state,
      isOpen: true,
      selectedElement: element,
      selectedElementType: elementType,
      selectedElementId: elementId,
      lastOpenedElementId: elementId,
      animationState: 'opening',
      isAnimating: true,
      error: null
    }));
    
    // Start animation
    get().startAnimation('opening');
    
    // Dispatch event
    dispatchDrawerEvent('drawer-opened', {
      elementId,
      elementType
    });
    
    console.log('🗂️ เปิด Property Drawer สำหรับ:', elementType, elementId);
  },
  
  closeDrawer: () => {
    const currentState = get();
    
    if (!currentState.isOpen) {
      return;
    }
    
    set((state) => ({
      ...state,
      animationState: 'closing',
      isAnimating: true
    }));
    
    // Start closing animation
    get().startAnimation('closing');
    
    // Actually close after animation
    setTimeout(() => {
      set((state) => ({
        ...state,
        isOpen: false,
        selectedElement: null,
        selectedElementType: null,
        selectedElementId: null,
        animationState: 'idle',
        isAnimating: false,
        properties: [],
        filteredProperties: [],
        selectedProperties: [],
        elementInfo: null,
        hasUnsavedChanges: false,
        error: null
      }));
      
      // Clear property selection
      get().clearPropertySelection();
      
      // Dispatch event
      dispatchDrawerEvent('drawer-closed');
      
      console.log('❌ ปิด Property Drawer');
    }, currentState.appearance.animationDuration);
  },
  
  toggleDrawer: (element?: Container, elementType?: DrawerElementType, elementId?: string) => {
    const currentState = get();
    
    if (currentState.isOpen) {
      get().closeDrawer();
    } else if (element && elementType && elementId) {
      get().openDrawer(element, elementType, elementId);
    }
  },
  
  // === Tab Management ===
  setActiveTab: (tab: DrawerTab) => {
    if (!isValidDrawerTab(tab)) {
      console.warn('Invalid drawer tab:', tab);
      return;
    }
    
    set((state) => ({
      ...state,
      activeTab: tab
    }));
    
    dispatchDrawerEvent('drawer-tab-changed', { tab });
  },
  
  nextTab: () => {
    const tabs: DrawerTab[] = ['properties', 'details', 'actions', 'history'];
    const currentIndex = tabs.indexOf(get().activeTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    get().setActiveTab(tabs[nextIndex]);
  },
  
  previousTab: () => {
    const tabs: DrawerTab[] = ['properties', 'details', 'actions', 'history'];
    const currentIndex = tabs.indexOf(get().activeTab);
    const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    get().setActiveTab(tabs[prevIndex]);
  },
  
  // === Element Management ===
  setSelectedElement: (element: Container | null, elementType: DrawerElementType, elementId: string | null) => {
    set((state) => ({
      ...state,
      selectedElement: element,
      selectedElementType: elementType,
      selectedElementId: elementId
    }));
    
    if (elementId) {
      dispatchDrawerEvent('drawer-element-selected', {
        elementId,
        elementType
      });
    }
  },
  
  updateElementInfo: (info: Partial<DrawerElementInfo>) => {
    set((state) => ({
      ...state,
      elementInfo: state.elementInfo ? { ...state.elementInfo, ...info } : null
    }));
  },
  
  // === Property Management ===
  setProperties: (properties: PropertyValue[]) => {
    const currentState = get();
    
    // Apply current filter and sort
    const filterCriteria: DrawerFilterCriteria = {
      searchQuery: currentState.propertyDisplay.searchQuery
    };
    
    const sortCriteria: DrawerSortCriteria = {
      sortBy: currentState.propertyDisplay.sortBy,
      direction: currentState.propertyDisplay.sortDirection,
      groupByCategory: currentState.propertyDisplay.groupByCategory
    };
    
    let filteredProperties = filterProperties(properties, filterCriteria);
    filteredProperties = sortProperties(filteredProperties, sortCriteria);
    
    set((state) => ({
      ...state,
      properties,
      filteredProperties
    }));
  },
  
  updateProperty: (property: PropertyValue) => {
    set((state) => {
      const updatedProperties = state.properties.map(p => 
        p.id === property.id ? property : p
      );
      
      // Re-apply filter and sort
      const filterCriteria: DrawerFilterCriteria = {
        searchQuery: state.propertyDisplay.searchQuery
      };
      
      const sortCriteria: DrawerSortCriteria = {
        sortBy: state.propertyDisplay.sortBy,
        direction: state.propertyDisplay.sortDirection,
        groupByCategory: state.propertyDisplay.groupByCategory
      };
      
      let filteredProperties = filterProperties(updatedProperties, filterCriteria);
      filteredProperties = sortProperties(filteredProperties, sortCriteria);
      
      return {
        ...state,
        properties: updatedProperties,
        filteredProperties,
        hasUnsavedChanges: true
      };
    });
  },
  
  selectProperty: (propertyId: string) => {
    set((state) => {
      const selectedPropertyIds = [propertyId];
      const selectedProperties = state.properties.filter(p => selectedPropertyIds.includes(p.id));
      
      return {
        ...state,
        propertyDisplay: {
          ...state.propertyDisplay,
          selectedPropertyIds
        },
        selectedProperties
      };
    });
    
    dispatchDrawerEvent('drawer-property-selected', { propertyId });
  },
  
  selectMultipleProperties: (propertyIds: string[]) => {
    set((state) => {
      const selectedProperties = state.properties.filter(p => propertyIds.includes(p.id));
      
      return {
        ...state,
        propertyDisplay: {
          ...state.propertyDisplay,
          selectedPropertyIds: propertyIds
        },
        selectedProperties
      };
    });
  },
  
  clearPropertySelection: () => {
    set((state) => ({
      ...state,
      propertyDisplay: {
        ...state.propertyDisplay,
        selectedPropertyIds: []
      },
      selectedProperties: []
    }));
  },
  
  togglePropertySelection: (propertyId: string) => {
    const currentState = get();
    const isSelected = currentState.propertyDisplay.selectedPropertyIds.includes(propertyId);
    
    if (isSelected) {
      const newSelection = currentState.propertyDisplay.selectedPropertyIds.filter(id => id !== propertyId);
      get().selectMultipleProperties(newSelection);
    } else {
      const newSelection = [...currentState.propertyDisplay.selectedPropertyIds, propertyId];
      get().selectMultipleProperties(newSelection);
    }
  },
  
  // === Search & Filter ===
  setSearchQuery: (query: string) => {
    const currentState = get();
    
    set((state) => ({
      ...state,
      propertyDisplay: {
        ...state.propertyDisplay,
        searchQuery: query
      }
    }));
    
    // Re-apply filter
    const filterCriteria: DrawerFilterCriteria = { searchQuery: query };
    get().applyFilter(filterCriteria);
    
    dispatchDrawerEvent('drawer-search-changed', { searchQuery: query });
  },
  
  applyFilter: (criteria: DrawerFilterCriteria) => {
    const currentState = get();
    
    let filteredProperties = filterProperties(currentState.properties, criteria);
    
    // Apply current sort
    const sortCriteria: DrawerSortCriteria = {
      sortBy: currentState.propertyDisplay.sortBy,
      direction: currentState.propertyDisplay.sortDirection,
      groupByCategory: currentState.propertyDisplay.groupByCategory
    };
    
    filteredProperties = sortProperties(filteredProperties, sortCriteria);
    
    set((state) => ({
      ...state,
      filteredProperties
    }));
  },
  
  clearFilter: () => {
    set((state) => ({
      ...state,
      propertyDisplay: {
        ...state.propertyDisplay,
        searchQuery: ''
      },
      filteredProperties: state.properties
    }));
  },
  
  // === Sorting ===
  setSortCriteria: (criteria: DrawerSortCriteria) => {
    const currentState = get();
    
    set((state) => ({
      ...state,
      propertyDisplay: {
        ...state.propertyDisplay,
        sortBy: criteria.sortBy,
        sortDirection: criteria.direction,
        groupByCategory: criteria.groupByCategory ?? state.propertyDisplay.groupByCategory
      }
    }));
    
    // Re-apply sort
    const filteredProperties = sortProperties(currentState.filteredProperties, criteria);
    
    set((state) => ({
      ...state,
      filteredProperties
    }));
  },
  
  toggleSortDirection: () => {
    const currentState = get();
    const newDirection = currentState.propertyDisplay.sortDirection === 'asc' ? 'desc' : 'asc';
    
    get().setSortCriteria({
      sortBy: currentState.propertyDisplay.sortBy,
      direction: newDirection,
      groupByCategory: currentState.propertyDisplay.groupByCategory
    });
  },
  
  // === Display Settings ===
  setPosition: (position: DrawerPosition) => {
    if (!isValidDrawerPosition(position)) {
      console.warn('Invalid drawer position:', position);
      return;
    }
    
    set((state) => ({
      ...state,
      position
    }));
  },
  
  setSize: (size: DrawerSize, customWidth?: number) => {
    if (!isValidDrawerSize(size)) {
      console.warn('Invalid drawer size:', size);
      return;
    }
    
    let width = customWidth;
    
    if (!width) {
      switch (size) {
        case 'small':
          width = DRAWER_SIZES.SMALL;
          break;
        case 'medium':
          width = DRAWER_SIZES.MEDIUM;
          break;
        case 'large':
          width = DRAWER_SIZES.LARGE;
          break;
        case 'custom':
          width = get().width; // Keep current width
          break;
      }
    }
    
    set((state) => ({
      ...state,
      size,
      width: width!
    }));
    
    dispatchDrawerEvent('drawer-resize', {
      size: { width: width!, height: get().height }
    });
  },
  
  setWidth: (width: number) => {
    const config = DEFAULT_DRAWER_CONFIG;
    const clampedWidth = Math.max(config.minWidth, Math.min(config.maxWidth, width));
    
    set((state) => ({
      ...state,
      width: clampedWidth,
      size: 'custom'
    }));
    
    dispatchDrawerEvent('drawer-resize', {
      size: { width: clampedWidth, height: get().height }
    });
  },
  
  toggleGroupByCategory: () => {
    set((state) => ({
      ...state,
      propertyDisplay: {
        ...state.propertyDisplay,
        groupByCategory: !state.propertyDisplay.groupByCategory
      }
    }));
  },
  
  toggleShowEmptyProperties: () => {
    set((state) => ({
      ...state,
      propertyDisplay: {
        ...state.propertyDisplay,
        showEmptyProperties: !state.propertyDisplay.showEmptyProperties
      }
    }));
  },
  
  expandCategory: (category: string) => {
    set((state) => {
      const expandedCategories = [...state.propertyDisplay.expandedCategories];
      if (!expandedCategories.includes(category)) {
        expandedCategories.push(category);
      }
      
      return {
        ...state,
        propertyDisplay: {
          ...state.propertyDisplay,
          expandedCategories
        }
      };
    });
  },
  
  collapseCategory: (category: string) => {
    set((state) => ({
      ...state,
      propertyDisplay: {
        ...state.propertyDisplay,
        expandedCategories: state.propertyDisplay.expandedCategories.filter(c => c !== category)
      }
    }));
  },
  
  toggleCategory: (category: string) => {
    const currentState = get();
    const isExpanded = currentState.propertyDisplay.expandedCategories.includes(category);
    
    if (isExpanded) {
      get().collapseCategory(category);
    } else {
      get().expandCategory(category);
    }
  },
  
  expandAllCategories: () => {
    const currentState = get();
    const allCategories = Array.from(new Set(
      currentState.properties.map(p => p.metadata?.category || 'Basic Properties')
    ));
    
    set((state) => ({
      ...state,
      propertyDisplay: {
        ...state.propertyDisplay,
        expandedCategories: allCategories
      }
    }));
  },
  
  collapseAllCategories: () => {
    set((state) => ({
      ...state,
      propertyDisplay: {
        ...state.propertyDisplay,
        expandedCategories: []
      }
    }));
  },
  
  // === Appearance ===
  setTheme: (theme: 'light' | 'dark' | 'auto') => {
    set((state) => ({
      ...state,
      appearance: {
        ...state.appearance,
        theme
      }
    }));
  },
  
  updateAppearance: (appearance: Partial<DrawerAppearance>) => {
    set((state) => ({
      ...state,
      appearance: {
        ...state.appearance,
        ...appearance
      }
    }));
  },
  
  // === Animation ===
  startAnimation: (type: 'opening' | 'closing') => {
    set((state) => ({
      ...state,
      animationState: type,
      isAnimating: true
    }));
    
    dispatchDrawerEvent('drawer-animation-start');
    
    // End animation after duration
    setTimeout(() => {
      get().endAnimation();
    }, get().appearance.animationDuration);
  },
  
  endAnimation: () => {
    set((state) => ({
      ...state,
      animationState: 'idle',
      isAnimating: false
    }));
    
    dispatchDrawerEvent('drawer-animation-end');
  },
  
  // === State Management ===
  setLoading: (loading: boolean) => {
    set((state) => ({
      ...state,
      isLoading: loading
    }));
  },
  
  setError: (error: string | null) => {
    set((state) => ({
      ...state,
      error
    }));
  },
  
  setUnsavedChanges: (hasChanges: boolean) => {
    set((state) => ({
      ...state,
      hasUnsavedChanges: hasChanges
    }));
  },
  
  // === Responsive ===
  updateResponsiveState: (windowWidth: number) => {
    const isMobile = windowWidth < DRAWER_BREAKPOINTS.MOBILE;
    const isTablet = windowWidth >= DRAWER_BREAKPOINTS.MOBILE && windowWidth < DRAWER_BREAKPOINTS.TABLET;
    
    set((state) => ({
      ...state,
      isMobile,
      isTablet,
      width: isMobile ? windowWidth * 0.9 : state.width // Full width on mobile
    }));
  },
  
  toggleFullscreen: () => {
    set((state) => ({
      ...state,
      isFullscreen: !state.isFullscreen
    }));
  },
  
  // === Persistence ===
  savePreferences: () => {
    const currentState = get();
    const preferences: DrawerPreferences = {
      position: currentState.position,
      size: currentState.size,
      width: currentState.width,
      lastTab: currentState.activeTab,
      propertyDisplay: {
        groupByCategory: currentState.propertyDisplay.groupByCategory,
        showEmptyProperties: currentState.propertyDisplay.showEmptyProperties,
        sortBy: currentState.propertyDisplay.sortBy,
        sortDirection: currentState.propertyDisplay.sortDirection
      },
      appearance: currentState.appearance,
      keyboardShortcuts: DEFAULT_DRAWER_CONFIG.keyboardShortcuts
    };
    
    saveToLocalStorage('drawer-preferences', preferences);
  },
  
  loadPreferences: () => {
    const preferences = loadFromLocalStorage('drawer-preferences') as DrawerPreferences;
    
    if (preferences) {
      set((state) => ({
        ...state,
        position: preferences.position || state.position,
        size: preferences.size || state.size,
        width: preferences.width || state.width,
        activeTab: preferences.lastTab || state.activeTab,
        propertyDisplay: {
          ...state.propertyDisplay,
          ...preferences.propertyDisplay
        },
        appearance: {
          ...state.appearance,
          ...preferences.appearance
        }
      }));
    }
  },
  
  resetToDefaults: () => {
    set(createInitialState());
    localStorage.removeItem('drawer-preferences');
  },
  
  // === Utilities ===
  getConfig: () => DEFAULT_DRAWER_CONFIG,
  
  updateConfig: (config: Partial<DrawerConfig>) => {
    // Update local config if needed
    console.log('Updating drawer config:', config);
  },
  
  destroy: () => {
    // Clean up event listeners, timers, etc.
    set(createInitialState());
  }
}));

// Initialize responsive state on load
if (typeof window !== 'undefined') {
  useDrawerState.getState().updateResponsiveState(window.innerWidth);
  
  // Listen for resize events
  window.addEventListener('resize', () => {
    useDrawerState.getState().updateResponsiveState(window.innerWidth);
  });
  
  // Load preferences on initialization
  useDrawerState.getState().loadPreferences();
}

// Export convenience accessor
export const drawerState = useDrawerState.getState();