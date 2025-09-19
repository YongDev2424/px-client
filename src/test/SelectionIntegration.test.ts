// src/test/SelectionIntegration.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Container, Graphics, Rectangle } from 'pixi.js';
import { selectionManager, makeSelectable, SelectableElement } from '../utils/selectionManager';
import { NodeEnhancer } from '../components/NodeEnhancer';
import { nodeStateManager } from '../utils/nodeStateManager';

// Mock DOM methods
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(() => true)
});

Object.defineProperty(window, 'alert', {
  writable: true,
  value: vi.fn()
});

// Mock PixiJS components for testing
function createMockC4Box(labelText: string, boxColor: number): Container {
  const container = new Container();
  
  // Mock graphics
  const boxGraphics = new Graphics();
  boxGraphics.width = 200;
  boxGraphics.height = 100;
  
  // Mock methods
  (boxGraphics as any).clear = vi.fn().mockReturnThis();
  (boxGraphics as any).rect = vi.fn().mockReturnThis();
  (boxGraphics as any).fill = vi.fn().mockReturnThis();
  (boxGraphics as any).stroke = vi.fn().mockReturnThis();
  
  container.addChild(boxGraphics);
  
  // Mock getBounds
  container.getBounds = vi.fn().mockReturnValue(new Rectangle(0, 0, 200, 100));
  
  // Add metadata
  (container as any).boxGraphics = boxGraphics;
  (container as any).nodeData = {
    labelText: labelText,
    boxColor: boxColor,
    nodeType: 'c4box'
  };
  
  // Mock stage hierarchy
  const mockStage = new Container();
  mockStage.addChild(container);
  
  return container;
}

// Mock ActionButtonsContainer
class MockActionButtonsContainer {
  private isVisible: boolean = false;
  
  show(): void {
    this.isVisible = true;
  }
  
  hide(): void {
    this.isVisible = false;
  }
  
  getVisibility(): boolean {
    return this.isVisible;
  }
  
  destroy(): void {
    // Mock destroy
  }
}

describe('Selection Integration with Enhanced Nodes', () => {
  let regularNode: Container;
  let enhancedNode: Container;
  let nodeEnhancer: NodeEnhancer;
  let regularSelectable: SelectableElement;
  let enhancedSelectable: SelectableElement;

  beforeEach(() => {
    // สร้าง mock nodes
    regularNode = createMockC4Box('Regular Node', 0x4CAF50);
    enhancedNode = createMockC4Box('Enhanced Node', 0x2196F3);

    // ล้าง state managers
    nodeStateManager.clearAllStates();
    selectionManager.deselectAll();

    // สร้าง regular selectable node
    regularSelectable = makeSelectable(regularNode, {
      onSelect: () => console.log('Regular node selected'),
      onDeselect: () => console.log('Regular node deselected')
    });

    // สร้าง enhanced node
    nodeEnhancer = new NodeEnhancer(enhancedNode, {
      enableActionButtons: true,
      enableCollapse: false,
      enableProperties: false // Disable properties to avoid DOM issues
    });

    // Mock ActionButtonsContainer - need to replace the real one created by NodeEnhancer
    const mockActionButtons = new MockActionButtonsContainer();
    
    // Replace the real ActionButtonsContainer with our mock
    const realActionButtons = nodeEnhancer.getActionButtons();
    if (realActionButtons) {
      realActionButtons.destroy();
    }
    
    // Mock the getActionButtons method to return our mock
    vi.spyOn(nodeEnhancer, 'getActionButtons').mockReturnValue(mockActionButtons as any);

    // ได้ enhanced selectable element
    enhancedSelectable = selectionManager.getSelectableElement(enhancedNode)!;
  });

  afterEach(() => {
    // Cleanup
    if (nodeEnhancer) {
      nodeEnhancer.destroy();
    }
    
    nodeStateManager.clearAllStates();
    selectionManager.deselectAll();
  });

  describe('makeSelectable Function Enhancement', () => {
    it('should create selectable element for regular nodes', () => {
      expect(regularSelectable).toBeDefined();
      expect(regularSelectable.container).toBe(regularNode);
      expect(regularSelectable.isSelected).toBe(false);
    });

    it('should create enhanced selectable element for enhanced nodes', () => {
      expect(enhancedSelectable).toBeDefined();
      expect(enhancedSelectable.container).toBe(enhancedNode);
      expect(enhancedSelectable.isSelected).toBe(false);
    });

    it('should detect enhanced nodes correctly', () => {
      expect(selectionManager.isEnhancedNode(regularNode)).toBe(false);
      expect(selectionManager.isEnhancedNode(enhancedNode)).toBe(true);
    });

    it('should store selectable elements in container metadata', () => {
      expect((regularNode as any).selectableElement).toBe(regularSelectable);
      expect((enhancedNode as any).selectableElement).toBe(enhancedSelectable);
    });
  });

  describe('Selection State Management', () => {
    it('should select regular nodes normally', () => {
      expect(regularSelectable.isSelected).toBe(false);
      
      selectionManager.selectElement(regularSelectable);
      
      expect(regularSelectable.isSelected).toBe(true);
      expect(selectionManager.isSelected(regularSelectable)).toBe(true);
      expect(selectionManager.getSelectedCount()).toBe(1);
    });

    it('should select enhanced nodes with action button integration', () => {
      const actionButtons = nodeEnhancer.getActionButtons();
      expect(actionButtons?.getVisibility()).toBe(false);
      
      selectionManager.selectElement(enhancedSelectable);
      
      expect(enhancedSelectable.isSelected).toBe(true);
      expect(selectionManager.isSelected(enhancedSelectable)).toBe(true);
      expect(actionButtons?.getVisibility()).toBe(true);
    });

    it('should deselect regular nodes normally', () => {
      selectionManager.selectElement(regularSelectable);
      expect(regularSelectable.isSelected).toBe(true);
      
      selectionManager.deselectElement(regularSelectable);
      
      expect(regularSelectable.isSelected).toBe(false);
      expect(selectionManager.isSelected(regularSelectable)).toBe(false);
    });

    it('should deselect enhanced nodes with action button cleanup', () => {
      const actionButtons = nodeEnhancer.getActionButtons();
      
      selectionManager.selectElement(enhancedSelectable);
      expect(actionButtons?.getVisibility()).toBe(true);
      
      selectionManager.deselectElement(enhancedSelectable);
      
      expect(enhancedSelectable.isSelected).toBe(false);
      expect(actionButtons?.getVisibility()).toBe(false);
    });
  });

  describe('Multiple Node Selection', () => {
    it('should handle multiple regular nodes selection', () => {
      const secondRegularNode = createMockC4Box('Second Regular', 0xFF5722);
      const secondSelectable = makeSelectable(secondRegularNode);

      selectionManager.selectElement(regularSelectable);
      selectionManager.selectElement(secondSelectable);

      expect(selectionManager.getSelectedCount()).toBe(2);
      expect(selectionManager.isSelected(regularSelectable)).toBe(true);
      expect(selectionManager.isSelected(secondSelectable)).toBe(true);
    });

    it('should handle mixed regular and enhanced nodes selection', () => {
      const actionButtons = nodeEnhancer.getActionButtons();

      selectionManager.selectElement(regularSelectable);
      selectionManager.selectElement(enhancedSelectable);

      expect(selectionManager.getSelectedCount()).toBe(2);
      expect(selectionManager.isSelected(regularSelectable)).toBe(true);
      expect(selectionManager.isSelected(enhancedSelectable)).toBe(true);
      expect(actionButtons?.getVisibility()).toBe(true);
    });

    it('should handle multiple enhanced nodes selection', () => {
      const secondEnhancedNode = createMockC4Box('Second Enhanced', 0x9C27B0);
      const secondEnhancer = new NodeEnhancer(secondEnhancedNode, {
        enableActionButtons: true,
        enableProperties: false
      });

      const secondMockActionButtons = new MockActionButtonsContainer();
      vi.spyOn(secondEnhancer, 'getActionButtons').mockReturnValue(secondMockActionButtons as any);

      const secondEnhancedSelectable = selectionManager.getSelectableElement(secondEnhancedNode)!;

      const firstActionButtons = nodeEnhancer.getActionButtons();
      const secondActionButtons = secondEnhancer.getActionButtons();

      selectionManager.selectElement(enhancedSelectable);
      selectionManager.selectElement(secondEnhancedSelectable);

      expect(selectionManager.getSelectedCount()).toBe(2);
      expect(firstActionButtons?.getVisibility()).toBe(true);
      expect(secondActionButtons?.getVisibility()).toBe(true);

      // Cleanup
      secondEnhancer.destroy();
    });
  });

  describe('Selection Cleanup and Deselect All', () => {
    it('should deselect all regular nodes', () => {
      const secondRegularNode = createMockC4Box('Second Regular', 0xFF5722);
      const secondSelectable = makeSelectable(secondRegularNode);

      selectionManager.selectElement(regularSelectable);
      selectionManager.selectElement(secondSelectable);
      expect(selectionManager.getSelectedCount()).toBe(2);

      selectionManager.deselectAll();

      expect(selectionManager.getSelectedCount()).toBe(0);
      expect(selectionManager.isSelected(regularSelectable)).toBe(false);
      expect(selectionManager.isSelected(secondSelectable)).toBe(false);
    });

    it('should deselect all enhanced nodes with proper cleanup', () => {
      const secondEnhancedNode = createMockC4Box('Second Enhanced', 0x9C27B0);
      const secondEnhancer = new NodeEnhancer(secondEnhancedNode, {
        enableActionButtons: true,
        enableProperties: false
      });

      const secondMockActionButtons = new MockActionButtonsContainer();
      vi.spyOn(secondEnhancer, 'getActionButtons').mockReturnValue(secondMockActionButtons as any);

      const secondEnhancedSelectable = selectionManager.getSelectableElement(secondEnhancedNode)!;

      const firstActionButtons = nodeEnhancer.getActionButtons();
      const secondActionButtons = secondEnhancer.getActionButtons();

      selectionManager.selectElement(enhancedSelectable);
      selectionManager.selectElement(secondEnhancedSelectable);
      expect(firstActionButtons?.getVisibility()).toBe(true);
      expect(secondActionButtons?.getVisibility()).toBe(true);

      selectionManager.deselectAll();

      expect(selectionManager.getSelectedCount()).toBe(0);
      expect(firstActionButtons?.getVisibility()).toBe(false);
      expect(secondActionButtons?.getVisibility()).toBe(false);

      // Cleanup
      secondEnhancer.destroy();
    });

    it('should deselect mixed regular and enhanced nodes', () => {
      const actionButtons = nodeEnhancer.getActionButtons();

      selectionManager.selectElement(regularSelectable);
      selectionManager.selectElement(enhancedSelectable);
      expect(selectionManager.getSelectedCount()).toBe(2);
      expect(actionButtons?.getVisibility()).toBe(true);

      selectionManager.deselectAll();

      expect(selectionManager.getSelectedCount()).toBe(0);
      expect(selectionManager.isSelected(regularSelectable)).toBe(false);
      expect(selectionManager.isSelected(enhancedSelectable)).toBe(false);
      expect(actionButtons?.getVisibility()).toBe(false);
    });
  });

  describe('Selection Toggle Functionality', () => {
    it('should toggle selection for regular nodes', () => {
      expect(regularSelectable.isSelected).toBe(false);

      selectionManager.toggleSelection(regularSelectable);
      expect(regularSelectable.isSelected).toBe(true);

      selectionManager.toggleSelection(regularSelectable);
      expect(regularSelectable.isSelected).toBe(false);
    });

    it('should toggle selection for enhanced nodes with action button sync', () => {
      const actionButtons = nodeEnhancer.getActionButtons();
      expect(enhancedSelectable.isSelected).toBe(false);
      expect(actionButtons?.getVisibility()).toBe(false);

      selectionManager.toggleSelection(enhancedSelectable);
      expect(enhancedSelectable.isSelected).toBe(true);
      expect(actionButtons?.getVisibility()).toBe(true);

      selectionManager.toggleSelection(enhancedSelectable);
      expect(enhancedSelectable.isSelected).toBe(false);
      expect(actionButtons?.getVisibility()).toBe(false);
    });
  });

  describe('Event Dispatching', () => {
    it('should dispatch selection events for regular nodes', () => {
      const eventSpy = vi.spyOn(window, 'dispatchEvent');

      selectionManager.selectElement(regularSelectable);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'pixi-selection-change',
          detail: expect.objectContaining({
            container: regularNode,
            action: 'select',
            isEnhanced: false
          })
        })
      );
    });

    it('should dispatch selection events for enhanced nodes', () => {
      const eventSpy = vi.spyOn(window, 'dispatchEvent');

      selectionManager.selectElement(enhancedSelectable);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'pixi-selection-change',
          detail: expect.objectContaining({
            container: enhancedNode,
            action: 'select',
            isEnhanced: true
          })
        })
      );
    });

    it('should dispatch deselection events for enhanced nodes', () => {
      const eventSpy = vi.spyOn(window, 'dispatchEvent');

      selectionManager.selectElement(enhancedSelectable);
      eventSpy.mockClear(); // Clear previous calls

      selectionManager.deselectElement(enhancedSelectable);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'pixi-selection-change',
          detail: expect.objectContaining({
            container: enhancedNode,
            action: 'deselect',
            isEnhanced: true
          })
        })
      );
    });
  });

  describe('SelectionManager Utility Methods', () => {
    it('should correctly identify enhanced nodes', () => {
      expect(selectionManager.isEnhancedNode(regularNode)).toBe(false);
      expect(selectionManager.isEnhancedNode(enhancedNode)).toBe(true);
    });

    it('should retrieve selectable elements correctly', () => {
      expect(selectionManager.getSelectableElement(regularNode)).toBe(regularSelectable);
      expect(selectionManager.getSelectableElement(enhancedNode)).toBe(enhancedSelectable);
      
      const nonSelectableNode = createMockC4Box('Non-selectable', 0x000000);
      expect(selectionManager.getSelectableElement(nonSelectableNode)).toBeNull();
    });

    it('should update existing selectable elements for enhanced nodes', () => {
      // Create a regular node first
      const testNode = createMockC4Box('Test Node', 0x607D8B);
      const testSelectable = makeSelectable(testNode, {
        onSelect: () => console.log('Original select'),
        onDeselect: () => console.log('Original deselect')
      });

      // Enhance the node after making it selectable
      const testEnhancer = new NodeEnhancer(testNode, {
        enableActionButtons: true,
        enableProperties: false
      });

      const mockActionButtons = new MockActionButtonsContainer();
      vi.spyOn(testEnhancer, 'getActionButtons').mockReturnValue(mockActionButtons as any);

      // Update the selectable element for enhanced node
      selectionManager.updateSelectableForEnhancedNode(testNode);

      // Test that action buttons are now managed
      selectionManager.selectElement(testSelectable);
      expect(mockActionButtons.getVisibility()).toBe(true);

      selectionManager.deselectElement(testSelectable);
      expect(mockActionButtons.getVisibility()).toBe(false);

      // Cleanup
      testEnhancer.destroy();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle selection of already selected nodes gracefully', () => {
      selectionManager.selectElement(enhancedSelectable);
      expect(enhancedSelectable.isSelected).toBe(true);

      // Try to select again
      selectionManager.selectElement(enhancedSelectable);
      expect(enhancedSelectable.isSelected).toBe(true);
      expect(selectionManager.getSelectedCount()).toBe(1);
    });

    it('should handle deselection of already deselected nodes gracefully', () => {
      expect(enhancedSelectable.isSelected).toBe(false);

      // Try to deselect already deselected node
      selectionManager.deselectElement(enhancedSelectable);
      expect(enhancedSelectable.isSelected).toBe(false);
      expect(selectionManager.getSelectedCount()).toBe(0);
    });

    it('should handle nodes without action buttons gracefully', () => {
      const nodeWithoutButtons = createMockC4Box('No Buttons', 0x795548);
      const enhancerWithoutButtons = new NodeEnhancer(nodeWithoutButtons, {
        enableActionButtons: false,
        enableProperties: false
      });

      const selectableWithoutButtons = selectionManager.getSelectableElement(nodeWithoutButtons)!;

      // Should not throw error when selecting node without action buttons
      expect(() => {
        selectionManager.selectElement(selectableWithoutButtons);
        selectionManager.deselectElement(selectableWithoutButtons);
      }).not.toThrow();

      // Cleanup
      enhancerWithoutButtons.destroy();
    });

    it('should handle updating non-selectable containers gracefully', () => {
      const nonSelectableNode = createMockC4Box('Non-selectable', 0x000000);
      
      // Should not throw error
      expect(() => {
        selectionManager.updateSelectableForEnhancedNode(nonSelectableNode);
      }).not.toThrow();
    });

    it('should handle updating containers without enhancers gracefully', () => {
      // Should not throw error
      expect(() => {
        selectionManager.updateSelectableForEnhancedNode(regularNode);
      }).not.toThrow();
    });
  });
});