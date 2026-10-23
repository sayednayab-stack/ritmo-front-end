import { ResourcePage, FieldDef } from '@/components/resource/ResourcePage';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Vendor } from '@/types';
import { getCMProviderLabel } from '@/lib/utils';
import { CM_PROVIDER_OPTIONS } from '@/lib/providers';

const fields: FieldDef[] = [
  { key: 'code', label: 'Code', required: true, createOnly: true, help: "The identifier the CM assigned (e.g. RIDE's tenant_code)" },
  { key: 'name', label: 'Name', required: true },
  {
    key: 'cm_provider',
    label: 'CM provider',
    type: 'select',
    required: true,
    options: CM_PROVIDER_OPTIONS,
  },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'is_active', label: 'Active', type: 'checkbox', defaultValue: true },
];

export default function VendorsPage() {
  return (
    <ResourcePage<Vendor>
      title="Vendors"
      description="Vendors registered with each channel manager; referenced by priority rules"
      noun="Vendor"
      endpoint="/vendors"
      emptyHint="Register the vendor record each channel manager assigned to you, then reference it from a priority rule."
      updateMethod="patch"
      fields={fields}
      columns={[
        { key: 'code', header: 'Code', render: (r) => <span className="font-mono">{r.code}</span> },
        { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
        { key: 'cm_provider', header: 'CM', render: (r) => getCMProviderLabel(r.cm_provider) },
        { key: 'description', header: 'Description', render: (r) => r.description ?? '—' },
        { key: 'is_active', header: 'Status', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
      ]}
    />
  );
}
