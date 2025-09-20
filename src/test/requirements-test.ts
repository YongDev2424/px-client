// src/test/requirements-test.ts

/**
 * Requirements Testing Suite
 * ทดสอบ Requirements 1-7 สำหรับ Edit-Delete System
 * 
 * Requirements ที่ต้องทดสอบ:
 * 1. เลือก Node เดียว → แสดง edit/delete
 * 2. เลือก Edge เดียว → แสดง edit/delete  
 * 3. คลิก edit → เข้าสู่โหมด edit
 * 4. คลิก delete → แสดง confirmation dialog
 * 5. ไม่เลือกอะไร → ซ่อน edit/delete
 * 6. เลือกหลายตัว (same type) → ซ่อน edit/delete
 * 7. เลือกหลายตัว (mixed type) → ซ่อน edit/delete
 */

import { useSelectionState, makeSelectable, type SelectableElement } from '../stores/selectionState';
import { useToolbarState } from '../stores/toolbarState';
import { calculateToolbarVisibility, debugSelectionState } from '../utils/selectionRules';
import { Container } from 'pixi.js';

/**
 * Test Results Interface
 */
interface TestResult {
  requirement: number;
  description: string;
  passed: boolean;
  details: string;
  actualState?: any;
  expectedState?: any;
}

/**
 * Test Suite Class
 */
export class RequirementsTestSuite {
  private results: TestResult[] = [];
  private mockNodes: SelectableElement[] = [];
  private mockEdges: SelectableElement[] = [];

  constructor() {
    console.log('🧪 Initializing Requirements Test Suite');
    this.setupMockElements();
  }

  /**
   * สร้าง mock elements สำหรับการทดสอบ
   */
  private setupMockElements(): void {
    // สร้าง mock nodes
    for (let i = 0; i < 3; i++) {
      const container = new Container();
      const mockNode = makeSelectable(container, {
        type: 'node',
        data: { nodeType: 'c4box', title: `Node ${i + 1}` }
      });
      this.mockNodes.push(mockNode);
    }

    // สร้าง mock edges
    for (let i = 0; i < 3; i++) {
      const container = new Container();
      const mockEdge = makeSelectable(container, {
        type: 'edge',
        data: { sourceId: 'node1', targetId: 'node2', label: `Edge ${i + 1}` }
      });
      this.mockEdges.push(mockEdge);
    }

    console.log(`🎭 Created ${this.mockNodes.length} mock nodes and ${this.mockEdges.length} mock edges`);
  }

  /**
   * รันทดสอบทั้งหมด
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting Requirements Test Suite');
    this.results = [];

    // เคลียร์ selection ก่อนเริ่มทดสอบ
    useSelectionState.getState().deselectAll();

    try {
      await this.testRequirement1();
      await this.testRequirement2();
      await this.testRequirement3();
      await this.testRequirement4();
      await this.testRequirement5();
      await this.testRequirement6();
      await this.testRequirement7();

      this.printResults();
      return this.results;

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  /**
   * Requirement 1: เลือก Node เดียว → แสดง edit/delete
   */
  private async testRequirement1(): Promise<void> {
    console.log('📝 Testing Requirement 1: เลือก Node เดียว → แสดง edit/delete');

    // เคลียร์ selection
    useSelectionState.getState().deselectAll();
    
    // เลือก node เดียว
    const selectedNode = this.mockNodes[0];
    useSelectionState.getState().selectElement(selectedNode);

    // รอ state updates
    await this.waitForStateUpdate();

    // ตรวจสอบผลลัพธ์
    const config = calculateToolbarVisibility();
    const toolbarState = useToolbarState.getState();

    const passed = 
      config.showEditButton === true &&
      config.showDeleteButton === true &&
      config.canEdit === true &&
      config.canDelete === true &&
      toolbarState.isVisible === true;

    this.results.push({
      requirement: 1,
      description: 'เลือก Node เดียว → แสดง edit/delete',
      passed,
      details: passed ? 'ผ่าน: แสดงปุ่ม edit และ delete เมื่อเลือก node เดียว' : 'ไม่ผ่าน: ปุ่มไม่แสดงหรือ state ไม่ถูกต้อง',
      actualState: { config, toolbarVisible: toolbarState.isVisible },
      expectedState: { showEditButton: true, showDeleteButton: true, canEdit: true, canDelete: true, toolbarVisible: true }
    });
  }

  /**
   * Requirement 2: เลือก Edge เดียว → แสดง edit/delete  
   */
  private async testRequirement2(): Promise<void> {
    console.log('📝 Testing Requirement 2: เลือก Edge เดียว → แสดง edit/delete');

    // เคลียร์ selection
    useSelectionState.getState().deselectAll();
    
    // เลือก edge เดียว
    const selectedEdge = this.mockEdges[0];
    useSelectionState.getState().selectElement(selectedEdge);

    // รอ state updates
    await this.waitForStateUpdate();

    // ตรวจสอบผลลัพธ์
    const config = calculateToolbarVisibility();
    const toolbarState = useToolbarState.getState();

    const passed = 
      config.showEditButton === true &&
      config.showDeleteButton === true &&
      config.canEdit === true &&
      config.canDelete === true &&
      toolbarState.isVisible === true;

    this.results.push({
      requirement: 2,
      description: 'เลือก Edge เดียว → แสดง edit/delete',
      passed,
      details: passed ? 'ผ่าน: แสดงปุ่ม edit และ delete เมื่อเลือก edge เดียว' : 'ไม่ผ่าน: ปุ่มไม่แสดงหรือ state ไม่ถูกต้อง',
      actualState: { config, toolbarVisible: toolbarState.isVisible },
      expectedState: { showEditButton: true, showDeleteButton: true, canEdit: true, canDelete: true, toolbarVisible: true }
    });
  }

  /**
   * Requirement 3: คลิก edit → เข้าสู่โหมด edit
   */
  private async testRequirement3(): Promise<void> {
    console.log('📝 Testing Requirement 3: คลิก edit → เข้าสู่โหมด edit');

    // เคลียร์และเลือก node
    useSelectionState.getState().deselectAll();
    useSelectionState.getState().selectElement(this.mockNodes[0]);
    await this.waitForStateUpdate();

    // ติดตั้ง event listener สำหรับตรวจสอบ edit modal
    let editModalOpened = false;
    const handleEditAction = (event: CustomEvent) => {
      if (event.detail.modalId && event.detail.element) {
        editModalOpened = true;
      }
    };

    window.addEventListener('toolbar-edit-action', handleEditAction as EventListener);

    try {
      // คลิกปุ่ม edit
      const toolbarState = useToolbarState.getState();
      toolbarState.handleEditAction();

      // รอการเปิด modal
      await this.waitForStateUpdate(100);

      const passed = editModalOpened;

      this.results.push({
        requirement: 3,
        description: 'คลิก edit → เข้าสู่โหมด edit',
        passed,
        details: passed ? 'ผ่าน: เปิด edit modal เมื่อคลิกปุ่ม edit' : 'ไม่ผ่าน: ไม่ได้เปิด edit modal',
        actualState: { editModalOpened },
        expectedState: { editModalOpened: true }
      });

    } finally {
      window.removeEventListener('toolbar-edit-action', handleEditAction as EventListener);
    }
  }

  /**
   * Requirement 4: คลิก delete → แสดง confirmation dialog
   */
  private async testRequirement4(): Promise<void> {
    console.log('📝 Testing Requirement 4: คลิก delete → แสดง confirmation dialog');

    // เคลียร์และเลือก node
    useSelectionState.getState().deselectAll();
    useSelectionState.getState().selectElement(this.mockNodes[0]);
    await this.waitForStateUpdate();

    // ติดตั้ง event listener สำหรับตรวจสอบ delete confirmation
    let deleteConfirmationShown = false;
    const handleDeleteAction = (event: CustomEvent) => {
      if (event.detail.element) {
        deleteConfirmationShown = true;
      }
    };

    window.addEventListener('toolbar-delete-action', handleDeleteAction as EventListener);

    try {
      // คลิกปุ่ม delete
      const toolbarState = useToolbarState.getState();
      toolbarState.handleDeleteAction();

      // รอการแสดง confirmation
      await this.waitForStateUpdate(100);

      const passed = deleteConfirmationShown;

      this.results.push({
        requirement: 4,
        description: 'คลิก delete → แสดง confirmation dialog',
        passed,
        details: passed ? 'ผ่าน: แสดง confirmation dialog เมื่อคลิกปุ่ม delete' : 'ไม่ผ่าน: ไม่ได้แสดง confirmation dialog',
        actualState: { deleteConfirmationShown },
        expectedState: { deleteConfirmationShown: true }
      });

    } finally {
      window.removeEventListener('toolbar-delete-action', handleDeleteAction as EventListener);
    }
  }

  /**
   * Requirement 5: ไม่เลือกอะไร → ซ่อน edit/delete
   */
  private async testRequirement5(): Promise<void> {
    console.log('📝 Testing Requirement 5: ไม่เลือกอะไร → ซ่อน edit/delete');

    // เคลียร์ selection ทั้งหมด
    useSelectionState.getState().deselectAll();
    await this.waitForStateUpdate();

    // ตรวจสอบผลลัพธ์
    const config = calculateToolbarVisibility();
    const toolbarState = useToolbarState.getState();

    const passed = 
      config.showEditButton === false &&
      config.showDeleteButton === false &&
      config.canEdit === false &&
      config.canDelete === false;

    this.results.push({
      requirement: 5,
      description: 'ไม่เลือกอะไร → ซ่อน edit/delete',
      passed,
      details: passed ? 'ผ่าน: ซ่อนปุ่ม edit และ delete เมื่อไม่มีการเลือก' : 'ไม่ผ่าน: ปุ่มยังแสดงอยู่',
      actualState: { config, toolbarVisible: toolbarState.isVisible },
      expectedState: { showEditButton: false, showDeleteButton: false, canEdit: false, canDelete: false }
    });
  }

  /**
   * Requirement 6: เลือกหลายตัว (same type) → ซ่อน edit/delete
   */
  private async testRequirement6(): Promise<void> {
    console.log('📝 Testing Requirement 6: เลือกหลายตัว (same type) → ซ่อน edit/delete');

    // เคลียร์ selection
    useSelectionState.getState().deselectAll();
    
    // เลือก nodes หลายตัว
    useSelectionState.getState().selectElement(this.mockNodes[0]);
    useSelectionState.getState().selectElement(this.mockNodes[1]);

    await this.waitForStateUpdate();

    // ตรวจสอบผลลัพธ์
    const config = calculateToolbarVisibility();
    const selectionState = useSelectionState.getState();
    const selectionType = selectionState.getSelectionType();

    const passed = 
      selectionType === 'multiple' &&
      config.showEditButton === false &&
      config.showDeleteButton === false &&
      config.canEdit === false &&
      config.canDelete === false;

    this.results.push({
      requirement: 6,
      description: 'เลือกหลายตัว (same type) → ซ่อน edit/delete',
      passed,
      details: passed ? 'ผ่าน: ซ่อนปุ่มเมื่อเลือกหลาย nodes' : 'ไม่ผ่าน: ปุ่มยังแสดงอยู่เมื่อเลือกหลายตัว',
      actualState: { selectionType, config },
      expectedState: { selectionType: 'multiple', showEditButton: false, showDeleteButton: false }
    });
  }

  /**
   * Requirement 7: เลือกหลายตัว (mixed type) → ซ่อน edit/delete
   */
  private async testRequirement7(): Promise<void> {
    console.log('📝 Testing Requirement 7: เลือกหลายตัว (mixed type) → ซ่อน edit/delete');

    // เคลียร์ selection
    useSelectionState.getState().deselectAll();
    
    // เลือก node และ edge (mixed types)
    useSelectionState.getState().selectElement(this.mockNodes[0]);
    useSelectionState.getState().selectElement(this.mockEdges[0]);

    await this.waitForStateUpdate();

    // ตรวจสอบผลลัพธ์
    const config = calculateToolbarVisibility();
    const selectionState = useSelectionState.getState();
    const selectionType = selectionState.getSelectionType();

    const passed = 
      selectionType === 'mixed' &&
      config.showEditButton === false &&
      config.showDeleteButton === false &&
      config.canEdit === false &&
      config.canDelete === false;

    this.results.push({
      requirement: 7,
      description: 'เลือกหลายตัว (mixed type) → ซ่อน edit/delete',
      passed,
      details: passed ? 'ผ่าน: ซ่อนปุ่มเมื่อเลือก mixed types' : 'ไม่ผ่าน: ปุ่มยังแสดงอยู่เมื่อเลือก mixed types',
      actualState: { selectionType, config },
      expectedState: { selectionType: 'mixed', showEditButton: false, showDeleteButton: false }
    });
  }

  /**
   * รอการอัปเดต state
   */
  private waitForStateUpdate(ms: number = 50): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * แสดงผลลัพธ์การทดสอบ
   */
  private printResults(): void {
    console.log('\n🧪 Requirements Test Results');
    console.log('========================================');

    let passedCount = 0;
    let totalCount = this.results.length;

    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} Requirement ${result.requirement}: ${result.description}`);
      console.log(`   Details: ${result.details}`);
      
      if (!result.passed && result.actualState && result.expectedState) {
        console.log('   Expected:', result.expectedState);
        console.log('   Actual:', result.actualState);
      }
      
      console.log('');
      
      if (result.passed) passedCount++;
    });

    console.log('========================================');
    console.log(`📊 Summary: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
      console.log('🎉 All requirements tests passed!');
    } else {
      console.log('⚠️ Some requirements tests failed. Please check the implementation.');
    }
  }

  /**
   * ทำลาย test suite
   */
  destroy(): void {
    // เคลียร์ selection
    useSelectionState.getState().deselectAll();
    
    // เคลียร์ toolbar
    useToolbarState.getState().reset();
    
    console.log('🗑️ Requirements Test Suite destroyed');
  }
}

/**
 * สร้าง global function สำหรับรันทดสอบ
 */
export async function runRequirementsTests(): Promise<TestResult[]> {
  const testSuite = new RequirementsTestSuite();
  
  try {
    const results = await testSuite.runAllTests();
    return results;
  } finally {
    testSuite.destroy();
  }
}

/**
 * Auto-export สำหรับ development
 */
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).runRequirementsTests = runRequirementsTests;
  console.log('🧪 Requirements tests available: run `runRequirementsTests()` in console');
}