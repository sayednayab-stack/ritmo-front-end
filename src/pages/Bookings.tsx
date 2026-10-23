import { Suspense, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search, RefreshCw, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Table, Column, Pagination } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { bookingApi, errorMessage } from '@/lib/api';
import { queryKeys, useBookings, useSourceSystems } from '@/lib/queries';
import { toCsv } from '@/lib/csv';
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

const FILTER_KEYS = ['q', 'status', 'source_system', 'cm_provider', 'pickup_from', 'pickup_to'] as const;

function BookingsContent() {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters live in the URL, so refresh, back/forward and shared links keep them.
  const filters: BookingFilters = useMemo(() => {
    const f: BookingFilters = { page: Math.max(1, Number(searchParams.get('page')) || 1), limit: LIMIT };
    for (const k of FILTER_KEYS) {
      const v = searchParams.get(k);
      if (v) f[k] = v;
    }
    if (searchParams.get('include_inactive') === '1') f.include_inactive = true;
    return f;
  }, [searchParams]);

  const setFilter = (patch: Partial<BookingFilters>) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || v === '' || v === false) next.delete(k);
          else next.set(k, v === true ? '1' : String(v));
        }
        if (!('page' in patch)) next.delete('page');
        return next;
      },
      { replace: true }
    );

  // Search as you type, but only hit the API once typing pauses.
  const [search, setSearch] = useState(filters.q ?? '');
  useEffect(() => {
    if (search.trim() === (filters.q ?? '')) return;
    const t = setTimeout(() => setFilter({ q: search.trim() || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const { data: sourceSystems } = useSourceSystems();
  const list = useBookings(filters);
  const bookings = list.data?.bookings ?? [];
  const total = list.data?.total ?? 0;

  useEffect(() => {
    if (list.error) addToast({ type: 'error', title: 'Failed to load bookings', message: errorMessage(list.error) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.error]);

  const [exporting, setExporting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Booking | null>(null);
  const detail = useQuery({
    queryKey: queryKeys.booking(selectedId ?? ''),
    queryFn: () => bookingApi.get(selectedId!).then((r) => r.data),
    enabled: !!selectedId,
  });
  useEffect(() => {
    if (detail.error) {
      addToast({ type: 'error', title: 'Failed to load booking', message: errorMessage(detail.error) });
      setSelectedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.error]);
  // Show the row we already have immediately; the full record replaces it when it arrives.
  const selected: BookingDetail | null = selectedId ? (detail.data ?? (preview as BookingDetail | null)) : null;

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await bookingApi.list({ ...filters, limit: 10000, page: 1 });
      const rows = res.data.bookings;
      const csv = toCsv(
        ['ID', 'Booking Ref', 'Passenger', 'Source', 'CM', 'Transport', 'Airport', 'Hotel', 'Pickup Date', 'Pickup Time', 'Status', 'Sync Status', 'Created'],
        rows.map((b) => [
          b.id, b.ritmo_booking_id, b.passenger_name,
          b.source_system, b.cm_provider ?? '', b.transport_type, b.airport_iata ?? '',
          b.hotel_name, b.pickup_date, b.pickup_time, b.status, b.sync_status, b.created_at,
        ])
      );
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
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

  const openDetail = (b: Booking) => {
    setPreview(b);
    setSelectedId(b.ritmo_booking_id);
  };
  const detailLoading = detail.isLoading;
  const loading = list.isLoading;

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
      <PageHeader
        eyebrow="Operations"
        title="Bookings"
        description={`${total.toLocaleString()} ${total === 1 ? 'booking' : 'bookings'}`}
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv} disabled={exporting} aria-label="Export CSV">
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
            <Button variant="secondary" onClick={() => list.refetch()} aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${list.isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </>
        }
      />

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
            options={[
              { value: '', label: 'All statuses' },
              // Dashboard cards link here with a combined filter such as "failed,rejected".
              ...(filters.status && !STATUS_OPTIONS.includes(filters.status) ? [filters.status] : []).map((v) => ({ value: v, label: v.split(',').map((x) => x.replace(/_/g, ' ')).join(' + ') })),
              ...STATUS_OPTIONS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
            ]}
          />
          <Select
            label="Source"
            value={filters.source_system ?? ''}
            onChange={(e) => setFilter({ source_system: e.target.value || undefined })}
            options={[
              { value: '', label: 'All sources' },
              ...(sourceSystems ?? []).map((s) => ({ value: s.value, label: getSourceSystemLabel(s.value) })),
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
      <Pagination currentPage={filters.page ?? 1} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={(page) => setFilter({ page: page > 1 ? page : undefined } as Partial<BookingFilters>)} />

      <Modal isOpen={!!selected} onClose={() => setSelectedId(null)} title={selected ? `Booking ${selected.ritmo_booking_id}` : ''} size="xl">
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
