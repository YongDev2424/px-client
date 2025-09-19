/**
 * ThemeManager - จัดการระบบธีมแบบ additive approach
 * 
 * คลาสนี้ให้ความสามารถในการเปลี่ยนธีมโดยไม่ทำลายการทำงานของธีมเดิม
 * ใช้ระบบ CSS class เพื่อเปิด/ปิดธีมที่ปรับปรุงแล้ว
 */

export interface ThemeConfig {
  /** ชื่อธีม */
  name: string;
  /** CSS class ที่จะใช้ */
  className: string;
  /** คำอธิบายธีม */
  description: string;
  /** ระดับ contrast ratio */
  contrastRatio: number;
  /** รองรับ accessibility หรือไม่ */
  accessibilityCompliant: boolean;
}

export interface ThemeState {
  /** ธีมปัจจุบัน */
  currentTheme: string;
  /** ธีมที่เปิดใช้งานได้ */
  availableThemes: ThemeConfig[];
  /** การตั้งค่า accessibility */
  accessibilitySettings: {
    highContrast: boolean;
    reducedMotion: boolean;
    largeText: boolean;
  };
}

/**
 * ThemeManager - จัดการระบบธีมและ accessibility
 */
export class ThemeManager {
  private static instance: ThemeManager;
  private currentState: ThemeState;
  private readonly STORAGE_KEY = 'dashboard-theme-preferences';
  private readonly DEFAULT_THEME = 'default';
  private readonly ENHANCED_THEME = 'enhanced';

  /** ธีมที่รองรับ */
  private readonly themes: Map<string, ThemeConfig> = new Map([
    [this.DEFAULT_THEME, {
      name: 'Default Dark',
      className: '',
      description: 'ธีมมาตรฐานที่มีอยู่เดิม - WCAG AA compliant',
      contrastRatio: 4.5,
      accessibilityCompliant: true
    }],
    [this.ENHANCED_THEME, {
      name: 'Enhanced Dark',
      className: 'enhanced-theme',
      description: 'ธีมที่ปรับปรุงแล้ว - WCAG AAA compliant พร้อม GitHub-inspired design',
      contrastRatio: 7.1,
      accessibilityCompliant: true
    }]
  ]);

  private constructor() {
    this.currentState = this.loadState();
    this.initializeTheme();
    this.setupAccessibilityListeners();
  }

  /**
   * รับ instance ของ ThemeManager (Singleton pattern)
   */
  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * เปิดใช้งานธีมที่ปรับปรุงแล้ว
   * @param enabled - true เพื่อเปิดใช้งาน, false เพื่อกลับไปใช้ธีมเดิม
   */
  public enableEnhancedTheme(enabled: boolean = true): void {
    const targetTheme = enabled ? this.ENHANCED_THEME : this.DEFAULT_THEME;
    this.setTheme(targetTheme);
  }

  /**
   * เปลี่ยนธีม
   * @param themeName - ชื่อธีมที่ต้องการใช้
   */
  public setTheme(themeName: string): void {
    const theme = this.themes.get(themeName);
    if (!theme) {
      console.warn(`Theme "${themeName}" not found. Using default theme.`);
      return;
    }

    // ลบ CSS class ของธีมเก่าทั้งหมด
    this.clearAllThemeClasses();

    // เพิ่ม CSS class ของธีมใหม่ (ถ้ามี)
    if (theme.className) {
      document.body.classList.add(theme.className);
    }

    // อัพเดท state
    this.currentState.currentTheme = themeName;
    this.saveState();

    // ส่ง event เพื่อแจ้งการเปลี่ยนธีม
    this.dispatchThemeChangeEvent(theme);

    console.log(`Theme changed to: ${theme.name} (${theme.description})`);
  }

  /**
   * รับธีมปัจจุบัน
   */
  public getCurrentTheme(): ThemeConfig | undefined {
    return this.themes.get(this.currentState.currentTheme);
  }

  /**
   * รับรายการธีมทั้งหมด
   */
  public getAvailableThemes(): ThemeConfig[] {
    return Array.from(this.themes.values());
  }

  /**
   * ตรวจสอบว่าใช้ธีมที่ปรับปรุงแล้วหรือไม่
   */
  public isEnhancedThemeEnabled(): boolean {
    return this.currentState.currentTheme === this.ENHANCED_THEME;
  }

  /**
   * เปิด/ปิด high contrast mode
   */
  public setHighContrast(enabled: boolean): void {
    this.currentState.accessibilitySettings.highContrast = enabled;
    
    if (enabled) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    this.saveState();
    this.dispatchAccessibilityChangeEvent();
  }

  /**
   * เปิด/ปิด reduced motion
   */
  public setReducedMotion(enabled: boolean): void {
    this.currentState.accessibilitySettings.reducedMotion = enabled;
    
    if (enabled) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }

    this.saveState();
    this.dispatchAccessibilityChangeEvent();
  }

  /**
   * เปิด/ปิด large text mode
   */
  public setLargeText(enabled: boolean): void {
    this.currentState.accessibilitySettings.largeText = enabled;
    
    if (enabled) {
      document.body.classList.add('large-text');
    } else {
      document.body.classList.remove('large-text');
    }

    this.saveState();
    this.dispatchAccessibilityChangeEvent();
  }

  /**
   * รับการตั้งค่า accessibility ปัจจุบัน
   */
  public getAccessibilitySettings() {
    return { ...this.currentState.accessibilitySettings };
  }

  /**
   * รีเซ็ตธีมกลับไปเป็นค่าเริ่มต้น
   */
  public resetToDefault(): void {
    this.setTheme(this.DEFAULT_THEME);
    this.setHighContrast(false);
    this.setReducedMotion(false);
    this.setLargeText(false);
  }

  /**
   * ตรวจสอบ browser preferences และปรับการตั้งค่าตาม
   */
  public syncWithBrowserPreferences(): void {
    // ตรวจสอบ prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.setReducedMotion(true);
    }

    // ตรวจสอบ prefers-contrast
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.setHighContrast(true);
    }

    // ตรวจสอบ prefers-color-scheme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark && this.currentState.currentTheme === this.DEFAULT_THEME) {
      // ถ้า user ชอบ dark mode และยังใช้ธีมเริ่มต้น อาจแนะนำให้ใช้ enhanced theme
      console.log('User prefers dark mode. Enhanced theme is available for better experience.');
    }
  }

  /**
   * โหลด state จาก localStorage
   */
  private loadState(): ThemeState {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          currentTheme: parsed.currentTheme || this.DEFAULT_THEME,
          availableThemes: Array.from(this.themes.values()),
          accessibilitySettings: {
            highContrast: parsed.accessibilitySettings?.highContrast || false,
            reducedMotion: parsed.accessibilitySettings?.reducedMotion || false,
            largeText: parsed.accessibilitySettings?.largeText || false
          }
        };
      }
    } catch (error) {
      console.warn('Failed to load theme preferences:', error);
    }

    // ค่าเริ่มต้น
    return {
      currentTheme: this.DEFAULT_THEME,
      availableThemes: Array.from(this.themes.values()),
      accessibilitySettings: {
        highContrast: false,
        reducedMotion: false,
        largeText: false
      }
    };
  }

  /**
   * บันทึก state ไปยัง localStorage
   */
  private saveState(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        currentTheme: this.currentState.currentTheme,
        accessibilitySettings: this.currentState.accessibilitySettings
      }));
    } catch (error) {
      console.warn('Failed to save theme preferences:', error);
    }
  }

  /**
   * เริ่มต้นธีมตาม state ที่โหลดมา
   */
  private initializeTheme(): void {
    const theme = this.themes.get(this.currentState.currentTheme);
    if (theme && theme.className) {
      document.body.classList.add(theme.className);
    }

    // ใช้การตั้งค่า accessibility
    if (this.currentState.accessibilitySettings.highContrast) {
      document.body.classList.add('high-contrast');
    }
    if (this.currentState.accessibilitySettings.reducedMotion) {
      document.body.classList.add('reduced-motion');
    }
    if (this.currentState.accessibilitySettings.largeText) {
      document.body.classList.add('large-text');
    }
  }

  /**
   * ลบ CSS class ของธีมทั้งหมด
   */
  private clearAllThemeClasses(): void {
    this.themes.forEach(theme => {
      if (theme.className) {
        document.body.classList.remove(theme.className);
      }
    });
  }

  /**
   * ตั้งค่า event listeners สำหรับ browser preferences
   */
  private setupAccessibilityListeners(): void {
    // ฟัง prefers-reduced-motion changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', (e) => {
      if (e.matches) {
        this.setReducedMotion(true);
      }
    });

    // ฟัง prefers-contrast changes
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    highContrastQuery.addEventListener('change', (e) => {
      if (e.matches) {
        this.setHighContrast(true);
      }
    });
  }

  /**
   * ส่ง custom event เมื่อธีมเปลี่ยน
   */
  private dispatchThemeChangeEvent(theme: ThemeConfig): void {
    const event = new CustomEvent('themeChanged', {
      detail: {
        theme,
        isEnhanced: this.isEnhancedThemeEnabled(),
        contrastRatio: theme.contrastRatio
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * ส่ง custom event เมื่อการตั้งค่า accessibility เปลี่ยน
   */
  private dispatchAccessibilityChangeEvent(): void {
    const event = new CustomEvent('accessibilityChanged', {
      detail: {
        settings: this.getAccessibilitySettings()
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * ทำลาย instance (สำหรับ testing หรือ cleanup)
   */
  public destroy(): void {
    this.clearAllThemeClasses();
    document.body.classList.remove('high-contrast', 'reduced-motion', 'large-text');
    ThemeManager.instance = null as any;
  }
}

/**
 * Helper function สำหรับการใช้งานง่าย
 */
export const themeManager = ThemeManager.getInstance();

/**
 * Type definitions สำหรับ custom events
 */
declare global {
  interface DocumentEventMap {
    'themeChanged': CustomEvent<{
      theme: ThemeConfig;
      isEnhanced: boolean;
      contrastRatio: number;
    }>;
    'accessibilityChanged': CustomEvent<{
      settings: {
        highContrast: boolean;
        reducedMotion: boolean;
        largeText: boolean;
      };
    }>;
  }
}