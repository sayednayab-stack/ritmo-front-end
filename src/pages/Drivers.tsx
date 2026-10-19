import { ResourcePage, FieldDef } from '@/components/resource/ResourcePage';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface Driver {
  id: number;
  name: string;
  license_no: string;
  phone: string;
  status: string;
  partner: { name: string } | null;
}

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'license_no', label: 'Licence no.', required: true },
  { key: 'phone', label: 'Phone', required: true },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
  { key: 'partner_id', label: 'Partner', type: 'select', optionsFrom: { endpoint: '/partners', value: 'id', label: (p) => p.name } },
];

export default function DriversPage() {
  return (
    <ResourcePage<Driver>
      title="Drivers"
      description="Driver profiles and partner assignment"
      noun="Driver"
      endpoint="/drivers"
      fields={fields}
      columns={[
        { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
        { key: 'license_no', header: 'Licence' },
        { key: 'phone', header: 'Phone' },
        { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        { key: 'partner', header: 'Partner', render: (r) => r.partner?.name ?? '—' },
      ]}
    />
  );
}
