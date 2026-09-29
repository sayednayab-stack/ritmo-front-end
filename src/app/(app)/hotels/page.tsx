'use client';

import { ResourcePage, FieldDef } from '@/components/resource/ResourcePage';

interface Hotel {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string | null;
}

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'address', label: 'Address', required: true },
  { key: 'city', label: 'City', required: true },
  { key: 'country', label: 'Country', required: true },
  { key: 'phone', label: 'Phone' },
];

export default function HotelsPage() {
  return (
    <ResourcePage<Hotel>
      title="Hotels"
      description="Hotel registry for pickup and drop locations"
      noun="Hotel"
      endpoint="/hotels"
      fields={fields}
      columns={[
        { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
        { key: 'address', header: 'Address' },
        { key: 'city', header: 'City' },
        { key: 'country', header: 'Country' },
        { key: 'phone', header: 'Phone', render: (r) => r.phone ?? '—' },
      ]}
    />
  );
}
