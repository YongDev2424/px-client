// src/components/C4BoxEnhancer.ts

import { Container, Graphics, Text } from 'pixi.js';
import { DEFAULT_STYLE_OPTIONS, C4ThemeHelper } from '../utils/C4Themes';
import type { C4StyleOptions } from '../utils/C4Themes';

/**
 * C4BoxEnhancer - เพิ่มการปรับปรุงสไตล์ให้กับ C4Box ที่มีอยู่แล้ว
 * โดยไม่ทำลายฟังก์ชันการทำงานเดิม (Additive Approach)
 * 
 * ตาม Requirements 6.1-6.6:
 * - Rounded rectangle shapes with shadows and borders
 * - Level-specific colors (Level 1-4)
 * - Icon system for C4 model standards
 * - Text readability improvements
 * - Hover and selection state enhancements
 */
export class C4BoxEnhancer {
  
  /**
   * เพิ่มการปรับปรุงสไตล์ให้กับ C4Box ที่มีอยู่แล้ว
   * @param c4Box - Container ของ C4Box ที่ต้องการปรับปรุง
   * @param options - ตัวเลือกการปรับปรุงสไตล์
   * @returns Container ที่ปรับปรุงแล้ว (เดิม + enhancements)
   */
  static enhanceExistingBox(c4Box: Container, options?: C4StyleOptions): Container {
    const finalOptions = { ...DEFAULT_STYLE_OPTIONS, ...options };
    
    // ตรวจสอบว่าต้องการ enhanced styling หรือไม่
    if (!finalOptions.enableEnhancedStyling) {
      return c4Box; // คืนค่า original box ถ้าไม่ต้องการ enhancement
    }
    
    console.log('🎨 Enhancing C4Box with level:', finalOptions.level);
    
    // ได้ theme สำหรับ level ที่กำหนด
    const theme = C4ThemeHelper.getThemeForLevel(finalOptions.level || 'level1');
    
    // ได้ existing graphics (rectangle หลัก)
    const existingGraphics = c4Box.children.find(child => child instanceof Graphics) as Graphics;
    if (!existingGraphics) {
      console.warn('⚠️ ไม่พบ Graphics component ใน C4Box');
      return c4Box;
    }
    
    // เพิ่ม enhancements ต่างๆ
    if (finalOptions.enableRoundedCorners) {
      this.addRoundedCorners(c4Box, existingGraphics, theme, finalOptions);
    }
    
    if (finalOptions.enableShadows) {
      this.addShadowEffect(c4Box, theme, finalOptions);
    }
    
    this.addLevelSpecificColors(c4Box, existingGraphics, theme);
    
    if (finalOptions.enableIcons) {
      this.addIconSystem(c4Box, theme, finalOptions);
    }
    
    this.enhanceTextReadability(c4Box, theme);
    this.addStateEnhancements(c4Box, theme);
    
    // เก็บ enhancement metadata
    (c4Box as any).enhancementData = {
      isEnhanced: true,
      level: finalOptions.level,
      theme: theme,
      options: finalOptions
    };
    
    console.log('✅ C4Box enhancement completed');
    return c4Box;
  }
  
  /**
   * เพิ่ม rounded corners ให้กับ existing graphics
   */
  private static addRoundedCorners(
    _container: Container, 
    existingGraphics: Graphics, 
    theme: any, 
    options: C4StyleOptions
  ): void {
    // สร้าง rounded rectangle ใหม่ที่จะแทนที่ existing rectangle
    const width = 200; // ใช้ขนาดเดิมจาก createC4Box
    const height = 100;
    const radius = options.cornerRadius || 8;
    
    // ล้าง existing graphics และวาดใหม่ด้วย rounded corners
    existingGraphics.clear();
    existingGraphics
      .fill(theme.primaryColor)
      .roundRect(0, 0, width, height, radius)
      .fill();
    
    // เพิ่ม border ถ้าต้องการ
    existingGraphics
      .stroke({ width: 2, color: theme.secondaryColor })
      .roundRect(0, 0, width, height, radius)
      .stroke();
    
    console.log('🔄 Added rounded corners with radius:', radius);
  }
  
  /**
   * เพิ่มเอฟเฟกต์เงาให้กับ container
   */
  private static addShadowEffect(
    container: Container, 
    theme: any, 
    options: C4StyleOptions
  ): void {
    // สร้าง shadow graphics
    const shadowGraphics = new Graphics();
    const width = 200;
    const height = 100;
    const radius = options.cornerRadius || 8;
    const shadowOffset = options.shadowOffset || { x: 2, y: 2 };
    
    // วาดเงาด้วยสีเทาโปร่งใส
    shadowGraphics
      .fill({ color: theme.shadowColor, alpha: 0.3 })
      .roundRect(
        shadowOffset.x, 
        shadowOffset.y, 
        width, 
        height, 
        radius
      )
      .fill();
    
    // เพิ่มเงาเป็น child แรก (ให้อยู่ด้านหลัง)
    container.addChildAt(shadowGraphics, 0);
    
    // เก็บ reference สำหรับการจัดการภายหลัง
    (container as any).shadowGraphics = shadowGraphics;
    
    console.log('🌫️ Added shadow effect');
  }
  
  /**
   * ใช้สีที่เฉพาะเจาะจงสำหรับแต่ละ C4 level
   */
  private static addLevelSpecificColors(
    container: Container, 
    existingGraphics: Graphics, 
    theme: any
  ): void {
    // อัปเดตสีของ existing graphics
    existingGraphics.tint = 0xFFFFFF; // Reset tint เพื่อให้สีใหม่แสดงถูกต้อง
    
    // เก็บสีเดิมไว้สำหรับการ fallback
    const originalColor = (container as any).nodeData?.boxColor || 0x4A90E2;
    
    // อัปเดต metadata ด้วยสีใหม่
    if ((container as any).nodeData) {
      (container as any).nodeData.originalColor = originalColor;
      (container as any).nodeData.enhancedColor = theme.primaryColor;
      (container as any).nodeData.level = theme;
    }
    
    console.log('🎨 Applied level-specific colors for theme:', theme);
  }
  
  /**
   * เพิ่มระบบไอคอนสำหรับ C4 model standards
   */
  private static addIconSystem(
    container: Container, 
    theme: any, 
    _options: C4StyleOptions
  ): void {
    // สร้าง icon text element
    const iconText = new Text({
      text: theme.iconSymbol,
      style: {
        fontSize: 24,
        fill: theme.textColor,
        fontFamily: 'Arial, sans-serif'
      }
    });
    
    // วางไอคอนที่มุมบนซ้าย
    iconText.x = 10;
    iconText.y = 10;
    iconText.anchor.set(0, 0);
    
    // เพิ่มไอคอนลงใน container
    container.addChild(iconText);
    
    // เก็บ reference สำหรับการจัดการภายหลัง
    (container as any).iconElement = iconText;
    
    console.log('🔣 Added icon system:', theme.iconSymbol);
  }
  
  /**
   * ปรับปรุงความชัดเจนของข้อความ
   */
  private static enhanceTextReadability(container: Container, theme: any): void {
    // หา existing label
    const existingLabel = (container as any).nodeLabel;
    if (!existingLabel) {
      console.warn('⚠️ ไม่พบ label element ใน C4Box');
      return;
    }
    
    // อัปเดตสีข้อความให้ตรงกับ theme
    if (existingLabel.style) {
      existingLabel.style.fill = theme.textColor;
      
      // เพิ่ม text shadow เพื่อความชัดเจน
      existingLabel.style.dropShadow = {
        color: theme.shadowColor,
        alpha: 0.5,
        angle: Math.PI / 4,
        blur: 2,
        distance: 1
      };
      
      // ตรวจสอบ contrast ratio
      const hasGoodContrast = C4ThemeHelper.checkContrastRatio(
        theme.primaryColor, 
        theme.textColor
      );
      
      if (!hasGoodContrast) {
        console.warn('⚠️ Text contrast อาจไม่เพียงพอสำหรับ WCAG AA');
      }
    }
    
    console.log('📝 Enhanced text readability');
  }
  
  /**
   * เพิ่ม hover และ selection state enhancements
   */
  private static addStateEnhancements(container: Container, theme: any): void {
    // เก็บ original event handlers (สำหรับอนาคต)
    // const originalPointerOver = container.listeners('pointerover');
    // const originalPointerOut = container.listeners('pointerout');
    
    // เพิ่ม enhanced hover effects
    container.on('pointerover', () => {
      const existingGraphics = container.children.find(child => child instanceof Graphics) as Graphics;
      if (existingGraphics) {
        // เปลี่ยนเป็นสี hover
        existingGraphics.clear();
        existingGraphics
          .fill(theme.hoverColor)
          .roundRect(0, 0, 200, 100, 8)
          .fill()
          .stroke({ width: 2, color: theme.secondaryColor })
          .roundRect(0, 0, 200, 100, 8)
          .stroke();
      }
    });
    
    container.on('pointerout', () => {
      // ตรวจสอบว่าถูก select อยู่หรือไม่
      const isSelected = (container as any).nodeData?.isSelected;
      const targetColor = isSelected ? theme.selectedColor : theme.primaryColor;
      
      const existingGraphics = container.children.find(child => child instanceof Graphics) as Graphics;
      if (existingGraphics) {
        // เปลี่ยนกลับเป็นสีเดิมหรือสี selected
        existingGraphics.clear();
        existingGraphics
          .fill(targetColor)
          .roundRect(0, 0, 200, 100, 8)
          .fill()
          .stroke({ width: 2, color: theme.secondaryColor })
          .roundRect(0, 0, 200, 100, 8)
          .stroke();
      }
    });
    
    // เพิ่ม selection state enhancement
    const originalSelectHandler = (container as any).selectHandler;
    (container as any).selectHandler = () => {
      // เรียก original handler ก่อน
      if (originalSelectHandler) {
        originalSelectHandler();
      }
      
      // เพิ่ม visual feedback สำหรับ selection
      const existingGraphics = container.children.find(child => child instanceof Graphics) as Graphics;
      if (existingGraphics) {
        existingGraphics.clear();
        existingGraphics
          .fill(theme.selectedColor)
          .roundRect(0, 0, 200, 100, 8)
          .fill()
          .stroke({ width: 3, color: theme.secondaryColor }) // หนาขึ้นเมื่อ select
          .roundRect(0, 0, 200, 100, 8)
          .stroke();
      }
    };
    
    console.log('🎯 Added state enhancements (hover/select)');
  }
  
  /**
   * ลบ enhancements และคืนค่าเป็น original state
   */
  static removeEnhancements(container: Container): Container {
    const enhancementData = (container as any).enhancementData;
    if (!enhancementData?.isEnhanced) {
      return container; // ไม่มี enhancements ให้ลบ
    }
    
    // ลบ shadow graphics
    const shadowGraphics = (container as any).shadowGraphics;
    if (shadowGraphics && shadowGraphics.parent) {
      shadowGraphics.parent.removeChild(shadowGraphics);
    }
    
    // ลบ icon element
    const iconElement = (container as any).iconElement;
    if (iconElement && iconElement.parent) {
      iconElement.parent.removeChild(iconElement);
    }
    
    // คืนค่า graphics เป็นสีเดิม
    const existingGraphics = container.children.find(child => child instanceof Graphics) as Graphics;
    const originalColor = (container as any).nodeData?.originalColor || 0x4A90E2;
    
    if (existingGraphics) {
      existingGraphics.clear();
      existingGraphics
        .fill(originalColor)
        .rect(0, 0, 200, 100)
        .fill();
    }
    
    // ลบ enhancement metadata
    delete (container as any).enhancementData;
    delete (container as any).shadowGraphics;
    delete (container as any).iconElement;
    
    console.log('🔄 Removed all enhancements, restored to original state');
    return container;
  }
  
  /**
   * ตรวจสอบว่า container มี enhancements หรือไม่
   */
  static isEnhanced(container: Container): boolean {
    return !!(container as any).enhancementData?.isEnhanced;
  }
  
  /**
   * อัปเดต enhancement level สำหรับ container ที่มี enhancements แล้ว
   */
  static updateEnhancementLevel(
    container: Container, 
    newLevel: 'level1' | 'level2' | 'level3' | 'level4'
  ): Container {
    if (!this.isEnhanced(container)) {
      console.warn('⚠️ Container ไม่มี enhancements ให้อัปเดต');
      return container;
    }
    
    const currentOptions = (container as any).enhancementData?.options;
    const newOptions = { ...currentOptions, level: newLevel };
    
    // ลบ enhancements เดิมและเพิ่มใหม่
    this.removeEnhancements(container);
    return this.enhanceExistingBox(container, newOptions);
  }
}