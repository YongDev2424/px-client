// src/tests/deletionSystem.test.ts

/**
 * การทดสอบระบบ Element Deletion
 * ทดสอบครอบคลุมทุกส่วนของ Function-based Deletion System
 */

import { Container, Application } from 'pixi.js';
import type { SelectableElement } from '../stores/selectionState';

/**
 * Mock Element สำหรับการทดสอบ
 */
function createMockElement(nodeId: string, type: 'node' | 'edge'): SelectableElement {
  const container = new Container();
  (container as any)._nodeId = nodeId;
  
  return {
    nodeId,
    type,
    container,
    isSelected: false
  };
}

/**
 * Mock Node Container พร้อม metadata
 */
function createMockNodeContainer(nodeId: string, nodeType: string = 'person'): Container {
  const container = new Container();
  (container as any)._nodeId = nodeId;
  (container as any).nodeData = {
    nodeType,
    labelText: `Test ${nodeType}`
  };
  
  // Add to mock stage
  const app = new Application();
  app.stage.addChild(container);
  
  return container;
}

/**
 * Mock Edge Container พร้อม connections
 */
function createMockEdgeContainer(nodeId: string, sourceNode?: Container, targetNode?: Container): Container {
  const container = new Container();
  (container as any)._nodeId = nodeId;
  (container as any).edgeData = {
    labelText: 'Test Edge',
    sourceNode,
    targetNode
  };
  
  return container;
}

/**
 * Test 1: Deletion Store Functionality
 */
async function testDeletionStore(): Promise<boolean> {
  console.log('🧪 Testing Deletion Store...');
  
  try {
    const { useDeletionState } = await import('../stores/deletionState');
    const deletionState = useDeletionState.getState();
    
    // Test initial state
    console.assert(deletionState.deletingElements.size === 0, 'Initial deleting elements should be empty');
    console.assert(deletionState.deletionHistory.length === 0, 'Initial deletion history should be empty');
    
    // Test marking as deleting
    const testNodeId = 'test-node-1';
    deletionState.markAsDeleting(testNodeId);
    console.assert(deletionState.isDeleting(testNodeId), 'Node should be marked as deleting');
    
    // Test unmarking
    deletionState.unmarkAsDeleting(testNodeId);
    console.assert(!deletionState.isDeleting(testNodeId), 'Node should not be marked as deleting');
    
    // Test deletion history
    const mockElement = createMockElement('test-node-1', 'node');
    deletionState.addDeletionRecord({
      nodeId: mockElement.nodeId,
      elementType: mockElement.type,
      timestamp: Date.now(),
      success: true
    });
    
    const history = deletionState.getDeletionHistory();
    console.assert(history.length === 1, 'Deletion history should have 1 record');
    console.assert(history[0].success === true, 'Deletion record should be successful');
    
    // Clear history test
    deletionState.clearHistory();
    console.assert(deletionState.getDeletionHistory().length === 0, 'History should be cleared');
    
    console.log('✅ Deletion Store tests passed');
    return true;
    
  } catch (error) {
    console.error('❌ Deletion Store test failed:', error);
    return false;
  }
}

/**
 * Test 2: Element Deletion Utils
 */
async function testElementDeletionUtils(): Promise<boolean> {
  console.log('🧪 Testing Element Deletion Utils...');
  
  try {
    const { 
      calculateDeletionPermissions,
      findConnectedEdges,
      fadeOutElement
    } = await import('../utils/elementDeletion');
    
    // Test deletion permissions
    const validElement = createMockElement('valid-node', 'node');
    validElement.container.parent = new Container(); // Mock stage
    
    const permissions = calculateDeletionPermissions(validElement);
    console.assert(permissions.canDelete === true, 'Valid element should be deletable');
    
    // Test invalid element permissions
    const invalidElement = createMockElement('invalid-node', 'node');
    // No parent = not in stage
    const invalidPermissions = calculateDeletionPermissions(invalidElement);
    console.assert(invalidPermissions.canDelete === false, 'Invalid element should not be deletable');
    console.assert(invalidPermissions.reason === 'Element not in stage', 'Should have correct reason');
    
    // Test connected edges finding
    const nodeContainer = createMockNodeContainer('node-1');
    const edgeContainer1 = createMockEdgeContainer('edge-1', nodeContainer);
    const edgeContainer2 = createMockEdgeContainer('edge-2', nodeContainer);
    
    // Add edges to same parent as node
    nodeContainer.parent?.addChild(edgeContainer1);
    nodeContainer.parent?.addChild(edgeContainer2);
    
    const connectedEdges = findConnectedEdges(nodeContainer);
    console.assert(connectedEdges.length === 2, 'Should find 2 connected edges');
    
    // Test fade out animation
    const testContainer = new Container();
    testContainer.alpha = 1;
    
    const fadePromise = fadeOutElement(testContainer, 50); // Fast animation for testing
    await fadePromise;
    console.assert(testContainer.alpha < 0.1, 'Container should be faded out');
    
    console.log('✅ Element Deletion Utils tests passed');
    return true;
    
  } catch (error) {
    console.error('❌ Element Deletion Utils test failed:', error);
    return false;
  }
}

/**
 * Test 3: Composable Actions
 */
async function testComposableActions(): Promise<boolean> {
  console.log('🧪 Testing Composable Actions...');
  
  try {
    const { useDeletionActions, useDeletionEvents } = await import('../composables/useDeletionActions');
    
    const {
      canDeleteElement,
      getDeletionHistory,
      getDeletionStats,
      isDeleting
    } = useDeletionActions();
    
    const {
      onDeletionEvent
    } = useDeletionEvents();
    
    // Test permission checking
    const testElement = createMockElement('composable-test', 'node');
    testElement.container.parent = new Container(); // Mock stage
    
    const permissions = await canDeleteElement(testElement);
    console.assert(permissions.canDelete === true, 'Composable should check permissions correctly');
    
    // Test deletion status checking
    const isDeletingResult = await isDeleting('non-existent');
    console.assert(isDeletingResult === false, 'Non-existent node should not be deleting');
    
    // Test history functions
    const history = await getDeletionHistory();
    console.assert(Array.isArray(history), 'History should be an array');
    
    const stats = await getDeletionStats();
    console.assert(typeof stats.total === 'number', 'Stats should have total count');
    console.assert(typeof stats.successful === 'number', 'Stats should have successful count');
    console.assert(typeof stats.failed === 'number', 'Stats should have failed count');
    
    // Test event listeners
    let eventReceived = false;
    const cleanup = onDeletionEvent(() => {
      eventReceived = true;
    });
    
    // Simulate deletion event
    const event = new CustomEvent('element-deletion-started', {
      detail: { element: testElement, elementType: 'node' }
    });
    window.dispatchEvent(event);
    
    // Small delay to allow event processing
    await new Promise(resolve => setTimeout(resolve, 10));
    console.assert(eventReceived === true, 'Event listener should receive deletion events');
    
    cleanup(); // Clean up event listener
    
    console.log('✅ Composable Actions tests passed');
    return true;
    
  } catch (error) {
    console.error('❌ Composable Actions test failed:', error);
    return false;
  }
}

/**
 * Test 4: Store Integration
 */
async function testStoreIntegration(): Promise<boolean> {
  console.log('🧪 Testing Store Integration...');
  
  try {
    // Test that all stores export correctly
    const storeExports = await import('../stores/index');
    
    console.assert(typeof storeExports.useDeletionState === 'object', 'Should export useDeletionState');
    console.assert(typeof storeExports.deletionManager === 'object', 'Should export deletionManager');
    console.assert(typeof storeExports.useNodeState === 'object', 'Should export useNodeState');
    console.assert(typeof storeExports.useSelectionState === 'object', 'Should export useSelectionState');
    
    // Test node state integration
    const { useNodeState } = storeExports;
    const nodeState = useNodeState.getState();
    
    // Test node state removal
    const testNodeId = 'integration-test-node';
    nodeState.initializeNodeState(testNodeId);
    console.assert(nodeState.hasNodeState(testNodeId), 'Node state should be initialized');
    
    const removed = nodeState.removeNodeState(testNodeId);
    console.assert(removed, 'Should successfully remove node state');
    console.assert(!nodeState.hasNodeState(testNodeId), 'Node state should be removed');
    
    console.log('✅ Store Integration tests passed');
    return true;
    
  } catch (error) {
    console.error('❌ Store Integration test failed:', error);
    return false;
  }
}

/**
 * Test 5: Event Flow Integration
 */
async function testEventFlowIntegration(): Promise<boolean> {
  console.log('🧪 Testing Event Flow Integration...');
  
  try {
    let eventsReceived: Array<{type: string, detail: any}> = [];
    
    // Listen for all deletion events
    const eventTypes = [
      'element-deletion-started',
      'element-deletion-completed',
      'element-deletion-failed'
    ];
    
    const eventListeners = eventTypes.map(eventType => {
      const handler = (event: CustomEvent) => {
        eventsReceived.push({
          type: eventType,
          detail: event.detail
        });
      };
      window.addEventListener(eventType, handler as EventListener);
      return { eventType, handler };
    });
    
    // Simulate deletion flow
    const testElement = createMockElement('event-flow-test', 'node');
    
    // Start deletion
    const startEvent = new CustomEvent('element-deletion-started', {
      detail: { element: testElement, elementType: 'node' }
    });
    window.dispatchEvent(startEvent);
    
    // Complete deletion
    const completeEvent = new CustomEvent('element-deletion-completed', {
      detail: { element: testElement, elementType: 'node' }
    });
    window.dispatchEvent(completeEvent);
    
    // Small delay for event processing
    await new Promise(resolve => setTimeout(resolve, 20));
    
    console.assert(eventsReceived.length === 2, 'Should receive 2 events');
    console.assert(eventsReceived[0].type === 'element-deletion-started', 'First event should be start');
    console.assert(eventsReceived[1].type === 'element-deletion-completed', 'Second event should be complete');
    
    // Clean up event listeners
    eventListeners.forEach(({ eventType, handler }) => {
      window.removeEventListener(eventType, handler as EventListener);
    });
    
    console.log('✅ Event Flow Integration tests passed');
    return true;
    
  } catch (error) {
    console.error('❌ Event Flow Integration test failed:', error);
    return false;
  }
}

/**
 * Main test runner
 */
export async function runDeletionSystemTests(): Promise<boolean> {
  console.log('🚀 Starting Deletion System Tests...');
  console.log('=====================================');
  
  const testResults = await Promise.all([
    testDeletionStore(),
    testElementDeletionUtils(),
    testComposableActions(),
    testStoreIntegration(),
    testEventFlowIntegration()
  ]);
  
  const allPassed = testResults.every(result => result === true);
  const passedCount = testResults.filter(result => result === true).length;
  const totalCount = testResults.length;
  
  console.log('=====================================');
  if (allPassed) {
    console.log(`✅ All Deletion System Tests Passed! (${passedCount}/${totalCount})`);
    console.log('🎉 Deletion System is ready for production use!');
  } else {
    console.log(`❌ Some Deletion System Tests Failed (${passedCount}/${totalCount})`);
    console.log('🔧 Please fix the failing tests before using the system');
  }
  
  return allPassed;
}

/**
 * Manual test helper functions
 */
export const deletionTestHelpers = {
  /**
   * สร้าง test elements สำหรับการทดสอบ manual
   */
  createTestElements: () => {
    const nodeElement = createMockElement('manual-test-node', 'node');
    const edgeElement = createMockElement('manual-test-edge', 'edge');
    
    // Add to mock stage
    const app = new Application();
    app.stage.addChild(nodeElement.container);
    app.stage.addChild(edgeElement.container);
    
    return { nodeElement, edgeElement, app };
  },
  
  /**
   * ทดสอบการลบ element จริง
   */
  testRealDeletion: async (element: SelectableElement): Promise<boolean> => {
    try {
      const { useDeletionActions } = await import('../composables/useDeletionActions');
      const { deleteElement } = useDeletionActions();
      
      console.log('🧪 Manual Testing: Starting real deletion for', element.nodeId);
      const result = await deleteElement(element);
      console.log('🧪 Manual Testing: Deletion result:', result);
      
      return result;
    } catch (error) {
      console.error('🧪 Manual Testing: Deletion failed:', error);
      return false;
    }
  },
  
  /**
   * ดู deletion history
   */
  viewDeletionHistory: async (): Promise<void> => {
    try {
      const { useDeletionActions } = await import('../composables/useDeletionActions');
      const { getDeletionHistory, getDeletionStats } = useDeletionActions();
      
      const history = await getDeletionHistory();
      const stats = await getDeletionStats();
      
      console.log('📊 Deletion Statistics:', stats);
      console.log('📜 Deletion History:', history);
    } catch (error) {
      console.error('🧪 Manual Testing: Failed to get history:', error);
    }
  }
};

/**
 * ตัวอย่างการใช้งาน:
 * 
 * ```typescript
 * // รันการทดสอบทั้งหมด
 * import { runDeletionSystemTests } from './tests/deletionSystem.test';
 * runDeletionSystemTests().then(success => {
 *   console.log('Tests completed:', success);
 * });
 * 
 * // ทดสอบ manual
 * import { deletionTestHelpers } from './tests/deletionSystem.test';
 * const { nodeElement } = deletionTestHelpers.createTestElements();
 * deletionTestHelpers.testRealDeletion(nodeElement);
 * ```
 */