import { Badge } from './Badge';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';

const VARIANTS: Record<string, Variant> = {
  pending: 'warning',
  booked: 'info',
  confirmed: 'success',
  modified: 'info',
  cancelled: 'danger',
  completed: 'success',
  failed: 'danger',
  rejected: 'danger',
  manual_review: 'warning',
  synced: 'success',
  active: 'success',
  inactive: 'secondary',
  available: 'success',
  assigned: 'info',
  maintenance: 'warning',
  breakdown: 'danger',
  created: 'secondary',
  submitted: 'info',
  accepted: 'info',
  vehicle_allotted: 'info',
  journey_started: 'info',
  journey_ended: 'success',
  paid: 'success',
  unpaid: 'warning',
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-secondary-400">—</span>;
  const label = status.replace(/_/g, ' ');
  return (
    <Badge variant={VARIANTS[status.toLowerCase()] ?? 'secondary'} className="capitalize">
      {label}
    </Badge>
  );
}
