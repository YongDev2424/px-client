// src/utils/EdgeThemes.ts

/**
 * Edge Theme Definitions สำหรับการจัดรูปแบบ Edge ให้สวยงามและสอดคล้องกับ reference design
 * ระบบ theme นี้เป็น optional enhancement ที่ไม่ทำลายการทำงานเดิม
 */

export interface EdgeStyleOptions {
  enableEnhancedStyling?: boolean;
  lineStyle?: EdgeLineStyle;
  arrowStyle?: EdgeArrowStyle;
  labelStyle?: EdgeLabelStyle;
}

export interface EdgeLineStyle {
  width?: number;
  color?: number;
  alpha?: number;
  quality?: 'standard' | 'high';
  dashPattern?: number[]; // สำหรับเส้นประ
}

export interface EdgeArrowStyle {
  size?: number;
  width?: number;
  color?: number;
  style?: 'triangle' | 'diamond' | 'circle';
  filled?: boolean;
}

export interface EdgeLabelStyle {
  hasBackground?: boolean;
  backgroundColor?: number;
  backgroundAlpha?: number;
  borderColor?: number;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  textColor?: number;
  fontSize?: number;
  fontWeight?: string;
  shadowColor?: number;
  shadowBlur?: number;
  shadowOffset?: { x: number; y: number };
}

/**
 * Default Edge Themes ที่ออกแบบตาม reference design
 */
export const EdgeThemes = {
  /**
   * Theme เริ่มต้น - สะอาดและเรียบง่าย
   */
  default: {
    enableEnhancedStyling: true,
    lineStyle: {
      width: 2,
      color: 0x2C3E50,
      alpha: 1.0,
      quality: 'high' as const
    },
    arrowStyle: {
      size: 12,
      width: 8,
      color: 0x2C3E50,
      style: 'triangle' as const,
      filled: true
    },
    labelStyle: {
      hasBackground: true,
      backgroundColor: 0xFFFFFF,
      backgroundAlpha: 0.95,
      borderColor: 0xBDC3C7,
      borderWidth: 1,
      borderRadius: 4,
      padding: 6,
      textColor: 0x2C3E50,
      fontSize: 12,
      fontWeight: '500',
      shadowColor: 0x000000,
      shadowBlur: 2,
      shadowOffset: { x: 0, y: 1 }
    }
  } as EdgeStyleOptions,

  /**
   * Theme สำหรับ relationship ที่สำคัญ
   */
  primary: {
    enableEnhancedStyling: true,
    lineStyle: {
      width: 3,
      color: 0x3498DB,
      alpha: 1.0,
      quality: 'high' as const
    },
    arrowStyle: {
      size: 14,
      width: 10,
      color: 0x3498DB,
      style: 'triangle' as const,
      filled: true
    },
    labelStyle: {
      hasBackground: true,
      backgroundColor: 0x3498DB,
      backgroundAlpha: 1.0,
      borderColor: 0x2980B9,
      borderWidth: 1,
      borderRadius: 6,
      padding: 8,
      textColor: 0xFFFFFF,
      fontSize: 12,
      fontWeight: '600',
      shadowColor: 0x000000,
      shadowBlur: 3,
      shadowOffset: { x: 0, y: 2 }
    }
  } as EdgeStyleOptions,

  /**
   * Theme สำหรับ dependency relationship
   */
  dependency: {
    enableEnhancedStyling: true,
    lineStyle: {
      width: 2,
      color: 0x95A5A6,
      alpha: 0.8,
      quality: 'high' as const,
      dashPattern: [5, 3] // เส้นประ
    },
    arrowStyle: {
      size: 10,
      width: 6,
      color: 0x95A5A6,
      style: 'triangle' as const,
      filled: false
    },
    labelStyle: {
      hasBackground: true,
      backgroundColor: 0xF8F9FA,
      backgroundAlpha: 0.9,
      borderColor: 0x95A5A6,
      borderWidth: 1,
      borderRadius: 3,
      padding: 4,
      textColor: 0x7F8C8D,
      fontSize: 11,
      fontWeight: '400',
      shadowColor: 0x000000,
      shadowBlur: 1,
      shadowOffset: { x: 0, y: 1 }
    }
  } as EdgeStyleOptions,

  /**
   * Theme สำหรับ composition relationship
   */
  composition: {
    enableEnhancedStyling: true,
    lineStyle: {
      width: 2.5,
      color: 0xE74C3C,
      alpha: 1.0,
      quality: 'high' as const
    },
    arrowStyle: {
      size: 12,
      width: 8,
      color: 0xE74C3C,
      style: 'diamond' as const,
      filled: true
    },
    labelStyle: {
      hasBackground: true,
      backgroundColor: 0xE74C3C,
      backgroundAlpha: 1.0,
      borderColor: 0xC0392B,
      borderWidth: 1,
      borderRadius: 4,
      padding: 6,
      textColor: 0xFFFFFF,
      fontSize: 12,
      fontWeight: '500',
      shadowColor: 0x000000,
      shadowBlur: 2,
      shadowOffset: { x: 0, y: 1 }
    }
  } as EdgeStyleOptions,

  /**
   * Theme สำหรับ dark mode
   */
  dark: {
    enableEnhancedStyling: true,
    lineStyle: {
      width: 2,
      color: 0xECF0F1,
      alpha: 1.0,
      quality: 'high' as const
    },
    arrowStyle: {
      size: 12,
      width: 8,
      color: 0xECF0F1,
      style: 'triangle' as const,
      filled: true
    },
    labelStyle: {
      hasBackground: true,
      backgroundColor: 0x34495E,
      backgroundAlpha: 0.95,
      borderColor: 0x5D6D7E,
      borderWidth: 1,
      borderRadius: 4,
      padding: 6,
      textColor: 0xECF0F1,
      fontSize: 12,
      fontWeight: '500',
      shadowColor: 0x000000,
      shadowBlur: 3,
      shadowOffset: { x: 0, y: 2 }
    }
  } as EdgeStyleOptions
};

/**
 * Helper function สำหรับการผสม theme options
 * @param baseTheme - Theme พื้นฐาน
 * @param overrides - การปรับแต่งเพิ่มเติม
 * @returns Theme ที่ผสมแล้ว
 */
export function mergeEdgeTheme(
  baseTheme: EdgeStyleOptions, 
  overrides: Partial<EdgeStyleOptions>
): EdgeStyleOptions {
  return {
    enableEnhancedStyling: overrides.enableEnhancedStyling ?? baseTheme.enableEnhancedStyling,
    lineStyle: { ...baseTheme.lineStyle, ...overrides.lineStyle },
    arrowStyle: { ...baseTheme.arrowStyle, ...overrides.arrowStyle },
    labelStyle: { ...baseTheme.labelStyle, ...overrides.labelStyle }
  };
}

/**
 * Helper function สำหรับการสร้าง custom theme
 * @param options - การตั้งค่า theme
 * @returns EdgeStyleOptions ที่สมบูรณ์
 */
export function createCustomEdgeTheme(options: Partial<EdgeStyleOptions>): EdgeStyleOptions {
  return mergeEdgeTheme(EdgeThemes.default, options);
}

/**
 * Helper function สำหรับการเลือก theme ตาม relationship type
 * @param relationshipType - ประเภทของความสัมพันธ์
 * @returns EdgeStyleOptions ที่เหมาะสม
 */
export function getThemeForRelationship(relationshipType: string): EdgeStyleOptions {
  switch (relationshipType.toLowerCase()) {
    case 'uses':
    case 'depends':
    case 'dependency':
      return EdgeThemes.dependency;
    
    case 'contains':
    case 'composition':
      return EdgeThemes.composition;
    
    case 'primary':
    case 'main':
      return EdgeThemes.primary;
    
    default:
      return EdgeThemes.default;
  }
}

/**
 * Helper function สำหรับการปรับ theme ตาม UI mode
 * @param baseTheme - Theme พื้นฐาน
 * @param isDarkMode - โหมดมืดหรือไม่
 * @returns Theme ที่ปรับแล้ว
 */
export function adaptThemeForMode(baseTheme: EdgeStyleOptions, isDarkMode: boolean): EdgeStyleOptions {
  if (!isDarkMode) {
    return baseTheme;
  }
  
  // ปรับสีสำหรับ dark mode
  const darkAdaptation: Partial<EdgeStyleOptions> = {
    lineStyle: {
      ...baseTheme.lineStyle,
      color: baseTheme.lineStyle?.color ? lightenColor(baseTheme.lineStyle.color, 0.3) : 0xECF0F1
    },
    arrowStyle: {
      ...baseTheme.arrowStyle,
      color: baseTheme.arrowStyle?.color ? lightenColor(baseTheme.arrowStyle.color, 0.3) : 0xECF0F1
    },
    labelStyle: {
      ...baseTheme.labelStyle,
      backgroundColor: 0x34495E,
      textColor: 0xECF0F1,
      borderColor: 0x5D6D7E
    }
  };
  
  return mergeEdgeTheme(baseTheme, darkAdaptation);
}

/**
 * Helper function สำหรับการทำให้สีสว่างขึ้น
 * @param color - สีเดิม (hex number)
 * @param factor - ค่าการปรับ (0-1)
 * @returns สีที่สว่างขึ้น
 */
function lightenColor(color: number, factor: number): number {
  const r = (color >> 16) & 0xFF;
  const g = (color >> 8) & 0xFF;
  const b = color & 0xFF;
  
  const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
  const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
  const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
  
  return (newR << 16) | (newG << 8) | newB;
}