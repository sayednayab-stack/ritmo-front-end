import { ResourcePage, FieldDef } from '@/components/resource/ResourcePage';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface Vehicle {
  id: number;
  registration_no: string;
  type: string;
  category: string;
  capacity: number;
  status: string;
  location: string | null;
  partner: { name: string } | null;
}

const opt = (...v: string[]) => v.map((x) => ({ value: x, label: x[0].toUpperCase() + x.slice(1) }));

const fields: FieldDef[] = [
  { key: 'registration_no', label: 'Registration no.', required: true },
  { key: 'type', label: 'Type', type: 'select', required: true, options: opt('car', 'bus', 'van', 'suv') },
  { key: 'category', label: 'Category', type: 'select', required: true, options: opt('standard', 'business', 'minivan', 'luxury') },
  { key: 'capacity', label: 'Capacity (seats)', type: 'number', required: true },
  { key: 'status', label: 'Status', type: 'select', required: true, options: opt('available', 'assigned', 'maintenance', 'inactive', 'breakdown') },
  { key: 'partner_id', label: 'Partner', type: 'select', optionsFrom: { endpoint: '/partners', value: 'id', label: (p) => p.name } },
  { key: 'location', label: 'Location' },
];

export default function FleetPage() {
  return (
    <ResourcePage<Vehicle>
      title="Vehicles"
      description="Fleet inventory"
      noun="Vehicle"
      endpoint="/fleet"
      fields={fields}
      columns={[
        { key: 'registration_no', header: 'Registration', render: (r) => <span className="font-medium">{r.registration_no}</span> },
        { key: 'type', header: 'Type', className: 'capitalize' },
        { key: 'category', header: 'Category', className: 'capitalize' },
        { key: 'capacity', header: 'Seats' },
        { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        { key: 'partner', header: 'Partner', render: (r) => r.partner?.name ?? '—' },
        { key: 'location', header: 'Location', render: (r) => r.location ?? '—' },
      ]}
    />
  );
}
