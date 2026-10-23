import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CornerDownLeft, LogOut, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { allNavItems } from './nav';

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
}

/** ⌘K / Ctrl+K launcher: jump to any page, search bookings, sign out. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previous?.focus?.();
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => { onClose(); navigate(href); };
    const q = query.trim();
    const needle = q.toLowerCase();

    const pages: Command[] = allNavItems
      .filter((i) => !needle || `${i.name} ${i.group} ${i.keywords ?? ''}`.toLowerCase().includes(needle))
      .map((i) => ({ id: i.href, label: i.name, hint: i.group, icon: i.icon, run: go(i.href) }));

    const extra: Command[] = [];
    if (q) {
      extra.push({
        id: 'search-bookings',
        label: `Search bookings for “${q}”`,
        hint: 'Bookings',
        icon: Search,
        run: go(`/bookings?q=${encodeURIComponent(q)}`),
      });
    }
    if (!needle || 'sign out log out logout'.includes(needle)) {
      extra.push({
        id: 'sign-out',
        label: 'Sign out',
        hint: 'Account',
        icon: LogOut,
        run: async () => {
          onClose();
          await axios.post('/api/auth/logout').catch(() => undefined);
          navigate('/login', { replace: true });
        },
      });
    }
    // A typed query is most likely a booking reference, so offer that first.
    return q ? [...extra.filter((c) => c.id === 'search-bookings'), ...pages, ...extra.filter((c) => c.id !== 'search-bookings')] : [...pages, ...extra];
  }, [query, navigate, onClose]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, listId]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (commands.length ? (a + 1) % commands.length : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (commands.length ? (a - 1 + commands.length) % commands.length : 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); commands[active]?.run(); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[14vh]" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 bg-[#04204A]/45 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-ops-card shadow-modal animate-scale-in"
      >
        <div className="flex items-center gap-3 border-b border-ops-line px-4">
          <Search className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a page or search bookings…"
            className="h-14 w-full bg-transparent text-sm text-text-primary placeholder-text-tertiary focus:outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={commands.length ? `${listId}-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:block rounded-md border border-border bg-ops-card2 px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">esc</kbd>
        </div>

        <ul id={listId} role="listbox" className="max-h-[52vh] overflow-y-auto p-2 scrollbar-thin">
          {commands.length === 0 && <li className="px-3 py-10 text-center text-sm text-text-tertiary">Nothing matches “{query}”</li>}
          {commands.map((c, i) => (
            <li
              key={c.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={c.run}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                i === active ? 'bg-navy-soft text-text-primary' : 'text-text-secondary'
              )}
            >
              <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', i === active ? 'bg-brand-blue text-white' : 'bg-ops-card2 text-text-tertiary')}>
                <c.icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{c.label}</span>
              {c.hint && <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">{c.hint}</span>}
              {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-text-tertiary" aria-hidden="true" />}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 border-t border-ops-line bg-ops-bg px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span className="ml-auto">Ritmo console</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
