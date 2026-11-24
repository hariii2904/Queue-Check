export type Role = 'patient' | 'receptionist' | 'admin';

export type Language = 'en' | 'ta';

/**
 * Queue data transparency status:
 * - LIVE: Actual queue data is being updated through an authorized connected source.
 * - RECENTLY_UPDATED: Actual data was received recently, but real-time connection is currently offline.
 * - UNAVAILABLE: No actual queue data is available (for unpartnered public hospitals).
 * - DEMO: Explicit sample data for development/demonstration only.
 */
export type QueueFreshness = 'LIVE' | 'RECENTLY_UPDATED' | 'UNAVAILABLE' | 'DEMO';

export type QueueStatus = 'active' | 'paused' | 'closed';

export type TokenStatus = 'waiting' | 'consulting' | 'completed' | 'skipped' | 'no_show' | 'cancelled';

export type EventType = 
  | 'registered' 
  | 'called' 
  | 'started' 
  | 'completed' 
  | 'skipped' 
  | 'no_show' 
  | 'paused' 
  | 'resumed'
  | 'cancelled';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type VerificationStatus = 'verified' | 'unverified' | 'partner' | 'community_submitted';

export interface HospitalSource {
  id: string;
  hospital_id: string;
  source_name: string; // e.g. "OpenStreetMap Overpass API", "Official Hospital Portal", "TN Health Registry"
  source_url?: string;
  verified_at: string;
  verification_status: VerificationStatus;
  license?: string; // e.g. "ODbL - OpenStreetMap contributors", "Public Domain"
  notes?: string;
}

export interface Department {
  id: string;
  hospital_id: string;
  name: string;
  name_ta?: string;
  opd_timings?: string;
  floor_room?: string;
  created_at?: string;
}

export interface HospitalStaff {
  id: string;
  profile_id: string;
  hospital_id: string;
  role: 'receptionist' | 'admin' | 'nurse' | 'doctor';
  department_id?: string;
  created_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  name_ta?: string;
  address: string;
  address_ta?: string;
  area: string;
  area_ta?: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  emergency_phone?: string;
  website?: string;
  opening_time: string;
  closing_time: string;
  status: 'active' | 'pending' | 'inactive';
  is_partner_queue: boolean; // TRUE only if hospital staff actually manages queue via QueueCheck
  data_source: string;
  data_source_url?: string;
  verification_status: VerificationStatus;
  last_verified: string;
  departments?: string[];
  osm_id?: string;
  created_at: string;
}

export interface Doctor {
  id: string;
  hospital_id: string;
  department_id?: string;
  name: string;
  name_ta?: string;
  specialty: string;
  specialty_ta?: string;
  room_number: string;
  consultation_duration: number; // in minutes
  availability_status: 'available' | 'on_break' | 'off_duty';
  opd_timings?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  hospital_id?: string;
  preferred_language: Language;
  phone?: string;
  created_at: string;
}

export interface Patient {
  id: string;
  profile_id?: string;
  display_name: string;
  phone?: string;
  created_at: string;
}

export interface Queue {
  id: string;
  hospital_id: string;
  doctor_id: string;
  department_id?: string;
  queue_date: string;
  queue_status: QueueStatus;
  current_token_id?: string;
  current_token_number?: string;
  pause_reason?: string;
  last_updated: string;
  created_at: string;
}

export interface Token {
  id: string;
  queue_id: string;
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  token_number: string;
  category: 'general' | 'followup' | 'emergency' | 'senior';
  status: TokenStatus;
  registered_at: string;
  called_at?: string;
  completed_at?: string;
  position_in_queue?: number;
  hospital_name?: string;
  doctor_name?: string;
  department_name?: string;
}

export interface QueueEvent {
  id: string;
  queue_id: string;
  token_id?: string;
  event_type: EventType;
  event_timestamp: string;
  notes?: string;
}

export interface Prediction {
  id: string;
  queue_id: string;
  token_id: string;
  estimated_minutes: number;
  lower_estimate: number;
  upper_estimate: number;
  confidence_level: ConfidenceLevel;
  calculated_at: string;
  factors?: {
    patients_ahead: number;
    patientsAhead?: number;
    avg_duration_used: number;
    queue_paused: boolean;
    sample_size: number;
  };
}

export interface ClinicWithQueueSummary extends Hospital {
  doctors: (Doctor & {
    queue?: Queue;
    waiting_count: number;
    current_token?: string;
    estimated_wait_minutes: number;
  })[];
  total_waiting: number;
  total_doctors: number;
  freshness: QueueFreshness;
  last_updated: string;
  min_wait_time: number;
  max_wait_time: number;
  distance_km?: number;
}

export interface NotificationAlert {
  id: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  token_id?: string;
}
