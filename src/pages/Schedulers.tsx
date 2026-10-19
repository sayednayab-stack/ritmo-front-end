import { useCallback, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Zap, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { schedulerApi, errorMessage } from '@/lib/api';
import { formatDateTime, cn } from '@/lib/utils';
import type { JobStatus, SchedulerStatus } from '@/types';

type Job = 'booking-dispatcher' | 'result-pusher';

const JOBS: { key: keyof SchedulerStatus; job: Job; name: string; icon: React.ReactNode; blurb: string[] }[] = [
  {
    key: 'booking_dispatcher',
    job: 'booking-dispatcher',
    name: 'Booking Dispatcher',
    icon: <Database className="h-5 w-5 text-brand-blue" />,
    blurb: ['Processes pending, modified and cancelled bookings', 'Dispatches to the CM providers'],
  },
  {
    key: 'result_pusher',
    job: 'result-pusher',
    name: 'Result Pusher',
    icon: <Zap className="h-5 w-5 text-brand-blue" />,
    blurb: ['Pushes results back to source systems', 'Retries failed callbacks'],
  },
];

export default function SchedulersPage() {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await schedulerApi.getStatus();
      setStatus(res.data);
    } catch (e) {
      addToast({ type: 'error', title: 'Failed to load scheduler status', message: errorMessage(e) });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 30000);
    return () => clearInterval(t);
  }, [fetchStatus]);

  const act = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label);
    try {
      await fn();
      addToast({ type: 'success', title: `${label} — done` });
      setTimeout(fetchStatus, 800);
    } catch (e) {
      addToast({ type: 'error', title: `${label} failed`, message: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const card = (cfg: (typeof JOBS)[number], s: JobStatus) => (
    <Card key={cfg.job}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">{cfg.icon}</div>
            <div>
              <CardTitle className="text-lg">{cfg.name}</CardTitle>
              <p className="text-sm text-text-secondary">Every {s.interval_minutes} min</p>
            </div>
          </div>
          <Badge variant={s.enabled ? 'success' : 'secondary'}>{s.enabled ? 'Active' : 'Paused'}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="text-sm text-text-secondary list-disc pl-5">
          {cfg.blurb.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-ops-bg rounded-lg">
            <p className="text-xs text-text-secondary">Next run</p>
            <p className="font-mono text-sm">{s.next_run ? formatDateTime(s.next_run) : 'Not scheduled'}</p>
          </div>
          <div className="p-3 bg-ops-bg rounded-lg">
            <p className="text-xs text-text-secondary">Last run</p>
            <p className="font-mono text-sm">{s.last_run ? formatDateTime(s.last_run) : 'Not tracked'}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        {s.enabled ? (
          <Button
            variant="secondary"
            size="sm"
            loading={busy === `Pause ${cfg.name}`}
            onClick={() => act(`Pause ${cfg.name}`, () => schedulerApi.pause(cfg.job))}
          >
            <Pause className="h-4 w-4 mr-2" />
            Pause
          </Button>
        ) : (
          <Button size="sm" loading={busy === `Resume ${cfg.name}`} onClick={() => act(`Resume ${cfg.name}`, () => schedulerApi.resume(cfg.job))}>
            <Play className="h-4 w-4 mr-2" />
            Resume
          </Button>
        )}
        <Button variant="secondary" size="sm" loading={busy === `Run ${cfg.name}`} onClick={() => act(`Run ${cfg.name}`, () => schedulerApi.run(cfg.job))}>
          <Zap className="h-4 w-4 mr-2" />
          Run now
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-text-primary">Schedulers</h1>
          <p className="text-text-secondary">Monitor and control background jobs</p>
        </div>
        <Button variant="secondary" onClick={fetchStatus}>
          <RotateCcw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card><div className="h-48 animate-pulse bg-ops-card2 rounded" /></Card>
          <Card><div className="h-48 animate-pulse bg-ops-card2 rounded" /></Card>
        </div>
      ) : (
        status && <div className="grid gap-6 md:grid-cols-2">{JOBS.map((cfg) => card(cfg, status[cfg.key]))}</div>
      )}
    </div>
  );
}
