// src/types/enhancedTypes.ts

/**
 * 🏗️ Enhanced Data Structures สำหรับ Multi Label และ Multi Property System
 * 
 * ไฟล์นี้ประกอบด้วย interfaces และ types ที่จำเป็นสำหรับระบบ Multi Label และ Multi Property
 * ออกแบบมาให้เป็น function-based และเข้ากันได้กับ existing codebase
 */

import type { PropertyValue } from './propertyTypes';

// ===== ENHANCED PROPERTY SYSTEM =====

/**
 * Property Validator สำหรับ validation rules
 */
export interface PropertyValidator {
  minLength?: number;              // ความยาวต่ำสุดของ string
  maxLength?: number;              // ความยาวสูงสุดของ string
  pattern?: string;                // Regex pattern สำหรับ validation
  min?: number;                    // ค่าต่ำสุดสำหรับ number
  max?: number;                    // ค่าสูงสุดสำหรับ number
  required?: boolean;              // เป็น required field หรือไม่
  customValidator?: (value: string) => ValidationResult; // Custom validation function
}

/**
 * ผลลัพธ์ของ validation
 */
export interface ValidationResult {
  valid: boolean;                  // ผลลัพธ์ validation
  error?: string;                  // ข้อความ error (ถ้ามี)
  warning?: string;                // ข้อความ warning (ถ้ามี)
  suggestion?: string;             // คำแนะนำสำหรับแก้ไข
}

/**
 * ตัวเลือกสำหรับการแสดงผล Property
 */
export interface PropertyDisplayOptions {
  color?: number;                  // สีสำหรับแสดงผล
  icon?: string;                   // ไอคอนสำหรับแสดงผล
  priority?: number;               // ลำดับความสำคัญ (เลขมากขึ้นหน้า)
  isCollapsible?: boolean;         // สามารถ collapse ได้หรือไม่
  placeholder?: string;            // Placeholder text สำหรับ input
  helpText?: string;               // ข้อความช่วยเหลือ
  showInSummary?: boolean;         // แสดงใน summary view หรือไม่
  groupLabel?: string;             // Label สำหรับกลุ่มย่อย
}

/**
 * Property types ที่รองรับ (ขยายจาก existing)
 */
export type EnhancedPropertyType = 
  | 'text' 
  | 'number' 
  | 'boolean' 
  | 'url' 
  | 'email' 
  | 'date' 
  | 'color' 
  | 'select' 
  | 'multiselect'
  | 'textarea'
  | 'password';

/**
 * Enhanced Property Value ที่ขยายจาก PropertyValue เดิม
 */
export interface EnhancedPropertyValue extends Omit<PropertyValue, 'type'> {
  type: EnhancedPropertyType;      // ใช้ enhanced type แทน
  category?: string;               // หมวดหมู่ของ property
  isRequired?: boolean;            // เป็น required field หรือไม่
  validation?: PropertyValidator;  // Validation rules
  displayOptions?: PropertyDisplayOptions; // ตัวเลือกการแสดงผล
  metadata?: Record<string, any>;  // ข้อมูลเพิ่มเติม (flexible)
  lastModified?: number;           // Timestamp ของการแก้ไขล่าสุด
  
  // สำหรับ select และ multiselect types
  selectOptions?: PropertySelectOption[];
}

/**
 * ตัวเลือกสำหรับ select properties
 */
export interface PropertySelectOption {
  value: string;                   // ค่าของตัวเลือก
  label: string;                   // ชื่อที่แสดง
  color?: number;                  // สีของตัวเลือก
  icon?: string;                   // ไอคอนของตัวเลือก
  description?: string;            // คำอธิบายตัวเลือก
  isDefault?: boolean;             // เป็นค่า default หรือไม่
}

// ===== MULTI LABEL SYSTEM =====

/**
 * ประเภทของ Label
 */
export type LabelType = 
  | 'primary'      // Label หลัก
  | 'secondary'    // Label รอง
  | 'tag'          // Tag/Badge
  | 'description'  // คำอธิบาย
  | 'metadata'     // ข้อมูล metadata
  | 'status'       // สถานะ
  | 'category';    // หมวดหมู่

/**
 * ตำแหน่งของ Label
 */
export interface LabelPosition {
  side: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'floating'; // ด้านที่วาง
  offset: { x: number; y: number }; // ระยะ offset จากตำแหน่งเริ่มต้น
  alignment?: 'start' | 'center' | 'end'; // การจัดตำแหน่งบนด้านที่เลือก
  margin?: number;                 // ระยะห่างจากขอบ element
  zIndex?: number;                 // Z-index สำหรับ layering
}

/**
 * สไตล์ของ Label
 */
export interface LabelStyle {
  fontSize: number;                // ขนาดตัวอักษร
  fontWeight: 'normal' | 'bold' | 'lighter'; // น้ำหนักตัวอักษร
  fontFamily?: string;             // ฟอนต์ family
  color: number;                   // สีตัวอักษร
  backgroundColor?: number;        // สีพื้นหลัง
  borderColor?: number;            // สีขอบ
  borderWidth?: number;            // ความหนาขอบ
  borderRadius?: number;           // มุมโค้งของขอบ
  padding: { x: number; y: number }; // Padding ภายใน
  opacity?: number;                // ความโปร่งใส (0-1)
  shadow?: LabelShadow;            // เงา
  animation?: LabelAnimation;      // Animation effects
}

/**
 * เงาของ Label
 */
export interface LabelShadow {
  offsetX: number;                 // ระยะ offset X ของเงา
  offsetY: number;                 // ระยะ offset Y ของเงา
  blur: number;                    // ความเบลอของเงา
  color: number;                   // สีของเงา
  alpha: number;                   // ความโปร่งใสของเงา
}

/**
 * Animation effects สำหรับ Label
 */
export interface LabelAnimation {
  type: 'none' | 'fade' | 'slide' | 'bounce' | 'pulse'; // ประเภท animation
  duration: number;                // ระยะเวลา animation (ms)
  delay?: number;                  // ความล่าช้าก่อนเริ่ม animation (ms)
  repeat?: boolean;                // วนซ้ำหรือไม่
}

/**
 * Label Value สำหรับ Multi Label System
 */
export interface LabelValue {
  id: string;                      // Unique identifier
  text: string;                    // ข้อความของ label
  type: LabelType;                 // ประเภทของ label
  position: LabelPosition;         // ตำแหน่งของ label
  style: LabelStyle;               // สไตล์ของ label
  isEditable: boolean;             // สามารถแก้ไขได้หรือไม่
  isVisible: boolean;              // แสดงผลหรือไม่
  order: number;                   // ลำดับการแสดงผล
  metadata?: Record<string, any>;  // ข้อมูลเพิ่มเติม
  lastModified?: number;           // Timestamp ของการแก้ไขล่าสุด
  
  // Event handlers (optional)
  onClick?: () => void;            // Handler เมื่อคลิก
  onDoubleClick?: () => void;      // Handler เมื่อ double click
  onHover?: () => void;            // Handler เมื่อ hover
}

// ===== EDGE ENHANCEMENT SYSTEM =====

/**
 * Metadata ของ Edge
 */
export interface EdgeMetadata {
  relationshipType: string;        // ประเภทความสัมพันธ์
  sourceSide?: string;             // จุดเชื่อมต่อฝั่ง source
  targetSide?: string;             // จุดเชื่อมต่อฝั่ง target
  styleTheme?: string;             // Theme ของการแสดงผล
  isDirectional: boolean;          // มีทิศทางหรือไม่
  lineStyle: 'solid' | 'dashed' | 'dotted' | 'double'; // รูปแบบเส้น
  lineWidth: number;               // ความหนาของเส้น
  lineColor: number;               // สีของเส้น
  arrowStyle?: ArrowStyle;         // สไตล์ของลูกศร
  isAnimated?: boolean;            // มี animation หรือไม่
  animationSpeed?: number;         // ความเร็ว animation
}

/**
 * สไตล์ของลูกศร
 */
export interface ArrowStyle {
  type: 'triangle' | 'diamond' | 'circle' | 'square'; // รูปแบบลูกศร
  size: number;                    // ขนาดลูกศร
  color?: number;                  // สีลูกศร (ถ้าต่างจากเส้น)
  filled: boolean;                 // เติมสีหรือไม่
  borderWidth?: number;            // ความหนาขอบลูกศร
}

/**
 * Edge State สำหรับ function-based edge management
 */
export interface EdgeState {
  id: string;                      // Unique edge ID
  sourceNodeId: string;            // Source node ID
  targetNodeId: string;            // Target node ID
  labels: Map<string, LabelValue>; // Edge labels
  properties: Map<string, EnhancedPropertyValue>; // Edge properties
  metadata: EdgeMetadata;          // Edge configuration
  isVisible: boolean;              // สถานะการแสดงผล
  isSelected: boolean;             // สถานะการเลือก
  isHighlighted: boolean;          // สถานะการ highlight
  lastModified: number;            // Timestamp ของการแก้ไขล่าสุด
}

// ===== CATEGORY SYSTEM =====

/**
 * หมวดหมู่ของ Property
 */
export interface PropertyCategory {
  id: string;                      // Unique identifier
  name: string;                    // ชื่อหมวดหมู่
  displayName?: string;            // ชื่อที่แสดง (ถ้าต่างจากชื่อจริง)
  description?: string;            // คำอธิบายหมวดหมู่
  icon?: string;                   // ไอคอนหมวดหมู่
  color?: number;                  // สีหมวดหมู่
  order: number;                   // ลำดับการแสดงผล
  isCollapsed?: boolean;           // สถานะ collapse
  isVisible: boolean;              // สถานะการแสดงผล
  propertyIds: string[];           // Property IDs ในหมวดหมู่นี้
  metadata?: Record<string, any>;  // ข้อมูลเพิ่มเติม
}

// ===== VALIDATION SYSTEM =====

/**
 * ผลลัพธ์ของการ validate ทั้งหมด
 */
export interface ValidationSummary {
  elementId: string;               // ID ของ element ที่ validate
  elementType: 'node' | 'edge';    // ประเภทของ element
  isValid: boolean;                // ผลลัพธ์รวม
  errors: ValidationError[];       // รายการ errors
  warnings: ValidationWarning[];   // รายการ warnings
  validatedAt: number;             // Timestamp ของการ validate
}

/**
 * Error ของ validation
 */
export interface ValidationError {
  propertyId: string;              // Property ID ที่มี error
  field: string;                   // ชื่อ field ที่มี error
  message: string;                 // ข้อความ error
  code: string;                    // รหัส error
  severity: 'error' | 'critical'; // ระดับความรุนแรง
  suggestions?: string[];          // คำแนะนำสำหรับแก้ไข
}

/**
 * Warning ของ validation
 */
export interface ValidationWarning {
  propertyId: string;              // Property ID ที่มี warning
  field: string;                   // ชื่อ field ที่มี warning
  message: string;                 // ข้อความ warning
  code: string;                    // รหัส warning
  suggestions?: string[];          // คำแนะนำสำหรับปรับปรุง
}

// ===== UTILITY TYPES =====

/**
 * Generic CRUD operations
 */
export interface CRUDOperations<T> {
  create: (item: Omit<T, 'id'>) => string;
  read: (id: string) => T | null;
  update: (id: string, updates: Partial<T>) => boolean;
  delete: (id: string) => boolean;
  list: () => T[];
}

/**
 * Event payload สำหรับ state changes
 */
export interface StateChangeEvent<T = any> {
  elementId: string;               // ID ของ element ที่เปลี่ยน
  elementType: 'node' | 'edge';    // ประเภทของ element
  changeType: string;              // ประเภทการเปลี่ยนแปลง
  oldValue?: T;                    // ค่าเก่า
  newValue: T;                     // ค่าใหม่
  timestamp: number;               // Timestamp ของการเปลี่ยนแปลง
  metadata?: Record<string, any>;  // ข้อมูลเพิ่มเติม
}

/**
 * Search และ Filter options
 */
export interface SearchOptions {
  query?: string;                  // คำค้นหา
  type?: EnhancedPropertyType | LabelType; // กรองตามประเภท
  category?: string;               // กรองตามหมวดหมู่
  isRequired?: boolean;            // กรองตาม required status
  hasErrors?: boolean;             // กรองตาม validation status
  sortBy?: 'name' | 'type' | 'order' | 'lastModified'; // เรียงตาม
  sortOrder?: 'asc' | 'desc';      // ลำดับการเรียง
  limit?: number;                  // จำกัดจำนวนผลลัพธ์
  offset?: number;                 // Offset สำหรับ pagination
}

// ===== DEFAULT VALUES =====

/**
 * ค่า default สำหรับ property validation
 */
export const DEFAULT_PROPERTY_VALIDATION: PropertyValidator = {
  required: false,
  minLength: 0,
  maxLength: 1000
};

/**
 * ค่า default สำหรับ property display options
 */
export const DEFAULT_PROPERTY_DISPLAY: PropertyDisplayOptions = {
  priority: 0,
  isCollapsible: false,
  showInSummary: true,
  color: 0x333333
};

/**
 * ค่า default สำหรับ label style
 */
export const DEFAULT_LABEL_STYLE: LabelStyle = {
  fontSize: 12,
  fontWeight: 'normal',
  color: 0xFFFFFF,
  backgroundColor: 0x1e1e1e,
  borderRadius: 4,
  padding: { x: 8, y: 4 },
  opacity: 0.9
};

/**
 * ค่า default สำหรับ label position
 */
export const DEFAULT_LABEL_POSITION: LabelPosition = {
  side: 'top',
  offset: { x: 0, y: -10 },
  alignment: 'center',
  margin: 5
};

/**
 * ค่า default สำหรับ edge metadata
 */
export const DEFAULT_EDGE_METADATA: EdgeMetadata = {
  relationshipType: 'default',
  isDirectional: true,
  lineStyle: 'solid',
  lineWidth: 2,
  lineColor: 0x999999
};