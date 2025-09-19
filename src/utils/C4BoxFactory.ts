// src/utils/C4BoxFactory.ts

import { Application, Container } from 'pixi.js';
import { createC4Box } from '../components/C4Box';
import { C4ThemeHelper } from './C4Themes';
import type { C4StyleOptions } from './C4Themes';

/**
 * C4BoxFactory - Factory class สำหรับสร้าง C4Box ด้วย enhanced styling
 * ใช้เป็น wrapper รอบ createC4Box เพื่อให้ง่ายต่อการใช้งาน
 */
export class C4BoxFactory {
  
  /**
   * สร้าง C4Box แบบ enhanced ตาม C4 level และ type
   * @param app - PixiJS Application
   * @param name - ชื่อของ component
   * @param type - ประเภทของ C4 component
   * @param enhanced - เปิดใช้งาน enhanced styling หรือไม่
   * @returns Container ของ C4Box ที่สร้างแล้ว
   */
  static createEnhancedC4Box(
    app: Application,
    name: string,
    type: 'person' | 'system' | 'container' | 'component',
    enhanced: boolean = true
  ): Container {
    
    // แมป C4 type เป็น level และสี
    const typeMapping = {
      person: { level: 'level1' as const, color: 0x0B61A4 },
      system: { level: 'level2' as const, color: 0x2E7D32 },
      container: { level: 'level3' as const, color: 0xF57C00 },
      component: { level: 'level4' as const, color: 0x616161 }
    };
    
    const mapping = typeMapping[type];
    if (!mapping) {
      console.warn(`⚠️ Unknown C4 type: ${type}, using default person type`);
      return this.createEnhancedC4Box(app, name, 'person', enhanced);
    }
    
    // สร้าง style options สำหรับ level นี้
    const styleOptions: C4StyleOptions = enhanced ? 
      C4ThemeHelper.createStyleOptionsForLevel(mapping.level, {
        enableEnhancedStyling: true,
        enableRoundedCorners: true,
        enableShadows: true,
        enableIcons: true,
        cornerRadius: 8,
        shadowOffset: { x: 2, y: 2 },
        shadowBlur: 4
      }) : 
      { enableEnhancedStyling: false };
    
    console.log(`🏭 Creating ${enhanced ? 'enhanced' : 'standard'} C4Box:`, {
      name,
      type,
      level: mapping.level,
      color: `0x${mapping.color.toString(16).toUpperCase()}`
    });
    
    // สร้าง C4Box ด้วย enhanced styling
    const c4Box = createC4Box(
      app,
      name,
      mapping.color,
      enhanced,
      styleOptions
    );
    
    // เพิ่ม metadata เพิ่มเติมสำหรับ ComponentTree
    const nodeData = (c4Box as any).nodeData;
    if (nodeData) {
      nodeData.nodeType = type;
      nodeData.c4Level = mapping.level;
      nodeData.isEnhanced = enhanced;
    }
    
    return c4Box;
  }
  
  /**
   * สร้าง C4Box แบบ standard (ไม่มี enhancement)
   */
  static createStandardC4Box(
    app: Application,
    name: string,
    type: 'person' | 'system' | 'container' | 'component'
  ): Container {
    return this.createEnhancedC4Box(app, name, type, false);
  }
  
  /**
   * สร้าง C4Box หลายๆ อันพร้อมกัน (สำหรับ demo หรือ testing)
   */
  static createDemoBoxes(app: Application, enhanced: boolean = true): Container[] {
    const demoBoxes = [
      { name: 'Customer', type: 'person' as const },
      { name: 'Banking System', type: 'system' as const },
      { name: 'Web Application', type: 'container' as const },
      { name: 'Authentication Service', type: 'component' as const }
    ];
    
    return demoBoxes.map(box => 
      this.createEnhancedC4Box(app, box.name, box.type, enhanced)
    );
  }
  
  /**
   * Toggle enhanced styling สำหรับ C4Box ที่มีอยู่แล้ว
   */
  static async toggleEnhancement(container: Container): Promise<Container> {
    const { C4BoxEnhancer } = await import('../components/C4BoxEnhancer');
    
    if (C4BoxEnhancer.isEnhanced(container)) {
      console.log('🔄 Removing enhancements from C4Box');
      return C4BoxEnhancer.removeEnhancements(container);
    } else {
      console.log('🎨 Adding enhancements to C4Box');
      const nodeData = (container as any).nodeData;
      const type = nodeData?.nodeType || 'person';
      
      // แมป type เป็น level
      const levelMapping = {
        person: 'level1',
        system: 'level2', 
        container: 'level3',
        component: 'level4'
      };
      
      const level = levelMapping[type as keyof typeof levelMapping] || 'level1';
      const styleOptions = C4ThemeHelper.createStyleOptionsForLevel(level as any);
      
      return C4BoxEnhancer.enhanceExistingBox(container, styleOptions);
    }
  }
  
  /**
   * อัปเดต C4 level สำหรับ enhanced box
   */
  static async updateC4Level(
    container: Container, 
    newType: 'person' | 'system' | 'container' | 'component'
  ): Promise<Container> {
    const { C4BoxEnhancer } = await import('../components/C4BoxEnhancer');
    
    if (!C4BoxEnhancer.isEnhanced(container)) {
      console.warn('⚠️ Container ไม่มี enhancements ให้อัปเดต');
      return container;
    }
    
    // แมป type เป็น level
    const levelMapping = {
      person: 'level1',
      system: 'level2',
      container: 'level3', 
      component: 'level4'
    };
    
    const newLevel = levelMapping[newType] as 'level1' | 'level2' | 'level3' | 'level4';
    
    console.log(`🔄 Updating C4Box level from ${(container as any).enhancementData?.level} to ${newLevel}`);
    
    // อัปเดต metadata
    const nodeData = (container as any).nodeData;
    if (nodeData) {
      nodeData.nodeType = newType;
      nodeData.c4Level = newLevel;
    }
    
    return C4BoxEnhancer.updateEnhancementLevel(container, newLevel);
  }
  
  /**
   * ตรวจสอบ theme compliance สำหรับทุก enhanced boxes
   */
  static validateThemeCompliance(): boolean {
    console.log('🔍 Validating C4 theme compliance...');
    const isValid = C4ThemeHelper.validateAllThemes();
    
    if (isValid) {
      console.log('✅ All C4 themes pass WCAG AA contrast requirements');
    } else {
      console.warn('⚠️ Some C4 themes may not meet accessibility standards');
    }
    
    return isValid;
  }
}