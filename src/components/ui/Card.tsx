import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'navy' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const variants: Record<string, string> = {
      default:  'bg-ops-card border border-border shadow-soft',
      navy:     'border border-white/15 text-white',
      bordered: 'bg-ops-card border border-border',
      elevated: 'bg-ops-card border border-border shadow-lift',
    };

    const navyStyle = variant === 'navy'
      ? { background: 'linear-gradient(135deg,#072d62,#0e3f82)', boxShadow: '0 1px 2px rgba(7,45,98,.04),0 2px 8px rgba(7,45,98,.05),inset 0 1px 0 rgba(255,255,255,.14)' }
      : undefined;

    const paddings: Record<string, string> = {
      none: '',
      sm:   'p-4',
      md:   'p-5',
      lg:   'p-7',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-2xl', variants[variant], paddings[padding], className)}
        style={navyStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props}>{children}</div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-base font-semibold text-text-primary', className)} {...props}>{children}</h3>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-text-secondary mt-0.5', className)} {...props}>{children}</p>
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props}>{children}</div>
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('mt-4 pt-4 border-t border-ops-line flex items-center gap-2', className)} {...props}>{children}</div>
  )
);
CardFooter.displayName = 'CardFooter';
