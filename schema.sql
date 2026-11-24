-- =====================================================================
-- QUEUECHECK: REAL-WORLD DATA INTEGRATED HOSPITAL QUEUE MANAGEMENT PLATFORM
-- PostgreSQL Database Schema for Supabase
-- Target Market: Chennai, Tamil Nadu, India (Architected for Pan-India Expansion)
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. HOSPITALS TABLE
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_ta VARCHAR(255),
    address TEXT NOT NULL,
    address_ta TEXT,
    area VARCHAR(100) NOT NULL,
    area_ta VARCHAR(100),
    city VARCHAR(100) DEFAULT 'Chennai' NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    phone VARCHAR(50) NOT NULL,
    emergency_phone VARCHAR(50),
    website VARCHAR(255),
    opening_time VARCHAR(20) DEFAULT '08:00 AM',
    closing_time VARCHAR(20) DEFAULT '08:00 PM',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
    is_partner_queue BOOLEAN DEFAULT FALSE NOT NULL, -- True only if reception staff manages queue via QueueCheck
    data_source VARCHAR(255) DEFAULT 'OpenStreetMap & Public Health Registry' NOT NULL,
    data_source_url TEXT,
    verification_status VARCHAR(30) DEFAULT 'verified' CHECK (verification_status IN ('verified', 'unverified', 'partner', 'community_submitted')),
    last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    departments TEXT[] DEFAULT '{}',
    osm_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. HOSPITAL SOURCES TABLE (Transparency & Audit)
CREATE TABLE IF NOT EXISTS public.hospital_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    source_name VARCHAR(255) NOT NULL,
    source_url TEXT,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    verification_status VARCHAR(30) DEFAULT 'verified' CHECK (verification_status IN ('verified', 'unverified', 'partner', 'community_submitted')),
    license VARCHAR(255) DEFAULT 'ODbL - OpenStreetMap contributors',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    name_ta VARCHAR(150),
    opd_timings VARCHAR(100) DEFAULT '09:00 AM - 01:00 PM',
    floor_room VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    name_ta VARCHAR(255),
    specialty VARCHAR(100) NOT NULL,
    specialty_ta VARCHAR(100),
    room_number VARCHAR(50) DEFAULT 'Room 1',
    consultation_duration INTEGER DEFAULT 8 NOT NULL, -- baseline duration in minutes
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'on_break', 'off_duty')),
    opd_timings VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. PROFILES TABLE (Supabase Auth Linking & Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'patient' CHECK (role IN ('patient', 'receptionist', 'admin')),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    phone VARCHAR(30),
    preferred_language VARCHAR(5) DEFAULT 'en' CHECK (preferred_language IN ('en', 'ta')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. HOSPITAL STAFF TABLE (RBAC for Clinic Personnel)
CREATE TABLE IF NOT EXISTS public.hospital_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    role VARCHAR(30) DEFAULT 'receptionist' CHECK (role IN ('receptionist', 'admin', 'nurse', 'doctor')),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_profile_hospital_staff UNIQUE (profile_id, hospital_id)
);

-- 8. PATIENTS TABLE (Walk-in or Registered)
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    display_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 9. QUEUES TABLE
CREATE TABLE IF NOT EXISTS public.queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    queue_date DATE DEFAULT CURRENT_DATE NOT NULL,
    queue_status VARCHAR(20) DEFAULT 'active' CHECK (queue_status IN ('active', 'paused', 'closed')),
    current_token_id UUID,
    pause_reason TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_doctor_date_queue UNIQUE (doctor_id, queue_date)
);

-- 10. TOKENS TABLE
CREATE TABLE IF NOT EXISTS public.tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_id UUID NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(30),
    token_number VARCHAR(20) NOT NULL,
    category VARCHAR(20) DEFAULT 'general' CHECK (category IN ('general', 'followup', 'emergency', 'senior')),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'consulting', 'completed', 'skipped', 'no_show', 'cancelled')),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    called_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    hospital_name VARCHAR(255),
    doctor_name VARCHAR(255),
    department_name VARCHAR(150),
    CONSTRAINT unique_token_per_queue UNIQUE (queue_id, token_number)
);

-- Circular foreign key for queues.current_token_id
ALTER TABLE public.queues
    ADD CONSTRAINT fk_queue_current_token
    FOREIGN KEY (current_token_id) REFERENCES public.tokens(id) ON DELETE SET NULL;

-- 11. QUEUE_EVENTS TABLE (Audit log & real-time notification source)
CREATE TABLE IF NOT EXISTS public.queue_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_id UUID NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
    token_id UUID REFERENCES public.tokens(id) ON DELETE SET NULL,
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('registered', 'called', 'started', 'completed', 'skipped', 'no_show', 'paused', 'resumed', 'cancelled')),
    notes TEXT,
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 12. PREDICTIONS TABLE (Waiting-time estimations log)
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_id UUID NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
    token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
    estimated_minutes INTEGER NOT NULL,
    lower_estimate INTEGER NOT NULL,
    upper_estimate INTEGER NOT NULL,
    confidence_level VARCHAR(20) DEFAULT 'medium' CHECK (confidence_level IN ('high', 'medium', 'low')),
    factors JSONB,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERYING & GEOLOCATION
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_hospitals_area ON public.hospitals(area);
CREATE INDEX IF NOT EXISTS idx_hospitals_status ON public.hospitals(status);
CREATE INDEX IF NOT EXISTS idx_hospitals_partner ON public.hospitals(is_partner_queue);
CREATE INDEX IF NOT EXISTS idx_doctors_hospital ON public.doctors(hospital_id);
CREATE INDEX IF NOT EXISTS idx_departments_hospital ON public.departments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_queues_hospital_doctor ON public.queues(hospital_id, doctor_id);
CREATE INDEX IF NOT EXISTS idx_queues_date ON public.queues(queue_date);
CREATE INDEX IF NOT EXISTS idx_tokens_queue_status ON public.tokens(queue_id, status);
CREATE INDEX IF NOT EXISTS idx_tokens_registered ON public.tokens(registered_at);
CREATE INDEX IF NOT EXISTS idx_queue_events_queue ON public.queue_events(queue_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_token ON public.predictions(token_id);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Public read access for public directories and live tracking
CREATE POLICY "Public can view hospitals" ON public.hospitals FOR SELECT USING (status = 'active');
CREATE POLICY "Public can view hospital sources" ON public.hospital_sources FOR SELECT USING (true);
CREATE POLICY "Public can view departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Public can view doctors" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Public can view queues" ON public.queues FOR SELECT USING (true);
CREATE POLICY "Public can view tokens" ON public.tokens FOR SELECT USING (true);
CREATE POLICY "Public can view predictions" ON public.predictions FOR SELECT USING (true);

-- Hospital Staff and Admins permissions
CREATE POLICY "Staff can manage queues for their hospital"
    ON public.queues FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR (profiles.role = 'receptionist' AND profiles.hospital_id = queues.hospital_id))
        )
    );

CREATE POLICY "Staff can manage tokens"
    ON public.tokens FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('receptionist', 'admin')
        )
    );

CREATE POLICY "Patients can view and cancel their own tokens"
    ON public.tokens FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = tokens.patient_id
            AND patients.profile_id = auth.uid()
        )
    );

CREATE POLICY "Admins have full access on all tables"
    ON public.hospitals FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Enable Realtime publication for queues and tokens
ALTER PUBLICATION supabase_realtime ADD TABLE public.queues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_events;
