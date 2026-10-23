import axios, { AxiosError } from 'axios';

// Same-origin: the Next.js server proxies /api/backend/* to the FastAPI backend and
// attaches the API keys and the session JWT. Nothing secret lives in the browser.
const api = axios.create({
  baseURL: '/api/backend',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const onLogin = window.location.pathname === '/login';
      if (!onLogin) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?next=${next}`;
      }
    }
    return Promise.reject(error);
  }
);

/** Turn any axios/FastAPI error into a readable message. */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const data = (error as AxiosError<any>)?.response?.data;
  if (data) {
    // main.py's validation handler: { detail: "Invalid request data.", errors: { field: message } }
    if (data.errors && typeof data.errors === 'object') {
      const fields = Object.entries(data.errors).map(([k, v]) => `${k}: ${v}`);
      if (fields.length) return fields.join('; ');
    }
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
    }
    // flat { field: message } object
    if (typeof data === 'object') {
      const parts = Object.entries(data)
        .filter(([, v]) => typeof v === 'string')
        .map(([k, v]) => `${k}: ${v}`);
      if (parts.length) return parts.join('; ');
    }
  }
  if ((error as AxiosError)?.code === 'ECONNABORTED') return 'Request timed out';
  return fallback;
}

// ── Admin: bookings, stats, priority rules ─────────────────────
import type {
  BookingDetail,
  BookingListResponse,
  BookingFilters,
  DashboardStats,
  PriorityRule,
  PriorityRuleInput,
  SchedulerStatus,
  Vendor,
  VehicleTypeMapping,
  SourceSystemInfo,
  Airport,
  TransportConfig,
} from '@/types';

export const bookingApi = {
  list: (params?: BookingFilters) => api.get<BookingListResponse>('/admin/bookings', { params }),
  get: (ritmoId: string) => api.get<BookingDetail>(`/admin/bookings/${encodeURIComponent(ritmoId)}`),
};

export const statsApi = {
  get: (days = 14) => api.get<DashboardStats>('/admin/dashboard/stats', { params: { days } }),
};

export const priorityApi = {
  list: () => api.get<PriorityRule[]>('/admin/priority-rules'),
  create: (data: PriorityRuleInput) => api.post<PriorityRule>('/admin/priority-rules', data),
  update: (id: number, data: Partial<PriorityRuleInput>) =>
    api.patch<PriorityRule>(`/admin/priority-rules/${id}`, data),
  delete: (id: number) => api.delete(`/admin/priority-rules/${id}`),
  vehicleMappings: () => api.get<VehicleTypeMapping[]>('/admin/vehicle-type-mappings'),
  sourceSystems: () => api.get<SourceSystemInfo[]>('/admin/source-systems'),
};

export const vendorApi = {
  list: (params?: { cm_provider?: string; is_active?: boolean }) =>
    api.get<Vendor[]>('/vendors', { params }),
  create: (data: Omit<Vendor, 'id'>) => api.post<Vendor>('/vendors', data),
  update: (id: number, data: Partial<Omit<Vendor, 'id' | 'code'>>) =>
    api.patch<Vendor>(`/vendors/${id}`, data),
  delete: (id: number) => api.delete(`/vendors/${id}`),
};

export const schedulerApi = {
  getStatus: () => api.get<SchedulerStatus>('/iway/schedulers/status'),
  run: (job: 'booking-dispatcher' | 'result-pusher') => api.post(`/iway/schedulers/${job}/run`),
  pause: (job: 'booking-dispatcher' | 'result-pusher') => api.post(`/iway/schedulers/${job}/pause`),
  resume: (job: 'booking-dispatcher' | 'result-pusher') => api.post(`/iway/schedulers/${job}/resume`),
};

export const airportApi = {
  list: (params?: { active_only?: boolean; limit?: number }) => api.get<Airport[]>('/airports', { params }),
  create: (data: Partial<Airport>) => api.post<Airport>('/airports', data),
  update: (iata: string, data: Partial<Airport>) => api.put<Airport>(`/airports/${iata}`, data),
  delete: (iata: string) => api.delete(`/airports/${iata}`),
  bulkUpload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/airports/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const transportConfigApi = {
  list: (params?: { active_only?: boolean; cm_provider?: string }) =>
    api.get<TransportConfig[]>('/transport-config', { params }),
  create: (data: Partial<TransportConfig>) => api.post<TransportConfig>('/transport-config', data),
  update: (flightClass: string, data: Partial<TransportConfig>, cmProvider = 'iway') =>
    api.put<TransportConfig>(`/transport-config/${flightClass}`, data, { params: { cm_provider: cmProvider } }),
  delete: (flightClass: string, cmProvider = 'iway') =>
    api.delete(`/transport-config/${flightClass}`, { params: { cm_provider: cmProvider } }),
  seed: () => api.post('/transport-config/seed'),
};

export default api;
