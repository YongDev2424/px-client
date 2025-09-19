/**
 * Theme Demo - ตัวอย่างการใช้งาน ThemeManager
 * 
 * ไฟล์นี้แสดงวิธีการใช้งาน ThemeManager และสามารถใช้เป็น reference
 * สำหรับการ integrate เข้ากับ UI components อื่นๆ
 */

import { ThemeManager, themeManager } from './ThemeManager';

/**
 * ตัวอย่างการใช้งาน ThemeManager
 */
export class ThemeDemo {
  private themeManager: ThemeManager;

  constructor() {
    this.themeManager = ThemeManager.getInstance();
    this.setupEventListeners();
    this.createDemoUI();
  }

  /**
   * สร้าง UI สำหรับทดสอบธีม (สำหรับ development/testing)
   */
  private createDemoUI(): void {
    // สร้าง theme control panel (ซ่อนไว้ใน development mode)
    const controlPanel = document.createElement('div');
    controlPanel.id = 'theme-control-panel';
    controlPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px;
      z-index: 9999;
      display: none;
      flex-direction: column;
      gap: 8px;
      min-width: 200px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    // Theme selector
    const themeSelector = this.createThemeSelector();
    controlPanel.appendChild(themeSelector);

    // Accessibility controls
    const accessibilityControls = this.createAccessibilityControls();
    controlPanel.appendChild(accessibilityControls);

    // Toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = '🎨';
    toggleButton.title = 'Toggle Theme Controls';
    toggleButton.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 40px;
      height: 40px;
      border: 1px solid var(--border-color);
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border-radius: 50%;
      cursor: pointer;
      z-index: 10000;
      font-size: 18px;
    `;

    toggleButton.addEventListener('click', () => {
      const isVisible = controlPanel.style.display === 'flex';
      controlPanel.style.display = isVisible ? 'none' : 'flex';
      toggleButton.style.display = isVisible ? 'block' : 'none';
    });

    // เพิ่มเข้า DOM
    document.body.appendChild(controlPanel);
    document.body.appendChild(toggleButton);

    // แสดง control panel เฉพาะใน development mode
    const isDevelopment = import.meta.env.DEV;
    if (isDevelopment) {
      // เพิ่ม keyboard shortcut สำหรับเปิด/ปิด theme controls
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'T') {
          e.preventDefault();
          toggleButton.click();
        }
      });
    }
  }

  /**
   * สร้าง theme selector
   */
  private createThemeSelector(): HTMLElement {
    const container = document.createElement('div');
    container.innerHTML = `
      <label style="color: var(--text-primary); font-size: 14px; font-weight: 500;">
        Theme:
      </label>
    `;

    const select = document.createElement('select');
    select.style.cssText = `
      width: 100%;
      padding: 8px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      color: var(--text-primary);
      margin-top: 4px;
    `;

    // เพิ่ม options
    this.themeManager.getAvailableThemes().forEach(theme => {
      const option = document.createElement('option');
      option.value = theme.name;
      option.textContent = `${theme.name} (${theme.contrastRatio}:1)`;
      select.appendChild(option);
    });

    // ตั้งค่าเริ่มต้น
    const currentTheme = this.themeManager.getCurrentTheme();
    if (currentTheme) {
      select.value = currentTheme.name;
    }

    // Event listener
    select.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      const isEnhanced = target.value === 'Enhanced Dark';
      this.themeManager.enableEnhancedTheme(isEnhanced);
    });

    container.appendChild(select);
    return container;
  }

  /**
   * สร้าง accessibility controls
   */
  private createAccessibilityControls(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border-color);
    `;

    const title = document.createElement('label');
    title.textContent = 'Accessibility:';
    title.style.cssText = `
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 500;
    `;
    container.appendChild(title);

    // High Contrast
    const highContrastCheckbox = this.createCheckbox(
      'High Contrast',
      this.themeManager.getAccessibilitySettings().highContrast,
      (checked) => this.themeManager.setHighContrast(checked)
    );
    container.appendChild(highContrastCheckbox);

    // Reduced Motion
    const reducedMotionCheckbox = this.createCheckbox(
      'Reduced Motion',
      this.themeManager.getAccessibilitySettings().reducedMotion,
      (checked) => this.themeManager.setReducedMotion(checked)
    );
    container.appendChild(reducedMotionCheckbox);

    // Large Text
    const largeTextCheckbox = this.createCheckbox(
      'Large Text',
      this.themeManager.getAccessibilitySettings().largeText,
      (checked) => this.themeManager.setLargeText(checked)
    );
    container.appendChild(largeTextCheckbox);

    return container;
  }

  /**
   * สร้าง checkbox helper
   */
  private createCheckbox(label: string, checked: boolean, onChange: (checked: boolean) => void): HTMLElement {
    const container = document.createElement('label');
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);
      font-size: 13px;
      cursor: pointer;
    `;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;
    checkbox.addEventListener('change', (e) => {
      onChange((e.target as HTMLInputElement).checked);
    });

    const labelText = document.createElement('span');
    labelText.textContent = label;

    container.appendChild(checkbox);
    container.appendChild(labelText);

    return container;
  }

  /**
   * ตั้งค่า event listeners สำหรับ theme changes
   */
  private setupEventListeners(): void {
    // ฟัง theme change events
    document.addEventListener('themeChanged', (e) => {
      console.log('Theme changed:', e.detail);
      
      // อัพเดท UI elements ที่จำเป็น
      this.updateUIForThemeChange(e.detail);
    });

    // ฟัง accessibility change events
    document.addEventListener('accessibilityChanged', (e) => {
      console.log('Accessibility settings changed:', e.detail);
      
      // อัพเดท UI elements ที่จำเป็น
      this.updateUIForAccessibilityChange(e.detail);
    });
  }

  /**
   * อัพเดท UI เมื่อธีมเปลี่ยน
   */
  private updateUIForThemeChange(detail: any): void {
    // ตัวอย่างการอัพเดท UI elements
    const canvasContainer = document.querySelector('.canvas-container');
    if (canvasContainer && detail.isEnhanced) {
      // เพิ่ม enhanced styling
      canvasContainer.classList.add('enhanced-styling');
    } else if (canvasContainer) {
      canvasContainer.classList.remove('enhanced-styling');
    }

    // อัพเดท PixiJS elements ถ้าจำเป็น
    this.updatePixiJSTheme(detail);
  }

  /**
   * อัพเดท UI เมื่อการตั้งค่า accessibility เปลี่ยน
   */
  private updateUIForAccessibilityChange(detail: any): void {
    const { settings } = detail;

    // อัพเดท CSS classes
    document.body.classList.toggle('enhanced-focus', settings.highContrast);
    document.body.classList.toggle('enhanced-touch', true); // เปิดเสมอสำหรับ mobile
    document.body.classList.toggle('keyboard-navigation', true);
    document.body.classList.toggle('colorblind-friendly', settings.highContrast);
  }

  /**
   * อัพเดท PixiJS theme (ถ้าจำเป็น)
   */
  private updatePixiJSTheme(detail: any): void {
    // ตัวอย่างการอัพเดท PixiJS elements
    // สามารถเพิ่ม logic สำหรับการเปลี่ยนสี C4 boxes, edges ฯลฯ
    
    if (detail.isEnhanced) {
      // ใช้สีจาก enhanced theme
      console.log('Applying enhanced colors to PixiJS elements');
    } else {
      // ใช้สีเดิม
      console.log('Reverting to default colors for PixiJS elements');
    }
  }

  /**
   * ทดสอบการทำงานของ ThemeManager
   */
  public runTests(): void {
    console.log('Running ThemeManager tests...');

    // ทดสอบการเปลี่ยนธีม
    console.log('Current theme:', this.themeManager.getCurrentTheme());
    
    this.themeManager.enableEnhancedTheme(true);
    console.log('Enhanced theme enabled:', this.themeManager.isEnhancedThemeEnabled());
    
    this.themeManager.enableEnhancedTheme(false);
    console.log('Enhanced theme disabled:', this.themeManager.isEnhancedThemeEnabled());

    // ทดสอบ accessibility settings
    this.themeManager.setHighContrast(true);
    this.themeManager.setReducedMotion(true);
    this.themeManager.setLargeText(true);
    
    console.log('Accessibility settings:', this.themeManager.getAccessibilitySettings());

    // รีเซ็ตกลับเป็นค่าเริ่มต้น
    this.themeManager.resetToDefault();
    console.log('Reset to default');

    // ทดสอบ browser preferences sync
    this.themeManager.syncWithBrowserPreferences();
    console.log('Synced with browser preferences');

    console.log('ThemeManager tests completed');
  }
}

/**
 * Helper functions สำหรับการใช้งานง่าย
 */

/**
 * เปิดใช้งานธีมที่ปรับปรุงแล้ว
 */
export function enableEnhancedTheme(): void {
  themeManager.enableEnhancedTheme(true);
}

/**
 * ปิดใช้งานธีมที่ปรับปรุงแล้ว (กลับไปใช้ธีมเดิม)
 */
export function disableEnhancedTheme(): void {
  themeManager.enableEnhancedTheme(false);
}

/**
 * สลับธีม
 */
export function toggleEnhancedTheme(): void {
  const isEnhanced = themeManager.isEnhancedThemeEnabled();
  themeManager.enableEnhancedTheme(!isEnhanced);
}

/**
 * รับสถานะธีมปัจจุบัน
 */
export function getCurrentThemeInfo() {
  return {
    theme: themeManager.getCurrentTheme(),
    isEnhanced: themeManager.isEnhancedThemeEnabled(),
    accessibilitySettings: themeManager.getAccessibilitySettings()
  };
}

/**
 * เริ่มต้น theme demo (สำหรับ development)
 */
export function initThemeDemo(): ThemeDemo {
  return new ThemeDemo();
}

// Export singleton instance
export { themeManager };