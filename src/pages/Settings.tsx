import { useEffect, useState } from 'react';
import api, { errorMessage, priorityApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
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
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    Promise.all([api.get<Me>('/auth/me'), priorityApi.sourceSystems(), priorityApi.vehicleMappings()])
      .then(([m, s, v]) => {
        setMe(m.data);
        setSystems(s.data);
        setMappings(v.data);
      })
      .catch((e) => addToast({ type: 'error', title: 'Failed to load settings', message: errorMessage(e) }))
      .finally(() => setLoading(false));
  }, [addToast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-text-primary">Settings</h1>
        <p className="text-text-secondary">Your account and read-only routing reference data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-3 w-20 skeleton rounded mb-2" />
                  <div className="h-4 w-32 skeleton rounded" />
                </div>
              ))}
            </div>
          ) : me ? (
            <dl className="grid gap-4 sm:grid-cols-3 text-sm">
              <div>
                <dt className="text-text-secondary">Username</dt>
                <dd className="font-medium">{me.username}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Email</dt>
                <dd className="font-medium">{me.email}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Role</dt>
                <dd>
                  <Badge variant={me.is_admin ? 'info' : 'secondary'}>{me.is_admin ? 'Administrator' : 'User'}</Badge>
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-text-secondary">—</p>
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
