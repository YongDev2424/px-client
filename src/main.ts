// src/main.ts
import { Application } from 'pixi.js';
import { createC4Box } from './components/C4Box';
import './style.css';
import { stageManager } from './utils/stageManager';
import { LayoutManager } from './layout/LayoutManager';
import { ThemeManager } from './utils/ThemeManager';
import { toolbarActionButtons } from './components/ToolbarActionButtonsNew';

// Import testing utilities (development only)
if (import.meta.env.DEV) {
  import('./utils/theme-test').then(({ runAllThemeTests }) => {
    // Make theme tests available in console
    (window as any).runThemeTests = runAllThemeTests;
    console.log('🧪 Theme tests available: run `runThemeTests()` in console');
  });

  // Import requirements testing
  import('./test/requirements-test').then(({ runRequirementsTests }) => {
    (window as any).runRequirementsTests = runRequirementsTests;
    console.log('📋 Requirements tests available: run `runRequirementsTests()` in console');
  });

  // Import deletion system testing
  import('./tests/index').then(() => {
    console.log('🗑️ Deletion system tests available: run `window.deletionSystemTests.run()` in console');
  });
}

// --- Initialize Layout System ---
let layoutManager: LayoutManager;
let leftPanel: any; // Will be imported from LeftPanel
let rightPanel: any; // Will be imported from RightPanel
let themeManager: ThemeManager;

function initializeLayout() {
  try {
    layoutManager = LayoutManager.getInstance();
    console.log('✅ Layout Manager initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Layout Manager:', error);
    return;
  }
}

// --- Initialize Theme System ---
function initializeTheme() {
  try {
    themeManager = ThemeManager.getInstance();
    
    // Sync with browser preferences on startup
    themeManager.syncWithBrowserPreferences();
    
    // Set up theme change listeners
    document.addEventListener('themeChanged', (e) => {
      console.log('🎨 Theme changed:', e.detail.theme.name);
      
      // Update PixiJS background color based on theme
      if (app && app.renderer) {
        const isEnhanced = e.detail.isEnhanced;
        const bgColor = isEnhanced ? 0x0d1117 : 0x181818; // Enhanced vs default (อ่อนกว่า Node)
        app.renderer.background.color = bgColor;
      }
    });
    
    document.addEventListener('accessibilityChanged', (e) => {
      console.log('♿ Accessibility settings changed:', e.detail.settings);
    });
    
    console.log('✅ Theme Manager initialized successfully');
    console.log('🎨 Current theme:', themeManager.getCurrentTheme()?.name);
    console.log('♿ Accessibility settings:', themeManager.getAccessibilitySettings());
  } catch (error) {
    console.error('❌ Failed to initialize Theme Manager:', error);
  }
}

// --- Update Canvas Size ---
function updateCanvasSize() {
  if (!layoutManager) return;
  
  const canvasArea = layoutManager.getCanvasArea();
  if (app && app.renderer) {
    app.renderer.resize(canvasArea.width, canvasArea.height);
    
    // อัพเดท grid dots เมื่อ canvas เปลี่ยนขนาด
    if (gridDots) {
      gridDots.updateGrid(canvasArea.width, canvasArea.height);
    }
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
  backgroundColor: 0x181818, // อ่อนกว่า Node เล็กน้อย (Node จะเป็น 0x1e1e1e)
  antialias: true,
});

// Append canvas to the canvas container instead of body
canvasContainer.appendChild(app.canvas);

// --- Setup Canvas Background Click Handler for Deselection ---
function setupCanvasDeselection() {
  // ตั้งค่า stage ให้รับ interaction events
  app.stage.eventMode = 'static';
  app.stage.hitArea = { contains: () => true }; // ทำให้ stage รับ click ได้ทั่วพื้นที่
  
  // เพิ่ม click handler สำหรับ stage (พื้นที่ว่าง)
  app.stage.on('pointerdown', (event) => {
    // ตรวจสอบว่าคลิกที่พื้นที่ว่างจริงๆ (ไม่ใช่ Node หรือ Edge)
    if (event.target === app.stage) {
      console.log('🎯 Clicked on empty canvas - deselecting all elements');
      
      // Import และใช้ selection state
      import('./stores/selectionState').then(({ useSelectionState }) => {
        const selectionState = useSelectionState.getState();
        selectionState.deselectAll();
      });
    }
  });
  
  console.log('✅ Canvas deselection handler setup complete');
}

// เรียกใช้ canvas deselection setup
setupCanvasDeselection();

// --- Initialize Layout System ---
initializeLayout();

// --- Initialize Theme System ---
initializeTheme();

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

// --- Initialize Right Panel for Properties ---
async function initializeRightPanel() {
  try {
    const { RightPanel } = await import('./components/RightPanel');
    rightPanel = new RightPanel(app);
    
    // Make rightPanel globally available for useDrawerActions
    (window as any).rightPanel = rightPanel;
    
    // Listen for property changes from RightPanel
    window.addEventListener('property-changed', async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { elementId, elementType, propertyKey, propertyValue } = customEvent.detail;
      
      console.log('🏷️ Property changed:', {
        elementId,
        elementType,
        propertyKey,
        propertyValue
      });
      
      try {
        // Update property store
        const { usePropertyState } = await import('./stores/propertyState');
        const propertyStore = usePropertyState.getState();
        
        // Check if property exists, if not add it, otherwise update it
        const existingProperty = propertyStore.getProperty(elementId, propertyKey);
        
        if (existingProperty) {
          const result = propertyStore.updateProperty(elementId, propertyKey, propertyValue);
          if (result.success) {
            console.log('✅ Property updated in store:', propertyKey);
          } else {
            console.error('❌ Failed to update property:', result.error);
          }
        } else {
          // Add new property
          const result = propertyStore.addProperty(elementId, {
            key: propertyKey,
            value: propertyValue,
            type: 'text', // Default type, will be inferred
            order: Date.now(),
            metadata: {
              category: 'Basic Properties',
              description: `Property ${propertyKey}`,
              isRequired: false,
              isReadOnly: false
            }
          });
          if (result.success) {
            console.log('✅ New property added to store:', propertyKey);
          } else {
            console.error('❌ Failed to add property:', result.error);
          }
        }
        
        // Update visual component if needed
        // This will update property badges on C4Box components
        const elementContainer = app.stage.children.find(child => 
          (child as any).nodeData?.nodeId === elementId
        );
        
        if (elementContainer && (elementContainer as any).updatePropertyBadges) {
          (elementContainer as any).updatePropertyBadges();
        }
        
      } catch (error) {
        console.error('❌ Error updating property store:', error);
      }
    });
    
    console.log('✅ Right Panel initialized successfully');
    
    // Verify initialization immediately
    setTimeout(() => {
      if (rightPanel) {
        console.log('🎉 RightPanel verification: Initialization successful!');
        console.log('📋 Ready for testing. Available commands:');
        console.log('   - testRightPanel() - Test panel state and elements');
        console.log('   - testCompletePropertyWorkflow() - Full workflow test');
        console.log('   - testPropertyBadgeBehavior() - Test property badge clicks');
      } else {
        console.error('⚠️ RightPanel verification failed: Instance not found');
      }
    }, 100);
    
  } catch (error) {
    console.error('❌ Failed to initialize Right Panel:', error);
    console.log('🔍 Error details:', error);
  }
}

// Initialize Right Panel after app is ready
initializeRightPanel();

// --- Initialize Stage Manager for Edge System ---
stageManager.initialize(app);
console.log('🎯 Edge System พร้อมใช้งาน - คลิกที่จุดเชื่อมต่อเพื่อสร้าง Edge!');


// --- Initialize Grid Dots ---
let gridDots: any = null;

async function initializeGridDots() {
  try {
    const { createGridDots } = await import('./components/GridDots');
    
    // สร้าง grid dots ด้วยการตั้งค่าที่เหมาะสม
    gridDots = createGridDots(app.screen.width, app.screen.height, {
      dotSize: 1.5,        // ขนาดจุดเล็กๆ
      spacing: 30,         // ระยะห่าง 30px
      dotColor: 0xFFFFFF,  // สีขาว
      dotAlpha: 0.12       // โปร่งใสเล็กน้อย
    });
    
    // เพิ่ม grid dots เป็น layer แรก (ด้านหลังสุด)
    app.stage.addChildAt(gridDots.getContainer(), 0);
    
    console.log('✅ Grid dots initialized successfully');
    console.log('📊 Grid settings:', gridDots.getSettings());
  } catch (error) {
    console.error('❌ Failed to initialize grid dots:', error);
  }
}

// Initialize Grid Dots after app is ready
initializeGridDots();

// --- Initialize Toolbar Action Buttons ---
console.log('🔧 Initializing Toolbar Action Buttons...');
try {
  // ToolbarActionButtons จะถูกสร้างอัตโนมัติเมื่อ import
  // เก็บ reference ใน window เพื่อให้ SelectionManager เข้าถึงได้
  (window as any).toolbarActionButtons = toolbarActionButtons;
  
  // ตรวจสอบว่าสร้างสำเร็จ
  if (toolbarActionButtons) {
    console.log('✅ ToolbarActionButtons instance created:', toolbarActionButtons);
  } else {
    console.error('❌ ToolbarActionButtons is null/undefined');
  }
} catch (error) {
  console.error('❌ Failed to initialize ToolbarActionButtons:', error);
}

// เพิ่ม debug commands ใน console
if (import.meta.env.DEV) {
  (window as any).debugSelection = async () => {
    const { selectionManager } = await import('./utils/selectionManager');
    console.log('🔍 Selection Debug:', {
      selectedCount: selectionManager.getSelectedCount(),
      selectedElements: selectionManager.getSelectedElements(),
      toolbarActionButtons: (window as any).toolbarActionButtons,
      toolbarVisible: (window as any).toolbarActionButtons?.getVisibility()
    });
  };
  
  (window as any).testToolbarButtons = () => {
    const c4boxes = app.stage.children.filter(child => 
      (child as any).nodeData && (child as any).nodeData.nodeType === 'c4box'
    );
    
    if (c4boxes.length > 0) {
      console.log('🧪 Testing toolbar buttons with first C4Box...');
      (window as any).toolbarActionButtons.show(c4boxes[0]);
    } else {
      console.log('❌ No C4Box found. Create one first.');
    }
  };
  
  // เพิ่มฟังก์ชันทดสอบ manual
  (window as any).manualShowToolbar = () => {
    const toolbar = document.getElementById('toolbar');
    if (!toolbar) {
      console.error('❌ Toolbar not found');
      return;
    }
    
    // สร้าง action section manually
    let actionSection = document.getElementById('toolbar-action-section');
    if (!actionSection) {
      actionSection = document.createElement('div');
      actionSection.className = 'toolbar-action-section visible';
      actionSection.id = 'toolbar-action-section';
      actionSection.innerHTML = `
        <span class="action-status-text" style="color: rgba(255, 255, 255, 0.8); font-size: 12px; margin-right: 8px;">Selected: Test Node</span>
        <button class="toolbar-btn toolbar-btn-edit" title="Edit Selected Element">
          <span class="btn-icon">✏️</span>
          <span class="btn-label">Edit</span>
        </button>
        <button class="toolbar-btn toolbar-btn-delete" title="Delete Selected Element">
          <span class="btn-icon">🗑️</span>
          <span class="btn-label">Delete</span>
        </button>
      `;
      toolbar.appendChild(actionSection);
      console.log('✅ Manual toolbar section created');
    } else {
      actionSection.classList.add('visible');
      console.log('✅ Manual toolbar section shown');
    }
  };
  
  (window as any).manualHideToolbar = () => {
    const actionSection = document.getElementById('toolbar-action-section');
    if (actionSection) {
      actionSection.classList.remove('visible');
      console.log('✅ Manual toolbar section hidden');
    }
  };
  
  // เพิ่มฟังก์ชันทดสอบ RightPanel
  (window as any).testRightPanel = () => {
    console.log('🔍 Testing RightPanel initialization...');
    
    if (rightPanel) {
      console.log('✅ RightPanel instance found');
      console.log('🗂️ RightPanel state:', {
        isOpen: rightPanel.isOpen(),
        width: rightPanel.getState().width,
        selectedElementId: rightPanel.getSelectedElementId(),
        state: rightPanel.getState()
      });
      
      // Test HTML elements
      const panel = document.getElementById('right-panel');
      const title = document.getElementById('panel-title');
      const content = document.getElementById('property-content');
      
      console.log('🏷️ HTML Elements check:', {
        'right-panel': !!panel,
        'panel-title': !!title,
        'property-content': !!content,
        'panel-classes': panel?.className,
        'is-collapsed': panel?.classList.contains('collapsed')
      });
      
    } else {
      console.log('❌ RightPanel not found');
      console.log('🔍 Checking window.rightPanel:', (window as any).rightPanel);
    }
  };
  
  (window as any).forceOpenPanel = () => {
    if (rightPanel) {
      rightPanel.openPanel();
      console.log('🗂️ Force opened RightPanel');
    } else {
      console.log('❌ RightPanel not found');
    }
  };
  
  // เพิ่มฟังก์ชันทดสอบ double-click integration
  (window as any).testDoubleClickIntegration = () => {
    const c4boxes = app.stage.children.filter(child => 
      (child as any).nodeData && (child as any).nodeData.nodeType === 'c4box'
    );
    
    if (c4boxes.length > 0) {
      const testBox = c4boxes[0];
      const nodeId = (testBox as any).nodeData.nodeId;
      
      console.log('🧪 Testing double-click integration with C4Box:', nodeId);
      
      // Import และทดสอบ drawerActions
      import('./composables/useDrawerActions').then(({ useDrawerActions }) => {
        const drawerActions = useDrawerActions();
        const result = drawerActions.openForNode(testBox, nodeId, {
          tab: 'properties',
          nodeName: 'Test Node',
          autoFocus: true
        });
        
        console.log('🗂️ Manual drawer open result:', result);
      });
    } else {
      console.log('❌ No C4Box found. Create one first.');
    }
  };
  
  // เพิ่มฟังก์ชันทดสอบ complete property workflow  
  (window as any).testCompletePropertyWorkflow = async () => {
    console.log('🧪 Testing complete property workflow...');
    
    // First, verify RightPanel is working
    if (!rightPanel) {
      console.error('❌ RightPanel not initialized! Cannot proceed with test.');
      console.log('💡 Try refreshing the page or check console for initialization errors.');
      return;
    }
    
    console.log('✅ RightPanel verification passed');
    
    // 1. Create a test node if not exists
    const existingBoxes = app.stage.children.filter(child => 
      (child as any).nodeData && (child as any).nodeData.nodeType === 'c4box'
    );
    
    let testBox;
    let nodeId;
    
    if (existingBoxes.length === 0) {
      // สร้าง test node
      testBox = createC4Box(app, 'Test System', 0x242424, false);
      testBox.position.set(100, 100);
      app.stage.addChild(testBox);
      nodeId = (testBox as any).nodeData.nodeId;
      console.log('✅ Created test node:', nodeId);
    } else {
      testBox = existingBoxes[0];
      nodeId = (testBox as any).nodeData.nodeId;
      console.log('✅ Using existing node:', nodeId);
    }
    
    // 2. Test property store operations
    try {
      const { usePropertyState } = await import('./stores/propertyState');
      const propertyStore = usePropertyState.getState();
      
      // Add some test properties
      const testProperties = [
        { key: 'description', value: 'Test system for property workflow', type: 'text' as const },
        { key: 'technology', value: 'TypeScript', type: 'text' as const },
        { key: 'port', value: 8080, type: 'number' as const },
        { key: 'isActive', value: true, type: 'boolean' as const },
        { key: 'tags', value: ['test', 'system', 'demo'], type: 'array' as const }
      ];
      
      for (const prop of testProperties) {
        const result = propertyStore.addProperty(nodeId, {
          key: prop.key,
          value: prop.value,
          type: prop.type,
          order: Date.now(),
          metadata: {
            category: prop.key === 'description' ? 'Documentation' : 
                     prop.key === 'technology' ? 'Technical' : 'Basic Properties',
            description: `Test property: ${prop.key}`,
            isRequired: false
          }
        });
        
        if (result.success) {
          console.log(`✅ Added property: ${prop.key}`);
        } else {
          console.log(`❌ Failed to add property ${prop.key}:`, result.error);
        }
      }
      
    } catch (error) {
      console.error('❌ Property store error:', error);
    }
    
    // 3. Test RightPanel opening
    setTimeout(() => {
      import('./composables/useDrawerActions').then(({ useDrawerActions }) => {
        const drawerActions = useDrawerActions();
        const result = drawerActions.openForNode(testBox, nodeId, {
          tab: 'properties',
          nodeName: 'Test System',
          autoFocus: false,
          autoOpen: true,  // เปิด panel เพื่อแสดงผลลัพธ์ใน test
          loadExistingProperties: true
        });
        
        console.log('🗂️ RightPanel opened with test properties:', result);
        
        if (result.success) {
          console.log('🎉 Complete property workflow test successful!');
          console.log('👆 You should now see the RightPanel with test properties');
          console.log('✏️ Try editing properties to test property synchronization');
        }
      });
    }, 500);
  };
  
  // เพิ่มฟังก์ชันทดสอบ property focus behavior
  (window as any).testPropertyFocus = () => {
    console.log('🎯 Testing property focus behavior...');
    
    const c4boxes = app.stage.children.filter(child => 
      (child as any).nodeData && (child as any).nodeData.nodeType === 'c4box'
    );
    
    if (c4boxes.length > 0) {
      const testBox = c4boxes[0];
      const nodeId = (testBox as any).nodeData.nodeId;
      
      console.log('📝 Testing focus on "description" property...');
      
      import('./composables/useDrawerActions').then(({ useDrawerActions }) => {
        const drawerActions = useDrawerActions();
        const result = drawerActions.openForNode(testBox, nodeId, {
          tab: 'properties',
          nodeName: 'Test Node',
          autoOpen: true,
          focusProperty: 'description',  // Focus specific property
          loadExistingProperties: true
        });
        
        console.log('🎯 Property focus test result:', result);
        console.log('✨ The "description" property should be highlighted and focused');
      });
    } else {
      console.log('❌ No C4Box found. Create one first with testCompletePropertyWorkflow()');
    }
  };
  
  // เพิ่มฟังก์ชันทดสอบ property badge behavior
  (window as any).testPropertyBadgeBehavior = () => {
    console.log('🏷️ Testing property badge behavior...');
    
    const c4boxes = app.stage.children.filter(child => 
      (child as any).nodeData && (child as any).nodeData.nodeType === 'c4box'
    );
    
    if (c4boxes.length > 0) {
      const testBox = c4boxes[0];
      const propertyBadge = (testBox as any).propertyBadge;
      
      if (propertyBadge) {
        console.log('✨ Property badge found! You can:');
        console.log('  1. Click the property badge to open RightPanel');
        console.log('  2. Double-click on the node (should NOT open panel)');
        console.log('  3. Panel should only open when clicking property badge');
        
        // Highlight property badge for visual testing
        propertyBadge.tint = 0x00ff00; // Green highlight
        setTimeout(() => {
          propertyBadge.tint = 0xffffff; // Reset to white
        }, 2000);
        
      } else {
        console.log('❌ Property badge not found on the node');
      }
    } else {
      console.log('❌ No C4Box found. Create one first with testCompletePropertyWorkflow()');
    }
  };
  
  console.log('🧪 Debug commands available:');
  console.log('  - debugSelection() - Show selection state');
  console.log('  - testToolbarButtons() - Test toolbar buttons');
  console.log('  - manualShowToolbar() - Manually show toolbar buttons');
  console.log('  - manualHideToolbar() - Manually hide toolbar buttons');
  console.log('  - testRightPanel() - Test RightPanel state');
  console.log('  - forceOpenPanel() - Force open RightPanel');
  console.log('  - testDoubleClickIntegration() - Test double-click → drawer flow');
  console.log('  - testCompletePropertyWorkflow() - Test complete property system');
  console.log('  - testPropertyFocus() - Test property focus and highlighting');
  console.log('  - testPropertyBadgeBehavior() - Test property badge click behavior');
}

console.log('✅ Toolbar Action Buttons initialized successfully');

// --- Connect HTML Buttons to PixiJS ---

// Helper function to create C4Box and add to tree
function createAndAddC4Box(name: string, type: string): void {
  const newBox = createC4Box(app, name, 0x1e1e1e); // Node เข้มกว่า canvas (0x181818) เล็กน้อย
  
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

// Helper function to create C4Box with built-in action buttons
async function createAndAddC4BoxWithActions(name: string, type: 'person' | 'system' | 'container' | 'component'): Promise<void> {
  try {
    // สร้าง C4Box ปกติ
    createAndAddC4Box(name, type);
    
    console.log(`✨ เพิ่ม ${name} Node ใหม่พร้อม Action Buttons`);
  } catch (error) {
    console.error('❌ Failed to create C4Box with actions:', error);
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

// Add Person Button
const addPersonButton = document.getElementById('add-person-btn');
addPersonButton?.addEventListener('click', () => {
  createAndAddC4BoxWithActions('Person', 'person');
});

// Add System Button
const addSystemButton = document.getElementById('add-system-btn');
addSystemButton?.addEventListener('click', () => {
  createAndAddC4BoxWithActions('Software System', 'system');
});

// Add Container Button
const addContainerButton = document.getElementById('add-container-btn');
addContainerButton?.addEventListener('click', () => {
  createAndAddC4BoxWithActions('Container', 'container');
});

// Add Component Button
const addComponentButton = document.getElementById('add-component-btn');
addComponentButton?.addEventListener('click', () => {
  createAndAddC4BoxWithActions('Component', 'component');
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



// Add Theme Toggle Button for testing theme system
const themeToggleButton = document.getElementById('theme-toggle-btn');
if (!themeToggleButton) {
  // Create theme toggle button if it doesn't exist
  const toolbar = document.querySelector('.toolbar');
  if (toolbar) {
    const newThemeButton = document.createElement('button');
    newThemeButton.id = 'theme-toggle-btn';
    newThemeButton.textContent = '🌙 Enhanced Theme';
    newThemeButton.className = 'toolbar-button';
    newThemeButton.title = 'Toggle Enhanced Dark Theme (WCAG AAA)';
    
    // Update button text based on current theme
    const updateThemeButtonText = () => {
      if (themeManager) {
        const isEnhanced = themeManager.isEnhancedThemeEnabled();
        newThemeButton.textContent = isEnhanced ? '🌙 Default Theme' : '🌙 Enhanced Theme';
        newThemeButton.title = isEnhanced 
          ? 'Switch to Default Theme (WCAG AA)' 
          : 'Switch to Enhanced Theme (WCAG AAA)';
      }
    };
    
    newThemeButton.addEventListener('click', () => {
      if (themeManager) {
        const isEnhanced = themeManager.isEnhancedThemeEnabled();
        themeManager.enableEnhancedTheme(!isEnhanced);
        updateThemeButtonText();
        console.log(`🎨 Theme switched to: ${!isEnhanced ? 'Enhanced' : 'Default'}`);
      }
    });
    
    // Listen for theme changes from other sources
    document.addEventListener('themeChanged', updateThemeButtonText);
    
    toolbar.appendChild(newThemeButton);
    console.log('✅ Added theme toggle button to toolbar');
    
    // Set initial button text
    setTimeout(updateThemeButtonText, 100);
  }
} else {
  themeToggleButton.addEventListener('click', () => {
    if (themeManager) {
      const isEnhanced = themeManager.isEnhancedThemeEnabled();
      themeManager.enableEnhancedTheme(!isEnhanced);
    }
  });
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
  if (rightPanel && rightPanel.destroy) {
    rightPanel.destroy();
  }
  if (canvasContainerEnhancement && canvasContainerEnhancement.destroy) {
    canvasContainerEnhancement.destroy();
  }
  if (zoomControls && zoomControls.destroy) {
    zoomControls.destroy();
  }
  if (themeManager && themeManager.destroy) {
    themeManager.destroy();
  }
  if (gridDots && gridDots.destroy) {
    gridDots.destroy();
  }
});