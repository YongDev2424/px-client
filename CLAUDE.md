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


## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Core Technologies
- **PixiJS v8**: 2D graphics rendering engine
- **TypeScript**: Type-safe JavaScript with strict mode enabled
- **Vite**: Build tool and development server
- **Tailwind CSS v4**: Styling framework

### Project Structure
```
src/
├── main.ts                 # Application entry point and event handling
├── components/             # Reusable PixiJS components
│   ├── C4Box.ts           # Main C4 diagram box component
│   └── C4Label.ts         # Text label component for boxes
├── utils/                 # Utility functions
│   └── draggable.ts       # Drag and drop functionality
└── style.css              # Global styles
```

### Key Components

**C4Box** (`src/components/C4Box.ts`):
- Creates C4 diagram boxes with graphics, labels, and connection points
- Supports customizable colors and text
- Automatically centers components and adds drag functionality

**Draggable** (`src/utils/draggable.ts`):
- Utility for making any PixiJS Container draggable
- Handles pointer events and offset calculations
- Applies to entire stage for smooth interaction

**Main Application** (`src/main.ts`):
- Initializes PixiJS application with full screen canvas
- Connects HTML toolbar buttons to PixiJS component creation
- Currently supports "Add Person" and "Add System" functionality

### Component Creation Pattern
When creating new C4 components:
1. Use the existing `createC4Box` function as a template
2. Components should return PixiJS Containers for consistency
3. Apply `makeDraggable` to enable user interaction
4. Use the established color scheme (Person: 0x0B61A4, System: 0x242424)

### Event Handling
- HTML buttons trigger PixiJS component creation
- Stage-level event handling for drag operations
- Components use `eventMode: 'static'` for interaction

## TypeScript Configuration
- Target: ES2022 with strict mode enabled
- No unused locals/parameters allowed
- Bundler module resolution with Vite