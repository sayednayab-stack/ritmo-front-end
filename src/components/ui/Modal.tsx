'use client';

import { Fragment, ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export function Modal({
  isOpen, onClose, title, description, children,
  size = 'md', showCloseButton = true,
  closeOnOverlayClick = true, closeOnEscape = true,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, closeOnEscape, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes: Record<string, string> = {
    sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-[90vw]',
  };

  return (
    <Fragment>
      <div
        className="fixed inset-0 bg-[#04204A]/45 backdrop-blur-sm z-50 animate-fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className={cn(
              'w-full bg-ops-card rounded-2xl border border-border animate-scale-in',
              sizes[size]
            )}
            style={{ boxShadow: '0 24px 64px rgba(4,32,74,.28), 0 4px 16px rgba(4,32,74,.12)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
          >
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between px-6 py-4 border-b border-ops-line">
                <div>
                  {title && (
                    <h2 id="modal-title" className="font-serif text-xl font-medium tracking-tight text-text-primary">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-0.5 text-sm text-text-secondary">{description}</p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-ops-card2 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            <div className="p-6">{children}</div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
