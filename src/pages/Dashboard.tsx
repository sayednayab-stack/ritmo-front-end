import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { bookingApi, statsApi, errorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { formatDate, getSourceSystemLabel, getCMProviderLabel } from '@/lib/utils';
import type { Booking, DashboardStats } from '@/types';

const REFRESH_INTERVAL = 30;

interface StatProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  href?: string;
  iconBg: string;
}

function Stat({ label, value, icon, href, iconBg }: StatProps) {
  const body = (
    <Card className="group transition-all duration-200 hover:-translate-y-px cursor-default">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
        {href && (
          <span className="text-[11px] font-mono uppercase tracking-wider text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
            View →
          </span>
        )}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-tertiary font-mono mb-1">{label}</p>
      <p className="font-serif text-3xl font-medium text-text-primary tabular-nums leading-none">{value.toLocaleString()}</p>
    </Card>
  );
  return href ? <Link to={href}>{body}</Link> : body;
}

export default function DashboardPage() {
  const { addToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const countdownRef = useRef(REFRESH_INTERVAL);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [s, b] = await Promise.all([statsApi.get(), bookingApi.list({ limit: 8 })]);
      setStats(s.data);
      setRecent(b.data.bookings);
      if (silent) addToast({ type: 'info', title: 'Dashboard refreshed', duration: 2000 });
    } catch (e) {
      addToast({ type: 'error', title: 'Failed to load dashboard', message: errorMessage(e) });
    } finally {
      setLoading(false);
      countdownRef.current = REFRESH_INTERVAL;
      setCountdown(REFRESH_INTERVAL);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const tick = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        fetchData(true);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [fetchData]);

  const by = stats?.by_status ?? {};
  const inFlight = (by.pending ?? 0) + (by.booked ?? 0) + (by.modified ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-tertiary mb-1">Overview</p>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-text-primary">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Active bookings across all source systems</p>
        </div>
        <Button variant="secondary" onClick={() => fetchData(true)} aria-label="Refresh dashboard" className="flex items-center gap-2 shrink-0 mt-1">
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="font-mono text-[11px] text-text-tertiary">{countdown}s</span>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Total bookings"
          value={stats?.total ?? 0}
          icon={<BookOpen className="h-4.5 w-4.5 text-white" style={{ width: '1.125rem', height: '1.125rem' }} />}
          iconBg="bg-brand-blue"
          href="/bookings"
        />
        <Stat
          label="In progress"
          value={inFlight}
          icon={<Clock className="h-4.5 w-4.5 text-white" style={{ width: '1.125rem', height: '1.125rem' }} />}
          iconBg="bg-alert-amber"
          href="/bookings?status=pending,booked,modified"
        />
        <Stat
          label="Confirmed"
          value={(by.confirmed ?? 0) + (by.completed ?? 0)}
          icon={<CheckCircle2 className="h-4.5 w-4.5 text-white" style={{ width: '1.125rem', height: '1.125rem' }} />}
          iconBg="bg-success"
          href="/bookings?status=confirmed,completed"
        />
        <Stat
          label="Needs attention"
          value={stats?.needs_attention ?? 0}
          icon={<AlertTriangle className="h-4.5 w-4.5 text-white" style={{ width: '1.125rem', height: '1.125rem' }} />}
          iconBg="bg-danger"
          href="/bookings?status=failed,manual_review,rejected"
        />
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
