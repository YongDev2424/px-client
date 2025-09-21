// src/utils/arrayPropertyHelpers.ts

import type { 
  PropertyValue, 
  PropertyValueType,
  PropertyValidationResult 
} from '../types/propertyTypes';

/**
 * Array Property Helper Functions
 * ฟังก์ชันเฉพาะสำหรับการจัดการ Array Properties
 */

// === Array Property Type Guards ===

/**
 * ตรวจสอบว่า property เป็น array type หรือไม่
 */
export function isArrayProperty(property: PropertyValue): boolean {
  return ['array', 'tags', 'multi-select'].includes(property.type) && Array.isArray(property.value);
}

/**
 * ตรวจสอบว่า value เป็น array ที่ valid หรือไม่
 */
export function isValidArrayValue(value: PropertyValueType): value is Array<any> {
  return Array.isArray(value);
}

// === Array Item Operations ===

/**
 * เพิ่มรายการเข้าใน array property
 */
export function addArrayItem(
  property: PropertyValue,
  item: any,
  index?: number
): { success: boolean; newArray?: any[]; error?: string } {
  if (!isArrayProperty(property)) {
    return { success: false, error: 'Property is not an array type' };
  }

  const currentArray = property.value as Array<any>;
  const newArray = [...currentArray];

  // Validate item type consistency
  if (currentArray.length > 0) {
    const existingItemType = typeof currentArray[0];
    const newItemType = typeof item;
    
    if (existingItemType !== newItemType && existingItemType !== 'undefined') {
      return { 
        success: false, 
        error: `Item type mismatch: expected ${existingItemType}, got ${newItemType}` 
      };
    }
  }

  // Check for duplicates in tags
  if (property.type === 'tags' && currentArray.includes(item)) {
    return { success: false, error: 'Tag already exists' };
  }

  // Check array size limits
  const maxItems = property.metadata?.validation?.arrayMaxItems;
  if (maxItems && currentArray.length >= maxItems) {
    return { success: false, error: `Maximum ${maxItems} items allowed` };
  }

  // Add item at specified index or at the end
  if (index !== undefined && index >= 0 && index <= currentArray.length) {
    newArray.splice(index, 0, item);
  } else {
    newArray.push(item);
  }

  return { success: true, newArray };
}

/**
 * ลบรายการออกจาก array property
 */
export function removeArrayItem(
  property: PropertyValue,
  index: number
): { success: boolean; newArray?: any[]; error?: string } {
  if (!isArrayProperty(property)) {
    return { success: false, error: 'Property is not an array type' };
  }

  const currentArray = property.value as Array<any>;

  if (index < 0 || index >= currentArray.length) {
    return { success: false, error: `Index ${index} is out of bounds` };
  }

  // Check minimum items constraint
  const minItems = property.metadata?.validation?.arrayMinItems;
  if (minItems && currentArray.length <= minItems) {
    return { success: false, error: `Minimum ${minItems} items required` };
  }

  const newArray = [...currentArray];
  newArray.splice(index, 1);

  return { success: true, newArray };
}

/**
 * อัพเดทรายการใน array property
 */
export function updateArrayItem(
  property: PropertyValue,
  index: number,
  newValue: any
): { success: boolean; newArray?: any[]; error?: string } {
  if (!isArrayProperty(property)) {
    return { success: false, error: 'Property is not an array type' };
  }

  const currentArray = property.value as Array<any>;

  if (index < 0 || index >= currentArray.length) {
    return { success: false, error: `Index ${index} is out of bounds` };
  }

  // Validate item type consistency
  if (currentArray.length > 1) {
    const otherItems = currentArray.filter((_, i) => i !== index);
    const existingItemType = typeof otherItems[0];
    const newItemType = typeof newValue;
    
    if (existingItemType !== newItemType && existingItemType !== 'undefined') {
      return { 
        success: false, 
        error: `Item type mismatch: expected ${existingItemType}, got ${newItemType}` 
      };
    }
  }

  // Check for duplicates in tags (excluding the item being updated)
  if (property.type === 'tags') {
    const otherItems = currentArray.filter((_, i) => i !== index);
    if (otherItems.includes(newValue)) {
      return { success: false, error: 'Tag already exists' };
    }
  }

  const newArray = [...currentArray];
  newArray[index] = newValue;

  return { success: true, newArray };
}

/**
 * ย้ายรายการใน array property (reorder)
 */
export function moveArrayItem(
  property: PropertyValue,
  fromIndex: number,
  toIndex: number
): { success: boolean; newArray?: any[]; error?: string } {
  if (!isArrayProperty(property)) {
    return { success: false, error: 'Property is not an array type' };
  }

  const currentArray = property.value as Array<any>;

  if (fromIndex < 0 || fromIndex >= currentArray.length ||
      toIndex < 0 || toIndex >= currentArray.length) {
    return { success: false, error: 'Index out of bounds' };
  }

  if (fromIndex === toIndex) {
    return { success: true, newArray: [...currentArray] };
  }

  const newArray = [...currentArray];
  const [movedItem] = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, movedItem);

  return { success: true, newArray };
}

/**
 * จัดเรียงรายการใน array property ใหม่ตาม indices ใหม่
 */
export function reorderArrayItems(
  property: PropertyValue,
  newOrder: number[]
): { success: boolean; newArray?: any[]; error?: string } {
  if (!isArrayProperty(property)) {
    return { success: false, error: 'Property is not an array type' };
  }

  const currentArray = property.value as Array<any>;

  if (newOrder.length !== currentArray.length) {
    return { success: false, error: 'New order array must have same length as current array' };
  }

  // Validate that all indices are present and valid
  const sortedOrder = [...newOrder].sort((a, b) => a - b);
  const expectedOrder = Array.from({ length: currentArray.length }, (_, i) => i);
  
  if (!arraysEqual(sortedOrder, expectedOrder)) {
    return { success: false, error: 'Invalid new order: must contain all indices exactly once' };
  }

  const newArray = newOrder.map(index => currentArray[index]);

  return { success: true, newArray };
}

// === Array Property Queries ===

/**
 * ค้นหารายการใน array property
 */
export function findArrayItems(
  property: PropertyValue,
  searchTerm: string,
  caseSensitive: boolean = false
): { indices: number[]; items: any[] } {
  if (!isArrayProperty(property)) {
    return { indices: [], items: [] };
  }

  const currentArray = property.value as Array<any>;
  const indices: number[] = [];
  const items: any[] = [];

  const searchTermNormalized = caseSensitive ? searchTerm : searchTerm.toLowerCase();

  currentArray.forEach((item, index) => {
    const itemString = String(item);
    const itemNormalized = caseSensitive ? itemString : itemString.toLowerCase();
    
    if (itemNormalized.includes(searchTermNormalized)) {
      indices.push(index);
      items.push(item);
    }
  });

  return { indices, items };
}

/**
 * ตรวจสอบว่ามีรายการนี้อยู่ใน array หรือไม่
 */
export function hasArrayItem(property: PropertyValue, item: any): boolean {
  if (!isArrayProperty(property)) {
    return false;
  }

  const currentArray = property.value as Array<any>;
  return currentArray.includes(item);
}

/**
 * ได้ index ของรายการใน array
 */
export function getArrayItemIndex(property: PropertyValue, item: any): number {
  if (!isArrayProperty(property)) {
    return -1;
  }

  const currentArray = property.value as Array<any>;
  return currentArray.indexOf(item);
}

/**
 * ได้จำนวนรายการใน array
 */
export function getArrayLength(property: PropertyValue): number {
  if (!isArrayProperty(property)) {
    return 0;
  }

  return (property.value as Array<any>).length;
}

/**
 * ตรวจสอบว่า array ว่างหรือไม่
 */
export function isArrayEmpty(property: PropertyValue): boolean {
  return getArrayLength(property) === 0;
}

// === Array Property Validation ===

/**
 * ตรวจสอบความถูกต้องของ array property
 */
export function validateArrayProperty(property: PropertyValue): PropertyValidationResult {
  const errors: any[] = [];

  if (!isArrayProperty(property)) {
    errors.push({
      code: 'NOT_ARRAY',
      message: 'Property is not an array type',
      severity: 'error'
    });
    return { isValid: false, errors };
  }

  const currentArray = property.value as Array<any>;
  const validation = property.metadata?.validation;

  if (validation) {
    // Check minimum items
    if (validation.arrayMinItems && currentArray.length < validation.arrayMinItems) {
      errors.push({
        code: 'MIN_ITEMS',
        message: `Array must have at least ${validation.arrayMinItems} items`,
        severity: 'error'
      });
    }

    // Check maximum items
    if (validation.arrayMaxItems && currentArray.length > validation.arrayMaxItems) {
      errors.push({
        code: 'MAX_ITEMS',
        message: `Array cannot have more than ${validation.arrayMaxItems} items`,
        severity: 'error'
      });
    }

    // Check for required array
    if (validation.required && currentArray.length === 0) {
      errors.push({
        code: 'REQUIRED',
        message: 'Array cannot be empty',
        severity: 'error'
      });
    }
  }

  // Check for duplicates in tags
  if (property.type === 'tags') {
    const duplicates = findDuplicates(currentArray);
    if (duplicates.length > 0) {
      errors.push({
        code: 'DUPLICATES',
        message: `Duplicate tags found: ${duplicates.join(', ')}`,
        severity: 'warning'
      });
    }
  }

  // Check type consistency
  if (currentArray.length > 1) {
    const typeConsistency = checkArrayTypeConsistency(currentArray);
    if (!typeConsistency.consistent) {
      errors.push({
        code: 'TYPE_INCONSISTENCY',
        message: `Mixed types in array: ${typeConsistency.types.join(', ')}`,
        severity: 'warning'
      });
    }
  }

  return { isValid: errors.length === 0, errors };
}

// === Array Property Sorting ===

/**
 * จัดเรียง array property
 */
export function sortArrayProperty(
  property: PropertyValue,
  direction: 'asc' | 'desc' = 'asc',
  sortBy?: 'value' | 'length' | 'type'
): { success: boolean; newArray?: any[]; error?: string } {
  if (!isArrayProperty(property)) {
    return { success: false, error: 'Property is not an array type' };
  }

  const currentArray = property.value as Array<any>;
  const newArray = [...currentArray];

  try {
    newArray.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'length':
          comparison = String(a).length - String(b).length;
          break;
        case 'type':
          comparison = typeof a < typeof b ? -1 : typeof a > typeof b ? 1 : 0;
          break;
        case 'value':
        default:
          // Handle different types
          if (typeof a === typeof b) {
            if (typeof a === 'string') {
              comparison = a.localeCompare(b);
            } else if (typeof a === 'number') {
              comparison = a - b;
            } else {
              comparison = String(a).localeCompare(String(b));
            }
          } else {
            comparison = String(a).localeCompare(String(b));
          }
          break;
      }

      return direction === 'desc' ? -comparison : comparison;
    });

    return { success: true, newArray };
  } catch (error) {
    return { success: false, error: `Sorting failed: ${error}` };
  }
}

// === Array Property Filtering ===

/**
 * Filter array property ตาม criteria
 */
export function filterArrayProperty(
  property: PropertyValue,
  filterFn: (item: any, index: number) => boolean
): { success: boolean; newArray?: any[]; error?: string } {
  if (!isArrayProperty(property)) {
    return { success: false, error: 'Property is not an array type' };
  }

  const currentArray = property.value as Array<any>;
  
  try {
    const newArray = currentArray.filter(filterFn);
    return { success: true, newArray };
  } catch (error) {
    return { success: false, error: `Filtering failed: ${error}` };
  }
}

/**
 * Filter array property ตาม value
 */
export function filterArrayByValue(
  property: PropertyValue,
  filterValue: any,
  exact: boolean = true
): { success: boolean; newArray?: any[]; error?: string } {
  return filterArrayProperty(property, (item) => {
    if (exact) {
      return item === filterValue;
    } else {
      return String(item).toLowerCase().includes(String(filterValue).toLowerCase());
    }
  });
}

// === Array Property Statistics ===

/**
 * ได้สถิติของ array property
 */
export function getArrayPropertyStats(property: PropertyValue): {
  length: number;
  types: { [type: string]: number };
  uniqueValues: number;
  hasEmptyValues: boolean;
  hasDuplicates: boolean;
} {
  if (!isArrayProperty(property)) {
    return {
      length: 0,
      types: {},
      uniqueValues: 0,
      hasEmptyValues: false,
      hasDuplicates: false
    };
  }

  const currentArray = property.value as Array<any>;
  const types: { [type: string]: number } = {};
  const uniqueValues = new Set();
  let hasEmptyValues = false;

  currentArray.forEach(item => {
    const type = typeof item;
    types[type] = (types[type] || 0) + 1;
    uniqueValues.add(item);
    
    if (item === null || item === undefined || item === '') {
      hasEmptyValues = true;
    }
  });

  return {
    length: currentArray.length,
    types,
    uniqueValues: uniqueValues.size,
    hasEmptyValues,
    hasDuplicates: uniqueValues.size < currentArray.length
  };
}

// === Helper Utility Functions ===

/**
 * ตรวจสอบว่า arrays เท่ากันหรือไม่
 */
function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}

/**
 * หา duplicates ใน array
 */
function findDuplicates(array: any[]): any[] {
  const seen = new Set();
  const duplicates = new Set();
  
  array.forEach(item => {
    if (seen.has(item)) {
      duplicates.add(item);
    }
    seen.add(item);
  });
  
  return Array.from(duplicates);
}

/**
 * ตรวจสอบความสอดคล้องของ type ใน array
 */
function checkArrayTypeConsistency(array: any[]): { consistent: boolean; types: string[] } {
  const types = new Set(array.map(item => typeof item));
  return {
    consistent: types.size <= 1,
    types: Array.from(types)
  };
}

// === Array Property Templates ===

/**
 * สร้าง array property สำหรับ tags ที่ใช้บ่อย
 */
export function createCommonTagsArray(): any[] {
  return ['frontend', 'backend', 'database', 'api', 'service', 'component'];
}

/**
 * สร้าง array property สำหรับ protocols
 */
export function createCommonProtocolsArray(): string[] {
  return ['HTTP', 'HTTPS', 'WebSocket', 'gRPC', 'REST', 'GraphQL'];
}

/**
 * สร้าง array property สำหรับ HTTP methods
 */
export function createHttpMethodsArray(): string[] {
  return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
}

/**
 * สร้าง array property สำหรับสีที่ใช้บ่อย
 */
export function createCommonColorsArray(): string[] {
  return ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#000000', '#FFFFFF'];
}

// === Array Property Bulk Operations ===

/**
 * เพิ่มหลายรายการเข้าใน array property พร้อมกัน
 */
export function addMultipleArrayItems(
  property: PropertyValue,
  items: any[]
): { success: boolean; newArray?: any[]; errors: string[] } {
  if (!isArrayProperty(property)) {
    return { success: false, errors: ['Property is not an array type'] };
  }

  const currentArray = property.value as Array<any>;
  const errors: string[] = [];
  let newArray = [...currentArray];

  items.forEach((item, index) => {
    const result = addArrayItem({ ...property, value: newArray }, item);
    if (result.success && result.newArray) {
      newArray = result.newArray;
    } else {
      errors.push(`Item ${index}: ${result.error}`);
    }
  });

  return {
    success: errors.length === 0,
    newArray: errors.length === 0 ? newArray : undefined,
    errors
  };
}

/**
 * ลบหลายรายการออกจาก array property พร้อมกัน
 */
export function removeMultipleArrayItems(
  property: PropertyValue,
  indices: number[]
): { success: boolean; newArray?: any[]; errors: string[] } {
  if (!isArrayProperty(property)) {
    return { success: false, errors: ['Property is not an array type'] };
  }

  const currentArray = property.value as Array<any>;
  const errors: string[] = [];
  
  // Sort indices in descending order to avoid index shifting issues
  const sortedIndices = [...indices].sort((a, b) => b - a);
  let newArray = [...currentArray];

  sortedIndices.forEach(index => {
    const result = removeArrayItem({ ...property, value: newArray }, index);
    if (result.success && result.newArray) {
      newArray = result.newArray;
    } else {
      errors.push(`Index ${index}: ${result.error}`);
    }
  });

  return {
    success: errors.length === 0,
    newArray: errors.length === 0 ? newArray : undefined,
    errors
  };
}