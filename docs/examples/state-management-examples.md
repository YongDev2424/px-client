# 💡 State Management Examples

> Practical examples สำหรับการใช้งาน State Management ในโปรเจค C4 Editor

## 📋 Table of Contents

1. [Basic Store Usage](#basic-store-usage)
2. [Composable Actions](#composable-actions)
3. [Event-driven Communication](#event-driven-communication)
4. [Component Integration](#component-integration)
5. [Advanced Patterns](#advanced-patterns)
6. [Debugging Examples](#debugging-examples)

## 🏪 Basic Store Usage

### Example 1: Node State Operations

```typescript
// src/examples/nodeStateExample.ts
import { useNodeState, getNodeId } from '../stores/nodeState';
import { Container } from 'pixi.js';

export function nodeStateExample() {
  const container = new Container();
  const nodeId = getNodeId(container);
  const nodeState = useNodeState.getState();
  
  // 1. Initialize node state
  nodeState.initializeNodeState(nodeId, {
    isCollapsed: false,
    isEditing: false,
    actionButtonsVisible: true
  });
  
  // 2. Add properties
  nodeState.addProperty(nodeId, {
    key: 'name',
    value: 'Example Node',
    type: 'text',
    id: 'prop-1',
    order: 0
  });
  
  nodeState.addProperty(nodeId, {
    key: 'description',
    value: 'This is an example node',
    type: 'text',
    id: 'prop-2',
    order: 1
  });
  
  // 3. Collapse/expand operations
  console.log('Is collapsed:', nodeState.isCollapsed(nodeId)); // false
  nodeState.setCollapsed(nodeId, true);
  console.log('Is collapsed:', nodeState.isCollapsed(nodeId)); // true
  
  // 4. Edit mode operations
  nodeState.setEditing(nodeId, true);
  console.log('Is editing:', nodeState.isEditing(nodeId)); // true
  
  // 5. Get properties
  const properties = nodeState.getProperties(nodeId);
  console.log('Properties:', properties);
  
  // 6. Update property
  nodeState.updateProperty(nodeId, 'name', 'Updated Node Name');
  
  // 7. Clean up
  nodeState.removeNodeState(nodeId);
}
```

### Example 2: Selection State Operations

```typescript
// src/examples/selectionExample.ts
import { useSelectionState, makeSelectable } from '../stores/selectionState';
import { Container } from 'pixi.js';

export function selectionExample() {
  const container1 = new Container();
  const container2 = new Container();
  const selectionState = useSelectionState.getState();
  
  // 1. Make containers selectable
  const element1 = makeSelectable(container1, 'node');
  const element2 = makeSelectable(container2, 'node');
  
  // 2. Single selection
  selectionState.selectElement(element1);
  console.log('Selected count:', selectionState.getSelectedCount()); // 1
  
  // 3. Multi-selection
  selectionState.selectElement(element2);
  console.log('Selected count:', selectionState.getSelectedCount()); // 2
  
  // 4. Get selected elements
  const selected = selectionState.getSelectedElements();
  console.log('Selected elements:', selected);
  
  // 5. Toggle selection
  selectionState.toggleSelection(element1);
  console.log('Element1 selected:', element1.isSelected); // false
  
  // 6. Deselect all
  selectionState.deselectAll();
  console.log('Selected count:', selectionState.getSelectedCount()); // 0
}
```

## 🎣 Composable Actions

### Example 3: Using Node Actions

```typescript
// src/examples/nodeActionsExample.ts
import { useNodeActions } from '../composables/useNodeActions';
import { Container } from 'pixi.js';

export function nodeActionsExample() {
  const container = new Container();
  const nodeActions = useNodeActions(container);
  
  // 1. Initialize with properties
  nodeActions.initialize({
    name: 'Service Node',
    type: 'system',
    description: 'Main service component'
  });
  
  // 2. Property management
  nodeActions.addProperty({
    key: 'environment',
    value: 'production',
    type: 'text',
    id: 'prop-env',
    order: 2
  });
  
  // 3. State changes
  nodeActions.collapse();
  console.log('Node collapsed');
  
  nodeActions.expand();
  console.log('Node expanded');
  
  // 4. Edit mode
  nodeActions.startEditing();
  console.log('Editing started');
  
  // Simulate editing
  setTimeout(() => {
    nodeActions.updateProperty('name', 'Updated Service Node');
    nodeActions.stopEditing();
    console.log('Editing finished');
  }, 2000);
  
  // 5. Action buttons
  nodeActions.showActionButtons();
  
  // 6. Get current state
  const state = nodeActions.getCurrentState();
  console.log('Current node state:', state);
}
```

### Example 4: Using Selection Actions

```typescript
// src/examples/selectionActionsExample.ts
import { useSelectionActions } from '../composables/useSelectionActions';
import { Container } from 'pixi.js';
import { makeSelectable } from '../stores/selectionState';

export function selectionActionsExample() {
  const selectionActions = useSelectionActions();
  
  // Create test elements
  const containers = Array.from({ length: 5 }, () => new Container());
  const elements = containers.map(container => makeSelectable(container, 'node'));
  
  // 1. Select multiple elements
  selectionActions.selectMultiple(elements.slice(0, 3));
  console.log('Selected 3 elements');
  
  // 2. Add to selection
  selectionActions.addToSelection(elements[3]);
  console.log('Added 1 more element');
  
  // 3. Remove from selection
  selectionActions.removeFromSelection(elements[0]);
  console.log('Removed 1 element');
  
  // 4. Get selection info
  const info = selectionActions.getSelectionInfo();
  console.log('Selection info:', info);
  
  // 5. Select by type
  selectionActions.selectAllOfType('node');
  console.log('Selected all nodes');
  
  // 6. Clear selection
  selectionActions.clearSelection();
  console.log('Selection cleared');
}
```

## 📡 Event-driven Communication

### Example 5: Custom Event System

```typescript
// src/examples/eventExample.ts
import { Container } from 'pixi.js';

export class EventDrivenComponent {
  private container: Container;
  private eventCleanups: (() => void)[] = [];
  
  constructor(container: Container) {
    this.container = container;
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    // 1. Listen for node state changes
    this.eventCleanups.push(
      this.addEventListener('node-state-changed', this.handleNodeStateChange)
    );
    
    // 2. Listen for selection changes
    this.eventCleanups.push(
      this.addEventListener('pixi-selection-change', this.handleSelectionChange)
    );
    
    // 3. Listen for theme changes
    this.eventCleanups.push(
      this.addEventListener('theme-changed', this.handleThemeChange)
    );
    
    // 4. Listen for deletion events
    this.eventCleanups.push(
      this.addEventListener('element-deletion-completed', this.handleDeletion)
    );
  }
  
  private handleNodeStateChange = (event: CustomEvent) => {
    const { nodeId, changeType, ...details } = event.detail;
    console.log(`Node ${nodeId} changed: ${changeType}`, details);
    
    // Update visual based on change type
    switch (changeType) {
      case 'collapse':
        this.animateCollapse(details.isCollapsed);
        break;
      case 'editing':
        this.showEditingIndicator(details.isEditing);
        break;
      case 'property-added':
        this.refreshPropertyDisplay();
        break;
    }
  };
  
  private handleSelectionChange = (event: CustomEvent) => {
    const { container, action } = event.detail;
    
    if (container === this.container) {
      if (action === 'select') {
        this.showSelectionIndicator();
      } else if (action === 'deselect') {
        this.hideSelectionIndicator();
      }
    }
  };
  
  private handleThemeChange = (event: CustomEvent) => {
    const { theme } = event.detail;
    console.log('Theme changed to:', theme.name);
    this.updateTheme(theme);
  };
  
  private handleDeletion = (event: CustomEvent) => {
    const { element } = event.detail;
    if (element.container === this.container) {
      console.log('This component was deleted');
      this.destroy();
    }
  };
  
  // Helper methods
  private addEventListener(type: string, handler: EventListener) {
    window.addEventListener(type, handler);
    return () => window.removeEventListener(type, handler);
  }
  
  private animateCollapse(isCollapsed: boolean) {
    // Animation logic here
    console.log(`Animating ${isCollapsed ? 'collapse' : 'expand'}`);
  }
  
  private showEditingIndicator(isEditing: boolean) {
    // Show/hide editing UI
    console.log(`${isEditing ? 'Show' : 'Hide'} editing indicator`);
  }
  
  private showSelectionIndicator() {
    // Show selection visual feedback
    console.log('Show selection indicator');
  }
  
  private hideSelectionIndicator() {
    // Hide selection visual feedback
    console.log('Hide selection indicator');
  }
  
  private refreshPropertyDisplay() {
    // Refresh property display
    console.log('Refresh property display');
  }
  
  private updateTheme(theme: any) {
    // Apply new theme
    console.log('Apply theme:', theme.name);
  }
  
  public destroy() {
    // Clean up all event listeners
    this.eventCleanups.forEach(cleanup => cleanup());
    console.log('Component destroyed and cleaned up');
  }
}
```

## 🖼️ Component Integration

### Example 6: Full Component Integration

```typescript
// src/examples/componentIntegrationExample.ts
import { Container, Graphics, Text } from 'pixi.js';
import { useNodeActions } from '../composables/useNodeActions';
import { useSelectionActions } from '../composables/useSelectionActions';
import { makeSelectable } from '../stores/selectionState';

export class IntegratedC4Component {
  private container: Container;
  private background: Graphics;
  private labelText: Text;
  private nodeActions: ReturnType<typeof useNodeActions>;
  private selectionActions: ReturnType<typeof useSelectionActions>;
  private selectableElement: any;
  private eventCleanups: (() => void)[] = [];
  
  constructor(options: {
    name: string;
    type: 'person' | 'system' | 'container' | 'component';
    x?: number;
    y?: number;
  }) {
    this.container = new Container();
    this.container.x = options.x || 0;
    this.container.y = options.y || 0;
    
    // Initialize composables
    this.nodeActions = useNodeActions(this.container);
    this.selectionActions = useSelectionActions();
    
    // Make selectable
    this.selectableElement = makeSelectable(this.container, 'node');
    
    // Create visual elements
    this.createVisuals(options);
    
    // Initialize state
    this.initializeState(options);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup interactions
    this.setupInteractions();
  }
  
  private createVisuals(options: any) {
    // Create background
    this.background = new Graphics();
    this.background.beginFill(this.getColorByType(options.type));
    this.background.drawRoundedRect(0, 0, 200, 100, 8);
    this.background.endFill();
    this.container.addChild(this.background);
    
    // Create label
    this.labelText = new Text(options.name, {
      fontSize: 14,
      fill: 0xFFFFFF,
      align: 'center'
    });
    this.labelText.anchor.set(0.5);
    this.labelText.x = 100;
    this.labelText.y = 50;
    this.container.addChild(this.labelText);
  }
  
  private initializeState(options: any) {
    // Initialize node state with properties
    this.nodeActions.initialize({
      name: options.name,
      type: options.type,
      created: new Date().toISOString()
    });
    
    // Set initial properties
    this.nodeActions.addProperty({
      key: 'name',
      value: options.name,
      type: 'text',
      id: 'prop-name',
      order: 0
    });
    
    this.nodeActions.addProperty({
      key: 'type',
      value: options.type,
      type: 'text',
      id: 'prop-type',
      order: 1
    });
  }
  
  private setupEventListeners() {
    // Listen for node state changes
    this.eventCleanups.push(
      this.addEventListener('node-state-changed', (event: CustomEvent) => {
        const { nodeId, changeType } = event.detail;
        
        if (nodeId === this.selectableElement.nodeId) {
          this.handleStateChange(changeType, event.detail);
        }
      })
    );
    
    // Listen for selection changes
    this.eventCleanups.push(
      this.addEventListener('pixi-selection-change', (event: CustomEvent) => {
        const { container, action } = event.detail;
        
        if (container === this.container) {
          this.handleSelectionChange(action);
        }
      })
    );
    
    // Listen for theme changes
    this.eventCleanups.push(
      this.addEventListener('theme-changed', (event: CustomEvent) => {
        this.handleThemeChange(event.detail.theme);
      })
    );
  }
  
  private setupInteractions() {
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';
    
    // Click to select
    this.container.on('pointerdown', () => {
      this.selectionActions.toggle(this.selectableElement);
    });
    
    // Double-click to edit
    this.container.on('pointertap', (event) => {
      if (event.detail === 2) { // Double click
        this.startEditing();
      }
    });
    
    // Right-click for context menu
    this.container.on('rightclick', () => {
      this.showContextMenu();
    });
  }
  
  private handleStateChange(changeType: string, details: any) {
    switch (changeType) {
      case 'collapse':
        this.animateCollapse(details.isCollapsed);
        break;
      case 'editing':
        this.showEditingState(details.isEditing);
        break;
      case 'property-updated':
        if (details.property.key === 'name') {
          this.updateLabel(details.property.value);
        }
        break;
      case 'action-buttons':
        this.toggleActionButtons(details.visible);
        break;
    }
  }
  
  private handleSelectionChange(action: string) {
    if (action === 'select') {
      this.showSelectionIndicator();
    } else if (action === 'deselect') {
      this.hideSelectionIndicator();
    }
  }
  
  private handleThemeChange(theme: any) {
    // Update colors based on theme
    this.background.tint = theme.isDarkMode ? 0xCCCCCC : 0xFFFFFF;
    this.labelText.style.fill = theme.isDarkMode ? 0xFFFFFF : 0x000000;
  }
  
  // Action methods
  private startEditing() {
    this.nodeActions.startEditing();
  }
  
  private showContextMenu() {
    console.log('Show context menu for:', this.selectableElement.nodeId);
    // Context menu implementation
  }
  
  private animateCollapse(isCollapsed: boolean) {
    const targetHeight = isCollapsed ? 30 : 100;
    // Animate height change
    console.log(`Animate to height: ${targetHeight}`);
  }
  
  private showEditingState(isEditing: boolean) {
    this.background.tint = isEditing ? 0xFFFFAA : 0xFFFFFF;
  }
  
  private updateLabel(newText: string) {
    this.labelText.text = newText;
  }
  
  private showSelectionIndicator() {
    this.background.tint = 0xAAFFAA;
  }
  
  private hideSelectionIndicator() {
    this.background.tint = 0xFFFFFF;
  }
  
  private toggleActionButtons(visible: boolean) {
    console.log(`Action buttons ${visible ? 'visible' : 'hidden'}`);
    // Toggle action buttons visibility
  }
  
  // Utilities
  private getColorByType(type: string): number {
    const colors = {
      person: 0x0B61A4,
      system: 0x242424,
      container: 0x438DD5,
      component: 0x85BBF0
    };
    return colors[type as keyof typeof colors] || 0x999999;
  }
  
  private addEventListener(type: string, handler: EventListener) {
    window.addEventListener(type, handler);
    return () => window.removeEventListener(type, handler);
  }
  
  // Public API
  public getContainer(): Container {
    return this.container;
  }
  
  public getSelectableElement() {
    return this.selectableElement;
  }
  
  public destroy() {
    // Clean up event listeners
    this.eventCleanups.forEach(cleanup => cleanup());
    
    // Clean up state
    this.nodeActions.destroy?.();
    
    // Clean up PixiJS objects
    this.container.destroy({
      children: true,
      texture: false
    });
    
    console.log('Integrated component destroyed');
  }
}

// Usage example
export function createIntegratedComponents() {
  const components = [
    new IntegratedC4Component({
      name: 'User',
      type: 'person',
      x: 50,
      y: 50
    }),
    new IntegratedC4Component({
      name: 'Web Application',
      type: 'system',
      x: 300,
      y: 50
    }),
    new IntegratedC4Component({
      name: 'Database',
      type: 'container',
      x: 550,
      y: 50
    })
  ];
  
  return components;
}
```

## 🔧 Advanced Patterns

### Example 7: State Synchronization

```typescript
// src/examples/stateSyncExample.ts
import { useNodeState } from '../stores/nodeState';
import { useSelectionState } from '../stores/selectionState';
import { useDeletionState } from '../stores/deletionState';

export class StateSynchronizer {
  private cleanup: (() => void)[] = [];
  
  constructor() {
    this.setupSynchronization();
  }
  
  private setupSynchronization() {
    // Sync deletion with selection
    this.cleanup.push(
      this.addEventListener('element-deletion-started', (event: CustomEvent) => {
        const { element } = event.detail;
        const selectionState = useSelectionState.getState();
        
        // Deselect element being deleted
        if (element.isSelected) {
          selectionState.deselectElement(element);
        }
      })
    );
    
    // Sync deletion with node state
    this.cleanup.push(
      this.addEventListener('element-deletion-completed', (event: CustomEvent) => {
        const { element } = event.detail;
        const nodeState = useNodeState.getState();
        
        // Clean up node state
        if (nodeState.hasNodeState(element.nodeId)) {
          nodeState.removeNodeState(element.nodeId);
        }
      })
    );
    
    // Sync selection with editing mode
    this.cleanup.push(
      this.addEventListener('pixi-selection-change', (event: CustomEvent) => {
        const { action } = event.detail;
        const nodeState = useNodeState.getState();
        
        if (action === 'select') {
          // Exit editing mode for all other nodes
          nodeState.exitAllEditingModes();
        }
      })
    );
  }
  
  private addEventListener(type: string, handler: EventListener) {
    window.addEventListener(type, handler);
    return () => window.removeEventListener(type, handler);
  }
  
  public destroy() {
    this.cleanup.forEach(fn => fn());
  }
}
```

### Example 8: Performance Optimization

```typescript
// src/examples/performanceExample.ts
import { debounce, throttle } from 'lodash';
import { useNodeState } from '../stores/nodeState';

export class PerformanceOptimizedComponent {
  private batchedUpdates: Map<string, any> = new Map();
  private debouncedUpdate: Function;
  private throttledRender: Function;
  
  constructor() {
    // Debounce state updates
    this.debouncedUpdate = debounce(this.processBatchedUpdates.bind(this), 100);
    
    // Throttle rendering
    this.throttledRender = throttle(this.renderUpdates.bind(this), 16); // 60fps
    
    this.setupOptimizedListeners();
  }
  
  private setupOptimizedListeners() {
    // Batch multiple rapid state changes
    window.addEventListener('node-state-changed', (event: CustomEvent) => {
      const { nodeId, changeType } = event.detail;
      
      // Batch updates instead of processing immediately
      this.batchedUpdates.set(nodeId, {
        ...(this.batchedUpdates.get(nodeId) || {}),
        [changeType]: event.detail
      });
      
      // Debounce the actual update
      this.debouncedUpdate();
    });
    
    // Throttle selection updates for smooth interaction
    window.addEventListener('pixi-selection-change', throttle((event: CustomEvent) => {
      this.handleSelectionChange(event.detail);
    }, 50));
  }
  
  private processBatchedUpdates() {
    // Process all batched updates at once
    for (const [nodeId, updates] of this.batchedUpdates) {
      this.processNodeUpdates(nodeId, updates);
    }
    
    // Clear batch
    this.batchedUpdates.clear();
    
    // Trigger render
    this.throttledRender();
  }
  
  private processNodeUpdates(nodeId: string, updates: any) {
    console.log(`Processing batched updates for ${nodeId}:`, updates);
    
    // Apply all updates efficiently
    Object.entries(updates).forEach(([changeType, details]) => {
      this.applyUpdate(nodeId, changeType, details);
    });
  }
  
  private applyUpdate(nodeId: string, changeType: string, details: any) {
    // Efficient update logic here
    console.log(`Apply ${changeType} update for ${nodeId}`);
  }
  
  private handleSelectionChange(details: any) {
    // Efficient selection handling
    console.log('Handle selection change:', details);
  }
  
  private renderUpdates() {
    // Efficient rendering logic
    console.log('Render all updates');
  }
}
```

## 🐛 Debugging Examples

### Example 9: State Debugging Tools

```typescript
// src/examples/debuggingExample.ts
import { useNodeState } from '../stores/nodeState';
import { useSelectionState } from '../stores/selectionState';
import { useDeletionState } from '../stores/deletionState';

export class StateDebugger {
  private eventLog: any[] = [];
  private maxLogSize = 100;
  
  constructor() {
    this.setupDebugging();
    this.addDebugCommands();
  }
  
  private setupDebugging() {
    // Log all state events
    const eventTypes = [
      'node-state-changed',
      'pixi-selection-change',
      'selection-cleared',
      'theme-changed',
      'element-deletion-started',
      'element-deletion-completed',
      'element-deletion-failed'
    ];
    
    eventTypes.forEach(eventType => {
      window.addEventListener(eventType, (event: CustomEvent) => {
        this.logEvent(eventType, event.detail);
      });
    });
  }
  
  private logEvent(type: string, detail: any) {
    const logEntry = {
      timestamp: Date.now(),
      type,
      detail: JSON.parse(JSON.stringify(detail)) // Deep clone
    };
    
    this.eventLog.push(logEntry);
    
    // Limit log size
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }
    
    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[STATE] ${type}:`, detail);
    }
  }
  
  private addDebugCommands() {
    // Add global debug functions
    (window as any).stateDebugger = {
      // Get current store states
      getStates: () => ({
        nodeState: useNodeState.getState(),
        selectionState: useSelectionState.getState(),
        deletionState: useDeletionState.getState()
      }),
      
      // Get event log
      getEventLog: () => this.eventLog,
      
      // Clear event log
      clearLog: () => {
        this.eventLog = [];
        console.log('Event log cleared');
      },
      
      // Find events by type
      findEvents: (type: string) => {
        return this.eventLog.filter(entry => entry.type === type);
      },
      
      // Get events in time range
      getEventsInRange: (startTime: number, endTime: number) => {
        return this.eventLog.filter(entry => 
          entry.timestamp >= startTime && entry.timestamp <= endTime
        );
      },
      
      // Validate state consistency
      validateStates: () => {
        return this.validateStateConsistency();
      },
      
      // Generate state report
      generateReport: () => {
        return this.generateStateReport();
      }
    };
    
    console.log('🐛 State debugger available: window.stateDebugger');
  }
  
  private validateStateConsistency() {
    const nodeState = useNodeState.getState();
    const selectionState = useSelectionState.getState();
    
    const issues: string[] = [];
    
    // Check selection consistency
    const selectedElements = selectionState.getSelectedElements();
    selectedElements.forEach(element => {
      if (!nodeState.hasNodeState(element.nodeId)) {
        issues.push(`Selected element ${element.nodeId} has no node state`);
      }
    });
    
    // Check node state consistency
    const allNodeIds = nodeState.getAllNodeIds();
    allNodeIds.forEach(nodeId => {
      const state = nodeState.getNodeState(nodeId);
      if (!state) {
        issues.push(`Node ${nodeId} listed but has no state`);
      }
    });
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  private generateStateReport() {
    const nodeState = useNodeState.getState();
    const selectionState = useSelectionState.getState();
    const deletionState = useDeletionState.getState();
    
    return {
      timestamp: Date.now(),
      nodeState: {
        totalNodes: nodeState.getNodeCount(),
        editingNodes: nodeState.getAllNodeIds().filter(id => 
          nodeState.isEditing(id)
        ).length,
        collapsedNodes: nodeState.getAllNodeIds().filter(id => 
          nodeState.isCollapsed(id)
        ).length
      },
      selectionState: {
        selectedCount: selectionState.getSelectedCount(),
        selectionMode: selectionState.getSelectionMode()
      },
      deletionState: {
        currentlyDeleting: deletionState.deletingElements.size,
        historyCount: deletionState.deletionHistory.length,
        successfulDeletions: deletionState.deletionHistory.filter(r => r.success).length
      },
      eventLog: {
        totalEvents: this.eventLog.length,
        recentEvents: this.eventLog.slice(-10)
      }
    };
  }
}

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  new StateDebugger();
}
```

## 🧪 Testing Examples

### Example 10: State Testing

```typescript
// src/examples/testingExample.ts
import { useNodeState } from '../stores/nodeState';
import { useSelectionState } from '../stores/selectionState';
import { Container } from 'pixi.js';

export class StateTester {
  
  static runBasicTests() {
    console.log('🧪 Running basic state tests...');
    
    // Test node state
    this.testNodeState();
    
    // Test selection state
    this.testSelectionState();
    
    // Test event system
    this.testEventSystem();
    
    console.log('✅ Basic tests completed');
  }
  
  private static testNodeState() {
    const nodeState = useNodeState.getState();
    const testNodeId = 'test-node-1';
    
    console.log('Testing node state...');
    
    // Test initialization
    nodeState.initializeNodeState(testNodeId);
    console.assert(nodeState.hasNodeState(testNodeId), 'Node state should be initialized');
    
    // Test collapse
    nodeState.setCollapsed(testNodeId, true);
    console.assert(nodeState.isCollapsed(testNodeId), 'Node should be collapsed');
    
    // Test properties
    nodeState.addProperty(testNodeId, {
      key: 'test',
      value: 'value',
      type: 'text',
      id: 'test-prop',
      order: 0
    });
    
    const properties = nodeState.getProperties(testNodeId);
    console.assert(properties.length === 1, 'Should have 1 property');
    
    // Clean up
    nodeState.removeNodeState(testNodeId);
    console.assert(!nodeState.hasNodeState(testNodeId), 'Node state should be removed');
    
    console.log('✅ Node state tests passed');
  }
  
  private static testSelectionState() {
    const selectionState = useSelectionState.getState();
    const container = new Container();
    
    console.log('Testing selection state...');
    
    // Create mock selectable element
    const element = {
      nodeId: 'test-element',
      type: 'node' as const,
      container,
      isSelected: false
    };
    
    // Test selection
    selectionState.selectElement(element);
    console.assert(element.isSelected, 'Element should be selected');
    console.assert(selectionState.getSelectedCount() === 1, 'Should have 1 selected element');
    
    // Test deselection
    selectionState.deselectElement(element);
    console.assert(!element.isSelected, 'Element should be deselected');
    console.assert(selectionState.getSelectedCount() === 0, 'Should have 0 selected elements');
    
    console.log('✅ Selection state tests passed');
  }
  
  private static testEventSystem() {
    console.log('Testing event system...');
    
    let eventReceived = false;
    
    // Setup listener
    const handler = () => {
      eventReceived = true;
    };
    
    window.addEventListener('test-event', handler);
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('test-event'));
    
    // Check
    console.assert(eventReceived, 'Event should be received');
    
    // Clean up
    window.removeEventListener('test-event', handler);
    
    console.log('✅ Event system tests passed');
  }
  
  static runPerformanceTests() {
    console.log('🚀 Running performance tests...');
    
    const nodeState = useNodeState.getState();
    const start = performance.now();
    
    // Create many nodes
    for (let i = 0; i < 1000; i++) {
      nodeState.initializeNodeState(`perf-test-${i}`);
    }
    
    const initTime = performance.now() - start;
    console.log(`Initialized 1000 nodes in ${initTime.toFixed(2)}ms`);
    
    // Test batch operations
    const batchStart = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      nodeState.setCollapsed(`perf-test-${i}`, true);
    }
    
    const batchTime = performance.now() - batchStart;
    console.log(`Batch collapsed 1000 nodes in ${batchTime.toFixed(2)}ms`);
    
    // Clean up
    const cleanupStart = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      nodeState.removeNodeState(`perf-test-${i}`);
    }
    
    const cleanupTime = performance.now() - cleanupStart;
    console.log(`Cleaned up 1000 nodes in ${cleanupTime.toFixed(2)}ms`);
    
    console.log('✅ Performance tests completed');
  }
}

// Add to window for console access
(window as any).stateTester = StateTester;
```

---

## 🎯 Usage Tips

1. **Always use composables** แทนการเข้าถึง store โดยตรง
2. **Listen for events** เพื่อ sync ระหว่าง components
3. **Clean up properly** ลบ event listeners เมื่อ component ถูก destroy
4. **Batch operations** เมื่อทำการเปลี่ยนแปลงหลายอย่างพร้อมกัน
5. **Use debugging tools** เพื่อช่วยในการพัฒนา

## 🔗 Related Documentation

- [State Management Main](../state-management.md)
- [Store Reference](../state-management.md#store-reference)
- [Troubleshooting Guide](../state-management.md#troubleshooting)

---

*📝 Examples Version: 1.0 | Last Updated: [Date] | Status: ✅ Ready*