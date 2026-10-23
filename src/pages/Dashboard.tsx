import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Sparkline } from '@/components/ui/Sparkline';
import { errorMessage } from '@/lib/api';
import { useBookings, useDashboardStats, useMe } from '@/lib/queries';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatDateTime, getSourceSystemLabel, getCMProviderLabel } from '@/lib/utils';
import type { Booking } from '@/types';

const REFRESH_INTERVAL = 30;

interface StatProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  href?: string;
  iconBg: string;
  /** Share of all bookings, 0-1; drawn as a thin progress line. */
  share?: number;
  trend?: number[];
  trendColor?: string;
  loading?: boolean;
}

function Stat({ label, value, icon, href, iconBg, share, trend, trendColor, loading }: StatProps) {
  const body = (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift hover:border-brand-blue/25">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-soft ${iconBg}`}>{icon}</div>
        {href && (
          <span className="text-[11px] font-mono uppercase tracking-wider text-text-tertiary opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
            View →
          </span>
        )}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-tertiary font-mono mb-1.5">{label}</p>
      {loading ? (
        <div className="h-9 w-20 rounded-lg skeleton" />
      ) : (
        <p className="font-serif text-[2.1rem] font-medium text-text-primary tabular-nums leading-none">{value.toLocaleString()}</p>
      )}
      {trend && trend.length > 1 ? (
        <Sparkline values={trend} color={trendColor} className="absolute bottom-0 right-0 h-12 w-1/2 opacity-90" />
      ) : share !== undefined ? (
        <div className="mt-4 flex items-center gap-2">
          <div className="h-1 flex-1 rounded-full bg-ops-card2 overflow-hidden">
            <div className={`h-full rounded-full ${iconBg} transition-all duration-700 ease-expo-out`} style={{ width: `${Math.round(share * 100)}%` }} />
          </div>
          <span className="font-mono text-[10px] text-text-tertiary tabular-nums">{Math.round(share * 100)}%</span>
        </div>
      ) : null}
    </Card>
  );
  return href ? <Link to={href} className="block rounded-2xl">{body}</Link> : body;
}

const STATUS_COLOR: Record<string, string> = {
  confirmed: '#1F7A44', completed: '#4C9F70', booked: '#072D62', modified: '#2B5EA7',
  pending: '#C68A3E', manual_review: '#E0A95C', failed: '#C4432B', rejected: '#D9705B', cancelled: '#B8BDC7',
};

function Breakdown({ title, data, colorFor, loading }: { title: string; data: Record<string, number>; colorFor: (k: string, i: number) => string; loading: boolean }) {
  const rows = Object.entries(data).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((n, [, v]) => n + v, 0);
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-4 rounded-full skeleton" />)}</div>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-tertiary">No data yet</p>
      ) : (
        <>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-ops-card2" role="img" aria-label={`${title}: ${rows.map(([k, v]) => `${k} ${v}`).join(', ')}`}>
            {rows.map(([k, v], i) => (
              <div key={k} style={{ width: `${(v / total) * 100}%`, background: colorFor(k, i) }} className="h-full first:rounded-l-full last:rounded-r-full" />
            ))}
          </div>
          <ul className="mt-4 space-y-2.5">
            {rows.slice(0, 6).map(([k, v], i) => (
              <li key={k} className="flex items-center gap-2.5 text-sm">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: colorFor(k, i) }} aria-hidden="true" />
                <span className="flex-1 truncate capitalize text-text-secondary">{k.replace(/_/g, ' ')}</span>
                <span className="font-semibold tabular-nums text-text-primary">{v.toLocaleString()}</span>
                <span className="w-10 text-right font-mono text-[11px] tabular-nums text-text-tertiary">{Math.round((v / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

const PALETTE = ['#072D62', '#B39661', '#2B5EA7', '#4C9F70', '#C68A3E', '#8A909C'];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function DashboardPage() {
  const { addToast } = useToast();
  // Refreshes quietly every 30s; TanStack Query pauses polling while the tab is hidden.
  const statsQuery = useDashboardStats(14, REFRESH_INTERVAL * 1000);
  const recentQuery = useBookings({ limit: 8, page: 1 }, REFRESH_INTERVAL * 1000);
  const stats = statsQuery.data ?? null;
  const recent = recentQuery.data?.bookings ?? [];
  const loading = statsQuery.isLoading || recentQuery.isLoading;
  const refreshing = statsQuery.isFetching || recentQuery.isFetching;
  const updatedAt = Math.max(statsQuery.dataUpdatedAt, recentQuery.dataUpdatedAt);
  const error = statsQuery.error ?? recentQuery.error;

  useEffect(() => {
    if (error) addToast({ type: 'error', title: 'Failed to load dashboard', message: errorMessage(error) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const refresh = () => {
    statsQuery.refetch();
    recentQuery.refetch();
  };

  const { data: me } = useMe();
  const by = stats?.by_status ?? {};
  const shareOf = (n: number) => (stats?.total ? n / stats.total : 0);
  const inFlight = (by.pending ?? 0) + (by.booked ?? 0) + (by.modified ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title={me?.username ? `${greeting()}, ${me.username}` : 'Dashboard'}
        description="Active bookings across all source systems"
        actions={
          <>
            {updatedAt > 0 && (
              <span className="hidden sm:block font-mono text-[11px] text-text-tertiary" aria-live="off">
                Updated {formatDateTime(new Date(updatedAt).toISOString())}
              </span>
            )}
            <Button variant="secondary" onClick={refresh} aria-label="Refresh dashboard">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </>
        }
      />

      <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Total bookings"
          value={stats?.total ?? 0}
          loading={loading}
          icon={<BookOpen className="text-white" style={{ width: '1.125rem', height: '1.125rem' }} />}
          iconBg="bg-brand-blue"
          href="/bookings"
          trend={(stats?.daily ?? []).map((d) => d.count)}
          trendColor="#072D62"
        />
        <Stat
          label="In progress"
          value={inFlight}
          loading={loading}
          icon={<Clock className="text-white" style={{ width: '1.125rem', height: '1.125rem' }} />}
          iconBg="bg-alert-amber"
          href="/bookings?status=pending,booked,modified"
          share={shareOf(inFlight)}
        />
        <Stat
          label="Confirmed"
          value={(by.confirmed ?? 0) + (by.completed ?? 0)}
          loading={loading}
          icon={<CheckCircle2 className="text-white" style={{ width: '1.125rem', height: '1.125rem' }} />}
          iconBg="bg-success"
          href="/bookings?status=confirmed,completed"
          share={shareOf((by.confirmed ?? 0) + (by.completed ?? 0))}
        />
        <Stat
          label="Needs attention"
          value={stats?.needs_attention ?? 0}
          loading={loading}
          icon={<AlertTriangle className="text-white" style={{ width: '1.125rem', height: '1.125rem' }} />}
          iconBg="bg-danger"
          href="/bookings?status=failed,manual_review,rejected"
          share={shareOf(stats?.needs_attention ?? 0)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown title="By status" data={by} loading={loading} colorFor={(k, i) => STATUS_COLOR[k] ?? PALETTE[i % PALETTE.length]} />
        <Breakdown title="By source system" data={stats?.by_source_system ?? {}} loading={loading} colorFor={(_, i) => PALETTE[i % PALETTE.length]} />
      </div>

      <Card padding="none">
        <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between">
          <CardTitle>Latest bookings</CardTitle>
          <Link to="/bookings" className="text-xs font-mono uppercase tracking-wider text-text-tertiary hover:text-text-primary transition-colors">
            View all →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table
            columns={[
              { key: 'passenger_name', header: 'Passenger', render: (b: Booking) => <span className="font-medium text-text-primary">{b.passenger_name}</span> },
              { key: 'source_system', header: 'Source', render: (b: Booking) => getSourceSystemLabel(b.source_system) },
              { key: 'cm_provider', header: 'CM', render: (b: Booking) => (b.cm_provider ? getCMProviderLabel(b.cm_provider) : <span className="text-text-tertiary">—</span>) },
              { key: 'flight_number', header: 'Flight', render: (b: Booking) => b.flight_number ?? <span className="text-text-tertiary">—</span> },
              { key: 'pickup', header: 'Pickup', render: (b: Booking) => <span className="font-mono text-xs">{formatDate(b.pickup_date)} {b.pickup_time}</span> },
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
