# 📚 C4 Editor Documentation

> Central hub สำหรับเอกสารทั้งหมดของโปรเจค C4 Editor

## 🎯 Quick Navigation

### 🏪 State Management (NEW)
> **⚠️ MANDATORY**: อ่านก่อนแก้ไข state logic ทุกครั้ง

- **[📖 State Management Guide](state-management.md)** - เอกสารหลัก (ต้องอ่าน!)
- **[💡 Examples & Patterns](examples/state-management-examples.md)** - ตัวอย่างการใช้งาน
- **[📊 Architecture Diagrams](diagrams/)** - ผังระบบและ flow charts
- **[✅ Validation Report](validation/state-docs-validation.md)** - การตรวจสอบเอกสาร

### 🎨 Design Guidelines

- **[📐 Laws of UX](laws-of-ux.md)** - หลักการออกแบบ UI/UX

## 🚀 Getting Started

### สำหรับผู้พัฒนาใหม่

1. **อ่านภาพรวม**: เริ่มที่ [CLAUDE.md](../CLAUDE.md) สำหรับ project overview
2. **เรียนรู้ State Management**: อ่าน [State Management Guide](state-management.md)
3. **ดูตัวอย่าง**: ศึกษา [Examples](examples/state-management-examples.md)
4. **ทดลองใช้**: เริ่มจาก basic examples

### สำหรับผู้พัฒนาที่มีประสบการณ์

1. **State Management Protocol**: ดู [CLAUDE.md State Protocol](../CLAUDE.md#state-management-protocol)
2. **Advanced Patterns**: ศึกษา [Advanced Examples](examples/state-management-examples.md#advanced-patterns)
3. **Integration Guide**: อ่าน [Component Integration](state-management.md#integration-patterns)
4. **Debugging Tools**: ใช้ [Debugging Examples](examples/state-management-examples.md#debugging-examples)

## 📊 Documentation Structure

```
docs/
├── README.md                           # นี่คือไฟล์นี้
├── state-management.md                 # 🏪 เอกสารหลัก State Management
├── laws-of-ux.md                      # 🎨 หลักการ UX Design
├── diagrams/                          # 📊 ผังและ diagrams
│   ├── state-flow.mermaid             # State flow diagram
│   ├── store-relationships.mermaid    # Store dependencies
│   ├── component-state-integration.mermaid # Component integration
│   └── deletion-flow.mermaid          # Deletion process flow
├── examples/                          # 💡 ตัวอย่างการใช้งาน
│   └── state-management-examples.md   # Examples ครอบคลุมทุกการใช้งาน
└── validation/                        # ✅ การตรวจสอบเอกสาร
    └── state-docs-validation.md       # Validation report
```

## 🏗️ Architecture Overview

โปรเจค C4 Editor ใช้ **Function-based Architecture** ด้วย:

- **🏪 Zustand Stores**: สำหรับ global state management
- **🎣 Composables**: สำหรับ reusable actions และ logic
- **📡 Event System**: สำหรับ component communication
- **🔄 Backward Compatibility**: รองรับโค้ดเก่าผ่าน wrappers

### Key Components

| Component | Purpose | Documentation |
|-----------|---------|---------------|
| **useNodeState** | จัดการ node properties | [Store Reference](state-management.md#useNodeState) |
| **useSelectionState** | จัดการการเลือก elements | [Store Reference](state-management.md#useSelectionState) |
| **useThemeState** | จัดการ themes และ accessibility | [Store Reference](state-management.md#useThemeState) |
| **useDeletionState** | จัดการการลบ elements | [Store Reference](state-management.md#useDeletionState) |
| **useToolbarState** | จัดการ toolbar buttons | [Store Reference](state-management.md#useToolbarState) |

## 📋 Development Protocols

### ⚠️ State Management Protocol

ก่อนแก้ไข state logic ต้องทำตาม protocol นี้:

1. **READ**: `docs/state-management.md`
2. **IDENTIFY**: store และ composable ที่เกี่ยวข้อง  
3. **VERIFY**: state flow และ dependencies
4. **IMPLEMENT**: ตาม established patterns
5. **TEST**: state changes และ event flows

### 🎨 UX Design Protocol

ก่อนออกแบบ UI ต้องทำตาม protocol นี้:

1. **READ**: `docs/laws-of-ux.md`
2. **IDENTIFY**: กฎ UX ที่เกี่ยวข้อง
3. **APPLY**: หลักการ UX ในการออกแบบ
4. **VALIDATE**: ทดสอบกับหลักการที่เลือก

## 🛠️ Development Tools

### State Debugging

```javascript
// ในบราวเซอร์ console
window.stateDebugger.getStates()           // ดู current states
window.stateDebugger.getEventLog()         // ดู event history
window.stateDebugger.validateStates()      // ตรวจสอบ consistency
window.stateDebugger.generateReport()      // สร้าง state report
```

### State Testing

```javascript
// ในบราวเซอร์ console
window.stateTester.runBasicTests()         // ทดสอบพื้นฐาน
window.stateTester.runPerformanceTests()   // ทดสอบ performance
```

### Documentation Testing

```javascript
// ในบราวเซอร์ console  
window.deletionSystemTests.run()           // ทดสอบ deletion system
```

## 🎯 Quick Reference

### Common Tasks

| Task | Documentation | Example |
|------|---------------|---------|
| Create new component with state | [Component Integration](state-management.md#integration-patterns) | [Example 6](examples/state-management-examples.md#example-6-full-component-integration) |
| Handle selection changes | [Event System](state-management.md#event-system) | [Example 5](examples/state-management-examples.md#example-5-custom-event-system) |
| Debug state issues | [Troubleshooting](state-management.md#troubleshooting) | [Example 9](examples/state-management-examples.md#example-9-state-debugging-tools) |
| Migrate class-based code | [Migration Guide](state-management.md#migration-guide) | [Migration Examples](examples/state-management-examples.md#migration-examples) |
| Add new state properties | [Store Reference](state-management.md#store-reference) | [Example 1](examples/state-management-examples.md#example-1-node-state-operations) |

### Event Reference

| Event | When Fired | Data Structure |
|-------|------------|----------------|
| `node-state-changed` | Node state เปลี่ยน | `{ nodeId, changeType, ...details }` |
| `pixi-selection-change` | Selection เปลี่ยน | `{ container, action }` |
| `element-deletion-completed` | Element ถูกลบ | `{ element, elementType }` |

## 📚 Additional Resources

### External Documentation
- [Zustand Documentation](https://github.com/pmndrs/zustand) - State management library
- [PixiJS Documentation](https://pixijs.download/release/docs/index.html) - Graphics library
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Language reference

### Project Files
- [CLAUDE.md](../CLAUDE.md) - Project overview และ development guidelines
- [Package.json](../package.json) - Dependencies และ scripts
- [TSConfig](../tsconfig.json) - TypeScript configuration

## 🆘 Getting Help

### หาความช่วยเหลือเมื่อ:

1. **State Logic Issues**:
   - อ่าน [Troubleshooting Guide](state-management.md#troubleshooting)
   - ใช้ [Debugging Tools](examples/state-management-examples.md#example-9-state-debugging-tools)
   - ตรวจสอบ [Event Log](examples/state-management-examples.md#debugging-examples)

2. **Integration Problems**:
   - ดู [Integration Patterns](state-management.md#integration-patterns)
   - ศึกษา [Component Examples](examples/state-management-examples.md#component-integration)
   - ใช้ [State Validator](examples/state-management-examples.md#debugging-examples)

3. **Performance Issues**:
   - อ่าน [Performance Tips](state-management.md#troubleshooting)
   - ดู [Optimization Examples](examples/state-management-examples.md#example-8-performance-optimization)
   - รัน [Performance Tests](examples/state-management-examples.md#example-10-state-testing)

### Support Channels

1. **Documentation First** 📖 - ค้นหาในเอกสารก่อน
2. **Console Debugging** 🐛 - ใช้ debugging tools
3. **Code Examples** 💡 - ดูตัวอย่างที่คล้ายกัน
4. **Issue Tracking** 📝 - สร้าง issue พร้อมข้อมูลที่ละเอียด

---

## 📝 Documentation Maintenance

### Last Updated
- **State Management**: [Date] - Version 1.0
- **Examples**: [Date] - Version 1.0  
- **Validation**: [Date] - Comprehensive validation completed

### Contributors
- **State Architecture**: Function-based design implementation
- **Documentation**: Comprehensive coverage with examples
- **Validation**: Quality assurance and testing

### Version History
- **v1.0**: Initial comprehensive documentation release
- **v0.x**: Legacy class-based documentation (deprecated)

---

*📚 Documentation Hub | Status: ✅ Active | Version: 1.0*