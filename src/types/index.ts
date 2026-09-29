// Field names mirror the backend's snake_case JSON.

export interface Booking {
  id: number;
  ritmo_booking_id: string;
  external_booking_ref: string | null;
  external_pax_ref: string;
  source_system: string;
  cm_provider: string | null;
  passenger_name: string;
  pax_type: string;
  airport_iata: string | null;
  hotel_name: string;
  transport_type: string;
  pickup_date: string;
  pickup_time: string;
  flight_number: string | null;
  vehicle_type: string | null;
  status: string;
  sync_status: string;
  cm_order_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string | null;
}

export interface BookingDetail extends Booking {
  passenger_phone: string | null;
  passenger_email: string | null;
  baggage_count: number | null;
  airport_address: string | null;
  hotel_address: string;
  cabin_class: string | null;
  airline_code: string | null;
  cm_booking_id: string | null;
  cm_transaction_id: string | null;
  cm_status: number | null;
  cm_price: number | null;
  cm_currency: string | null;
  voucher_url: string | null;
  driver_vehicle: string | null;
  dispatcher_phone: string | null;
  error_detail: string | null;
  cancel_reason: string | null;
  remarks: string | null;
  cm_request_payload: unknown;
  cm_response_payload: unknown;
  callback_response: string | null;
}

export interface BookingListResponse {
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
}

export interface BookingFilters {
  q?: string;
  status?: string;
  source_system?: string;
  cm_provider?: string;
  pickup_from?: string;
  pickup_to?: string;
  include_inactive?: boolean;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  total: number;
  by_status: Record<string, number>;
  by_source_system: Record<string, number>;
  by_cm_provider: Record<string, number>;
  daily: { date: string; count: number }[];
  needs_attention: number;
}

export interface PriorityRule {
  id: number;
  source_system: string;
  airline: string;
  airport_code: string | null;
  priority_order: number;
  cm_provider: string;
  vendor_id: number | null;
  vendor_code: string | null;
  vendor_name: string | null;
  waiting_time_seconds: number;
  modify_cutoff_seconds: number;
}

export interface PriorityRuleInput {
  source_system: string;
  airline: string;
  airport_code: string | null;
  priority_order: number;
  cm_provider: string;
  vendor_id: number | null;
  waiting_time_seconds: number;
  modify_cutoff_seconds: number;
}

export interface VehicleTypeMapping {
  id: number;
  source_vehicle_type: string;
  cm_provider: string;
  cm_vehicle_code: string;
}

export interface SourceSystemInfo {
  value: string;
  cm_provider: string;
  sync_dispatch: boolean;
}

export interface Vendor {
  id: number;
  code: string;
  name: string;
  cm_provider: string;
  description: string | null;
  is_active: boolean;
}

export interface JobStatus {
  enabled: boolean;
  interval_minutes: number;
  next_run: string | null;
  last_run: string | null;
}

export interface SchedulerStatus {
  booking_dispatcher: JobStatus;
  result_pusher: JobStatus;
}

export interface Airport {
  id: number;
  iata_code: string;
  name: string;
  city: string;
  country: string;
  address: string;
  terminal: string | null;
  lat: number | null;
  lng: number | null;
  is_active: boolean;
}

export interface TransportConfig {
  id: number;
  flight_class: string;
  cm_provider: string;
  flight_class_label: string | null;
  max_pax_per_vehicle: number;
  is_private: boolean;
  is_active: boolean;
  preferred_vehicle_tier: string[] | null;
  minibus_threshold: number | null;
  minibus_vehicle_tiers: string[] | null;
  family_max_pax: number | null;
  max_bags_per_vehicle: number | null;
}

export type CreateAirportRequest = Omit<Airport, 'id' | 'terminal' | 'lat' | 'lng'> & {
  terminal?: string;
  lat?: number;
  lng?: number;
};
export type UpdateAirportRequest = Partial<Omit<CreateAirportRequest, 'iata_code'>>;

