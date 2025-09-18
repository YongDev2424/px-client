# PixiJS v8 API Patterns Reference

> **CRITICAL**: ความรู้เดิมของ Claude คือ PixiJS v7 ซึ่งมี syntax ที่แตกต่าง  
> ไฟล์นี้รวบรวม patterns จากโค้ดจริงในโปรเจค pixi-c4-editor ที่ใช้ PixiJS v8

## ⚠️ Memory Constraint
**ก่อนเขียนโค้ด PixiJS ใดๆ ให้อ่านไฟล์นี้เสมอ**
- หากไม่พบ class ที่ต้องการ → อ่าน https://pixijs.download/release/docs/index.html
- ใช้โค้ดในโปรเจคเป็นต้นแบบ syntax เสมอ

---

## Application Class

### การสร้าง Application (v8 Pattern)
```typescript
// จาก src/main.ts - การสร้าง Application แบบ v8
const app = new Application();
await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1099bb,
    antialias: true,
});
document.body.appendChild(app.canvas);
```

### คุณสมบัติสำคัญ
- ใช้ `await app.init()` แทน constructor options (v8 เปลี่ยนแปลง)
- `app.canvas` สำหรับ DOM element
- `app.screen` สำหรับ hitArea
- `app.stage` สำหรับ root container

---

## Container Class

### การสร้างและจัดการ Container
```typescript
// จาก src/components/C4Box.ts - การสร้าง Container
const boxContainer = new Container();

// การเพิ่ม children
boxContainer.addChild(boxGraphics);
boxContainer.addChild(boxLabel);
boxContainer.addChild(connectionPoints.top);

// การตั้งค่าตำแหน่ง
boxContainer.x = (app.screen.width / 2) + offsetX;
boxContainer.y = (app.screen.height / 2) + offsetY;

// การตั้งค่า interaction
boxContainer.eventMode = 'static';
boxContainer.cursor = 'pointer';
```

### Event Handling Pattern
```typescript
// จาก src/components/C4Box.ts - Event handling
boxContainer.on('pointerover', (event: FederatedPointerEvent) => {
    event.stopPropagation();
    // การจัดการ hover
});

boxContainer.on('pointerdown', (event: FederatedPointerEvent) => {
    event.stopPropagation();
    // การจัดการ click
});
```

### Stage Setup Pattern
```typescript
// จาก src/utils/draggable.ts - Stage configuration
app.stage.eventMode = 'static';
app.stage.hitArea = app.screen;

// Global event handling
app.stage.on('globalpointermove', (event: FederatedPointerEvent) => {
    // การจัดการ global mouse move
});
```

---

## Graphics Class

### การสร้าง Graphics และการวาด (v8 Method Chaining)
```typescript
// จาก src/components/C4Box.ts - การสร้าง Rectangle
const boxGraphics = new Graphics()
    .fill(boxColor)           // ตั้งค่าสี fill ก่อน
    .rect(0, 0, 200, 100)     // วาด rectangle
    .fill();                  // เรียก fill() เพื่อ apply สี
```

### การสร้าง Circle
```typescript
// จาก src/components/C4Box.ts - การสร้าง Circle
const point = new Graphics();
point.circle(0, 0, 5);        // วาด circle ก่อน
point.fill(0x000000);         // เรียก fill() หลังวาด (v8 pattern)
```

### การวาดเส้น (Stroke Pattern)
```typescript
// จาก src/components/Edge.ts - การวาดเส้น
const lineGraphics = new Graphics();
lineGraphics
    .moveTo(startPoint.x, startPoint.y)
    .lineTo(endPoint.x, endPoint.y)
    .stroke({ width: lineWidth, color: lineColor });
```

### การวาด Complex Shapes
```typescript
// จาก src/components/Edge.ts - การวาดลูกศร
const arrow = new Graphics();
arrow
    .moveTo(tip.x, tip.y)
    .lineTo(baseLeft.x, baseLeft.y)
    .lineTo(baseRight.x, baseRight.y)
    .lineTo(tip.x, tip.y)
    .fill({ color });         // ใช้ object parameter ใน v8
```

### Graphics Properties
```typescript
// การตั้งค่า interaction
graphics.eventMode = 'static';
graphics.cursor = 'crosshair';

// การตั้งค่า visibility
graphics.visible = false;
graphics.alpha = 0;

// การตั้งค่า hit area
graphics.hitArea = new Circle(0, 0, radius);
```

---

## Point Class

### การสร้างและใช้งาน Point
```typescript
// จาก src/components/Edge.ts - การสร้าง Point
const point = new Point(x, y);
const midPoint = new Point(
    (point1.x + point2.x) / 2,
    (point1.y + point2.y) / 2
);

// การ clone และ copy
const clonedPoint = point.clone();
point.copyFrom(otherPoint);
point.set(x, y);
```

---

## Circle Class (Hit Area)

### การใช้ Circle สำหรับ Hit Area
```typescript
// จาก src/components/C4Box.ts - การตั้งค่า hit area
point.hitArea = new Circle(0, 0, 5);

// การเปลี่ยน hit area แบบ dynamic
(point as any).setHitAreaRadius = function(radius: number) {
    this.hitArea = new Circle(0, 0, radius);
};
```

---

## FederatedPointerEvent

### Event Properties และ Methods
```typescript
// จาก src/utils/draggable.ts และ src/components/C4Box.ts
target.on('pointerdown', (event: FederatedPointerEvent) => {
    // การได้ตำแหน่ง global
    const globalPosition = event.global.clone();
    
    // การหยุด event propagation
    event.stopPropagation();
    
    // การคำนวณ offset
    dragOffset.x = target.x - event.global.x;
    dragOffset.y = target.y - event.global.y;
});
```

### Event Types ที่ใช้
- `pointerdown` - การกดเมาส์/touch
- `pointerup` - การปล่อยเมาส์/touch  
- `pointermove` - การเคลื่อนไหวของ pointer
- `globalpointermove` - การเคลื่อนไหว global (ไม่ถูกบัง)
- `pointerover` - การ hover เข้า
- `pointerout` - การ hover ออก

---

## Position และ Transform Methods

### Global Position Calculation (v8 API)
```typescript
// จาก src/components/Edge.ts - การคำนวณตำแหน่ง global
const globalPos = connectionPoint.getGlobalPosition();

// การใช้ toGlobal (legacy, ยังใช้ได้)
const globalPos = node.toGlobal(new Point(x, y));
```

### Local Position Methods
```typescript
// การแปลงจาก global เป็น local
const localPos = container.toLocal(globalPoint);
```

---

## Common Patterns

### Container Creation Pattern
```typescript
// Pattern สำหรับสร้าง component ใหม่
export function createNewComponent(): Container {
    const container = new Container();
    const graphics = new Graphics()
        .fill(color)
        .rect(x, y, width, height)
        .fill();
    
    container.addChild(graphics);
    container.eventMode = 'static';
    
    return container;
}
```

### Event Cleanup Pattern
```typescript
// จาก src/utils/stageManager.ts - การลบ event listeners
container.off('pointerdown', handler);
document.removeEventListener('keydown', handler);
```

### Metadata Storage Pattern
```typescript
// การเก็บข้อมูลใน Container
(container as any).nodeData = {
    labelText: text,
    nodeType: 'c4box'
};

(container as any).edgeData = {
    sourceNode,
    targetNode,
    startPoint: startPoint.clone(),
    endPoint: endPoint.clone()
};
```

---

## สิ่งที่เปลี่ยนจาก v7 เป็น v8

### Application Initialization
```typescript
// v7 (เก่า - ห้ามใช้)
const app = new Application({ width: 800, height: 600 });

// v8 (ใหม่ - ใช้แบบนี้)
const app = new Application();
await app.init({ width: 800, height: 600 });
```

### Graphics Fill Method
```typescript
// v7 (เก่า - ห้ามใช้)  
graphics.beginFill(color);
graphics.drawRect(x, y, width, height);
graphics.endFill();

// v8 (ใหม่ - ใช้แบบนี้)
graphics
    .fill(color)
    .rect(x, y, width, height)
    .fill();
```

---

## Performance Tips

### Memory Management
```typescript
// การลบ children ที่ไม่ใช้
container.removeChildren();

// การ destroy objects
graphics.destroy();
container.destroy();
```

### Event Mode Optimization
```typescript
// ใช้ 'static' สำหรับ objects ที่ต้องการ interaction
object.eventMode = 'static';

// ใช้ 'none' สำหรับ objects ที่ไม่ต้องการ interaction
object.eventMode = 'none';
```

---

## ⚠️ หากไม่พบ Class ที่ต้องการ

1. **ตรวจสอบในโค้ดเดิม** - มองหา import statements และการใช้งาน
2. **อ่านเอกสารทางการ** - https://pixijs.download/release/docs/index.html  
3. **อัปเดตไฟล์นี้** - เพิ่ม pattern ใหม่เมื่อพบการใช้งานที่ถูกต้อง

**อย่าเดาหรือใช้ความรู้เก่า - ใช้เฉพาะ patterns ที่ verified แล้ว**

---

## Selection Management System

### การเพิ่ม Selection Capability
```typescript
// จาก src/utils/selectionManager.ts - การทำให้ Container selectable
import { makeSelectable, selectionManager } from '../utils/selectionManager';

const selectableElement = makeSelectable(container, {
  onSelect: () => {
    console.log('Selected element');
    // Custom select behavior
  },
  onDeselect: () => {
    console.log('Deselected element');
    // Custom deselect behavior
  },
  selectOnClick: true // หรือ false หากต้องการ manual control
});
```

### Selection Management Operations
```typescript
// Manual selection control
selectionManager.selectElement(element);
selectionManager.deselectElement(element);
selectionManager.toggleSelection(element);

// ยกเลิกการ select ทั้งหมด (คลิกพื้นที่ว่าง)
selectionManager.deselectAll();

// ตรวจสอบสถานะ
const isSelected = selectionManager.isSelected(element);
const selectedCount = selectionManager.getSelectedCount();
const allSelected = selectionManager.getSelectedElements();
```

### Stage Deselect Pattern
```typescript
// จาก src/utils/stageManager.ts - การยกเลิก selection เมื่อคลิกพื้นที่ว่าง
private handleStagePointerDown(_event: FederatedPointerEvent): void {
  if (edgeStateManager.isCreatingEdge()) {
    edgeStateManager.cancelEdgeCreation();
    return;
  }
  
  // ยกเลิกการ select ทุก elements เมื่อคลิกพื้นที่ว่าง
  selectionManager.deselectAll();
}
```