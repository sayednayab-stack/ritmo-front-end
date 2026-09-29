import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function getStatusBadge(status: string): { className: string; label: string } {
  const statusMap: Record<string, { className: string; label: string }> = {
    pending: { className: 'badge-warning', label: 'Pending' },
    booked: { className: 'badge-info', label: 'Booked' },
    confirmed: { className: 'badge-success', label: 'Confirmed' },
    modified: { className: 'badge-info', label: 'Modified' },
    cancelled: { className: 'badge-danger', label: 'Cancelled' },
    completed: { className: 'badge-success', label: 'Completed' },
    failed: { className: 'badge-danger', label: 'Failed' },
    rejected: { className: 'badge-danger', label: 'Rejected' },
    manual_review: { className: 'badge-secondary', label: 'Manual Review' },
    synced: { className: 'badge-success', label: 'Synced' },
    active: { className: 'badge-success', label: 'Active' },
    inactive: { className: 'badge-secondary', label: 'Inactive' },
  };
  return statusMap[status.toLowerCase()] || { className: 'badge-secondary', label: status };
}

export function getSourceSystemLabel(sourceSystem: string): string {
  const labels: Record<string, string> = {
    ai_irrops: 'AI IRROPS',
    aix_irrops: 'AIX IRROPS',
    ix_irrops: 'IX IRROPS',
    ey_class: 'EY Class',
  };
  return labels[sourceSystem] || sourceSystem;
}

export function getCMProviderLabel(provider: string): string {
  const labels: Record<string, string> = {
    iway: 'iWay',
    ride: 'RIDE',
    safetrax: 'Safetrack',
  };
  return labels[provider] || provider;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}