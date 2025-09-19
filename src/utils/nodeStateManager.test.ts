// src/utils/nodeStateManager.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from 'pixi.js';
import { nodeStateManager, PropertyValue, NodeState } from './nodeStateManager';

describe('NodeStateManager', () => {
  let testNode1: Container;
  let testNode2: Container;

  beforeEach(() => {
    // สร้าง test nodes ใหม่สำหรับแต่ละ test
    testNode1 = new Container();
    testNode2 = new Container();
    
    // ล้างสถานะทั้งหมดก่อนเริ่ม test แต่ละตัว
    nodeStateManager.clearAllStates();
    
    // Mock window.dispatchEvent
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
  });

  describe('Node State Initialization', () => {
    it('should initialize node state with default values', () => {
      const state = nodeStateManager.initializeNodeState(testNode1);
      
      expect(state).toBeDefined();
      expect(state.isCollapsed).toBe(false);
      expect(state.isEditing).toBe(false);
      expect(state.properties).toBeInstanceOf(Map);
      expect(state.properties.size).toBe(0);
      expect(state.actionButtonsVisible).toBe(false);
    });

    it('should initialize node state with custom initial values', () => {
      const initialState: Partial<NodeState> = {
        isCollapsed: true,
        actionButtonsVisible: true
      };
      
      const state = nodeStateManager.initializeNodeState(testNode1, initialState);
      
      expect(state.isCollapsed).toBe(true);
      expect(state.isEditing).toBe(false); // default value
      expect(state.actionButtonsVisible).toBe(true);
    });

    it('should return existing state if node already has state', () => {
      const state1 = nodeStateManager.initializeNodeState(testNode1);
      const state2 = nodeStateManager.initializeNodeState(testNode1);
      
      expect(state1).toBe(state2);
    });

    it('should check if node has state', () => {
      expect(nodeStateManager.hasNodeState(testNode1)).toBe(false);
      
      nodeStateManager.initializeNodeState(testNode1);
      
      expect(nodeStateManager.hasNodeState(testNode1)).toBe(true);
    });

    it('should get node state', () => {
      expect(nodeStateManager.getNodeState(testNode1)).toBeNull();
      
      const state = nodeStateManager.initializeNodeState(testNode1);
      
      expect(nodeStateManager.getNodeState(testNode1)).toBe(state);
    });
  });

  describe('Collapse/Expand State Management', () => {
    beforeEach(() => {
      nodeStateManager.initializeNodeState(testNode1);
    });

    it('should set collapsed state', () => {
      const result = nodeStateManager.setCollapsed(testNode1, true);
      
      expect(result).toBe(true);
      expect(nodeStateManager.isCollapsed(testNode1)).toBe(true);
    });

    it('should return false when setting collapsed state for non-existent node', () => {
      const result = nodeStateManager.setCollapsed(testNode2, true);
      
      expect(result).toBe(false);
    });

    it('should toggle collapse state', () => {
      // Initially expanded (false)
      expect(nodeStateManager.isCollapsed(testNode1)).toBe(false);
      
      // Toggle to collapsed
      const result1 = nodeStateManager.toggleCollapse(testNode1);
      expect(result1).toBe(true);
      expect(nodeStateManager.isCollapsed(testNode1)).toBe(true);
      
      // Toggle back to expanded
      const result2 = nodeStateManager.toggleCollapse(testNode1);
      expect(result2).toBe(false);
      expect(nodeStateManager.isCollapsed(testNode1)).toBe(false);
    });

    it('should return null when toggling collapse for non-existent node', () => {
      const result = nodeStateManager.toggleCollapse(testNode2);
      
      expect(result).toBeNull();
    });

    it('should dispatch event when collapse state changes', () => {
      nodeStateManager.setCollapsed(testNode1, true);
      
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'node-state-changed',
          detail: expect.objectContaining({
            node: testNode1,
            changeType: 'collapse',
            isCollapsed: true,
            previousState: false
          })
        })
      );
    });

    it('should not dispatch event when setting same collapse state', () => {
      vi.clearAllMocks();
      
      // Set to false (already false by default)
      nodeStateManager.setCollapsed(testNode1, false);
      
      expect(window.dispatchEvent).not.toHaveBeenCalled();
    });
  });

  describe('Editing State Management', () => {
    beforeEach(() => {
      nodeStateManager.initializeNodeState(testNode1);
      nodeStateManager.initializeNodeState(testNode2);
    });

    it('should set editing state', () => {
      const result = nodeStateManager.setEditing(testNode1, true);
      
      expect(result).toBe(true);
      expect(nodeStateManager.isEditing(testNode1)).toBe(true);
    });

    it('should return false when setting editing state for non-existent node', () => {
      const testNode3 = new Container();
      const result = nodeStateManager.setEditing(testNode3, true);
      
      expect(result).toBe(false);
    });

    it('should exit editing mode for other nodes when starting editing', () => {
      // Set both nodes to editing
      nodeStateManager.setEditing(testNode1, true);
      nodeStateManager.setEditing(testNode2, true);
      
      // testNode1 should exit editing, testNode2 should remain editing
      expect(nodeStateManager.isEditing(testNode1)).toBe(false);
      expect(nodeStateManager.isEditing(testNode2)).toBe(true);
    });

    it('should exit all editing modes', () => {
      nodeStateManager.setEditing(testNode1, true);
      nodeStateManager.setEditing(testNode2, true);
      
      nodeStateManager.exitAllEditingModes();
      
      expect(nodeStateManager.isEditing(testNode1)).toBe(false);
      expect(nodeStateManager.isEditing(testNode2)).toBe(false);
    });

    it('should exit all editing modes except excluded node', () => {
      // Set both nodes to editing manually (bypassing the auto-exit behavior)
      const state1 = nodeStateManager.getNodeState(testNode1)!;
      const state2 = nodeStateManager.getNodeState(testNode2)!;
      state1.isEditing = true;
      state2.isEditing = true;
      
      nodeStateManager.exitAllEditingModes(testNode1);
      
      expect(nodeStateManager.isEditing(testNode1)).toBe(true);
      expect(nodeStateManager.isEditing(testNode2)).toBe(false);
    });

    it('should dispatch event when editing state changes', () => {
      nodeStateManager.setEditing(testNode1, true);
      
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'node-state-changed',
          detail: expect.objectContaining({
            node: testNode1,
            changeType: 'editing',
            isEditing: true,
            previousState: false
          })
        })
      );
    });
  });

  describe('Property Management', () => {
    let testProperty: PropertyValue;

    beforeEach(() => {
      nodeStateManager.initializeNodeState(testNode1);
      testProperty = {
        key: 'Technology',
        value: 'React',
        type: 'text',
        id: 'test-prop-1',
        order: 0
      };
    });

    it('should add property to node', () => {
      const result = nodeStateManager.addProperty(testNode1, testProperty);
      
      expect(result).toBe(true);
      expect(nodeStateManager.getPropertyCount(testNode1)).toBe(1);
      expect(nodeStateManager.hasProperty(testNode1, 'Technology')).toBe(true);
    });

    it('should return false when adding property to non-existent node', () => {
      const result = nodeStateManager.addProperty(testNode2, testProperty);
      
      expect(result).toBe(false);
    });

    it('should return false when adding property with duplicate key', () => {
      nodeStateManager.addProperty(testNode1, testProperty);
      
      const duplicateProperty = { ...testProperty, id: 'test-prop-2' };
      const result = nodeStateManager.addProperty(testNode1, duplicateProperty);
      
      expect(result).toBe(false);
      expect(nodeStateManager.getPropertyCount(testNode1)).toBe(1);
    });

    it('should generate ID for property if not provided', () => {
      const propertyWithoutId = { ...testProperty };
      delete propertyWithoutId.id;
      
      const result = nodeStateManager.addProperty(testNode1, propertyWithoutId);
      
      expect(result).toBe(true);
      const properties = nodeStateManager.getProperties(testNode1);
      expect(properties[0].id).toMatch(/^prop_\d+$/);
    });

    it('should remove property from node', () => {
      nodeStateManager.addProperty(testNode1, testProperty);
      
      const result = nodeStateManager.removeProperty(testNode1, 'Technology');
      
      expect(result).toBe(true);
      expect(nodeStateManager.getPropertyCount(testNode1)).toBe(0);
      expect(nodeStateManager.hasProperty(testNode1, 'Technology')).toBe(false);
    });

    it('should return false when removing non-existent property', () => {
      const result = nodeStateManager.removeProperty(testNode1, 'NonExistent');
      
      expect(result).toBe(false);
    });

    it('should return false when removing property from non-existent node', () => {
      const result = nodeStateManager.removeProperty(testNode2, 'Technology');
      
      expect(result).toBe(false);
    });

    it('should update property value', () => {
      nodeStateManager.addProperty(testNode1, testProperty);
      
      const result = nodeStateManager.updateProperty(testNode1, 'Technology', 'Vue.js');
      
      expect(result).toBe(true);
      const properties = nodeStateManager.getProperties(testNode1);
      expect(properties[0].value).toBe('Vue.js');
    });

    it('should update property value and type', () => {
      nodeStateManager.addProperty(testNode1, testProperty);
      
      const result = nodeStateManager.updateProperty(testNode1, 'Technology', '3000', 'number');
      
      expect(result).toBe(true);
      const properties = nodeStateManager.getProperties(testNode1);
      expect(properties[0].value).toBe('3000');
      expect(properties[0].type).toBe('number');
    });

    it('should return false when updating non-existent property', () => {
      const result = nodeStateManager.updateProperty(testNode1, 'NonExistent', 'NewValue');
      
      expect(result).toBe(false);
    });

    it('should return false when updating property of non-existent node', () => {
      const result = nodeStateManager.updateProperty(testNode2, 'Technology', 'NewValue');
      
      expect(result).toBe(false);
    });

    it('should get all properties sorted by order', () => {
      const prop1 = { ...testProperty, key: 'Tech1', order: 2 };
      const prop2 = { ...testProperty, key: 'Tech2', order: 0 };
      const prop3 = { ...testProperty, key: 'Tech3', order: 1 };
      
      nodeStateManager.addProperty(testNode1, prop1);
      nodeStateManager.addProperty(testNode1, prop2);
      nodeStateManager.addProperty(testNode1, prop3);
      
      const properties = nodeStateManager.getProperties(testNode1);
      
      expect(properties).toHaveLength(3);
      expect(properties[0].key).toBe('Tech2'); // order: 0
      expect(properties[1].key).toBe('Tech3'); // order: 1
      expect(properties[2].key).toBe('Tech1'); // order: 2
    });

    it('should return empty array for non-existent node', () => {
      const properties = nodeStateManager.getProperties(testNode2);
      
      expect(properties).toEqual([]);
    });

    it('should sync properties to nodeData', () => {
      nodeStateManager.addProperty(testNode1, testProperty);
      
      const nodeData = (testNode1 as any).nodeData;
      expect(nodeData).toBeDefined();
      expect(nodeData.properties).toHaveLength(1);
      expect(nodeData.properties[0]).toEqual(testProperty);
    });

    it('should dispatch events for property operations', () => {
      // Add property
      nodeStateManager.addProperty(testNode1, testProperty);
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'node-state-changed',
          detail: expect.objectContaining({
            changeType: 'property-added',
            property: testProperty
          })
        })
      );

      vi.clearAllMocks();

      // Update property
      nodeStateManager.updateProperty(testNode1, 'Technology', 'Vue.js');
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'node-state-changed',
          detail: expect.objectContaining({
            changeType: 'property-updated',
            oldValue: 'React',
            newValue: 'Vue.js'
          })
        })
      );

      vi.clearAllMocks();

      // Remove property
      nodeStateManager.removeProperty(testNode1, 'Technology');
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'node-state-changed',
          detail: expect.objectContaining({
            changeType: 'property-removed',
            property: expect.objectContaining({ key: 'Technology' })
          })
        })
      );
    });
  });

  describe('Action Buttons Visibility', () => {
    beforeEach(() => {
      nodeStateManager.initializeNodeState(testNode1);
    });

    it('should set action buttons visibility', () => {
      const result = nodeStateManager.setActionButtonsVisible(testNode1, true);
      
      expect(result).toBe(true);
      expect(nodeStateManager.areActionButtonsVisible(testNode1)).toBe(true);
    });

    it('should return false when setting visibility for non-existent node', () => {
      const result = nodeStateManager.setActionButtonsVisible(testNode2, true);
      
      expect(result).toBe(false);
    });

    it('should dispatch event when visibility changes', () => {
      nodeStateManager.setActionButtonsVisible(testNode1, true);
      
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'node-state-changed',
          detail: expect.objectContaining({
            changeType: 'action-buttons',
            visible: true,
            previousState: false
          })
        })
      );
    });

    it('should not dispatch event when setting same visibility', () => {
      vi.clearAllMocks();
      
      nodeStateManager.setActionButtonsVisible(testNode1, false);
      
      expect(window.dispatchEvent).not.toHaveBeenCalled();
    });
  });

  describe('Bounds Management', () => {
    beforeEach(() => {
      nodeStateManager.initializeNodeState(testNode1);
    });

    it('should set and get original bounds', () => {
      const bounds = { width: 200, height: 100 };
      
      const result = nodeStateManager.setOriginalBounds(testNode1, bounds);
      
      expect(result).toBe(true);
      
      const currentBounds = nodeStateManager.getCurrentBounds(testNode1);
      expect(currentBounds).toEqual(bounds);
    });

    it('should set and get collapsed bounds when node is collapsed', () => {
      const originalBounds = { width: 200, height: 100 };
      const collapsedBounds = { width: 200, height: 40 };
      
      nodeStateManager.setOriginalBounds(testNode1, originalBounds);
      nodeStateManager.setCollapsedBounds(testNode1, collapsedBounds);
      nodeStateManager.setCollapsed(testNode1, true);
      
      const currentBounds = nodeStateManager.getCurrentBounds(testNode1);
      expect(currentBounds).toEqual(collapsedBounds);
    });

    it('should return null for non-existent node bounds', () => {
      const bounds = nodeStateManager.getCurrentBounds(testNode2);
      
      expect(bounds).toBeNull();
    });

    it('should return false when setting bounds for non-existent node', () => {
      const bounds = { width: 200, height: 100 };
      
      const result1 = nodeStateManager.setOriginalBounds(testNode2, bounds);
      const result2 = nodeStateManager.setCollapsedBounds(testNode2, bounds);
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      nodeStateManager.initializeNodeState(testNode1);
      nodeStateManager.initializeNodeState(testNode2);
    });

    it('should remove node state', () => {
      const result = nodeStateManager.removeNodeState(testNode1);
      
      expect(result).toBe(true);
      expect(nodeStateManager.hasNodeState(testNode1)).toBe(false);
      expect(nodeStateManager.getNodeCount()).toBe(1);
    });

    it('should return false when removing non-existent node state', () => {
      const testNode3 = new Container();
      const result = nodeStateManager.removeNodeState(testNode3);
      
      expect(result).toBe(false);
    });

    it('should get node count', () => {
      expect(nodeStateManager.getNodeCount()).toBe(2);
      
      nodeStateManager.removeNodeState(testNode1);
      expect(nodeStateManager.getNodeCount()).toBe(1);
    });

    it('should get all nodes', () => {
      const nodes = nodeStateManager.getAllNodes();
      
      expect(nodes).toHaveLength(2);
      expect(nodes).toContain(testNode1);
      expect(nodes).toContain(testNode2);
    });

    it('should clear all states', () => {
      expect(nodeStateManager.getNodeCount()).toBe(2);
      
      nodeStateManager.clearAllStates();
      
      expect(nodeStateManager.getNodeCount()).toBe(0);
      expect(nodeStateManager.hasNodeState(testNode1)).toBe(false);
      expect(nodeStateManager.hasNodeState(testNode2)).toBe(false);
    });
  });
});