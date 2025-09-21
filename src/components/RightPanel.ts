// src/components/RightPanel.ts

import { Application } from 'pixi.js';

export interface RightPanelState {
  isCollapsed: boolean;
  width: number;
  isResizing: boolean;
  activeTab: 'properties' | 'styles' | 'metadata';
  selectedElementId: string | null;
  selectedElementType: 'node' | 'edge' | null;
}

export interface PropertyItem {
  key: string;
  value: any;
  type: 'text' | 'number' | 'boolean' | 'array' | 'select';
  options?: string[]; // For select type
  readonly?: boolean;
  category?: string;
}

export class RightPanel {
  private panel!: HTMLElement;
  private content!: HTMLElement;
  private toggleBtn!: HTMLElement;
  private expandBtn!: HTMLElement;
  private resizeHandle!: HTMLElement;
  private title!: HTMLElement;
  private tabs!: NodeListOf<HTMLElement>;
  private searchInput!: HTMLInputElement;
  private clearSearchBtn!: HTMLElement;
  private propertyContent!: HTMLElement;

  private state: RightPanelState = {
    isCollapsed: true, // เริ่มต้นแบบปิด
    width: 400, // pixels
    isResizing: false,
    activeTab: 'properties',
    selectedElementId: null,
    selectedElementType: null
  };

  private readonly MIN_WIDTH = 250; // pixels
  private readonly MAX_WIDTH = 600; // pixels

  private onStateChange?: (state: RightPanelState) => void;
  private currentProperties: PropertyItem[] = [];

  constructor(pixiApp?: Application) {
    this.initializeElements();
    this.setupEventListeners();
    this.loadPanelState();
    
    console.log('✅ RightPanel initialized', {
      isCollapsed: this.state.isCollapsed,
      width: this.state.width
    });
  }

  private initializeElements(): void {
    this.panel = this.getElement('right-panel');
    this.content = this.getElement('property-content', this.panel);
    this.toggleBtn = this.getElement('toggle-right-panel-btn', this.panel);
    this.expandBtn = this.getElement('expand-right-panel-btn'); // Global element
    this.resizeHandle = this.getElement('right-resize-handle', this.panel);
    this.title = this.getElement('panel-title', this.panel);
    this.tabs = this.panel.querySelectorAll('.tab-btn');
    this.searchInput = this.getElement('property-search-input', this.panel) as HTMLInputElement;
    this.clearSearchBtn = this.getElement('clear-search-btn', this.panel);
    this.propertyContent = this.getElement('property-content', this.panel);

    // Initial state setup
    if (this.state.isCollapsed) {
      this.panel.classList.add('collapsed');
      this.expandBtn.style.display = 'flex';
    }
  }

  private getElement(id: string, parent?: HTMLElement): HTMLElement {
    const element = parent ? parent.querySelector(`#${id}`) : document.getElementById(id);
    if (!element) {
      throw new Error(`Element with id '${id}' not found`);
    }
    return element as HTMLElement;
  }

  private setupEventListeners(): void {
    // Toggle button (close panel)
    this.toggleBtn.addEventListener('click', () => this.togglePanel());
    
    // Expand button (open panel)
    this.expandBtn.addEventListener('click', () => this.togglePanel());
    
    // Tab buttons
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabType = tab.getAttribute('data-tab') as RightPanelState['activeTab'];
        if (tabType) {
          this.setActiveTab(tabType);
        }
      });
    });

    // Search functionality
    this.searchInput.addEventListener('input', () => this.handleSearch());
    this.clearSearchBtn.addEventListener('click', () => this.clearSearch());

    // Resize functionality
    this.setupResizeHandlers();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }

  private setupResizeHandlers(): void {
    let startX = 0;
    let startWidth = 0;

    const handleMouseDown = (e: MouseEvent) => {
      this.state.isResizing = true;
      startX = e.clientX;
      startWidth = this.state.width;
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      document.body.style.cursor = 'ew-resize';
      this.panel.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!this.state.isResizing) return;
      
      const deltaX = startX - e.clientX; // Right panel: positive delta = wider
      const newWidth = Math.min(Math.max(startWidth + deltaX, this.MIN_WIDTH), this.MAX_WIDTH);
      
      this.setWidth(newWidth);
    };

    const handleMouseUp = () => {
      this.state.isResizing = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      document.body.style.cursor = '';
      this.panel.style.userSelect = '';
      
      this.savePanelState();
    };

    this.resizeHandle.addEventListener('mousedown', handleMouseDown);
  }

  private handleKeyboardShortcuts(e: KeyboardEvent): void {
    // Ctrl/Cmd + P: Toggle properties panel
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      this.togglePanel();
    }
    
    // Escape: Close panel
    if (e.key === 'Escape' && !this.state.isCollapsed) {
      this.closePanel();
    }
  }

  // === Public API ===

  public show(elementId: string, elementType: 'node' | 'edge', properties: PropertyItem[] = [], options?: { autoOpen?: boolean; focusProperty?: string }): void {
    console.log('🗂️ RightPanel: Showing for', elementType, elementId, 'Options:', options);
    
    this.state.selectedElementId = elementId;
    this.state.selectedElementType = elementType;
    this.currentProperties = properties;
    
    // Update title
    this.title.textContent = `${elementType === 'node' ? 'Node' : 'Edge'} Properties`;
    
    // Only open panel if explicitly requested (autoOpen: true)
    if (options?.autoOpen && this.state.isCollapsed) {
      this.openPanel();
    }
    
    // Render properties
    this.renderProperties();
    
    // Focus specific property if requested
    if (options?.focusProperty) {
      this.focusProperty(options.focusProperty);
    }
    
    this.onStateChange?.(this.state);
  }

  public hide(): void {
    console.log('🗂️ RightPanel: Hiding');
    this.closePanel();
  }

  public togglePanel(): void {
    if (this.state.isCollapsed) {
      this.openPanel();
    } else {
      this.closePanel();
    }
  }

  public openPanel(): void {
    console.log('🗂️ RightPanel: Opening');
    this.state.isCollapsed = false;
    this.panel.classList.remove('collapsed');
    this.expandBtn.style.display = 'none';
    this.savePanelState();
    this.onStateChange?.(this.state);
  }

  public closePanel(): void {
    console.log('🗂️ RightPanel: Closing');
    this.state.isCollapsed = true;
    this.panel.classList.add('collapsed');
    this.expandBtn.style.display = 'flex';
    this.savePanelState();
    this.onStateChange?.(this.state);
  }

  public setActiveTab(tab: RightPanelState['activeTab']): void {
    this.state.activeTab = tab;
    
    // Update tab UI
    this.tabs.forEach(tabBtn => {
      const tabType = tabBtn.getAttribute('data-tab');
      if (tabType === tab) {
        tabBtn.classList.add('active');
      } else {
        tabBtn.classList.remove('active');
      }
    });
    
    // Re-render content based on active tab
    this.renderProperties();
    
    console.log('🗂️ RightPanel: Active tab changed to', tab);
  }

  public setWidth(width: number): void {
    this.state.width = Math.min(Math.max(width, this.MIN_WIDTH), this.MAX_WIDTH);
    this.panel.style.width = `${this.state.width}px`;
  }

  public updateProperties(properties: PropertyItem[]): void {
    this.currentProperties = properties;
    this.renderProperties();
  }

  // === Property Rendering ===

  private renderProperties(): void {
    if (!this.currentProperties.length) {
      this.renderEmptyState();
      return;
    }

    // Filter properties based on search
    const searchTerm = this.searchInput.value.toLowerCase();
    let filteredProperties = this.currentProperties;
    
    if (searchTerm) {
      filteredProperties = this.currentProperties.filter(prop => 
        prop.key.toLowerCase().includes(searchTerm) ||
        String(prop.value).toLowerCase().includes(searchTerm)
      );
    }

    // Group by category
    const grouped = this.groupPropertiesByCategory(filteredProperties);
    
    this.propertyContent.innerHTML = '';
    
    Object.entries(grouped).forEach(([category, properties]) => {
      const categoryElement = this.createCategoryElement(category, properties);
      this.propertyContent.appendChild(categoryElement);
    });
  }

  private renderEmptyState(): void {
    this.propertyContent.innerHTML = `
      <div class="empty-state">
        <p>No element selected</p>
        <p class="empty-state-hint">Double-click on a node or edge to edit properties</p>
      </div>
    `;
  }

  private groupPropertiesByCategory(properties: PropertyItem[]): Record<string, PropertyItem[]> {
    return properties.reduce((groups, prop) => {
      const category = prop.category || 'Basic Properties';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(prop);
      return groups;
    }, {} as Record<string, PropertyItem[]>);
  }

  private createCategoryElement(category: string, properties: PropertyItem[]): HTMLElement {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'property-category';
    
    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `
      <h4 class="category-title">${category}</h4>
      <span class="category-count">(${properties.length})</span>
    `;
    
    const content = document.createElement('div');
    content.className = 'category-content';
    
    properties.forEach(prop => {
      const propElement = this.createPropertyElement(prop);
      content.appendChild(propElement);
    });
    
    categoryDiv.appendChild(header);
    categoryDiv.appendChild(content);
    
    return categoryDiv;
  }

  private createPropertyElement(property: PropertyItem): HTMLElement {
    const propDiv = document.createElement('div');
    propDiv.className = 'property-item';
    
    const label = document.createElement('label');
    label.className = 'property-label';
    label.textContent = property.key;
    
    const input = this.createPropertyInput(property);
    
    propDiv.appendChild(label);
    propDiv.appendChild(input);
    
    return propDiv;
  }

  private createPropertyInput(property: PropertyItem): HTMLElement {
    switch (property.type) {
      case 'text':
        return this.createTextInput(property);
      case 'number':
        return this.createNumberInput(property);
      case 'boolean':
        return this.createBooleanInput(property);
      case 'select':
        return this.createSelectInput(property);
      case 'array':
        return this.createArrayInput(property);
      default:
        return this.createTextInput(property);
    }
  }

  private createTextInput(property: PropertyItem): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = String(property.value || '');
    input.className = 'property-input';
    input.readOnly = property.readonly || false;
    
    input.addEventListener('change', () => {
      this.updatePropertyValue(property.key, input.value);
    });
    
    return input;
  }

  private createNumberInput(property: PropertyItem): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = String(property.value || 0);
    input.className = 'property-input';
    input.readOnly = property.readonly || false;
    
    input.addEventListener('change', () => {
      this.updatePropertyValue(property.key, parseFloat(input.value) || 0);
    });
    
    return input;
  }

  private createBooleanInput(property: PropertyItem): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = Boolean(property.value);
    input.className = 'property-input property-checkbox';
    input.disabled = property.readonly || false;
    
    input.addEventListener('change', () => {
      this.updatePropertyValue(property.key, input.checked);
    });
    
    return input;
  }

  private createSelectInput(property: PropertyItem): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = 'property-input';
    select.disabled = property.readonly || false;
    
    property.options?.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      optionElement.selected = property.value === option;
      select.appendChild(optionElement);
    });
    
    select.addEventListener('change', () => {
      this.updatePropertyValue(property.key, select.value);
    });
    
    return select;
  }

  private createArrayInput(property: PropertyItem): HTMLElement {
    const container = document.createElement('div');
    container.className = 'property-array';
    
    const values = Array.isArray(property.value) ? property.value : [];
    
    values.forEach((value, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'array-item';
      
      const input = document.createElement('input');
      input.type = 'text';
      input.value = String(value);
      input.className = 'property-input';
      
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.className = 'array-remove-btn';
      removeBtn.addEventListener('click', () => {
        values.splice(index, 1);
        this.updatePropertyValue(property.key, values);
        this.renderProperties();
      });
      
      input.addEventListener('change', () => {
        values[index] = input.value;
        this.updatePropertyValue(property.key, values);
      });
      
      itemDiv.appendChild(input);
      if (!property.readonly) {
        itemDiv.appendChild(removeBtn);
      }
      container.appendChild(itemDiv);
    });
    
    // Add button
    if (!property.readonly) {
      const addBtn = document.createElement('button');
      addBtn.textContent = '+ Add Item';
      addBtn.className = 'array-add-btn';
      addBtn.addEventListener('click', () => {
        values.push('');
        this.updatePropertyValue(property.key, values);
        this.renderProperties();
      });
      container.appendChild(addBtn);
    }
    
    return container;
  }

  private updatePropertyValue(key: string, value: any): void {
    // Update local property
    const property = this.currentProperties.find(p => p.key === key);
    if (property) {
      property.value = value;
    }
    
    // Emit event for external listeners
    const event = new CustomEvent('property-changed', {
      detail: {
        elementId: this.state.selectedElementId,
        elementType: this.state.selectedElementType,
        propertyKey: key,
        propertyValue: value
      }
    });
    window.dispatchEvent(event);
    
    console.log('🏷️ Property updated:', key, '=', value);
  }

  // === Search functionality ===

  private handleSearch(): void {
    this.renderProperties();
  }

  private clearSearch(): void {
    this.searchInput.value = '';
    this.renderProperties();
  }

  // === State persistence ===

  private savePanelState(): void {
    const stateToSave = {
      isCollapsed: this.state.isCollapsed,
      width: this.state.width,
      activeTab: this.state.activeTab
    };
    localStorage.setItem('rightPanelState', JSON.stringify(stateToSave));
  }

  private loadPanelState(): void {
    try {
      const saved = localStorage.getItem('rightPanelState');
      if (saved) {
        const state = JSON.parse(saved);
        this.state.isCollapsed = state.isCollapsed ?? true;
        this.state.width = state.width ?? 400;
        this.state.activeTab = state.activeTab ?? 'properties';
        
        // Apply loaded state
        this.setWidth(this.state.width);
        this.setActiveTab(this.state.activeTab);
      }
    } catch (error) {
      console.warn('Failed to load right panel state:', error);
    }
  }

  // === Public getters ===

  public getState(): RightPanelState {
    return { ...this.state };
  }

  public isOpen(): boolean {
    return !this.state.isCollapsed;
  }

  public getSelectedElementId(): string | null {
    return this.state.selectedElementId;
  }

  public focusProperty(propertyKey: string): void {
    console.log('🎯 Focusing on property:', propertyKey);
    
    // Find the property element and highlight it
    const propertyElements = this.propertyContent.querySelectorAll('.property-item');
    
    // Remove previous highlights
    propertyElements.forEach(el => el.classList.remove('property-focused'));
    
    // Find and highlight the target property
    for (const element of propertyElements) {
      const label = element.querySelector('.property-label');
      if (label && label.textContent === propertyKey) {
        element.classList.add('property-focused');
        
        // Scroll to the property
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Focus the input if possible
        const input = element.querySelector('.property-input') as HTMLInputElement;
        if (input && !input.readOnly && !input.disabled) {
          setTimeout(() => input.focus(), 300); // Wait for scroll animation
        }
        
        break;
      }
    }
  }

  public setOnStateChange(callback: (state: RightPanelState) => void): void {
    this.onStateChange = callback;
  }

  // === Lifecycle ===

  public destroy(): void {
    // Remove event listeners
    document.removeEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    
    console.log('🗂️ RightPanel destroyed');
  }
}