'use client';

import api from '@/lib/api';
import { ResourcePage, FieldDef, RowAction } from '@/components/resource/ResourcePage';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime } from '@/lib/utils';

interface FleetRequest {
  id: number;
  request_no: string;
  passenger_name: string;
  from_location: string;
  to_location: string;
  scheduled_time: string;
  passenger_count: number;
  status: string;
  partner: { name: string } | null;
}

const STATUSES = [
  'created', 'submitted', 'accepted', 'vehicle_allotted', 'journey_started', 'journey_ended',
  'cancelled', 'breakdown_reported', 'reallocation_pending', 'waiting_for_vehicle',
];

const fields: FieldDef[] = [
  { key: 'request_no', label: 'Request no.', required: true, createOnly: true },
  { key: 'passenger_name', label: 'Passenger name', required: true },
  { key: 'passenger_phone', label: 'Passenger phone' },
  { key: 'from_location', label: 'From', required: true },
  { key: 'to_location', label: 'To', required: true },
  { key: 'scheduled_time', label: 'Scheduled time', type: 'datetime', required: true },
  { key: 'passenger_count', label: 'Passengers', type: 'number', required: true },
  { key: 'status', label: 'Status', type: 'select', required: true, createOnly: true, options: STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })), help: 'Changed afterwards with the workflow buttons' },
  { key: 'partner_id', label: 'Partner', type: 'select', optionsFrom: { endpoint: '/partners', value: 'id', label: (p) => p.name } },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

// Mirrors the transitions enforced by PATCH /fleet_requests/{id}/status/{status}.
const NEXT: Record<string, string> = {
  created: 'submitted',
  submitted: 'accepted',
  accepted: 'vehicle_allotted',
  vehicle_allotted: 'journey_started',
  journey_started: 'journey_ended',
};

const advance = (to: string) => (row: FleetRequest) => api.patch(`/fleet_requests/${row.id}/status/${to}`);

const actions: RowAction<FleetRequest>[] = [
  {
    label: 'Advance',
    show: (r) => r.status in NEXT,
    run: (r) => advance(NEXT[r.status])(r),
  },
  {
    label: 'Cancel',
    show: (r) => ['created', 'submitted', 'accepted', 'vehicle_allotted'].includes(r.status),
    confirm: 'Cancel this fleet request?',
    run: advance('cancelled'),
  },
];

export default function FleetRequestsPage() {
  return (
    <ResourcePage<FleetRequest>
      title="Fleet Requests"
      description="Transfer requests and their lifecycle"
      noun="Fleet request"
      endpoint="/fleet_requests"
      fields={fields}
      rowActions={actions}
      columns={[
        { key: 'request_no', header: 'Request', render: (r) => <span className="font-mono font-medium">{r.request_no}</span> },
        { key: 'passenger_name', header: 'Passenger', render: (r) => `${r.passenger_name} (${r.passenger_count})` },
        { key: 'route', header: 'Route', render: (r) => `${r.from_location} → ${r.to_location}` },
        { key: 'scheduled_time', header: 'Scheduled', render: (r) => formatDateTime(r.scheduled_time) },
        { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        { key: 'partner', header: 'Partner', render: (r) => r.partner?.name ?? '—' },
      ]}
    />
  );
}
