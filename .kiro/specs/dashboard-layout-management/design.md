# Design Document

## Overview

Dashboard Layout Management system จะปรับปรุงโครงสร้าง UI ปัจจุบันจากการมี toolbar แบบ floating ไปเป็นระบบ layout แบบ professional ที่แบ่งพื้นที่เป็น 3 ส่วนหลัก: Left Panel, Top Toolbar และ Canvas Area พร้อมระบบ responsive และ accessibility ที่สมบูรณ์

## Architecture

### Current State Analysis
- **ปัจจุบัน**: PixiJS canvas เต็มหน้าจอ + floating toolbar (Tailwind CSS)
- **เป้าหมาย**: Layout system แบบ split-panel พร้อม hierarchical component tree

### New Architecture Components
```
┌─────────────────────────────────────────────────────────┐
│                    Browser Window                       │
├─────────────┬───────────────────────────────────────────┤
│             │              Top Toolbar (5%)             │
│   Left      ├───────────────────────────────────────────┤
│   Panel     │                                           │
│   (20%)     │            Canvas Area                    │
│             │          (Grid + PixiJS)                  │
│             │                                           │
│             │                    ┌─────────────────────┐│
│             │                    │   Zoom Controls     ││
│             │                    │  (Bottom Right)     ││
└─────────────┴────────────────────┴─────────────────────┘
```

## Components and Interfaces

### 1. Layout Manager (`src/layout/LayoutManager.ts`)

**Purpose**: จัดการการแบ่งพื้นที่และ responsive behavior

```typescript
interface LayoutConfig {
  leftPanelWidth: number;        // 20% default
  toolbarHeight: number;         // 5% of right area
  minLeftPanelWidth: number;     // 200px minimum
  maxLeftPanelWidth: number;     // 400px maximum
  animationDuration: number;     // 300ms
}

interface LayoutState {
  isLeftPanelVisible: boolean;
  currentLeftPanelWidth: number;
  canvasArea: DOMRect;
  toolbarArea: DOMRect;
}

class LayoutManager {
  toggleLeftPanel(): void;
  resizeLeftPanel(width: number): void;
  getCanvasArea(): DOMRect;
  onWindowResize(): void;
}
```

### 2. Left Panel System (`src/components/LeftPanel/`)

#### 2.1 Panel Container (`LeftPanel.ts`)
```typescript
interface PanelProps {
  isVisible: boolean;
  width: number;
  onToggle: () => void;
  onResize: (width: number) => void;
}

class LeftPanel {
  private componentTree: ComponentTree;
  private resizeHandle: ResizeHandle;
  
  render(): HTMLElement;
  toggle(): void;
  updateWidth(width: number): void;
}
```

#### 2.2 Component Tree (`ComponentTree.ts`)
**⚠️ PixiJS Integration**: ต้องใช้ existing patterns จาก `src/components/C4Box.ts`

```typescript
interface C4Component {
  id: string;
  name: string;
  type: 'level1' | 'level2' | 'level3' | 'level4';
  parentId?: string;
  children: C4Component[];
  isExpanded: boolean;
  pixiNode?: Container;  // Reference ไปยัง PixiJS Container จาก createC4Box()
}

interface TreeNodeProps {
  component: C4Component;
  level: number;
  onSelect: (component: C4Component) => void;
  onToggle: (componentId: string) => void;
}

class ComponentTree {
  private components: Map<string, C4Component>;
  private pixiApp: Application;
  
  constructor(pixiApp: Application) {
    this.pixiApp = pixiApp;
  }
  
  // Integration กับ existing C4Box creation
  addComponentFromPixiNode(pixiNode: Container): void {
    // ใช้ metadata จาก (pixiNode as any).nodeData
    // ตาม pattern ใน C4Box.ts
    const nodeData = (pixiNode as any).nodeData;
    if (nodeData) {
      const component: C4Component = {
        id: this.generateId(),
        name: nodeData.labelText,
        type: this.mapNodeTypeToC4Level(nodeData.nodeType),
        pixiNode: pixiNode,
        children: [],
        isExpanded: false
      };
      this.components.set(component.id, component);
    }
  }
  
  // Sync กับ existing selectionManager
  syncWithSelectionManager(): void {
    // ใช้ existing selectionManager จาก src/utils/selectionManager.ts
    // เพื่อ highlight nodes เมื่อ select ใน tree
  }
  
  addComponent(component: C4Component): void;
  removeComponent(id: string): void;
  updateHierarchy(): void;
  renderTree(): HTMLElement;
}
```

### 3. Enhanced Toolbar (`src/components/Toolbar/`)

```typescript
interface ToolbarConfig {
  height: string;           // '5%' of right area
  backgroundColor: string;  // Dark theme
  tools: ToolConfig[];
}

interface ToolConfig {
  id: string;
  label: string;
  icon: string;
  tooltip: string;
  action: () => void;
  isActive?: boolean;
}

class Toolbar {
  private tools: Map<string, ToolConfig>;
  
  addTool(tool: ToolConfig): void;
  setActiveTool(toolId: string): void;
  render(): HTMLElement;
}
```

### 4. Canvas Enhancement (`src/components/Canvas/`)

#### 4.1 Canvas Container (`CanvasContainer.ts`)
**⚠️ PixiJS v8 Compliance**: ต้องอ่าน `.claude/pixijs-v8-patterns.md` ก่อนเขียนโค้ด

```typescript
interface CanvasConfig {
  gridSize: number;         // 20px default
  gridColor: string;        // Subtle gray
  backgroundColor: string;  // Dark theme
  showGrid: boolean;
  snapToGrid: boolean;
}

class CanvasContainer {
  private pixiApp: Application;
  private gridOverlay: HTMLElement;
  private zoomControls: ZoomControls;
  
  // PixiJS v8 Pattern: ใช้ await app.init() แทน constructor options
  async initializePixiApp(config: CanvasConfig): Promise<void> {
    this.pixiApp = new Application();
    await this.pixiApp.init({
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor,
      antialias: true,
    });
    
    // ตั้งค่า stage ตาม v8 patterns
    this.pixiApp.stage.eventMode = 'static';
    this.pixiApp.stage.hitArea = this.pixiApp.screen;
  }
  
  initializeGrid(): void;
  updateCanvasSize(area: DOMRect): void;
  enableSnapToGrid(): void;
  
  // Integration กับ existing stageManager
  integrateWithStageManager(): void {
    // ใช้ existing stageManager.initialize(this.pixiApp)
    // ตาม pattern ใน src/main.ts
  }
}
```

#### 4.2 Zoom Controls (`ZoomControls.ts`)
```typescript
interface ZoomState {
  currentZoom: number;      // 1.0 = 100%
  minZoom: number;         // 0.25 = 25%
  maxZoom: number;         // 4.0 = 400%
  zoomStep: number;        // 0.25 = 25%
}

class ZoomControls {
  private state: ZoomState;
  private pixiApp: Application;
  
  constructor(pixiApp: Application) {
    this.pixiApp = pixiApp;
    this.setupZoomEvents();
  }
  
  // PixiJS v8 Pattern: ใช้ stage.scale สำหรับ zoom
  private applyZoomToStage(zoomLevel: number): void {
    this.pixiApp.stage.scale.set(zoomLevel);
  }
  
  zoomIn(): void;
  zoomOut(): void;
  resetZoom(): void;
  setZoom(level: number): void;
  render(): HTMLElement;
}
```

## Data Models

### 1. Layout State Model
```typescript
interface LayoutState {
  leftPanel: {
    isVisible: boolean;
    width: number;
    isResizing: boolean;
  };
  toolbar: {
    height: number;
    activeTool: string | null;
  };
  canvas: {
    area: DOMRect;
    zoom: number;
    gridVisible: boolean;
    snapToGrid: boolean;
  };
  theme: 'dark' | 'light';
}
```

### 2. Component Hierarchy Model
```typescript
interface ComponentHierarchy {
  level1Components: Map<string, C4Level1>;
  relationships: Map<string, ComponentRelationship>;
  visualState: Map<string, ComponentVisualState>;
}

interface C4Level1 {
  id: string;
  name: string;
  description: string;
  level2Components: C4Level2[];
  color: string;
  position: Point;
}

interface ComponentRelationship {
  sourceId: string;
  targetId: string;
  type: 'contains' | 'uses' | 'depends';
  label: string;
}
```

## Error Handling

### 1. Layout Errors
```typescript
class LayoutError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_DIMENSIONS' | 'RESIZE_FAILED' | 'PANEL_OVERLAP'
  ) {
    super(message);
  }
}

// Error Recovery Strategies
const errorHandlers = {
  INVALID_DIMENSIONS: () => resetToDefaultLayout(),
  RESIZE_FAILED: () => revertToPreviousState(),
  PANEL_OVERLAP: () => forceNonOverlappingLayout()
};
```

### 2. Component Tree Errors
```typescript
class ComponentTreeError extends Error {
  constructor(
    message: string,
    public code: 'CIRCULAR_REFERENCE' | 'INVALID_HIERARCHY' | 'MISSING_PARENT'
  ) {
    super(message);
  }
}
```

### 3. Responsive Breakpoints
```typescript
const breakpoints = {
  mobile: 768,    // Hide left panel, stack toolbar
  tablet: 1024,   // Reduce left panel width
  desktop: 1200   // Full layout
};

const responsiveHandlers = {
  onMobile: () => forceHideLeftPanel(),
  onTablet: () => reduceLeftPanelWidth(),
  onDesktop: () => enableFullLayout()
};
```

## Testing Strategy

### 1. Unit Tests
- **Layout Manager**: การคำนวณพื้นที่, responsive behavior
- **Component Tree**: การจัดการ hierarchy, CRUD operations
- **Zoom Controls**: การคำนวณ zoom levels, boundary checks

### 2. Integration Tests
- **Panel Interactions**: การย่อ/ขยาย panel ไม่ทำให้ canvas overlap
- **Canvas Coordination**: การเปลี่ยนขนาด canvas เมื่อ layout เปลี่ยน
- **Theme Consistency**: การใช้สีและ contrast ตาม design system

### 3. Visual Regression Tests
- **Layout Snapshots**: ตรวจสอบ layout ในขนาดหน้าจอต่างๆ
- **Animation Smoothness**: ตรวจสอบ transition animations
- **Accessibility**: ตรวจสอบ contrast ratio และ keyboard navigation

### 4. Performance Tests
- **Layout Recalculation**: วัดเวลาในการคำนวณ layout ใหม่
- **Tree Rendering**: วัดประสิทธิภาพการ render component tree
- **Memory Usage**: ตรวจสอบ memory leaks ในระบบ layout

## Design System Implementation

### 1. Color Palette (Dark Theme)
```css
:root {
  /* Primary Colors */
  --bg-primary: #1e1e1e;      /* Main background */
  --bg-secondary: #252526;     /* Panel backgrounds */
  --bg-tertiary: #2d2d30;      /* Toolbar background */
  
  /* Text Colors */
  --text-primary: #cccccc;     /* Primary text (4.5:1 contrast) */
  --text-secondary: #969696;   /* Secondary text */
  --text-accent: #4fc3f7;      /* Links and accents */
  
  /* C4 Level Colors */
  --c4-level1: #0B61A4;        /* Person/Actor - Blue */
  --c4-level2: #2E7D32;        /* System - Green */
  --c4-level3: #F57C00;        /* Container - Orange */
  --c4-level4: #616161;        /* Component - Gray */
  
  /* UI Element Colors */
  --border-color: #3e3e42;     /* Borders and dividers */
  --hover-color: #094771;      /* Hover states */
  --selected-color: #0e639c;   /* Selected states */
}
```

### 2. Typography Scale
```css
.typography {
  --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  
  /* Sizes following 8px grid */
  --text-xs: 12px;    /* Small labels */
  --text-sm: 14px;    /* Body text */
  --text-base: 16px;  /* Default */
  --text-lg: 18px;    /* Headings */
  --text-xl: 20px;    /* Large headings */
}
```

### 3. Spacing System (8px Grid)
```css
.spacing {
  --space-1: 8px;     /* xs */
  --space-2: 16px;    /* sm */
  --space-3: 24px;    /* md */
  --space-4: 32px;    /* lg */
  --space-5: 40px;    /* xl */
}
```

### 4. Component Styling Guidelines

#### Left Panel Tree Nodes
```css
.tree-node {
  padding: var(--space-1) var(--space-2);
  border-radius: 4px;
  transition: background-color 150ms ease;
}

.tree-node:hover {
  background-color: var(--hover-color);
}

.tree-node.selected {
  background-color: var(--selected-color);
}

.tree-node-icon {
  width: 16px;
  height: 16px;
  margin-right: var(--space-1);
}
```

#### Toolbar Buttons
```css
.toolbar-button {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: all 150ms ease;
}

.toolbar-button:hover {
  background: var(--hover-color);
  border-color: var(--text-accent);
}

.toolbar-button.active {
  background: var(--selected-color);
  border-color: var(--text-accent);
}
```

## Implementation Phases

### Phase 1: Core Layout Structure
1. สร้าง LayoutManager และ basic HTML structure
2. ใช้ CSS Grid/Flexbox สำหรับ responsive layout
3. เพิ่ม panel toggle functionality

### Phase 2: Left Panel System
1. สร้าง ComponentTree และ TreeNode components
2. เพิ่ม drag-to-resize functionality
3. ใช้ virtual scrolling สำหรับ large trees

### Phase 3: Enhanced Canvas
1. เพิ่ม grid overlay system
2. สร้าง ZoomControls component
3. ปรับปรุง PixiJS integration

### Phase 4: Polish & Accessibility
1. เพิ่ม keyboard navigation
2. ปรับปรุง animations และ transitions
3. ทดสอบ accessibility compliance

## Technical Considerations

### 1. PixiJS v8 Compliance (Critical Memory Constraint)
**⚠️ Protocol สำหรับการเขียนโค้ด PixiJS:**
1. **อ่าน `.claude/pixijs-v8-patterns.md` เสมอก่อนเขียนโค้ด**
2. ถ้าไม่พบ class ที่ต้องการในคู่มือ → อ่าน https://pixijs.download/release/docs/index.html
3. ใช้โค้ดในโปรเจคเป็นต้นแบบ syntax เสมอ
4. ห้ามเดาหรือใช้ความรู้ v7 เก่า

**Key v8 Patterns ที่ต้องใช้:**
- Application: `await app.init()` แทน constructor options
- Graphics: `.fill(color).rect().fill()` แทน beginFill/endFill
- Events: `FederatedPointerEvent` และ `event.stopPropagation()`
- Position: `getGlobalPosition()` แทน toGlobal ในบางกรณี

### 2. Integration กับ Existing Codebase
- **StageManager**: ใช้ existing `stageManager.initialize(app)` pattern
- **SelectionManager**: ใช้ existing `selectionManager` สำหรับ node selection
- **EdgeState**: ใช้ existing `edgeStateManager` สำหรับ edge creation
- **Component Patterns**: ใช้ existing `createC4Box()` และ metadata patterns

### 3. Performance Optimizations
- **Virtual Scrolling**: สำหรับ component tree ที่มีจำนวนมาก
- **Debounced Resize**: ป้องกัน excessive layout recalculation
- **CSS Transforms**: ใช้สำหรับ animations แทน layout properties
- **PixiJS Optimization**: ใช้ `eventMode: 'none'` สำหรับ non-interactive objects

### 4. Browser Compatibility
- **CSS Grid Support**: Fallback เป็น Flexbox สำหรับ older browsers
- **ResizeObserver**: Polyfill สำหรับ browsers ที่ไม่รองรับ
- **CSS Custom Properties**: Fallback colors สำหรับ IE11

### 5. Accessibility Features
- **ARIA Labels**: สำหรับ screen readers
- **Keyboard Navigation**: Tab order และ focus management
- **High Contrast**: รองรับ Windows high contrast mode
- **Reduced Motion**: รองรับ prefers-reduced-motion