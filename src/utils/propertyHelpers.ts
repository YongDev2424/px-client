// src/utils/propertyHelpers.ts

import type { 
  PropertyValue, 
  PropertyValueType, 
  PropertyType,
  PropertyMetadata,
  PropertyValidationResult,
  PropertyValidationError,
  PropertySearchCriteria,
  PropertyCategory,
  PropertyTemplate,
  PropertyObjectValue
} from '../types/propertyTypes';
import { PROPERTY_CATEGORIES } from '../types/propertyTypes';

/**
 * Property Helper Functions
 * รวมฟังก์ชันช่วยเหลือสำหรับการจัดการ Properties
 */

// === Property Creation Helpers ===

/**
 * สร้าง Property ใหม่ด้วยค่าเริ่มต้นที่เหมาะสม
 */
export function createProperty(
  key: string,
  value: PropertyValueType,
  type: PropertyType,
  options?: {
    order?: number;
    metadata?: Partial<PropertyMetadata>;
    category?: PropertyCategory;
  }
): Omit<PropertyValue, 'id'> {
  return {
    key,
    value,
    type,
    order: options?.order ?? Date.now(),
    metadata: {
      category: options?.category || PROPERTY_CATEGORIES.BASIC,
      isRequired: false,
      isReadOnly: false,
      isSystem: false,
      createdAt: new Date(),
      ...options?.metadata
    }
  };
}

/**
 * สร้าง Text Property
 */
export function createTextProperty(
  key: string,
  value: string = '',
  options?: {
    placeholder?: string;
    minLength?: number;
    maxLength?: number;
    multiline?: boolean;
    required?: boolean;
  }
): Omit<PropertyValue, 'id'> {
  return createProperty(key, value, 'text', {
    metadata: {
      placeholder: options?.placeholder,
      validation: {
        required: options?.required,
        minLength: options?.minLength,
        maxLength: options?.maxLength
      },
      displayOptions: {
        multiline: options?.multiline,
        inputType: options?.multiline ? 'textarea' : 'text'
      }
    }
  });
}

/**
 * สร้าง Number Property
 */
export function createNumberProperty(
  key: string,
  value: number = 0,
  options?: {
    min?: number;
    max?: number;
    step?: number;
    required?: boolean;
  }
): Omit<PropertyValue, 'id'> {
  return createProperty(key, value, 'number', {
    metadata: {
      validation: {
        required: options?.required,
        min: options?.min,
        max: options?.max
      },
      displayOptions: {
        inputType: 'number'
      }
    }
  });
}

/**
 * สร้าง Boolean Property
 */
export function createBooleanProperty(
  key: string,
  value: boolean = false,
  options?: {
    label?: string;
    required?: boolean;
  }
): Omit<PropertyValue, 'id'> {
  return createProperty(key, value, 'boolean', {
    metadata: {
      validation: {
        required: options?.required
      },
      displayOptions: {
        inputType: 'checkbox',
        showLabel: true,
        labelPosition: 'right'
      }
    }
  });
}

/**
 * สร้าง Array Property
 */
export function createArrayProperty(
  key: string,
  value: Array<string | number | boolean> = [],
  options?: {
    itemType?: 'string' | 'number' | 'boolean';
    minItems?: number;
    maxItems?: number;
    sortable?: boolean;
    searchable?: boolean;
  }
): Omit<PropertyValue, 'id'> {
  return createProperty(key, value, 'array', {
    category: PROPERTY_CATEGORIES.ARRAYS,
    metadata: {
      validation: {
        arrayMinItems: options?.minItems,
        arrayMaxItems: options?.maxItems
      },
      displayOptions: {
        sortable: options?.sortable ?? true,
        searchable: options?.searchable ?? true,
        collapsible: value.length > 5
      }
    }
  });
}

/**
 * สร้าง Tags Property (Array ของ strings)
 */
export function createTagsProperty(
  key: string,
  value: string[] = [],
  options?: {
    predefinedTags?: string[];
    maxTags?: number;
    allowCustomTags?: boolean;
  }
): Omit<PropertyValue, 'id'> {
  return createProperty(key, value, 'tags', {
    category: PROPERTY_CATEGORIES.ARRAYS,
    metadata: {
      validation: {
        arrayMaxItems: options?.maxTags
      },
      displayOptions: {
        searchable: true,
        sortable: false,
        maxDisplayItems: 10
      }
    }
  });
}

/**
 * สร้าง URL Property
 */
export function createUrlProperty(
  key: string,
  value: string = '',
  options?: {
    required?: boolean;
    protocols?: string[];
  }
): Omit<PropertyValue, 'id'> {
  return createProperty(key, value, 'url', {
    metadata: {
      validation: {
        required: options?.required,
        pattern: '^https?://.+', // Basic URL pattern
        customValidator: (val) => {
          if (!val || typeof val !== 'string') return true;
          try {
            new URL(val);
            return true;
          } catch {
            return 'Invalid URL format';
          }
        }
      },
      displayOptions: {
        inputType: 'url'
      }
    }
  });
}

// === Property Type Checking ===

/**
 * ตรวจสอบว่า property เป็น type ที่ระบุหรือไม่
 */
export function isPropertyType<T extends PropertyType>(
  property: PropertyValue,
  type: T
): property is PropertyValue & { type: T } {
  return property.type === type;
}

/**
 * ตรวจสอบว่า property เป็น text type
 */
export const isTextProperty = (property: PropertyValue): property is PropertyValue & { type: 'text' } =>
  isPropertyType(property, 'text');

/**
 * ตรวจสอบว่า property เป็น number type
 */
export const isNumberProperty = (property: PropertyValue): property is PropertyValue & { type: 'number' } =>
  isPropertyType(property, 'number');

/**
 * ตรวจสอบว่า property เป็น boolean type
 */
export const isBooleanProperty = (property: PropertyValue): property is PropertyValue & { type: 'boolean' } =>
  isPropertyType(property, 'boolean');

/**
 * ตรวจสอบว่า property เป็น array type
 */
export const isArrayProperty = (property: PropertyValue): property is PropertyValue & { type: 'array' } =>
  isPropertyType(property, 'array');

/**
 * ตรวจสอบว่า property เป็น object type
 */
export const isObjectProperty = (property: PropertyValue): property is PropertyValue & { type: 'object' } =>
  isPropertyType(property, 'object');

// === Property Value Utilities ===

/**
 * ได้ string representation ของ property value
 */
export function getPropertyDisplayValue(property: PropertyValue): string {
  if (property.value === null || property.value === undefined) {
    return '';
  }
  
  switch (property.type) {
    case 'boolean':
      return property.value ? 'Yes' : 'No';
      
    case 'array':
    case 'tags':
    case 'multi-select':
      if (Array.isArray(property.value)) {
        return property.value.length > 0 ? `${property.value.length} items` : 'Empty';
      }
      return 'Invalid array';
      
    case 'object':
    case 'json':
      if (typeof property.value === 'object') {
        const keys = Object.keys(property.value as object);
        return keys.length > 0 ? `${keys.length} properties` : 'Empty object';
      }
      return 'Invalid object';
      
    case 'url':
      if (typeof property.value === 'string' && property.value.length > 30) {
        return property.value.substring(0, 30) + '...';
      }
      return String(property.value);
      
    default:
      const strValue = String(property.value);
      return strValue.length > 50 ? strValue.substring(0, 50) + '...' : strValue;
  }
}

/**
 * ได้ขนาดของ property value (สำหรับ arrays และ objects)
 */
export function getPropertySize(property: PropertyValue): number {
  switch (property.type) {
    case 'array':
    case 'tags':
    case 'multi-select':
      return Array.isArray(property.value) ? property.value.length : 0;
      
    case 'object':
    case 'json':
      return typeof property.value === 'object' && property.value !== null 
        ? Object.keys(property.value).length 
        : 0;
        
    case 'text':
    case 'url':
    case 'email':
      return typeof property.value === 'string' ? property.value.length : 0;
      
    default:
      return 0;
  }
}

/**
 * ตรวจสอบว่า property มีค่าหรือไม่
 */
export function hasPropertyValue(property: PropertyValue): boolean {
  if (property.value === null || property.value === undefined) {
    return false;
  }
  
  switch (property.type) {
    case 'text':
    case 'url':
    case 'email':
    case 'color':
      return typeof property.value === 'string' && property.value.trim().length > 0;
      
    case 'number':
      return typeof property.value === 'number' && !isNaN(property.value);
      
    case 'boolean':
      return true; // Boolean always has a value (true or false)
      
    case 'array':
    case 'tags':
    case 'multi-select':
      return Array.isArray(property.value) && property.value.length > 0;
      
    case 'object':
    case 'json':
      return typeof property.value === 'object' && 
             property.value !== null && 
             Object.keys(property.value).length > 0;
             
    default:
      return false;
  }
}

// === Property Comparison ===

/**
 * เปรียบเทียบ property values
 */
export function arePropertyValuesEqual(value1: PropertyValueType, value2: PropertyValueType): boolean {
  if (value1 === value2) return true;
  
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) return false;
    return value1.every((item, index) => item === value2[index]);
  }
  
  if (typeof value1 === 'object' && typeof value2 === 'object' && value1 !== null && value2 !== null) {
    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => 
      keys2.includes(key) && 
      arePropertyValuesEqual(
        (value1 as PropertyObjectValue)[key], 
        (value2 as PropertyObjectValue)[key]
      )
    );
  }
  
  return false;
}

/**
 * เปรียบเทียบ properties ทั้งหมด
 */
export function arePropertiesEqual(prop1: PropertyValue, prop2: PropertyValue): boolean {
  return prop1.key === prop2.key &&
         prop1.type === prop2.type &&
         arePropertyValuesEqual(prop1.value, prop2.value);
}

// === Property Sorting ===

/**
 * เปรียบเทียบ properties สำหรับการ sort
 */
export function compareProperties(a: PropertyValue, b: PropertyValue): number {
  // Sort by order first
  if (a.order !== b.order) {
    return a.order - b.order;
  }
  
  // Then by category
  const aCat = a.metadata?.category || '';
  const bCat = b.metadata?.category || '';
  if (aCat !== bCat) {
    return aCat.localeCompare(bCat);
  }
  
  // Finally by key
  return a.key.localeCompare(b.key);
}

/**
 * Sort properties ตาม criteria ที่กำหนด
 */
export function sortProperties(
  properties: PropertyValue[],
  sortBy: 'key' | 'type' | 'order' | 'category' = 'order',
  direction: 'asc' | 'desc' = 'asc'
): PropertyValue[] {
  const sorted = [...properties].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'key':
        comparison = a.key.localeCompare(b.key);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'order':
        comparison = a.order - b.order;
        break;
      case 'category':
        const aCat = a.metadata?.category || '';
        const bCat = b.metadata?.category || '';
        comparison = aCat.localeCompare(bCat);
        break;
    }
    
    return direction === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
}

// === Property Filtering ===

/**
 * Filter properties ตาม criteria
 */
export function filterProperties(
  properties: PropertyValue[],
  criteria: PropertySearchCriteria
): PropertyValue[] {
  return properties.filter(property => {
    // Query search
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      const matchesKey = property.key.toLowerCase().includes(query);
      const matchesValue = getPropertyDisplayValue(property).toLowerCase().includes(query);
      const matchesDescription = property.metadata?.description?.toLowerCase().includes(query) || false;
      
      if (!matchesKey && !matchesValue && !matchesDescription) {
        return false;
      }
    }
    
    // Type filter
    if (criteria.type && property.type !== criteria.type) {
      return false;
    }
    
    // Category filter
    if (criteria.category && property.metadata?.category !== criteria.category) {
      return false;
    }
    
    // Has value filter
    if (criteria.hasValue !== undefined) {
      if (criteria.hasValue !== hasPropertyValue(property)) {
        return false;
      }
    }
    
    // Required filter
    if (criteria.isRequired !== undefined) {
      const isRequired = property.metadata?.isRequired || false;
      if (criteria.isRequired !== isRequired) {
        return false;
      }
    }
    
    // Tags filter
    if (criteria.tags && criteria.tags.length > 0) {
      const propertyTags = property.metadata?.tags || [];
      const hasMatchingTag = criteria.tags.some(tag => propertyTags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    return true;
  });
}

// === Property Grouping ===

/**
 * จัดกลุ่ม properties ตาม category
 */
export function groupPropertiesByCategory(properties: PropertyValue[]): Map<string, PropertyValue[]> {
  const groups = new Map<string, PropertyValue[]>();
  
  properties.forEach(property => {
    const category = property.metadata?.category || PROPERTY_CATEGORIES.BASIC;
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(property);
  });
  
  // Sort properties within each group
  groups.forEach(groupProperties => {
    groupProperties.sort(compareProperties);
  });
  
  return groups;
}

/**
 * จัดกลุ่ม properties ตาม type
 */
export function groupPropertiesByType(properties: PropertyValue[]): Map<PropertyType, PropertyValue[]> {
  const groups = new Map<PropertyType, PropertyValue[]>();
  
  properties.forEach(property => {
    if (!groups.has(property.type)) {
      groups.set(property.type, []);
    }
    groups.get(property.type)!.push(property);
  });
  
  return groups;
}

// === Property Validation Helpers ===

/**
 * ตรวจสอบ property key ว่าซ้ำหรือไม่
 */
export function isDuplicateKey(key: string, properties: PropertyValue[], excludeId?: string): boolean {
  return properties.some(prop => 
    prop.key === key && prop.id !== excludeId
  );
}

/**
 * สร้าง unique key จาก base key
 */
export function generateUniqueKey(baseKey: string, existingKeys: string[]): string {
  if (!existingKeys.includes(baseKey)) {
    return baseKey;
  }
  
  let counter = 1;
  let newKey = `${baseKey}_${counter}`;
  
  while (existingKeys.includes(newKey)) {
    counter++;
    newKey = `${baseKey}_${counter}`;
  }
  
  return newKey;
}

/**
 * Validate property key format
 */
export function isValidPropertyKey(key: string): { valid: boolean; error?: string } {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Key must be a non-empty string' };
  }
  
  if (key.trim() !== key) {
    return { valid: false, error: 'Key cannot have leading or trailing whitespace' };
  }
  
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(key)) {
    return { valid: false, error: 'Key must start with a letter and contain only letters, numbers, underscores, and hyphens' };
  }
  
  if (key.length > 100) {
    return { valid: false, error: 'Key cannot exceed 100 characters' };
  }
  
  return { valid: true };
}

// === Property Templates ===

/**
 * Template ของ properties ที่ใช้บ่อย
 */
export const COMMON_PROPERTY_TEMPLATES: PropertyTemplate[] = [
  {
    name: 'Basic Node Properties',
    description: 'Properties พื้นฐานสำหรับ Node',
    category: PROPERTY_CATEGORIES.BASIC,
    properties: [
      createTextProperty('name', '', { required: true, placeholder: 'Node name' }),
      createTextProperty('description', '', { multiline: true, placeholder: 'Node description' }),
      createTagsProperty('tags', []),
      createBooleanProperty('visible', true)
    ]
  },
  {
    name: 'System Properties',
    description: 'Properties ระบบที่สร้างอัตโนมัติ',
    category: PROPERTY_CATEGORIES.SYSTEM,
    properties: [
      createTextProperty('id', '', { required: true }),
      createTextProperty('type', 'node', { required: true }),
      createNumberProperty('created_timestamp', Date.now()),
      createNumberProperty('updated_timestamp', Date.now())
    ]
  },
  {
    name: 'Connection Properties',
    description: 'Properties สำหรับ Edge/Connection',
    category: PROPERTY_CATEGORIES.BASIC,
    properties: [
      createTextProperty('label', '', { placeholder: 'Connection label' }),
      createTextProperty('protocol', 'HTTP', { placeholder: 'Protocol type' }),
      createArrayProperty('methods', ['GET'], { itemType: 'string' }),
      createBooleanProperty('secure', false)
    ]
  }
];

/**
 * ได้ template ตามชื่อ
 */
export function getPropertyTemplate(name: string): PropertyTemplate | null {
  return COMMON_PROPERTY_TEMPLATES.find(template => template.name === name) || null;
}

/**
 * สร้าง properties จาก template
 */
export function createPropertiesFromTemplate(templateName: string): Omit<PropertyValue, 'id'>[] {
  const template = getPropertyTemplate(templateName);
  return template ? template.properties : [];
}

// === Property Export/Import Helpers ===

/**
 * Export properties เป็น JSON
 */
export function exportPropertiesToJSON(properties: PropertyValue[]): string {
  const exportData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    properties: properties.map(prop => ({
      ...prop,
      metadata: {
        ...prop.metadata,
        // Convert dates to ISO strings for JSON
        createdAt: prop.metadata?.createdAt?.toISOString(),
        updatedAt: prop.metadata?.updatedAt?.toISOString()
      }
    }))
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import properties จาก JSON
 */
export function importPropertiesFromJSON(jsonData: string): PropertyValue[] {
  try {
    const data = JSON.parse(jsonData);
    
    if (!data.properties || !Array.isArray(data.properties)) {
      throw new Error('Invalid JSON format: missing properties array');
    }
    
    return data.properties.map((prop: any) => ({
      ...prop,
      metadata: {
        ...prop.metadata,
        // Convert ISO strings back to dates
        createdAt: prop.metadata?.createdAt ? new Date(prop.metadata.createdAt) : undefined,
        updatedAt: prop.metadata?.updatedAt ? new Date(prop.metadata.updatedAt) : undefined
      }
    }));
  } catch (error) {
    throw new Error(`Failed to import properties: ${error}`);
  }
}

// === Utility Type Guards ===

/**
 * Type guard สำหรับตรวจสอบว่าเป็น PropertyValue object หรือไม่
 */
export function isPropertyValue(obj: any): obj is PropertyValue {
  return obj && 
         typeof obj === 'object' &&
         typeof obj.key === 'string' &&
         typeof obj.type === 'string' &&
         typeof obj.id === 'string' &&
         typeof obj.order === 'number' &&
         obj.value !== undefined;
}