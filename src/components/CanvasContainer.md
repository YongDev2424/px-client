# CanvasContainer Documentation

## Overview

CanvasContainer เป็น enhancement wrapper สำหรับ PixiJS Application ที่เพิ่มฟีเจอร์ grid overlay และ snap-to-grid functionality โดยไม่ทำลาย existing functionality

## 🛡️ Additive Development Strategy

CanvasContainer ถูกออกแบบตาม **additive approach** เพื่อ:
- ไม่แก้ไข existing PixiJS setup ใน main.ts
- เพิ่มฟีเจอร์ใหม่เป็น optional enhancements
- รักษา backward compatibility กับ existing code
- สามารถเปิด/ปิดฟีเจอร์ได้อิสระ

## Installation & Usage

### Basic Setup (Optional Enhancement)

```typescript
import { CanvasContainer } from './components/CanvasContainer';

// ใช้กับ existing PixiJS app
const canvasContainer = new CanvasContainer(existingPixiApp, canvasElement);

// ฟีเจอร์ทั้งหมดปิดอยู่โดยค่าเริ่มต้น (preserve existing behavior)
```

### Enable Grid Overlay

```typescript
// เปิดใช้งาน grid overlay
canvasContainer.enableGrid(true);

// ปิดใช้งาน grid overlay
canvasContainer.enableGrid(false);

// ตั้งค่า grid
canvasContainer.setGridSize(25); // 25px grid
canvasContainer.setGridColor('rgba(255, 255, 255, 0.2)');
```

### Enable Snap-to-Grid

```typescript
// เปิดใช้งาน snap-to-grid
canvasContainer.enableSnapToGrid(true);

// ปิดใช้งาน snap-to-grid
canvasContainer.enableSnapToGrid(false);

// ตั้งค่า snap grid size
canvasContainer.setGridSize(20); // snap ทุก 20px
```

### Check Status

```typescript
// ตรวจสอบสถานะ
const isGridVisible = canvasContainer.isGridVisible();
const isSnapEnabled = canvasContainer.isSnapToGridEnabled();

// รีเซ็ตกลับเป็นค่าเริ่มต้น
canvasContainer.resetEnhancements();
```

## API Reference

### Constructor

```typescript
constructor(existingApp: Application, canvasElement: HTMLElement)
```

- `existingApp`: PixiJS Application ที่มีอยู่แล้ว
- `canvasElement`: HTML element ที่ใช้เป็น container

### Methods

#### Grid Control
- `enableGrid(enabled: boolean)` - เปิด/ปิด grid overlay
- `setGridSize(size: number)` - ตั้งค่าขนาด grid (pixels)
- `setGridColor(color: string)` - ตั้งค่าสี grid (CSS color)
- `isGridVisible(): boolean` - ตรวจสอบสถานะ grid

#### Snap-to-Grid Control
- `enableSnapToGrid(enabled: boolean)` - เปิด/ปิด snap functionality
- `isSnapToGridEnabled(): boolean` - ตรวจสอบสถานะ snap

#### Utility Methods
- `getPixiApp(): Application` - ได้รับ reference ไปยัง PixiJS app
- `resetEnhancements()` - รีเซ็ตฟีเจอร์ทั้งหมดกลับเป็นค่าเริ่มต้น
- `destroy()` - ทำลาย CanvasContainer และ cleanup resources

## Integration Example

### In main.ts (Current Implementation)

```typescript
// Existing PixiJS setup (unchanged)
const app = new Application();
await app.init({
  width,
  height,
  backgroundColor: 0x1e1e1e,
  antialias: true,
});
canvasContainer.appendChild(app.canvas);

// Optional CanvasContainer enhancement
let canvasContainerEnhancement: CanvasContainer | null = null;

async function initializeCanvasEnhancement() {
  try {
    if (!canvasContainer) return;
    
    const { CanvasContainer } = await import('./components/CanvasContainer');
    canvasContainerEnhancement = new CanvasContainer(app, canvasContainer);
    
    // Features disabled by default - enable as needed
    // canvasContainerEnhancement.enableGrid(true);
    // canvasContainerEnhancement.enableSnapToGrid(true);
    
  } catch (error) {
    console.error('Failed to initialize CanvasContainer:', error);
  }
}

initializeCanvasEnhancement();
```

### Custom Usage Example

```typescript
// สร้าง CanvasContainer พร้อมกับ custom settings
const canvasContainer = new CanvasContainer(pixiApp, canvasElement);

// เปิดใช้งาน grid พร้อมกับ custom settings
canvasContainer.enableGrid(true);
canvasContainer.setGridSize(30);
canvasContainer.setGridColor('rgba(79, 195, 247, 0.15)');

// เปิดใช้งาน snap-to-grid
canvasContainer.enableSnapToGrid(true);

// ตัวอย่างการใช้งานใน UI
document.getElementById('toggle-grid')?.addEventListener('click', () => {
  const isVisible = canvasContainer.isGridVisible();
  canvasContainer.enableGrid(!isVisible);
});

document.getElementById('toggle-snap')?.addEventListener('click', () => {
  const isEnabled = canvasContainer.isSnapToGridEnabled();
  canvasContainer.enableSnapToGrid(!isEnabled);
});
```

## Safety Features

### 🚨 Safety Checklist

- ✅ Existing PixiJS app continues to work without CanvasContainer
- ✅ All current canvas interactions remain unchanged
- ✅ Grid overlay can be toggled on/off
- ✅ No modifications to existing main.ts PixiJS initialization
- ✅ All enhancements are opt-in, not default behavior
- ✅ Backward compatibility maintained

### Error Handling

```typescript
try {
  const canvasContainer = new CanvasContainer(app, element);
  canvasContainer.enableGrid(true);
} catch (error) {
  console.error('CanvasContainer initialization failed:', error);
  // App continues to work without enhancements
}
```

## Performance Considerations

### Memory Management
- CanvasContainer ใช้ ResizeObserver สำหรับ efficient resize handling
- Grid overlay ใช้ CSS background-image (hardware accelerated)
- Snap-to-grid ใช้ mathematical calculations (no DOM manipulation)

### Optimization Tips
```typescript
// ปิดฟีเจอร์ที่ไม่ใช้เพื่อประหยัด resources
canvasContainer.enableGrid(false);
canvasContainer.enableSnapToGrid(false);

// ใช้ larger grid size สำหรับ better performance
canvasContainer.setGridSize(40); // แทน 10px
```

## Troubleshooting

### Common Issues

1. **Grid ไม่แสดง**
   ```typescript
   // ตรวจสอบว่า grid เปิดใช้งานแล้ว
   console.log(canvasContainer.isGridVisible()); // should be true
   
   // ตรวจสอบ grid color contrast
   canvasContainer.setGridColor('rgba(255, 255, 255, 0.5)');
   ```

2. **Snap-to-grid ไม่ทำงาน**
   ```typescript
   // ตรวจสอบว่า snap เปิดใช้งานแล้ว
   console.log(canvasContainer.isSnapToGridEnabled()); // should be true
   
   // ตรวจสอบว่า objects มี drag behavior
   // (SnapToGrid ทำงานกับ existing draggable objects เท่านั้น)
   ```

3. **Performance Issues**
   ```typescript
   // ใช้ larger grid size
   canvasContainer.setGridSize(25);
   
   // ปิดฟีเจอร์ที่ไม่จำเป็น
   canvasContainer.resetEnhancements();
   ```

## Dependencies

- **PixiJS v8**: ใช้ existing Application instance
- **GridOverlay**: CSS-based grid system
- **SnapToGrid**: Mathematical grid snapping
- **ResizeObserver**: Browser API สำหรับ resize detection

## Browser Compatibility

- Modern browsers ที่รองรับ ResizeObserver
- Fallback gracefully หาก ResizeObserver ไม่รองรับ
- CSS Grid และ background-image support required

## Future Enhancements

- [ ] Configurable grid patterns (dots, lines, crosses)
- [ ] Multiple grid layers
- [ ] Grid alignment guides
- [ ] Snap to objects (not just grid)
- [ ] Grid ruler/measurements