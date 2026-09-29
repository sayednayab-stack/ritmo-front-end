'use client';

import { ResourcePage, FieldDef } from '@/components/resource/ResourcePage';
import { Badge } from '@/components/ui/Badge';
import { PriorityRule } from '@/types';
import { getCMProviderLabel, getSourceSystemLabel } from '@/lib/utils';

const fields: FieldDef[] = [
  {
    key: 'source_system',
    label: 'Source system',
    type: 'select',
    required: true,
    options: ['AI_IRROPS', 'AIX_IRROPS', 'IX_IRROPS', 'EY_CLASS'].map((v) => ({ value: v, label: getSourceSystemLabel(v.toLowerCase()) })),
  },
  { key: 'airline', label: 'Airline code', required: true, placeholder: 'e.g. AI' },
  { key: 'airport_code', label: 'Airport (IATA)', placeholder: 'Blank = any airport', help: 'An airport-specific rule wins over a blank one at the same tier' },
  { key: 'priority_order', label: 'Priority tier', type: 'number', required: true, help: '1 is tried first; later tiers are failover' },
  {
    key: 'cm_provider',
    label: 'CM provider',
    type: 'select',
    required: true,
    options: [
      { value: 'ride', label: 'RIDE' },
      { value: 'iway', label: 'iWay' },
      { value: 'safetrax', label: 'Safetrax' },
    ],
  },
  { key: 'vendor_id', label: 'Vendor', type: 'select', optionsFrom: { endpoint: '/vendors', value: 'id', label: (v) => `${v.name} (${v.code} · ${v.cm_provider})` } },
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
