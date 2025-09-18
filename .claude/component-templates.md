# PixiJS v8 Component Templates

> Templates สำหรับสร้าง PixiJS components ใหม่ โดยใช้ patterns ที่ verified แล้วจากโปรเจค

## 🎯 Template Usage Protocol

**ก่อนใช้ template:**
1. อ่าน `.claude/pixijs-v8-patterns.md` เพื่อ verify syntax
2. ดู existing components เป็นตัวอย่าง
3. ปฏิบัติตาม project conventions

---

## 📦 Basic Container Component

```typescript
// Template: Basic Container Component (PixiJS v8)
import { Container, Graphics, Application } from 'pixi.js';

/**
 * สร้าง Component พื้นฐานด้วย Container pattern
 * @param app - ตัวแอปพลิเคชัน Pixi หลัก
 * @param options - ตัวเลือกการตั้งค่า component
 * @returns Container object ที่สร้างเสร็จแล้ว
 */
export function createBasicComponent(
  app: Application, 
  options: {
    width: number;
    height: number;
    color: number;
    x?: number;
    y?: number;
  }
): Container {
  // 1. สร้าง Container หลัก
  const container = new Container();
  
  // 2. สร้าง Graphics ด้วย v8 pattern
  const graphics = new Graphics()
    .fill(options.color)
    .rect(0, 0, options.width, options.height)
    .fill();
  
  // 3. เพิ่ม Graphics เข้าใน Container
  container.addChild(graphics);
  
  // 4. ตั้งค่าตำแหน่ง (optional)
  if (options.x !== undefined) container.x = options.x;
  if (options.y !== undefined) container.y = options.y;
  
  // 5. ตั้งค่า interaction (หากต้องการ)
  container.eventMode = 'static';
  container.cursor = 'pointer';
  
  // 6. เก็บ metadata (optional)
  (container as any).componentData = {
    type: 'basic-component',
    options: options
  };
  
  return container;
}
```

---

## 🎨 Graphics-Heavy Component

```typescript
// Template: Graphics-Heavy Component
import { Container, Graphics, Point } from 'pixi.js';

/**
 * สร้าง Component ที่มีการวาด Graphics ซับซ้อน
 * @param centerPoint - จุดกึ่งกลางของ component
 * @param size - ขนาดของ component
 * @returns Container ที่มี complex graphics
 */
export function createComplexGraphicsComponent(
  centerPoint: Point,
  size: number
): Container {
  const container = new Container();
  
  // สร้าง Graphics หลายชิ้น
  const background = new Graphics()
    .fill(0xF0F0F0)
    .rect(-size/2, -size/2, size, size)
    .fill();
  
  const border = new Graphics()
    .rect(-size/2, -size/2, size, size)
    .stroke({ width: 2, color: 0x333333 });
  
  const centerDot = new Graphics();
  centerDot.circle(0, 0, 3);
  centerDot.fill(0xFF0000);
  
  // เพิ่มทุกอย่างเข้าใน Container
  container.addChild(background);
  container.addChild(border);
  container.addChild(centerDot);
  
  // ตั้งตำแหน่ง Container
  container.x = centerPoint.x;
  container.y = centerPoint.y;
  
  return container;
}
```

---

## 🔗 Interactive Component  

```typescript
// Template: Interactive Component with Events
import { Container, Graphics, FederatedPointerEvent } from 'pixi.js';

/**
 * สร้าง Component ที่มี interaction events
 * @param options - การตั้งค่า component และ callbacks
 * @returns Interactive Container
 */
export function createInteractiveComponent(options: {
  width: number;
  height: number;
  color: number;
  hoverColor: number;
  onPointerDown?: (event: FederatedPointerEvent) => void;
  onPointerOver?: (event: FederatedPointerEvent) => void;
  onPointerOut?: (event: FederatedPointerEvent) => void;
}): Container {
  const container = new Container();
  
  // สร้าง Graphics
  const graphics = new Graphics()
    .fill(options.color)
    .rect(0, 0, options.width, options.height)
    .fill();
  
  container.addChild(graphics);
  
  // ตั้งค่า interaction
  container.eventMode = 'static';
  container.cursor = 'pointer';
  
  // เพิ่ม Event Handlers
  container.on('pointerdown', (event: FederatedPointerEvent) => {
    event.stopPropagation();
    options.onPointerDown?.(event);
  });
  
  container.on('pointerover', (event: FederatedPointerEvent) => {
    event.stopPropagation();
    // เปลี่ยนสีเมื่อ hover
    graphics.clear();
    graphics
      .fill(options.hoverColor)
      .rect(0, 0, options.width, options.height)
      .fill();
    
    options.onPointerOver?.(event);
  });
  
  container.on('pointerout', (event: FederatedPointerEvent) => {
    event.stopPropagation();
    // เปลี่ยนกลับสีเดิม
    graphics.clear();
    graphics
      .fill(options.color)
      .rect(0, 0, options.width, options.height)
      .fill();
    
    options.onPointerOut?.(event);
  });
  
  return container;
}
```

---

## ⭕ Circle-Based Component

```typescript
// Template: Circle-Based Component (จาก Connection Point pattern)
import { Container, Graphics, Circle } from 'pixi.js';

/**
 * สร้าง Component แบบวงกลมด้วย hit area
 * @param radius - รัศมีของวงกลม
 * @param color - สีของวงกลม
 * @param hitAreaRadius - รัศมีของ hit area (optional)
 * @returns Circle Container component
 */
export function createCircleComponent(
  radius: number,
  color: number,
  hitAreaRadius?: number
): Container {
  const container = new Container();
  
  // สร้าง Circle Graphics
  const circle = new Graphics();
  circle.circle(0, 0, radius);
  circle.fill(color);
  
  container.addChild(circle);
  
  // ตั้งค่า interaction
  container.eventMode = 'static';
  container.cursor = 'pointer';
  
  // ตั้งค่า hit area (ใหญ่กว่า visual ถ้าต้องการ)
  const hitRadius = hitAreaRadius || radius;
  container.hitArea = new Circle(0, 0, hitRadius);
  
  // เพิ่มฟังก์ชัน helper สำหรับเปลี่ยน hit area
  (container as any).setHitAreaRadius = function(newRadius: number) {
    this.hitArea = new Circle(0, 0, newRadius);
  };
  
  return container;
}
```

---

## 📏 Line/Path Component

```typescript
// Template: Line/Path Drawing Component  
import { Container, Graphics, Point } from 'pixi.js';

/**
 * สร้าง Component สำหรับวาดเส้นหรือ path
 * @param points - Array ของจุดที่จะวาดเส้นผ่าน
 * @param lineStyle - สไตล์ของเส้น
 * @returns Line Container component
 */
export function createLineComponent(
  points: Point[],
  lineStyle: {
    width: number;
    color: number;
    alpha?: number;
  }
): Container {
  const container = new Container();
  
  if (points.length < 2) {
    console.warn('ต้องการอย่างน้อย 2 จุดเพื่อวาดเส้น');
    return container;
  }
  
  // สร้าง Graphics สำหรับเส้น
  const line = new Graphics();
  
  // เริ่มต้นวาดจากจุดแรก
  line.moveTo(points[0].x, points[0].y);
  
  // วาดเส้นไปยังจุดอื่นๆ
  for (let i = 1; i < points.length; i++) {
    line.lineTo(points[i].x, points[i].y);
  }
  
  // Apply line style
  line.stroke({
    width: lineStyle.width,
    color: lineStyle.color,
    alpha: lineStyle.alpha || 1
  });
  
  container.addChild(line);
  
  // เก็บข้อมูล points ไว้ใน metadata
  (container as any).lineData = {
    points: points.map(p => p.clone()),
    style: lineStyle
  };
  
  return container;
}
```

---

## 🏗️ Composite Component Pattern

```typescript
// Template: Component ที่ประกอบด้วยหลายส่วน (จาก C4Box pattern)
import { Container, Graphics, Application } from 'pixi.js';

/**
 * สร้าง Composite Component ที่มีหลายส่วนประกอบ
 * @param app - ตัวแอปพลิเคชัน Pixi หลัก  
 * @param config - การตั้งค่า component
 * @returns Composite Container
 */
export function createCompositeComponent(
  app: Application,
  config: {
    width: number;
    height: number;
    backgroundColor: number;
    borderColor: number;
    label?: string;
  }
): Container {
  // 1. สร้าง Container หลัก
  const mainContainer = new Container();
  
  // 2. สร้างส่วนประกอบต่างๆ
  const background = new Graphics()
    .fill(config.backgroundColor)
    .rect(0, 0, config.width, config.height)
    .fill();
  
  const border = new Graphics()
    .rect(0, 0, config.width, config.height)
    .stroke({ width: 2, color: config.borderColor });
  
  // 3. เพิ่มส่วนประกอบเข้าใน Container หลัก
  mainContainer.addChild(background);
  mainContainer.addChild(border);
  
  // 4. เพิ่ม label ถ้ามี (ต้อง import text system)
  if (config.label) {
    // TODO: เพิ่ม text/label component
    console.log(`Label: ${config.label}`);
  }
  
  // 5. ตั้งค่าตำแหน่งกึ่งกลางหน้าจอ
  mainContainer.x = (app.screen.width - config.width) / 2;
  mainContainer.y = (app.screen.height - config.height) / 2;
  
  // 6. ตั้งค่า interaction
  mainContainer.eventMode = 'static';
  mainContainer.cursor = 'move';
  
  // 7. เก็บ metadata
  (mainContainer as any).componentData = {
    type: 'composite-component',
    config: config,
    parts: {
      background,
      border
    }
  };
  
  return mainContainer;
}
```

---

## 🔧 Template Usage Guidelines

### Naming Conventions
- Function names: `createXxxComponent`
- Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types: `PascalCase`

### Required Imports
```typescript
// ต้อง import เสมอ
import { Container, Graphics } from 'pixi.js';

// Import เพิ่มเติมตามความต้องการ
import { Application, FederatedPointerEvent, Point, Circle } from 'pixi.js';
```

### Error Handling Pattern
```typescript
// ตรวจสอบ parameters
if (!app || !options) {
  console.error('ต้องการ app และ options parameters');
  return new Container(); // return empty container
}

// ตรวจสอบค่าที่สมเหตุสมผล
if (options.width <= 0 || options.height <= 0) {
  console.warn('width และ height ต้องมากกว่า 0');
  options.width = Math.max(1, options.width);
  options.height = Math.max(1, options.height);
}
```

### Metadata Pattern
```typescript
// เก็บข้อมูลใน Container เพื่อใช้ภายหลัง
(container as any).componentData = {
  type: 'component-type',
  version: '1.0',
  createdAt: Date.now(),
  // ... other metadata
};
```

## ⚠️ Important Reminders

1. **ใช้เฉพาะ PixiJS v8 syntax** - ตรวจสอบใน `.claude/pixijs-v8-patterns.md`
2. **Thai comments** - เขียน comments เป็นภาษาไทย
3. **Container-based** - ใช้ Container เป็นหลักสำหรับ components
4. **Event handling** - ใช้ `event.stopPropagation()` เมื่อจำเป็น
5. **Metadata storage** - เก็บข้อมูลใน Container สำหรับใช้ภายหลัง