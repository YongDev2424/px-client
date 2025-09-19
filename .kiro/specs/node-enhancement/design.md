# Design Document

## Overview

The Node Enhancement feature extends the existing C4Box component with advanced interaction capabilities including collapsible/expandable states, contextual action buttons, and dynamic property management. The design follows the existing architecture patterns using PixiJS v8 Container-based components, event-driven communication, and the established manager pattern for state coordination.

## Architecture

### Component Architecture

The enhancement follows an **additive approach** that extends existing functionality without breaking current behavior:

```
C4Box (existing)
├── C4BoxGraphics (existing rectangle/outline)
├── EditableLabel (existing text)
├── ConnectionPoints (existing 4-way connections)
└── NodeEnhancementLayer (new)
    ├── CollapseExpandButton
    ├── ActionButtonsContainer
    │   ├── EditButton
    │   └── DeleteButton
    ├── PropertyContainer
    │   ├── PropertyList
    │   └── PropertyEditor
    └── StateIndicators
```

### State Management Integration

The design integrates with existing managers:
- **SelectionManager**: Enhanced to trigger action button visibility
- **StageManager**: Handles global events for property editing
- **New NodeStateManager**: Manages collapse/expand and property states

## Components and Interfaces

### 1. NodeStateManager

**Purpose**: Centralized state management for enhanced node features

```typescript
interface NodeState {
  isCollapsed: boolean;
  isEditing: boolean;
  properties: Map<string, PropertyValue>;
  actionButtonsVisible: boolean;
}

interface PropertyValue {
  key: string;
  value: string;
  type: 'text' | 'number' | 'boolean';
}

class NodeStateManager {
  private nodeStates: Map<Container, NodeState>;
  
  // State management methods
  setCollapsed(node: Container, collapsed: boolean): void;
  toggleCollapse(node: Container): void;
  setEditing(node: Container, editing: boolean): void;
  addProperty(node: Container, property: PropertyValue): void;
  removeProperty(node: Container, key: string): void;
  updateProperty(node: Container, key: string, value: string): void;
}
```

### 2. CollapseExpandButton Component

**Purpose**: Toggle button for node collapse/expand state

```typescript
interface CollapseExpandButtonOptions {
  size: number;
  position: 'top-right' | 'top-left';
  expandedIcon: string; // Unicode or symbol
  collapsedIcon: string;
}

class CollapseExpandButton extends Container {
  private buttonGraphics: Graphics;
  private iconText: Text;
  private isCollapsed: boolean;
  
  constructor(options: CollapseExpandButtonOptions);
  updateState(collapsed: boolean): void;
  private createButtonGraphics(): void;
  private setupEvents(): void;
}
```

### 3. ActionButtonsContainer Component

**Purpose**: Edit and delete buttons shown when node is selected

```typescript
interface ActionButtonOptions {
  buttonSize: number;
  spacing: number;
  position: 'top' | 'bottom' | 'right';
  showAnimation: boolean;
}

class ActionButtonsContainer extends Container {
  private editButton: ActionButton;
  private deleteButton: ActionButton;
  private isVisible: boolean;
  
  constructor(options: ActionButtonOptions);
  show(animated?: boolean): Promise<void>;
  hide(animated?: boolean): Promise<void>;
  private createButtons(): void;
  private positionButtons(): void;
}

class ActionButton extends Container {
  private buttonGraphics: Graphics;
  private iconGraphics: Graphics;
  
  constructor(type: 'edit' | 'delete', size: number);
  private createIcon(): void;
  private setupHoverEffects(): void;
}
```

### 4. PropertyContainer Component

**Purpose**: Dynamic property management interface

```typescript
interface PropertyContainerOptions {
  maxVisibleProperties: number;
  enableScrolling: boolean;
  propertyHeight: number;
  editMode: boolean;
}

class PropertyContainer extends Container {
  private propertyList: PropertyList;
  private propertyEditor: PropertyEditor;
  private scrollContainer: Container;
  
  constructor(options: PropertyContainerOptions);
  addProperty(property: PropertyValue): void;
  removeProperty(key: string): void;
  enterEditMode(): void;
  exitEditMode(): void;
  private updateLayout(): void;
}

class PropertyList extends Container {
  private properties: Map<string, PropertyItem>;
  
  renderProperties(properties: PropertyValue[]): void;
  private createPropertyItem(property: PropertyValue): PropertyItem;
}

class PropertyEditor extends Container {
  private keyInput: TextInput;
  private valueInput: TextInput;
  private saveButton: ActionButton;
  private cancelButton: ActionButton;
  
  editProperty(property?: PropertyValue): void;
  private validateInput(): boolean;
  private saveProperty(): void;
}
```

### 5. NodeEnhancer (Main Integration Class)

**Purpose**: Coordinates all enhancement features for a C4Box

```typescript
interface NodeEnhancementOptions {
  enableCollapse: boolean;
  enableActionButtons: boolean;
  enableProperties: boolean;
  animationDuration: number;
  maxProperties: number;
}

class NodeEnhancer {
  private targetNode: Container;
  private collapseButton?: CollapseExpandButton;
  private actionButtons?: ActionButtonsContainer;
  private propertyContainer?: PropertyContainer;
  private originalBounds: Rectangle;
  
  static enhance(node: Container, options: NodeEnhancementOptions): NodeEnhancer;
  
  private setupCollapseExpand(): void;
  private setupActionButtons(): void;
  private setupPropertyManagement(): void;
  private setupSelectionIntegration(): void;
  private handleCollapse(animated: boolean): void;
  private handleExpand(animated: boolean): void;
  private updateNodeSize(): void;
}
```

## Data Models

### Node Enhancement Data Structure

```typescript
interface EnhancedNodeData extends NodeData {
  // Existing fields
  labelText: string;
  boxColor: number;
  nodeType: string;
  
  // New enhancement fields
  isCollapsed: boolean;
  properties: PropertyValue[];
  enhancementOptions: NodeEnhancementOptions;
  originalBounds: { width: number; height: number };
  collapsedBounds: { width: number; height: number };
}

interface PropertyValue {
  key: string;
  value: string;
  type: 'text' | 'number' | 'boolean';
  id: string; // Unique identifier
  order: number; // Display order
}
```

### State Persistence

Properties and node states will be stored in the existing `(container as any).nodeData` pattern:

```typescript
// Enhanced node data storage
(container as any).nodeData = {
  ...existingNodeData,
  isCollapsed: false,
  properties: [
    { key: 'Technology', value: 'React', type: 'text', id: 'prop1', order: 0 },
    { key: 'Port', value: '3000', type: 'number', id: 'prop2', order: 1 }
  ],
  enhancementOptions: { ... }
};
```

## Error Handling

### Validation and Error States

1. **Property Key Validation**
   - Duplicate key detection
   - Reserved keyword checking
   - Character limit enforcement

2. **State Transition Errors**
   - Invalid collapse/expand operations
   - Concurrent editing prevention
   - Animation interruption handling

3. **UI Error Feedback**
   - Visual error indicators
   - Toast notifications for validation errors
   - Graceful degradation for unsupported operations

### Error Recovery Mechanisms

```typescript
class ErrorHandler {
  static handlePropertyError(error: PropertyError, node: Container): void;
  static handleStateError(error: StateError, node: Container): void;
  static recoverFromInvalidState(node: Container): void;
}

interface PropertyError {
  type: 'duplicate_key' | 'invalid_value' | 'max_properties';
  message: string;
  propertyKey?: string;
}
```

## Testing Strategy

### Unit Testing Approach

1. **Component Testing**
   - Individual component functionality
   - Event handling verification
   - State management validation

2. **Integration Testing**
   - Manager coordination
   - Event propagation
   - Animation sequences

3. **Visual Testing**
   - Layout calculations
   - Responsive behavior
   - Animation smoothness

### Test Structure

```typescript
describe('NodeEnhancement', () => {
  describe('CollapseExpand', () => {
    it('should toggle node size when collapsed/expanded');
    it('should maintain connection points during state changes');
    it('should animate transitions smoothly');
  });
  
  describe('ActionButtons', () => {
    it('should show buttons when node is selected');
    it('should hide buttons when node is deselected');
    it('should trigger correct actions on button clicks');
  });
  
  describe('PropertyManagement', () => {
    it('should add new properties correctly');
    it('should validate property keys for uniqueness');
    it('should persist properties with node data');
  });
});
```

### Performance Testing

- Memory usage during property operations
- Animation performance with multiple enhanced nodes
- Event handling efficiency with large numbers of nodes

## Implementation Phases

### Phase 1: Core Infrastructure
- NodeStateManager implementation
- Basic collapse/expand functionality
- Integration with existing C4Box

### Phase 2: Action Buttons
- ActionButtonsContainer component
- Selection integration
- Edit/delete functionality

### Phase 3: Property Management
- PropertyContainer and related components
- Property CRUD operations
- Validation and error handling

### Phase 4: Polish and Optimization
- Animation refinements
- Performance optimizations
- Accessibility improvements
- Comprehensive testing

## Integration Points

### Existing System Integration

1. **SelectionManager Integration**
   ```typescript
   // Enhanced selection callbacks
   const selectableElement = makeSelectable(enhancedNode, {
     onSelect: () => {
       nodeEnhancer.showActionButtons();
       // Existing selection logic
     },
     onDeselect: () => {
       nodeEnhancer.hideActionButtons();
       // Existing deselection logic
     }
   });
   ```

2. **StageManager Integration**
   ```typescript
   // Global event handling for property editing
   private handleStagePointerDown(event: FederatedPointerEvent): void {
     // Existing logic...
     
     // New: Exit property editing mode
     nodeStateManager.exitAllEditingModes();
   }
   ```

3. **ComponentTree Integration**
   ```typescript
   // Property change notifications
   const event = new CustomEvent('pixi-node-properties-changed', {
     detail: { 
       container: enhancedNode, 
       properties: newProperties 
     }
   });
   window.dispatchEvent(event);
   ```

### Backward Compatibility

- All existing C4Box functionality remains unchanged
- Enhancement is opt-in through NodeEnhancer.enhance()
- Existing event handlers and behaviors are preserved
- No breaking changes to current API

## Visual Design Specifications

### Collapse/Expand States

**Expanded State:**
- Full node size (200x100 + property height)
- All properties visible
- Expand indicator (▼) in top-right corner

**Collapsed State:**
- Minimal size (200x40)
- Only title and type visible
- Property count badge if properties exist
- Collapse indicator (▶) in top-right corner

### Action Buttons

**Visual Style:**
- Circular buttons with icons
- Semi-transparent background
- Hover effects with scale animation
- Positioned above node with consistent spacing

**Button Specifications:**
- Size: 32x32 pixels
- Edit icon: ✏️ (pencil)
- Delete icon: 🗑️ (trash)
- Colors: Edit (blue), Delete (red)

### Property Display

**Property Item Layout:**
```
[Key]: [Value]                    [Edit] [Delete]
Technology: React                   ✏️     🗑️
Port: 3000                         ✏️     🗑️
```

**Property Editor Layout:**
```
Key:   [________________]
Value: [________________]
       [Save] [Cancel]
```

### Animation Specifications

- **Collapse/Expand**: 300ms ease-in-out
- **Button Show/Hide**: 200ms fade with scale
- **Property Add/Remove**: 250ms slide animation
- **Hover Effects**: 150ms scale and color transitions