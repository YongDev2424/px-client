// src/utils/C4Themes.ts

/**
 * C4 Theme System - กำหนดสีและสไตล์สำหรับ C4 Components แต่ละระดับ
 * ตาม Requirement 6.2: Level 1 (blue), Level 2 (green), Level 3 (orange), Level 4 (gray)
 */

export interface C4LevelTheme {
  primaryColor: number;      // สีหลักของ component
  secondaryColor: number;    // สีรอง (สำหรับ border หรือ accent)
  textColor: number;         // สีข้อความ
  hoverColor: number;        // สีเมื่อ hover
  selectedColor: number;     // สีเมื่อถูก select
  shadowColor: number;       // สีเงา
  iconSymbol: string;        // สัญลักษณ์ไอคอน
}

export interface C4StyleOptions {
  enableEnhancedStyling?: boolean;
  level?: 'level1' | 'level2' | 'level3' | 'level4';
  enableRoundedCorners?: boolean;
  enableShadows?: boolean;
  enableIcons?: boolean;
  cornerRadius?: number;
  shadowOffset?: { x: number; y: number };
  shadowBlur?: number;
}

/**
 * C4 Level Themes - ตาม C4 Model Standards และ Requirements 6.2
 */
export const C4_THEMES: Record<string, C4LevelTheme> = {
  level1: {
    primaryColor: 0x0B61A4,      // Blue tones - Person/Actor
    secondaryColor: 0x1976D2,    // Lighter blue for borders
    textColor: 0xFFFFFF,         // White text for contrast
    hoverColor: 0x1565C0,        // Darker blue on hover
    selectedColor: 0x0D47A1,     // Even darker blue when selected
    shadowColor: 0x000000,       // Black shadow
    iconSymbol: '👤'             // Person icon
  },
  
  level2: {
    primaryColor: 0x2E7D32,      // Green tones - System
    secondaryColor: 0x388E3C,    // Lighter green for borders
    textColor: 0xFFFFFF,         // White text for contrast
    hoverColor: 0x2C6B2F,        // Darker green on hover
    selectedColor: 0x1B5E20,     // Even darker green when selected
    shadowColor: 0x000000,       // Black shadow
    iconSymbol: '🏢'             // System/Building icon
  },
  
  level3: {
    primaryColor: 0xF57C00,      // Orange tones - Container
    secondaryColor: 0xFF9800,    // Lighter orange for borders
    textColor: 0xFFFFFF,         // White text for contrast
    hoverColor: 0xEF6C00,        // Darker orange on hover
    selectedColor: 0xE65100,     // Even darker orange when selected
    shadowColor: 0x000000,       // Black shadow
    iconSymbol: '📦'             // Container/Box icon
  },
  
  level4: {
    primaryColor: 0x616161,      // Gray tones - Component
    secondaryColor: 0x757575,    // Lighter gray for borders
    textColor: 0xFFFFFF,         // White text for contrast
    hoverColor: 0x424242,        // Darker gray on hover
    selectedColor: 0x212121,     // Even darker gray when selected
    shadowColor: 0x000000,       // Black shadow
    iconSymbol: '⚙️'             // Component/Gear icon
  }
};

/**
 * Default Style Options สำหรับ Enhanced C4 Styling
 */
export const DEFAULT_STYLE_OPTIONS: C4StyleOptions = {
  enableEnhancedStyling: true,
  level: 'level1',
  enableRoundedCorners: true,
  enableShadows: true,
  enableIcons: true,
  cornerRadius: 8,              // 8px corner radius ตาม 8px grid system
  shadowOffset: { x: 2, y: 2 }, // Subtle shadow offset
  shadowBlur: 4                 // Soft shadow blur
};

/**
 * Helper Functions สำหรับการจัดการ Theme
 */
export class C4ThemeHelper {
  /**
   * ได้ theme สำหรับ C4 level ที่กำหนด
   */
  static getThemeForLevel(level: string): C4LevelTheme {
    return C4_THEMES[level] || C4_THEMES.level1;
  }
  
  /**
   * ตรวจสอบว่าสีมี contrast ratio ที่เพียงพอหรือไม่ (WCAG AA = 4.5:1)
   */
  static checkContrastRatio(backgroundColor: number, textColor: number): boolean {
    // Simplified contrast check - ในการใช้งานจริงควรใช้ library เฉพาะ
    const bgLuminance = this.getLuminance(backgroundColor);
    const textLuminance = this.getLuminance(textColor);
    
    const contrast = (Math.max(bgLuminance, textLuminance) + 0.05) / 
                    (Math.min(bgLuminance, textLuminance) + 0.05);
    
    return contrast >= 4.5; // WCAG AA standard
  }
  
  /**
   * คำนวณ luminance ของสี (simplified version)
   */
  private static getLuminance(color: number): number {
    const r = ((color >> 16) & 0xFF) / 255;
    const g = ((color >> 8) & 0xFF) / 255;
    const b = (color & 0xFF) / 255;
    
    // Simplified luminance calculation
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
  
  /**
   * สร้าง style options ที่ปรับแต่งแล้วสำหรับ level ที่กำหนด
   */
  static createStyleOptionsForLevel(
    level: 'level1' | 'level2' | 'level3' | 'level4',
    customOptions?: Partial<C4StyleOptions>
  ): C4StyleOptions {
    return {
      ...DEFAULT_STYLE_OPTIONS,
      level,
      ...customOptions
    };
  }
  
  /**
   * ตรวจสอบว่า theme ทั้งหมดมี contrast ratio ที่เหมาะสม
   */
  static validateAllThemes(): boolean {
    for (const [levelName, theme] of Object.entries(C4_THEMES)) {
      const isValid = this.checkContrastRatio(theme.primaryColor, theme.textColor);
      if (!isValid) {
        console.warn(`⚠️ Theme สำหรับ ${levelName} ไม่ผ่าน WCAG AA contrast requirements`);
        return false;
      }
    }
    return true;
  }
}

/**
 * Utility Functions สำหรับการแปลงสี
 */
export class ColorUtils {
  /**
   * แปลงสี hex เป็น RGB object
   */
  static hexToRgb(hex: number): { r: number; g: number; b: number } {
    return {
      r: (hex >> 16) & 0xFF,
      g: (hex >> 8) & 0xFF,
      b: hex & 0xFF
    };
  }
  
  /**
   * แปลง RGB เป็น hex
   */
  static rgbToHex(r: number, g: number, b: number): number {
    return (r << 16) | (g << 8) | b;
  }
  
  /**
   * ทำให้สีเข้มขึ้น (สำหรับ hover/selected states)
   */
  static darkenColor(color: number, factor: number = 0.8): number {
    const rgb = this.hexToRgb(color);
    return this.rgbToHex(
      Math.floor(rgb.r * factor),
      Math.floor(rgb.g * factor),
      Math.floor(rgb.b * factor)
    );
  }
  
  /**
   * ทำให้สีสว่างขึ้น (สำหรับ accent colors)
   */
  static lightenColor(color: number, factor: number = 1.2): number {
    const rgb = this.hexToRgb(color);
    return this.rgbToHex(
      Math.min(255, Math.floor(rgb.r * factor)),
      Math.min(255, Math.floor(rgb.g * factor)),
      Math.min(255, Math.floor(rgb.b * factor))
    );
  }
}