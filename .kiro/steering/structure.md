# Project Structure

## Root Directory
```
├── src/                    # Source code
├── public/                 # Static assets
├── dist/                   # Build output (generated)
├── node_modules/           # Dependencies (generated)
├── .kiro/                  # Kiro configuration and specs
├── .vscode/                # VS Code settings
├── index.html              # Main HTML entry point
├── package.json            # Project configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build configuration
```

## Source Code Organization (`src/`)

### Components (`src/components/`)
Visual and interactive UI components:
- `C4Box.ts` - Main C4 diagram components (Person, System, Container, Component)
- `Edge.ts` - Connection lines between components
- `EdgeLabel.ts` - Labels for edges/connections
- `EditableLabel.ts` - In-place text editing functionality
- `LeftPanel.ts` - Collapsible left sidebar panel
- `ComponentTree.ts` - Hierarchical component tree view

### Layout (`src/layout/`)
Layout management system:
- `LayoutManager.ts` - Responsive layout coordination

### Utils (`src/utils/`)
Shared utilities and state management:
- `stageManager.ts` - Global PixiJS stage event coordination
- `selectionManager.ts` - Component selection state
- `edgeState.ts` - Edge creation workflow state
- `connectionState.ts` - Connection point visibility state
- `draggable.ts` - Drag-and-drop functionality
- `animations.ts` - Reusable animation helpers
- `labelManager.ts` - Text label management

### Entry Points
- `main.ts` - Application initialization and setup
- `style.css` - Global styles and CSS custom properties
- `vite-env.d.ts` - TypeScript environment declarations

## Configuration Files

### AI Assistant Configuration
- `.kiro/steering/` - AI assistant guidance documents
- `.kiro/specs/` - Feature specifications and requirements
- `.claude/pixijs-v8-patterns.md` - **CRITICAL**: PixiJS v8 API patterns reference
- `CLAUDE.md` - Claude-specific development guidance

### Development Configuration
- `tsconfig.json` - TypeScript compiler settings
- `vite.config.ts` - Build tool configuration with TailwindCSS plugin
- `.gitignore` - Version control exclusions

## Naming Conventions

### File Organization
- **Components**: PascalCase class files in `/components`
- **Utilities**: camelCase module files in `/utils`
- **Managers**: Singleton classes ending with "Manager"
- **Types**: Defined inline or in component files

### Code Structure
- **Classes**: PascalCase (LeftPanel, ComponentTree)
- **Functions**: camelCase (createC4Box, makeDraggable)
- **Constants**: UPPER_SNAKE_CASE for module-level constants
- **Interfaces**: PascalCase with descriptive names

## Import Patterns
- Relative imports within same directory level
- Absolute imports from `src/` root for cross-directory references
- Utility imports typically from `../utils/` relative path
- Component imports use explicit file extensions (.ts)

## State Management Architecture
- **Global Managers**: Singleton instances for app-wide state
- **Component State**: Local state within component classes
- **Event Communication**: Custom DOM events for cross-component updates
- **Persistence**: SessionStorage for UI state, no backend persistence
- **Metadata Storage**: Use `(container as any).nodeData` pattern for component data

## Critical Development Notes

### PixiJS v8 Constraint
⚠️ **ALWAYS read `.claude/pixijs-v8-patterns.md` before writing PixiJS code**
- Claude's default knowledge is v7 (incompatible syntax)
- Use existing project code as syntax reference
- Verify new patterns against official v8 documentation

### Code Quality Standards
- Write detailed Thai comments for complex features
- Follow established architecture patterns from existing code
- Update pattern documentation when discovering new v8 APIs