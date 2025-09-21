// src/composables/useDrawerActions.ts

import { Container } from 'pixi.js';
import { useDrawerState } from '../stores/drawerState';
import { usePropertyState } from '../stores/propertyState';
import type { 
  DrawerElementType,
  DrawerTab,
  DrawerPosition,
  DrawerSize,
  DrawerFilterCriteria,
  DrawerSortCriteria,
  DrawerElementInfo,
  DrawerActionResult
} from '../types/drawerTypes';
import type { PropertyValue } from '../types/propertyTypes';
import type { PropertyItem } from '../components/RightPanel';

/**
 * Enhanced Drawer Actions Composable
 * High-level interface สำหรับการจัดการ Property Drawer
 * รองรับ Double-Click Integration และ Node/Edge specific operations
 */
export function useDrawerActions() {
  const drawerStore = useDrawerState.getState();
  const propertyStore = usePropertyState.getState();

  return {
    // === Enhanced Node/Edge Operations ===

    /**
     * เปิด Property Drawer สำหรับ Node (Double-Click Integration)
     * ใช้ HTML-based RightPanel แทน PixiJS PropertyDrawer
     */
    openForNode: (
      container: Container,
      nodeId: string,
      options?: {
        tab?: DrawerTab;
        nodeName?: string;
        autoFocus?: boolean;
        loadExistingProperties?: boolean;
        autoOpen?: boolean;  // ควบคุมว่าจะเปิด panel หรือไม่
        focusProperty?: string;  // property ที่จะ focus
      }
    ): DrawerActionResult => {
      try {
        console.log('🎯 Opening RightPanel for Node:', nodeId, options);

        // ตรวจสอบว่ามี RightPanel instance หรือไม่
        const rightPanel = (window as any).rightPanel;
        if (!rightPanel) {
          console.error('❌ RightPanel not initialized');
          return { success: false, error: 'RightPanel not available' };
        }

        // โหลด existing properties
        let properties: PropertyItem[] = [];
        if (options?.loadExistingProperties !== false) {
          const existingProperties = propertyStore.getProperties(nodeId);
          properties = existingProperties.map(prop => ({
            key: prop.key,
            value: prop.value,
            type: prop.type as 'text' | 'number' | 'boolean' | 'array' | 'select',
            readonly: false,
            category: prop.metadata?.category || 'Basic Properties'
          }));
        }

        // เพิ่ม basic properties ถ้าไม่มี
        if (properties.length === 0) {
          properties = [
            {
              key: 'name',
              value: options?.nodeName || nodeId,
              type: 'text',
              readonly: false,
              category: 'Basic Properties'
            },
            {
              key: 'type',
              value: 'C4 Component',
              type: 'text',
              readonly: false,
              category: 'Basic Properties'
            },
            {
              key: 'description',
              value: '',
              type: 'text',
              readonly: false,
              category: 'Documentation'
            }
          ];
        }

        // เปิด RightPanel with options
        rightPanel.show(nodeId, 'node', properties, {
          autoOpen: options?.autoOpen ?? false,  // ไม่เปิดเป็นค่าเริ่มต้น
          focusProperty: options?.focusProperty
        });
        
        // อัพเดท drawer state สำหรับ compatibility
        drawerStore.openDrawer(container, 'node', nodeId);
        const tab = options?.tab || 'properties';
        drawerStore.setActiveTab(tab);

        // Emit event สำหรับ analytics และ integration
        const event = new CustomEvent('drawer-opened-for-node', {
          detail: { nodeId, tab, nodeName: options?.nodeName }
        });
        window.dispatchEvent(event);

        return { success: true, data: { message: `RightPanel opened for node: ${nodeId}` } };
        
      } catch (error) {
        console.error('❌ Error opening RightPanel for node:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    },

    /**
     * เปิด Property Drawer สำหรับ Edge (Double-Click Integration)
     * ใช้ HTML-based RightPanel แทน PixiJS PropertyDrawer
     */
    openForEdge: (
      container: Container,
      edgeId: string,
      options?: {
        tab?: DrawerTab;
        edgeName?: string;
        autoFocus?: boolean;
        loadExistingProperties?: boolean;
        autoOpen?: boolean;  // ควบคุมว่าจะเปิด panel หรือไม่
        focusProperty?: string;  // property ที่จะ focus
      }
    ): DrawerActionResult => {
      try {
        console.log('🎯 Opening RightPanel for Edge:', edgeId, options);

        // ตรวจสอบว่ามี RightPanel instance หรือไม่
        const rightPanel = (window as any).rightPanel;
        if (!rightPanel) {
          console.error('❌ RightPanel not initialized');
          return { success: false, error: 'RightPanel not available' };
        }

        // โหลด existing properties
        let properties: PropertyItem[] = [];
        if (options?.loadExistingProperties !== false) {
          const existingProperties = propertyStore.getProperties(edgeId);
          properties = existingProperties.map(prop => ({
            key: prop.key,
            value: prop.value,
            type: prop.type as 'text' | 'number' | 'boolean' | 'array' | 'select',
            readonly: false,
            category: prop.metadata?.category || 'Basic Properties'
          }));
        }

        // เพิ่ม basic properties ถ้าไม่มี
        if (properties.length === 0) {
          properties = [
            {
              key: 'label',
              value: options?.edgeName || edgeId,
              type: 'text',
              readonly: false,
              category: 'Basic Properties'
            },
            {
              key: 'type',
              value: 'Relationship',
              type: 'text',
              readonly: false,
              category: 'Basic Properties'
            },
            {
              key: 'description',
              value: '',
              type: 'text',
              readonly: false,
              category: 'Documentation'
            },
            {
              key: 'protocol',
              value: 'HTTP',
              type: 'select',
              options: ['HTTP', 'HTTPS', 'TCP', 'UDP', 'WebSocket', 'gRPC'],
              readonly: false,
              category: 'Technical'
            }
          ];
        }

        // เปิด RightPanel with options
        rightPanel.show(edgeId, 'edge', properties, {
          autoOpen: options?.autoOpen ?? false,  // ไม่เปิดเป็นค่าเริ่มต้น
          focusProperty: options?.focusProperty
        });
        
        // อัพเดท drawer state สำหรับ compatibility
        drawerStore.openDrawer(container, 'edge', edgeId);
        const tab = options?.tab || 'properties';
        drawerStore.setActiveTab(tab);

        // Emit event สำหรับ analytics และ integration
        const event = new CustomEvent('drawer-opened-for-edge', {
          detail: { edgeId, tab, edgeName: options?.edgeName }
        });
        window.dispatchEvent(event);

        return { success: true, data: { message: `RightPanel opened for edge: ${edgeId}` } };
        
      } catch (error) {
        console.error('❌ Error opening RightPanel for edge:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    },

    // === Core Drawer Operations ===

    /**
     * เปิด Property Drawer สำหรับ element
     */
    openDrawer: (
      element: Container,
      elementType: DrawerElementType,
      elementId: string,
      options?: {
        tab?: DrawerTab;
        loadProperties?: boolean;
        elementInfo?: Partial<DrawerElementInfo>;
      }
    ): DrawerActionResult => {
      try {
        // เปิด drawer
        drawerStore.openDrawer(element, elementType, elementId);
        
        // เซ็ต tab ถ้ามีการระบุ
        if (options?.tab) {
          drawerStore.setActiveTab(options.tab);
        }
        
        // โหลด properties ถ้าต้องการ
        if (options?.loadProperties !== false) {
          const properties = propertyStore.getProperties(elementId);
          drawerStore.setProperties(properties);
        }
        
        // เซ็ต element info
        if (options?.elementInfo) {
          const elementInfo: DrawerElementInfo = {
            id: elementId,
            type: elementType,
            name: options.elementInfo.name || `${elementType} ${elementId}`,
            ...options.elementInfo
          };
          drawerStore.updateElementInfo(elementInfo);
        }
        
        return { success: true };
      } catch (error) {
        console.error('Failed to open drawer:', error);
        return { success: false, error: String(error) };
      }
    },

    /**
     * ปิด Property Drawer
     */
    closeDrawer: (): DrawerActionResult => {
      try {
        drawerStore.closeDrawer();
        return { success: true };
      } catch (error) {
        console.error('Failed to close drawer:', error);
        return { success: false, error: String(error) };
      }
    },

    /**
     * สลับสถานะ Drawer (เปิด/ปิด)
     */
    toggleDrawer: (
      element?: Container,
      elementType?: DrawerElementType,
      elementId?: string
    ): DrawerActionResult => {
      try {
        drawerStore.toggleDrawer(element, elementType, elementId);
        return { success: true };
      } catch (error) {
        console.error('Failed to toggle drawer:', error);
        return { success: false, error: String(error) };
      }
    },

    // === Quick Actions ===

    /**
     * เปิด Drawer พร้อม specific property type
     */
    openForProperty: (
      container: Container,
      elementId: string,
      elementType: DrawerElementType,
      propertyKey: string,
      options?: {
        editMode?: boolean;
        highlightProperty?: boolean;
      }
    ): DrawerActionResult => {
      try {
        // เปิด drawer ก่อน
        const actions = useDrawerActions();
        const result = actions.openDrawer(container, elementType, elementId, {
          tab: 'properties'
        });
        
        if (!result.success) return result;
        
        // Focus ไปที่ property ที่ต้องการ
        setTimeout(() => {
          // TODO: Implement highlightProperty in drawerState
          console.log('Highlighting property:', propertyKey);
          
          if (options?.editMode) {
            // TODO: Implement startEditingProperty in drawerState
            console.log('Starting edit mode for property:', propertyKey);
          }
        }, 100);
        
        return { success: true, data: { message: `Focused on property: ${propertyKey}` } };
        
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },


    // === Tab Management ===

    /**
     * เปลี่ยน tab ใน drawer
     */
    setTab: (tab: DrawerTab): DrawerActionResult => {
      try {
        drawerStore.setActiveTab(tab);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * ไปยัง tab ถัดไป
     */
    nextTab: (): DrawerActionResult => {
      try {
        drawerStore.nextTab();
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * กลับไปยัง tab ก่อนหน้า
     */
    previousTab: (): DrawerActionResult => {
      try {
        drawerStore.previousTab();
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    // === Property Management in Drawer ===

    /**
     * รีโหลด properties ใน drawer
     */
    refreshProperties: (): DrawerActionResult => {
      try {
        const selectedElementId = drawerStore.selectedElementId;
        if (!selectedElementId) {
          return { success: false, error: 'No element selected' };
        }

        const properties = propertyStore.getProperties(selectedElementId);
        drawerStore.setProperties(properties);
        
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * เพิ่ม property ผ่าน drawer
     */
    addProperty: (property: Omit<PropertyValue, 'id'>): DrawerActionResult => {
      try {
        const selectedElementId = drawerStore.selectedElementId;
        if (!selectedElementId) {
          return { success: false, error: 'No element selected' };
        }

        const result = propertyStore.addProperty(selectedElementId, property);
        if (result.success) {
          // รีโหลด properties ใน drawer
          const actions = useDrawerActions();
          actions.refreshProperties();
          drawerStore.setUnsavedChanges(true);
        }
        
        return result;
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * อัพเดท property ผ่าน drawer
     */
    updateProperty: (propertyKey: string, newValue: any, newType?: any): DrawerActionResult => {
      try {
        const selectedElementId = drawerStore.selectedElementId;
        if (!selectedElementId) {
          return { success: false, error: 'No element selected' };
        }

        const result = propertyStore.updateProperty(selectedElementId, propertyKey, newValue, newType);
        if (result.success && result.property) {
          // อัพเดท property ใน drawer
          drawerStore.updateProperty(result.property);
          drawerStore.setUnsavedChanges(true);
        }
        
        return result;
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * ลบ property ผ่าน drawer
     */
    removeProperty: (propertyKey: string): DrawerActionResult => {
      try {
        const selectedElementId = drawerStore.selectedElementId;
        if (!selectedElementId) {
          return { success: false, error: 'No element selected' };
        }

        const result = propertyStore.removeProperty(selectedElementId, propertyKey);
        if (result.success) {
          // รีโหลด properties ใน drawer
          const actions = useDrawerActions();
          actions.refreshProperties();
          drawerStore.setUnsavedChanges(true);
        }
        
        return result;
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    // === Search & Filter ===

    /**
     * ค้นหา properties ใน drawer
     */
    searchProperties: (query: string): DrawerActionResult => {
      try {
        drawerStore.setSearchQuery(query);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * ล้างการค้นหา
     */
    clearSearch: (): DrawerActionResult => {
      try {
        drawerStore.clearFilter();
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * กรอง properties ตาม criteria
     */
    filterProperties: (criteria: DrawerFilterCriteria): DrawerActionResult => {
      try {
        drawerStore.applyFilter(criteria);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * เรียงลำดับ properties
     */
    sortProperties: (criteria: DrawerSortCriteria): DrawerActionResult => {
      try {
        drawerStore.setSortCriteria(criteria);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    // === Property Selection ===

    /**
     * เลือก property ใน drawer
     */
    selectProperty: (propertyId: string): DrawerActionResult => {
      try {
        drawerStore.selectProperty(propertyId);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * เลือก properties หลายตัว
     */
    selectMultipleProperties: (propertyIds: string[]): DrawerActionResult => {
      try {
        drawerStore.selectMultipleProperties(propertyIds);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * ล้างการเลือก properties
     */
    clearSelection: (): DrawerActionResult => {
      try {
        drawerStore.clearPropertySelection();
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * เลือก properties ทั้งหมด
     */
    selectAllProperties: (): DrawerActionResult => {
      try {
        const allPropertyIds = drawerStore.filteredProperties.map(p => p.id);
        drawerStore.selectMultipleProperties(allPropertyIds);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    // === Display Settings ===

    /**
     * เปลี่ยนตำแหน่ง drawer
     */
    setPosition: (position: DrawerPosition): DrawerActionResult => {
      try {
        drawerStore.setPosition(position);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * เปลี่ยนขนาด drawer
     */
    setSize: (size: DrawerSize, customWidth?: number): DrawerActionResult => {
      try {
        drawerStore.setSize(size, customWidth);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * เปลี่ยนความกว้าง drawer
     */
    setWidth: (width: number): DrawerActionResult => {
      try {
        drawerStore.setWidth(width);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * สลับการจัดกลุ่มตาม category
     */
    toggleGroupByCategory: (): DrawerActionResult => {
      try {
        drawerStore.toggleGroupByCategory();
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * สลับการแสดง empty properties
     */
    toggleShowEmptyProperties: (): DrawerActionResult => {
      try {
        drawerStore.toggleShowEmptyProperties();
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * ขยาย/ซ่อน category
     */
    toggleCategory: (category: string): DrawerActionResult => {
      try {
        drawerStore.toggleCategory(category);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * ขยายทุก categories
     */
    expandAllCategories: (): DrawerActionResult => {
      try {
        drawerStore.expandAllCategories();
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * ซ่อนทุก categories
     */
    collapseAllCategories: (): DrawerActionResult => {
      try {
        drawerStore.collapseAllCategories();
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    // === Batch Operations ===

    /**
     * ลบ properties ที่เลือกไว้
     */
    deleteSelectedProperties: (): DrawerActionResult => {
      try {
        const selectedElementId = drawerStore.selectedElementId;
        const selectedPropertyIds = drawerStore.propertyDisplay.selectedPropertyIds;
        
        if (!selectedElementId) {
          return { success: false, error: 'No element selected' };
        }
        
        if (selectedPropertyIds.length === 0) {
          return { success: false, error: 'No properties selected' };
        }

        // ลบ properties ทีละตัว
        const results = selectedPropertyIds.map(propertyId => {
          const property = drawerStore.properties.find(p => p.id === propertyId);
          if (property) {
            return propertyStore.removeProperty(selectedElementId, property.key);
          }
          return { success: false, error: `Property with ID ${propertyId} not found` };
        });

        // ตรวจสอบผลลัพธ์
        const failures = results.filter(r => !r.success);
        if (failures.length > 0) {
          return { 
            success: false, 
            error: `Failed to delete ${failures.length} properties`
          };
        }

        // รีโหลด properties และล้างการเลือก
        useDrawerActions().refreshProperties();
        drawerStore.clearPropertySelection();
        drawerStore.setUnsavedChanges(true);

        return { success: true, data: { deletedCount: results.length } };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * Copy properties ที่เลือกไว้
     */
    copySelectedProperties: (): DrawerActionResult => {
      try {
        const selectedProperties = drawerStore.selectedProperties;
        
        if (selectedProperties.length === 0) {
          return { success: false, error: 'No properties selected' };
        }

        // Copy properties to clipboard (as JSON)
        const propertiesData = JSON.stringify(selectedProperties, null, 2);
        
        if (navigator.clipboard) {
          navigator.clipboard.writeText(propertiesData);
        } else {
          // Fallback for older browsers (execCommand is deprecated but still needed for compatibility)
          const textArea = document.createElement('textarea');
          textArea.value = propertiesData;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy'); // eslint-disable-line deprecation/deprecation
          } catch (err) {
            console.warn('Copy fallback failed:', err);
          }
          document.body.removeChild(textArea);
        }

        return { 
          success: true, 
          data: { copiedCount: selectedProperties.length } 
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    // === Import/Export ===

    /**
     * Export properties เป็น JSON
     */
    exportProperties: (selectedOnly: boolean = false): DrawerActionResult => {
      try {
        const selectedElementId = drawerStore.selectedElementId;
        if (!selectedElementId) {
          return { success: false, error: 'No element selected' };
        }

        let properties: PropertyValue[];
        
        if (selectedOnly && drawerStore.selectedProperties.length > 0) {
          properties = drawerStore.selectedProperties;
        } else {
          properties = propertyStore.getProperties(selectedElementId);
        }

        const exportData = {
          elementId: selectedElementId,
          elementType: drawerStore.selectedElementType,
          timestamp: new Date().toISOString(),
          properties
        };

        const jsonData = JSON.stringify(exportData, null, 2);
        
        // Create download
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `properties-${selectedElementId}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { 
          success: true, 
          data: { exportedCount: properties.length } 
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * Import properties จาก JSON
     */
    importProperties: (jsonData: string, mergeStrategy: 'replace' | 'merge' = 'merge'): DrawerActionResult => {
      try {
        const selectedElementId = drawerStore.selectedElementId;
        if (!selectedElementId) {
          return { success: false, error: 'No element selected' };
        }

        const importData = JSON.parse(jsonData);
        
        if (!importData.properties || !Array.isArray(importData.properties)) {
          return { success: false, error: 'Invalid import data format' };
        }

        // Clear existing properties if replace strategy
        if (mergeStrategy === 'replace') {
          const existingProperties = propertyStore.getProperties(selectedElementId);
          existingProperties.forEach(prop => {
            propertyStore.removeProperty(selectedElementId, prop.key);
          });
        }

        // Import properties
        const results = propertyStore.importProperties(selectedElementId, importData.properties);
        const failures = results.filter(r => !r.success);
        
        if (failures.length > 0) {
          return { 
            success: false, 
            error: `Failed to import ${failures.length} properties`
          };
        }

        // รีโหลด properties
        const actions = useDrawerActions();
        actions.refreshProperties();
        drawerStore.setUnsavedChanges(true);

        return { 
          success: true, 
          data: { importedCount: results.length } 
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    // === State Management ===

    /**
     * บันทึกการเปลี่ยนแปลง
     */
    saveChanges: (): DrawerActionResult => {
      try {
        // In this implementation, changes are saved immediately
        // This could trigger a save event or API call
        drawerStore.setUnsavedChanges(false);
        
        const event = new CustomEvent('drawer-changes-saved', {
          detail: {
            elementId: drawerStore.selectedElementId,
            elementType: drawerStore.selectedElementType,
            timestamp: new Date()
          }
        });
        window.dispatchEvent(event);

        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * ยกเลิกการเปลี่ยนแปลง
     */
    discardChanges: (): DrawerActionResult => {
      try {
        // รีโหลด properties จาก store
        const actions = useDrawerActions();
        actions.refreshProperties();
        drawerStore.setUnsavedChanges(false);
        drawerStore.clearPropertySelection();

        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * รีเซ็ต drawer เป็นค่าเริ่มต้น
     */
    resetDrawer: (): DrawerActionResult => {
      try {
        drawerStore.resetToDefaults();
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    // === Utilities ===

    /**
     * ได้สถานะปัจจุบันของ drawer
     */
    getDrawerState: () => {
      return {
        isOpen: drawerStore.isOpen,
        selectedElementId: drawerStore.selectedElementId,
        selectedElementType: drawerStore.selectedElementType,
        activeTab: drawerStore.activeTab,
        propertyCount: drawerStore.properties.length,
        filteredPropertyCount: drawerStore.filteredProperties.length,
        selectedPropertyCount: drawerStore.selectedProperties.length,
        hasUnsavedChanges: drawerStore.hasUnsavedChanges,
        isLoading: drawerStore.isLoading,
        error: drawerStore.error
      };
    },

    /**
     * ตรวจสอบว่า drawer เปิดอยู่หรือไม่
     */
    isOpen: (): boolean => {
      return drawerStore.isOpen;
    },

    /**
     * ได้ element ที่เลือกปัจจุบัน
     */
    getSelectedElement: () => {
      return {
        element: drawerStore.selectedElement,
        elementType: drawerStore.selectedElementType,
        elementId: drawerStore.selectedElementId
      };
    },

    /**
     * ได้ properties ที่กรองแล้ว
     */
    getFilteredProperties: (): PropertyValue[] => {
      return drawerStore.filteredProperties;
    },

    /**
     * ได้ properties ที่เลือกไว้
     */
    getSelectedProperties: (): PropertyValue[] => {
      return drawerStore.selectedProperties;
    }
  };
}

/**
 * Keyboard Shortcuts Hook สำหรับ Drawer
 */
export function useDrawerKeyboardShortcuts() {
  const drawerActions = useDrawerActions();

  const setupKeyboardShortcuts = () => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape - ปิด drawer หรือล้างการเลือก
      if (event.key === 'Escape') {
        if (drawerActions.isOpen()) {
          event.preventDefault();
          drawerActions.closeDrawer();
        }
        return;
      }

      // เฉพาะเมื่อ drawer เปิดอยู่
      if (!drawerActions.isOpen()) return;

      // Tab - เปลี่ยน tab
      if (event.key === 'Tab' && !event.shiftKey && event.ctrlKey) {
        event.preventDefault();
        drawerActions.nextTab();
        return;
      }

      // Shift+Tab - tab ก่อนหน้า
      if (event.key === 'Tab' && event.shiftKey && event.ctrlKey) {
        event.preventDefault();
        drawerActions.previousTab();
        return;
      }

      // Ctrl+F หรือ / - focus search
      if ((event.key === 'f' && event.ctrlKey) || event.key === '/') {
        event.preventDefault();
        // Focus search input (this would need to be implemented in the UI component)
        const event2 = new CustomEvent('drawer-focus-search');
        window.dispatchEvent(event2);
        return;
      }

      // Ctrl+A - select all properties
      if (event.key === 'a' && event.ctrlKey) {
        event.preventDefault();
        drawerActions.selectAllProperties();
        return;
      }

      // Ctrl+S - save changes
      if (event.key === 's' && event.ctrlKey) {
        event.preventDefault();
        drawerActions.saveChanges();
        return;
      }

      // Delete - delete selected properties
      if (event.key === 'Delete') {
        event.preventDefault();
        drawerActions.deleteSelectedProperties();
        return;
      }

      // Ctrl+C - copy selected properties
      if (event.key === 'c' && event.ctrlKey) {
        event.preventDefault();
        drawerActions.copySelectedProperties();
        return;
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  };

  return { setupKeyboardShortcuts };
}

/**
 * Enhanced UX Methods สำหรับ Drawer (ตาม Laws of UX)
 */
export function useDrawerUXEnhancements() {
  const drawerActions = useDrawerActions();

  return {
    /**
     * เปิด drawer แบบ smart - เลือก tab ที่เหมาะสม (Jakob's Law)
     */
    openSmart: (
      container: Container,
      elementType: DrawerElementType,
      elementId: string,
      context?: {
        lastUsedTab?: DrawerTab;
        propertyCount?: number;
        recentActions?: string[];
      }
    ): DrawerActionResult => {
      try {
        // Jakob's Law: ใช้ความคุ้นเคยของผู้ใช้
        let smartTab: DrawerTab = 'properties'; // default
        
        if (context?.lastUsedTab) {
          smartTab = context.lastUsedTab;
        } else if (context?.propertyCount === 0) {
          smartTab = 'properties'; // เริ่มต้นที่ properties ถ้าไม่มี property
        } else if (context?.recentActions?.includes('edit')) {
          smartTab = 'properties'; // ไปที่ properties ถ้าเพิ่งแก้ไข
        }

        return drawerActions.openDrawer(container, elementType, elementId, {
          tab: smartTab,
          loadProperties: true
        });
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * Quick Property Add (Hick's Law - ลดการตัดสินใจ)
     */
    quickAddProperty: (
      key: string,
      value: any,
      type?: string
    ): DrawerActionResult => {
      try {
        const uxHelpers = useDrawerUXEnhancements();
        // Pre-defined property types เพื่อลด choices (Hick's Law)
        const smartType = type || uxHelpers.inferPropertyType(value);
        
        return drawerActions.addProperty({
          key,
          value,
          type: smartType as any, // Type casting for compatibility
          order: Date.now() // Add required order field
        });
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * Fast Search (Doherty Threshold - < 400ms)
     */
    fastSearch: (
      query: string,
      options?: {
        debounceMs?: number;
        includeValues?: boolean;
        caseSensitive?: boolean;
      }
    ): DrawerActionResult => {
      try {
        const config = {
          debounceMs: 150, // < 400ms total response
          includeValues: true,
          caseSensitive: false,
          ...options
        };

        // Performance optimization for Doherty Threshold
        // TODO: Implement searchDebounceTimer in drawerState
        setTimeout(() => {
          drawerActions.searchProperties(query);
        }, config.debounceMs);

        return { success: true, data: { message: 'Search initiated' } };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * Smart Property Suggestions (Aesthetic-Usability Effect)
     */
    getPropertySuggestions: (
      elementType: DrawerElementType,
      existingKeys: string[]
    ): string[] => {
      // Pre-defined suggestions ตาม element type
      const suggestions = {
        node: [
          'name', 'description', 'type', 'technology', 'responsibilities',
          'constraints', 'properties', 'interfaces', 'data'
        ],
        edge: [
          'label', 'description', 'protocol', 'frequency', 'synchronous',
          'format', 'properties', 'constraints'
        ]
      };

      const elementSuggestions = suggestions[elementType as keyof typeof suggestions];
      return elementSuggestions?.filter((s: string) => 
        !existingKeys.includes(s)
      ) || [];
    },

    /**
     * Batch Operations สำหรับ efficiency (Fitts's Law)
     */
    batchEdit: (
      operations: Array<{
        action: 'add' | 'update' | 'remove';
        key: string;
        value?: any;
        type?: string;
      }>
    ): DrawerActionResult => {
      try {
        const results = operations.map(op => {
          switch (op.action) {
            case 'add':
              return drawerActions.addProperty({
                key: op.key,
                value: op.value,
                type: (op.type || 'string') as any,
                order: Date.now()
              });
            case 'update':
              return drawerActions.updateProperty(op.key, op.value, op.type);
            case 'remove':
              return drawerActions.removeProperty(op.key);
            default:
              return { success: false, error: 'Unknown operation' };
          }
        });

        const failures = results.filter(r => !r.success);
        if (failures.length > 0) {
          return {
            success: false,
            error: `${failures.length} operations failed`,
            data: { results }
          };
        }

        return {
          success: true,
          data: { processedCount: operations.length }
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * Performance Monitoring (Doherty Threshold)
     */
    measurePerformance: (
      operationName: string,
      operation: () => DrawerActionResult
    ): DrawerActionResult & { performanceMs?: number } => {
      const startTime = performance.now();
      const result = operation();
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Log warning ถ้า > 400ms (Doherty Threshold)
      if (duration > 400) {
        console.warn(`⚠️ ${operationName} took ${duration.toFixed(2)}ms (> 400ms threshold)`);
      }

      // Analytics event
      const event = new CustomEvent('drawer-performance-measured', {
        detail: {
          operation: operationName,
          duration,
          success: result.success,
          timestamp: new Date()
        }
      });
      window.dispatchEvent(event);

      return {
        ...result,
        performanceMs: duration
      };
    },

    // Helper methods
    inferPropertyType: (value: any): string => {
      if (typeof value === 'boolean') return 'boolean';
      if (typeof value === 'number') return 'number';
      if (Array.isArray(value)) return 'array';
      if (typeof value === 'object') return 'object';
      if (typeof value === 'string') {
        // Smart type inference
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
        if (/^https?:\/\//.test(value)) return 'url';
        if (/^[^@]+@[^@]+\.[^@]+$/.test(value)) return 'email';
      }
      return 'string';
    },

    suggestCategory: (key: string, type: string): string => {
      // Smart category suggestions
      if (['name', 'title', 'label'].includes(key.toLowerCase())) return 'Basic';
      if (['description', 'notes', 'comments'].includes(key.toLowerCase())) return 'Documentation';
      if (['type', 'technology', 'platform'].includes(key.toLowerCase())) return 'Technical';
      if (['constraint', 'requirement', 'rule'].includes(key.toLowerCase())) return 'Constraints';
      if (type === 'url') return 'Links';
      if (type === 'date') return 'Metadata';
      return 'Properties';
    },

    generateDescription: (key: string, type: string): string => {
      // Auto-generate helpful descriptions
      const descriptions: Record<string, string> = {
        name: 'Display name for this element',
        description: 'Detailed description of the element\'s purpose',
        type: 'Element type or classification',
        technology: 'Technology stack or platform used',
        url: 'Related URL or link',
        date: 'Date value in ISO format'
      };
      
      return descriptions[key.toLowerCase()] || `${type} property`;
    }
  };
}

/**
 * Accessibility Enhancements สำหรับ Drawer
 */
export function useDrawerAccessibility() {

  return {
    /**
     * Focus Management (WCAG 2.1)
     */
    manageFocus: {
      trapFocus: () => {
        // Focus trap implementation for drawer
        const event = new CustomEvent('drawer-trap-focus');
        window.dispatchEvent(event);
      },
      
      restoreFocus: () => {
        // Restore focus to previous element
        const event = new CustomEvent('drawer-restore-focus');
        window.dispatchEvent(event);
      },
      
      announceChanges: (message: string) => {
        // Screen reader announcements
        const event = new CustomEvent('drawer-announce', {
          detail: { message }
        });
        window.dispatchEvent(event);
      }
    },

    /**
     * Keyboard Navigation (WCAG 2.1)
     */
    keyboardNavigation: {
      setupArrowNavigation: () => {
        // Setup arrow key navigation for properties
        const event = new CustomEvent('drawer-setup-arrow-nav');
        window.dispatchEvent(event);
      },
      
      setupTabNavigation: () => {
        // Enhanced tab navigation
        const event = new CustomEvent('drawer-setup-tab-nav');
        window.dispatchEvent(event);
      }
    },

    /**
     * High Contrast & Theming Support
     */
    accessibility: {
      enableHighContrast: () => {
        const event = new CustomEvent('drawer-enable-high-contrast');
        window.dispatchEvent(event);
      },
      
      enableReducedMotion: () => {
        const event = new CustomEvent('drawer-enable-reduced-motion');
        window.dispatchEvent(event);
      },
      
      setFontSize: (size: 'small' | 'medium' | 'large' | 'xl') => {
        const event = new CustomEvent('drawer-set-font-size', {
          detail: { size }
        });
        window.dispatchEvent(event);
      }
    }
  };
}