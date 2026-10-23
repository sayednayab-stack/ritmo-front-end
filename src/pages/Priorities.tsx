import { ResourcePage, FieldDef } from '@/components/resource/ResourcePage';
import { Badge } from '@/components/ui/Badge';
import { PriorityRule } from '@/types';
import { getCMProviderLabel, getSourceSystemLabel } from '@/lib/utils';
import { CM_PROVIDER_OPTIONS } from '@/lib/providers';

const fields: FieldDef[] = [
  {
    key: 'source_system',
    label: 'Source system',
    type: 'select',
    required: true,
    // From the backend's source-system registry, so new source systems appear without a UI change.
    optionsFrom: { endpoint: '/admin/source-systems', value: 'value', label: (s) => getSourceSystemLabel(s.value) },
  },
  { key: 'airline', label: 'Airline code', required: true, placeholder: 'e.g. AI' },
  { key: 'airport_code', label: 'Airport (IATA)', placeholder: 'Blank = any airport', help: 'An airport-specific rule wins over a blank one at the same tier' },
  { key: 'priority_order', label: 'Priority tier', type: 'number', required: true, help: '1 is tried first; later tiers are failover' },
  {
    key: 'cm_provider',
    label: 'CM provider',
    type: 'select',
    required: true,
    options: CM_PROVIDER_OPTIONS,
    resetOnChange: ['vendor_id'],
  },
  {
    key: 'vendor_id',
    label: 'Vendor',
    type: 'select',
    help: 'Only active vendors of the selected CM are listed',
    optionsFrom: {
      endpoint: '/vendors',
      value: 'id',
      label: (v) => `${v.name} (${v.code})`,
      filter: (v, form) => v.is_active && v.cm_provider === form.cm_provider,
    },
  },
  { key: 'waiting_time_seconds', label: 'Wait before failover (s)', type: 'number', required: true },
  { key: 'modify_cutoff_seconds', label: 'Modify cut-off (s)', type: 'number', required: true },
];

export default function PrioritiesPage() {
  return (
    <ResourcePage<PriorityRule>
      title="Priority Rules"
      description="Which channel manager to try, in what order, per source system, airline and airport"
      noun="Rule"
      endpoint="/admin/priority-rules"
      emptyHint="A rule says which channel manager to try first (and which to fail over to) for a source system, airline and airport. Without one, dispatch lookups return 404."
      updateMethod="patch"
      fields={fields}
      columns={[
        { key: 'source_system', header: 'Source', render: (r) => getSourceSystemLabel(r.source_system.toLowerCase()) },
        { key: 'airline', header: 'Airline', render: (r) => <span className="font-mono">{r.airline}</span> },
        { key: 'airport_code', header: 'Airport', render: (r) => (r.airport_code ? <span className="font-mono">{r.airport_code}</span> : <Badge variant="secondary">Any</Badge>) },
        { key: 'priority_order', header: 'Tier', render: (r) => <Badge variant="info">#{r.priority_order}</Badge> },
        { key: 'cm_provider', header: 'CM', render: (r) => getCMProviderLabel(r.cm_provider) },
        { key: 'vendor', header: 'Vendor', render: (r) => (r.vendor_name ? `${r.vendor_name} (${r.vendor_code})` : '—') },
        { key: 'waiting_time_seconds', header: 'Wait', render: (r) => `${r.waiting_time_seconds}s` },
        { key: 'modify_cutoff_seconds', header: 'Modify cut-off', render: (r) => `${r.modify_cutoff_seconds}s` },
      ]}
    />
  );
}
