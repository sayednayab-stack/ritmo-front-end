import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, RefreshCw, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Table, Column, Pagination } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { bookingApi, errorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatDateTime, getCMProviderLabel, getSourceSystemLabel } from '@/lib/utils';
import type { Booking, BookingDetail, BookingFilters } from '@/types';

const STATUS_OPTIONS = ['pending', 'booked', 'confirmed', 'modified', 'cancelled', 'completed', 'manual_review', 'failed', 'rejected'];
const LIMIT = 25;

export default function BookingsPage() {
  return (
    <Suspense>
      <BookingsContent />
    </Suspense>
  );
}

function BookingsContent() {
  const [params] = useSearchParams();
  const { addToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BookingFilters>({
    page: 1,
    limit: LIMIT,
    status: params.get('status') ?? undefined,
    source_system: params.get('source_system') ?? undefined,
  });
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<BookingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined));
      const res = await bookingApi.list(params);
      setBookings(res.data.bookings);
      setTotal(res.data.total);
      if (silent) addToast({ type: 'success', title: 'Bookings refreshed' });
    } catch (e) {
      addToast({ type: 'error', title: 'Failed to load bookings', message: errorMessage(e) });
    } finally {
      setLoading(false);
    }
  }, [filters, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilter = (patch: Partial<BookingFilters>) => setFilters((f) => ({ ...f, ...patch, page: 1 }));

  const exportCsv = async () => {
    setExporting(true);
    try {
      const params = Object.fromEntries(Object.entries({ ...filters, limit: 10000, page: 1 }).filter(([, v]) => v !== '' && v !== undefined));
      const res = await bookingApi.list(params);
      const rows = res.data.bookings;
      const headers = ['ID', 'Booking Ref', 'Passenger', 'Source', 'CM', 'Transport', 'Airport', 'Hotel', 'Pickup Date', 'Pickup Time', 'Status', 'Sync Status', 'Created'];
      // Values come from external systems: a leading = + - @ would run as a formula in Excel.
      const escape = (v: unknown) => {
        const s = String(v ?? '');
        return `"${(/^[=+\-@\t\r]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
      };
      const csv = [
        headers.join(','),
        ...rows.map((b) => [
          b.id, b.ritmo_booking_id, b.passenger_name,
          b.source_system, b.cm_provider ?? '', b.transport_type, b.airport_iata ?? '',
          b.hotel_name, b.pickup_date, b.pickup_time, b.status, b.sync_status, b.created_at,
        ].map(escape).join(',')),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', title: `Exported ${rows.length} bookings` });
    } catch (e) {
      addToast({ type: 'error', title: 'Export failed', message: errorMessage(e) });
    } finally {
      setExporting(false);
    }
  };

  const openDetail = async (b: Booking) => {
    setDetailLoading(true);
    setSelected({ ...b } as BookingDetail);
    try {
      const res = await bookingApi.get(b.ritmo_booking_id);
      setSelected(res.data);
    } catch (e) {
      addToast({ type: 'error', title: 'Failed to load booking', message: errorMessage(e) });
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: Column<Booking>[] = [
    { key: 'ritmo_booking_id', header: 'Booking', render: (b) => <span className="font-mono text-xs">{b.ritmo_booking_id}</span> },
    {
      key: 'passenger_name',
      header: 'Passenger',
      render: (b) => (
        <div>
          <div className="font-medium">{b.passenger_name}</div>
          <div className="text-xs text-text-secondary">{b.external_booking_ref ?? b.external_pax_ref}</div>
        </div>
      ),
    },
    { key: 'source_system', header: 'Source', render: (b) => getSourceSystemLabel(b.source_system) },
    { key: 'cm_provider', header: 'CM', render: (b) => (b.cm_provider ? getCMProviderLabel(b.cm_provider) : '—') },
    {
      key: 'trip',
      header: 'Trip',
      render: (b) => (
        <div>
          <div className="capitalize">
            {b.transport_type} {b.airport_iata ? `· ${b.airport_iata}` : ''}
          </div>
          <div className="text-xs text-text-secondary truncate max-w-[16rem]">{b.hotel_name}</div>
        </div>
      ),
    },
    { key: 'flight_number', header: 'Flight', render: (b) => b.flight_number ?? '—' },
    { key: 'pickup', header: 'Pickup', render: (b) => `${formatDate(b.pickup_date)} ${b.pickup_time}` },
    {
      key: 'status',
      header: 'Status',
      render: (b) => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={b.status} />
          {b.sync_status && b.sync_status !== b.status && (
            <span className="text-xs text-text-tertiary">sync: {b.sync_status}</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-text-primary">Bookings</h1>
          <p className="text-text-secondary">{total} bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={exportCsv} disabled={exporting} aria-label="Export CSV">
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
          <Button variant="secondary" onClick={() => load(true)} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <form
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setFilter({ q: search.trim() || undefined });
          }}
        >
          <div className="lg:col-span-2">
            <Input label="Search" placeholder="Name, booking ref, pax ref, RITMO id" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select
            label="Status"
            value={filters.status ?? ''}
            onChange={(e) => setFilter({ status: e.target.value || undefined })}
            options={[{ value: '', label: 'All statuses' }, ...STATUS_OPTIONS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))]}
          />
          <Select
            label="Source"
            value={filters.source_system ?? ''}
            onChange={(e) => setFilter({ source_system: e.target.value || undefined })}
            options={[
              { value: '', label: 'All sources' },
              ...['ai_irrops', 'ix_irrops', 'ey_class'].map((s) => ({ value: s, label: getSourceSystemLabel(s) })),
            ]}
          />
          <Select
            label="CM"
            value={filters.cm_provider ?? ''}
            onChange={(e) => setFilter({ cm_provider: e.target.value || undefined })}
            options={[{ value: '', label: 'All CMs' }, { value: 'ride', label: 'RIDE' }, { value: 'iway', label: 'iWay' }]}
          />
          <Input label="Pickup from" type="date" value={filters.pickup_from ?? ''} onChange={(e) => setFilter({ pickup_from: e.target.value || undefined })} />
          <Input label="Pickup to" type="date" value={filters.pickup_to ?? ''} onChange={(e) => setFilter({ pickup_to: e.target.value || undefined })} />
          <label className="flex items-center gap-2 text-sm text-text-primary pb-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={!!filters.include_inactive}
              onChange={(e) => setFilter({ include_inactive: e.target.checked || undefined })}
            />
            Include superseded versions
          </label>
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
      </Card>

      <Card padding="none">
        <Table columns={columns} data={bookings} isLoading={loading} keyExtractor={(b) => String(b.id)} onRowClick={openDetail} emptyMessage="No bookings match these filters" />
      </Card>
      <Pagination currentPage={filters.page ?? 1} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Booking ${selected.ritmo_booking_id}` : ''} size="xl">
        {selected && <BookingDetailView booking={selected} loading={detailLoading} />}
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className="text-sm text-text-primary break-words">{value === null || value === undefined || value === '' ? '—' : value}</dd>
    </div>
  );
}

function BookingDetailView({ booking: b, loading }: { booking: BookingDetail; loading: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 items-center">
        <StatusBadge status={b.status} />
        <span className="text-xs text-text-secondary">sync: {b.sync_status}</span>
        <span className="text-xs text-text-secondary">v{b.version}{b.is_active ? '' : ' (superseded)'}</span>
      </div>

      {loading && (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <div key={j}>
                  <div className="h-3 w-16 skeleton rounded mb-1" />
                  <div className="h-4 w-28 skeleton rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <>
          {b.error_detail && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{b.error_detail}</div>
          )}

          <Section title="Passenger">
            <Row label="Name" value={`${b.passenger_name} (${b.pax_type})`} />
            <Row label="Phone" value={b.passenger_phone} />
            <Row label="Email" value={b.passenger_email} />
            <Row label="Bags" value={b.baggage_count} />
            <Row label="Booking ref" value={b.external_booking_ref} />
            <Row label="Pax ref" value={b.external_pax_ref} />
          </Section>

          <Section title="Trip">
            <Row label="Source" value={getSourceSystemLabel(b.source_system)} />
            <Row label="Direction" value={b.transport_type} />
            <Row label="Pickup" value={`${formatDate(b.pickup_date)} ${b.pickup_time}`} />
            <Row label="Flight" value={[b.airline_code, b.flight_number].filter(Boolean).join(' ')} />
            <Row label="Cabin" value={b.cabin_class} />
            <Row label="Vehicle type" value={b.vehicle_type} />
            <Row label="Airport" value={[b.airport_iata, b.airport_address].filter(Boolean).join(' — ')} />
            <Row label="Hotel" value={[b.hotel_name, b.hotel_address].filter(Boolean).join(' — ')} />
          </Section>

          <Section title="Channel manager">
            <Row label="CM" value={b.cm_provider ? getCMProviderLabel(b.cm_provider) : null} />
            <Row label="Order id" value={b.cm_order_id} />
            <Row label="Booking id" value={b.cm_booking_id} />
            <Row label="Transaction id" value={b.cm_transaction_id} />
            <Row label="Price" value={b.cm_price !== null && b.cm_price !== undefined ? `${b.cm_price} ${b.cm_currency ?? ''}` : null} />
            <Row label="Voucher" value={b.voucher_url ? <a className="text-brand-blue underline" href={b.voucher_url} target="_blank" rel="noopener noreferrer">Open</a> : null} />
          </Section>

          <Section title="Driver">
            <Row label="Name" value={b.driver_name} />
            <Row label="Phone" value={b.driver_phone} />
            <Row label="Vehicle" value={b.driver_vehicle} />
            <Row label="Dispatcher" value={b.dispatcher_phone} />
          </Section>

          {(b.remarks || b.cancel_reason) && (
            <Section title="Notes">
              <Row label="Remarks" value={b.remarks} />
              <Row label="Cancel reason" value={b.cancel_reason} />
            </Section>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Payload title="CM request" data={b.cm_request_payload} />
            <Payload title="CM response" data={b.cm_response_payload} />
            <Payload title="iWay API log" data={b.iway_api_log} />
            <Payload title="IRROPS callback" data={b.callback_response} />
          </div>
          <p className="text-xs text-text-tertiary">
            Created {formatDateTime(b.created_at)}
            {b.updated_at ? ` · updated ${formatDateTime(b.updated_at)}` : ''}
          </p>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-text-primary mb-2">{title}</h3>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
    </section>
  );
}

function Payload({ title, data }: { title: string; data: unknown }) {
  if (data === null || data === undefined) return null;
  return (
    <details className="rounded-lg border border-secondary-200">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-text-primary">{title}</summary>
      <pre className="p-3 text-xs bg-ops-bg overflow-auto max-h-64">{JSON.stringify(data, null, 2)}</pre>
    </details>
  );
}
