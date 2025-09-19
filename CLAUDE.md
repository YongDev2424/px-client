# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a PixiJS-based C4 diagram editor written in TypeScript. The application allows users to create and manipulate C4 architecture diagrams with draggable components.

## 🎯 Context Engineering Architecture

### Level 1: PixiJS v8 Critical Memory Constraint
⚠️ **MEMORY CONSTRAINT**: ความรู้เดิมของ Claude คือ PixiJS v7 ซึ่งมี syntax ที่แตกต่างกันอย่างมาก

**Protocol สำหรับการเขียนโค้ด PixiJS:**
1. **อ่าน `.claude/pixijs-v8-patterns.md` เสมอก่อนเขียนโค้ด**
2. ถ้าไม่พบ class ที่ต้องการในคู่มือ → อ่าน https://pixijs.download/release/docs/index.html
3. ใช้โค้ดในโปรเจคเป็นต้นแบบ syntax เสมอ
4. ห้ามเดาหรือใช้ความรู้ v7 เก่า

### Level 2: API Verification Protocol
```
READ: .claude/pixijs-v8-patterns.md
↓
VERIFY: pattern exists และถูกต้อง  
↓
GENERATE: code ตาม verified pattern
↓
FALLBACK: หากไม่พบ → อ่านเอกสารทางการ → อัปเดต patterns file
```

### Level 3: Context Working Memory
- **Current PixiJS Version**: v8 (verified patterns ใน `.claude/`)
- **Active Features**: Edge system, C4Box components, Draggable utils
- **Recent Patterns Added**: [Track new patterns here]

### Level 4: Quality Assurance
- ทุกครั้งที่เพิ่มฟีเจอร์ให้เขียนคำอธิบายให้ละเอียดเป็นภาษาไทย
- ใช้ existing codebase เป็นต้นแบบ architecture patterns
- อัปเดต `.claude/pixijs-v8-patterns.md` เมื่อพบ patterns ใหม่

## 🎨 UI/UX Design Guidelines

### UX Reference Documentation
**REQUIRED**: ก่อนออกแบบหรือสร้าง UI ใดๆ ให้อ่านเอกสาร Laws of UX ก่อนเสมอ

📖 **เอกสารอ้างอิง**: `docs/laws-of-ux.md`

### Design Protocol
```
READ: docs/laws-of-ux.md
↓
IDENTIFY: กฎ UX ที่เกี่ยวข้องกับ feature ที่กำลังสร้าง
↓
APPLY: หลักการ UX ในการออกแบบ
↓
VALIDATE: ทดสอบกับหลักการที่เลือกใช้
```

### Key UX Principles for C4 Editor
1. **Jakob's Law**: ใช้ Convention ที่คุ้นเคยสำหรับ Diagram Editor
2. **Fitts's Law**: ทำ Interactive Elements ให้ใหญ่พอและใกล้กัน
3. **Hick's Law**: ลดทางเลือกในเมนูและ Toolbar
4. **Aesthetic-Usability Effect**: ออกแบบให้สวยงามเพื่อเพิ่มการรับรู้ว่าใช้งานง่าย
5. **Doherty Threshold**: ให้ระบบตอบสนองเร็วกว่า 400ms

### Design Implementation Checklist
- [ ] อ่าน `docs/laws-of-ux.md` แล้ว
- [ ] ระบุกฎ UX ที่เกี่ยวข้อง
- [ ] ออกแบบตามหลักการที่เลือก
- [ ] Test Performance (< 400ms response time)
- [ ] ตรวจสอบ Touch Target Size สำหรับ Mobile


## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests (Function-based architecture tests included)
npm test

# Run specific test
npm test -- functionBasedArchitecture
```

## Architecture

### Core Technologies
- **PixiJS v8**: 2D graphics rendering engine
- **TypeScript**: Type-safe JavaScript with strict mode enabled
- **Vite**: Build tool and development server
- **Tailwind CSS v4**: Styling framework
- **Zustand v5**: Function-based state management (vanilla stores)

### 🏗️ Function-Based Architecture (NEW)
โปรเจคได้เปลี่ยนจาก Class-based เป็น Function-based architecture เต็มรูปแบบ:

#### State Management Architecture
```
src/
├── stores/                 # Zustand vanilla stores (Function-based)
│   ├── nodeState.ts       # Node state management (แทน NodeStateManager)
│   ├── selectionState.ts  # Selection state management (แทน SelectionManager)
│   ├── themeState.ts      # Theme & accessibility state (แทน ThemeManager)
│   └── index.ts           # Store aggregation และ initialization
├── composables/            # Custom hooks และ actions
│   ├── useNodeActions.ts  # Node manipulation actions
│   ├── useSelectionActions.ts # Selection management actions
│   ├── useThemeActions.ts # Theme & accessibility actions
│   └── index.ts           # Composables aggregation
├── factories/              # Factory functions (แทน Singleton classes)
│   ├── zoomManager.ts     # Zoom management factory
│   ├── layoutManager.ts   # Layout management factory
│   └── index.ts           # Factory aggregation
└── components/             # PixiJS components (ใช้ stores และ composables)
```

#### Key Architectural Principles
1. **Function-First**: ทุกอย่างเป็น function แทน class
2. **Store-Based State**: ใช้ Zustand stores สำหรับ global state
3. **Composable Actions**: Actions แยกออกเป็น composable functions
4. **Factory Pattern**: สร้าง instances ผ่าน factory functions
5. **Backward Compatibility**: มี compatibility wrappers สำหรับโค้ดเดิม

### 🔧 Function-Based Development Patterns

#### State Management Pattern
```typescript
// เก่า (Class-based)
const nodeStateManager = NodeStateManager.getInstance();
nodeStateManager.setCollapsed(container, true);

// ใหม่ (Function-based)
const nodeActions = useNodeActions(container);
nodeActions.collapse();

// หรือใช้ store โดยตรง
useNodeState.getState().setCollapsed(nodeId, true);
```

#### Component Creation Pattern (Updated)
เมื่อสร้าง components ใหม่:
1. **ใช้ stores สำหรับ state management**:
   ```typescript
   import { useNodeActions, useSelectionActions } from '../composables';
   ```
2. **ใช้ factory functions สำหรับ managers**:
   ```typescript
   import { createZoomManager } from '../factories';
   ```
3. **ใช้ makeSelectable สำหรับ selection**:
   ```typescript
   import { makeSelectable } from '../stores/selectionState';
   ```
4. **Components ควร return PixiJS Containers** เหมือนเดิม
5. **ใช้ established color scheme** เหมือนเดิม (Person: 0x0B61A4, System: 0x242424)

#### Key Function-Based Components

**Node State Management** (`src/stores/nodeState.ts`):
- จัดการ collapse/expand, editing, properties ของ nodes
- รองรับ action buttons และ bounds management
- มี compatibility wrapper เป็น `nodeStateManager`

**Selection Management** (`src/stores/selectionState.ts`):
- จัดการการเลือก elements และ visual indicators
- รองรับ multi-selection และ enhanced nodes
- มี compatibility wrapper เป็น `selectionManager`

**Theme Management** (`src/stores/themeState.ts`):
- จัดการ themes และ accessibility settings
- รองรับ localStorage persistence
- มี compatibility wrapper เป็น `themeManager`

**Composable Actions** (`src/composables/`):
- `useNodeActions`: การจัดการ node states
- `useSelectionActions`: การจัดการ selection
- `useThemeActions`: การจัดการ themes

**Factory Functions** (`src/factories/`):
- `createZoomManager`: Zoom management แบบ function
- `createLayoutManager`: Layout management แบบ function

### Event Handling (Updated)
- HTML buttons trigger PixiJS component creation (เหมือนเดิม)
- Stage-level event handling for drag operations (เหมือนเดิม)
- **Store subscriptions สำหรับ state changes** (ใหม่)
- **Composable actions สำหรับ user interactions** (ใหม่)
- Components use `eventMode: 'static'` for interaction (เหมือนเดิม)

## TypeScript Configuration
- Target: ES2022 with strict mode enabled
- No unused locals/parameters allowed
- Bundler module resolution with Vite

## 🎯 Function-Based Architecture Benefits

### Performance Benefits
1. **Reduced Bundle Size**: Tree-shaking ทำงานได้ดีกว่าด้วย function exports
2. **Less Memory Usage**: ไม่มี class instantiation overhead
3. **Better HMR**: Hot Module Replacement เร็วขึ้นกับ function modules

### Developer Experience Benefits
1. **Consistent Code Style**: รูปแบบการเขียนโค้ดเดียวกันทั้งโปรเจค
2. **Better IntelliSense**: TypeScript auto-completion ทำงานได้ดีกว่า
3. **Easier Testing**: Pure functions ทดสอบง่ายกว่า class methods
4. **Better Debugging**: Function call stack ชัดเจนกว่า

### Maintenance Benefits
1. **Simpler Imports**: Import เฉพาะ functions ที่ใช้
2. **Better Composability**: ผสมผสาน functions ได้ง่าย
3. **Clearer Dependencies**: Function dependencies ชัดเจนกว่า
4. **Easier Refactoring**: เปลี่ยนแปลงได้ง่ายกว่า

## 🔄 Migration Guide

### สำหรับโค้ดใหม่
ใช้ function-based pattern ใหม่:
```typescript
// ✅ แนะนำ - Function-based
import { useNodeActions, useSelectionActions } from './composables';
import { createZoomManager } from './factories';

const nodeActions = useNodeActions(container);
nodeActions.collapse();
```

### สำหรับโค้ดเก่า
ยังใช้ compatibility wrappers ได้:
```typescript
// ✅ ยังใช้ได้ - Backward compatibility
import { nodeStateManager, selectionManager } from './stores';

nodeStateManager.setCollapsed(container, true);
selectionManager.selectElement(element);
```

### การเปลี่ยนแปลงแบบค่อยเป็นค่อยไป
1. **โค้ดเก่าจะทำงานได้ปกติ** ด้วย compatibility wrappers
2. **เพิ่มฟีเจอร์ใหม่ด้วย function-based pattern**
3. **ค่อยๆ refactor โค้ดเก่าตามความสะดวก**
4. **ทดสอบด้วย `npm test -- functionBasedArchitecture`**