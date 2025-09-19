// src/stores/themeState.ts

import { createStore } from 'zustand/vanilla';

/**
 * Theme Configuration Interface
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

/**
 * Accessibility Settings Interface
 */
export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
}

/**
 * Theme State Store Interface
 */
interface ThemeStateStore {
  // State
  currentTheme: string;
  availableThemes: Map<string, ThemeConfig>;
  accessibilitySettings: AccessibilitySettings;
  
  // Actions - Theme Management
  setTheme: (themeName: string) => void;
  enableEnhancedTheme: (enabled?: boolean) => void;
  getCurrentTheme: () => ThemeConfig | undefined;
  getAvailableThemes: () => ThemeConfig[];
  isEnhancedThemeEnabled: () => boolean;
  resetToDefault: () => void;
  
  // Actions - Accessibility
  setHighContrast: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setLargeText: (enabled: boolean) => void;
  getAccessibilitySettings: () => AccessibilitySettings;
  
  // Actions - Browser Integration
  syncWithBrowserPreferences: () => void;
  
  // Internal Actions
  clearAllThemeClasses: () => void;
  setupAccessibilityListeners: () => void;
  dispatchThemeChangeEvent: (theme: ThemeConfig) => void;
  dispatchAccessibilityChangeEvent: () => void;
}

/**
 * Constants
 */
const DEFAULT_THEME = 'default';
const ENHANCED_THEME = 'enhanced';

/**
 * ธีมที่รองรับ
 */
const createThemes = (): Map<string, ThemeConfig> => new Map([
  [DEFAULT_THEME, {
    name: 'Default Dark',
    className: '',
    description: 'ธีมมาตรฐานที่มีอยู่เดิม - WCAG AA compliant',
    contrastRatio: 4.5,
    accessibilityCompliant: true
  }],
  [ENHANCED_THEME, {
    name: 'Enhanced Dark',
    className: 'enhanced-theme',
    description: 'ธีมที่ปรับปรุงแล้ว - WCAG AAA compliant พร้อม GitHub-inspired design',
    contrastRatio: 7.1,
    accessibilityCompliant: true
  }]
]);

/**
 * Helper functions สำหรับจัดการ DOM
 */
function applyThemeToDOM(theme: ThemeConfig): void {
  // ลบ CSS class ของธีมเก่าทั้งหมด
  const themes = createThemes();
  themes.forEach(t => {
    if (t.className) {
      document.body.classList.remove(t.className);
    }
  });

  // เพิ่ม CSS class ของธีมใหม่ (ถ้ามี)
  if (theme.className) {
    document.body.classList.add(theme.className);
  }
}

function applyAccessibilityToDOM(settings: AccessibilitySettings): void {
  // High Contrast
  if (settings.highContrast) {
    document.body.classList.add('high-contrast');
  } else {
    document.body.classList.remove('high-contrast');
  }

  // Reduced Motion
  if (settings.reducedMotion) {
    document.body.classList.add('reduced-motion');
  } else {
    document.body.classList.remove('reduced-motion');
  }

  // Large Text
  if (settings.largeText) {
    document.body.classList.add('large-text');
  } else {
    document.body.classList.remove('large-text');
  }
}

/**
 * Load state from localStorage
 */
const loadStateFromStorage = () => {
  try {
    const saved = localStorage.getItem('theme-preferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        currentTheme: parsed.currentTheme || DEFAULT_THEME,
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
  return {
    currentTheme: DEFAULT_THEME,
    accessibilitySettings: {
      highContrast: false,
      reducedMotion: false,
      largeText: false
    }
  };
};

/**
 * Save state to localStorage
 */
const saveStateToStorage = (currentTheme: string, accessibilitySettings: AccessibilitySettings) => {
  try {
    localStorage.setItem('theme-preferences', JSON.stringify({
      currentTheme,
      accessibilitySettings
    }));
  } catch (error) {
    console.warn('Failed to save theme preferences:', error);
  }
};

/**
 * Zustand store สำหรับจัดการ Theme และ Accessibility
 */
export const useThemeState = createStore<ThemeStateStore>((set, get) => {
  const initialState = loadStateFromStorage();
  
  const storeObject = {
      // Initial State
      currentTheme: initialState.currentTheme,
      availableThemes: createThemes(),
      accessibilitySettings: initialState.accessibilitySettings,

      // === Theme Management ===
      setTheme: (themeName: string) => {
        const { availableThemes, dispatchThemeChangeEvent } = get();
        const theme = availableThemes.get(themeName);
        
        if (!theme) {
          console.warn(`Theme "${themeName}" not found. Using default theme.`);
          return;
        }

        // อัพเดท state
        set({ currentTheme: themeName });

        // บันทึกใน localStorage
        const { accessibilitySettings } = get();
        saveStateToStorage(themeName, accessibilitySettings);

        // อัพเดท DOM
        applyThemeToDOM(theme);

        // ส่ง event เพื่อแจ้งการเปลี่ยนธีม
        dispatchThemeChangeEvent(theme);

        console.log(`Theme changed to: ${theme.name} (${theme.description})`);
      },

      enableEnhancedTheme: (enabled: boolean = true) => {
        const { setTheme } = get();
        const targetTheme = enabled ? ENHANCED_THEME : DEFAULT_THEME;
        setTheme(targetTheme);
      },

      getCurrentTheme: () => {
        const { currentTheme, availableThemes } = get();
        return availableThemes.get(currentTheme);
      },

      getAvailableThemes: () => {
        const { availableThemes } = get();
        return Array.from(availableThemes.values());
      },

      isEnhancedThemeEnabled: () => {
        const { currentTheme } = get();
        return currentTheme === ENHANCED_THEME;
      },

      resetToDefault: () => {
        const { setTheme, setHighContrast, setReducedMotion, setLargeText } = get();
        setTheme(DEFAULT_THEME);
        setHighContrast(false);
        setReducedMotion(false);
        setLargeText(false);
      },

      // === Accessibility Management ===
      setHighContrast: (enabled: boolean) => {
        set((state) => ({
          accessibilitySettings: {
            ...state.accessibilitySettings,
            highContrast: enabled
          }
        }));

        const { accessibilitySettings, dispatchAccessibilityChangeEvent, currentTheme } = get();
        saveStateToStorage(currentTheme, accessibilitySettings);
        applyAccessibilityToDOM(accessibilitySettings);
        dispatchAccessibilityChangeEvent();
      },

      setReducedMotion: (enabled: boolean) => {
        set((state) => ({
          accessibilitySettings: {
            ...state.accessibilitySettings,
            reducedMotion: enabled
          }
        }));

        const { accessibilitySettings, dispatchAccessibilityChangeEvent, currentTheme } = get();
        saveStateToStorage(currentTheme, accessibilitySettings);
        applyAccessibilityToDOM(accessibilitySettings);
        dispatchAccessibilityChangeEvent();
      },

      setLargeText: (enabled: boolean) => {
        set((state) => ({
          accessibilitySettings: {
            ...state.accessibilitySettings,
            largeText: enabled
          }
        }));

        const { accessibilitySettings, dispatchAccessibilityChangeEvent, currentTheme } = get();
        saveStateToStorage(currentTheme, accessibilitySettings);
        applyAccessibilityToDOM(accessibilitySettings);
        dispatchAccessibilityChangeEvent();
      },

      getAccessibilitySettings: () => {
        const { accessibilitySettings } = get();
        return { ...accessibilitySettings };
      },

      // === Browser Integration ===
      syncWithBrowserPreferences: () => {
        const { setReducedMotion, setHighContrast, currentTheme } = get();

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
        if (prefersDark && currentTheme === DEFAULT_THEME) {
          console.log('User prefers dark mode. Enhanced theme is available for better experience.');
        }
      },

      // === Internal Methods ===
      clearAllThemeClasses: () => {
        const { availableThemes } = get();
        availableThemes.forEach(theme => {
          if (theme.className) {
            document.body.classList.remove(theme.className);
          }
        });
      },

      setupAccessibilityListeners: () => {
        const { setReducedMotion, setHighContrast } = get();

        // ฟัง prefers-reduced-motion changes
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        reducedMotionQuery.addEventListener('change', (e) => {
          if (e.matches) {
            setReducedMotion(true);
          }
        });

        // ฟัง prefers-contrast changes  
        const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
        highContrastQuery.addEventListener('change', (e) => {
          if (e.matches) {
            setHighContrast(true);
          }
        });
      },

      dispatchThemeChangeEvent: (theme: ThemeConfig) => {
        const { isEnhancedThemeEnabled } = get();
        const event = new CustomEvent('themeChanged', {
          detail: {
            theme,
            isEnhanced: isEnhancedThemeEnabled(),
            contrastRatio: theme.contrastRatio
          }
        });
        document.dispatchEvent(event);
      },

      dispatchAccessibilityChangeEvent: () => {
        const { getAccessibilitySettings } = get();
        const event = new CustomEvent('accessibilityChanged', {
          detail: {
            settings: getAccessibilitySettings()
          }
        });
        document.dispatchEvent(event);
      }
    };
  
  return storeObject;
});

/**
 * Initialization function - เรียกเมื่อแอพเริ่มทำงาน
 */
export function initializeTheme(): void {
  const store = useThemeState.getState();
  
  // นำ theme และ accessibility settings มาใช้
  const currentTheme = store.getCurrentTheme();
  if (currentTheme) {
    applyThemeToDOM(currentTheme);
  }
  
  applyAccessibilityToDOM(store.accessibilitySettings);
  
  // ตั้งค่า event listeners
  store.setupAccessibilityListeners();
  
  // Sync กับ browser preferences
  store.syncWithBrowserPreferences();
  
  console.log('🎨 Theme system initialized');
}

/**
 * Cleanup function
 */
export function destroyTheme(): void {
  const store = useThemeState.getState();
  
  store.clearAllThemeClasses();
  document.body.classList.remove('high-contrast', 'reduced-motion', 'large-text');
  
  console.log('🗑️ Theme system destroyed');
}

/**
 * Compatibility wrapper object สำหรับใช้แทน ThemeManager class
 * ช่วยให้โค้ดเดิมที่ใช้ ThemeManager.getInstance() ยังทำงานได้
 */
export const themeManager = {
  getInstance: () => themeManager, // Return self for singleton pattern compatibility

  enableEnhancedTheme: (enabled: boolean = true) => {
    useThemeState.getState().enableEnhancedTheme(enabled);
  },

  setTheme: (themeName: string) => {
    useThemeState.getState().setTheme(themeName);
  },

  getCurrentTheme: () => {
    return useThemeState.getState().getCurrentTheme();
  },

  getAvailableThemes: () => {
    return useThemeState.getState().getAvailableThemes();
  },

  isEnhancedThemeEnabled: () => {
    return useThemeState.getState().isEnhancedThemeEnabled();
  },

  setHighContrast: (enabled: boolean) => {
    useThemeState.getState().setHighContrast(enabled);
  },

  setReducedMotion: (enabled: boolean) => {
    useThemeState.getState().setReducedMotion(enabled);
  },

  setLargeText: (enabled: boolean) => {
    useThemeState.getState().setLargeText(enabled);
  },

  getAccessibilitySettings: () => {
    return useThemeState.getState().getAccessibilitySettings();
  },

  resetToDefault: () => {
    useThemeState.getState().resetToDefault();
  },

  syncWithBrowserPreferences: () => {
    useThemeState.getState().syncWithBrowserPreferences();
  },

  destroy: () => {
    destroyTheme();
  }
};

/**
 * Type definitions สำหรับ custom events (รักษา compatibility กับโค้ดเดิม)
 */
declare global {
  interface DocumentEventMap {
    'themeChanged': CustomEvent<{
      theme: ThemeConfig;
      isEnhanced: boolean;
      contrastRatio: number;
    }>;
    'accessibilityChanged': CustomEvent<{
      settings: AccessibilitySettings;
    }>;
  }
}