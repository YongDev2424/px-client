// src/test/functionBasedArchitecture.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Container, Application } from 'pixi.js';

// Import function-based modules
import {
  useNodeState,
  useSelectionState,
  useThemeState,
  initializeStores,
  destroyStores,
  makeSelectable,
  getNodeId
} from '../stores';

import {
  useNodeActions,
  useSelectionActions,
  useThemeActions
} from '../composables';

import {
  createZoomManager,
  createLayoutManager
} from '../factories';

describe('Function-based Architecture', () => {
  beforeEach(() => {
    // Initialize stores before each test
    initializeStores();
  });

  afterEach(() => {
    // Cleanup after each test
    destroyStores();
  });

  describe('Node State Management', () => {
    it('should create and manage node state functionally', () => {
      const container = new Container();
      const nodeActions = useNodeActions(container);
      
      // Initialize node state
      const initialState = nodeActions.initialize();
      expect(initialState).toBeDefined();
      expect(initialState.isCollapsed).toBe(false);
      expect(initialState.isEditing).toBe(false);
      
      // Test collapse functionality
      nodeActions.collapse();
      expect(nodeActions.isCollapsed()).toBe(true);
      
      // Test expand functionality
      nodeActions.expand();
      expect(nodeActions.isCollapsed()).toBe(false);
      
      // Test property management
      const property = {
        key: 'test-prop',
        value: 'test-value',
        type: 'text' as const,
        id: 'test-id',
        order: 1
      };
      
      expect(nodeActions.addProperty(property)).toBe(true);
      expect(nodeActions.hasProperty('test-prop')).toBe(true);
      expect(nodeActions.getProperties()).toHaveLength(1);
      
      // Test property update
      expect(nodeActions.updateProperty('test-prop', 'updated-value')).toBe(true);
      
      // Test property removal
      expect(nodeActions.removeProperty('test-prop')).toBe(true);
      expect(nodeActions.hasProperty('test-prop')).toBe(false);
    });

    it('should provide reactive state updates', () => {
      const container = new Container();
      const nodeActions = useNodeActions(container);
      const nodeId = getNodeId(container);
      
      // Initialize state
      nodeActions.initialize();
      
      // Test reactive state
      const store = useNodeState.getState();
      expect(store.hasNodeState(nodeId)).toBe(true);
      
      // Test state changes
      nodeActions.startEditing();
      expect(store.isEditing(nodeId)).toBe(true);
      
      nodeActions.stopEditing();
      expect(store.isEditing(nodeId)).toBe(false);
    });
  });

  describe('Selection State Management', () => {
    it('should manage selection functionally', () => {
      const container = new Container();
      const selectionActions = useSelectionActions();
      
      // Make container selectable
      const element = makeSelectable(container);
      expect(element).toBeDefined();
      expect(element.container).toBe(container);
      expect(element.isSelected).toBe(false);
      
      // Test selection
      selectionActions.select(element);
      expect(selectionActions.isSelected(element)).toBe(true);
      expect(selectionActions.getCount()).toBe(1);
      
      // Test deselection
      selectionActions.deselect(element);
      expect(selectionActions.isSelected(element)).toBe(false);
      expect(selectionActions.getCount()).toBe(0);
      
      // Test toggle
      selectionActions.toggle(element);
      expect(selectionActions.isSelected(element)).toBe(true);
      
      // Test clear all
      selectionActions.clear();
      expect(selectionActions.getCount()).toBe(0);
    });

    it('should handle multiple selections', () => {
      const container1 = new Container();
      const container2 = new Container();
      const selectionActions = useSelectionActions();
      
      const element1 = makeSelectable(container1);
      const element2 = makeSelectable(container2);
      
      // Select both
      selectionActions.select(element1);
      selectionActions.select(element2);
      
      expect(selectionActions.getCount()).toBe(2);
      expect(selectionActions.getSelected()).toHaveLength(2);
      
      // Clear all
      selectionActions.clear();
      expect(selectionActions.getCount()).toBe(0);
    });
  });

  describe('Theme State Management', () => {
    it('should manage theme state functionally', () => {
      const themeActions = useThemeActions();
      
      // Test initial state
      expect(themeActions.getCurrentThemeName()).toBe('Default Dark');
      expect(themeActions.isEnhanced()).toBe(false);
      
      // Test theme switching
      themeActions.useEnhancedTheme();
      expect(themeActions.isEnhanced()).toBe(true);
      
      themeActions.useDefaultTheme();
      expect(themeActions.isEnhanced()).toBe(false);
      
      // Test accessibility settings
      themeActions.enableHighContrast();
      expect(themeActions.isHighContrastEnabled()).toBe(true);
      
      themeActions.enableReducedMotion();
      expect(themeActions.isReducedMotionEnabled()).toBe(true);
      
      themeActions.enableLargeText();
      expect(themeActions.isLargeTextEnabled()).toBe(true);
      
      // Test reset
      themeActions.reset();
      expect(themeActions.isHighContrastEnabled()).toBe(false);
      expect(themeActions.isReducedMotionEnabled()).toBe(false);
      expect(themeActions.isLargeTextEnabled()).toBe(false);
    });

    it('should provide theme configuration', () => {
      const themeActions = useThemeActions();
      
      const availableThemes = themeActions.getAvailableThemes();
      expect(availableThemes).toHaveLength(2);
      expect(availableThemes.some(t => t.name === 'Default Dark')).toBe(true);
      expect(availableThemes.some(t => t.name === 'Enhanced Dark')).toBe(true);
    });
  });

  describe('Factory Functions', () => {
    it('should create ZoomManager instance', () => {
      const zoomManager = createZoomManager();
      
      expect(zoomManager).toBeDefined();
      expect(typeof zoomManager.initialize).toBe('function');
      expect(typeof zoomManager.getCurrentZoom).toBe('function');
      expect(typeof zoomManager.zoomToPoint).toBe('function');
      expect(typeof zoomManager.destroy).toBe('function');
      
      // Test initial state
      expect(zoomManager.getCurrentZoom()).toBe(1.0);
    });

    it('should create LayoutManager instance', () => {
      // Mock DOM elements for LayoutManager
      const mockElements = {
        'canvas-container': document.createElement('div'),
        'toolbar': document.createElement('div'),
        'expand-panel-btn': document.createElement('button')
      };

      // Add elements to DOM
      Object.entries(mockElements).forEach(([id, element]) => {
        element.id = id;
        document.body.appendChild(element);
      });

      try {
        const layoutManager = createLayoutManager();
        
        expect(layoutManager).toBeDefined();
        expect(typeof layoutManager.getCanvasArea).toBe('function');
        expect(typeof layoutManager.toggleLeftPanel).toBe('function');
        expect(typeof layoutManager.getLayoutState).toBe('function');
        expect(typeof layoutManager.destroy).toBe('function');
        
        // Test canvas area calculation
        const canvasArea = layoutManager.getCanvasArea();
        expect(canvasArea).toHaveProperty('width');
        expect(canvasArea).toHaveProperty('height');
        expect(canvasArea).toHaveProperty('x');
        expect(canvasArea).toHaveProperty('y');
        
        // Cleanup
        layoutManager.destroy();
      } finally {
        // Remove mock elements
        Object.values(mockElements).forEach(element => {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });
      }
    });
  });

  describe('Integration Tests', () => {
    it('should work together seamlessly', () => {
      const container = new Container();
      
      // Create instances
      const nodeActions = useNodeActions(container);
      const selectionActions = useSelectionActions();
      const themeActions = useThemeActions();
      
      // Initialize node
      nodeActions.initialize();
      const element = makeSelectable(container);
      
      // Test interaction
      selectionActions.select(element);
      nodeActions.startEditing();
      themeActions.useEnhancedTheme();
      
      // Verify states
      expect(selectionActions.isSelected(element)).toBe(true);
      expect(nodeActions.isEditing()).toBe(true);
      expect(themeActions.isEnhanced()).toBe(true);
      
      // Cleanup
      selectionActions.clear();
      nodeActions.stopEditing();
      themeActions.reset();
      
      // Verify cleanup
      expect(selectionActions.getCount()).toBe(0);
      expect(nodeActions.isEditing()).toBe(false);
      expect(themeActions.isEnhanced()).toBe(false);
    });

    it('should maintain consistency across stores', () => {
      const container1 = new Container();
      const container2 = new Container();
      
      const nodeActions1 = useNodeActions(container1);
      const nodeActions2 = useNodeActions(container2);
      const selectionActions = useSelectionActions();
      
      // Initialize nodes
      nodeActions1.initialize();
      nodeActions2.initialize();
      
      // Make them selectable
      const element1 = makeSelectable(container1);
      const element2 = makeSelectable(container2);
      
      // Start editing on both
      nodeActions1.startEditing();
      nodeActions2.startEditing();
      
      // Only the last one should be in editing mode (exitAllEditingModes logic)
      expect(nodeActions1.isEditing()).toBe(false);
      expect(nodeActions2.isEditing()).toBe(true);
      
      // Select both
      selectionActions.select(element1);
      selectionActions.select(element2);
      expect(selectionActions.getCount()).toBe(2);
      
      // Clear selection
      selectionActions.clear();
      expect(selectionActions.getCount()).toBe(0);
    });
  });
});