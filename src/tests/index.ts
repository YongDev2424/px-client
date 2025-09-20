// src/tests/index.ts

/**
 * Test entry point สำหรับ Deletion System
 * สำหรับเรียกใช้งานการทดสอบจาก browser console หรือ main application
 */

export { runDeletionSystemTests, deletionTestHelpers } from './deletionSystem.test';

/**
 * สำหรับเรียกใช้ในการพัฒนา
 * เปิด browser console แล้วรัน:
 * 
 * import { runDeletionSystemTests } from './tests';
 * runDeletionSystemTests();
 */

// Auto-export เพื่อให้เข้าถึงได้ง่ายจาก window global
if (typeof window !== 'undefined') {
  (window as any).deletionSystemTests = {
    run: async () => {
      const { runDeletionSystemTests } = await import('./deletionSystem.test');
      return runDeletionSystemTests();
    },
    helpers: async () => {
      const { deletionTestHelpers } = await import('./deletionSystem.test');
      return deletionTestHelpers;
    }
  };
  
  console.log('🧪 Deletion System Tests available at window.deletionSystemTests');
  console.log('   Usage: window.deletionSystemTests.run()');
  console.log('   Helpers: window.deletionSystemTests.helpers()');
}