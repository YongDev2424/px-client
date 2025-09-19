# Technology Stack

## Core Technologies

- **TypeScript**: Primary language with strict type checking enabled
- **PixiJS v8**: WebGL-based 2D rendering engine for interactive graphics
- **Vite**: Build tool and development server
- **TailwindCSS v4**: Utility-first CSS framework with Vite plugin

## ⚠️ CRITICAL: PixiJS v8 Memory Constraint

**MEMORY CONSTRAINT**: Claude's default knowledge is PixiJS v7 which has significantly different syntax.

### Protocol for PixiJS Code:
1. **Always read `.claude/pixijs-v8-patterns.md` before writing PixiJS code**
2. If class not found in guide → read https://pixijs.download/release/docs/index.html
3. Always use existing project code as syntax template
4. Never guess or use old v7 knowledge

### Key v8 API Changes:
- Application: Use `await app.init()` instead of constructor options
- Graphics: Use `.fill(color).rect().fill()` method chaining
- Events: Use `FederatedPointerEvent` and `eventMode: 'static'`

## Build System

### Development Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production (TypeScript compilation + Vite build)
npm run preview  # Preview production build
```

### TypeScript Configuration
- Target: ES2022
- Module: ESNext with bundler resolution
- Strict mode enabled with additional linting rules
- No unused locals/parameters enforcement

## Architecture Patterns

### Component Structure
- **Container-based**: All visual elements use PixiJS Container as base
- **Event-driven**: Custom event system for cross-component communication
- **State Management**: Dedicated manager classes (stageManager, selectionManager, etc.)
- **Singleton Pattern**: Used for global managers (LayoutManager, stageManager)

### Code Organization
- **Modular Components**: Each UI component is self-contained with its own TypeScript class
- **Utility Modules**: Shared functionality in `/utils` directory
- **Manager Pattern**: Centralized state management for complex interactions

### PixiJS v8 Patterns
- **Graphics Creation**: `.fill(color).rect(x,y,w,h).fill()` method chaining
- **Application Init**: `await app.init({...})` instead of constructor
- **Event Handling**: `eventMode = 'static'` and `FederatedPointerEvent`
- **Global Events**: Use `globalpointermove` for stage-level interactions
- **Hit Areas**: `new Circle(0, 0, radius)` for precise interaction zones
- **Position Methods**: `getGlobalPosition()` for coordinate calculations

## Key Libraries & APIs

- **PixiJS Graphics API**: For drawing shapes and visual elements
- **DOM Integration**: HTML panels integrated with PixiJS canvas
- **CSS Custom Properties**: For dynamic theming and layout
- **SessionStorage**: For persisting UI state (panel positions, etc.)

## Development Guidelines

### File Naming
- Use PascalCase for component classes (`C4Box.ts`, `LeftPanel.ts`)
- Use camelCase for utility modules (`stageManager.ts`, `draggable.ts`)
- Use kebab-case for CSS classes and HTML IDs

### Event Handling
- Use `event.stopPropagation()` to prevent event bubbling
- Implement proper cleanup in destroy methods
- Use custom events for cross-component communication
- Always use `FederatedPointerEvent` type for PixiJS events

### PixiJS v8 Code Quality
- Write detailed Thai comments for all new features
- Use existing codebase as architecture pattern template
- Update `.claude/pixijs-v8-patterns.md` when discovering new patterns
- Never use v7 syntax - always verify against v8 patterns

### Performance
- Implement object pooling for frequently created/destroyed elements
- Use `visible` and `alpha` properties for show/hide animations
- Batch DOM updates to prevent layout thrashing
- Use `eventMode: 'none'` for non-interactive objects