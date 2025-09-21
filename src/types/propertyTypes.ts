// src/types/propertyTypes.ts

/**
 * Enhanced Property Type Definitions
 * รองรับ property types ที่หลากหลายรวมถึง array และ object types
 */

/**
 * Property value types ที่รองรับในระบบ
 */
export type PropertyValueType = 
  | string 
  | number 
  | boolean 
  | Array<string | number | boolean | PropertyObjectValue>
  | PropertyObjectValue
  | null;

/**
 * Property object value สำหรับ complex data structures
 */
export interface PropertyObjectValue {
  [key: string]: PropertyValueType;
}

/**
 * Property types ที่รองรับ
 */
export type PropertyType = 
  | 'text'           // ข้อความธรรมดา
  | 'number'         // ตัวเลข
  | 'boolean'        // true/false
  | 'array'          // อาร์เรย์ของ primitive values
  | 'object'         // object ที่ซับซ้อน
  | 'tags'           // array ของ string tags
  | 'multi-select'   // การเลือกหลายตัวเลือก
  | 'url'            // URL links
  | 'email'          // email addresses
  | 'date'           // วันที่
  | 'color'          // สีในรูปแบบ hex
  | 'json';          // JSON data

/**
 * Property metadata สำหรับเก็บข้อมูลเพิ่มเติม
 */
export interface PropertyMetadata {
  description?: string;           // คำอธิบาย property
  placeholder?: string;           // placeholder text สำหรับ input
  validation?: PropertyValidation; // กฎการ validate
  displayOptions?: PropertyDisplayOptions; // ตัวเลือกการแสดงผล
  category?: string;              // หมวดหมู่สำหรับจัดกลุ่ม
  isRequired?: boolean;           // จำเป็นต้องมีค่าหรือไม่
  isReadOnly?: boolean;           // อ่านอย่างเดียวหรือไม่
  isSystem?: boolean;             // system property หรือไม่
  tags?: string[];                // tags สำหรับการค้นหา
  createdAt?: Date;               // วันที่สร้าง
  updatedAt?: Date;               // วันที่อัพเดทล่าสุด
  version?: number;               // version ของ property
}

/**
 * Property validation rules
 */
export interface PropertyValidation {
  minLength?: number;             // ความยาวขั้นต่ำ (text)
  maxLength?: number;             // ความยาวสูงสุด (text)
  min?: number;                   // ค่าต่ำสุด (number)
  max?: number;                   // ค่าสูงสุด (number)
  pattern?: string;               // RegExp pattern (text)
  required?: boolean;             // จำเป็นต้องมีค่า
  arrayMinItems?: number;         // จำนวนรายการขั้นต่ำ (array)
  arrayMaxItems?: number;         // จำนวนรายการสูงสุด (array)
  allowedValues?: Array<string | number>; // ค่าที่อนุญาต
  customValidator?: (value: PropertyValueType) => boolean | string; // custom validation function
}

/**
 * Property display options สำหรับ UI
 */
export interface PropertyDisplayOptions {
  showLabel?: boolean;            // แสดง label หรือไม่
  labelPosition?: 'top' | 'left' | 'right' | 'bottom'; // ตำแหน่ง label
  inputType?: string;             // HTML input type
  multiline?: boolean;            // text area แทน input (text)
  sortable?: boolean;             // สามารถ sort ได้หรือไม่ (array)
  searchable?: boolean;           // สามารถค้นหาได้หรือไม่ (array)
  collapsible?: boolean;          // สามารถ collapse ได้หรือไม่ (object/array)
  maxDisplayItems?: number;       // จำนวนรายการสูงสุดที่แสดง (array)
  displayFormat?: string;         // รูปแบบการแสดงผล
  icon?: string;                  // ไอคอนสำหรับ property
  color?: string;                 // สีของ property
  size?: 'small' | 'medium' | 'large'; // ขนาดการแสดงผล
  width?: string | number;        // ความกว้างของ input
}

/**
 * Enhanced Property Value interface
 * อัพเกรดจาก interface เดิมให้รองรับ features ใหม่
 */
export interface PropertyValue {
  key: string;                    // unique key สำหรับ property
  value: PropertyValueType;       // ค่าของ property
  type: PropertyType;             // ประเภทของ property
  id: string;                     // unique ID
  order: number;                  // ลำดับการแสดงผล
  metadata?: PropertyMetadata;    // ข้อมูลเพิ่มเติม
}

/**
 * Property change event data
 */
export interface PropertyChangeEvent {
  elementId: string;              // ID ของ element ที่มี property
  elementType: 'node' | 'edge';   // ประเภทของ element
  propertyId: string;             // ID ของ property
  propertyKey: string;            // key ของ property
  changeType: PropertyChangeType; // ประเภทการเปลี่ยนแปลง
  oldValue?: PropertyValueType;   // ค่าเดิม
  newValue?: PropertyValueType;   // ค่าใหม่
  timestamp: Date;                // เวลาที่เปลี่ยนแปลง
}

/**
 * Property change types
 */
export type PropertyChangeType = 
  | 'added'           // เพิ่ม property ใหม่
  | 'updated'         // อัพเดทค่า property
  | 'removed'         // ลบ property
  | 'reordered'       // เปลี่ยนลำดับ
  | 'array-item-added'     // เพิ่มรายการใน array
  | 'array-item-removed'   // ลบรายการจาก array
  | 'array-item-updated'   // อัพเดทรายการใน array
  | 'array-reordered';     // เปลี่ยนลำดับรายการใน array

/**
 * Property category definitions สำหรับการจัดกลุ่ม
 */
export const PROPERTY_CATEGORIES = {
  BASIC: 'Basic Properties',      // properties พื้นฐาน
  ARRAYS: 'Lists & Tags',         // array และ list properties
  ADVANCED: 'Advanced',           // properties ที่ซับซ้อน
  METADATA: 'Metadata',           // ข้อมูล metadata
  SYSTEM: 'System',               // system properties
  CUSTOM: 'Custom'                // properties ที่กำหนดเอง
} as const;

export type PropertyCategory = typeof PROPERTY_CATEGORIES[keyof typeof PROPERTY_CATEGORIES];

/**
 * Property template สำหรับสร้าง property ใหม่
 */
export interface PropertyTemplate {
  name: string;                   // ชื่อ template
  description: string;            // คำอธิบาย template
  properties: Omit<PropertyValue, 'id' | 'value'>[]; // property definitions
  category: PropertyCategory;     // หมวดหมู่
  icon?: string;                  // ไอคอน template
}

/**
 * Property search/filter criteria
 */
export interface PropertySearchCriteria {
  query?: string;                 // คำค้นหา
  type?: PropertyType;            // filter ตาม type
  category?: PropertyCategory;    // filter ตาม category
  hasValue?: boolean;             // filter properties ที่มีค่า
  isRequired?: boolean;           // filter properties ที่จำเป็น
  tags?: string[];               // filter ตาม tags
  dateRange?: {                  // filter ตามช่วงวันที่
    from: Date;
    to: Date;
  };
}

/**
 * Property validation result
 */
export interface PropertyValidationResult {
  isValid: boolean;               // ผลการ validate
  errors: PropertyValidationError[]; // รายการ error
}

/**
 * Property validation error
 */
export interface PropertyValidationError {
  code: string;                   // error code
  message: string;                // error message
  path?: string;                  // property path (สำหรับ nested properties)
  severity: 'error' | 'warning' | 'info'; // ระดับความรุนแรง
}

/**
 * Property operation result
 */
export interface PropertyOperationResult {
  success: boolean;               // สำเร็จหรือไม่
  property?: PropertyValue;       // property ที่เกี่ยวข้อง
  error?: string;                 // error message
  warnings?: string[];           // warning messages
}

/**
 * Batch property operation
 */
export interface BatchPropertyOperation {
  operations: PropertyOperation[]; // รายการ operations
  elementId: string;              // element ที่จะทำ operation
  validateBeforeApply?: boolean;  // validate ก่อนทำหรือไม่
}

/**
 * Single property operation
 */
export interface PropertyOperation {
  type: 'add' | 'update' | 'remove' | 'reorder';
  property?: PropertyValue;       // property data (สำหรับ add/update)
  propertyKey?: string;          // property key (สำหรับ update/remove)
  newOrder?: number;             // ลำดับใหม่ (สำหรับ reorder)
}

/**
 * Array property operation types
 */
export interface ArrayPropertyOperation {
  type: 'add-item' | 'remove-item' | 'update-item' | 'reorder-items';
  propertyKey: string;            // property key ของ array
  item?: any;                     // รายการที่จะเพิ่ม/อัพเดท
  index?: number;                 // index ของรายการ
  newOrder?: number[];           // ลำดับใหม่ (สำหรับ reorder)
}

/**
 * Property history entry
 */
export interface PropertyHistoryEntry {
  id: string;                     // unique ID
  elementId: string;              // element ID
  timestamp: Date;                // เวลาที่เปลี่ยนแปลง
  changeType: PropertyChangeType; // ประเภทการเปลี่ยนแปลง
  propertyKey: string;            // property key
  oldValue?: PropertyValueType;   // ค่าเดิม
  newValue?: PropertyValueType;   // ค่าใหม่
  userId?: string;                // user ที่ทำการเปลี่ยนแปลง
  comment?: string;               // comment การเปลี่ยนแปลง
}

/**
 * Property export/import formats
 */
export type PropertyExportFormat = 'json' | 'csv' | 'yaml' | 'xml';

export interface PropertyExportOptions {
  format: PropertyExportFormat;   // รูปแบบการ export
  includeMetadata?: boolean;      // รวม metadata หรือไม่
  filterCriteria?: PropertySearchCriteria; // เงื่อนไข filter
  compression?: boolean;          // บีบอัดหรือไม่
}

/**
 * Utility types สำหรับการทำงานกับ properties
 */

// Type guard สำหรับตรวจสอบ property type
export type PropertyTypeGuard<T extends PropertyType> = (value: PropertyValue) => value is PropertyValue & { type: T };

// Property value type mapping
export type PropertyValueForType<T extends PropertyType> = 
  T extends 'text' | 'url' | 'email' | 'color' ? string :
  T extends 'number' ? number :
  T extends 'boolean' ? boolean :
  T extends 'array' | 'tags' | 'multi-select' ? Array<string | number | boolean> :
  T extends 'object' | 'json' ? PropertyObjectValue :
  T extends 'date' ? Date :
  PropertyValueType;

// Helper type สำหรับ required properties
export type RequiredPropertyValue = PropertyValue & Required<Pick<PropertyValue, 'key' | 'value' | 'type' | 'id'>>;

// Helper type สำหรับ property without system fields
export type PropertyInput = Omit<PropertyValue, 'id' | 'metadata'> & {
  metadata?: Partial<PropertyMetadata>;
};