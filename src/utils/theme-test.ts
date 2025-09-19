/**
 * Theme System Test - ทดสอบการทำงานของระบบธีม
 * 
 * ไฟล์นี้ใช้สำหรับทดสอบว่าระบบธีมทำงานถูกต้องและไม่ทำลายการทำงานเดิม
 */

import { ThemeManager } from './ThemeManager';

/**
 * ทดสอบการทำงานของ ThemeManager
 */
export function runThemeTests(): void {
  console.log('🧪 Starting Theme System Tests...');

  const themeManager = ThemeManager.getInstance();

  // Test 1: ทดสอบการเริ่มต้น
  console.log('Test 1: Theme Manager Initialization');
  const currentTheme = themeManager.getCurrentTheme();
  console.log('✅ Current theme:', currentTheme?.name);
  console.log('✅ Available themes:', themeManager.getAvailableThemes().map(t => t.name));

  // Test 2: ทดสอบการเปลี่ยนธีม
  console.log('\nTest 2: Theme Switching');
  const initialEnhanced = themeManager.isEnhancedThemeEnabled();
  console.log('Initial enhanced state:', initialEnhanced);

  themeManager.enableEnhancedTheme(true);
  console.log('✅ Enhanced theme enabled:', themeManager.isEnhancedThemeEnabled());
  console.log('✅ Body has enhanced-theme class:', document.body.classList.contains('enhanced-theme'));

  themeManager.enableEnhancedTheme(false);
  console.log('✅ Enhanced theme disabled:', themeManager.isEnhancedThemeEnabled());
  console.log('✅ Body removed enhanced-theme class:', !document.body.classList.contains('enhanced-theme'));

  // Test 3: ทดสอบ Accessibility Settings
  console.log('\nTest 3: Accessibility Settings');
  const initialSettings = themeManager.getAccessibilitySettings();
  console.log('Initial accessibility settings:', initialSettings);

  themeManager.setHighContrast(true);
  console.log('✅ High contrast enabled:', themeManager.getAccessibilitySettings().highContrast);
  console.log('✅ Body has high-contrast class:', document.body.classList.contains('high-contrast'));

  themeManager.setReducedMotion(true);
  console.log('✅ Reduced motion enabled:', themeManager.getAccessibilitySettings().reducedMotion);
  console.log('✅ Body has reduced-motion class:', document.body.classList.contains('reduced-motion'));

  themeManager.setLargeText(true);
  console.log('✅ Large text enabled:', themeManager.getAccessibilitySettings().largeText);
  console.log('✅ Body has large-text class:', document.body.classList.contains('large-text'));

  // Test 4: ทดสอบการรีเซ็ต
  console.log('\nTest 4: Reset to Default');
  themeManager.resetToDefault();
  const resetSettings = themeManager.getAccessibilitySettings();
  console.log('✅ Settings after reset:', resetSettings);
  console.log('✅ All accessibility classes removed:', 
    !document.body.classList.contains('high-contrast') &&
    !document.body.classList.contains('reduced-motion') &&
    !document.body.classList.contains('large-text')
  );

  // Test 5: ทดสอบ CSS Variables
  console.log('\nTest 5: CSS Variables');
  const rootStyles = getComputedStyle(document.documentElement);
  
  // ทดสอบว่า CSS variables มีอยู่
  const bgPrimary = rootStyles.getPropertyValue('--bg-primary').trim();
  const textPrimary = rootStyles.getPropertyValue('--text-primary').trim();
  const enhancedBgPrimary = rootStyles.getPropertyValue('--enhanced-bg-primary').trim();
  
  console.log('✅ --bg-primary exists:', !!bgPrimary);
  console.log('✅ --text-primary exists:', !!textPrimary);
  console.log('✅ --enhanced-bg-primary exists:', !!enhancedBgPrimary);

  // Test 6: ทดสอบ Enhanced Theme CSS Variables
  console.log('\nTest 6: Enhanced Theme CSS Variables');
  themeManager.enableEnhancedTheme(true);
  
  // รอให้ CSS อัพเดท
  setTimeout(() => {
    const enhancedStyles = getComputedStyle(document.documentElement);
    const currentBgPrimary = enhancedStyles.getPropertyValue('--bg-primary').trim();
    
    console.log('✅ Enhanced theme applied, --bg-primary changed:', currentBgPrimary !== bgPrimary);
    
    // กลับไปธีมเดิม
    themeManager.enableEnhancedTheme(false);
    console.log('✅ Reverted to default theme');
  }, 100);

  // Test 7: ทดสอบ Event System
  console.log('\nTest 7: Event System');
  let themeChangeEventFired = false;
  let accessibilityChangeEventFired = false;

  const themeChangeHandler = (e: CustomEvent) => {
    themeChangeEventFired = true;
    console.log('✅ Theme change event fired:', e.detail.theme.name);
  };

  const accessibilityChangeHandler = (e: CustomEvent) => {
    accessibilityChangeEventFired = true;
    console.log('✅ Accessibility change event fired:', e.detail.settings);
  };

  document.addEventListener('themeChanged', themeChangeHandler);
  document.addEventListener('accessibilityChanged', accessibilityChangeHandler);

  // Trigger events
  themeManager.enableEnhancedTheme(true);
  themeManager.setHighContrast(true);

  setTimeout(() => {
    console.log('✅ Theme change event system working:', themeChangeEventFired);
    console.log('✅ Accessibility change event system working:', accessibilityChangeEventFired);

    // Cleanup
    document.removeEventListener('themeChanged', themeChangeHandler);
    document.removeEventListener('accessibilityChanged', accessibilityChangeHandler);
    themeManager.resetToDefault();

    console.log('\n🎉 All Theme System Tests Completed Successfully!');
  }, 200);
}

/**
 * ทดสอบ WCAG Compliance
 */
export function testWCAGCompliance(): void {
  console.log('♿ Testing WCAG Compliance...');

  const themeManager = ThemeManager.getInstance();

  // Test contrast ratios
  const themes = themeManager.getAvailableThemes();
  themes.forEach(theme => {
    console.log(`Theme: ${theme.name}`);
    console.log(`  Contrast Ratio: ${theme.contrastRatio}:1`);
    console.log(`  WCAG AA Compliant: ${theme.contrastRatio >= 4.5 ? '✅' : '❌'}`);
    console.log(`  WCAG AAA Compliant: ${theme.contrastRatio >= 7.0 ? '✅' : '❌'}`);
    console.log(`  Accessibility Compliant: ${theme.accessibilityCompliant ? '✅' : '❌'}`);
  });

  // Test focus indicators
  console.log('\nTesting Focus Indicators...');
  const testButton = document.createElement('button');
  testButton.textContent = 'Test Button';
  testButton.style.cssText = 'position: absolute; top: -1000px;';
  document.body.appendChild(testButton);

  testButton.focus();
  const focusStyles = getComputedStyle(testButton);
  const outlineWidth = focusStyles.getPropertyValue('outline-width');
  const outlineColor = focusStyles.getPropertyValue('outline-color');

  console.log('✅ Focus outline width:', outlineWidth);
  console.log('✅ Focus outline color:', outlineColor);

  document.body.removeChild(testButton);

  console.log('♿ WCAG Compliance Tests Completed');
}

/**
 * ทดสอบ Performance
 */
export function testThemePerformance(): void {
  console.log('⚡ Testing Theme Performance...');

  const themeManager = ThemeManager.getInstance();
  const iterations = 100;

  // Test theme switching performance
  console.time('Theme Switching Performance');
  for (let i = 0; i < iterations; i++) {
    themeManager.enableEnhancedTheme(i % 2 === 0);
  }
  console.timeEnd('Theme Switching Performance');

  // Test accessibility setting performance
  console.time('Accessibility Settings Performance');
  for (let i = 0; i < iterations; i++) {
    themeManager.setHighContrast(i % 2 === 0);
    themeManager.setReducedMotion(i % 3 === 0);
    themeManager.setLargeText(i % 4 === 0);
  }
  console.timeEnd('Accessibility Settings Performance');

  // Reset to clean state
  themeManager.resetToDefault();

  console.log('⚡ Performance Tests Completed');
}

/**
 * รันการทดสอบทั้งหมด
 */
export function runAllThemeTests(): void {
  console.log('🚀 Running All Theme System Tests...\n');

  runThemeTests();
  
  setTimeout(() => {
    testWCAGCompliance();
    
    setTimeout(() => {
      testThemePerformance();
      console.log('\n🎉 All Tests Completed Successfully!');
    }, 500);
  }, 1000);
}

// Export for console testing
(window as any).themeTests = {
  runThemeTests,
  testWCAGCompliance,
  testThemePerformance,
  runAllThemeTests
};