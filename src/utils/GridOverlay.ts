// src/utils/GridOverlay.ts

/**
 * GridOverlay - CSS-based grid background system
 * 
 * 🛡️ ADDITIVE APPROACH: Enhances existing canvas-grid CSS without replacing it
 * - Works alongside existing .canvas-grid CSS class
 * - Provides programmatic control over grid appearance
 * - Can be toggled on/off without affecting existing styling
 * - Preserves existing grid background from style.css
 */
export class GridOverlay {
  private containerElement: HTMLElement;
  private gridElement: HTMLElement | null = null;
  private gridSize: number = 20; // Default grid size in pixels
  private gridColor: string = 'rgba(255, 255, 255, 0.1)'; // Default grid color
  private isVisible: boolean = false;

  /**
   * สร้าง GridOverlay สำหรับ canvas container
   * @param containerElement - HTML element ที่จะเพิ่ม grid overlay
   */
  constructor(containerElement: HTMLElement) {
    this.containerElement = containerElement;
  }

  /**
   * เริ่มต้น grid overlay system
   */
  public initialize(): void {
    this.createGridElement();
    console.log('🔲 GridOverlay initialized');
  }

  /**
   * สร้าง grid element เป็น enhancement ของ existing .canvas-grid
   */
  private createGridElement(): void {
    // ตรวจสอบว่ามี existing grid element หรือไม่
    const existingGrid = this.containerElement.querySelector('.canvas-grid');
    
    if (existingGrid) {
      // ใช้ existing grid element และ enhance มันแทนการสร้างใหม่
      this.gridElement = existingGrid as HTMLElement;
      console.log('🔲 Using existing canvas-grid element');
    } else {
      // สร้าง grid element ใหม่หากไม่มี existing
      this.gridElement = document.createElement('div');
      this.gridElement.className = 'canvas-grid enhanced-grid';
      this.containerElement.appendChild(this.gridElement);
      console.log('🔲 Created new enhanced grid element');
    }

    // ตั้งค่า initial styles
    this.applyGridStyles();
    
    // ซ่อน grid โดยค่าเริ่มต้น (preserve existing behavior)
    this.hide();
  }

  /**
   * ใช้ grid styles กับ element
   */
  private applyGridStyles(): void {
    if (!this.gridElement) return;

    // เพิ่ม enhanced styles โดยไม่แทนที่ existing CSS
    const styles = {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '0',
      backgroundImage: `
        linear-gradient(to right, ${this.gridColor} 1px, transparent 1px),
        linear-gradient(to bottom, ${this.gridColor} 1px, transparent 1px)
      `,
      backgroundSize: `${this.gridSize}px ${this.gridSize}px`,
      opacity: '0.3',
      transition: 'opacity 0.3s ease'
    };

    Object.assign(this.gridElement.style, styles);
  }

  /**
   * แสดง grid overlay
   */
  public show(): void {
    if (!this.gridElement) return;

    this.isVisible = true;
    this.gridElement.style.display = 'block';
    this.gridElement.style.opacity = '0.3';
    
    console.log('🔲 Grid overlay shown');
  }

  /**
   * ซ่อน grid overlay
   */
  public hide(): void {
    if (!this.gridElement) return;

    this.isVisible = false;
    this.gridElement.style.display = 'none';
    
    console.log('🔲 Grid overlay hidden');
  }

  /**
   * ตั้งค่าขนาด grid
   * @param size - ขนาด grid ใน pixels
   */
  public setGridSize(size: number): void {
    this.gridSize = size;
    
    if (this.gridElement) {
      this.gridElement.style.backgroundSize = `${size}px ${size}px`;
    }
    
    console.log(`🔲 Grid size updated to ${size}px`);
  }

  /**
   * ตั้งค่าสี grid
   * @param color - สี grid ในรูปแบบ CSS color
   */
  public setGridColor(color: string): void {
    this.gridColor = color;
    
    if (this.gridElement) {
      this.gridElement.style.backgroundImage = `
        linear-gradient(to right, ${color} 1px, transparent 1px),
        linear-gradient(to bottom, ${color} 1px, transparent 1px)
      `;
    }
    
    console.log(`🎨 Grid color updated to ${color}`);
  }

  /**
   * ตั้งค่าความโปร่งใส grid
   * @param opacity - ค่าความโปร่งใส (0-1)
   */
  public setOpacity(opacity: number): void {
    if (!this.gridElement) return;

    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    this.gridElement.style.opacity = clampedOpacity.toString();
    
    console.log(`🔲 Grid opacity set to ${clampedOpacity}`);
  }

  /**
   * อัปเดตขนาด grid overlay
   * @param width - ความกว้างใหม่
   * @param height - ความสูงใหม่
   */
  public updateSize(width: number, height: number): void {
    if (!this.gridElement) return;

    this.gridElement.style.width = `${width}px`;
    this.gridElement.style.height = `${height}px`;
    
    console.log(`🔲 Grid size updated to ${width}x${height}`);
  }

  /**
   * ตรวจสอบว่า grid กำลังแสดงอยู่หรือไม่
   * @returns true หาก grid กำลังแสดงอยู่
   */
  public isGridVisible(): boolean {
    return this.isVisible;
  }

  /**
   * ได้รับขนาด grid ปัจจุบัน
   * @returns ขนาด grid ใน pixels
   */
  public getGridSize(): number {
    return this.gridSize;
  }

  /**
   * ได้รับสี grid ปัจจุบัน
   * @returns สี grid ในรูปแบบ CSS color
   */
  public getGridColor(): string {
    return this.gridColor;
  }

  /**
   * สลับสถานะการแสดง grid
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * ทำลาย GridOverlay และ cleanup resources
   */
  public destroy(): void {
    if (this.gridElement && this.gridElement.classList.contains('enhanced-grid')) {
      // ลบเฉพาะ enhanced grid ที่เราสร้างขึ้น ไม่ลบ existing .canvas-grid
      this.gridElement.remove();
    }
    
    this.gridElement = null;
    console.log('🗑️ GridOverlay destroyed');
  }
}