import { ResourcePage, FieldDef } from '@/components/resource/ResourcePage';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface Partner {
  id: number;
  name: string;
  partner_type: string;
  api_url: string | null;
  username: string | null;
  status: string;
}

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', required: true },
  {
    key: 'partner_type',
    label: 'Type',
    type: 'select',
    required: true,
    options: ['internal', 'iway', 'safetrack', 'external'].map((v) => ({ value: v, label: v })),
  },
  { key: 'api_url', label: 'API URL' },
  { key: 'username', label: 'Username' },
  { key: 'password', label: 'Password', secret: true },
  { key: 'api_key', label: 'API key', secret: true },
  { key: 'user_id', label: 'User ID' },
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
  { key: 'config', label: 'Config', type: 'textarea' },
];

export default function PartnersPage() {
  return (
    <ResourcePage<Partner>
      title="Partners"
      description="Channel partners and their integration credentials"
      noun="Partner"
      endpoint="/partners"
      fields={fields}
      columns={[
        { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
        { key: 'partner_type', header: 'Type', className: 'capitalize' },
        { key: 'api_url', header: 'API URL', render: (r) => r.api_url ?? '—' },
        { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
