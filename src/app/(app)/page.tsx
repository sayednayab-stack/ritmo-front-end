'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, BookOpen, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Table } from '@/components/ui/Table';
import { bookingApi, statsApi, errorMessage } from '@/lib/api';
import { formatDate, getSourceSystemLabel } from '@/lib/utils';
import type { Booking, DashboardStats } from '@/types';

function Stat({ label, value, icon, href, tone }: { label: string; value: number; icon: React.ReactNode; href?: string; tone: string }) {
  const body = (
    <Card className="flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-lg ${tone}`}>{icon}</div>
      <div>
        <p className="text-sm text-secondary-500">{label}</p>
        <p className="text-2xl font-bold text-secondary-900">{value}</p>
      </div>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([statsApi.get(), bookingApi.list({ limit: 8 })])
      .then(([s, b]) => {
        setStats(s.data);
        setRecent(b.data.bookings);
      })
      .catch((e) => setError(errorMessage(e, 'Failed to load dashboard')))
      .finally(() => setLoading(false));
  }, []);

  const by = stats?.by_status ?? {};
  const inFlight = (by.pending ?? 0) + (by.booked ?? 0) + (by.modified ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-500">Active bookings across all source systems</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total bookings" value={stats?.total ?? 0} icon={<BookOpen className="h-5 w-5 text-primary-700" />} tone="bg-primary-100" href="/bookings" />
        <Stat label="In progress" value={inFlight} icon={<Clock className="h-5 w-5 text-yellow-700" />} tone="bg-yellow-100" href="/bookings?status=pending" />
        <Stat label="Confirmed" value={(by.confirmed ?? 0) + (by.completed ?? 0)} icon={<CheckCircle2 className="h-5 w-5 text-green-700" />} tone="bg-green-100" />
        <Stat label="Needs attention" value={stats?.needs_attention ?? 0} icon={<AlertTriangle className="h-5 w-5 text-red-700" />} tone="bg-red-100" href="/bookings?status=failed" />
      </div>

      <Card padding="none">
        <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between">
          <CardTitle>Latest bookings</CardTitle>
          <Link href="/bookings" className="text-sm text-primary-600 hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table
            columns={[
              { key: 'passenger_name', header: 'Passenger', render: (b: Booking) => <span className="font-medium">{b.passenger_name}</span> },
              { key: 'source_system', header: 'Source', render: (b: Booking) => getSourceSystemLabel(b.source_system) },
              { key: 'pickup', header: 'Pickup', render: (b: Booking) => `${formatDate(b.pickup_date)} ${b.pickup_time}` },
              { key: 'status', header: 'Status', render: (b: Booking) => <StatusBadge status={b.status} /> },
            ]}
            data={recent}
            isLoading={loading}
            keyExtractor={(b) => String(b.id)}
            emptyMessage="No bookings yet"
          />
        </CardContent>
      </Card>
    </div>
  );
}
