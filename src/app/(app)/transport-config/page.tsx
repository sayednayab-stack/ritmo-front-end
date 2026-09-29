'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Sprout } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table, Column } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { transportConfigApi, errorMessage } from '@/lib/api';
import { getCMProviderLabel } from '@/lib/utils';
import type { TransportConfig } from '@/types';

interface Form {
  flight_class: string;
  cm_provider: string;
  flight_class_label: string;
  max_pax_per_vehicle: string;
  max_bags_per_vehicle: string;
  family_max_pax: string;
  minibus_threshold: string;
  preferred_vehicle_tier: string;
  minibus_vehicle_tiers: string;
  is_private: boolean;
  is_active: boolean;
}

const EMPTY: Form = {
  flight_class: '',
  cm_provider: 'iway',
  flight_class_label: '',
  max_pax_per_vehicle: '',
  max_bags_per_vehicle: '',
  family_max_pax: '',
  minibus_threshold: '',
  preferred_vehicle_tier: '',
  minibus_vehicle_tiers: '',
  is_private: false,
  is_active: true,
};

const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
const num = (s: string) => (s.trim() === '' ? null : Number(s));

export default function TransportConfigPage() {
  const { addToast } = useToast();
  const [rows, setRows] = useState<TransportConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInactive, setShowInactive] = useState(true);
  const [editing, setEditing] = useState<TransportConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<TransportConfig | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await transportConfigApi.list({ active_only: !showInactive });
      setRows(res.data);
    } catch (e) {
      setError(errorMessage(e, 'Failed to load transport configuration'));
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormError('');
    setOpen(true);
  };

  const openEdit = (c: TransportConfig) => {
    setEditing(c);
    setForm({
      flight_class: c.flight_class,
      cm_provider: c.cm_provider,
      flight_class_label: c.flight_class_label ?? '',
      max_pax_per_vehicle: String(c.max_pax_per_vehicle),
      max_bags_per_vehicle: c.max_bags_per_vehicle?.toString() ?? '',
      family_max_pax: c.family_max_pax?.toString() ?? '',
      minibus_threshold: c.minibus_threshold?.toString() ?? '',
      preferred_vehicle_tier: (c.preferred_vehicle_tier ?? []).join(', '),
      minibus_vehicle_tiers: (c.minibus_vehicle_tiers ?? []).join(', '),
      is_private: c.is_private,
      is_active: c.is_active,
    });
    setFormError('');
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing && !form.flight_class.trim()) return setFormError('Flight class is required');
    const maxPax = Number(form.max_pax_per_vehicle);
    if (!Number.isInteger(maxPax) || maxPax < 1) return setFormError('Max passengers per vehicle must be a positive whole number');

    const common = {
      flight_class_label: form.flight_class_label.trim() || undefined,
      max_pax_per_vehicle: maxPax,
      max_bags_per_vehicle: num(form.max_bags_per_vehicle),
      family_max_pax: num(form.family_max_pax),
      minibus_threshold: num(form.minibus_threshold),
      preferred_vehicle_tier: list(form.preferred_vehicle_tier),
      minibus_vehicle_tiers: list(form.minibus_vehicle_tiers),
      is_private: form.is_private,
      is_active: form.is_active,
    };
    setSaving(true);
    setFormError('');
    try {
      if (editing) await transportConfigApi.update(editing.flight_class, common as any, editing.cm_provider);
      else await transportConfigApi.create({ ...common, flight_class: form.flight_class.trim().toUpperCase(), cm_provider: form.cm_provider } as any);
      addToast({ type: 'success', title: `Configuration ${editing ? 'updated' : 'created'}` });
      setOpen(false);
      load();
    } catch (err) {
      setFormError(errorMessage(err, 'Failed to save configuration'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    setSaving(true);
    try {
      await transportConfigApi.delete(toDelete.flight_class, toDelete.cm_provider);
      addToast({ type: 'success', title: 'Configuration deleted' });
      setToDelete(null);
      load();
    } catch (err) {
      addToast({ type: 'error', title: 'Delete failed', message: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const seed = async () => {
    if (!window.confirm('Seed the default transport configuration? This only works while the table is empty.')) return;
    try {
      await transportConfigApi.seed();
      addToast({ type: 'success', title: 'Defaults seeded' });
      load();
    } catch (err) {
      addToast({ type: 'error', title: 'Seeding failed', message: errorMessage(err) });
    }
  };

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const columns: Column<TransportConfig>[] = [
    {
      key: 'flight_class',
      header: 'Class',
      render: (c) => (
        <div>
          <span className="font-mono font-medium">{c.flight_class}</span>
          {c.flight_class_label && <div className="text-xs text-secondary-500">{c.flight_class_label}</div>}
        </div>
      ),
    },
    { key: 'cm_provider', header: 'CM', render: (c) => getCMProviderLabel(c.cm_provider) },
    { key: 'max_pax_per_vehicle', header: 'Max pax' },
    { key: 'max_bags_per_vehicle', header: 'Max bags', render: (c) => c.max_bags_per_vehicle ?? '—' },
    { key: 'is_private', header: 'Sharing', render: (c) => (c.is_private ? <Badge variant="info">Private</Badge> : <Badge variant="secondary">Shared</Badge>) },
    {
      key: 'preferred_vehicle_tier',
      header: 'Vehicle tiers',
      render: (c) => (c.preferred_vehicle_tier?.length ? <span className="text-xs">{c.preferred_vehicle_tier.join(' → ')}</span> : '—'),
    },
    { key: 'is_active', header: 'Status', render: (c) => <StatusBadge status={c.is_active ? 'active' : 'inactive'} /> },
    {
      key: '_actions',
      header: '',
      className: 'text-right whitespace-nowrap',
      render: (c) => (
        <>
          <Button variant="ghost" size="sm" onClick={() => openEdit(c)} aria-label="Edit configuration">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setToDelete(c)} aria-label="Delete configuration">
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Transport Config</h1>
          <p className="text-secondary-500">Vehicle allocation rules per flight class and channel manager</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={seed}>
            <Sprout className="h-4 w-4 mr-2" />
            Seed defaults
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add configuration
          </Button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-secondary-700">
        <input type="checkbox" className="h-4 w-4 rounded border-secondary-300" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
        Show inactive
      </label>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <Card padding="none">
        <Table columns={columns} data={rows} isLoading={loading} keyExtractor={(c) => String(c.id)} emptyMessage="No configuration yet — try “Seed defaults”" />
      </Card>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.flight_class} (${getCMProviderLabel(editing.cm_provider)})` : 'Add configuration'} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Flight class *" value={form.flight_class} disabled={!!editing} onChange={(e) => set('flight_class', e.target.value)} placeholder="e.g. J" />
            <Select
              label="CM provider *"
              value={form.cm_provider}
              disabled={!!editing}
              onChange={(e) => set('cm_provider', e.target.value)}
              options={[{ value: 'iway', label: 'iWay' }, { value: 'ride', label: 'RIDE' }]}
            />
            <Input label="Label" value={form.flight_class_label} onChange={(e) => set('flight_class_label', e.target.value)} placeholder="e.g. Business" />
            <Input label="Max passengers per vehicle *" type="number" min={1} value={form.max_pax_per_vehicle} onChange={(e) => set('max_pax_per_vehicle', e.target.value)} />
            <Input label="Max bags per vehicle" type="number" min={0} value={form.max_bags_per_vehicle} onChange={(e) => set('max_bags_per_vehicle', e.target.value)} />
            <Input label="Family max passengers" type="number" min={1} value={form.family_max_pax} onChange={(e) => set('family_max_pax', e.target.value)} />
            <Input label="Minibus threshold" type="number" min={1} value={form.minibus_threshold} onChange={(e) => set('minibus_threshold', e.target.value)} helperText="Group size at which a minibus is used" />
            <div />
            <Input label="Preferred vehicle tiers" value={form.preferred_vehicle_tier} onChange={(e) => set('preferred_vehicle_tier', e.target.value)} helperText="Comma-separated, best first" />
            <Input label="Minibus vehicle tiers" value={form.minibus_vehicle_tiers} onChange={(e) => set('minibus_vehicle_tiers', e.target.value)} helperText="Comma-separated" />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-secondary-700">
              <input type="checkbox" className="h-4 w-4 rounded border-secondary-300" checked={form.is_private} onChange={(e) => set('is_private', e.target.checked)} />
              Private vehicle
            </label>
            <label className="flex items-center gap-2 text-sm text-secondary-700">
              <input type="checkbox" className="h-4 w-4 rounded border-secondary-300" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
              Active
            </label>
          </div>
          {formError && (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!toDelete} onClose={() => setToDelete(null)} title="Delete configuration" size="sm">
        <p className="text-sm text-secondary-600">
          Delete <strong>{toDelete?.flight_class}</strong> for {toDelete && getCMProviderLabel(toDelete.cm_provider)}? Bookings in this class will no longer resolve a configuration.
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={() => setToDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={remove} loading={saving}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
