'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const fieldBase =
  'w-full h-10 px-3 bg-ops-card border border-border rounded-lg text-sm text-text-primary ' +
  'placeholder-text-tertiary ' +
  'transition-all duration-150 ' +
  'hover:border-[#C2C7CF] ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue ' +
  'disabled:bg-ops-card2 disabled:text-text-tertiary disabled:cursor-not-allowed';

const fieldBoxShadow = 'inset 0 1px 1px rgba(7,45,98,.03)';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, style, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-text-primary mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(fieldBase, error ? 'border-danger focus:ring-danger/20' : '', className)}
          style={{ boxShadow: fieldBoxShadow, ...style }}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs text-text-tertiary">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string; helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, style, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="block text-xs font-semibold text-text-primary mb-1.5">{label}</label>}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(fieldBase, 'h-auto min-h-[80px] py-2 resize-y', error ? 'border-danger focus:ring-danger/20' : '', className)}
          style={{ boxShadow: fieldBoxShadow, ...style }}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs text-text-tertiary">{helperText}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string; helperText?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, id, options, placeholder, style, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && <label htmlFor={selectId} className="block text-xs font-semibold text-text-primary mb-1.5">{label}</label>}
        <select
          ref={ref}
          id={selectId}
          className={cn(fieldBase, 'appearance-none cursor-pointer', error ? 'border-danger focus:ring-danger/20' : '', className)}
          style={{ boxShadow: fieldBoxShadow, ...style }}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs text-text-tertiary">{helperText}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
