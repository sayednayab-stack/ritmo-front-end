import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'navy' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'gold';
  size?: 'sm' | 'md';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants: Record<string, string> = {
      default:   'bg-ops-card2    text-text-secondary ring-border',
      secondary: 'bg-ops-card2    text-text-secondary ring-border',
      navy:      'bg-navy-soft    text-text-primary   ring-brand-blue/20',
      success:   'bg-success-soft text-success         ring-success/20',
      warning:   'bg-amber-soft   text-alert-amber     ring-alert-amber/20',
      danger:    'bg-danger-soft  text-danger          ring-danger/20',
      info:      'bg-navy-soft    text-brand-wine      ring-brand-blue/20',
      gold:      'bg-gold-soft    text-accent-gold     ring-accent-gold/20',
    };

    const sizes: Record<string, string> = {
      sm: 'px-2 py-0.5 text-[10px] font-semibold',
      md: 'px-2.5 py-0.5 text-xs font-medium',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full ring-1 ring-inset',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
