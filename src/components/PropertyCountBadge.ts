// src/components/PropertyCountBadge.ts

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

/**
 * Property Count Badge Component
 * แสดงจำนวน Properties บน Node/Edge เป็น circular badge
 * ออกแบบตาม Jakob's Law (คุ้นเคยกับ notification badges) และ Fitts's Law (ขนาดเหมาะสำหรับการคลิก)
 */

export interface PropertyCountBadgeOptions {
  count: number;                          // จำนวน properties ที่จะแสดง
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'; // ตำแหน่งบน element
  maxDisplayCount?: number;               // จำนวนสูงสุดที่แสดง (เกินจะเป็น "9+")
  hasChanges?: boolean;                   // มีการเปลี่ยนแปลงหรือไม่ (เปลี่ยนสี)
  size?: 'small' | 'medium' | 'large';    // ขนาด badge
  theme?: 'light' | 'dark' | 'auto';      // ธีม
  onClick?: () => void;                   // callback เมื่อคลิก
  onHover?: (isHover: boolean) => void;   // callback เมื่อ hover
  visible?: boolean;                      // แสดงหรือซ่อน badge
  animated?: boolean;                     // เปิดใช้ animation
}

export interface PropertyCountBadgeTheme {
  backgroundColor: number;
  backgroundColorHover: number;
  backgroundColorChanged: number;
  textColor: number;
  borderColor?: number;
  borderWidth?: number;
  shadowColor?: number;
  shadowAlpha?: number;
}

// Theme presets
const BADGE_THEMES: Record<string, PropertyCountBadgeTheme> = {
  light: {
    backgroundColor: 0x667eea,
    backgroundColorHover: 0x5a6fd8,
    backgroundColorChanged: 0xff6b6b,
    textColor: 0xffffff,
    borderColor: 0xffffff,
    borderWidth: 1,
    shadowColor: 0x000000,
    shadowAlpha: 0.2
  },
  dark: {
    backgroundColor: 0x4a5568,
    backgroundColorHover: 0x2d3748,
    backgroundColorChanged: 0xe53e3e,
    textColor: 0xffffff,
    borderColor: 0x718096,
    borderWidth: 1,
    shadowColor: 0x000000,
    shadowAlpha: 0.3
  },
  auto: {
    backgroundColor: 0x667eea,
    backgroundColorHover: 0x5a6fd8,
    backgroundColorChanged: 0xff6b6b,
    textColor: 0xffffff,
    shadowColor: 0x000000,
    shadowAlpha: 0.2
  }
};

// Size presets (ตาม Fitts's Law - ขนาดเหมาะสำหรับการคลิก)
const BADGE_SIZES = {
  small: { diameter: 18, fontSize: 9, padding: 2 },
  medium: { diameter: 22, fontSize: 11, padding: 3 },
  large: { diameter: 26, fontSize: 12, padding: 4 }
};

export class PropertyCountBadge extends Container {
  private options: Required<PropertyCountBadgeOptions>;
  private background: Graphics;
  private countText: Text;
  private theme: PropertyCountBadgeTheme;
  private size: typeof BADGE_SIZES.medium;
  
  private isHovered: boolean = false;
  private animationId: number | null = null;

  constructor(options: PropertyCountBadgeOptions) {
    super();

    // กำหนดค่า default options
    this.options = {
      count: 0,
      position: 'top-right',
      maxDisplayCount: 9,
      hasChanges: false,
      size: 'medium',
      theme: 'auto',
      onClick: () => {},
      onHover: () => {},
      visible: true,
      animated: true,
      ...options
    };

    // เลือก theme และ size
    this.theme = BADGE_THEMES[this.options.theme];
    this.size = BADGE_SIZES[this.options.size];

    // สร้าง components
    this.background = new Graphics();
    this.countText = new Text('', this.createTextStyle());

    // เพิ่ม components เข้า container
    this.addChild(this.background);
    this.addChild(this.countText);

    // Setup interactions
    this.setupInteractions();

    // Initial render
    this.render();

    // เซ็ต visibility
    this.visible = this.options.visible;

    console.log('🏷️ สร้าง PropertyCountBadge:', {
      count: this.options.count,
      position: this.options.position,
      size: this.options.size
    });
  }

  /**
   * สร้าง text style สำหรับตัวเลข
   */
  private createTextStyle(): TextStyle {
    return new TextStyle({
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: this.size.fontSize,
      fontWeight: '600',
      fill: this.theme.textColor,
      align: 'center'
    });
  }

  /**
   * Setup การโต้ตอบ (click, hover)
   */
  private setupInteractions(): void {
    this.eventMode = 'static';
    this.cursor = 'pointer';

    // Mouse events
    this.on('pointerover', this.onPointerOver.bind(this));
    this.on('pointerout', this.onPointerOut.bind(this));
    this.on('pointerdown', this.onPointerDown.bind(this));
    this.on('pointerup', this.onPointerUp.bind(this));
    this.on('pointertap', this.onPointerTap.bind(this));
  }

  /**
   * Render badge ด้วยสี และ animation ที่เหมาะสม
   */
  private render(): void {
    this.renderBackground();
    this.renderText();
  }

  /**
   * Render background circle
   */
  private renderBackground(): void {
    this.background.clear();

    const radius = this.size.diameter / 2;
    let backgroundColor = this.theme.backgroundColor;

    // เปลี่ยนสีถ้ามีการเปลี่ยนแปลง
    if (this.options.hasChanges) {
      backgroundColor = this.theme.backgroundColorChanged;
    }

    // เปลี่ยนสีเมื่อ hover
    if (this.isHovered) {
      backgroundColor = this.theme.backgroundColorHover;
    }

    // วาดวงกลม
    this.background.circle(0, 0, radius);
    this.background.fill({ color: backgroundColor });

    // เพิ่มขอบถ้ามี
    if (this.theme.borderWidth && this.theme.borderColor !== undefined) {
      this.background.stroke({
        width: this.theme.borderWidth,
        color: this.theme.borderColor
      });
    }

    // เพิ่ม shadow effect (จำลองด้วย additional circle)
    if (this.theme.shadowColor && this.theme.shadowAlpha) {
      const shadowOffset = 2;
      this.background.circle(shadowOffset, shadowOffset, radius);
      this.background.fill({ 
        color: this.theme.shadowColor, 
        alpha: this.theme.shadowAlpha 
      });
      
      // วาดวงกลมหลักทับ shadow
      this.background.circle(0, 0, radius);
      this.background.fill({ color: backgroundColor });
      
      if (this.theme.borderWidth && this.theme.borderColor !== undefined) {
        this.background.stroke({
          width: this.theme.borderWidth,
          color: this.theme.borderColor
        });
      }
    }
  }

  /**
   * Render ตัวเลข count
   */
  private renderText(): void {
    let displayCount = this.options.count.toString();

    // แสดง "+" ถ้าเกินจำนวนสูงสุด
    if (this.options.count > this.options.maxDisplayCount) {
      displayCount = `${this.options.maxDisplayCount}+`;
    }

    // ซ่อนถ้า count เป็น 0
    if (this.options.count === 0) {
      this.visible = false;
      return;
    } else {
      this.visible = this.options.visible;
    }

    this.countText.text = displayCount;

    // จัดตำแหน่งตัวเลขให้อยู่กึ่งกลาง
    const textBounds = this.countText.getBounds();
    this.countText.x = -textBounds.width / 2;
    this.countText.y = -textBounds.height / 2;
  }

  /**
   * อัพเดท count และ render ใหม่
   */
  public updateCount(count: number, hasChanges?: boolean): void {
    const oldCount = this.options.count;
    this.options.count = count;
    
    if (hasChanges !== undefined) {
      this.options.hasChanges = hasChanges;
    }

    this.render();

    // เล่น animation ถ้า count เปลี่ยน
    if (this.options.animated && count !== oldCount && count > 0) {
      this.playUpdateAnimation();
    }

    console.log('🔄 อัพเดท PropertyCountBadge count:', oldCount, '→', count);
  }

  /**
   * เล่น animation เมื่อ count อัพเดท
   */
  private playUpdateAnimation(): void {
    if (!this.options.animated) return;

    // Scale animation (bounce effect)
    const originalScale = this.scale.x;
    const targetScale = originalScale * 1.3;
    const duration = 300;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out bounce
      const easeOutBounce = (t: number): number => {
        if (t < 1 / 2.75) {
          return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
          return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
          return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
          return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
      };

      let scale;
      if (progress < 0.5) {
        // Scale up
        scale = originalScale + (targetScale - originalScale) * easeOutBounce(progress * 2);
      } else {
        // Scale down
        scale = targetScale - (targetScale - originalScale) * easeOutBounce((progress - 0.5) * 2);
      }

      this.scale.set(scale);

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.scale.set(originalScale);
        this.animationId = null;
      }
    };

    // Cancel existing animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    animate();
  }

  /**
   * อัพเดท theme
   */
  public updateTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.options.theme = theme;
    this.theme = BADGE_THEMES[theme];
    
    // อัพเดท text style
    this.countText.style = this.createTextStyle();
    this.render();
  }

  /**
   * อัพเดท position บน parent element
   */
  public updatePosition(position: PropertyCountBadgeOptions['position']): void {
    this.options.position = position;
    // Position จะถูกกำหนดโดย parent element
  }

  /**
   * เซ็ต visibility
   */
  public setVisible(visible: boolean): void {
    this.options.visible = visible;
    this.visible = visible && this.options.count > 0;
  }

  /**
   * Event handlers
   */
  private onPointerOver(): void {
    this.isHovered = true;
    this.render();
    this.options.onHover(true);

    // Hover animation
    if (this.options.animated) {
      this.scale.set(1.1);
    }
  }

  private onPointerOut(): void {
    this.isHovered = false;
    this.render();
    this.options.onHover(false);

    // Reset scale
    if (this.options.animated) {
      this.scale.set(1.0);
    }
  }

  private onPointerDown(): void {
    // Click feedback
    if (this.options.animated) {
      this.scale.set(0.95);
    }
  }

  private onPointerUp(): void {
    // Reset scale
    if (this.options.animated) {
      this.scale.set(this.isHovered ? 1.1 : 1.0);
    }
  }

  private onPointerTap(): void {
    console.log('🎯 PropertyCountBadge คลิก - เปิด Property Drawer');
    this.options.onClick();

    // Click animation
    if (this.options.animated) {
      this.playClickAnimation();
    }
  }

  /**
   * เล่น animation เมื่อคลิก
   */
  private playClickAnimation(): void {
    const originalScale = 1.0;
    const clickScale = 0.9;
    const duration = 150;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      let scale;
      if (progress < 0.5) {
        // Scale down
        scale = originalScale - (originalScale - clickScale) * (progress * 2);
      } else {
        // Scale back up
        scale = clickScale + (originalScale - clickScale) * ((progress - 0.5) * 2);
      }

      this.scale.set(scale);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.scale.set(this.isHovered ? 1.1 : originalScale);
      }
    };

    animate();
  }

  /**
   * ได้ขนาดของ badge สำหรับ positioning
   */
  public getBadgeSize(): { width: number; height: number; radius: number } {
    const radius = this.size.diameter / 2;
    return {
      width: this.size.diameter,
      height: this.size.diameter,
      radius
    };
  }

  /**
   * ล้าง resources
   */
  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    super.destroy({ children: true });
  }
}

/**
 * Helper function สำหรับการใช้งาน PropertyCountBadge
 */
export function createPropertyCountBadge(options: PropertyCountBadgeOptions): PropertyCountBadge {
  return new PropertyCountBadge(options);
}

/**
 * Helper function สำหรับ positioning badge บน element
 */
export function positionBadgeOnElement(
  badge: PropertyCountBadge,
  elementBounds: { x: number; y: number; width: number; height: number },
  position: PropertyCountBadgeOptions['position'] = 'top-right',
  offset: { x: number; y: number } = { x: 8, y: 8 }
): void {
  const badgeSize = badge.getBadgeSize();
  const { x, y, width, height } = elementBounds;

  switch (position) {
    case 'top-right':
      badge.x = x + width - offset.x;
      badge.y = y + offset.y;
      break;
    case 'top-left':
      badge.x = x + offset.x;
      badge.y = y + offset.y;
      break;
    case 'bottom-right':
      badge.x = x + width - offset.x;
      badge.y = y + height - offset.y;
      break;
    case 'bottom-left':
      badge.x = x + offset.x;
      badge.y = y + height - offset.y;
      break;
  }
}