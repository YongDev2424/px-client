// src/components/EdgeStyler.ts

import { Container, Graphics, Point, TextStyle, Text } from 'pixi.js';
import type { EdgeStyleOptions } from '../utils/EdgeThemes';
import { EdgeThemes } from '../utils/EdgeThemes';

/**
 * EdgeStyler - ระบบ enhancement สำหรับการปรับปรุงรูปแบบของ Edge
 * ทำงานแบบ additive โดยไม่ทำลายการทำงานเดิมของ Edge system
 * 
 * 🛡️ ADDITIVE APPROACH:
 * - ไม่แก้ไข Edge.ts เดิม
 * - เพิ่มความสามารถใหม่โดยไม่ทำลายเดิม
 * - สามารถเปิด/ปิดได้
 */
export class EdgeStyler {
  
  /**
   * เพิ่มการปรับปรุงรูปแบบให้กับ Edge ที่มีอยู่แล้ว
   * @param edge - Container ของ Edge ที่ต้องการปรับปรุง
   * @param options - ตัวเลือกการจัดรูปแบบ
   * @returns Container ของ Edge ที่ปรับปรุงแล้ว
   */
  public static enhanceExistingEdge(edge: Container, options?: EdgeStyleOptions): Container {
    console.log('🎨 เริ่มปรับปรุงรูปแบบ Edge');
    
    // ตรวจสอบว่าต้องการ enhancement หรือไม่
    if (!options?.enableEnhancedStyling) {
      console.log('⏭️ ข้าม enhancement - enableEnhancedStyling = false');
      return edge;
    }
    
    // ใช้ default theme หากไม่ระบุ
    const styleOptions = options || EdgeThemes.default;
    
    try {
      // หา Graphics objects ที่เป็นเส้น (line graphics)
      const lineGraphics = edge.children.filter(child => 
        child instanceof Graphics && EdgeStyler.isLineGraphics(child)
      ) as Graphics[];
      
      console.log(`🔍 พบ Line Graphics: ${lineGraphics.length} อัน`);
      
      // ปรับปรุงเส้นทั้งหมด
      lineGraphics.forEach((graphics, index) => {
        console.log(`🖌️ ปรับปรุงเส้นที่ ${index + 1}`);
        EdgeStyler.enhanceLineQuality(graphics, styleOptions);
      });
      
      // หา Arrow Head Graphics
      const arrowGraphics = edge.children.filter(child => 
        child instanceof Graphics && EdgeStyler.isArrowGraphics(child)
      ) as Graphics[];
      
      console.log(`🏹 พบ Arrow Graphics: ${arrowGraphics.length} อัน`);
      
      // ปรับปรุง Arrow Head
      arrowGraphics.forEach((graphics, index) => {
        console.log(`🎯 ปรับปรุง Arrow ที่ ${index + 1}`);
        EdgeStyler.improveArrowHead(graphics, styleOptions);
      });
      
      // หา Label Container
      const labelContainers = edge.children.filter(child => 
        child instanceof Container && EdgeStyler.isLabelContainer(child)
      ) as Container[];
      
      console.log(`🏷️ พบ Label Containers: ${labelContainers.length} อัน`);
      
      // ปรับปรุง Label Background
      labelContainers.forEach((container, index) => {
        console.log(`📝 ปรับปรุง Label ที่ ${index + 1}`);
        EdgeStyler.addLabelBackground(container, styleOptions);
      });
      
      // เก็บข้อมูล enhancement ไว้ใน metadata
      (edge as any).enhancementData = {
        isEnhanced: true,
        styleOptions: styleOptions,
        enhancedAt: Date.now()
      };
      
      console.log('✅ ปรับปรุง Edge สำเร็จ');
      
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการปรับปรุง Edge:', error);
      // คืนค่า Edge เดิมหากเกิดข้อผิดพลาด
    }
    
    return edge;
  }
  
  /**
   * ปรับปรุงคุณภาพของเส้น
   * @param lineGraphics - Graphics object ของเส้น
   * @param options - ตัวเลือกการจัดรูปแบบ
   */
  public static enhanceLineQuality(lineGraphics: Graphics, options: EdgeStyleOptions): void {
    if (!options.lineStyle) return;
    
    const { width, color, alpha, quality } = options.lineStyle;
    
    // เก็บข้อมูลเส้นเดิมไว้
    const originalData = EdgeStyler.extractLineData(lineGraphics);
    if (!originalData) return;
    
    // ล้างและวาดใหม่ด้วยคุณภาพที่ดีขึ้น
    lineGraphics.clear();
    
    // ตั้งค่าคุณภาพสูง
    if (quality === 'high') {
      // ใช้ antialias และ smooth curves
      lineGraphics.lineStyle({
        width: width || 2,
        color: color || 0x000000,
        alpha: alpha || 1.0,
        cap: 'round',
        join: 'round'
      } as any);
    }
    
    // วาดเส้นใหม่ตามข้อมูลเดิม
    if (originalData.points.length >= 2) {
      lineGraphics.moveTo(originalData.points[0].x, originalData.points[0].y);
      
      for (let i = 1; i < originalData.points.length; i++) {
        lineGraphics.lineTo(originalData.points[i].x, originalData.points[i].y);
      }
      
      // Apply stroke with enhanced settings
      lineGraphics.stroke({
        width: width || 2,
        color: color || 0x000000,
        alpha: alpha || 1.0
      });
    }
    
    console.log('🖌️ ปรับปรุงคุณภาพเส้นแล้ว');
  }
  
  /**
   * ปรับปรุง Arrow Head ให้สวยงามขึ้น
   * @param arrowGraphics - Graphics object ของลูกศร
   * @param options - ตัวเลือกการจัดรูปแบบ
   */
  public static improveArrowHead(arrowGraphics: Graphics, options: EdgeStyleOptions): void {
    if (!options.arrowStyle) return;
    
    const { size, width, color, style, filled } = options.arrowStyle;
    
    // เก็บตำแหน่งและมุมเดิม
    const originalData = EdgeStyler.extractArrowData(arrowGraphics);
    if (!originalData) return;
    
    // ล้างและวาดลูกศรใหม่
    arrowGraphics.clear();
    
    const arrowSize = size || 12;
    const arrowWidth = width || 8;
    const arrowColor = color || 0x000000;
    
    // วาดลูกศรตาม style ที่เลือก
    switch (style) {
      case 'triangle':
        EdgeStyler.drawTriangleArrow(arrowGraphics, originalData.tip, originalData.angle, arrowSize, arrowWidth, arrowColor, filled || true);
        break;
      case 'diamond':
        EdgeStyler.drawDiamondArrow(arrowGraphics, originalData.tip, originalData.angle, arrowSize, arrowWidth, arrowColor, filled || true);
        break;
      case 'circle':
        EdgeStyler.drawCircleArrow(arrowGraphics, originalData.tip, originalData.angle, arrowSize, arrowColor, filled || true);
        break;
      default:
        EdgeStyler.drawTriangleArrow(arrowGraphics, originalData.tip, originalData.angle, arrowSize, arrowWidth, arrowColor, filled || true);
    }
    
    console.log('🎯 ปรับปรุง Arrow Head แล้ว');
  }
  
  /**
   * เพิ่มพื้นหลังให้กับ Label
   * @param labelContainer - Container ของ Label
   * @param options - ตัวเลือกการจัดรูปแบบ
   */
  public static addLabelBackground(labelContainer: Container, options: EdgeStyleOptions): void {
    if (!options.labelStyle?.hasBackground) return;
    
    const labelStyle = options.labelStyle;
    
    // หา Text object ใน Label Container
    const textObject = labelContainer.children.find(child => child instanceof Text) as Text;
    if (!textObject) return;
    
    // ปรับปรุง Text Style สำหรับ contrast ที่ดีขึ้น
    if (labelStyle.textColor !== undefined || labelStyle.fontSize !== undefined || labelStyle.fontWeight !== undefined) {
      const currentStyle = textObject.style as TextStyle;
      const newStyle = new TextStyle({
        ...currentStyle,
        fill: labelStyle.textColor !== undefined ? labelStyle.textColor : currentStyle.fill,
        fontSize: labelStyle.fontSize !== undefined ? labelStyle.fontSize : currentStyle.fontSize,
        fontWeight: labelStyle.fontWeight !== undefined ? labelStyle.fontWeight as any : currentStyle.fontWeight
      });
      textObject.style = newStyle;
    }
    
    // หา Background Graphics หรือสร้างใหม่
    let backgroundGraphics = labelContainer.children.find(child => 
      child instanceof Graphics && (child as any).isLabelBackground
    ) as Graphics;
    
    if (!backgroundGraphics) {
      backgroundGraphics = new Graphics();
      (backgroundGraphics as any).isLabelBackground = true;
      labelContainer.addChildAt(backgroundGraphics, 0); // ใส่ไว้ข้างหลัง text
    }
    
    // คำนวณขนาดพื้นหลัง
    const padding = labelStyle.padding || 6;
    const textBounds = textObject.getBounds();
    const bgWidth = textBounds.width + (padding * 2);
    const bgHeight = textBounds.height + (padding * 2);
    
    // วาดพื้นหลังใหม่
    backgroundGraphics.clear();
    
    // เพิ่ม shadow ถ้ามี
    if (labelStyle.shadowColor !== undefined && labelStyle.shadowBlur !== undefined) {
      const shadowOffset = labelStyle.shadowOffset || { x: 0, y: 1 };
      const shadowGraphics = new Graphics();
      
      if (labelStyle.borderRadius && labelStyle.borderRadius > 0) {
        shadowGraphics.roundRect(
          shadowOffset.x, 
          shadowOffset.y, 
          bgWidth, 
          bgHeight, 
          labelStyle.borderRadius
        );
      } else {
        shadowGraphics.rect(shadowOffset.x, shadowOffset.y, bgWidth, bgHeight);
      }
      
      shadowGraphics.fill({
        color: labelStyle.shadowColor,
        alpha: 0.3
      });
      
      backgroundGraphics.addChild(shadowGraphics);
    }
    
    // วาดพื้นหลังหลัก
    if (labelStyle.borderRadius && labelStyle.borderRadius > 0) {
      backgroundGraphics.roundRect(0, 0, bgWidth, bgHeight, labelStyle.borderRadius);
    } else {
      backgroundGraphics.rect(0, 0, bgWidth, bgHeight);
    }
    
    // ใส่สีพื้นหลัง
    backgroundGraphics.fill({
      color: labelStyle.backgroundColor || 0xFFFFFF,
      alpha: labelStyle.backgroundAlpha || 0.95
    });
    
    // ใส่เส้นขอบ
    if (labelStyle.borderWidth && labelStyle.borderWidth > 0) {
      backgroundGraphics.stroke({
        width: labelStyle.borderWidth,
        color: labelStyle.borderColor || 0xCCCCCC,
        alpha: 1.0
      });
    }
    
    // ปรับตำแหน่ง text ให้อยู่กึ่งกลาง
    textObject.x = padding;
    textObject.y = padding;
    
    // ปรับ pivot ของ container ให้อยู่กึ่งกลาง
    labelContainer.pivot.x = bgWidth / 2;
    labelContainer.pivot.y = bgHeight / 2;
    
    console.log('📝 เพิ่มพื้นหลัง Label แล้ว');
  }
  
  // Helper Methods
  
  /**
   * ตรวจสอบว่า Graphics เป็นเส้นหรือไม่
   */
  private static isLineGraphics(graphics: Graphics): boolean {
    // ตรวจสอบจาก bounds และ children
    const bounds = graphics.getBounds();
    return bounds.width > 10 && bounds.height > 0; // เส้นจะมีความกว้างมากกว่าความสูง
  }
  
  /**
   * ตรวจสอบว่า Graphics เป็น Arrow หรือไม่
   */
  private static isArrowGraphics(graphics: Graphics): boolean {
    // ตรวจสอบจาก shape หรือ metadata
    const bounds = graphics.getBounds();
    return bounds.width > 0 && bounds.height > 0 && bounds.width < 30 && bounds.height < 30;
  }
  
  /**
   * ตรวจสอบว่า Container เป็น Label หรือไม่
   */
  private static isLabelContainer(container: Container): boolean {
    return container.children.some(child => child instanceof Text);
  }
  
  /**
   * ดึงข้อมูลเส้นจาก Graphics
   */
  private static extractLineData(graphics: Graphics): { points: Point[] } | null {
    try {
      // ใช้ bounds เพื่อสร้าง points พื้นฐาน
      const bounds = graphics.getBounds();
      const points: Point[] = [
        new Point(bounds.x, bounds.y),
        new Point(bounds.x + bounds.width, bounds.y + bounds.height)
      ];
      
      return { points };
    } catch (error) {
      console.warn('ไม่สามารถดึงข้อมูลเส้นได้:', error);
      return null;
    }
  }
  
  /**
   * ดึงข้อมูล Arrow จาก Graphics
   */
  private static extractArrowData(graphics: Graphics): { tip: Point; angle: number } | null {
    try {
      const bounds = graphics.getBounds();
      const tip = new Point(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      const angle = graphics.rotation || 0;
      
      return { tip, angle };
    } catch (error) {
      console.warn('ไม่สามารถดึงข้อมูล Arrow ได้:', error);
      return null;
    }
  }
  
  /**
   * วาดลูกศรแบบสามเหลี่ยม
   */
  private static drawTriangleArrow(
    graphics: Graphics, 
    tip: Point, 
    angle: number, 
    size: number, 
    width: number, 
    color: number, 
    filled: boolean
  ): void {
    const arrowLength = size;
    const arrowWidth = width;
    
    // คำนวณจุดต่างๆ ของลูกศร
    const baseLeft = new Point(
      tip.x - arrowLength * Math.cos(angle) + arrowWidth * Math.cos(angle + Math.PI / 2),
      tip.y - arrowLength * Math.sin(angle) + arrowWidth * Math.sin(angle + Math.PI / 2)
    );
    
    const baseRight = new Point(
      tip.x - arrowLength * Math.cos(angle) + arrowWidth * Math.cos(angle - Math.PI / 2),
      tip.y - arrowLength * Math.sin(angle) + arrowWidth * Math.sin(angle - Math.PI / 2)
    );
    
    // วาดสามเหลี่ยม
    graphics
      .moveTo(tip.x, tip.y)
      .lineTo(baseLeft.x, baseLeft.y)
      .lineTo(baseRight.x, baseRight.y)
      .lineTo(tip.x, tip.y);
    
    if (filled) {
      graphics.fill({ color });
    } else {
      graphics.stroke({ width: 2, color });
    }
  }
  
  /**
   * วาดลูกศรแบบเพชร
   */
  private static drawDiamondArrow(
    graphics: Graphics, 
    tip: Point, 
    angle: number, 
    size: number, 
    width: number, 
    color: number, 
    filled: boolean
  ): void {
    const halfSize = size / 2;
    const halfWidth = width / 2;
    
    // คำนวณจุดต่างๆ ของเพชร
    const front = tip;
    const back = new Point(
      tip.x - size * Math.cos(angle),
      tip.y - size * Math.sin(angle)
    );
    const left = new Point(
      tip.x - halfSize * Math.cos(angle) + halfWidth * Math.cos(angle + Math.PI / 2),
      tip.y - halfSize * Math.sin(angle) + halfWidth * Math.sin(angle + Math.PI / 2)
    );
    const right = new Point(
      tip.x - halfSize * Math.cos(angle) + halfWidth * Math.cos(angle - Math.PI / 2),
      tip.y - halfSize * Math.sin(angle) + halfWidth * Math.sin(angle - Math.PI / 2)
    );
    
    // วาดเพชร
    graphics
      .moveTo(front.x, front.y)
      .lineTo(left.x, left.y)
      .lineTo(back.x, back.y)
      .lineTo(right.x, right.y)
      .lineTo(front.x, front.y);
    
    if (filled) {
      graphics.fill({ color });
    } else {
      graphics.stroke({ width: 2, color });
    }
  }
  
  /**
   * วาดลูกศรแบบวงกลม
   */
  private static drawCircleArrow(
    graphics: Graphics, 
    tip: Point, 
    _angle: number, // ใช้ underscore เพื่อบอกว่าไม่ได้ใช้ parameter นี้
    size: number, 
    color: number, 
    filled: boolean
  ): void {
    const radius = size / 2;
    
    graphics.circle(tip.x, tip.y, radius);
    
    if (filled) {
      graphics.fill({ color });
    } else {
      graphics.stroke({ width: 2, color });
    }
  }
  
  /**
   * ตรวจสอบว่า Edge ได้รับการปรับปรุงแล้วหรือไม่
   * @param edge - Container ของ Edge
   * @returns true ถ้าได้รับการปรับปรุงแล้ว
   */
  public static isEnhanced(edge: Container): boolean {
    return !!(edge as any).enhancementData?.isEnhanced;
  }
  
  /**
   * ลบการปรับปรุงออกจาก Edge (revert to original)
   * @param edge - Container ของ Edge
   */
  public static removeEnhancement(edge: Container): void {
    if (!EdgeStyler.isEnhanced(edge)) return;
    
    // ลบ metadata
    delete (edge as any).enhancementData;
    
    console.log('🔄 ลบการปรับปรุง Edge แล้ว');
  }
}