'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-medium rounded-lg select-none ' +
      'transition-all duration-150 ' +
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
      'disabled:opacity-50 disabled:cursor-not-allowed';

    const variants: Record<string, string> = {
      primary:
        'text-white bg-btn-navy shadow-soft ' +
        'hover:brightness-110 hover:shadow-lift hover:-translate-y-px active:translate-y-0 ' +
        'focus-visible:ring-brand-blue/40',
      secondary:
        'text-text-primary bg-ops-card border border-border shadow-soft ' +
        'hover:bg-ops-card2 hover:border-[#C9CDD4] ' +
        'focus-visible:ring-brand-blue/30',
      danger:
        'text-white bg-btn-danger shadow-soft ' +
        'hover:brightness-110 hover:shadow-lift hover:-translate-y-px ' +
        'focus-visible:ring-danger/40',
      ghost:
        'text-text-primary hover:bg-ops-card2 ' +
        'focus-visible:ring-brand-blue/30',
    };

    const sizes: Record<string, string> = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        style={variant === 'primary' ? { boxShadow: '0 1px 2px rgba(7,45,98,.04),0 2px 8px rgba(7,45,98,.05),inset 0 1px 0 rgba(255,255,255,.16)' } : undefined}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin flex-shrink-0 w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
