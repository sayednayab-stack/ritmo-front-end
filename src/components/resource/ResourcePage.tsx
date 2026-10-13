'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import api, { errorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table, Column } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';

export interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'datetime';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Load select options from another list endpoint. */
  optionsFrom?: { endpoint: string; value: string; label: (row: any) => string };
  /** Only editable when creating (e.g. immutable foreign keys). */
  createOnly?: boolean;
  step?: string;
  help?: string;
  /** Rendered as a password input; blank on edit means "leave unchanged". */
  secret?: boolean;
}

export interface RowAction<T> {
  label: string;
  icon?: React.ReactNode;
  show?: (row: T) => boolean;
  /** Return the endpoint (relative to the proxy) to PATCH/POST, or handle it yourself. */
  run: (row: T) => Promise<unknown>;
  confirm?: string;
}

interface Props<T extends { id: number | string }> {
  title: string;
  description: string;
  noun: string;
  /** Collection endpoint, e.g. "/fleet/". Items live at `${endpoint}/${id}`. */
  endpoint: string;
  fields: FieldDef[];
  columns: Column<T>[];
  listParams?: Record<string, unknown>;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  updateMethod?: 'put' | 'patch';
  rowActions?: RowAction<T>[];
  /** Editing sends only fields the backend's Update schema accepts. */
  editableKeys?: string[];
}

function toDatetimeLocal(v: string | null | undefined): string {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ResourcePage<T extends { id: number | string }>({
  title,
  description,
  noun,
  endpoint,
  fields,
  columns,
  listParams,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  updateMethod = 'put',
  rowActions = [],
  editableKeys,
}: Props<T>) {
  const { addToast } = useToast();
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toDelete, setToDelete] = useState<T | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ action: RowAction<T>; row: T; message: string } | null>(null);
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, { value: string; label: string }[]>>({});

  const base = endpoint.replace(/\/$/, '');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await api.get<T[]>(endpoint, { params: { limit: 500, ...listParams } });
      setRows(res.data);
    } catch (e) {
      setLoadError(errorMessage(e, `Failed to load ${noun}s`));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, noun, JSON.stringify(listParams)]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fields.forEach(async (f) => {
      if (!f.optionsFrom) return;
      try {
        const res = await api.get<any[]>(f.optionsFrom.endpoint, { params: { limit: 500 } });
        setDynamicOptions((prev) => ({
          ...prev,
          [f.key]: res.data.map((r) => ({ value: String(r[f.optionsFrom!.value]), label: f.optionsFrom!.label(r) })),
        }));
      } catch {
        /* the select just stays empty */
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emptyForm = useMemo(() => {
    const f: Record<string, any> = {};
    fields.forEach((fd) => {
      f[fd.key] = fd.type === 'checkbox' ? false : fd.type === 'select' && fd.options ? fd.options[0]?.value ?? '' : '';
    });
    return f;
  }, [fields]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setOpen(true);
  };

  const openEdit = (row: T) => {
    const f: Record<string, any> = {};
    fields.forEach((fd) => {
      const v = (row as any)[fd.key];
      if (fd.secret) f[fd.key] = '';
      else if (fd.type === 'datetime') f[fd.key] = toDatetimeLocal(v);
      else if (fd.type === 'checkbox') f[fd.key] = !!v;
      else f[fd.key] = v ?? '';
    });
    setEditing(row);
    setForm(f);
    setFormError('');
    setOpen(true);
  };

  const buildPayload = () => {
    const payload: Record<string, any> = {};
    for (const fd of fields) {
      if (editing && (fd.createOnly || (editableKeys && !editableKeys.includes(fd.key)))) continue;
      const raw = form[fd.key];
      if (fd.type === 'checkbox') payload[fd.key] = !!raw;
      else if (raw === '' || raw === null || raw === undefined) {
        if (editing && !fd.required && !fd.secret) payload[fd.key] = null;
      } else if (fd.type === 'number' || (fd.type === 'select' && fd.optionsFrom)) payload[fd.key] = Number(raw);
      else if (fd.type === 'datetime') payload[fd.key] = new Date(raw).toISOString();
      else payload[fd.key] = typeof raw === 'string' ? raw.trim() : raw;
    }
    return payload;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = fields.find(
      (fd) => fd.required && !(editing && fd.createOnly) && (form[fd.key] === '' || form[fd.key] == null)
    );
    if (missing) {
      setFormError(`${missing.label} is required`);
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = buildPayload();
      if (editing) await api[updateMethod](`${base}/${editing.id}`, payload);
      else await api.post(endpoint, payload);
      addToast({ type: 'success', title: `${noun} ${editing ? 'updated' : 'created'}` });
      setOpen(false);
      load();
    } catch (err) {
      setFormError(errorMessage(err, `Failed to save ${noun}`));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    setSaving(true);
    try {
      await api.delete(`${base}/${toDelete.id}`);
      addToast({ type: 'success', title: `${noun} deleted` });
      setToDelete(null);
      load();
    } catch (err) {
      addToast({ type: 'error', title: `Failed to delete ${noun}`, message: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action: RowAction<T>, row: T) => {
    if (action.confirm) {
      setPendingConfirm({ action, row, message: action.confirm });
      return;
    }
    await executeAction(action, row);
  };

  const executeAction = async (action: RowAction<T>, row: T) => {
    try {
      await action.run(row);
      addToast({ type: 'success', title: `${action.label} done` });
      load();
    } catch (err) {
      addToast({ type: 'error', title: `${action.label} failed`, message: errorMessage(err) });
    }
  };

  const tableColumns: Column<T>[] = [
    ...columns,
    ...(canEdit || canDelete || rowActions.length
      ? [
          {
            key: '_actions',
            header: '',
            className: 'text-right whitespace-nowrap',
            render: (row: T) => (
              <div className="flex justify-end gap-1">
                {rowActions
                  .filter((a) => !a.show || a.show(row))
                  .map((a) => (
                    <Button key={a.label} variant="secondary" size="sm" onClick={() => runAction(a, row)}>
                      {a.icon}
                      {a.label}
                    </Button>
                  ))}
                {canEdit && (
                  <Button variant="ghost" size="sm" onClick={() => openEdit(row)} aria-label={`Edit ${noun}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setToDelete(row)}
                    aria-label={`Delete ${noun}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ),
          } as Column<T>,
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
          <p className="text-text-secondary">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={load} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canCreate && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add {noun}
            </Button>
          )}
        </div>
      </div>

      {loadError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
          {loadError}
        </div>
      )}

      <Card padding="none">
        <Table
          columns={tableColumns}
          data={rows}
          isLoading={loading}
          keyExtractor={(r) => String(r.id)}
          emptyMessage={`No ${noun.toLowerCase()}s yet`}
        />
      </Card>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={`${editing ? 'Edit' : 'Add'} ${noun}`} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((fd) => {
              const disabled = !!editing && (fd.createOnly || (editableKeys ? !editableKeys.includes(fd.key) : false));
              const common = {
                label: fd.label + (fd.required ? ' *' : ''),
                id: `f-${fd.key}`,
                disabled,
                helperText: fd.help,
              };
              const value = form[fd.key] ?? '';
              const set = (v: any) => setForm((f) => ({ ...f, [fd.key]: v }));
              if (fd.type === 'checkbox')
                return (
                  <label key={fd.key} className="flex items-center gap-2 text-sm text-text-primary sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={!!form[fd.key]}
                      disabled={disabled}
                      onChange={(e) => set(e.target.checked)}
                      className="h-4 w-4 rounded border-secondary-300"
                    />
                    {fd.label}
                  </label>
                );
              if (fd.type === 'textarea')
                return (
                  <div key={fd.key} className="sm:col-span-2">
                    <Textarea {...common} value={value} onChange={(e) => set(e.target.value)} placeholder={fd.placeholder} />
                  </div>
                );
              if (fd.type === 'select') {
                const opts = fd.options ?? dynamicOptions[fd.key] ?? [];
                return (
                  <Select
                    key={fd.key}
                    {...common}
                    value={String(value)}
                    onChange={(e) => set(e.target.value)}
                    options={fd.required ? opts : [{ value: '', label: '— none —' }, ...opts]}
                  />
                );
              }
              return (
                <Input
                  key={fd.key}
                  {...common}
                  type={fd.secret ? 'password' : fd.type === 'number' ? 'number' : fd.type === 'datetime' ? 'datetime-local' : 'text'}
                  autoComplete={fd.secret ? 'new-password' : undefined}
                  step={fd.step}
                  value={value}
                  placeholder={fd.secret && editing ? '(unchanged)' : fd.placeholder}
                  onChange={(e) => set(e.target.value)}
                />
              );
            })}
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
              {editing ? 'Save changes' : `Create ${noun.toLowerCase()}`}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!toDelete} onClose={() => setToDelete(null)} title={`Delete ${noun}`} size="sm">
        <p className="text-sm text-text-secondary">
          This permanently deletes the {noun.toLowerCase()}. It can&apos;t be undone.
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

      <Modal isOpen={!!pendingConfirm} onClose={() => setPendingConfirm(null)} title="Confirm action" size="sm">
        <p className="text-sm text-text-secondary">{pendingConfirm?.message}</p>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={() => setPendingConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!pendingConfirm) return;
              const { action, row } = pendingConfirm;
              setPendingConfirm(null);
              await executeAction(action, row);
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}
