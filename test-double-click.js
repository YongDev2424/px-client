// test-double-click.js
// Simple test script for double-click integration

console.log('🧪 Starting Double-Click Integration Test...');

// Wait for page to load
window.addEventListener('load', () => {
  setTimeout(() => {
    console.log('🎯 Testing Double-Click Integration...');
    
    // Test 1: Check if createC4Box is available
    if (typeof window.createC4Box !== 'undefined') {
      console.log('✅ createC4Box function available');
    } else {
      console.log('❌ createC4Box function not available');
    }
    
    // Test 2: Check if double-click detector is available
    if (typeof window.createDoubleClickDetector !== 'undefined') {
      console.log('✅ createDoubleClickDetector function available');
    } else {
      console.log('❌ createDoubleClickDetector function not available');
    }
    
    // Test 3: Check if property drawer manager is available
    if (typeof window.getGlobalPropertyDrawerManager !== 'undefined') {
      console.log('✅ getGlobalPropertyDrawerManager function available');
    } else {
      console.log('❌ getGlobalPropertyDrawerManager function not available');
    }
    
    // Test 4: Try to create a test node
    try {
      const addPersonBtn = document.getElementById('add-person-btn');
      if (addPersonBtn) {
        console.log('✅ Add Person button found');
        addPersonBtn.click();
        console.log('✅ Add Person button clicked - check for new node');
      } else {
        console.log('❌ Add Person button not found');
      }
    } catch (error) {
      console.error('❌ Error creating test node:', error);
    }
    
    // Test 5: Check for any console errors
    const originalError = console.error;
    let errorCount = 0;
    console.error = (...args) => {
      errorCount++;
      originalError.apply(console, args);
    };
    
    setTimeout(() => {
      if (errorCount === 0) {
        console.log('✅ No console errors detected');
      } else {
        console.log(`⚠️ ${errorCount} console errors detected`);
      }
    }, 2000);
    
  }, 1000);
});