import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { useMe } from '@/lib/queries';
import { ChevronLeft, ChevronRight, ChevronDown, Menu, LogOut, Search, User, X } from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { crumbsFor, isActivePath, navigation, type NavItem } from './nav';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function NavLink({ item, narrow, onNavigate }: { item: NavItem; narrow: boolean; onNavigate: () => void }) {
  const { pathname } = useLocation();
  const isActive = isActivePath(item.href, pathname);
  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className={cn(
        'group relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-200',
        isActive ? 'text-white bg-white/[0.12]' : 'text-white/70 hover:text-white hover:bg-white/[0.07]',
        narrow && 'lg:justify-center lg:px-0 lg:py-2.5'
      )}
      style={isActive ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08)' } : undefined}
      aria-current={isActive ? 'page' : undefined}
      title={narrow ? item.name : undefined}
    >
      {isActive && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent-gold shadow-[0_0_10px_rgba(179,150,97,.7)]" />}
      <item.icon
        className={cn('flex-shrink-0 transition-colors', isActive ? 'text-accent-gold' : 'text-white/50 group-hover:text-white/80')}
        style={{ width: '1rem', height: '1rem' }}
        aria-hidden="true"
      />
      <span className={cn(narrow && 'lg:hidden')}>{item.name}</span>
    </Link>
  );
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const narrow = collapsed;

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-[#04204A]/50 backdrop-blur-sm z-30 lg:hidden animate-fade-in" onClick={onCloseMobile} aria-hidden="true" />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-40 flex flex-col overflow-hidden',
          'transition-all duration-300 ease-expo-out',
          'w-60 -translate-x-full lg:translate-x-0',
          mobileOpen && 'translate-x-0 shadow-modal',
          narrow && 'lg:w-16'
        )}
        style={{ background: 'linear-gradient(180deg,#0A3470 0%,#072D62 45%,#04204A 100%)' }}
      >
        <div className="absolute -top-16 -left-12 w-56 h-56 rounded-full opacity-[0.09] pointer-events-none" style={{ background: 'radial-gradient(circle, #B39661 0%, transparent 70%)' }} />
        <div className="absolute -bottom-24 -right-16 w-64 h-64 rounded-full opacity-[0.06] pointer-events-none" style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />

        <div className="relative flex items-center justify-between h-16 px-4 flex-shrink-0">
          <Link to="/" onClick={onCloseMobile} className={cn('flex items-center gap-2.5 min-w-0', narrow && 'lg:hidden')}>
            <div className="w-8 h-8 rounded-xl bg-accent-gold/20 border border-accent-gold/30 flex items-center justify-center flex-shrink-0">
              <span className="font-serif text-accent-gold font-medium text-base leading-none">R</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm tracking-tight leading-tight">RITMO</p>
              <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/40 leading-none mt-0.5">Fleet Console</p>
            </div>
          </Link>
          {narrow && (
            <Link to="/" className="hidden lg:flex w-8 h-8 rounded-xl bg-accent-gold/20 border border-accent-gold/30 items-center justify-center mx-auto" aria-label="Dashboard">
              <span className="font-serif text-accent-gold font-medium text-base leading-none">R</span>
            </Link>
          )}
          {!narrow && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-white/30 hover:text-white/80 hover:bg-white/10 transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <button onClick={onCloseMobile} className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={cn('relative mx-4 h-px mb-1 flex-shrink-0', narrow && 'lg:mx-2')} style={{ background: 'linear-gradient(90deg,transparent,#B39661,transparent)', opacity: 0.35 }} />

        <nav className="relative flex-1 px-2 py-3 space-y-5 overflow-y-auto scrollbar-dark" aria-label="Main navigation">
          {navigation.map((group) => (
            <div key={group.title}>
              <p className={cn('px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35', narrow && 'lg:hidden')}>{group.title}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => <NavLink key={item.href} item={item} narrow={narrow} onNavigate={onCloseMobile} />)}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative px-2 pb-3 flex-shrink-0">
          <div className={cn('mx-2 h-px mb-3 bg-white/[0.08]', narrow && 'mx-1')} />
          {narrow ? (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex mt-2 w-full items-center justify-center rounded-xl py-2 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <p className="mt-3 px-2.5 text-[10px] font-mono uppercase tracking-[0.18em] text-white/25 truncate">v1.0 · Fleet ops</p>
          )}
        </div>
      </aside>
    </>
  );
}

export function Header({ onOpenMobile, onOpenPalette }: { onOpenMobile: () => void; onOpenPalette: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: me } = useMe();
  const crumbs = crumbsFor(pathname);
  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const signOut = async () => {
    await axios.post('/api/auth/logout').catch(() => undefined);
    navigate('/login', { replace: true });
  };

  return (
    <header className={cn('sticky top-0 z-20 h-16 glass border-b transition-shadow duration-200', scrolled ? 'border-border shadow-soft' : 'border-border/60')}>
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onOpenMobile} className="lg:hidden p-2 rounded-xl text-text-secondary hover:bg-ops-card2 transition-colors" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-xs min-w-0">
            <span className="font-mono uppercase tracking-[0.14em] text-text-tertiary">Console</span>
            {crumbs && (
              <>
                <span className="text-border" aria-hidden="true">/</span>
                <span className="font-mono uppercase tracking-[0.14em] text-text-tertiary">{crumbs.group}</span>
                <span className="text-border" aria-hidden="true">/</span>
                <span className="font-semibold text-text-primary truncate">{crumbs.name}</span>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPalette}
            className="group flex items-center gap-2.5 h-9 pl-3 pr-2 rounded-xl border border-border bg-ops-card/80 text-text-tertiary shadow-soft hover:border-[#C2C7CF] hover:text-text-secondary transition-all"
            aria-label="Open command palette"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden md:block text-xs pr-6">Search or jump to…</span>
            <kbd className="hidden md:block rounded-md border border-border bg-ops-card2 px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary group-hover:text-text-secondary">
              {isMac ? '⌘' : 'Ctrl'} K
            </kbd>
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 h-9 rounded-xl bg-ops-card border border-border shadow-soft hover:bg-ops-card2 transition-all"
              aria-label="User menu"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#0E3F82,#072D62)' }}>
                {me?.username?.[0]?.toUpperCase() ?? <User className="h-3.5 w-3.5" />}
              </div>
              <span className="hidden md:block text-xs font-semibold text-text-primary leading-tight">{me?.username ?? '…'}</span>
              <ChevronDown className={cn('hidden md:block h-3 w-3 text-text-tertiary transition-transform', menuOpen && 'rotate-180')} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                <div role="menu" className="absolute right-0 mt-2 w-60 z-20 bg-ops-card rounded-2xl shadow-lift border border-border py-1 animate-menu-in" style={{ transformOrigin: 'top right' }}>
                  <div className="px-4 py-3.5 border-b border-ops-line">
                    <p className="text-sm font-semibold text-text-primary">{me?.username}</p>
                    <p className="text-xs text-text-tertiary truncate mt-0.5">{me?.email}</p>
                    {me?.is_admin && (
                      <span className="inline-block mt-2 rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-gold ring-1 ring-inset ring-accent-gold/20">
                        Administrator
                      </span>
                    )}
                  </div>
                  <div className="p-1">
                    <button onClick={signOut} role="menuitem" className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-danger-soft rounded-xl transition-colors">
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

const COLLAPSE_KEY = 'ritmo.sidebar.collapsed';

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const toggleCollapse = useCallback(() => {
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1'); } catch { /* storage unavailable: fine */ }
      return !c;
    });
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen bg-ops-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-blue focus:px-4 focus:py-2 focus:text-sm focus:text-white">
        Skip to content
      </a>
      <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className={cn('transition-all duration-300 ease-expo-out', collapsed ? 'lg:pl-16' : 'lg:pl-60')}>
        <Header onOpenMobile={() => setMobileOpen(true)} onOpenPalette={() => setPaletteOpen(true)} />
        <main id="main" tabIndex={-1} className="p-4 lg:p-8 max-w-[1600px] mx-auto focus:outline-none">{children}</main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
