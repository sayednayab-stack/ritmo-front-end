import { useMemo, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, RefreshCw, Inbox } from 'lucide-react';
import api, { errorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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
  optionsFrom?: {
    endpoint: string;
    value: string;
    label: (row: any) => string;
    /** Keep only some rows, optionally depending on the rest of the form (e.g. vendors of the chosen CM). */
    filter?: (row: any, form: Record<string, any>) => boolean;
  };
  /** Initial value on the Add form (checkboxes otherwise start unchecked). */
  defaultValue?: string | number | boolean;
  /** Only editable when creating (e.g. immutable foreign keys). */
  createOnly?: boolean;
  step?: string;
  help?: string;
  /** Rendered as a password input; blank on edit means "leave unchanged". */
  secret?: boolean;
  /** Other field keys to clear when this field changes (e.g. picking a CM clears the vendor). */
  resetOnChange?: string[];
}

export interface RowAction<T> {
  label: string;
  icon?: React.ReactNode;
  show?: (row: T) => boolean;
  /** Run the action against the backend; the list is refreshed afterwards. */
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
  /** One line shown in the empty state to explain what a first entry is for. */
  emptyHint?: string;
}

type Option = { value: string; label: string };

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
  emptyHint,
}: Props<T>) {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [formError, setFormError] = useState('');
  const [toDelete, setToDelete] = useState<T | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ action: RowAction<T>; row: T } | null>(null);

  const base = endpoint.replace(/\/$/, '');
  const params = useMemo(() => ({ limit: 500, ...listParams }), [listParams]);

  const list = useQuery({
    queryKey: queryKeys.list(endpoint, params),
    queryFn: () => api.get<T[]>(endpoint, { params }).then((r) => r.data),
  });
  const rows = list.data ?? [];
  const refreshList = () => queryClient.invalidateQueries({ queryKey: queryKeys.listAll(endpoint) });

  // Select options that come from another endpoint are cached and shared across pages.
  const remoteFields = fields.filter((f) => f.optionsFrom);
  const remoteResults = useQueries({
    queries: remoteFields.map((f) => ({
      queryKey: queryKeys.list(f.optionsFrom!.endpoint, { limit: 500 }),
      queryFn: () => api.get<any[]>(f.optionsFrom!.endpoint, { params: { limit: 500 } }).then((r) => r.data),
      staleTime: 60_000,
    })),
  });
  const remoteRows = (key: string): any[] => remoteResults[remoteFields.findIndex((f) => f.key === key)]?.data ?? [];

  const optionsFor = (fd: FieldDef): Option[] => {
    if (fd.options) return fd.options;
    if (!fd.optionsFrom) return [];
    const { value, label, filter } = fd.optionsFrom;
    return remoteRows(fd.key)
      .filter((r) => !filter || filter(r, form))
      .map((r) => ({ value: String(r[value]), label: label(r) }));
  };

  const emptyForm = useMemo(() => {
    const f: Record<string, any> = {};
    fields.forEach((fd) => {
      f[fd.key] = fd.defaultValue !== undefined ? fd.defaultValue : fd.type === 'checkbox' ? false : fd.type === 'select' && fd.options ? fd.options[0]?.value ?? '' : '';
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

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, any>) =>
      editing ? api[updateMethod](`${base}/${editing.id}`, payload) : api.post(endpoint, payload),
    onSuccess: () => {
      addToast({ type: 'success', title: `${noun} ${editing ? 'updated' : 'created'}` });
      setOpen(false);
      refreshList();
    },
    onError: (err) => setFormError(errorMessage(err, `Failed to save ${noun}`)),
  });

  const deleteMutation = useMutation({
    mutationFn: (row: T) => api.delete(`${base}/${row.id}`),
    onSuccess: () => {
      addToast({ type: 'success', title: `${noun} deleted` });
      setToDelete(null);
      refreshList();
    },
    onError: (err) => addToast({ type: 'error', title: `Failed to delete ${noun}`, message: errorMessage(err) }),
  });

  const actionMutation = useMutation({
    mutationFn: ({ action, row }: { action: RowAction<T>; row: T }) => action.run(row),
    onSuccess: (_d, { action }) => {
      addToast({ type: 'success', title: `${action.label} done` });
      refreshList();
    },
    onError: (err, { action }) => addToast({ type: 'error', title: `${action.label} failed`, message: errorMessage(err) }),
  });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = fields.find(
      (fd) => fd.required && !(editing && fd.createOnly) && (form[fd.key] === '' || form[fd.key] == null)
    );
    if (missing) {
      setFormError(`${missing.label} is required`);
      return;
    }
    setFormError('');
    saveMutation.mutate(buildPayload());
  };

  const runAction = (action: RowAction<T>, row: T) => {
    if (action.confirm) setPendingConfirm({ action, row });
    else actionMutation.mutate({ action, row });
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

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-14 gap-3">
      <div className="w-12 h-12 rounded-xl bg-ops-card2 flex items-center justify-center">
        <Inbox className="h-5 w-5 text-text-tertiary" />
      </div>
      <div className="text-center max-w-sm">
        <p className="text-sm font-medium text-text-secondary">No {noun.toLowerCase()}s yet</p>
        {emptyHint && <p className="text-xs text-text-tertiary mt-1">{emptyHint}</p>}
      </div>
      {canCreate && (
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add the first {noun.toLowerCase()}
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button variant="secondary" onClick={() => list.refetch()} loading={list.isFetching && !list.isLoading} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            {canCreate && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add {noun}
              </Button>
            )}
          </>
        }
      />

      {list.isError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
          {errorMessage(list.error, `Failed to load ${noun}s`)}
        </div>
      )}

      <Card padding="none">
        <Table
          columns={tableColumns}
          data={rows}
          isLoading={list.isLoading}
          keyExtractor={(r) => String(r.id)}
          emptyMessage={`No ${noun.toLowerCase()}s yet`}
          emptyContent={emptyState}
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
              const set = (v: any) =>
                setForm((f) => {
                  const next = { ...f, [fd.key]: v };
                  fd.resetOnChange?.forEach((k) => (next[k] = emptyForm[k]));
                  return next;
                });
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
                const opts = optionsFor(fd);
                // The backend may store codes in a different case than the option values.
                const selected = opts.find((o) => o.value.toLowerCase() === String(value).toLowerCase())?.value ?? String(value);
                return (
                  <Select
                    key={fd.key}
                    {...common}
                    value={selected}
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
            <Button type="submit" loading={saveMutation.isPending}>
              {editing ? 'Save changes' : `Create ${noun.toLowerCase()}`}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!toDelete}
        title={`Delete ${noun}`}
        message={`This permanently deletes the ${noun.toLowerCase()}. It can't be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteMutation.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete)}
      />

      <ConfirmDialog
        isOpen={!!pendingConfirm}
        title="Confirm action"
        message={pendingConfirm?.action.confirm}
        danger
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => {
          if (!pendingConfirm) return;
          const current = pendingConfirm;
          setPendingConfirm(null);
          actionMutation.mutate(current);
        }}
      />
    </div>
  );
}
