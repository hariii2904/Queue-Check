import {
  Hospital,
  HospitalSource,
  Department,
  Doctor,
  Queue,
  Token,
  ClinicWithQueueSummary,
  Prediction,
  Profile,
  QueueEvent,
  EventType,
  VerificationStatus,
} from '../types';
import {
  REAL_CHENNAI_HOSPITALS,
  VERIFIED_CHENNAI_SOURCES,
  REAL_DEPARTMENTS,
  REAL_DOCTORS,
  REAL_ACTIVE_QUEUES,
  REAL_TOKENS,
  REAL_PROFILES,
  REAL_QUEUE_EVENTS,
} from '../data/mockData';
import { PredictionEngine } from './predictionEngine';
import { OsmHospitalService } from './osmHospitalService';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEYS = {
  HOSPITALS: 'queuecheck_real_hospitals',
  SOURCES: 'queuecheck_real_sources',
  DEPARTMENTS: 'queuecheck_real_departments',
  DOCTORS: 'queuecheck_real_doctors',
  QUEUES: 'queuecheck_real_queues',
  TOKENS: 'queuecheck_real_tokens',
  PROFILES: 'queuecheck_real_profiles',
  EVENTS: 'queuecheck_real_events',
};

// Event-driven reactive store for instant multi-tab sync
type Listener = () => void;
class QueueEventEmitter {
  private listeners: Set<Listener> = new Set();
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('queuecheck_events');
        this.channel.onmessage = () => {
          this.notifyLocal();
        };
      } catch {
        // Fallback if BroadcastChannel is blocked
      }
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public emit() {
    this.notifyLocal();
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'UPDATE', timestamp: Date.now() });
      } catch {
        // ignore
      }
    }
  }

  private notifyLocal() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Listener notification error:', err);
      }
    });
  }
}

export const queueEvents = new QueueEventEmitter();

class DataService {
  constructor() {
    this.initLocalStorage();
  }

  private initLocalStorage() {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(STORAGE_KEYS.HOSPITALS)) {
      localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(REAL_CHENNAI_HOSPITALS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SOURCES)) {
      localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(VERIFIED_CHENNAI_SOURCES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(REAL_DEPARTMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DOCTORS)) {
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(REAL_DOCTORS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUEUES)) {
      localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(REAL_ACTIVE_QUEUES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TOKENS)) {
      localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(REAL_TOKENS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(REAL_PROFILES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(REAL_QUEUE_EVENTS));
    }
  }

  public resetDemoData() {
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(REAL_CHENNAI_HOSPITALS));
    localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(VERIFIED_CHENNAI_SOURCES));
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(REAL_DEPARTMENTS));
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(REAL_DOCTORS));
    localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(REAL_ACTIVE_QUEUES));
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(REAL_TOKENS));
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(REAL_PROFILES));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(REAL_QUEUE_EVENTS));
    queueEvents.emit();
  }

  private logQueueEvent(queueId: string, eventType: EventType, tokenId?: string, notes?: string) {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
      const events: QueueEvent[] = raw ? JSON.parse(raw) : [];
      const newEvent: QueueEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        queue_id: queueId,
        token_id: tokenId,
        event_type: eventType,
        event_timestamp: new Date().toISOString(),
        notes,
      };
      events.unshift(newEvent);
      if (events.length > 100) events.length = 100;
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    } catch {
      // Storage unavailable
    }
  }

  public async getQueueEvents(queueId?: string): Promise<QueueEvent[]> {
    if (typeof window === 'undefined') return REAL_QUEUE_EVENTS;
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    const events: QueueEvent[] = raw ? JSON.parse(raw) : REAL_QUEUE_EVENTS;
    return queueId ? events.filter((e) => e.queue_id === queueId) : events;
  }

  // --- OSM LIVE FETCH & MERGE ---

  public async fetchAndMergeOsmHospitals(bbox?: [number, number, number, number]): Promise<number> {
    const { hospitals: osmHospitals, sources: osmSources } = await OsmHospitalService.fetchHospitalsFromOSM(bbox);
    if (osmHospitals.length === 0) return 0;

    const existingHospitals = await this.getHospitals();
    const existingIds = new Set(existingHospitals.map((h) => h.id));
    const existingNames = new Set(existingHospitals.map((h) => h.name.toLowerCase()));

    const newHospitals: Hospital[] = [];
    osmHospitals.forEach((osmH) => {
      if (!existingIds.has(osmH.id) && !existingNames.has(osmH.name.toLowerCase())) {
        newHospitals.push(osmH);
      }
    });

    if (newHospitals.length > 0) {
      const merged = [...existingHospitals, ...newHospitals];
      localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(merged));

      const existingSources = await this.getHospitalSources();
      const mergedSources = [...existingSources, ...osmSources];
      localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(mergedSources));

      queueEvents.emit();
    }

    return newHospitals.length;
  }

  // --- GETTERS (LOCAL / SUPABASE) ---

  public async getHospitals(): Promise<Hospital[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('hospitals').select('*');
      if (!error && data && data.length > 0) return data as Hospital[];
    }
    const raw = localStorage.getItem(STORAGE_KEYS.HOSPITALS);
    return raw ? JSON.parse(raw) : REAL_CHENNAI_HOSPITALS;
  }

  public async getHospitalById(id: string): Promise<Hospital | null> {
    const hospitals = await this.getHospitals();
    return hospitals.find((h) => h.id === id) || null;
  }

  public async getHospitalSources(hospitalId?: string): Promise<HospitalSource[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('hospital_sources').select('*');
      if (hospitalId) query = query.eq('hospital_id', hospitalId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as HospitalSource[];
    }
    const raw = localStorage.getItem(STORAGE_KEYS.SOURCES);
    const sources: HospitalSource[] = raw ? JSON.parse(raw) : VERIFIED_CHENNAI_SOURCES;
    return hospitalId ? sources.filter((s) => s.hospital_id === hospitalId) : sources;
  }

  public async getDepartments(hospitalId?: string): Promise<Department[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('departments').select('*');
      if (hospitalId) query = query.eq('hospital_id', hospitalId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as Department[];
    }
    const raw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    const depts: Department[] = raw ? JSON.parse(raw) : REAL_DEPARTMENTS;
    return hospitalId ? depts.filter((d) => d.hospital_id === hospitalId) : depts;
  }

  public async getDoctors(hospitalId?: string): Promise<Doctor[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('doctors').select('*');
      if (hospitalId) query = query.eq('hospital_id', hospitalId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as Doctor[];
    }
    const raw = localStorage.getItem(STORAGE_KEYS.DOCTORS);
    const doctors: Doctor[] = raw ? JSON.parse(raw) : REAL_DOCTORS;
    return hospitalId ? doctors.filter((d) => d.hospital_id === hospitalId) : doctors;
  }

  public async getQueues(hospitalId?: string): Promise<Queue[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('queues').select('*');
      if (hospitalId) query = query.eq('hospital_id', hospitalId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as Queue[];
    }
    const raw = localStorage.getItem(STORAGE_KEYS.QUEUES);
    const queues: Queue[] = raw ? JSON.parse(raw) : REAL_ACTIVE_QUEUES;
    return hospitalId ? queues.filter((q) => q.hospital_id === hospitalId) : queues;
  }

  public async getTokens(queueId?: string): Promise<Token[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('tokens').select('*').order('registered_at', { ascending: true });
      if (queueId) query = query.eq('queue_id', queueId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as Token[];
    }
    const raw = localStorage.getItem(STORAGE_KEYS.TOKENS);
    const tokens: Token[] = raw ? JSON.parse(raw) : REAL_TOKENS;
    return queueId ? tokens.filter((t) => t.queue_id === queueId) : tokens;
  }

  public async getTokenById(tokenId: string): Promise<{ token: Token; queue: Queue; doctor: Doctor; hospital: Hospital } | null> {
    const tokens = await this.getTokens();
    const token = tokens.find((t) => t.id === tokenId || t.token_number.toUpperCase() === tokenId.toUpperCase());
    if (!token) return null;

    const queues = await this.getQueues();
    const queue = queues.find((q) => q.id === token.queue_id);
    if (!queue) return null;

    const doctors = await this.getDoctors();
    const doctor = doctors.find((d) => d.id === queue.doctor_id);
    if (!doctor) return null;

    const hospitals = await this.getHospitals();
    const hospital = hospitals.find((h) => h.id === queue.hospital_id);
    if (!hospital) return null;

    return { token, queue, doctor, hospital };
  }

  public async getPatientTokens(patientPhoneOrName?: string): Promise<Token[]> {
    const tokens = await this.getTokens();
    if (!patientPhoneOrName) return tokens.slice(-10);

    const term = patientPhoneOrName.toLowerCase();
    return tokens
      .filter((t) => (t.patient_phone && t.patient_phone.includes(term)) || t.patient_name.toLowerCase().includes(term))
      .sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime());
  }

  public async getClinicSummaries(): Promise<ClinicWithQueueSummary[]> {
    const hospitals = await this.getHospitals();
    const doctors = await this.getDoctors();
    const queues = await this.getQueues();
    const allTokens = await this.getTokens();

    return hospitals.map((hospital) => {
      const hospitalDoctors = doctors.filter((d) => d.hospital_id === hospital.id);

      // If hospital is NOT an authorized partner queue, queue data is strictly UNAVAILABLE
      if (!hospital.is_partner_queue) {
        // Distance mock calculation from Central Chennai
        const baseLat = 13.0827;
        const baseLng = 80.2707;
        const dLat = (hospital.latitude - baseLat) * 111;
        const dLng = (hospital.longitude - baseLng) * 111 * Math.cos(baseLat * (Math.PI / 180));
        const distance = Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 10) / 10;

        return {
          ...hospital,
          doctors: hospitalDoctors.map((doc) => ({
            ...doc,
            waiting_count: 0,
            current_token: 'Unavailable',
            estimated_wait_minutes: 0,
          })),
          total_waiting: 0,
          total_doctors: hospitalDoctors.length,
          freshness: 'UNAVAILABLE',
          last_updated: hospital.last_verified ? new Date(hospital.last_verified).toLocaleDateString() : 'Verified Registry',
          min_wait_time: 0,
          max_wait_time: 0,
          distance_km: distance,
        };
      }

      // For partner queues with connected receptionist desks:
      let totalWaiting = 0;
      let minWait = 999;
      let maxWait = 0;

      const doctorsWithQueue = hospitalDoctors.map((doc) => {
        const queue = queues.find((q) => q.doctor_id === doc.id);
        const docTokens = queue ? allTokens.filter((t) => t.queue_id === queue.id) : [];
        const waitingTokens = docTokens.filter((t) => t.status === 'waiting');
        const consultingToken = docTokens.find((t) => t.status === 'consulting');

        const waitingCount = waitingTokens.length + (consultingToken ? 1 : 0);
        totalWaiting += waitingCount;

        const est = queue
          ? PredictionEngine.estimateForNewWalkIn(queue, doc, docTokens)
          : { minutes: doc.consultation_duration * 2, lower: 5, upper: 15 };

        if (est.minutes < minWait) minWait = est.minutes;
        if (est.minutes > maxWait) maxWait = est.minutes;

        return {
          ...doc,
          queue,
          waiting_count: waitingCount,
          current_token: queue?.current_token_number || consultingToken?.token_number || 'None',
          estimated_wait_minutes: est.minutes,
        };
      });

      const baseLat = 13.0827;
      const baseLng = 80.2707;
      const dLat = (hospital.latitude - baseLat) * 111;
      const dLng = (hospital.longitude - baseLng) * 111 * Math.cos(baseLat * (Math.PI / 180));
      const distance = Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 10) / 10;

      return {
        ...hospital,
        doctors: doctorsWithQueue,
        total_waiting: totalWaiting,
        total_doctors: hospitalDoctors.length,
        freshness: hospital.status === 'active' ? 'LIVE' : 'UNAVAILABLE',
        last_updated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        min_wait_time: minWait === 999 ? 10 : minWait,
        max_wait_time: maxWait === 0 ? 30 : maxWait,
        distance_km: distance,
      };
    });
  }

  // --- ACTIONS (MUTATIONS) ---

  public async registerWalkInToken(
    queueId: string,
    patientName: string,
    patientPhone: string = '',
    category: 'general' | 'followup' | 'emergency' | 'senior' = 'general'
  ): Promise<Token> {
    const tokens = await this.getTokens();
    const queueTokens = tokens.filter((t) => t.queue_id === queueId);
    const queues = await this.getQueues();
    const currentQueue = queues.find((q) => q.id === queueId);
    const doctors = await this.getDoctors();
    const currentDoc = doctors.find((d) => d.id === currentQueue?.doctor_id);
    const hospitals = await this.getHospitals();
    const currentHosp = hospitals.find((h) => h.id === currentQueue?.hospital_id);

    // Prefix based on queue or doctor
    const prefixMap: Record<string, string> = {
      'queue-ag-1': 'A',
      'queue-ag-2': 'B',
      'queue-ka-1': 'C',
    };
    const prefix = prefixMap[queueId] || 'T';

    const existingNumbers = queueTokens.map((t) => {
      const match = t.token_number.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const maxSeq = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const nextSeq = maxSeq + 1;
    const tokenNumber = `${prefix}${nextSeq.toString().padStart(3, '0')}`;

    const waitingTokens = queueTokens.filter((t) => t.status === 'waiting');

    const newToken: Token = {
      id: `tok-${queueId}-${tokenNumber}-${Date.now()}`,
      queue_id: queueId,
      patient_id: `pat-${Date.now()}`,
      patient_name: patientName.trim() || `Patient ${tokenNumber}`,
      patient_phone: patientPhone.trim(),
      token_number: tokenNumber,
      category,
      status: 'waiting',
      registered_at: new Date().toISOString(),
      position_in_queue: waitingTokens.length + 1,
      hospital_name: currentHosp?.name || 'Participating Healthcare Center',
      doctor_name: currentDoc?.name || 'Attending Physician',
      department_name: currentDoc?.specialty || 'Outpatient Services',
    };

    tokens.push(newToken);
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));

    // Update queue last_updated
    const qIndex = queues.findIndex((q) => q.id === queueId);
    if (qIndex >= 0) {
      queues[qIndex].last_updated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(queues));
    }

    this.logQueueEvent(
      queueId,
      'registered',
      newToken.id,
      `Walk-in patient ${newToken.patient_name} registered for Token ${newToken.token_number} (${currentDoc?.name})`
    );

    queueEvents.emit();
    return newToken;
  }

  public async callNextToken(queueId: string): Promise<Token | null> {
    const tokens = await this.getTokens();
    const queueTokens = tokens.filter((t) => t.queue_id === queueId);

    const nextWaiting = queueTokens
      .filter((t) => t.status === 'waiting')
      .sort((a, b) => new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime())[0];

    if (!nextWaiting) return null;

    queueTokens.forEach((t) => {
      if (t.status === 'consulting') {
        t.status = 'completed';
        t.completed_at = new Date().toISOString();
        this.logQueueEvent(queueId, 'completed', t.id, `Consultation auto-completed for prior Token ${t.token_number}`);
      }
    });

    nextWaiting.status = 'consulting';
    nextWaiting.called_at = new Date().toISOString();
    nextWaiting.position_in_queue = 0;

    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));

    const queues = await this.getQueues();
    const q = queues.find((q) => q.id === queueId);
    if (q) {
      q.current_token_id = nextWaiting.id;
      q.current_token_number = nextWaiting.token_number;
      q.last_updated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(queues));
    }

    this.logQueueEvent(
      queueId,
      'called',
      nextWaiting.id,
      `Token ${nextWaiting.token_number} called to consultation chamber`
    );

    queueEvents.emit();
    return nextWaiting;
  }

  public async completeConsultation(tokenId: string): Promise<boolean> {
    const tokens = await this.getTokens();
    const token = tokens.find((t) => t.id === tokenId);
    if (!token) return false;

    token.status = 'completed';
    token.completed_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));

    const queues = await this.getQueues();
    const q = queues.find((q) => q.id === token.queue_id);
    if (q && q.current_token_id === tokenId) {
      q.current_token_id = undefined;
      q.current_token_number = 'None';
      q.last_updated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(queues));
    }

    this.logQueueEvent(
      token.queue_id,
      'completed',
      token.id,
      `Consultation completed for Token ${token.token_number}`
    );

    queueEvents.emit();
    return true;
  }

  public async cancelToken(tokenId: string): Promise<boolean> {
    const tokens = await this.getTokens();
    const token = tokens.find((t) => t.id === tokenId);
    if (!token) return false;

    token.status = 'cancelled';
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));

    const queues = await this.getQueues();
    const q = queues.find((q) => q.id === token.queue_id);
    if (q && q.current_token_id === tokenId) {
      q.current_token_id = undefined;
      q.current_token_number = 'None';
      q.last_updated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(queues));
    }

    this.logQueueEvent(
      token.queue_id,
      'cancelled',
      token.id,
      `Token ${token.token_number} cancelled by patient`
    );

    queueEvents.emit();
    return true;
  }

  public async skipToken(tokenId: string): Promise<boolean> {
    const tokens = await this.getTokens();
    const token = tokens.find((t) => t.id === tokenId);
    if (!token) return false;

    token.status = 'skipped';
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));

    const queues = await this.getQueues();
    const q = queues.find((q) => q.id === token.queue_id);
    if (q && q.current_token_id === tokenId) {
      q.current_token_id = undefined;
      q.current_token_number = 'None';
      q.last_updated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(queues));
    }

    this.logQueueEvent(
      token.queue_id,
      'skipped',
      token.id,
      `Token ${token.token_number} skipped by clinic staff`
    );

    queueEvents.emit();
    return true;
  }

  public async markNoShow(tokenId: string): Promise<boolean> {
    const tokens = await this.getTokens();
    const token = tokens.find((t) => t.id === tokenId);
    if (!token) return false;

    token.status = 'no_show';
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));

    const queues = await this.getQueues();
    const q = queues.find((q) => q.id === token.queue_id);
    if (q && q.current_token_id === tokenId) {
      q.current_token_id = undefined;
      q.current_token_number = 'None';
      q.last_updated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(queues));
    }

    this.logQueueEvent(
      token.queue_id,
      'no_show',
      token.id,
      `Token ${token.token_number} marked as No-Show by clinic staff`
    );

    queueEvents.emit();
    return true;
  }

  public async pauseQueue(queueId: string, reason?: string): Promise<boolean> {
    const queues = await this.getQueues();
    const q = queues.find((q) => q.id === queueId);
    if (!q) return false;

    q.queue_status = 'paused';
    q.pause_reason = reason || 'Doctor attending urgent cases / On break';
    q.last_updated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(queues));

    this.logQueueEvent(
      queueId,
      'paused',
      undefined,
      reason || 'Doctor on short break / Queue temporarily paused'
    );

    queueEvents.emit();
    return true;
  }

  public async resumeQueue(queueId: string): Promise<boolean> {
    const queues = await this.getQueues();
    const q = queues.find((q) => q.id === queueId);
    if (!q) return false;

    q.queue_status = 'active';
    q.pause_reason = undefined;
    q.last_updated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(queues));

    this.logQueueEvent(
      queueId,
      'resumed',
      undefined,
      'Queue resumed by clinic staff'
    );

    queueEvents.emit();
    return true;
  }

  public async updateHospital(hospitalId: string, updates: Partial<Hospital>): Promise<boolean> {
    const hospitals = await this.getHospitals();
    const hosp = hospitals.find((h) => h.id === hospitalId);
    if (!hosp) return false;

    Object.assign(hosp, updates);
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(hospitals));
    queueEvents.emit();
    return true;
  }

  public async updateHospitalSource(sourceId: string, updates: Partial<HospitalSource>): Promise<boolean> {
    const sources = await this.getHospitalSources();
    const src = sources.find((s) => s.id === sourceId);
    if (!src) return false;

    Object.assign(src, updates);
    localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(sources));
    queueEvents.emit();
    return true;
  }

  public async addHospital(data: Partial<Hospital>): Promise<Hospital> {
    const hospitals = await this.getHospitals();
    const newHospital: Hospital = {
      id: `hosp-${Date.now()}`,
      name: data.name || 'New Health Facility',
      name_ta: data.name_ta || data.name,
      address: data.address || 'Chennai, Tamil Nadu',
      address_ta: data.address_ta || data.address,
      area: data.area || 'Central Chennai',
      area_ta: data.area_ta || data.area,
      city: 'Chennai',
      latitude: data.latitude || 13.0827,
      longitude: data.longitude || 80.2707,
      phone: data.phone || '+91 44 2000 0000',
      emergency_phone: data.emergency_phone,
      website: data.website,
      opening_time: data.opening_time || '08:30 AM',
      closing_time: data.closing_time || '08:00 PM',
      status: 'active',
      is_partner_queue: data.is_partner_queue || false,
      data_source: data.data_source || 'Administrator Verified Submission',
      data_source_url: data.data_source_url,
      verification_status: data.verification_status || 'verified',
      last_verified: new Date().toISOString(),
      departments: data.departments || ['General Medicine'],
      created_at: new Date().toISOString(),
    };

    hospitals.push(newHospital);
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(hospitals));
    queueEvents.emit();
    return newHospital;
  }

  public async updateHospitalStatus(hospitalId: string, status: 'active' | 'pending' | 'inactive'): Promise<boolean> {
    const hospitals = await this.getHospitals();
    const hosp = hospitals.find((h) => h.id === hospitalId);
    if (!hosp) return false;

    hosp.status = status;
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(hospitals));
    queueEvents.emit();
    return true;
  }

  public async getPlatformStats() {
    const hospitals = await this.getHospitals();
    const doctors = await this.getDoctors();
    const queues = await this.getQueues();
    const tokens = await this.getTokens();

    const activeHospitals = hospitals.filter((h) => h.status === 'active').length;
    const partnerHospitals = hospitals.filter((h) => h.is_partner_queue).length;
    const activeQueues = queues.filter((q) => q.queue_status === 'active').length;
    const tokensToday = tokens.length;
    const completedToday = tokens.filter((t) => t.status === 'completed').length;

    return {
      totalHospitals: hospitals.length,
      activeHospitals,
      partnerHospitals,
      totalDoctors: doctors.length,
      activeQueues,
      tokensToday,
      completedToday,
      averageWaitTimeMins: 20,
    };
  }
}

export const dataService = new DataService();
