import {
  LayoutDashboard, BookOpen, Clock, Plane, Truck, BarChart2, GitBranch, Building2,
  Car, Users, Handshake, Hotel, ClipboardList, Route, Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem { name: string; href: string; icon: LucideIcon; keywords?: string }
export interface NavGroup { title: string; items: NavItem[] }

/** Every page in the app (routes stay reachable by URL). */
const allGroups: NavGroup[] = [
  {
    title: 'Operations',
    items: [
      { name: 'Dashboard',  href: '/',          icon: LayoutDashboard, keywords: 'home overview' },
      { name: 'Bookings',   href: '/bookings',  icon: BookOpen,        keywords: 'trips transfers rides' },
      { name: 'Analytics',  href: '/analytics', icon: BarChart2,       keywords: 'charts volume' },
      { name: 'Schedulers', href: '/schedulers', icon: Clock,          keywords: 'jobs cron background' },
    ],
  },
  {
    title: 'Routing',
    items: [
      { name: 'Priority Rules',   href: '/priorities',       icon: GitBranch, keywords: 'vendor routing airline' },
      { name: 'Vendors',          href: '/vendors',          icon: Building2, keywords: 'cm channel manager' },
      { name: 'Transport Config', href: '/transport-config', icon: Truck,     keywords: 'vehicle allocation' },
      { name: 'Airports',         href: '/airports',         icon: Plane,     keywords: 'iata master data' },
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

/** Groups shown in the sidebar and command palette. */
const VISIBLE_GROUPS = ['Routing'];
const HIDDEN_PAGES = ['/transport-config'];
export const navigation: NavGroup[] = allGroups
  .filter((g) => VISIBLE_GROUPS.includes(g.title))
  .map((g) => ({ ...g, items: g.items.filter((i) => !HIDDEN_PAGES.includes(i.href)) }));

export const settingsItem: NavItem = { name: 'Settings', href: '/settings', icon: Settings, keywords: 'account profile' };

const flat = navigation.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })));

export const isActivePath = (href: string, pathname: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

/** Breadcrumb trail ("Routing" / "Vendors") for the current URL. */
export function crumbsFor(pathname: string): { group: string; name: string } | null {
  const hit = flat.find((i) => isActivePath(i.href, pathname));
  return hit ? { group: hit.group, name: hit.name } : null;
}

export const allNavItems = flat;
