# Product Overview

**PixiJS C4 Editor** is an interactive web-based diagram editor for creating C4 architecture diagrams. The application allows users to create, edit, and connect C4 model components (Person, System, Container, Component) through a visual interface.

## Key Features

- **Visual C4 Diagram Creation**: Create C4 architecture diagrams with drag-and-drop components
- **Interactive Canvas**: PixiJS-powered canvas with smooth interactions and animations
- **Component Management**: Left panel with hierarchical component tree view
- **Edge System**: Click-to-connect system for creating relationships between components
- **Editable Labels**: In-place text editing for component names and descriptions
- **Layout Management**: Responsive layout with collapsible panels and resizable interface

## Target Users

Software architects, developers, and technical teams who need to create and maintain C4 architecture diagrams for system documentation and communication.

## Core Workflow

1. Add C4 components using toolbar buttons (Person, System, Container, Component)
2. Position components on canvas through drag-and-drop
3. Create connections by clicking connection points on components
4. Edit component labels by double-clicking
5. Manage components through the left panel tree view

## Development Context

This project uses **PixiJS v8** with significantly different syntax from v7. All AI assistants must:
- Read `.claude/pixijs-v8-patterns.md` before writing PixiJS code
- Use existing codebase as syntax reference
- Write detailed Thai comments for new features
- Follow established architecture patterns