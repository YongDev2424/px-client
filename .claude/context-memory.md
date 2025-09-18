# Context Engineering Memory System

> ระบบจัดการ Working Memory สำหรับ Context Engineering ของโปรเจค PixiJS C4 Editor

## 🧠 Critical Memory Constraints

### PixiJS Version Lock
- **ห้ามใช้**: PixiJS v7 syntax (outdated knowledge)
- **ต้องใช้**: PixiJS v8 patterns (verified only)
- **Protocol**: อ่าน `.claude/pixijs-v8-patterns.md` ก่อนเขียนโค้ดเสมอ

### API Discovery Process
```
Step 1: ตรวจสอบ .claude/pixijs-v8-patterns.md
Step 2: หากไม่พบ → ค้นหาในโค้ดเดิมของโปรเจค  
Step 3: หากยังไม่พบ → อ่าน https://pixijs.download/release/docs/index.html
Step 4: อัปเดต patterns file ด้วย findings ใหม่
```

## 📊 Active Project Context

### Current Architecture
- **Framework**: PixiJS v8 + TypeScript + Vite
- **Pattern**: Container-based component architecture
- **Style**: Thai comments + English code
- **State**: draggable.ts แก้ไข Edge positioning bugs

### Key Components Status
- ✅ **C4Box**: Complete with connection points
- ✅ **Edge**: Complete with label system  
- ✅ **Draggable**: Complete with edge updating
- ✅ **StageManager**: Complete event coordination
- 🔄 **Context Engineering**: In progress

### Recent Developments
- Fixed Edge connection point positioning issues
- Added debug logging system
- Implemented side-specific connection tracking
- Created PixiJS v8 patterns documentation

## 🎯 Working Memory Active Tasks

### Current Focus
- Context Engineering implementation
- PixiJS v8 syntax enforcement
- Code generation quality improvement

### Next Priorities
1. Complete Context Engineering system
2. Test pattern effectiveness  
3. Create component templates
4. Add cognitive verification tools

## 📚 Knowledge Base References

### PixiJS v8 Verified Classes
- Application (await app.init pattern)
- Container (eventMode: 'static')
- Graphics (method chaining: .fill().rect().fill())
- Point (constructor + methods)
- FederatedPointerEvent (event.global, stopPropagation)
- Circle (hit area usage)

### Project-Specific Patterns
- Connection Point creation and management
- Edge creation with label gaps
- Event handling with stopPropagation
- Global position calculation
- Metadata storage in containers

## ⚠️ Common Pitfalls to Avoid

### PixiJS Version Confusion
- ❌ `new Application({ width, height })` (v7 style)
- ✅ `const app = new Application(); await app.init({ width, height })` (v8 style)

### Graphics API Changes  
- ❌ `graphics.beginFill(color); graphics.drawRect(...); graphics.endFill()` (v7)
- ✅ `graphics.fill(color).rect(...).fill()` (v8)

### Event System Updates
- ❌ Assuming v7 event behavior
- ✅ Using verified FederatedPointerEvent patterns

## 🔄 Memory Update Protocol

### When to Update This File
1. เมื่อพบ PixiJS patterns ใหม่
2. เมื่อ project architecture เปลี่ยนแปลง  
3. เมื่อเจอ bugs ที่เกี่ยวกับ version compatibility
4. เมื่อ Context Engineering system ได้รับการปรับปรุง

### Update Checklist
- [ ] อัปเดต Active Project Context
- [ ] เพิ่ม patterns ใหม่ใน pixijs-v8-patterns.md
- [ ] ปรับปรุง Common Pitfalls
- [ ] ทดสอบ Context effectiveness

## 📈 Success Metrics

### Quality Indicators
- 0% PixiJS v7 syntax usage
- 100% pattern compliance
- ลดเวลา debugging syntax errors
- เพิ่มความเร็วในการพัฒนา components

### Context Effectiveness
- Response accuracy for PixiJS questions
- Code generation quality
- Pattern consistency across codebase
- Reduced need for manual corrections