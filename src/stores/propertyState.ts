// src/stores/propertyState.ts

import { createStore } from 'zustand/vanilla';
import type { 
  PropertyValue, 
  PropertyValueType, 
  PropertyType,
  PropertyChangeEvent,
  PropertyChangeType,
  PropertyValidationResult,
  PropertyOperationResult,
  BatchPropertyOperation,
  PropertyOperation,
  ArrayPropertyOperation,
  PropertyHistoryEntry,
  PropertySearchCriteria
} from '../types/propertyTypes';
import { PROPERTY_CATEGORIES } from '../types/propertyTypes';

/**
 * Property State Store interface
 */
interface PropertyStateStore {
  // === Core State ===
  properties: Map<string, Map<string, PropertyValue>>; // elementId -> properties map
  propertyIdCounter: number;                           // property ID counter
  searchResults: PropertyValue[];                      // search/filter results
  validationErrors: Map<string, string[]>;            // validation errors per element
  history: PropertyHistoryEntry[];                    // property change history
  isLoading: boolean;                                  // loading state
  
  // === Basic Property Operations ===
  addProperty: (elementId: string, property: Omit<PropertyValue, 'id'>) => PropertyOperationResult;
  updateProperty: (elementId: string, propertyKey: string, newValue: PropertyValueType, newType?: PropertyType) => PropertyOperationResult;
  removeProperty: (elementId: string, propertyKey: string) => PropertyOperationResult;
  reorderProperty: (elementId: string, propertyKey: string, newOrder: number) => PropertyOperationResult;
  
  // === Property Queries ===
  getProperty: (elementId: string, propertyKey: string) => PropertyValue | null;
  getProperties: (elementId: string) => PropertyValue[];
  getPropertiesByCategory: (elementId: string, category: string) => PropertyValue[];
  getPropertyCount: (elementId: string) => number;
  hasProperty: (elementId: string, propertyKey: string) => boolean;
  hasProperties: (elementId: string) => boolean;
  
  // === Array Property Operations ===
  addArrayItem: (elementId: string, propertyKey: string, item: any, index?: number) => PropertyOperationResult;
  removeArrayItem: (elementId: string, propertyKey: string, index: number) => PropertyOperationResult;
  updateArrayItem: (elementId: string, propertyKey: string, index: number, newValue: any) => PropertyOperationResult;
  reorderArrayItems: (elementId: string, propertyKey: string, newOrder: number[]) => PropertyOperationResult;
  getArrayLength: (elementId: string, propertyKey: string) => number;
  
  // === Batch Operations ===
  executeBatchOperation: (operation: BatchPropertyOperation) => PropertyOperationResult[];
  importProperties: (elementId: string, properties: PropertyValue[]) => PropertyOperationResult[];
  exportProperties: (elementId: string) => PropertyValue[];
  cloneProperties: (sourceElementId: string, targetElementId: string) => PropertyOperationResult[];
  
  // === Search & Filter ===
  searchProperties: (elementId: string, criteria: PropertySearchCriteria) => PropertyValue[];
  filterPropertiesByType: (elementId: string, type: PropertyType) => PropertyValue[];
  filterPropertiesByCategory: (elementId: string, category: string) => PropertyValue[];
  
  // === Validation ===
  validateProperty: (property: PropertyValue) => PropertyValidationResult;
  validateAllProperties: (elementId: string) => PropertyValidationResult;
  clearValidationErrors: (elementId: string) => void;
  
  // === History & Undo ===
  getPropertyHistory: (elementId: string, propertyKey?: string) => PropertyHistoryEntry[];
  undoLastChange: (elementId: string) => PropertyOperationResult;
  clearHistory: (elementId?: string) => void;
  
  // === Element Management ===
  initializeElement: (elementId: string, initialProperties?: PropertyValue[]) => void;
  removeElement: (elementId: string) => boolean;
  cloneElement: (sourceElementId: string, targetElementId: string) => boolean;
  
  // === Utility Methods ===
  getAllElements: () => string[];
  getTotalPropertyCount: () => number;
  clearAllProperties: () => void;
  generatePropertyId: () => string;
}

/**
 * Helper function to dispatch property change events
 */
function dispatchPropertyChangeEvent(changeEvent: PropertyChangeEvent): void {
  const event = new CustomEvent('property-changed', {
    detail: changeEvent
  });
  window.dispatchEvent(event);
  
  // Dispatch specific event types for better granularity
  const specificEvent = new CustomEvent(`property-${changeEvent.changeType}`, {
    detail: changeEvent
  });
  window.dispatchEvent(specificEvent);
}

/**
 * Helper function to create property history entry
 */
function createHistoryEntry(
  elementId: string,
  changeType: PropertyChangeType,
  propertyKey: string,
  oldValue?: PropertyValueType,
  newValue?: PropertyValueType
): PropertyHistoryEntry {
  return {
    id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    elementId,
    timestamp: new Date(),
    changeType,
    propertyKey,
    oldValue,
    newValue
  };
}

/**
 * Helper function to validate property value based on type
 */
function validatePropertyValue(property: PropertyValue): PropertyValidationResult {
  const errors: any[] = [];
  
  // Basic type validation
  switch (property.type) {
    case 'text':
    case 'url':
    case 'email':
    case 'color':
      if (typeof property.value !== 'string') {
        errors.push({
          code: 'INVALID_TYPE',
          message: `Expected string for ${property.type}, got ${typeof property.value}`,
          severity: 'error'
        });
      }
      break;
      
    case 'number':
      if (typeof property.value !== 'number') {
        errors.push({
          code: 'INVALID_TYPE',
          message: `Expected number, got ${typeof property.value}`,
          severity: 'error'
        });
      }
      break;
      
    case 'boolean':
      if (typeof property.value !== 'boolean') {
        errors.push({
          code: 'INVALID_TYPE',
          message: `Expected boolean, got ${typeof property.value}`,
          severity: 'error'
        });
      }
      break;
      
    case 'array':
    case 'tags':
    case 'multi-select':
      if (!Array.isArray(property.value)) {
        errors.push({
          code: 'INVALID_TYPE',
          message: `Expected array, got ${typeof property.value}`,
          severity: 'error'
        });
      }
      break;
  }
  
  // Metadata validation
  if (property.metadata?.validation) {
    const validation = property.metadata.validation;
    
    // Required validation
    if (validation.required && (property.value === null || property.value === undefined || property.value === '')) {
      errors.push({
        code: 'REQUIRED',
        message: `Property '${property.key}' is required`,
        severity: 'error'
      });
    }
    
    // String length validation
    if (typeof property.value === 'string') {
      if (validation.minLength && property.value.length < validation.minLength) {
        errors.push({
          code: 'MIN_LENGTH',
          message: `Property '${property.key}' must be at least ${validation.minLength} characters`,
          severity: 'error'
        });
      }
      
      if (validation.maxLength && property.value.length > validation.maxLength) {
        errors.push({
          code: 'MAX_LENGTH',
          message: `Property '${property.key}' must not exceed ${validation.maxLength} characters`,
          severity: 'error'
        });
      }
    }
    
    // Number range validation
    if (typeof property.value === 'number') {
      if (validation.min !== undefined && property.value < validation.min) {
        errors.push({
          code: 'MIN_VALUE',
          message: `Property '${property.key}' must be at least ${validation.min}`,
          severity: 'error'
        });
      }
      
      if (validation.max !== undefined && property.value > validation.max) {
        errors.push({
          code: 'MAX_VALUE',
          message: `Property '${property.key}' must not exceed ${validation.max}`,
          severity: 'error'
        });
      }
    }
    
    // Array validation
    if (Array.isArray(property.value)) {
      if (validation.arrayMinItems && property.value.length < validation.arrayMinItems) {
        errors.push({
          code: 'ARRAY_MIN_ITEMS',
          message: `Property '${property.key}' must have at least ${validation.arrayMinItems} items`,
          severity: 'error'
        });
      }
      
      if (validation.arrayMaxItems && property.value.length > validation.arrayMaxItems) {
        errors.push({
          code: 'ARRAY_MAX_ITEMS',
          message: `Property '${property.key}' must not have more than ${validation.arrayMaxItems} items`,
          severity: 'error'
        });
      }
    }
    
    // Custom validation
    if (validation.customValidator) {
      const result = validation.customValidator(property.value);
      if (typeof result === 'string') {
        errors.push({
          code: 'CUSTOM_VALIDATION',
          message: result,
          severity: 'error'
        });
      } else if (result === false) {
        errors.push({
          code: 'CUSTOM_VALIDATION',
          message: `Property '${property.key}' failed custom validation`,
          severity: 'error'
        });
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Property State Store implementation
 */
export const usePropertyState = createStore<PropertyStateStore>((set, get) => ({
  // === Initial State ===
  properties: new Map(),
  propertyIdCounter: 0,
  searchResults: [],
  validationErrors: new Map(),
  history: [],
  isLoading: false,
  
  // === Basic Property Operations ===
  addProperty: (elementId: string, property: Omit<PropertyValue, 'id'>) => {
    const { properties, propertyIdCounter } = get();
    
    // Validate property
    const propertyWithId: PropertyValue = {
      ...property,
      id: `prop_${propertyIdCounter + 1}`
    };
    
    const validation = validatePropertyValue(propertyWithId);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.map(e => e.message).join(', ')
      };
    }
    
    // Check for duplicate key
    const elementProperties = properties.get(elementId);
    if (elementProperties?.has(property.key)) {
      return {
        success: false,
        error: `Property with key '${property.key}' already exists`
      };
    }
    
    // Add property
    set((state) => {
      const newProperties = new Map(state.properties);
      const elementProps = new Map(newProperties.get(elementId) || new Map());
      elementProps.set(property.key, propertyWithId);
      newProperties.set(elementId, elementProps);
      
      return {
        properties: newProperties,
        propertyIdCounter: state.propertyIdCounter + 1
      };
    });
    
    // Create history entry
    const historyEntry = createHistoryEntry(elementId, 'added', property.key, undefined, property.value);
    set((state) => ({
      history: [...state.history, historyEntry]
    }));
    
    // Dispatch event
    dispatchPropertyChangeEvent({
      elementId,
      elementType: 'node', // TODO: determine from element
      propertyId: propertyWithId.id,
      propertyKey: property.key,
      changeType: 'added',
      newValue: property.value,
      timestamp: new Date()
    });
    
    console.log(`➕ เพิ่ม Property "${property.key}" ให้กับ Element:`, elementId);
    return {
      success: true,
      property: propertyWithId
    };
  },
  
  updateProperty: (elementId: string, propertyKey: string, newValue: PropertyValueType, newType?: PropertyType) => {
    const { properties } = get();
    const elementProperties = properties.get(elementId);
    const existingProperty = elementProperties?.get(propertyKey);
    
    if (!existingProperty) {
      return {
        success: false,
        error: `Property '${propertyKey}' not found`
      };
    }
    
    const oldValue = existingProperty.value;
    const updatedProperty: PropertyValue = {
      ...existingProperty,
      value: newValue,
      type: newType || existingProperty.type,
      metadata: {
        ...existingProperty.metadata,
        updatedAt: new Date()
      }
    };
    
    // Validate updated property
    const validation = validatePropertyValue(updatedProperty);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.map(e => e.message).join(', ')
      };
    }
    
    // Update property
    set((state) => {
      const newProperties = new Map(state.properties);
      const elementProps = new Map(newProperties.get(elementId));
      elementProps.set(propertyKey, updatedProperty);
      newProperties.set(elementId, elementProps);
      
      return { properties: newProperties };
    });
    
    // Create history entry
    const historyEntry = createHistoryEntry(elementId, 'updated', propertyKey, oldValue, newValue);
    set((state) => ({
      history: [...state.history, historyEntry]
    }));
    
    // Dispatch event
    dispatchPropertyChangeEvent({
      elementId,
      elementType: 'node', // TODO: determine from element
      propertyId: updatedProperty.id,
      propertyKey,
      changeType: 'updated',
      oldValue,
      newValue,
      timestamp: new Date()
    });
    
    console.log(`🔄 อัปเดต Property "${propertyKey}" ของ Element:`, elementId);
    return {
      success: true,
      property: updatedProperty
    };
  },
  
  removeProperty: (elementId: string, propertyKey: string) => {
    const { properties } = get();
    const elementProperties = properties.get(elementId);
    const property = elementProperties?.get(propertyKey);
    
    if (!property) {
      return {
        success: false,
        error: `Property '${propertyKey}' not found`
      };
    }
    
    // Remove property
    set((state) => {
      const newProperties = new Map(state.properties);
      const elementProps = new Map(newProperties.get(elementId));
      elementProps.delete(propertyKey);
      newProperties.set(elementId, elementProps);
      
      return { properties: newProperties };
    });
    
    // Create history entry
    const historyEntry = createHistoryEntry(elementId, 'removed', propertyKey, property.value, undefined);
    set((state) => ({
      history: [...state.history, historyEntry]
    }));
    
    // Dispatch event
    dispatchPropertyChangeEvent({
      elementId,
      elementType: 'node', // TODO: determine from element
      propertyId: property.id,
      propertyKey,
      changeType: 'removed',
      oldValue: property.value,
      timestamp: new Date()
    });
    
    console.log(`➖ ลบ Property "${propertyKey}" จาก Element:`, elementId);
    return {
      success: true,
      property
    };
  },
  
  reorderProperty: (elementId: string, propertyKey: string, newOrder: number) => {
    const { properties } = get();
    const elementProperties = properties.get(elementId);
    const property = elementProperties?.get(propertyKey);
    
    if (!property) {
      return {
        success: false,
        error: `Property '${propertyKey}' not found`
      };
    }
    
    const oldOrder = property.order;
    const updatedProperty: PropertyValue = {
      ...property,
      order: newOrder
    };
    
    // Update property
    set((state) => {
      const newProperties = new Map(state.properties);
      const elementProps = new Map(newProperties.get(elementId));
      elementProps.set(propertyKey, updatedProperty);
      newProperties.set(elementId, elementProps);
      
      return { properties: newProperties };
    });
    
    // Create history entry
    const historyEntry = createHistoryEntry(elementId, 'reordered', propertyKey, oldOrder, newOrder);
    set((state) => ({
      history: [...state.history, historyEntry]
    }));
    
    console.log(`↕️ เปลี่ยนลำดับ Property "${propertyKey}" ของ Element:`, elementId);
    return {
      success: true,
      property: updatedProperty
    };
  },
  
  // === Property Queries ===
  getProperty: (elementId: string, propertyKey: string) => {
    const { properties } = get();
    return properties.get(elementId)?.get(propertyKey) || null;
  },
  
  getProperties: (elementId: string) => {
    const { properties } = get();
    const elementProperties = properties.get(elementId);
    if (!elementProperties) return [];
    
    return Array.from(elementProperties.values()).sort((a, b) => a.order - b.order);
  },
  
  getPropertiesByCategory: (elementId: string, category: string) => {
    const allProperties = get().getProperties(elementId);
    return allProperties.filter(prop => 
      prop.metadata?.category === category
    );
  },
  
  getPropertyCount: (elementId: string) => {
    const { properties } = get();
    return properties.get(elementId)?.size || 0;
  },
  
  hasProperty: (elementId: string, propertyKey: string) => {
    const { properties } = get();
    return properties.get(elementId)?.has(propertyKey) || false;
  },
  
  hasProperties: (elementId: string) => {
    return get().getPropertyCount(elementId) > 0;
  },
  
  // === Array Property Operations ===
  addArrayItem: (elementId: string, propertyKey: string, item: any, index?: number) => {
    const property = get().getProperty(elementId, propertyKey);
    if (!property) {
      return {
        success: false,
        error: `Property '${propertyKey}' not found`
      };
    }
    
    if (!Array.isArray(property.value)) {
      return {
        success: false,
        error: `Property '${propertyKey}' is not an array`
      };
    }
    
    const newArray = [...property.value];
    if (index !== undefined) {
      newArray.splice(index, 0, item);
    } else {
      newArray.push(item);
    }
    
    return get().updateProperty(elementId, propertyKey, newArray);
  },
  
  removeArrayItem: (elementId: string, propertyKey: string, index: number) => {
    const property = get().getProperty(elementId, propertyKey);
    if (!property) {
      return {
        success: false,
        error: `Property '${propertyKey}' not found`
      };
    }
    
    if (!Array.isArray(property.value)) {
      return {
        success: false,
        error: `Property '${propertyKey}' is not an array`
      };
    }
    
    if (index < 0 || index >= property.value.length) {
      return {
        success: false,
        error: `Index ${index} is out of bounds`
      };
    }
    
    const newArray = [...property.value];
    newArray.splice(index, 1);
    
    return get().updateProperty(elementId, propertyKey, newArray);
  },
  
  updateArrayItem: (elementId: string, propertyKey: string, index: number, newValue: any) => {
    const property = get().getProperty(elementId, propertyKey);
    if (!property) {
      return {
        success: false,
        error: `Property '${propertyKey}' not found`
      };
    }
    
    if (!Array.isArray(property.value)) {
      return {
        success: false,
        error: `Property '${propertyKey}' is not an array`
      };
    }
    
    if (index < 0 || index >= property.value.length) {
      return {
        success: false,
        error: `Index ${index} is out of bounds`
      };
    }
    
    const newArray = [...property.value];
    newArray[index] = newValue;
    
    return get().updateProperty(elementId, propertyKey, newArray);
  },
  
  reorderArrayItems: (elementId: string, propertyKey: string, newOrder: number[]) => {
    const property = get().getProperty(elementId, propertyKey);
    if (!property) {
      return {
        success: false,
        error: `Property '${propertyKey}' not found`
      };
    }
    
    if (!Array.isArray(property.value)) {
      return {
        success: false,
        error: `Property '${propertyKey}' is not an array`
      };
    }
    
    const reorderedArray = newOrder.map(index => property.value[index]);
    return get().updateProperty(elementId, propertyKey, reorderedArray);
  },
  
  getArrayLength: (elementId: string, propertyKey: string) => {
    const property = get().getProperty(elementId, propertyKey);
    if (property && Array.isArray(property.value)) {
      return property.value.length;
    }
    return 0;
  },
  
  // === Batch Operations ===
  executeBatchOperation: (operation: BatchPropertyOperation) => {
    const results: PropertyOperationResult[] = [];
    
    for (const op of operation.operations) {
      let result: PropertyOperationResult;
      
      switch (op.type) {
        case 'add':
          if (op.property) {
            result = get().addProperty(operation.elementId, op.property);
          } else {
            result = { success: false, error: 'Property data required for add operation' };
          }
          break;
          
        case 'update':
          if (op.property && op.propertyKey) {
            result = get().updateProperty(operation.elementId, op.propertyKey, op.property.value, op.property.type);
          } else {
            result = { success: false, error: 'Property data and key required for update operation' };
          }
          break;
          
        case 'remove':
          if (op.propertyKey) {
            result = get().removeProperty(operation.elementId, op.propertyKey);
          } else {
            result = { success: false, error: 'Property key required for remove operation' };
          }
          break;
          
        case 'reorder':
          if (op.propertyKey && op.newOrder !== undefined) {
            result = get().reorderProperty(operation.elementId, op.propertyKey, op.newOrder);
          } else {
            result = { success: false, error: 'Property key and new order required for reorder operation' };
          }
          break;
          
        default:
          result = { success: false, error: `Unknown operation type: ${op.type}` };
      }
      
      results.push(result);
      
      // Stop on first failure if validation is enabled
      if (operation.validateBeforeApply && !result.success) {
        break;
      }
    }
    
    return results;
  },
  
  importProperties: (elementId: string, properties: PropertyValue[]) => {
    const results: PropertyOperationResult[] = [];
    
    for (const property of properties) {
      const result = get().addProperty(elementId, property);
      results.push(result);
    }
    
    return results;
  },
  
  exportProperties: (elementId: string) => {
    return get().getProperties(elementId);
  },
  
  cloneProperties: (sourceElementId: string, targetElementId: string) => {
    const sourceProperties = get().getProperties(sourceElementId);
    const clonedProperties = sourceProperties.map(prop => ({
      ...prop,
      id: '', // Will be generated in addProperty
      metadata: {
        ...prop.metadata,
        createdAt: new Date()
      }
    }));
    
    return get().importProperties(targetElementId, clonedProperties);
  },
  
  // === Search & Filter ===
  searchProperties: (elementId: string, criteria: PropertySearchCriteria) => {
    const allProperties = get().getProperties(elementId);
    
    return allProperties.filter(property => {
      // Query search
      if (criteria.query) {
        const query = criteria.query.toLowerCase();
        const matchesKey = property.key.toLowerCase().includes(query);
        const matchesValue = String(property.value).toLowerCase().includes(query);
        const matchesDescription = property.metadata?.description?.toLowerCase().includes(query);
        
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
        const hasValue = property.value !== null && property.value !== undefined && property.value !== '';
        if (criteria.hasValue !== hasValue) {
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
      
      return true;
    });
  },
  
  filterPropertiesByType: (elementId: string, type: PropertyType) => {
    return get().searchProperties(elementId, { type });
  },
  
  filterPropertiesByCategory: (elementId: string, category: string) => {
    return get().searchProperties(elementId, { category });
  },
  
  // === Validation ===
  validateProperty: (property: PropertyValue) => {
    return validatePropertyValue(property);
  },
  
  validateAllProperties: (elementId: string) => {
    const properties = get().getProperties(elementId);
    const allErrors: any[] = [];
    
    for (const property of properties) {
      const validation = validatePropertyValue(property);
      if (!validation.isValid) {
        allErrors.push(...validation.errors);
      }
    }
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  },
  
  clearValidationErrors: (elementId: string) => {
    set((state) => {
      const newErrors = new Map(state.validationErrors);
      newErrors.delete(elementId);
      return { validationErrors: newErrors };
    });
  },
  
  // === History & Undo ===
  getPropertyHistory: (elementId: string, propertyKey?: string) => {
    const { history } = get();
    return history.filter(entry => {
      if (entry.elementId !== elementId) return false;
      if (propertyKey && entry.propertyKey !== propertyKey) return false;
      return true;
    });
  },
  
  undoLastChange: (elementId: string) => {
    const history = get().getPropertyHistory(elementId);
    if (history.length === 0) {
      return {
        success: false,
        error: 'No changes to undo'
      };
    }
    
    const lastEntry = history[history.length - 1];
    
    // Implement undo logic based on change type
    switch (lastEntry.changeType) {
      case 'added':
        return get().removeProperty(elementId, lastEntry.propertyKey);
        
      case 'removed':
        // Need to recreate the property - this requires storing more data in history
        return {
          success: false,
          error: 'Cannot undo property removal without full property data'
        };
        
      case 'updated':
        if (lastEntry.oldValue !== undefined) {
          return get().updateProperty(elementId, lastEntry.propertyKey, lastEntry.oldValue);
        }
        return {
          success: false,
          error: 'Cannot undo update without old value'
        };
        
      default:
        return {
          success: false,
          error: `Cannot undo change type: ${lastEntry.changeType}`
        };
    }
  },
  
  clearHistory: (elementId?: string) => {
    set((state) => ({
      history: elementId 
        ? state.history.filter(entry => entry.elementId !== elementId)
        : []
    }));
  },
  
  // === Element Management ===
  initializeElement: (elementId: string, initialProperties?: PropertyValue[]) => {
    set((state) => {
      const newProperties = new Map(state.properties);
      const elementProps = new Map();
      
      if (initialProperties) {
        initialProperties.forEach(prop => {
          elementProps.set(prop.key, prop);
        });
      }
      
      newProperties.set(elementId, elementProps);
      return { properties: newProperties };
    });
    
    console.log('🔧 เริ่มต้นสถานะ Properties สำหรับ Element:', elementId);
  },
  
  removeElement: (elementId: string) => {
    const { properties } = get();
    const hasElement = properties.has(elementId);
    
    if (hasElement) {
      set((state) => {
        const newProperties = new Map(state.properties);
        newProperties.delete(elementId);
        
        // Clear validation errors
        const newErrors = new Map(state.validationErrors);
        newErrors.delete(elementId);
        
        return { 
          properties: newProperties,
          validationErrors: newErrors
        };
      });
      
      // Clear history for this element
      get().clearHistory(elementId);
      
      console.log('🗑️ ลบสถานะ Properties ของ Element:', elementId);
    }
    
    return hasElement;
  },
  
  cloneElement: (sourceElementId: string, targetElementId: string) => {
    const sourceProperties = get().getProperties(sourceElementId);
    if (sourceProperties.length === 0) {
      return false;
    }
    
    const clonedProperties = sourceProperties.map(prop => ({
      ...prop,
      id: get().generatePropertyId(),
      metadata: {
        ...prop.metadata,
        createdAt: new Date()
      }
    }));
    
    get().initializeElement(targetElementId, clonedProperties);
    console.log('📋 โคลน Properties จาก Element:', sourceElementId, 'ไป Element:', targetElementId);
    return true;
  },
  
  // === Utility Methods ===
  getAllElements: () => {
    const { properties } = get();
    return Array.from(properties.keys());
  },
  
  getTotalPropertyCount: () => {
    const { properties } = get();
    let total = 0;
    properties.forEach(elementProps => {
      total += elementProps.size;
    });
    return total;
  },
  
  clearAllProperties: () => {
    set({
      properties: new Map(),
      propertyIdCounter: 0,
      searchResults: [],
      validationErrors: new Map(),
      history: [],
      isLoading: false
    });
    console.log('🧹 ล้างสถานะ Properties ทั้งหมด');
  },
  
  generatePropertyId: () => {
    const { propertyIdCounter } = get();
    set((state) => ({
      propertyIdCounter: state.propertyIdCounter + 1
    }));
    return `prop_${propertyIdCounter + 1}`;
  }
}));

// Export convenience functions
export const propertyState = usePropertyState.getState();