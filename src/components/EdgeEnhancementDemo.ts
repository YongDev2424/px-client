// src/components/EdgeEnhancementDemo.ts

import { Application, Container } from 'pixi.js';
import { createEdge, createEnhancedEdge, enhanceExistingEdge } from './Edge';
import { createC4Box } from './C4Box';
import type { EdgeStyleOptions } from '../utils/EdgeThemes';

/**
 * EdgeEnhancementDemo - ตัวอย่างการใช้งานระบบปรับปรุงรูปแบบ Edge
 * แสดงการเปรียบเทียบระหว่าง Edge แบบเดิมและแบบปรับปรุง
 */
export class EdgeEnhancementDemo {
  private app: Application;
  private demoContainer: Container;
  private sourceNodes: Container[] = [];
  private targetNodes: Container[] = [];
  private edges: Container[] = [];

  constructor(app: Application) {
    this.app = app;
    this.demoContainer = new Container();
    this.app.stage.addChild(this.demoContainer);
  }

  /**
   * สร้างตัวอย่างการเปรียบเทียบ Edge แบบต่างๆ
   */
  public async createComparisonDemo(): Promise<void> {
    console.log('🎨 สร้างตัวอย่างการเปรียบเทียบ Edge Enhancement');

    // ล้างตัวอย่างเดิม
    this.clearDemo();

    // สร้าง nodes สำหรับทดสอบ
    await this.createDemoNodes();

    // สร้าง edges แบบต่างๆ
    await this.createVariousEdges();

    console.log('✅ สร้างตัวอย่างเสร็จสิ้น');
  }

  /**
   * สร้าง nodes สำหรับใช้ในการทดสอบ
   */
  private async createDemoNodes(): Promise<void> {
    const nodeConfigs = [
      { name: 'User', color: 0x4A90E2, x: 100, y: 100 },
      { name: 'System A', color: 0x7ED321, x: 400, y: 100 },
      { name: 'Database', color: 0xF5A623, x: 100, y: 300 },
      { name: 'API Gateway', color: 0xBD10E0, x: 400, y: 300 },
      { name: 'Service B', color: 0x50E3C2, x: 700, y: 200 }
    ];

    for (const config of nodeConfigs) {
      const node = createC4Box(this.app, config.name, config.color);
      node.x = config.x;
      node.y = config.y;
      
      this.demoContainer.addChild(node);
      
      if (this.sourceNodes.length < 3) {
        this.sourceNodes.push(node);
      } else {
        this.targetNodes.push(node);
      }
    }

    console.log(`📦 สร้าง ${nodeConfigs.length} nodes สำหรับทดสอบ`);
  }

  /**
   * สร้าง edges แบบต่างๆ เพื่อแสดงความแตกต่าง
   */
  private async createVariousEdges(): Promise<void> {
    if (this.sourceNodes.length < 2 || this.targetNodes.length < 2) {
      console.error('❌ ไม่มี nodes เพียงพอสำหรับสร้าง edges');
      return;
    }

    // 1. Edge แบบเดิม (ไม่มี enhancement)
    const standardEdge = createEdge(
      this.sourceNodes[0],
      this.targetNodes[0],
      'Standard Edge',
      0x000000,
      2,
      true,
      'right',
      'left',
      false // ไม่ใช้ enhancement
    );
    this.demoContainer.addChild(standardEdge);
    this.edges.push(standardEdge);
    console.log('📏 สร้าง Standard Edge');

    // 2. Enhanced Edge แบบ default theme
    const defaultEnhancedEdge = createEnhancedEdge(
      this.sourceNodes[1],
      this.targetNodes[1],
      'Enhanced Default',
      'default',
      'right',
      'left'
    );
    this.demoContainer.addChild(defaultEnhancedEdge);
    this.edges.push(defaultEnhancedEdge);
    console.log('✨ สร้าง Enhanced Edge (default theme)');

    // 3. Enhanced Edge แบบ primary theme
    if (this.sourceNodes[2] && this.targetNodes[0]) {
      const primaryEnhancedEdge = createEnhancedEdge(
        this.sourceNodes[2],
        this.targetNodes[0],
        'Primary Relationship',
        'primary',
        'top',
        'bottom'
      );
      this.demoContainer.addChild(primaryEnhancedEdge);
      this.edges.push(primaryEnhancedEdge);
      console.log('🔵 สร้าง Enhanced Edge (primary theme)');
    }

    // 4. Enhanced Edge แบบ dependency theme
    if (this.sourceNodes[0] && this.targetNodes[1]) {
      const dependencyEdge = createEnhancedEdge(
        this.sourceNodes[0],
        this.targetNodes[1],
        'Depends On',
        'dependency',
        'bottom',
        'top'
      );
      this.demoContainer.addChild(dependencyEdge);
      this.edges.push(dependencyEdge);
      console.log('🔗 สร้าง Enhanced Edge (dependency theme)');
    }

    // 5. Retrofit enhancement - เพิ่ม enhancement ให้กับ edge เดิม
    setTimeout(async () => {
      try {
        await enhanceExistingEdge(standardEdge, 'composition');
        console.log('🔄 เพิ่ม enhancement ให้กับ Standard Edge แล้ว');
      } catch (error) {
        console.warn('⚠️ ไม่สามารถเพิ่ม enhancement ให้กับ Standard Edge ได้:', error);
      }
    }, 2000); // รอ 2 วินาทีแล้วค่อยเพิ่ม enhancement
  }

  /**
   * สร้างตัวอย่างการใช้ custom theme
   */
  public async createCustomThemeDemo(): Promise<void> {
    console.log('🎨 สร้างตัวอย่าง Custom Theme');

    // สร้าง custom theme
    const customTheme: EdgeStyleOptions = {
      enableEnhancedStyling: true,
      lineStyle: {
        width: 4,
        color: 0xFF6B6B,
        alpha: 0.9,
        quality: 'high'
      },
      arrowStyle: {
        size: 16,
        width: 12,
        color: 0xFF6B6B,
        style: 'diamond',
        filled: true
      },
      labelStyle: {
        hasBackground: true,
        backgroundColor: 0xFF6B6B,
        backgroundAlpha: 1.0,
        borderColor: 0xE55555,
        borderWidth: 2,
        borderRadius: 8,
        padding: 10,
        textColor: 0xFFFFFF,
        fontSize: 14,
        fontWeight: '700',
        shadowColor: 0x000000,
        shadowBlur: 4,
        shadowOffset: { x: 2, y: 2 }
      }
    };

    if (this.sourceNodes.length >= 2 && this.targetNodes.length >= 2) {
      // สร้าง nodes ใหม่สำหรับ custom theme demo
      const customSourceNode = createC4Box(this.app, 'Custom Source', 0xFF6B6B);
      customSourceNode.x = 100;
      customSourceNode.y = 500;
      this.demoContainer.addChild(customSourceNode);

      const customTargetNode = createC4Box(this.app, 'Custom Target', 0xFF6B6B);
      customTargetNode.x = 400;
      customTargetNode.y = 500;
      this.demoContainer.addChild(customTargetNode);

      // สร้าง edge พื้นฐานแล้วเพิ่ม custom enhancement
      const customEdge = createEdge(
        customSourceNode,
        customTargetNode,
        'Custom Styled',
        0x000000,
        2,
        true,
        'right',
        'left',
        false
      );
      this.demoContainer.addChild(customEdge);

      // เพิ่ม custom enhancement
      try {
        const { EdgeStyler } = await import('./EdgeStyler');
        EdgeStyler.enhanceExistingEdge(customEdge, customTheme);
        console.log('✨ เพิ่ม Custom Theme Enhancement สำเร็จ');
      } catch (error) {
        console.error('❌ ไม่สามารถเพิ่ม Custom Theme Enhancement ได้:', error);
      }
    }
  }

  /**
   * ทดสอบการทำงานของ theme switching
   */
  public async testThemeSwitching(): Promise<void> {
    console.log('🔄 ทดสอบการเปลี่ยน Theme');

    if (this.edges.length === 0) {
      console.warn('⚠️ ไม่มี edges สำหรับทดสอบ theme switching');
      return;
    }

    const themes = ['default', 'primary', 'dependency', 'composition'];
    let currentThemeIndex = 0;

    // เปลี่ยน theme ทุก 3 วินาที
    const themeInterval = setInterval(async () => {
      const themeName = themes[currentThemeIndex];
      console.log(`🎨 เปลี่ยนเป็น ${themeName} theme`);

      try {
        const { EdgeStyler } = await import('./EdgeStyler');
        const { getThemeForRelationship } = await import('../utils/EdgeThemes');

        // เปลี่ยน theme ของ edge แรก
        if (this.edges[0]) {
          const theme = getThemeForRelationship(themeName);
          EdgeStyler.enhanceExistingEdge(this.edges[0], theme);
        }

        currentThemeIndex = (currentThemeIndex + 1) % themes.length;

        // หยุดหลังจากครบรอบ
        if (currentThemeIndex === 0) {
          clearInterval(themeInterval);
          console.log('✅ ทดสอบ theme switching เสร็จสิ้น');
        }
      } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการเปลี่ยน theme:', error);
        clearInterval(themeInterval);
      }
    }, 3000);
  }

  /**
   * แสดงข้อมูลสถิติของ enhancement
   */
  public showEnhancementStats(): void {
    console.log('📊 สถิติ Edge Enhancement:');
    
    let enhancedCount = 0;
    let standardCount = 0;

    this.edges.forEach((edge, index) => {
      const isEnhanced = !!(edge as any).enhancementData?.isEnhanced;
      if (isEnhanced) {
        enhancedCount++;
        console.log(`   Edge ${index + 1}: Enhanced ✨`);
      } else {
        standardCount++;
        console.log(`   Edge ${index + 1}: Standard 📏`);
      }
    });

    console.log(`📈 สรุป: Enhanced ${enhancedCount} edges, Standard ${standardCount} edges`);
  }

  /**
   * ล้างตัวอย่างทั้งหมด
   */
  public clearDemo(): void {
    this.demoContainer.removeChildren();
    this.sourceNodes = [];
    this.targetNodes = [];
    this.edges = [];
    console.log('🧹 ล้างตัวอย่างแล้ว');
  }

  /**
   * ทำลาย demo และล้างทรัพยากร
   */
  public destroy(): void {
    this.clearDemo();
    this.app.stage.removeChild(this.demoContainer);
    this.demoContainer.destroy();
    console.log('🗑️ ทำลาย EdgeEnhancementDemo แล้ว');
  }
}

/**
 * Helper function สำหรับการสร้าง demo ใน main.ts
 */
export async function createEdgeEnhancementDemo(app: Application): Promise<EdgeEnhancementDemo> {
  const demo = new EdgeEnhancementDemo(app);
  
  // สร้างตัวอย่างต่างๆ
  await demo.createComparisonDemo();
  
  // รอแล้วสร้าง custom theme demo
  setTimeout(async () => {
    await demo.createCustomThemeDemo();
  }, 1000);
  
  // รอแล้วทดสอบ theme switching
  setTimeout(async () => {
    await demo.testThemeSwitching();
  }, 3000);
  
  // แสดงสถิติหลังจากทุกอย่างเสร็จ
  setTimeout(() => {
    demo.showEnhancementStats();
  }, 15000);
  
  return demo;
}