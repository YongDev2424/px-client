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

// Add Person Button
const addPersonButton = document.getElementById('add-person-btn');
addPersonButton?.addEventListener('click', () => {
  createAndAddC4Box('Person', 0x0B61A4, 'person');
});

// Add System Button
const addSystemButton = document.getElementById('add-system-btn');
addSystemButton?.addEventListener('click', () => {
  createAndAddC4Box('Software System', 0x2E7D32, 'system');
});

// Add Container Button
const addContainerButton = document.getElementById('add-container-btn');
addContainerButton?.addEventListener('click', () => {
  createAndAddC4Box('Container', 0xF57C00, 'container');
});

// Add Component Button
const addComponentButton = document.getElementById('add-component-btn');
addComponentButton?.addEventListener('click', () => {
  createAndAddC4Box('Component', 0x616161, 'component');
});

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
});