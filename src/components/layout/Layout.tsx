'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import {
  LayoutDashboard, BookOpen, Settings, Clock, Plane, Truck,
  ChevronLeft, ChevronRight, Menu, LogOut, User, BarChart2,
  GitBranch, Building2, Car, Users, Handshake, Hotel,
  ClipboardList, Route, X, ChevronDown,
} from 'lucide-react';

const navigation = [
  {
    title: 'Operations',
    items: [
      { name: 'Dashboard',  href: '/',            icon: LayoutDashboard },
      { name: 'Bookings',   href: '/bookings',     icon: BookOpen },
      { name: 'Analytics',  href: '/analytics',    icon: BarChart2 },
      { name: 'Schedulers', href: '/schedulers',   icon: Clock },
    ],
  },
  {
    title: 'Routing',
    items: [
      { name: 'Priority Rules',   href: '/priorities',       icon: GitBranch },
      { name: 'Vendors',          href: '/vendors',          icon: Building2 },
      { name: 'Transport Config', href: '/transport-config', icon: Truck },
      { name: 'Airports',         href: '/airports',         icon: Plane },
    ],
  },
  {
    title: 'Fleet',
    items: [
      { name: 'Vehicles',       href: '/fleet',          icon: Car },
      { name: 'Drivers',        href: '/drivers',        icon: Users },
      { name: 'Partners',       href: '/partners',       icon: Handshake },
      { name: 'Hotels',         href: '/hotels',         icon: Hotel },
      { name: 'Fleet Requests', href: '/fleet-requests', icon: ClipboardList },
      { name: 'Journeys',       href: '/journeys',       icon: Route },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const narrow = collapsed;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#04204A]/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-40 flex flex-col overflow-hidden',
          'transition-all duration-300 ease-expo-out',
          'w-60 -translate-x-full lg:translate-x-0',
          mobileOpen && 'translate-x-0',
          narrow && 'lg:w-16'
        )}
        style={{ background: 'linear-gradient(180deg,#0A3470 0%,#072D62 45%,#04204A 100%)' }}
      >
        {/* Gold radial glow decoration */}
        <div
          className="absolute -top-16 -left-12 w-56 h-56 rounded-full opacity-[0.07] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #B39661 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 flex-shrink-0">
          <Link href="/" className={cn('flex items-center gap-2.5 min-w-0', narrow && 'lg:hidden')}>
            <div className="w-8 h-8 rounded-xl bg-accent-gold/20 border border-accent-gold/30 flex items-center justify-center flex-shrink-0">
              <span className="font-serif text-accent-gold font-medium text-base leading-none">R</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm tracking-tight leading-tight">RITMO</p>
              <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/40 leading-none mt-0.5">Fleet Console</p>
            </div>
          </Link>
          {narrow && (
            <Link href="/" className="hidden lg:flex w-8 h-8 rounded-xl bg-accent-gold/20 border border-accent-gold/30 items-center justify-center mx-auto">
              <span className="font-serif text-accent-gold font-medium text-base leading-none">R</span>
            </Link>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Gold divider */}
        <div className={cn('mx-4 h-px mb-1 flex-shrink-0', narrow && 'lg:mx-2')}
          style={{ background: 'linear-gradient(90deg,transparent,#B39661,transparent)', opacity: 0.35 }} />

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto scrollbar-thin" aria-label="Main navigation">
          {navigation.map((group) => (
            <div key={group.title}>
              <p className={cn('px-2 mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40', narrow && 'lg:hidden')}>
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={cn(
                        'relative flex items-center gap-2.5 px-2 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'text-white bg-white/[0.12]'
                          : 'text-white/70 hover:text-white hover:bg-white/[0.07] hover:translate-x-0.5',
                        narrow && 'lg:justify-center lg:px-0 lg:py-2.5'
                      )}
                      style={isActive ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08)' } : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      title={narrow ? item.name : undefined}
                    >
                      {/* Active gold left bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-accent-gold" />
                      )}
                      <item.icon
                        className={cn('flex-shrink-0', isActive ? 'text-accent-gold' : 'text-white/50')}
                        style={{ width: '1rem', height: '1rem' }}
                        aria-hidden="true"
                      />
                      <span className={cn(narrow && 'lg:hidden')}>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 pb-3 flex-shrink-0">
          <div className={cn('mx-2 h-px mb-3', narrow && 'mx-1')}
            style={{ background: 'rgba(255,255,255,.08)' }} />
          <Link
            href="/settings"
            onClick={onCloseMobile}
            className={cn(
              'relative flex items-center gap-2.5 px-2 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              pathname.startsWith('/settings')
                ? 'text-white bg-white/[0.12]'
                : 'text-white/70 hover:text-white hover:bg-white/[0.07]',
              narrow && 'lg:justify-center lg:px-0'
            )}
            title={narrow ? 'Settings' : undefined}
          >
            {pathname.startsWith('/settings') && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-accent-gold" />
            )}
            <Settings className={cn('flex-shrink-0', pathname.startsWith('/settings') ? 'text-accent-gold' : 'text-white/50')} style={{ width: '1rem', height: '1rem' }} />
            <span className={cn(narrow && 'lg:hidden')}>Settings</span>
          </Link>
          <p className={cn('mt-3 px-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/25 truncate', narrow && 'lg:hidden')}>
            v1.0 · Fleet ops
          </p>
        </div>
      </aside>
    </>
  );
}

interface Me { username: string; email: string; is_admin: boolean; }

export function Header({ onOpenMobile }: { onOpenMobile: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    api.get<Me>('/auth/me').then((r) => setMe(r.data)).catch(() => undefined);
  }, []);

  const signOut = async () => {
    await axios.post('/api/auth/logout').catch(() => undefined);
    router.replace('/login');
    router.refresh();
  };

  const pageTitle = (() => {
    if (pathname === '/') return 'Dashboard';
    const flat = navigation.flatMap((g) => g.items);
    return flat.find((i) => i.href !== '/' && pathname.startsWith(i.href))?.name ?? 'Settings';
  })();

  return (
    <header className="sticky top-0 z-20 h-16 glass border-b border-border/70">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobile}
            className="lg:hidden p-2 rounded-xl text-text-secondary hover:bg-ops-card2 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden sm:block">
            <h1 className="font-serif text-[1.45rem] font-medium tracking-tight text-text-primary leading-tight">{pageTitle}</h1>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-ops-card border border-border shadow-soft hover:bg-ops-card2 transition-all"
            aria-label="User menu"
            aria-expanded={menuOpen}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#0E3F82,#072D62)' }}>
              {me?.username?.[0]?.toUpperCase() ?? <User className="h-3.5 w-3.5" />}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-text-primary leading-tight">{me?.username ?? '…'}</p>
              {me?.is_admin && <p className="text-[10px] text-accent-gold font-medium leading-tight">Admin</p>}
            </div>
            <ChevronDown className="hidden md:block h-3 w-3 text-text-tertiary" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 mt-2 w-56 z-20 bg-ops-card rounded-xl shadow-lift border border-border py-1 animate-menu-in"
                style={{ transformOrigin: 'top right' }}>
                <div className="px-4 py-3 border-b border-ops-line">
                  <p className="text-sm font-semibold text-text-primary">{me?.username}</p>
                  <p className="text-xs text-text-tertiary truncate mt-0.5">{me?.email}</p>
                  {me?.is_admin && (
                    <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-accent-gold">
                      Administrator
                    </span>
                  )}
                </div>
                <div className="p-1">
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-danger-soft rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ops-bg">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={cn('transition-all duration-300 ease-expo-out', collapsed ? 'lg:pl-16' : 'lg:pl-60')}>
        <Header onOpenMobile={() => setMobileOpen(true)} />
        <main className="p-4 lg:p-6 max-w-[1600px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
