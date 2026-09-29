'use client';

import { useEffect, useState } from 'react';
import api, { errorMessage, priorityApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { getCMProviderLabel, getSourceSystemLabel } from '@/lib/utils';
import type { SourceSystemInfo, VehicleTypeMapping } from '@/types';

interface Me {
  username: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
}

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [systems, setSystems] = useState<SourceSystemInfo[]>([]);
  const [mappings, setMappings] = useState<VehicleTypeMapping[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get<Me>('/auth/me'), priorityApi.sourceSystems(), priorityApi.vehicleMappings()])
      .then(([m, s, v]) => {
        setMe(m.data);
        setSystems(s.data);
        setMappings(v.data);
      })
      .catch((e) => setError(errorMessage(e, 'Failed to load settings')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
        <p className="text-secondary-500">Your account and read-only routing reference data</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          {me ? (
            <dl className="grid gap-4 sm:grid-cols-3 text-sm">
              <div>
                <dt className="text-secondary-500">Username</dt>
                <dd className="font-medium">{me.username}</dd>
              </div>
              <div>
                <dt className="text-secondary-500">Email</dt>
                <dd className="font-medium">{me.email}</dd>
              </div>
              <div>
                <dt className="text-secondary-500">Role</dt>
                <dd>
                  <Badge variant={me.is_admin ? 'info' : 'secondary'}>{me.is_admin ? 'Administrator' : 'User'}</Badge>
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-secondary-500">{loading ? 'Loading…' : '—'}</p>
          )}
        </CardContent>
      </Card>

      <Card padding="none">
        <CardHeader className="p-6 pb-4">
          <CardTitle>Source systems</CardTitle>
          <CardDescription>Fixed in the backend registry; determines the default CM and dispatch mode</CardDescription>
        </CardHeader>
        <Table
          columns={[
            { key: 'value', header: 'Source system', render: (r: SourceSystemInfo) => getSourceSystemLabel(r.value) },
            { key: 'cm_provider', header: 'Default CM', render: (r: SourceSystemInfo) => getCMProviderLabel(r.cm_provider) },
            { key: 'sync_dispatch', header: 'Dispatch', render: (r: SourceSystemInfo) => (r.sync_dispatch ? 'Synchronous' : 'Scheduled') },
          ]}
          data={systems}
          isLoading={loading}
          keyExtractor={(r) => r.value}
        />
      </Card>

      <Card padding="none">
        <CardHeader className="p-6 pb-4">
          <CardTitle>Vehicle type mappings</CardTitle>
          <CardDescription>How IRROPS vehicle codes translate into each CM&apos;s vocabulary</CardDescription>
        </CardHeader>
        <Table
          columns={[
            { key: 'source_vehicle_type', header: 'Source vehicle type' },
            { key: 'cm_provider', header: 'CM', render: (r: VehicleTypeMapping) => getCMProviderLabel(r.cm_provider) },
            { key: 'cm_vehicle_code', header: 'CM vehicle code', render: (r: VehicleTypeMapping) => <span className="font-mono">{r.cm_vehicle_code}</span> },
          ]}
          data={mappings}
          isLoading={loading}
          keyExtractor={(r) => String(r.id)}
          emptyMessage="No mappings configured"
        />
      </Card>
    </div>
  );
}
