// src/components/ModalFramework.ts

/**
 * Modal Framework สำหรับ C4 Editor
 * 
 * ตาม Laws of UX:
 * - Jakob's Law: ใช้ modal patterns ที่คุ้นเคย (overlay, close button, ESC key)
 * - Aesthetic-Usability Effect: ออกแบบสวยงามด้วย backdrop blur และ smooth animations
 * - Doherty Threshold: เปิด/ปิด modal < 400ms ด้วย hardware-accelerated animations
 * - Fitts's Law: ทำปุ่มปิดใหญ่พอและวางตำแหน่งให้เข้าถึงง่าย
 * - Miller's Law: จำกัดข้อมูลใน modal ให้อยู่ในขอบเขตที่จดจำได้ง่าย
 */

export interface ModalConfig {
  title: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closable?: boolean;
  backdrop?: boolean;
  animation?: boolean;
  position?: 'center' | 'top' | 'bottom';
  className?: string;
  onOpen?: () => void;
  onClose?: () => void;
  onBeforeClose?: () => boolean; // return false to prevent close
}

export interface ModalElements {
  overlay: HTMLDivElement;
  modal: HTMLDivElement;
  header: HTMLDivElement;
  title: HTMLHeadingElement;
  closeButton: HTMLButtonElement;
  content: HTMLDivElement;
  footer?: HTMLDivElement;
}

/**
 * Modal Manager class สำหรับจัดการ modals
 */
class ModalManager {
  private modals: Map<string, ModalElements> = new Map();
  private activeModal: string | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize modal manager
   */
  private initialize(): void {
    if (this.isInitialized) return;

    this.addModalStyles();
    this.setupGlobalEventListeners();
    this.isInitialized = true;

    console.log('🎭 Modal Framework initialized');
  }

  /**
   * เพิ่ม CSS styles สำหรับ modal system
   */
  private addModalStyles(): void {
    if (document.getElementById('modal-framework-styles')) return;

    const style = document.createElement('style');
    style.id = 'modal-framework-styles';
    style.textContent = `
      /* Modal Overlay */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        pointer-events: none;
      }

      .modal-overlay.visible {
        opacity: 1;
        pointer-events: all;
      }

      /* Modal Container */
      .modal {
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
        transform: scale(0.8) translateY(20px);
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        display: flex;
        flex-direction: column;
      }

      .modal-overlay.visible .modal {
        transform: scale(1) translateY(0);
      }

      /* Modal Sizes */
      .modal.small { width: 400px; }
      .modal.medium { width: 600px; }
      .modal.large { width: 800px; }
      .modal.fullscreen { 
        width: 95vw; 
        height: 95vh; 
        max-width: none;
        max-height: none;
      }

      /* Modal Header */
      .modal-header {
        padding: 24px 24px 16px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
      }

      .modal-title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #1f2937;
        line-height: 1.2;
      }

      .modal-close-button {
        background: none;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #6b7280;
        transition: all 0.2s ease;
        font-size: 18px;
      }

      .modal-close-button:hover {
        background: #f3f4f6;
        color: #374151;
      }

      .modal-close-button:active {
        background: #e5e7eb;
        transform: scale(0.95);
      }

      /* Modal Content */
      .modal-content {
        padding: 24px;
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .modal-content::-webkit-scrollbar {
        width: 6px;
      }

      .modal-content::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 3px;
      }

      .modal-content::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }

      .modal-content::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }

      /* Modal Footer */
      .modal-footer {
        padding: 16px 24px 24px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        flex-shrink: 0;
      }

      /* Position Variants */
      .modal-overlay.position-top {
        align-items: flex-start;
        padding-top: 10vh;
      }

      .modal-overlay.position-bottom {
        align-items: flex-end;
        padding-bottom: 10vh;
      }

      /* Animation Variants */
      .modal-overlay.no-animation,
      .modal-overlay.no-animation .modal {
        transition: none;
      }

      /* Mobile Responsive */
      @media (max-width: 640px) {
        .modal {
          margin: 16px;
          max-width: calc(100vw - 32px);
        }

        .modal.small,
        .modal.medium,
        .modal.large {
          width: 100%;
        }

        .modal-header {
          padding: 16px 16px 12px;
        }

        .modal-content {
          padding: 16px;
        }

        .modal-footer {
          padding: 12px 16px 16px;
        }

        .modal-title {
          font-size: 18px;
        }
      }

      /* Focus Management */
      .modal-overlay:focus {
        outline: none;
      }

      /* Disable body scroll when modal is open */
      body.modal-open {
        overflow: hidden;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * ตั้งค่า global event listeners
   */
  private setupGlobalEventListeners(): void {
    // ESC key to close modal
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.activeModal) {
        this.closeModal(this.activeModal);
      }
    });

    // Click outside to close modal
    document.addEventListener('click', (event) => {
      if (!this.activeModal) return;

      const modalElements = this.modals.get(this.activeModal);
      if (!modalElements) return;

      const target = event.target as HTMLElement;
      if (target === modalElements.overlay) {
        this.closeModal(this.activeModal);
      }
    });
  }

  /**
   * สร้าง modal ใหม่
   */
  createModal(id: string, config: ModalConfig): ModalElements {
    if (this.modals.has(id)) {
      console.warn(`Modal with id "${id}" already exists`);
      return this.modals.get(id)!;
    }

    const elements = this.createModalElements(config);
    this.modals.set(id, elements);

    // เพิ่มเข้าไปใน DOM
    document.body.appendChild(elements.overlay);

    console.log(`🎭 Created modal: ${id}`);
    return elements;
  }

  /**
   * สร้าง DOM elements สำหรับ modal
   */
  private createModalElements(config: ModalConfig): ModalElements {
    // สร้าง overlay
    const overlay = document.createElement('div');
    overlay.className = `modal-overlay${config.position ? ` position-${config.position}` : ''}${!config.animation ? ' no-animation' : ''}`;

    // สร้าง modal container
    const modal = document.createElement('div');
    modal.className = `modal ${config.size || 'medium'}${config.className ? ` ${config.className}` : ''}`;

    // สร้าง header
    const header = document.createElement('div');
    header.className = 'modal-header';

    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.textContent = config.title;

    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close-button';
    closeButton.innerHTML = '✕';
    closeButton.title = 'Close modal';
    closeButton.type = 'button';

    if (config.closable !== false) {
      header.appendChild(title);
      header.appendChild(closeButton);
    } else {
      header.appendChild(title);
      closeButton.style.display = 'none';
    }

    // สร้าง content
    const content = document.createElement('div');
    content.className = 'modal-content';

    // รวม elements
    modal.appendChild(header);
    modal.appendChild(content);
    overlay.appendChild(modal);

    return {
      overlay,
      modal,
      header,
      title,
      closeButton,
      content
    };
  }

  /**
   * เปิด modal
   */
  openModal(id: string): void {
    const elements = this.modals.get(id);
    if (!elements) {
      console.error(`Modal "${id}" not found`);
      return;
    }

    // ปิด modal อื่นที่เปิดอยู่
    if (this.activeModal && this.activeModal !== id) {
      this.closeModal(this.activeModal);
    }

    this.activeModal = id;

    // เปิด modal
    requestAnimationFrame(() => {
      elements.overlay.classList.add('visible');
      document.body.classList.add('modal-open');
    });

    // Focus management
    setTimeout(() => {
      elements.closeButton.focus();
    }, 350); // หลังจาก animation เสร็จ

    console.log(`🎭 Opened modal: ${id}`);
  }

  /**
   * ปิด modal
   */
  closeModal(id: string): void {
    const elements = this.modals.get(id);
    if (!elements) {
      console.error(`Modal "${id}" not found`);
      return;
    }

    // ลบ visible class
    elements.overlay.classList.remove('visible');
    document.body.classList.remove('modal-open');

    // ลบ modal หลังจาก animation
    setTimeout(() => {
      if (elements.overlay.parentNode) {
        elements.overlay.parentNode.removeChild(elements.overlay);
      }
      this.modals.delete(id);
      
      if (this.activeModal === id) {
        this.activeModal = null;
      }
    }, 300);

    console.log(`🎭 Closed modal: ${id}`);
  }

  /**
   * เพิ่ม footer ให้กับ modal
   */
  addFooter(id: string): HTMLDivElement {
    const elements = this.modals.get(id);
    if (!elements) {
      throw new Error(`Modal "${id}" not found`);
    }

    if (elements.footer) {
      return elements.footer;
    }

    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    elements.modal.appendChild(footer);
    elements.footer = footer;

    return footer;
  }

  /**
   * ได้รับ modal elements
   */
  getModal(id: string): ModalElements | null {
    return this.modals.get(id) || null;
  }

  /**
   * ตรวจสอบว่า modal เปิดอยู่หรือไม่
   */
  isModalOpen(id: string): boolean {
    return this.activeModal === id;
  }

  /**
   * ได้รับ active modal
   */
  getActiveModal(): string | null {
    return this.activeModal;
  }

  /**
   * ปิด modal ทั้งหมด
   */
  closeAllModals(): void {
    Array.from(this.modals.keys()).forEach(id => {
      this.closeModal(id);
    });
  }

  /**
   * ทำลาย modal manager
   */
  destroy(): void {
    this.closeAllModals();
    this.modals.clear();
    this.activeModal = null;

    // ลบ styles
    const styleElement = document.getElementById('modal-framework-styles');
    if (styleElement) {
      styleElement.remove();
    }

    document.body.classList.remove('modal-open');
    this.isInitialized = false;

    console.log('🗑️ Modal Framework destroyed');
  }
}

/**
 * Global modal manager instance
 */
export const modalManager = new ModalManager();

/**
 * Helper functions สำหรับการใช้งานง่าย
 */

/**
 * สร้างและเปิด modal ในคำสั่งเดียว
 */
export function showModal(id: string, config: ModalConfig): ModalElements {
  const elements = modalManager.createModal(id, config);
  modalManager.openModal(id);
  return elements;
}

/**
 * ปิด modal
 */
export function hideModal(id: string): void {
  modalManager.closeModal(id);
}

/**
 * สร้าง confirmation modal
 */
export function showConfirmModal(
  message: string,
  title: string = 'Confirm',
  onConfirm?: () => void,
  onCancel?: () => void
): void {
  const modalId = `confirm-${Date.now()}`;
  
  const elements = showModal(modalId, {
    title,
    size: 'small',
    closable: true
  });

  // เพิ่ม content
  elements.content.innerHTML = `
    <p style="margin: 0; color: #374151; line-height: 1.5;">${message}</p>
  `;

  // เพิ่ม footer กับปุ่ม
  const footer = modalManager.addFooter(modalId);
  footer.innerHTML = `
    <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
    <button type="button" class="btn btn-primary" id="confirm-btn">Confirm</button>
  `;

  // เพิ่ม button styles
  const style = document.createElement('style');
  style.textContent = `
    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      border: 1px solid;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }
    .btn-primary:hover {
      background: #2563eb;
      border-color: #2563eb;
    }
    .btn-secondary {
      background: #f8fafc;
      border-color: #e2e8f0;
      color: #475569;
    }
    .btn-secondary:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
  `;
  document.head.appendChild(style);

  // Event handlers
  footer.querySelector('#cancel-btn')?.addEventListener('click', () => {
    onCancel?.();
    hideModal(modalId);
  });

  footer.querySelector('#confirm-btn')?.addEventListener('click', () => {
    onConfirm?.();
    hideModal(modalId);
  });

  // Close button handler
  elements.closeButton.addEventListener('click', () => {
    onCancel?.();
    hideModal(modalId);
  });
}

/**
 * Export modal manager และ types
 */
export { modalManager as modalManagerInstance };
export type { ModalConfig, ModalElements };