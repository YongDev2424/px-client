// src/components/ZoomControls.ts
import { Application } from 'pixi.js';

/**
 * ZoomControls - ระบบควบคุมการ zoom สำหรับ PixiJS canvas
 * 
 * 🛡️ ADDITIVE APPROACH: เพิ่มฟีเจอร์ zoom โดยไม่แก้ไข existing PixiJS interactions
 * - ไม่แก้ไข existing PixiJS application หรือ stage
 * - เพิ่ม UI controls ที่ตำแหน่ง bottom-right
 * - รองรับ mouse wheel zoom และ keyboard shortcuts
 * - รักษา existing interactions และ event handlers
 */

export interface ZoomControlsConfig {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  enableMouseWheel?: boolean;
  showTooltips?: boolean;
  smoothTransitions?: boolean;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  showZoomLevel?: boolean;
}

export interface ZoomState {
  currentZoom: number;
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
  isTransitioning: boolean;
}

export class ZoomControls {
  private pixiApp: Application;
  private config: Required<ZoomControlsConfig>;
  private state: ZoomState;
  private container!: HTMLElement;
  private zoomInBtn!: HTMLButtonElement;
  private zoomOutBtn!: HTMLButtonElement;
  private resetBtn!: HTMLButtonElement;
  private zoomDisplay!: HTMLElement;
  private isDestroyed: boolean = false;

  // Event handlers for cleanup
  private wheelHandler: (event: WheelEvent) => void;
  private keyHandler: (event: KeyboardEvent) => void;
  private resizeHandler: () => void;

  constructor(pixiApp: Application, config: ZoomControlsConfig = {}) {
    this.pixiApp = pixiApp;
    
    // Default configuration
    this.config = {
      position: config.position || 'bottom-right',
      enableMouseWheel: config.enableMouseWheel !== false, // Default true
      showTooltips: config.showTooltips !== false, // Default true
      smoothTransitions: config.smoothTransitions !== false, // Default true
      minZoom: config.minZoom || 0.25,
      maxZoom: config.maxZoom || 4.0,
      zoomStep: config.zoomStep || 0.25,
      showZoomLevel: config.showZoomLevel !== false // Default true
    };

    // Initialize zoom state
    this.state = {
      currentZoom: 1.0,
      minZoom: this.config.minZoom,
      maxZoom: this.config.maxZoom,
      zoomStep: this.config.zoomStep,
      isTransitioning: false
    };

    // Bind event handlers for proper cleanup
    this.wheelHandler = this.handleWheelZoom.bind(this);
    this.keyHandler = this.handleKeyboardShortcuts.bind(this);
    this.resizeHandler = this.handleWindowResize.bind(this);

    this.createZoomUI();
    this.setupEventListeners();

    console.log('✅ ZoomControls initialized with config:', this.config);
  }

  /**
   * สร้าง UI elements สำหรับ zoom controls
   */
  private createZoomUI(): void {
    // สร้าง container หลัก
    this.container = document.createElement('div');
    this.container.className = 'zoom-controls';
    this.container.setAttribute('data-position', this.config.position);

    // สร้าง zoom buttons
    this.zoomInBtn = this.createButton('zoom-in', '+', 'Zoom In (Ctrl + =)');
    this.zoomOutBtn = this.createButton('zoom-out', '−', 'Zoom Out (Ctrl + -)');
    this.resetBtn = this.createButton('zoom-reset', '⌂', 'Reset Zoom (Ctrl + 0)');

    // สร้าง zoom level display
    if (this.config.showZoomLevel) {
      this.zoomDisplay = document.createElement('div');
      this.zoomDisplay.className = 'zoom-display';
      this.zoomDisplay.textContent = '100%';
      if (this.config.showTooltips) {
        this.zoomDisplay.title = 'Current zoom level';
      }
    }

    // เพิ่ม elements เข้า container
    this.container.appendChild(this.zoomInBtn);
    this.container.appendChild(this.zoomOutBtn);
    this.container.appendChild(this.resetBtn);
    
    if (this.zoomDisplay) {
      this.container.appendChild(this.zoomDisplay);
    }

    // เพิ่ม container เข้า DOM
    document.body.appendChild(this.container);

    // อัปเดต UI state
    this.updateUI();
  }

  /**
   * สร้าง button element พร้อม event handlers
   */
  private createButton(className: string, text: string, tooltip?: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = `zoom-btn ${className}`;
    button.textContent = text;
    button.type = 'button';
    
    if (tooltip && this.config.showTooltips) {
      button.title = tooltip;
    }

    // เพิ่ม click handlers
    switch (className) {
      case 'zoom-in':
        button.addEventListener('click', () => this.zoomIn());
        break;
      case 'zoom-out':
        button.addEventListener('click', () => this.zoomOut());
        break;
      case 'zoom-reset':
        button.addEventListener('click', () => this.resetZoom());
        break;
    }

    return button;
  }

  /**
   * ตั้งค่า event listeners สำหรับ mouse wheel และ keyboard
   */
  private setupEventListeners(): void {
    // Mouse wheel zoom (ถ้าเปิดใช้งาน)
    if (this.config.enableMouseWheel) {
      // เพิ่ม wheel event ที่ canvas element เพื่อไม่รบกวน existing events
      const canvas = this.pixiApp.canvas;
      if (canvas) {
        canvas.addEventListener('wheel', this.wheelHandler, { passive: false });
      }
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', this.keyHandler);

    // Window resize handler
    window.addEventListener('resize', this.resizeHandler);
  }

  /**
   * จัดการ mouse wheel zoom
   */
  private handleWheelZoom(event: WheelEvent): void {
    if (this.isDestroyed || this.state.isTransitioning) return;

    // ป้องกัน default scroll behavior
    event.preventDefault();
    event.stopPropagation();

    // คำนวณ zoom direction
    const delta = event.deltaY;
    const zoomDirection = delta > 0 ? -1 : 1;
    
    // คำนวณ zoom level ใหม่
    const newZoom = this.state.currentZoom + (zoomDirection * this.state.zoomStep);
    
    // Apply zoom
    this.setZoom(newZoom);
  }

  /**
   * จัดการ keyboard shortcuts
   */
  private handleKeyboardShortcuts(event: KeyboardEvent): void {
    if (this.isDestroyed || this.state.isTransitioning) return;

    // ตรวจสอบ Ctrl/Cmd key
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    
    if (!isCtrlOrCmd) return;

    switch (event.key) {
      case '=':
      case '+':
        event.preventDefault();
        this.zoomIn();
        break;
      case '-':
        event.preventDefault();
        this.zoomOut();
        break;
      case '0':
        event.preventDefault();
        this.resetZoom();
        break;
    }
  }

  /**
   * จัดการ window resize
   */
  private handleWindowResize(): void {
    if (this.isDestroyed) return;
    
    // อัปเดตตำแหน่ง zoom controls หากจำเป็น
    this.updatePosition();
  }

  /**
   * Zoom in ด้วย step ที่กำหนด
   */
  public zoomIn(): void {
    if (this.isDestroyed) return;
    
    const newZoom = this.state.currentZoom + this.state.zoomStep;
    this.setZoom(newZoom);
  }

  /**
   * Zoom out ด้วย step ที่กำหนด
   */
  public zoomOut(): void {
    if (this.isDestroyed) return;
    
    const newZoom = this.state.currentZoom - this.state.zoomStep;
    this.setZoom(newZoom);
  }

  /**
   * Reset zoom เป็น 100%
   */
  public resetZoom(): void {
    if (this.isDestroyed) return;
    
    this.setZoom(1.0);
  }

  /**
   * ตั้งค่า zoom level โดยตรง
   */
  public setZoom(zoomLevel: number): void {
    if (this.isDestroyed) return;

    // จำกัด zoom level ตาม min/max
    const clampedZoom = Math.max(
      this.state.minZoom,
      Math.min(this.state.maxZoom, zoomLevel)
    );

    // ถ้า zoom level ไม่เปลี่ยน ไม่ต้องทำอะไร
    if (Math.abs(clampedZoom - this.state.currentZoom) < 0.001) {
      return;
    }

    // อัปเดต state
    this.state.currentZoom = clampedZoom;

    // Apply zoom ไปยัง PixiJS stage (ENHANCE existing stage, don't replace)
    if (this.config.smoothTransitions) {
      this.applyZoomWithTransition(clampedZoom);
    } else {
      this.applyZoomImmediate(clampedZoom);
    }

    // อัปเดต UI
    this.updateUI();

    // Dispatch custom event สำหรับ components อื่นๆ
    this.dispatchZoomEvent(clampedZoom);
  }

  /**
   * Apply zoom ทันทีโดยไม่มี transition
   */
  private applyZoomImmediate(zoomLevel: number): void {
    // ENHANCE existing PixiJS stage scale (ไม่แก้ไข existing stage)
    this.pixiApp.stage.scale.set(zoomLevel);
    
    // แก้ปัญหาตัวอักษรแตกเมื่อ zoom โดยปรับ text resolution
    this.updateTextResolution(zoomLevel);
    
    // อัปเดต selection indicators เพื่อให้ตรงตำแหน่ง
    this.updateSelectionIndicators();
  }

  /**
   * Apply zoom พร้อม smooth transition
   */
  private applyZoomWithTransition(targetZoom: number): void {
    if (this.state.isTransitioning) return;

    this.state.isTransitioning = true;
    const startZoom = this.pixiApp.stage.scale.x;
    const duration = 200; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      if (this.isDestroyed) {
        this.state.isTransitioning = false;
        return;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      // Interpolate zoom level
      const currentZoom = startZoom + (targetZoom - startZoom) * easeOut;
      
      // Apply to stage
      this.pixiApp.stage.scale.set(currentZoom);
      
      // อัปเดต text resolution และ selection indicators ระหว่าง animation
      if (progress === 1) {
        this.updateTextResolution(currentZoom);
        this.updateSelectionIndicators();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.state.isTransitioning = false;
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * อัปเดต UI elements
   */
  private updateUI(): void {
    if (this.isDestroyed) return;

    // อัปเดต button states
    this.zoomInBtn.disabled = this.state.currentZoom >= this.state.maxZoom;
    this.zoomOutBtn.disabled = this.state.currentZoom <= this.state.minZoom;
    this.resetBtn.disabled = Math.abs(this.state.currentZoom - 1.0) < 0.001;

    // อัปเดต zoom display
    if (this.zoomDisplay) {
      const percentage = Math.round(this.state.currentZoom * 100);
      this.zoomDisplay.textContent = `${percentage}%`;
    }

    // อัปเดต CSS classes สำหรับ styling
    this.container.classList.toggle('at-min-zoom', this.state.currentZoom <= this.state.minZoom);
    this.container.classList.toggle('at-max-zoom', this.state.currentZoom >= this.state.maxZoom);
    this.container.classList.toggle('at-default-zoom', Math.abs(this.state.currentZoom - 1.0) < 0.001);
  }

  /**
   * อัปเดตตำแหน่งของ zoom controls
   */
  private updatePosition(): void {
    if (this.isDestroyed) return;
    
    // CSS จะจัดการตำแหน่งผ่าน data-position attribute
    // ฟังก์ชันนี้สามารถขยายได้สำหรับ dynamic positioning
  }

  /**
   * Dispatch custom zoom event
   */
  private dispatchZoomEvent(zoomLevel: number): void {
    const event = new CustomEvent('zoom-changed', {
      detail: {
        zoomLevel,
        percentage: Math.round(zoomLevel * 100),
        isAtMin: zoomLevel <= this.state.minZoom,
        isAtMax: zoomLevel >= this.state.maxZoom,
        isAtDefault: Math.abs(zoomLevel - 1.0) < 0.001
      }
    });
    
    document.dispatchEvent(event);
  }

  /**
   * ได้ zoom level ปัจจุบัน
   */
  public getCurrentZoom(): number {
    return this.state.currentZoom;
  }

  /**
   * ได้ zoom state ทั้งหมด
   */
  public getZoomState(): Readonly<ZoomState> {
    return { ...this.state };
  }

  /**
   * ตั้งค่า zoom limits
   */
  public setZoomLimits(minZoom: number, maxZoom: number): void {
    if (this.isDestroyed) return;

    this.state.minZoom = Math.max(0.1, minZoom);
    this.state.maxZoom = Math.min(10, maxZoom);
    
    // ตรวจสอบ current zoom ว่าอยู่ในขอบเขตใหม่หรือไม่
    if (this.state.currentZoom < this.state.minZoom) {
      this.setZoom(this.state.minZoom);
    } else if (this.state.currentZoom > this.state.maxZoom) {
      this.setZoom(this.state.maxZoom);
    } else {
      this.updateUI();
    }
  }

  /**
   * เปิด/ปิด mouse wheel zoom
   */
  public setMouseWheelEnabled(enabled: boolean): void {
    if (this.isDestroyed) return;

    const canvas = this.pixiApp.canvas;
    if (!canvas) return;

    if (enabled && !this.config.enableMouseWheel) {
      canvas.addEventListener('wheel', this.wheelHandler, { passive: false });
      this.config.enableMouseWheel = true;
    } else if (!enabled && this.config.enableMouseWheel) {
      canvas.removeEventListener('wheel', this.wheelHandler);
      this.config.enableMouseWheel = false;
    }
  }

  /**
   * แสดง/ซ่อน zoom controls
   */
  public setVisible(visible: boolean): void {
    if (this.isDestroyed) return;
    
    this.container.style.display = visible ? 'flex' : 'none';
  }

  /**
   * แก้ปัญหาตัวอักษรแตกเมื่อ zoom โดยปรับ text resolution
   * ตาม PixiJS documentation: https://pixijs.download/release/docs/text.html
   */
  private updateTextResolution(zoomLevel: number): void {
    if (this.isDestroyed) return;

    // คำนวณ resolution ที่เหมาะสมตาม zoom level
    // ใช้ resolution สูงขึ้นเมื่อ zoom in เพื่อให้ตัวอักษรคมชัด
    const targetResolution = Math.max(1, Math.min(4, zoomLevel * 2));

    // หา Text objects ทั้งหมดใน stage และอัปเดต resolution
    this.traverseAndUpdateTextResolution(this.pixiApp.stage, targetResolution);
  }

  /**
   * Traverse ผ่าน container hierarchy และอัปเดต text resolution
   */
  private traverseAndUpdateTextResolution(container: any, resolution: number): void {
    if (!container || !container.children) return;

    container.children.forEach((child: any) => {
      // ตรวจสอบว่าเป็น Text object หรือไม่
      if (child.text !== undefined && typeof child.text === 'string') {
        // อัปเดต resolution สำหรับ Text objects
        if (child.resolution !== resolution) {
          child.resolution = resolution;
          // บังคับให้ re-render text ด้วย resolution ใหม่
          if (child.updateText) {
            child.updateText();
          } else if (child._updateText) {
            child._updateText();
          }
        }
      }
      
      // ตรวจสอบว่าเป็น EditableLabel หรือไม่ (จาก createEditableLabel)
      if (child.updateTextResolution && typeof child.updateTextResolution === 'function') {
        child.updateTextResolution(resolution);
      }
      
      // Recursively traverse children
      if (child.children && child.children.length > 0) {
        this.traverseAndUpdateTextResolution(child, resolution);
      }
    });
  }

  /**
   * อัปเดต selection indicators เพื่อให้ตรงตำแหน่งเมื่อ zoom
   */
  private updateSelectionIndicators(): void {
    if (this.isDestroyed) return;

    // Import selectionManager และเรียก updateAllIndicators
    // ใช้ dynamic import เพื่อหลีกเลี่ยง circular dependency
    import('../utils/selectionManager').then(({ selectionManager }) => {
      if (selectionManager && selectionManager.updateAllIndicators) {
        selectionManager.updateAllIndicators();
      }
    }).catch(error => {
      console.warn('Failed to update selection indicators:', error);
    });
  }

  /**
   * ทำลาย ZoomControls และลบ event listeners
   */
  public destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    // ลบ event listeners
    const canvas = this.pixiApp.canvas;
    if (canvas && this.config.enableMouseWheel) {
      canvas.removeEventListener('wheel', this.wheelHandler);
    }
    
    document.removeEventListener('keydown', this.keyHandler);
    window.removeEventListener('resize', this.resizeHandler);

    // ลบ DOM elements
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    console.log('🗑️ ZoomControls destroyed and cleaned up');
  }
}