// Shared TanStack Query hooks and keys. Pages should read data through these (or a local
// useQuery) instead of fetching in useEffect, so lists are cached across navigation.
import { useQuery } from '@tanstack/react-query';
import api, { airportApi, bookingApi, priorityApi, schedulerApi, statsApi, transportConfigApi } from '@/lib/api';
import type { BookingFilters } from '@/types';

export const queryKeys = {
  list: (endpoint: string, params?: unknown) => ['list', endpoint, params ?? null] as const,
  listAll: (endpoint: string) => ['list', endpoint] as const,
  bookings: (filters: BookingFilters) => ['bookings', filters] as const,
  booking: (ritmoId: string) => ['booking', ritmoId] as const,
  stats: (days: number) => ['stats', days] as const,
  sourceSystems: ['source-systems'] as const,
  vehicleMappings: ['vehicle-mappings'] as const,
  me: ['me'] as const,
  schedulers: ['schedulers'] as const,
  airports: ['airports'] as const,
  transportConfig: ['transport-config'] as const,
};

export function useList<T = any>(endpoint: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.list(endpoint, params),
    queryFn: () => api.get<T[]>(endpoint, { params }).then((r) => r.data),
  });
}

/** Source systems come from the backend registry, so the UI never drifts from it. */
export function useSourceSystems() {
  return useQuery({
    queryKey: queryKeys.sourceSystems,
    queryFn: () => priorityApi.sourceSystems().then((r) => r.data),
    staleTime: 10 * 60_000,
  });
}

export function useVehicleMappings() {
  return useQuery({ queryKey: queryKeys.vehicleMappings, queryFn: () => priorityApi.vehicleMappings().then((r) => r.data) });
}

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () =>
      api
        .get<{ username: string; email: string; is_admin: boolean; is_active: boolean }>('/auth/me')
        .then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

export const useDashboardStats = (days = 14, refetchInterval?: number) =>
  useQuery({ queryKey: queryKeys.stats(days), queryFn: () => statsApi.get(days).then((r) => r.data), refetchInterval });

export const useBookings = (filters: BookingFilters, refetchInterval?: number) =>
  useQuery({
    queryKey: queryKeys.bookings(filters),
    queryFn: () => bookingApi.list(filters).then((r) => r.data),
    placeholderData: (prev) => prev, // keep the old page visible while the next one loads
    refetchInterval,
  });

export const useSchedulerStatus = () =>
  useQuery({
    queryKey: queryKeys.schedulers,
    queryFn: () => schedulerApi.getStatus().then((r) => r.data),
    refetchInterval: 30_000, // pauses automatically while the tab is hidden
  });

export const useAirports = () =>
  useQuery({ queryKey: queryKeys.airports, queryFn: () => airportApi.list({ active_only: false, limit: 5000 }).then((r) => r.data) });

export const useTransportConfigs = () =>
  useQuery({
    queryKey: queryKeys.transportConfig,
    queryFn: () => transportConfigApi.list({ active_only: false }).then((r) => r.data),
  });
