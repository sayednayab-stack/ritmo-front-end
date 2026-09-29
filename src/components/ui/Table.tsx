'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface TableProps<T> extends HTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  striped?: boolean;
  hoverable?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading,
  emptyMessage = 'No data available',
  onRowClick,
  striped = true,
  hoverable = true,
  className,
  ...props
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-sm', className)} {...props}>
        <thead className="bg-secondary-50 border-b border-secondary-200">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-left font-medium text-secondary-700 uppercase tracking-wider text-xs',
                  column.className
                )}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary-100">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-secondary-500">
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-primary-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-secondary-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  hoverable && 'hover:bg-secondary-50',
                  striped && rowIndex % 2 === 1 && 'bg-secondary-50/50',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn('px-4 py-3 text-secondary-900', column.className)}
                  >
                    {column.render ? column.render(row, rowIndex) : (row as Record<string, unknown>)[column.key] as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
}

export function Pagination({ currentPage, totalPages, onPageChange, showPageNumbers = true }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = showPageNumbers
    ? Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        if (totalPages <= 5) return i + 1;
        if (currentPage <= 3) return i + 1;
        if (currentPage >= totalPages - 2) return totalPages - 4 + i;
        return currentPage - 2 + i;
      })
    : [];

  return (
    <nav className="flex items-center justify-center gap-1 mt-4" aria-label="Pagination">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Button>

      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onPageChange(page)}
          aria-label={`Page ${page}`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </Button>
      ))}

      {showPageNumbers && totalPages > 5 && currentPage > 3 && (
        <span className="px-2 text-secondary-500">...</span>
      )}

      {showPageNumbers && totalPages > 5 && currentPage < totalPages - 2 && (
        <span className="px-2 text-secondary-500">...</span>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>
    </nav>
  );
}