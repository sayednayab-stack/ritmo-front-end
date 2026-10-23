import { PageHeader } from '@/components/ui/PageHeader';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { statsApi } from '@/lib/api';
import { getCMProviderLabel, getSourceSystemLabel } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308',
  booked: '#0ea5e9',
  confirmed: '#16a34a',
  modified: '#6366f1',
  cancelled: '#94a3b8',
  completed: '#15803d',
  manual_review: '#f97316',
  failed: '#dc2626',
  rejected: '#b91c1c',
};

const toRows = (rec: Record<string, number>, label: (k: string) => string) =>
  Object.entries(rec).map(([k, v]) => ({ key: k, name: label(k), value: v })).sort((a, b) => b.value - a.value);

export default function AnalyticsPage() {
  const [days, setDays] = useState(14);

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['analytics', days],
    queryFn: () => statsApi.get(days).then((r) => r.data),
    staleTime: 30_000,
  });

  const byStatus = stats ? toRows(stats.by_status, (k) => k.replace(/_/g, ' ')) : [];
  const bySource = stats ? toRows(stats.by_source_system, getSourceSystemLabel) : [];
  const byCm = stats ? toRows(stats.by_cm_provider, (k) => (k === 'unknown' ? 'Unassigned' : getCMProviderLabel(k))) : [];

  const bar = (rows: typeof byStatus, colorFor?: (k: string) => string) => (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 44)}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} stroke="#e2e8f0" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
        <Tooltip cursor={{ fill: '#f1f5f9' }} />
        <Bar dataKey="value" name="Bookings" radius={[0, 4, 4, 0]}>
          {rows.map((r) => (
            <Cell key={r.key} fill={colorFor ? colorFor(r.key) : '#0284c7'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Analytics"
        description="Booking volume and outcomes (active bookings)"
        actions={
          <div className="w-40">
            <Select
              aria-label="Volume window"
              value={String(days)}
              onChange={(e) => setDays(Number(e.target.value))}
              options={[7, 14, 30, 90].map((d) => ({ value: String(d), label: `Last ${d} days` }))}
            />
          </div>
        }
      />

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
          Failed to load analytics
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bookings created per day</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 bg-ops-card2 animate-pulse rounded-lg" />
          ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats?.daily ?? []} margin={{ left: 0, right: 16 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Bookings" stroke="#0284c7" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>By status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="h-48 bg-ops-card2 animate-pulse rounded-lg" /> : bar(byStatus, (k) => STATUS_COLORS[k] ?? '#64748b')}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By source system</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="h-48 bg-ops-card2 animate-pulse rounded-lg" /> : bar(bySource)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By channel manager</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="h-48 bg-ops-card2 animate-pulse rounded-lg" /> : bar(byCm)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
