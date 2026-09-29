'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  Clock,
  Plane,
  Truck,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  User,
  BarChart2,
  GitBranch,
  Building2,
  Car,
  Users,
  Handshake,
  Hotel,
  ClipboardList,
  Route,
  X,
} from 'lucide-react';

const navigation = [
  {
    title: 'Operations',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Bookings', href: '/bookings', icon: BookOpen },
      { name: 'Analytics', href: '/analytics', icon: BarChart2 },
      { name: 'Schedulers', href: '/schedulers', icon: Clock },
    ],
  },
  {
    title: 'Routing',
    items: [
      { name: 'Priority Rules', href: '/priorities', icon: GitBranch },
      { name: 'Vendors', href: '/vendors', icon: Building2 },
      { name: 'Transport Config', href: '/transport-config', icon: Truck },
      { name: 'Airports', href: '/airports', icon: Plane },
    ],
  },
  {
    title: 'Fleet',
    items: [
      { name: 'Vehicles', href: '/fleet', icon: Car },
      { name: 'Drivers', href: '/drivers', icon: Users },
      { name: 'Partners', href: '/partners', icon: Handshake },
      { name: 'Hotels', href: '/hotels', icon: Hotel },
      { name: 'Fleet Requests', href: '/fleet-requests', icon: ClipboardList },
      { name: 'Journeys', href: '/journeys', icon: Route },
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
  // The mobile drawer is always full width; collapse only applies on desktop.
  const narrow = collapsed;

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-white border-r border-secondary-200 transition-all duration-300 z-40 flex flex-col',
          'w-64 -translate-x-full lg:translate-x-0',
          mobileOpen && 'translate-x-0',
          narrow && 'lg:w-16'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-200">
          <Link href="/" className={cn('flex items-center gap-2', narrow && 'lg:hidden')}>
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-secondary-900">RITMO</span>
          </Link>
          <button
            onClick={onToggleCollapse}
            className="hidden lg:block p-1.5 rounded-lg text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-secondary-500 hover:bg-secondary-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" aria-label="Main navigation">
          {navigation.map((group) => (
            <div key={group.title}>
              <p className={cn('px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-secondary-400', narrow && 'lg:hidden')}>
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900',
                        narrow && 'lg:justify-center'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                      title={narrow ? item.name : undefined}
                    >
                      <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary-600')} aria-hidden="true" />
                      <span className={cn(narrow && 'lg:hidden')}>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-secondary-200">
          <Link
            href="/settings"
            onClick={onCloseMobile}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900',
              pathname.startsWith('/settings') && 'bg-primary-50 text-primary-700',
              narrow && 'lg:justify-center'
            )}
            title={narrow ? 'Settings' : undefined}
          >
            <Settings className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <span className={cn(narrow && 'lg:hidden')}>Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

interface Me {
  username: string;
  email: string;
  is_admin: boolean;
}

export function Header({ onOpenMobile }: { onOpenMobile: () => void }) {
  const router = useRouter();
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

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur border-b border-secondary-200">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenMobile}
            className="lg:hidden p-2 rounded-lg text-secondary-500 hover:bg-secondary-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-secondary-900 hidden sm:block">RITMO Fleet Management</h1>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary-100"
            aria-label="User menu"
            aria-expanded={menuOpen}
          >
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary-600" />
            </div>
            <span className="hidden md:block text-sm font-medium text-secondary-700">{me?.username ?? '…'}</span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 mt-2 w-56 z-20 bg-white rounded-lg shadow-lg border border-secondary-200 py-1">
                <div className="px-4 py-2 border-b border-secondary-100">
                  <p className="text-sm font-medium text-secondary-900">{me?.username}</p>
                  <p className="text-xs text-secondary-500 truncate">{me?.email}</p>
                  {me?.is_admin && <p className="text-xs text-primary-600 mt-0.5">Administrator</p>}
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
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
    <div className="min-h-screen bg-secondary-50">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={cn('transition-all duration-300', collapsed ? 'lg:pl-16' : 'lg:pl-64')}>
        <Header onOpenMobile={() => setMobileOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
