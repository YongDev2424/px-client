// src/composables/usePropertyActions.ts

import { usePropertyState } from '../stores/propertyState';
import type {
  BatchPropertyOperation,
  PropertyOperationResult,
  PropertySearchCriteria,
  PropertyType,
  PropertyValidationResult,
  PropertyValue,
  PropertyValueType
} from '../types/propertyTypes';
import { PROPERTY_CATEGORIES } from '../types/propertyTypes';
import {
  createArrayProperty,
  createBooleanProperty,
  createNumberProperty,
  createProperty,
  createTagsProperty,
  createTextProperty,
  createUrlProperty,
  getPropertyDisplayValue,
  groupPropertiesByCategory,
  hasPropertyValue,
  sortProperties
} from '../utils/propertyHelpers';

/**
 * Property Actions Composable
 * High-level interface สำหรับการจัดการ Properties
 */
export function usePropertyActions(elementId: string) {
  // ได้ property store actions
  const propertyStore = usePropertyState.getState();

  return {
    // === Basic Property Operations ===
    
    /**
     * เพิ่ม Property ใหม่
     */
    addProperty: (property: Omit<PropertyValue, 'id'>): PropertyOperationResult => {
      return propertyStore.addProperty(elementId, property);
    },

    /**
     * อัพเดท Property value
     */
    updateProperty: (propertyKey: string, newValue: PropertyValueType, newType?: PropertyType): PropertyOperationResult => {
      return propertyStore.updateProperty(elementId, propertyKey, newValue, newType);
    },

    /**
     * ลบ Property
     */
    removeProperty: (propertyKey: string): PropertyOperationResult => {
      return propertyStore.removeProperty(elementId, propertyKey);
    },

    /**
     * เปลี่ยนลำดับ Property
     */
    reorderProperty: (propertyKey: string, newOrder: number): PropertyOperationResult => {
      return propertyStore.reorderProperty(elementId, propertyKey, newOrder);
    },

    // === Property Queries ===

    /**
     * ได้ Property ตาม key
     */
    getProperty: (propertyKey: string): PropertyValue | null => {
      return propertyStore.getProperty(elementId, propertyKey);
    },

    /**
     * ได้ Properties ทั้งหมด
     */
    getProperties: (): PropertyValue[] => {
      return propertyStore.getProperties(elementId);
    },

    /**
     * ได้ Properties ตาม category
     */
    getPropertiesByCategory: (category: string): PropertyValue[] => {
      return propertyStore.getPropertiesByCategory(elementId, category);
    },

    /**
     * ได้จำนวน Properties
     */
    getPropertyCount: (): number => {
      return propertyStore.getPropertyCount(elementId);
    },

    /**
     * ตรวจสอบว่ามี Property หรือไม่
     */
    hasProperty: (propertyKey: string): boolean => {
      return propertyStore.hasProperty(elementId, propertyKey);
    },

    /**
     * ตรวจสอบว่ามี Properties หรือไม่
     */
    hasProperties: (): boolean => {
      return propertyStore.hasProperties(elementId);
    },

    // === Property Creation Helpers ===

    /**
     * สร้าง Text Property
     */
    createTextProperty: (key: string, value: string = '', options?: any): PropertyOperationResult => {
      const property = createTextProperty(key, value, options);
      return propertyStore.addProperty(elementId, property);
    },

    /**
     * สร้าง Number Property
     */
    createNumberProperty: (key: string, value: number = 0, options?: any): PropertyOperationResult => {
      const property = createNumberProperty(key, value, options);
      return propertyStore.addProperty(elementId, property);
    },

    /**
     * สร้าง Boolean Property
     */
    createBooleanProperty: (key: string, value: boolean = false, options?: any): PropertyOperationResult => {
      const property = createBooleanProperty(key, value, options);
      return propertyStore.addProperty(elementId, property);
    },

    /**
     * สร้าง Array Property
     */
    createArrayProperty: (key: string, value: any[] = [], options?: any): PropertyOperationResult => {
      const property = createArrayProperty(key, value, options);
      return propertyStore.addProperty(elementId, property);
    },

    /**
     * สร้าง Tags Property
     */
    createTagsProperty: (key: string, value: string[] = [], options?: any): PropertyOperationResult => {
      const property = createTagsProperty(key, value, options);
      return propertyStore.addProperty(elementId, property);
    },

    /**
     * สร้าง URL Property
     */
    createUrlProperty: (key: string, value: string = '', options?: any): PropertyOperationResult => {
      const property = createUrlProperty(key, value, options);
      return propertyStore.addProperty(elementId, property);
    },

    // === Array Property Operations ===

    /**
     * เพิ่มรายการเข้าใน Array Property
     */
    addArrayItem: (propertyKey: string, item: any, index?: number): PropertyOperationResult => {
      return propertyStore.addArrayItem(elementId, propertyKey, item, index);
    },

    /**
     * ลบรายการจาก Array Property
     */
    removeArrayItem: (propertyKey: string, index: number): PropertyOperationResult => {
      return propertyStore.removeArrayItem(elementId, propertyKey, index);
    },

    /**
     * อัพเดทรายการใน Array Property
     */
    updateArrayItem: (propertyKey: string, index: number, newValue: any): PropertyOperationResult => {
      return propertyStore.updateArrayItem(elementId, propertyKey, index, newValue);
    },

    /**
     * จัดเรียงรายการใน Array Property ใหม่
     */
    reorderArrayItems: (propertyKey: string, newOrder: number[]): PropertyOperationResult => {
      return propertyStore.reorderArrayItems(elementId, propertyKey, newOrder);
    },

    /**
     * ได้ความยาวของ Array Property
     */
    getArrayLength: (propertyKey: string): number => {
      return propertyStore.getArrayLength(elementId, propertyKey);
    },

    // === Property Validation ===

    /**
     * ตรวจสอบ Property เดียว
     */
    validateProperty: (property: PropertyValue): PropertyValidationResult => {
      return propertyStore.validateProperty(property);
    },

    /**
     * ตรวจสอบ Properties ทั้งหมด
     */
    validateAllProperties: (): PropertyValidationResult => {
      return propertyStore.validateAllProperties(elementId);
    },

    /**
     * ล้าง validation errors
     */
    clearValidationErrors: (): void => {
      return propertyStore.clearValidationErrors(elementId);
    },

    // === Search & Filter ===

    /**
     * ค้นหา Properties
     */
    searchProperties: (criteria: PropertySearchCriteria): PropertyValue[] => {
      return propertyStore.searchProperties(elementId, criteria);
    },

    /**
     * Filter Properties ตาม type
     */
    filterByType: (type: PropertyType): PropertyValue[] => {
      return propertyStore.filterPropertiesByType(elementId, type);
    },

    /**
     * Filter Properties ตาม category
     */
    filterByCategory: (category: string): PropertyValue[] => {
      return propertyStore.filterPropertiesByCategory(elementId, category);
    },

    // === Batch Operations ===

    /**
     * ทำ Batch Operations หลายอย่างพร้อมกัน
     */
    executeBatchOperation: (operations: BatchPropertyOperation['operations']): PropertyOperationResult[] => {
      const batchOp: BatchPropertyOperation = {
        elementId,
        operations,
        validateBeforeApply: true
      };
      return propertyStore.executeBatchOperation(batchOp);
    },

    /**
     * Import Properties จาก array
     */
    importProperties: (properties: PropertyValue[]): PropertyOperationResult[] => {
      return propertyStore.importProperties(elementId, properties);
    },

    /**
     * Export Properties เป็น array
     */
    exportProperties: (): PropertyValue[] => {
      return propertyStore.exportProperties(elementId);
    },

    /**
     * Clone Properties จาก element อื่น
     */
    clonePropertiesFrom: (sourceElementId: string): PropertyOperationResult[] => {
      return propertyStore.cloneProperties(sourceElementId, elementId);
    },

    // === Property Statistics & Analysis ===

    /**
     * ได้สถิติของ Properties
     */
    getPropertyStats: () => {
      const properties = propertyStore.getProperties(elementId);
      const stats = {
        total: properties.length,
        byType: {} as Record<PropertyType, number>,
        byCategory: {} as Record<string, number>,
        withValues: 0,
        withoutValues: 0,
        required: 0,
        optional: 0,
        arrays: 0,
        totalArrayItems: 0
      };

      properties.forEach(prop => {
        // Count by type
        stats.byType[prop.type] = (stats.byType[prop.type] || 0) + 1;

        // Count by category
        const category = prop.metadata?.category || PROPERTY_CATEGORIES.BASIC;
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

        // Count values
        if (hasPropertyValue(prop)) {
          stats.withValues++;
        } else {
          stats.withoutValues++;
        }

        // Count required
        if (prop.metadata?.isRequired) {
          stats.required++;
        } else {
          stats.optional++;
        }

        // Count arrays
        if (['array', 'tags', 'multi-select'].includes(prop.type) && Array.isArray(prop.value)) {
          stats.arrays++;
          stats.totalArrayItems += prop.value.length;
        }
      });

      return stats;
    },

    /**
     * ได้ Properties ที่จัดกลุ่มตาม category
     */
    getGroupedProperties: () => {
      const properties = propertyStore.getProperties(elementId);
      return groupPropertiesByCategory(properties);
    },

    /**
     * ได้ Properties ที่ sort แล้ว
     */
    getSortedProperties: (sortBy: 'key' | 'type' | 'order' | 'category' = 'order', direction: 'asc' | 'desc' = 'asc') => {
      const properties = propertyStore.getProperties(elementId);
      return sortProperties(properties, sortBy, direction);
    },

    // === Property Display Helpers ===

    /**
     * ได้ display value ของ Property
     */
    getPropertyDisplayValue: (propertyKey: string): string => {
      const property = propertyStore.getProperty(elementId, propertyKey);
      return property ? getPropertyDisplayValue(property) : '';
    },

    /**
     * ได้รายการ Properties สำหรับแสดงใน UI
     */
    getPropertiesForDisplay: (options?: {
      includeEmpty?: boolean;
      groupByCategory?: boolean;
      sortBy?: 'key' | 'type' | 'order' | 'category';
      maxPerCategory?: number;
    }) => {
      let properties = propertyStore.getProperties(elementId);

      // Filter empty properties if requested
      if (options?.includeEmpty === false) {
        properties = properties.filter(hasPropertyValue);
      }

      // Sort properties
      if (options?.sortBy) {
        properties = sortProperties(properties, options.sortBy);
      }

      // Group by category if requested
      if (options?.groupByCategory) {
        const grouped = groupPropertiesByCategory(properties);
        
        // Limit items per category if specified
        if (options.maxPerCategory) {
          grouped.forEach((categoryProperties, category) => {
            if (categoryProperties.length > options.maxPerCategory!) {
              grouped.set(category, categoryProperties.slice(0, options.maxPerCategory));
            }
          });
        }
        
        return grouped;
      }

      return properties;
    },

    // === Property Templates & Quick Actions ===

    /**
     * เพิ่ม Basic Properties Template
     */
    addBasicPropertiesTemplate: (): PropertyOperationResult[] => {
      const basicProperties = [
        createTextProperty('name', '', { required: true, placeholder: 'Element name' }),
        createTextProperty('description', '', { multiline: true, placeholder: 'Element description' }),
        createTagsProperty('tags', []),
        createBooleanProperty('visible', true)
      ];

      return basicProperties.map(prop => propertyStore.addProperty(elementId, prop));
    },

    /**
     * เพิ่ม System Properties Template
     */
    addSystemPropertiesTemplate: (): PropertyOperationResult[] => {
      const now = Date.now();
      const systemProperties = [
        createTextProperty('id', elementId, { required: true }),
        createTextProperty('type', 'element', { required: true }),
        createNumberProperty('created_timestamp', now),
        createNumberProperty('updated_timestamp', now)
      ];

      return systemProperties.map(prop => {
        const propWithMetadata = {
          ...prop,
          metadata: {
            ...prop.metadata,
            category: PROPERTY_CATEGORIES.SYSTEM,
            isSystem: true,
            isReadOnly: true
          }
        };
        return propertyStore.addProperty(elementId, propWithMetadata);
      });
    },

    /**
     * อัพเดท timestamp properties
     */
    updateTimestamps: (): void => {
      const now = Date.now();
      propertyStore.updateProperty(elementId, 'updated_timestamp', now);
    },

    /**
     * Quick add property ด้วย type detection
     */
    quickAddProperty: (key: string, value: any): PropertyOperationResult => {
      let type: PropertyType = 'text';
      
      // Auto-detect type
      if (typeof value === 'number') {
        type = 'number';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (Array.isArray(value)) {
        type = 'array';
      } else if (typeof value === 'object' && value !== null) {
        type = 'object';
      } else if (typeof value === 'string') {
        // Check for URL pattern
        if (value.match(/^https?:\/\/.+/)) {
          type = 'url';
        }
        // Check for email pattern
        else if (value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          type = 'email';
        }
        // Check for color pattern
        else if (value.match(/^#[0-9a-fA-F]{6}$/)) {
          type = 'color';
        }
      }

      const property = createProperty(key, value, type);
      return propertyStore.addProperty(elementId, property);
    },

    // === Cleanup ===

    /**
     * ล้าง Properties ทั้งหมดของ element
     */
    clearAllProperties: (): void => {
      const properties = propertyStore.getProperties(elementId);
      properties.forEach(prop => {
        propertyStore.removeProperty(elementId, prop.key);
      });
    },

    /**
     * ล้าง Properties ที่ไม่มีค่า
     */
    clearEmptyProperties: (): PropertyOperationResult[] => {
      const properties = propertyStore.getProperties(elementId);
      const emptyProperties = properties.filter(prop => !hasPropertyValue(prop));
      
      return emptyProperties.map(prop => 
        propertyStore.removeProperty(elementId, prop.key)
      );
    }
  };
}

/**
 * Global Property Actions (ไม่ขึ้นกับ element)
 */
export function useGlobalPropertyActions() {
  const propertyStore = usePropertyState.getState();

  return {
    /**
     * ได้รายชื่อ elements ทั้งหมด
     */
    getAllElements: (): string[] => {
      return propertyStore.getAllElements();
    },

    /**
     * ได้จำนวน Properties ทั้งหมดในระบบ
     */
    getTotalPropertyCount: (): number => {
      return propertyStore.getTotalPropertyCount();
    },

    /**
     * ล้าง Properties ทั้งหมดในระบบ
     */
    clearAllProperties: (): void => {
      propertyStore.clearAllProperties();
    },

    /**
     * Initialize element ใหม่
     */
    initializeElement: (elementId: string, initialProperties?: PropertyValue[]): void => {
      propertyStore.initializeElement(elementId, initialProperties);
    },

    /**
     * ลบ element และ properties ทั้งหมด
     */
    removeElement: (elementId: string): boolean => {
      return propertyStore.removeElement(elementId);
    },

    /**
     * Clone element และ properties ทั้งหมด
     */
    cloneElement: (sourceElementId: string, targetElementId: string): boolean => {
      return propertyStore.cloneElement(sourceElementId, targetElementId);
    },

    /**
     * ได้สถิติระบบ Properties
     */
    getSystemStats: () => {
      const elements = propertyStore.getAllElements();
      const totalProperties = propertyStore.getTotalPropertyCount();
      
      const stats = {
        totalElements: elements.length,
        totalProperties,
        averagePropertiesPerElement: elements.length > 0 ? totalProperties / elements.length : 0,
        elementsWithProperties: 0,
        elementsWithoutProperties: 0
      };

      elements.forEach(elementId => {
        const propertyCount = propertyStore.getPropertyCount(elementId);
        if (propertyCount > 0) {
          stats.elementsWithProperties++;
        } else {
          stats.elementsWithoutProperties++;
        }
      });

      return stats;
    },

    /**
     * Generate unique property ID
     */
    generatePropertyId: (): string => {
      return propertyStore.generatePropertyId();
    }
  };
}