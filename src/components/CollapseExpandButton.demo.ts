// src/components/CollapseExpandButton.demo.ts

import { Application, Container, Graphics } from 'pixi.js';
import { CollapseExpandButton } from './CollapseExpandButton';
import { nodeStateManager } from '../utils/nodeStateManager';

/**
 * Demo สำหรับ CollapseExpandButton component
 * แสดงการใช้งานพื้นฐานและ options ต่างๆ
 */
export async function createCollapseExpandButtonDemo(): Promise<HTMLElement> {
  // สร้าง container สำหรับ demo
  const demoContainer = document.createElement('div');
  demoContainer.style.cssText = `
    width: 100%;
    height: 400px;
    border: 1px solid #ccc;
    position: relative;
    background: #f5f5f5;
  `;

  // สร้าง PixiJS Application
  const app = new Application();
  await app.init({
    width: 800,
    height: 400,
    backgroundColor: 0xf5f5f5,
    antialias: true
  });

  demoContainer.appendChild(app.canvas);

  // สร้าง mock nodes สำหรับ demo
  const nodes = createDemoNodes();
  
  // เพิ่ม nodes ลงใน stage
  nodes.forEach(node => {
    app.stage.addChild(node);
    
    // เริ่มต้นสถานะ node
    nodeStateManager.initializeNodeState(node);
  });

  // สร้าง CollapseExpandButton สำหรับแต่ละ node
  const buttons = createCollapseExpandButtons(nodes);
  
  // เพิ่ม buttons ลงใน stage
  buttons.forEach(button => {
    app.stage.addChild(button);
  });

  // เพิ่ม event listener สำหรับ demo
  setupDemoEventListeners();

  // เพิ่ม instructions
  const instructions = createInstructions();
  demoContainer.appendChild(instructions);

  return demoContainer;
}

/**
 * สร้าง mock nodes สำหรับ demo
 */
function createDemoNodes(): Container[] {
  const nodes: Container[] = [];

  // Node 1: Default button
  const node1 = createMockNode(100, 100, 200, 100, 0x4a90e2, 'Default Button');
  nodes.push(node1);

  // Node 2: Custom position (top-left)
  const node2 = createMockNode(400, 100, 200, 100, 0x7ed321, 'Top-Left Button');
  nodes.push(node2);

  // Node 3: Custom icons and colors
  const node3 = createMockNode(100, 250, 200, 100, 0xf5a623, 'Custom Style');
  nodes.push(node3);

  // Node 4: Small button
  const node4 = createMockNode(400, 250, 200, 100, 0xd0021b, 'Small Button');
  nodes.push(node4);

  return nodes;
}

/**
 * สร้าง mock node
 */
function createMockNode(
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  color: number, 
  label: string
): Container {
  const container = new Container();
  container.x = x;
  container.y = y;

  // สร้าง background rectangle
  const bg = new Graphics()
    .fill(color)
    .rect(0, 0, width, height)
    .fill();
  
  container.addChild(bg);

  // เพิ่ม label (จำลอง)
  const labelBg = new Graphics()
    .fill(0xffffff)
    .rect(10, 10, width - 20, 30)
    .fill();
  
  container.addChild(labelBg);

  // Mock getBounds method
  (container as any).getBounds = () => ({
    x: x,
    y: y,
    width: width,
    height: height
  });

  // เพิ่ม metadata
  (container as any).nodeData = {
    labelText: label,
    nodeType: 'demo-node'
  };

  return container;
}

/**
 * สร้าง CollapseExpandButton สำหรับแต่ละ node
 */
function createCollapseExpandButtons(nodes: Container[]): CollapseExpandButton[] {
  const buttons: CollapseExpandButton[] = [];

  // Button 1: Default options
  const button1 = new CollapseExpandButton(nodes[0]);
  buttons.push(button1);

  // Button 2: Top-left position
  const button2 = new CollapseExpandButton(nodes[1], {
    position: 'top-left'
  });
  buttons.push(button2);

  // Button 3: Custom icons and colors
  const button3 = new CollapseExpandButton(nodes[2], {
    expandedIcon: '⬇',
    collapsedIcon: '➡',
    backgroundColor: 0x333333,
    iconColor: 0xffffff,
    hoverBackgroundColor: 0x555555
  });
  buttons.push(button3);

  // Button 4: Small size
  const button4 = new CollapseExpandButton(nodes[3], {
    size: 20,
    offset: { x: -6, y: 6 }
  });
  buttons.push(button4);

  return buttons;
}

/**
 * ตั้งค่า event listeners สำหรับ demo
 */
function setupDemoEventListeners(): void {
  // ฟัง collapse events
  window.addEventListener('node-collapse-toggled', (event: CustomEvent) => {
    const { node, isCollapsed } = event.detail;
    const nodeData = (node as any).nodeData;
    
    console.log(`Demo: Node "${nodeData?.labelText}" ${isCollapsed ? 'collapsed' : 'expanded'}`);
    
    // จำลองการเปลี่ยนขนาด node
    if (isCollapsed) {
      // ลดขนาด node
      node.scale.set(0.7);
      node.alpha = 0.8;
    } else {
      // คืนขนาดเดิม
      node.scale.set(1.0);
      node.alpha = 1.0;
    }
  });

  // ฟัง node state changes
  window.addEventListener('node-state-changed', (event: CustomEvent) => {
    const { node, changeType } = event.detail;
    const nodeData = (node as any).nodeData;
    
    console.log(`Demo: Node "${nodeData?.labelText}" state changed: ${changeType}`);
  });
}

/**
 * สร้าง instructions สำหรับ demo
 */
function createInstructions(): HTMLElement {
  const instructions = document.createElement('div');
  instructions.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(255, 255, 255, 0.9);
    padding: 10px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    max-width: 300px;
  `;

  instructions.innerHTML = `
    <h4 style="margin: 0 0 10px 0;">CollapseExpandButton Demo</h4>
    <ul style="margin: 0; padding-left: 20px;">
      <li><strong>Blue Node:</strong> Default button (top-right)</li>
      <li><strong>Green Node:</strong> Top-left position</li>
      <li><strong>Orange Node:</strong> Custom icons and colors</li>
      <li><strong>Red Node:</strong> Small button size</li>
    </ul>
    <p style="margin: 10px 0 0 0; font-style: italic;">
      Click the buttons to toggle collapse/expand state. 
      Check the console for event logs.
    </p>
  `;

  return instructions;
}

/**
 * ทำลาย demo และ cleanup resources
 */
export function destroyCollapseExpandButtonDemo(demoElement: HTMLElement): void {
  // ลบ event listeners
  window.removeEventListener('node-collapse-toggled', () => {});
  window.removeEventListener('node-state-changed', () => {});
  
  // ล้างสถานะ nodes
  nodeStateManager.clearAllStates();
  
  // ลบ DOM element
  if (demoElement.parentNode) {
    demoElement.parentNode.removeChild(demoElement);
  }
  
  console.log('CollapseExpandButton demo destroyed');
}