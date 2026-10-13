'use client';

import { Play, Square } from 'lucide-react';
import api from '@/lib/api';
import { ResourcePage, FieldDef, RowAction } from '@/components/resource/ResourcePage';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime } from '@/lib/utils';

interface Journey {
  id: number;
  status: string;
  start_time: string | null;
  end_time: string | null;
  distance_km: number | null;
  total_cost: number | null;
  payment_status: string | null;
  fleet_request: { request_no: string; from_location: string; to_location: string } | null;
  fleet: { registration_no: string } | null;
  driver: { name: string } | null;
}

const fields: FieldDef[] = [
  {
    key: 'fleet_request_id',
    label: 'Fleet request',
    type: 'select',
    required: true,
    createOnly: true,
    help: 'Must be in the accepted state',
    optionsFrom: { endpoint: '/fleet_requests', value: 'id', label: (r) => `${r.request_no} · ${r.passenger_name} (${r.status.replace(/_/g, ' ')})` },
  },
  {
    key: 'fleet_id',
    label: 'Vehicle',
    type: 'select',
    required: true,
    help: 'Must be available',
    optionsFrom: { endpoint: '/fleet', value: 'id', label: (v) => `${v.registration_no} (${v.status})` },
  },
  {
    key: 'driver_id',
    label: 'Driver',
    type: 'select',
    required: true,
    help: 'Must be active',
    optionsFrom: { endpoint: '/drivers', value: 'id', label: (d) => `${d.name} (${d.status})` },
  },
  { key: 'start_time', label: 'Planned start', type: 'datetime' },
  { key: 'end_time', label: 'Planned end', type: 'datetime' },
  { key: 'distance_km', label: 'Distance (km)', type: 'number', step: 'any' },
];

const actions: RowAction<Journey>[] = [
  {
    label: 'Start',
    icon: <Play className="h-3.5 w-3.5 mr-1" />,
    show: (j) => j.status === 'assigned',
    run: (j) => api.patch(`/journeys/${j.id}/start`),
  },
  {
    label: 'End',
    icon: <Square className="h-3.5 w-3.5 mr-1" />,
    show: (j) => j.status === 'started',
    confirm: 'End this journey? The vehicle will be released.',
    run: (j) => api.patch(`/journeys/${j.id}/end`),
  },
];

export default function JourneysPage() {
  return (
    <ResourcePage<Journey>
      title="Journeys"
      description="Vehicle and driver assignments for fleet requests"
      noun="Journey"
      endpoint="/journeys"
      fields={fields}
      canDelete={false}
      rowActions={actions}
      editableKeys={['fleet_id', 'driver_id', 'start_time', 'end_time', 'distance_km']}
      columns={[
        { key: 'id', header: '#', render: (j) => <span className="font-mono">{j.id}</span> },
        {
          key: 'request',
          header: 'Request',
          render: (j) =>
            j.fleet_request ? (
              <div>
                <div className="font-medium">{j.fleet_request.request_no}</div>
                <div className="text-xs text-text-secondary">
                  {j.fleet_request.from_location} → {j.fleet_request.to_location}
                </div>
              </div>
            ) : (
              '—'
            ),
        },
        { key: 'fleet', header: 'Vehicle', render: (j) => j.fleet?.registration_no ?? '—' },
        { key: 'driver', header: 'Driver', render: (j) => j.driver?.name ?? '—' },
        { key: 'status', header: 'Status', render: (j) => <StatusBadge status={j.status} /> },
        { key: 'start_time', header: 'Start', render: (j) => (j.start_time ? formatDateTime(j.start_time) : '—') },
        { key: 'distance_km', header: 'km', render: (j) => j.distance_km ?? '—' },
      ]}
    />
  );
}
