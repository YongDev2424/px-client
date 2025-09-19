// src/composables/useThemeActions.ts

import { useThemeState, ThemeConfig, AccessibilitySettings } from '../stores/themeState';

/**
 * Composable function สำหรับการจัดการ Theme actions
 * @returns Object ที่มี actions สำหรับจัดการ Theme และ Accessibility
 */
export function useThemeActions() {
  const {
    setTheme,
    enableEnhancedTheme,
    getCurrentTheme,
    getAvailableThemes,
    isEnhancedThemeEnabled,
    resetToDefault,
    setHighContrast,
    setReducedMotion,
    setLargeText,
    getAccessibilitySettings,
    syncWithBrowserPreferences
  } = useThemeState();

  return {
    // === Theme Management ===
    /**
     * เปลี่ยนธีม
     */
    setTheme: (themeName: string) => {
      setTheme(themeName);
    },

    /**
     * เปิด/ปิด Enhanced Theme
     */
    enableEnhanced: (enabled: boolean = true) => {
      enableEnhancedTheme(enabled);
    },

    /**
     * เปิดใช้ Enhanced Theme
     */
    useEnhancedTheme: () => {
      enableEnhancedTheme(true);
    },

    /**
     * กลับไปใช้ Default Theme
     */
    useDefaultTheme: () => {
      enableEnhancedTheme(false);
    },

    /**
     * สลับระหว่าง Default และ Enhanced Theme
     */
    toggleTheme: () => {
      const isEnhanced = isEnhancedThemeEnabled();
      enableEnhancedTheme(!isEnhanced);
    },

    /**
     * รีเซ็ตกลับไปเป็นค่าเริ่มต้น
     */
    reset: () => {
      resetToDefault();
    },

    // === Theme Information ===
    /**
     * ได้ธีมปัจจุบัน
     */
    getCurrentTheme: () => {
      return getCurrentTheme();
    },

    /**
     * ได้รายการธีมที่พร้อมใช้งาน
     */
    getAvailableThemes: () => {
      return getAvailableThemes();
    },

    /**
     * ตรวจสอบว่าใช้ Enhanced Theme หรือไม่
     */
    isEnhanced: () => {
      return isEnhancedThemeEnabled();
    },

    /**
     * ได้ชื่อธีมปัจจุบัน
     */
    getCurrentThemeName: () => {
      const theme = getCurrentTheme();
      return theme?.name || 'Unknown';
    },

    /**
     * ได้คำอธิบายธีมปัจจุบัน
     */
    getCurrentThemeDescription: () => {
      const theme = getCurrentTheme();
      return theme?.description || '';
    },

    // === Accessibility Management ===
    /**
     * เปิด/ปิด High Contrast mode
     */
    setHighContrast: (enabled: boolean) => {
      setHighContrast(enabled);
    },

    /**
     * เปิด/ปิด Reduced Motion mode
     */
    setReducedMotion: (enabled: boolean) => {
      setReducedMotion(enabled);
    },

    /**
     * เปิด/ปิด Large Text mode
     */
    setLargeText: (enabled: boolean) => {
      setLargeText(enabled);
    },

    /**
     * เปิด High Contrast mode
     */
    enableHighContrast: () => {
      setHighContrast(true);
    },

    /**
     * ปิด High Contrast mode
     */
    disableHighContrast: () => {
      setHighContrast(false);
    },

    /**
     * สลับ High Contrast mode
     */
    toggleHighContrast: () => {
      const settings = getAccessibilitySettings();
      setHighContrast(!settings.highContrast);
    },

    /**
     * เปิด Reduced Motion mode
     */
    enableReducedMotion: () => {
      setReducedMotion(true);
    },

    /**
     * ปิด Reduced Motion mode
     */
    disableReducedMotion: () => {
      setReducedMotion(false);
    },

    /**
     * สลับ Reduced Motion mode
     */
    toggleReducedMotion: () => {
      const settings = getAccessibilitySettings();
      setReducedMotion(!settings.reducedMotion);
    },

    /**
     * เปิด Large Text mode
     */
    enableLargeText: () => {
      setLargeText(true);
    },

    /**
     * ปิด Large Text mode
     */
    disableLargeText: () => {
      setLargeText(false);
    },

    /**
     * สลับ Large Text mode
     */
    toggleLargeText: () => {
      const settings = getAccessibilitySettings();
      setLargeText(!settings.largeText);
    },

    // === Accessibility Information ===
    /**
     * ได้การตั้งค่า Accessibility ปัจจุบัน
     */
    getAccessibilitySettings: () => {
      return getAccessibilitySettings();
    },

    /**
     * ตรวจสอบว่าเปิด High Contrast หรือไม่
     */
    isHighContrastEnabled: () => {
      return getAccessibilitySettings().highContrast;
    },

    /**
     * ตรวจสอบว่าเปิด Reduced Motion หรือไม่
     */
    isReducedMotionEnabled: () => {
      return getAccessibilitySettings().reducedMotion;
    },

    /**
     * ตรวจสอบว่าเปิด Large Text หรือไม่
     */
    isLargeTextEnabled: () => {
      return getAccessibilitySettings().largeText;
    },

    /**
     * ตรวจสอบว่ามีการตั้งค่า Accessibility ใดๆ หรือไม่
     */
    hasAccessibilitySettings: () => {
      const settings = getAccessibilitySettings();
      return settings.highContrast || settings.reducedMotion || settings.largeText;
    },

    // === Browser Integration ===
    /**
     * Sync การตั้งค่ากับ Browser Preferences
     */
    syncWithBrowser: () => {
      syncWithBrowserPreferences();
    },

    /**
     * ตรวจสอบและนำ Browser Preferences มาใช้อัตโนมัติ
     */
    autoConfigureFromBrowser: () => {
      // ตรวจสอบ prefers-reduced-motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setReducedMotion(true);
      }

      // ตรวจสอบ prefers-contrast
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        setHighContrast(true);
      }

      // ตรวจสอบ prefers-color-scheme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark && !isEnhancedThemeEnabled()) {
        console.log('User prefers dark mode. Consider enabling enhanced theme.');
      }
    }
  };
}

/**
 * Hook สำหรับ reactive theme state
 * ใช้เมื่อต้องการให้ component react ต่อการเปลี่ยนแปลงของ theme
 */
export function useThemeStateReactive() {
  // Subscribe ต่อ store state
  const currentTheme = useThemeState.getState().currentTheme;
  const accessibilitySettings = useThemeState.getState().accessibilitySettings;
  const availableThemes = useThemeState.getState().availableThemes;

  // ได้ theme config ปัจจุบัน
  const currentThemeConfig = availableThemes.get(currentTheme);

  return {
    currentTheme,
    currentThemeConfig,
    accessibilitySettings,
    availableThemes: Array.from(availableThemes.values()),
    
    // Computed values
    isEnhanced: currentTheme === 'enhanced',
    isDefault: currentTheme === 'default',
    
    // Accessibility states
    isHighContrast: accessibilitySettings.highContrast,
    isReducedMotion: accessibilitySettings.reducedMotion,
    isLargeText: accessibilitySettings.largeText,
    hasAnyAccessibility: accessibilitySettings.highContrast || 
                        accessibilitySettings.reducedMotion || 
                        accessibilitySettings.largeText,
    
    // Theme information
    themeName: currentThemeConfig?.name || 'Unknown',
    themeDescription: currentThemeConfig?.description || '',
    contrastRatio: currentThemeConfig?.contrastRatio || 0,
    isAccessibilityCompliant: currentThemeConfig?.accessibilityCompliant || false
  };
}

/**
 * Hook สำหรับการจัดการ Theme Presets
 */
export function useThemePresets() {
  const themeActions = useThemeActions();

  return {
    /**
     * ใช้ค่าที่แนะนำสำหรับ Accessibility
     */
    applyAccessibilityPreset: () => {
      themeActions.enableHighContrast();
      themeActions.enableReducedMotion();
      themeActions.enableLargeText();
      themeActions.useEnhancedTheme(); // Enhanced theme มี contrast ดีกว่า
      console.log('Applied accessibility preset');
    },

    /**
     * ใช้ค่าที่แนะนำสำหรับ Performance
     */
    applyPerformancePreset: () => {
      themeActions.enableReducedMotion(); // ลด animation
      themeActions.disableHighContrast(); // ลด complexity
      themeActions.disableLargeText(); // ลด DOM size
      console.log('Applied performance preset');
    },

    /**
     * ใช้ค่าที่แนะนำสำหรับ Developer Mode
     */
    applyDeveloperPreset: () => {
      themeActions.useEnhancedTheme(); // ธีมที่สวยงาม
      themeActions.disableHighContrast();
      themeActions.disableReducedMotion();
      themeActions.disableLargeText();
      console.log('Applied developer preset');
    },

    /**
     * รีเซ็ตทุกอย่างเป็นค่าเริ่มต้น
     */
    applyDefaultPreset: () => {
      themeActions.reset();
      console.log('Applied default preset');
    },

    /**
     * นำ Browser Preferences มาใช้
     */
    applyBrowserPreset: () => {
      themeActions.autoConfigureFromBrowser();
      console.log('Applied browser preferences preset');
    }
  };
}