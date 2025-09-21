// src/components/PropertyDrawer.ts

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { 
  DrawerState,
  DrawerTab,
  DrawerPosition,
  DrawerPropertyDisplay,
  DrawerAppearance,
  DrawerElementInfo,
  DRAWER_SIZES
} from '../types/drawerTypes';
import type { PropertyValue } from '../types/propertyTypes';
import { useDrawerState } from '../stores/drawerState';
import { useDrawerActions } from '../composables/useDrawerActions';

/**
 * Property Drawer Component
 * Main UI component สำหรับแสดง Property Drawer ด้านขวาของหน้าจอ
 * ออกแบบตาม Laws of UX:
 * - Miller's Law: จัดกลุ่ม properties ไม่เกิน 7 รายการต่อ section
 * - Aesthetic-Usability Effect: ออกแบบให้สวยงามเพื่อเพิ่มการรับรู้ว่าใช้งานง่าย
 * - Doherty Threshold: ตอบสนองเร็วกว่า 400ms
 * - Fitts's Law: ปุ่มและ interactive elements ขนาดเหมาะสม
 */

export interface PropertyDrawerOptions {
  position?: DrawerPosition;
  width?: number;
  height?: number;
  theme?: 'light' | 'dark' | 'auto';
  enableAnimation?: boolean;
  enableKeyboardShortcuts?: boolean;
  enableSearch?: boolean;
  enableGrouping?: boolean;
  responsiveBreakpoints?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

export class PropertyDrawer extends Container {
  private options: Required<PropertyDrawerOptions>;
  private drawerState: ReturnType<typeof useDrawerState.getState>;
  private drawerActions: ReturnType<typeof useDrawerActions>;
  
  // UI Components
  private background: Graphics;
  private backdrop: Graphics;
  private header: Container;
  private content: Container;
  private footer: Container;
  private tabs: Container;
  private searchContainer: Container;
  private propertyList: Container;
  private scrollContainer: Container;
  
  // Header components
  private titleText: Text;
  private closeButton: Container;
  private elementInfoContainer: Container;
  
  // Tab components
  private tabButtons: Map<DrawerTab, Container> = new Map();
  private activeTabIndicator: Graphics;
  
  // Search components
  private searchInput: Container;
  private searchText: Text;
  private clearSearchButton: Container;
  
  // Animation
  private animationId: number | null = null;
  private isAnimating: boolean = false;
  
  // State
  private currentState: DrawerState;
  private eventCleanups: (() => void)[] = [];

  constructor(options: PropertyDrawerOptions = {}) {
    super();

    // กำหนดค่า default options
    this.options = {
      position: 'right',
      width: DRAWER_SIZES.MEDIUM,
      height: 600,
      theme: 'auto',
      enableAnimation: true,
      enableKeyboardShortcuts: true,
      enableSearch: true,
      enableGrouping: true,
      responsiveBreakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200
      },
      ...options
    };

    // Initialize state และ actions
    this.drawerState = useDrawerState.getState();
    this.drawerActions = useDrawerActions();
    this.currentState = this.drawerState;

    // สร้าง UI components
    this.createComponents();
    this.setupLayout();
    this.setupEventListeners();
    
    // Initial render
    this.updateFromState();

    // เริ่มต้น hidden
    this.visible = false;

    console.log('🗂️ สร้าง PropertyDrawer:', {
      position: this.options.position,
      width: this.options.width,
      theme: this.options.theme
    });
  }

  /**
   * สร้าง UI components ทั้งหมด
   */
  private createComponents(): void {
    // Background และ backdrop
    this.backdrop = new Graphics();
    this.background = new Graphics();
    
    // Main containers
    this.header = new Container();
    this.content = new Container();
    this.footer = new Container();
    
    // Header components
    this.titleText = new Text('Properties', this.createHeaderTextStyle());
    this.closeButton = this.createCloseButton();
    this.elementInfoContainer = new Container();
    
    // Tabs
    this.tabs = new Container();
    this.activeTabIndicator = new Graphics();
    
    // Search
    this.searchContainer = new Container();
    this.searchInput = this.createSearchInput();
    this.searchText = new Text('Search properties...', this.createSearchTextStyle());
    this.clearSearchButton = this.createClearSearchButton();
    
    // Content
    this.scrollContainer = new Container();
    this.propertyList = new Container();

    // Add to hierarchy
    this.addChild(this.backdrop);
    this.addChild(this.background);
    this.addChild(this.header);
    this.addChild(this.content);
    this.addChild(this.footer);
    
    // Header hierarchy
    this.header.addChild(this.titleText);
    this.header.addChild(this.closeButton);
    this.header.addChild(this.elementInfoContainer);
    this.header.addChild(this.tabs);
    this.header.addChild(this.activeTabIndicator);
    
    // Search hierarchy
    if (this.options.enableSearch) {
      this.header.addChild(this.searchContainer);
      this.searchContainer.addChild(this.searchInput);
      this.searchContainer.addChild(this.searchText);
      this.searchContainer.addChild(this.clearSearchButton);
    }
    
    // Content hierarchy
    this.content.addChild(this.scrollContainer);
    this.scrollContainer.addChild(this.propertyList);
  }

  /**
   * จัด layout ของ components
   */
  private setupLayout(): void {
    const width = this.options.width;
    const height = this.options.height;
    
    // Background
    this.renderBackground();
    
    // Header layout
    this.layoutHeader();
    
    // Tabs layout
    this.layoutTabs();
    
    // Search layout
    if (this.options.enableSearch) {
      this.layoutSearch();
    }
    
    // Content layout
    this.layoutContent();
    
    // Position drawer
    this.positionDrawer();
  }

  /**
   * วาด background และ backdrop
   */
  private renderBackground(): void {
    const width = this.options.width;
    const height = this.options.height;
    
    // Backdrop (dark overlay) - PixiJS v8 pattern
    this.backdrop.clear();
    this.backdrop.fill({ color: 0x000000, alpha: 0.3 });
    this.backdrop.rect(-2000, -2000, 4000, 4000);
    this.backdrop.fill();
    this.backdrop.eventMode = 'static';
    this.backdrop.cursor = 'default';
    
    // Main background - PixiJS v8 pattern
    this.background.clear();
    
    // Shadow effect first
    this.background.fill({ color: 0x000000, alpha: 0.1 });
    this.background.roundRect(4, 4, width, height, 8);
    this.background.fill();
    
    // Main background on top
    this.background.fill({ color: 0xffffff });
    this.background.roundRect(0, 0, width, height, 8);
    this.background.fill();
    this.background.stroke({ width: 1, color: 0xe2e8f0 });
  }

  /**
   * จัด layout header
   */
  private layoutHeader(): void {
    const headerHeight = 60;
    const padding = 16;
    
    // Title
    this.titleText.x = padding;
    this.titleText.y = 20;
    
    // Close button
    this.closeButton.x = this.options.width - 40;
    this.closeButton.y = 16;
    
    // Element info
    this.elementInfoContainer.x = padding;
    this.elementInfoContainer.y = 45;
  }

  /**
   * จัด layout tabs
   */
  private layoutTabs(): void {
    const tabs: DrawerTab[] = ['properties', 'details', 'actions', 'history'];
    const tabWidth = (this.options.width - 32) / tabs.length;
    const tabHeight = 36;
    const startY = 80;
    
    // สร้าง tab buttons
    tabs.forEach((tab, index) => {
      const tabButton = this.createTabButton(tab, tabWidth, tabHeight);
      tabButton.x = 16 + index * tabWidth;
      tabButton.y = startY;
      
      this.tabs.addChild(tabButton);
      this.tabButtons.set(tab, tabButton);
    });
    
    // Active tab indicator
    this.activeTabIndicator.clear();
    this.activeTabIndicator.fill({ color: 0x667eea });
    this.activeTabIndicator.roundRect(0, 0, tabWidth, 2, 1);
    this.activeTabIndicator.fill();
    this.activeTabIndicator.x = 16;
    this.activeTabIndicator.y = startY + tabHeight - 2;
  }

  /**
   * จัด layout search
   */
  private layoutSearch(): void {
    const searchHeight = 36;
    const startY = 130;
    const padding = 16;
    
    // Search input background
    this.searchInput.x = padding;
    this.searchInput.y = startY;
    
    // Search text
    this.searchText.x = padding + 12;
    this.searchText.y = startY + 10;
    
    // Clear button
    this.clearSearchButton.x = this.options.width - 40;
    this.clearSearchButton.y = startY + 6;
  }

  /**
   * จัด layout content area
   */
  private layoutContent(): void {
    const headerHeight = this.options.enableSearch ? 180 : 140;
    const footerHeight = 0; // No footer for now
    const contentHeight = this.options.height - headerHeight - footerHeight;
    
    this.content.y = headerHeight;
    
    // Scroll container
    this.scrollContainer.x = 0;
    this.scrollContainer.y = 0;
    
    // Setup scrolling area
    const mask = new Graphics();
    mask.fill({ color: 0xffffff });
    mask.rect(0, 0, this.options.width, contentHeight);
    mask.fill();
    this.content.mask = mask;
    this.content.addChild(mask);
  }

  /**
   * สร้าง tab button
   */
  private createTabButton(tab: DrawerTab, width: number, height: number): Container {
    const button = new Container();
    const background = new Graphics();
    const text = new Text(this.getTabDisplayName(tab), this.createTabTextStyle());
    
    // Background
    background.fill({ color: 0xf7fafc });
    background.roundRect(0, 0, width, height, 4);
    background.fill();
    
    // Text
    text.x = width / 2 - text.width / 2;
    text.y = height / 2 - text.height / 2;
    
    button.addChild(background);
    button.addChild(text);
    
    // Interactions
    button.eventMode = 'static';
    button.cursor = 'pointer';
    
    button.on('pointertap', () => {
      this.drawerActions.setTab(tab);
    });
    
    button.on('pointerover', () => {
      if (this.currentState.activeTab !== tab) {
        background.tint = 0xedf2f7;
      }
    });
    
    button.on('pointerout', () => {
      if (this.currentState.activeTab !== tab) {
        background.tint = 0xffffff;
      }
    });
    
    return button;
  }

  /**
   * สร้าง close button
   */
  private createCloseButton(): Container {
    const button = new Container();
    const background = new Graphics();
    const icon = new Text('×', this.createCloseButtonTextStyle());
    
    background.fill({ color: 0xf56565 });
    background.circle(0, 0, 12);
    background.fill();
    
    icon.x = -icon.width / 2;
    icon.y = -icon.height / 2;
    
    button.addChild(background);
    button.addChild(icon);
    
    button.eventMode = 'static';
    button.cursor = 'pointer';
    
    button.on('pointertap', () => {
      this.drawerActions.closeDrawer();
    });
    
    button.on('pointerover', () => {
      background.tint = 0xe53e3e;
    });
    
    button.on('pointerout', () => {
      background.tint = 0xffffff;
    });
    
    return button;
  }

  /**
   * สร้าง search input
   */
  private createSearchInput(): Container {
    const input = new Container();
    const background = new Graphics();
    
    const width = this.options.width - 64;
    const height = 32;
    
    background.fill({ color: 0xf7fafc });
    background.roundRect(0, 0, width, height, 4);
    background.fill();
    background.stroke({ width: 1, color: 0xe2e8f0 });
    
    input.addChild(background);
    
    input.eventMode = 'static';
    input.cursor = 'text';
    
    input.on('pointertap', () => {
      // Focus search (would need HTML input integration)
      const event = new CustomEvent('drawer-focus-search');
      window.dispatchEvent(event);
    });
    
    return input;
  }

  /**
   * สร้าง clear search button
   */
  private createClearSearchButton(): Container {
    const button = new Container();
    const background = new Graphics();
    const icon = new Text('×', this.createSmallTextStyle());
    
    background.fill({ color: 0xc53030 });
    background.circle(0, 0, 10);
    background.fill();
    
    icon.x = -icon.width / 2;
    icon.y = -icon.height / 2;
    
    button.addChild(background);
    button.addChild(icon);
    
    button.eventMode = 'static';
    button.cursor = 'pointer';
    
    button.on('pointertap', () => {
      this.drawerActions.clearSearch();
    });
    
    button.visible = false; // Hide by default
    
    return button;
  }

  /**
   * วาง position ของ drawer
   */
  private positionDrawer(): void {
    const screenWidth = window.innerWidth || 1200;
    const screenHeight = window.innerHeight || 800;
    
    if (this.options.position === 'right') {
      this.x = screenWidth - this.options.width;
    } else {
      this.x = 0;
    }
    
    this.y = 0;
    this.options.height = screenHeight;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Drawer state changes
    const unsubscribe = useDrawerState.subscribe((state) => {
      console.log('🗂️ PropertyDrawer: State changed', {
        isOpen: state.isOpen,
        elementId: state.selectedElementId,
        elementType: state.selectedElementType,
        visible: this.visible
      });
      this.currentState = state;
      this.updateFromState();
    });
    this.eventCleanups.push(unsubscribe);
    
    // Window resize
    const handleResize = () => {
      this.positionDrawer();
      this.setupLayout();
    };
    window.addEventListener('resize', handleResize);
    this.eventCleanups.push(() => window.removeEventListener('resize', handleResize));
    
    // Backdrop click to close
    this.backdrop.on('pointertap', () => {
      this.drawerActions.closeDrawer();
    });
    
    // Drawer events
    const handleDrawerEvent = (event: CustomEvent) => {
      switch (event.type) {
        case 'drawer-opened':
          this.showDrawer();
          break;
        case 'drawer-closed':
          this.hideDrawer();
          break;
        case 'drawer-tab-changed':
          this.updateActiveTab();
          break;
        case 'drawer-search-changed':
          this.updateSearchDisplay();
          break;
      }
    };
    
    ['drawer-opened', 'drawer-closed', 'drawer-tab-changed', 'drawer-search-changed'].forEach(eventType => {
      window.addEventListener(eventType, handleDrawerEvent);
      this.eventCleanups.push(() => window.removeEventListener(eventType, handleDrawerEvent));
    });
  }

  /**
   * อัพเดท UI จาก state changes
   */
  private updateFromState(): void {
    console.log('🗂️ PropertyDrawer: updateFromState called', {
      currentStateIsOpen: this.currentState.isOpen,
      previousVisible: this.visible,
      willBeVisible: this.currentState.isOpen
    });
    
    // Update visibility
    this.visible = this.currentState.isOpen;
    
    // Update title และ element info
    this.updateTitle();
    this.updateElementInfo();
    
    // Update active tab
    this.updateActiveTab();
    
    // Update search
    this.updateSearchDisplay();
    
    // Update properties
    this.updatePropertyList();
    
    // Update size
    if (this.currentState.width !== this.options.width) {
      this.options.width = this.currentState.width;
      this.setupLayout();
    }
  }

  /**
   * แสดง drawer ด้วย animation
   */
  private showDrawer(): void {
    if (!this.options.enableAnimation) {
      this.visible = true;
      return;
    }
    
    this.visible = true;
    this.isAnimating = true;
    
    // Slide in animation
    const startX = this.options.position === 'right' ? 
      window.innerWidth : -this.options.width;
    const endX = this.options.position === 'right' ? 
      window.innerWidth - this.options.width : 0;
    
    this.x = startX;
    
    const duration = 300;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      this.x = startX + (endX - startX) * easeOut;
      
      // Backdrop fade in
      this.backdrop.alpha = progress * 0.3;
      
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
        this.animationId = null;
      }
    };
    
    animate();
  }

  /**
   * ซ่อน drawer ด้วย animation
   */
  private hideDrawer(): void {
    if (!this.options.enableAnimation) {
      this.visible = false;
      return;
    }
    
    this.isAnimating = true;
    
    const startX = this.x;
    const endX = this.options.position === 'right' ? 
      window.innerWidth : -this.options.width;
    
    const duration = 300;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease in cubic
      const easeIn = progress * progress * progress;
      
      this.x = startX + (endX - startX) * easeIn;
      
      // Backdrop fade out
      this.backdrop.alpha = (1 - progress) * 0.3;
      
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.visible = false;
        this.isAnimating = false;
        this.animationId = null;
      }
    };
    
    animate();
  }

  /**
   * อัพเดท title
   */
  private updateTitle(): void {
    if (this.currentState.elementInfo) {
      this.titleText.text = this.currentState.elementInfo.name || 'Properties';
    } else {
      this.titleText.text = 'Properties';
    }
  }

  /**
   * อัพเดท element info
   */
  private updateElementInfo(): void {
    // Clear existing element info
    this.elementInfoContainer.removeChildren();
    
    if (!this.currentState.elementInfo) return;
    
    const info = this.currentState.elementInfo;
    const infoText = new Text(
      `${info.type?.toUpperCase()} • ${info.id}`,
      this.createSmallTextStyle()
    );
    
    this.elementInfoContainer.addChild(infoText);
  }

  /**
   * อัพเดท active tab
   */
  private updateActiveTab(): void {
    const activeTab = this.currentState.activeTab;
    const tabWidth = (this.options.width - 32) / 4;
    
    // Update tab button appearances
    this.tabButtons.forEach((button, tab) => {
      const background = button.children[0] as Graphics;
      const text = button.children[1] as Text;
      
      if (tab === activeTab) {
        background.tint = 0x667eea;
        text.style = this.createActiveTabTextStyle();
      } else {
        background.tint = 0xffffff;
        text.style = this.createTabTextStyle();
      }
    });
    
    // Update indicator position
    const tabIndex = ['properties', 'details', 'actions', 'history'].indexOf(activeTab);
    this.activeTabIndicator.x = 16 + tabIndex * tabWidth;
  }

  /**
   * อัพเดท search display
   */
  private updateSearchDisplay(): void {
    const hasQuery = this.currentState.propertyDisplay.searchQuery.length > 0;
    this.clearSearchButton.visible = hasQuery;
    
    if (hasQuery) {
      this.searchText.text = this.currentState.propertyDisplay.searchQuery;
      this.searchText.style = this.createActiveSearchTextStyle();
    } else {
      this.searchText.text = 'Search properties...';
      this.searchText.style = this.createSearchTextStyle();
    }
  }

  /**
   * อัพเดท property list
   */
  private updatePropertyList(): void {
    // Clear existing properties
    this.propertyList.removeChildren();
    
    if (this.currentState.activeTab !== 'properties') {
      this.renderNonPropertiesTab();
      return;
    }
    
    const properties = this.currentState.filteredProperties;
    
    if (properties.length === 0) {
      this.renderEmptyState();
      return;
    }
    
    // Group by category if enabled
    if (this.currentState.propertyDisplay.groupByCategory) {
      this.renderGroupedProperties(properties);
    } else {
      this.renderFlatProperties(properties);
    }
  }

  /**
   * Render properties แบบจัดกลุ่ม
   */
  private renderGroupedProperties(properties: PropertyValue[]): void {
    // Group properties by category
    const groups = new Map<string, PropertyValue[]>();
    
    properties.forEach(prop => {
      const category = prop.metadata?.category || 'Basic Properties';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(prop);
    });
    
    let currentY = 0;
    
    groups.forEach((groupProperties, category) => {
      // Category header
      const categoryHeader = this.createCategoryHeader(category, groupProperties.length);
      categoryHeader.y = currentY;
      this.propertyList.addChild(categoryHeader);
      currentY += 40;
      
      // Check if category is expanded
      const isExpanded = this.currentState.propertyDisplay.expandedCategories.includes(category);
      
      if (isExpanded) {
        // Render properties in this category
        groupProperties.forEach(property => {
          const propertyItem = this.createPropertyItem(property);
          propertyItem.y = currentY;
          this.propertyList.addChild(propertyItem);
          currentY += 50;
        });
      }
      
      currentY += 8; // Spacing between categories
    });
  }

  /**
   * Render properties แบบเรียงตรง
   */
  private renderFlatProperties(properties: PropertyValue[]): void {
    let currentY = 0;
    
    properties.forEach(property => {
      const propertyItem = this.createPropertyItem(property);
      propertyItem.y = currentY;
      this.propertyList.addChild(propertyItem);
      currentY += 50;
    });
  }

  /**
   * สร้าง category header
   */
  private createCategoryHeader(category: string, count: number): Container {
    const header = new Container();
    const background = new Graphics();
    const text = new Text(`${category} (${count})`, this.createCategoryTextStyle());
    const expandIcon = new Text('▼', this.createSmallTextStyle());
    
    const width = this.options.width - 32;
    
    background.fill({ color: 0xf7fafc });
    background.roundRect(0, 0, width, 32, 4);
    background.fill();
    
    text.x = 12;
    text.y = 8;
    
    expandIcon.x = width - 24;
    expandIcon.y = 8;
    
    header.addChild(background);
    header.addChild(text);
    header.addChild(expandIcon);
    
    // Interactions
    header.eventMode = 'static';
    header.cursor = 'pointer';
    
    header.on('pointertap', () => {
      this.drawerActions.toggleCategory(category);
    });
    
    return header;
  }

  /**
   * สร้าง property item
   */
  private createPropertyItem(property: PropertyValue): Container {
    const item = new Container();
    const background = new Graphics();
    const keyText = new Text(property.key, this.createPropertyKeyTextStyle());
    const valueText = new Text(this.getPropertyDisplayValue(property), this.createPropertyValueTextStyle());
    const typeIcon = new Text(this.getTypeIcon(property.type), this.createSmallTextStyle());
    
    const width = this.options.width - 32;
    const isSelected = this.currentState.propertyDisplay.selectedPropertyIds.includes(property.id);
    
    background.fill({ color: isSelected ? 0xe6fffa : 0xffffff });
    background.roundRect(0, 0, width, 44, 4);
    background.fill();
    background.stroke({ width: 1, color: isSelected ? 0x38b2ac : 0xf0f0f0 });
    
    keyText.x = 12;
    keyText.y = 8;
    
    valueText.x = 12;
    valueText.y = 26;
    
    typeIcon.x = width - 24;
    typeIcon.y = 8;
    
    item.addChild(background);
    item.addChild(keyText);
    item.addChild(valueText);
    item.addChild(typeIcon);
    
    // Interactions
    item.eventMode = 'static';
    item.cursor = 'pointer';
    
    item.on('pointertap', () => {
      this.drawerActions.selectProperty(property.id);
    });
    
    item.on('pointerover', () => {
      if (!isSelected) {
        background.tint = 0xf8f9fa;
      }
    });
    
    item.on('pointerout', () => {
      if (!isSelected) {
        background.tint = 0xffffff;
      }
    });
    
    return item;
  }

  /**
   * Render tab ที่ไม่ใช่ properties
   */
  private renderNonPropertiesTab(): void {
    const message = new Text(
      `${this.currentState.activeTab.charAt(0).toUpperCase() + this.currentState.activeTab.slice(1)} tab content`,
      this.createMessageTextStyle()
    );
    
    message.x = this.options.width / 2 - message.width / 2;
    message.y = 100;
    
    this.propertyList.addChild(message);
  }

  /**
   * Render empty state
   */
  private renderEmptyState(): void {
    const message = new Text(
      'No properties found',
      this.createMessageTextStyle()
    );
    
    message.x = this.options.width / 2 - message.width / 2;
    message.y = 100;
    
    this.propertyList.addChild(message);
  }

  // === Helper Methods ===

  private getTabDisplayName(tab: DrawerTab): string {
    const names = {
      properties: 'Properties',
      details: 'Details',
      actions: 'Actions',
      history: 'History'
    };
    return names[tab];
  }

  private getPropertyDisplayValue(property: PropertyValue): string {
    if (Array.isArray(property.value)) {
      return `[${property.value.length} items]`;
    }
    const str = String(property.value);
    return str.length > 30 ? str.substring(0, 30) + '...' : str;
  }

  private getTypeIcon(type: string): string {
    const icons = {
      text: 'T',
      number: '#',
      boolean: '✓',
      array: '[]',
      object: '{}',
      url: '🔗',
      email: '@'
    };
    return (icons as any)[type] || 'T';
  }

  // === Text Styles ===

  private createHeaderTextStyle(): TextStyle {
    return new TextStyle({
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 18,
      fontWeight: '600',
      fill: 0x2d3748
    });
  }

  private createTabTextStyle(): TextStyle {
    return new TextStyle({
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      fontWeight: '500',
      fill: 0x718096
    });
  }

  private createActiveTabTextStyle(): TextStyle {
    return new TextStyle({
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      fontWeight: '600',
      fill: 0xffffff
    });
  }

  private createSearchTextStyle(): TextStyle {
    return new TextStyle({
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      fill: 0xa0aec0
    });
  }

  private createActiveSearchTextStyle(): TextStyle {
    return new TextStyle({
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      fill: 0x2d3748
    });
  }

  private createCategoryTextStyle(): TextStyle {
    return new TextStyle({
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      fontWeight: '600',
      fill: 0x4a5568
    });
  }

  private createPropertyKeyTextStyle(): TextStyle {
    return new TextStyle({
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 13,
      fontWeight: '500',
      fill: 0x2d3748
    });
  }

  private createPropertyValueTextStyle(): TextStyle {
    return new TextStyle({
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 12,
      fill: 0x718096
    });
  }

  private createMessageTextStyle(): TextStyle {
    return new TextStyle({
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      fill: 0xa0aec0,
      align: 'center'
    });
  }

  private createSmallTextStyle(): TextStyle {
    return new TextStyle({
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 12,
      fill: 0x718096
    });
  }

  private createCloseButtonTextStyle(): TextStyle {
    return new TextStyle({
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xffffff
    });
  }

  /**
   * ล้าง resources และ event listeners
   */
  public destroy(): void {
    // Cancel animations
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Clean up event listeners
    this.eventCleanups.forEach(cleanup => cleanup());
    this.eventCleanups = [];

    // Destroy children
    super.destroy({ children: true });

    console.log('🗑️ ทำลาย PropertyDrawer');
  }
}

/**
 * Helper function สำหรับสร้าง PropertyDrawer
 */
export function createPropertyDrawer(options?: PropertyDrawerOptions): PropertyDrawer {
  return new PropertyDrawer(options);
}