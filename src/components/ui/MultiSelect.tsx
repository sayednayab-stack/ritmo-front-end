'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, forwardRef } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  label?: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  searchable?: boolean;
  maxSelected?: number;
  id?: string;
}

export const MultiSelect = forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ label, options, value, onChange, placeholder = 'Select options...', error, helperText, disabled, searchable = true, maxSelected, id, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const selectedCount = value.length;
    const filteredOptions = searchable
      ? options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
      : options;

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    };

    const toggleOption = (optionValue: string) => {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue));
      } else if (!maxSelected || value.length < maxSelected) {
        onChange([...value, optionValue]);
      }
    };

    const removeSelected = (optionValue: string) => {
      onChange(value.filter((v) => v !== optionValue));
    };

    const isMaxReached = maxSelected && value.length >= maxSelected;

    return (
      <div ref={containerRef} className="w-full" {...props}>
        {label && (
          <label htmlFor={`${id}-multiselect`} className="block text-sm font-medium text-secondary-700 mb-1">
            {label}
          </label>
        )}

        <div
          className={cn(
            'relative',
            'border rounded-lg bg-white transition-colors',
            'focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500',
            error ? 'border-red-500' : 'border-secondary-300',
            disabled && 'bg-secondary-50 cursor-not-allowed',
            isOpen && 'border-primary-500'
          )}
        >
          <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 min-h-[42px]">
            {value.map((val) => {
              const option = options.find((o) => o.value === val);
              return (
                <span
                  key={val}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-sm"
                >
                  <span>{option?.label || val}</span>
                  <button
                    type="button"
                    onClick={() => removeSelected(val)}
                    disabled={disabled}
                    className="text-primary-600 hover:text-primary-800 p-0.5"
                    aria-label={`Remove ${option?.label || val}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}

            {isOpen && searchable && (
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsOpen(true)}
                onClick={(e) => e.stopPropagation()}
                placeholder={value.length > 0 ? '' : placeholder}
                disabled={disabled || !!isMaxReached}
                className="flex-1 min-w-[120px] bg-transparent border-none focus:outline-none text-sm text-secondary-900 placeholder:text-secondary-400"
                aria-autocomplete="list"
                aria-controls={`${id}-options`}
                aria-expanded={isOpen}
              />
            )}

            {!isOpen && (
              <span className="flex-1 text-sm text-secondary-500">{placeholder}</span>
            )}

            {!disabled && (
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 text-secondary-400 hover:text-secondary-600"
                aria-label={isOpen ? 'Close options' : 'Open options'}
                aria-expanded={isOpen}
              >
                <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
              </button>
            )}
          </div>

          {isOpen && (
            <div
              id={`${id}-options`}
              role="listbox"
              aria-multiselectable="true"
              className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-auto"
            >
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-secondary-500 text-sm">
                  {searchable ? 'No matching options' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled || !!(isMaxReached && !isSelected)}
                      onClick={() => !option.disabled && !(isMaxReached && !isSelected) && toggleOption(option.value)}
                      onMouseDown={(e) => e.preventDefault()}
                      disabled={option.disabled || !!(isMaxReached && !isSelected)}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2',
                        isSelected
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-secondary-700 hover:bg-secondary-50',
                        option.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {isSelected && <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />}
                      <span className="flex-1">{option.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-secondary-500">{helperText}</p>
        )}
        {maxSelected && (
          <p className="mt-1 text-xs text-secondary-500">
            {selectedCount}/{maxSelected} selected
          </p>
        )}
      </div>
    );
  }
);

MultiSelect.displayName = 'MultiSelect';