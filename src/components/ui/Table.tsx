import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

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
  columns, data, keyExtractor,
  isLoading, emptyMessage = 'No data available',
  onRowClick, striped = false, hoverable = true,
  className, ...props
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className={cn('w-full text-sm', className)} {...props}>
        <thead className="bg-ops-card2 border-b border-border sticky top-0">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary',
                  col.className
                )}
                scope="col"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ops-line bg-ops-card">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5">
                    <div className={cn('h-3.5 rounded-full skeleton', col.className ? 'w-3/4' : 'w-2/3')} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className="w-12 h-12 rounded-xl bg-ops-card2 flex items-center justify-center">
                    <Inbox className="h-5 w-5 text-text-tertiary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-text-secondary">No results</p>
                    {emptyMessage !== 'No data available' && (
                      <p className="text-xs text-text-tertiary mt-0.5">{emptyMessage}</p>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  'transition-colors duration-100',
                  hoverable && 'hover:bg-ops-bg',
                  striped && idx % 2 === 1 && 'bg-ops-bg/40',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3.5 text-text-primary', col.className)}>
                    {col.render
                      ? col.render(row, idx)
                      : (row as Record<string, unknown>)[col.key] as React.ReactNode}
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
    <nav className="flex items-center justify-between mt-4 px-1" aria-label="Pagination">
      <p className="text-xs text-text-secondary">Page <span className="font-semibold text-text-primary">{currentPage}</span> of {totalPages}</p>
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous">
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        {pages.map((page) => (
          <Button
            key={page}
            size="sm"
            variant={page === currentPage ? 'primary' : 'ghost'}
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            className={page !== currentPage ? 'text-text-secondary' : ''}
          >
            {page}
          </Button>
        ))}
        {showPageNumbers && totalPages > 5 && currentPage < totalPages - 2 && (
          <span className="px-1 text-text-tertiary text-xs">…</span>
        )}
        <Button variant="secondary" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next">
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </nav>
  );
}
