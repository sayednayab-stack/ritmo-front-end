import { Badge } from './Badge';

type Variant = 'default' | 'navy' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'gold';

interface StatusCfg { variant: Variant; dot: string; }

const STATUS: Record<string, StatusCfg> = {
  pending:          { variant: 'warning',   dot: 'bg-alert-amber' },
  booked:           { variant: 'navy',      dot: 'bg-brand-wine' },
  confirmed:        { variant: 'success',   dot: 'bg-success' },
  modified:         { variant: 'info',      dot: 'bg-brand-wine-hover' },
  cancelled:        { variant: 'secondary', dot: 'bg-text-tertiary' },
  completed:        { variant: 'success',   dot: 'bg-success' },
  failed:           { variant: 'danger',    dot: 'bg-danger' },
  rejected:         { variant: 'danger',    dot: 'bg-danger' },
  manual_review:    { variant: 'warning',   dot: 'bg-alert-amber' },
  synced:           { variant: 'success',   dot: 'bg-success' },
  active:           { variant: 'success',   dot: 'bg-success' },
  inactive:         { variant: 'secondary', dot: 'bg-text-tertiary' },
  available:        { variant: 'success',   dot: 'bg-success' },
  assigned:         { variant: 'navy',      dot: 'bg-brand-wine' },
  maintenance:      { variant: 'warning',   dot: 'bg-alert-amber' },
  breakdown:        { variant: 'danger',    dot: 'bg-danger' },
  created:          { variant: 'secondary', dot: 'bg-text-tertiary' },
  submitted:        { variant: 'info',      dot: 'bg-brand-wine-hover' },
  accepted:         { variant: 'navy',      dot: 'bg-brand-wine' },
  vehicle_allotted: { variant: 'info',      dot: 'bg-brand-wine-hover' },
  journey_started:  { variant: 'info',      dot: 'bg-brand-wine' },
  journey_ended:    { variant: 'success',   dot: 'bg-success' },
  paid:             { variant: 'success',   dot: 'bg-success' },
  unpaid:           { variant: 'warning',   dot: 'bg-alert-amber' },
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-text-tertiary text-xs">—</span>;
  const key = status.toLowerCase();
  const cfg = STATUS[key] ?? { variant: 'secondary' as Variant, dot: 'bg-text-tertiary' };
  return (
    <Badge variant={cfg.variant}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} aria-hidden="true" />
      <span className="capitalize">{status.replace(/_/g, ' ')}</span>
    </Badge>
  );
}
