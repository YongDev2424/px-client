// src/main.ts
import { Application } from 'pixi.js';
import { createC4Box } from './components/C4Box';
import './style.css';
import { stageManager } from './utils/stageManager';
import { LayoutManager } from './layout/LayoutManager';

// --- Initialize Layout System ---
let layoutManager: LayoutManager;
let leftPanel: any; // Will be imported from LeftPanel

function initializeLayout() {
  try {
    layoutManager = LayoutManager.getInstance();
    console.log('✅ Layout Manager initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Layout Manager:', error);
    return;
  }
}

// --- Update Canvas Size ---
function updateCanvasSize() {
  if (!layoutManager) return;
  
  const canvasArea = layoutManager.getCanvasArea();
  if (app && app.renderer) {
    app.renderer.resize(canvasArea.width, canvasArea.height);
  }
}

// --- Setup PixiJS Application ---
const canvasContainer = document.getElementById('canvas-container');
if (!canvasContainer) {
  throw new Error('Canvas container not found');
}

// Get initial canvas dimensions
const rect = canvasContainer.getBoundingClientRect();
const width = rect.width || window.innerWidth;
const height = rect.height || window.innerHeight;
const app = new Application();

await app.init({
  width,
  height,
  backgroundColor: 0x1e1e1e, // Match CSS --bg-primary
  antialias: true,
});

// Append canvas to the canvas container instead of body
canvasContainer.appendChild(app.canvas);

// --- Initialize Layout System ---
initializeLayout();

// --- Initialize Canvas Container (Optional Enhancement) ---
let canvasContainerEnhancement: any = null;

async function initializeCanvasEnhancement() {
  try {
    if (!canvasContainer) {
      console.error('❌ Canvas container not found for enhancement');
      return;
    }
    
    const { CanvasContainer } = await import('./components/CanvasContainer');
    canvasContainerEnhancement = new CanvasContainer(app, canvasContainer);
    
    // Optional: Enable grid and snap features (disabled by default to preserve existing behavior)
    // canvasContainerEnhancement.enableGrid(true);
    // canvasContainerEnhancement.enableSnapToGrid(true);
    
    console.log('✅ CanvasContainer enhancement initialized (features disabled by default)');
  } catch (error) {
    console.error('❌ Failed to initialize CanvasContainer enhancement:', error);
  }
}

// Initialize Canvas Enhancement after app is ready
initializeCanvasEnhancement();

// --- Initialize Zoom Controls (Optional Enhancement) ---
let zoomControls: any = null;

async function initializeZoomControls() {
  try {
    const { ZoomControls } = await import('./components/ZoomControls');
    zoomControls = new ZoomControls(app, {
      position: 'bottom-right',
      enableMouseWheel: true,
      showTooltips: true,
      smoothTransitions: true,
      minZoom: 0.25,
      maxZoom: 4.0,
      zoomStep: 0.25
    });
    
    console.log('✅ ZoomControls enhancement initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize ZoomControls enhancement:', error);
  }
}

// Initialize Zoom Controls after app is ready
initializeZoomControls();

// --- Initialize Left Panel with ComponentTree ---
async function initializeLeftPanel() {
  try {
    const { LeftPanel } = await import('./components/LeftPanel');
    leftPanel = new LeftPanel('left-panel', app);
    console.log('✅ Left Panel with ComponentTree initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Left Panel:', error);
  }
}

// Initialize Left Panel after app is ready
initializeLeftPanel();

// --- Initialize Stage Manager for Edge System ---
stageManager.initialize(app);
console.log('🎯 Edge System พร้อมใช้งาน - คลิกที่จุดเชื่อมต่อเพื่อสร้าง Edge!');

// --- Connect HTML Buttons to PixiJS ---

// Helper function to create C4Box and add to tree
function createAndAddC4Box(name: string, color: number, type: string): void {
  const newBox = createC4Box(app, name, color);
  
  // Set node type in metadata for proper tree categorization
  const nodeData = (newBox as any).nodeData;
  if (nodeData) {
    nodeData.nodeType = type;
  }
  
  app.stage.addChild(newBox);
  
  // Add to ComponentTree if available
  if (leftPanel && leftPanel.getComponentTree) {
    const componentTree = leftPanel.getComponentTree();
    if (componentTree) {
      componentTree.addComponentFromPixiNode(newBox);
    }
  }
  
  console.log(`เพิ่ม ${name} Node ใหม่และเพิ่มเข้า ComponentTree`);
}

// Enhanced helper function using C4BoxFactory
async function createAndAddEnhancedC4Box(name: string, type: 'person' | 'system' | 'container' | 'component'): Promise<void> {
  try {
    const { C4BoxFactory } = await import('./utils/C4BoxFactory');
    
    // สร้าง enhanced C4Box
    const newBox = C4BoxFactory.createEnhancedC4Box(app, name, type, true);
    
    app.stage.addChild(newBox);
    
    // Add to ComponentTree if available
    if (leftPanel && leftPanel.getComponentTree) {
      const componentTree = leftPanel.getComponentTree();
      if (componentTree) {
        componentTree.addComponentFromPixiNode(newBox);
      }
    }
    
    console.log(`✨ เพิ่ม Enhanced ${name} Node ใหม่และเพิ่มเข้า ComponentTree`);
  } catch (error) {
    console.error('❌ Failed to create enhanced C4Box:', error);
    // Fallback to standard creation
    createAndAddC4Box(name, 0x4A90E2, type);
  }
}

// Demo function to test enhancement system
async function createEnhancementDemo(): Promise<void> {
  try {
    const { C4BoxFactory } = await import('./utils/C4BoxFactory');
    
    console.log('🎨 Creating C4 Enhancement Demo...');
    
    // Validate themes first
    C4BoxFactory.validateThemeCompliance();
    
    // Create demo boxes with enhanced styling
    const demoBoxes = C4BoxFactory.createDemoBoxes(app, true);
    
    // Position them in a grid
    demoBoxes.forEach((box, index) => {
      box.x = 100 + (index % 2) * 300;
      box.y = 100 + Math.floor(index / 2) * 150;
      app.stage.addChild(box);
      
      // Add to ComponentTree if available
      if (leftPanel && leftPanel.getComponentTree) {
        const componentTree = leftPanel.getComponentTree();
        if (componentTree) {
          componentTree.addComponentFromPixiNode(box);
        }
      }
    });
    
    console.log('✅ Enhancement demo created successfully');
  } catch (error) {
    console.error('❌ Failed to create enhancement demo:', error);
  }
}

// Add Person Button - Enhanced Version
const addPersonButton = document.getElementById('add-person-btn');
addPersonButton?.addEventListener('click', () => {
  createAndAddEnhancedC4Box('Person', 'person');
});

// Add System Button - Enhanced Version
const addSystemButton = document.getElementById('add-system-btn');
addSystemButton?.addEventListener('click', () => {
  createAndAddEnhancedC4Box('Software System', 'system');
});

// Add Container Button - Enhanced Version
const addContainerButton = document.getElementById('add-container-btn');
addContainerButton?.addEventListener('click', () => {
  createAndAddEnhancedC4Box('Container', 'container');
});

// Add Component Button - Enhanced Version
const addComponentButton = document.getElementById('add-component-btn');
addComponentButton?.addEventListener('click', () => {
  createAndAddEnhancedC4Box('Component', 'component');
});

// Add Demo Button for testing enhancements
const demoButton = document.getElementById('demo-btn');
if (!demoButton) {
  // Create demo button if it doesn't exist
  const toolbar = document.querySelector('.toolbar');
  if (toolbar) {
    const newDemoButton = document.createElement('button');
    newDemoButton.id = 'demo-btn';
    newDemoButton.textContent = '🎨 Demo Enhanced';
    newDemoButton.className = 'toolbar-button';
    newDemoButton.addEventListener('click', createEnhancementDemo);
    toolbar.appendChild(newDemoButton);
    console.log('✅ Added demo button to toolbar');
  }
} else {
  demoButton.addEventListener('click', createEnhancementDemo);
}

// --- Handle Layout Canvas Resize Events ---
window.addEventListener('layout-canvas-resize', () => {
  updateCanvasSize();
});

// --- Cleanup on Window Unload ---
window.addEventListener('beforeunload', () => {
  stageManager.destroy();
  if (layoutManager) {
    layoutManager.destroy();
  }
  if (leftPanel && leftPanel.destroy) {
    leftPanel.destroy();
  }
  if (canvasContainerEnhancement && canvasContainerEnhancement.destroy) {
    canvasContainerEnhancement.destroy();
  }
  if (zoomControls && zoomControls.destroy) {
    zoomControls.destroy();
  }
});