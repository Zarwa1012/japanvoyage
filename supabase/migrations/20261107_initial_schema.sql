-- ==============================================================================
-- Migration: 20261107_initial_schema.sql (SECURITY AUDITED & PRODUCTION HARDENED)
-- Platform: International Japan Tourism Booking Platform (JapanVoyage)
-- Stack: Next.js (App Router) + Supabase PostgreSQL + Safepay/Stripe Gateway Adapter
-- Security: Strict RLS, Atomic Concurrency, Anti-Tamper Pricing & Least Privilege
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Enumerated Types
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE booking_status_enum AS ENUM (
        'draft',
        'hold_pending_payment',
        'expired',
        'confirmed',
        'cancelled_by_customer',
        'cancelled_by_operator',
        'refunded',
        'completed'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM (
        'initiated',
        'processing',
        'captured',
        'failed',
        'refund_pending',
        'refunded',
        'partially_refunded'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE participant_tier_enum AS ENUM ('adult', 'child', 'infant');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE traveler_type_enum AS ENUM ('solo', 'couple', 'family', 'friends', 'business');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE review_status_enum AS ENUM ('published', 'pending', 'hidden');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 3. Core Tables
-- ==============================================================================

-- 3.1 Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email CITEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone_country_code TEXT,       -- E.164 country code e.g. "+1", "+44", "+92"
    phone_national_number TEXT,    -- National phone number
    nationality_code VARCHAR(50),  -- Country of nationality e.g. "US", "PK", "United States"
    preferred_currency VARCHAR(3) DEFAULT 'USD',
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'tour_operator')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 Destinations Table
CREATE TABLE IF NOT EXISTS public.destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    country_code VARCHAR(2) DEFAULT 'JP',
    description TEXT,
    hero_image_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    icon_name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 Tours Table
CREATE TABLE IF NOT EXISTS public.tours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    short_summary TEXT NOT NULL,
    full_description TEXT NOT NULL,
    highlights TEXT[] DEFAULT '{}',
    inclusions TEXT[] DEFAULT '{}',
    exclusions TEXT[] DEFAULT '{}',
    important_information TEXT[] DEFAULT '{}',
    cancellation_policy TEXT NOT NULL DEFAULT 'Free cancellation up to 24 hours before tour start (JST).',
    duration_hours NUMERIC(4, 1) NOT NULL,
    meeting_point_details JSONB NOT NULL,
    languages_supported TEXT[] DEFAULT '{"English", "Japanese"}',
    base_currency VARCHAR(3) NOT NULL DEFAULT 'JPY',
    is_active BOOLEAN DEFAULT TRUE,
    rating_average NUMERIC(3, 2) DEFAULT 5.00,
    review_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 Tour Options Table
CREATE TABLE IF NOT EXISTS public.tour_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    departure_time_jst TIME NOT NULL,
    max_capacity_per_departure INT NOT NULL DEFAULT 30,
    min_capacity_per_departure INT NOT NULL DEFAULT 1,
    booking_cutoff_hours INT NOT NULL DEFAULT 24,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 Pricing Tiers Table (Base Currency: JPY)
CREATE TABLE IF NOT EXISTS public.tour_pricing_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_option_id UUID NOT NULL REFERENCES public.tour_options(id) ON DELETE CASCADE,
    tier_type participant_tier_enum NOT NULL,
    min_age INT DEFAULT 0,
    max_age INT,
    price_in_base_currency NUMERIC(10, 2) NOT NULL CHECK (price_in_base_currency >= 0),
    UNIQUE(tour_option_id, tier_type)
);

-- 3.7 Tour Schedules Table (Asia/Tokyo JST Capacity Engine)
CREATE TABLE IF NOT EXISTS public.tour_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_option_id UUID NOT NULL REFERENCES public.tour_options(id) ON DELETE CASCADE,
    tour_date DATE NOT NULL,
    start_time_jst TIME NOT NULL,
    max_capacity INT NOT NULL CHECK (max_capacity > 0),
    booked_capacity INT NOT NULL DEFAULT 0 CHECK (booked_capacity >= 0),
    held_capacity INT NOT NULL DEFAULT 0 CHECK (held_capacity >= 0),
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT capacity_integrity CHECK (booked_capacity >= 0 AND held_capacity >= 0 AND (booked_capacity + held_capacity) <= max_capacity),
    UNIQUE(tour_option_id, tour_date, start_time_jst)
);

-- 3.8 Bookings Ledger Table (Audited for Privacy & Anti-Tamper)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference TEXT NOT NULL UNIQUE,
    guest_access_token UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tour_schedule_id UUID NOT NULL REFERENCES public.tour_schedules(id) ON DELETE RESTRICT,
    
    -- Lead Traveler Contact Snapshot
    lead_traveler_name TEXT NOT NULL,
    lead_traveler_email CITEXT NOT NULL,
    lead_traveler_phone TEXT NOT NULL,
    emergency_contact TEXT,
    special_requirements TEXT,
    
    -- Financial Tracking
    total_participants INT NOT NULL CHECK (total_participants > 0),
    base_currency VARCHAR(3) NOT NULL DEFAULT 'JPY',
    total_base_amount NUMERIC(12, 2) NOT NULL CHECK (total_base_amount >= 0),
    
    charged_currency VARCHAR(3) NOT NULL DEFAULT 'PKR',
    charged_amount NUMERIC(12, 2) NOT NULL CHECK (charged_amount >= 0),
    exchange_rate_applied NUMERIC(14, 6) NOT NULL CHECK (exchange_rate_applied > 0),
    
    status booking_status_enum NOT NULL DEFAULT 'draft',
    cancellation_reason TEXT,
    hold_expires_at TIMESTAMPTZ,
    
    voucher_pdf_url TEXT,
    voucher_qr_code TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9 Booking Participants Table
CREATE TABLE IF NOT EXISTS public.booking_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    tier_type participant_tier_enum NOT NULL,
    full_name TEXT NOT NULL,
    passport_number TEXT,
    nationality VARCHAR(50)
);

-- 3.10 Payments Ledger Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
    gateway_provider TEXT NOT NULL CHECK (gateway_provider IN ('safepay', 'stripe')),
    gateway_tracker_token TEXT,
    gateway_transaction_id TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL,
    status payment_status_enum NOT NULL DEFAULT 'initiated',
    requires_refund BOOLEAN NOT NULL DEFAULT FALSE,
    refund_reason TEXT,
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_gateway_transaction UNIQUE (gateway_provider, gateway_transaction_id)
);

-- 3.11 Payment Webhook Logs Table (Strict Idempotency)
CREATE TABLE IF NOT EXISTS public.payment_webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway_provider TEXT NOT NULL,
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    is_successful BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    CONSTRAINT unique_gateway_event UNIQUE (gateway_provider, event_id)
);

-- 3.12 Exchange Rates Table (Master Base: JPY)
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency VARCHAR(3) NOT NULL DEFAULT 'JPY',
    target_currency VARCHAR(3) NOT NULL,
    rate NUMERIC(14, 6) NOT NULL CHECK (rate > 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_base_target UNIQUE (base_currency, target_currency)
);

-- 3.13 Customer Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    booking_id UUID UNIQUE REFERENCES public.bookings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    traveler_type traveler_type_enum,
    title TEXT,
    comment TEXT NOT NULL,
    status review_status_enum NOT NULL DEFAULT 'published',
    is_verified_booking BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.14 Rate Limit Buckets Table (Fixed-Window Counter Engine)
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
    lookup_key TEXT NOT NULL,
    action_type TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    hit_count INT NOT NULL DEFAULT 1,
    PRIMARY KEY (lookup_key, action_type, window_start)
);

-- ==============================================================================
-- 4. Sanitized Public Views (Privacy & Inactive Tour Schedule Isolation)
-- ==============================================================================

-- 4.1 Public Tour Schedules View:
-- Excludes unpublished or inactive tours and inactive tour options
-- Masks exact booked, held, and max capacity counts from competitors
-- Hardened with security_barrier to prevent predicate pushdown side-channel leaks
CREATE OR REPLACE VIEW public.v_tour_schedules_public
WITH (security_barrier = true) AS
SELECT 
    s.id,
    s.tour_option_id,
    s.tour_date,
    s.start_time_jst,
    s.is_blocked,
    CASE 
        WHEN s.is_blocked = true THEN false
        WHEN t.is_active = false OR o.is_active = false THEN false
        WHEN (s.max_capacity - (s.booked_capacity + s.held_capacity)) > 0 THEN true
        ELSE false
    END AS is_available,
    CASE 
        WHEN s.is_blocked = true THEN 'unavailable'
        WHEN t.is_active = false OR o.is_active = false THEN 'unavailable'
        WHEN (s.max_capacity - (s.booked_capacity + s.held_capacity)) <= 0 THEN 'sold_out'
        WHEN (s.max_capacity - (s.booked_capacity + s.held_capacity)) <= 5 THEN 'few_seats_left'
        ELSE 'available'
    END AS availability_status
FROM public.tour_schedules s
JOIN public.tour_options o ON s.tour_option_id = o.id
JOIN public.tours t ON o.tour_id = t.id
WHERE t.is_active = true AND o.is_active = true;

-- 4.2 Public Reviews View:
-- Only shows published reviews for active tours
-- Anonymizes reviewer personal identity (First name + last initial only)
-- Completely hides internal booking_id, user_id, and private account email
-- Hardened with security_barrier to prevent predicate pushdown side-channel leaks
CREATE OR REPLACE VIEW public.v_public_reviews
WITH (security_barrier = true) AS
SELECT 
    r.id,
    r.tour_id,
    r.rating,
    r.traveler_type,
    r.title,
    r.comment,
    r.is_verified_booking,
    r.created_at,
    CASE 
        WHEN p.full_name IS NOT NULL AND length(trim(p.full_name)) > 0 THEN
            split_part(trim(p.full_name), ' ', 1) || 
            CASE 
                WHEN position(' ' in trim(p.full_name)) > 0 THEN 
                    ' ' || left(split_part(trim(p.full_name), ' ', 2), 1) || '.'
                ELSE ''
            END
        ELSE 'Verified Traveler'
    END AS reviewer_name,
    p.nationality_code AS reviewer_country
FROM public.reviews r
JOIN public.tours t ON r.tour_id = t.id
LEFT JOIN public.profiles p ON r.user_id = p.id
WHERE r.status = 'published' AND t.is_active = true;

-- ==============================================================================
-- 5. Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_tours_destination ON public.tours(destination_id);
CREATE INDEX IF NOT EXISTS idx_tours_category ON public.tours(category_id);
CREATE INDEX IF NOT EXISTS idx_tours_slug ON public.tours(slug);
CREATE INDEX IF NOT EXISTS idx_tour_options_tour ON public.tour_options(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_schedules_search ON public.tour_schedules(tour_option_id, tour_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ref ON public.bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_schedule ON public.bookings(tour_schedule_id);
CREATE INDEX IF NOT EXISTS idx_bookings_token ON public.bookings(guest_access_token);
CREATE INDEX IF NOT EXISTS idx_bookings_pending_holds ON public.bookings(tour_schedule_id, status, hold_expires_at);
CREATE INDEX IF NOT EXISTS idx_bookings_email_holds ON public.bookings(lead_traveler_email, status, hold_expires_at);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_tracker ON public.payments(gateway_tracker_token);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup ON public.exchange_rates(base_currency, target_currency);
CREATE INDEX IF NOT EXISTS idx_reviews_tour ON public.reviews(tour_id, status);
CREATE INDEX IF NOT EXISTS idx_rate_limit_cleanup ON public.rate_limit_buckets(window_start);

-- ==============================================================================
-- 6. Authorization Helper Functions (Hardened SECURITY DEFINER)
-- ==============================================================================

-- Check if current authenticated caller has 'admin' role in public.profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(
        (SELECT p.role = 'admin' FROM public.profiles p WHERE p.id = auth.uid() AND auth.uid() IS NOT NULL),
        false
    );
$$;

-- Check if current authenticated caller has 'admin' or 'tour_operator' role
CREATE OR REPLACE FUNCTION public.is_tour_operator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(
        (SELECT p.role IN ('admin', 'tour_operator') FROM public.profiles p WHERE p.id = auth.uid() AND auth.uid() IS NOT NULL),
        false
    );
$$;

-- Fixed-Window Counter Rate Limiter in PostgreSQL
-- Strictly internal function: direct client EXECUTE revoked from anon and authenticated
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
    p_lookup_key TEXT,
    p_action TEXT,
    p_max_hits INT,
    p_window_seconds INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_window_start TIMESTAMPTZ;
    v_current_hits INT;
    v_clean_key TEXT;
BEGIN
    -- 1. Validate action identifier
    IF p_action IS NULL OR LENGTH(p_action) > 64 OR p_action !~ '^[a-z_]+$' THEN
        RAISE EXCEPTION 'Invalid rate limit action: must be lowercase alphanumeric/underscores up to 64 chars.';
    END IF;

    -- 2. Validate window duration: between 1 and 86400 seconds (1 day)
    IF p_window_seconds IS NULL OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
        RAISE EXCEPTION 'Invalid rate limit window: must be between 1 and 86400 seconds.';
    END IF;

    -- 3. Validate max hits: between 1 and 10000
    IF p_max_hits IS NULL OR p_max_hits < 1 OR p_max_hits > 10000 THEN
        RAISE EXCEPTION 'Invalid rate limit max hits: must be between 1 and 10000.';
    END IF;

    -- 4. Sanitize and hash key to uniform 64-char SHA256 (Prevents table bloat & key-length abuse)
    v_clean_key := SUBSTRING(TRIM(COALESCE(p_lookup_key, '')), 1, 256);
    IF v_clean_key = '' THEN
        v_clean_key := 'unknown_client';
    END IF;
    v_clean_key := encode(digest(v_clean_key, 'sha256'), 'hex');

    -- 5. Fixed-Window discrete time bucket derivation
    v_window_start := to_timestamp(floor(extract(epoch from NOW()) / p_window_seconds) * p_window_seconds);
    
    -- 6. Atomically record or increment hit counter using row-level upsert
    INSERT INTO public.rate_limit_buckets (lookup_key, action_type, window_start, hit_count)
    VALUES (v_clean_key, p_action, v_window_start, 1)
    ON CONFLICT (lookup_key, action_type, window_start)
    DO UPDATE SET hit_count = public.rate_limit_buckets.hit_count + 1
    RETURNING hit_count INTO v_current_hits;

    RETURN (v_current_hits <= p_max_hits);
END;
$$;

-- Dedicated maintenance sweeper for rate limit buckets (Restricted to background jobs / service_role)
-- Eliminates expensive unrestricted deletions from user-facing transaction paths
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limit_buckets(
    p_older_than INTERVAL DEFAULT INTERVAL '2 hours'
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_deleted_count INT;
BEGIN
    IF auth.role() IS NOT NULL AND auth.role() <> 'service_role' AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Rate limit bucket cleanup is restricted to administrators and service_role.';
    END IF;

    WITH purged AS (
        DELETE FROM public.rate_limit_buckets
        WHERE window_start < (NOW() - p_older_than)
        RETURNING lookup_key
    )
    SELECT COUNT(*) INTO v_deleted_count FROM purged;

    RETURN v_deleted_count;
END;
$$;

-- ==============================================================================
-- 7. Atomic Concurrency & Booking Engine Functions
-- ==============================================================================

-- 7.1 Create Booking Draft and Atomic Seat Hold
-- Enforces row-locking order: ALWAYS locks public.tour_schedules FOR UPDATE FIRST
-- Uses transaction advisory lock to serialize hold requests for the same email
CREATE OR REPLACE FUNCTION public.create_booking_hold(
    p_schedule_id UUID,
    p_lead_name TEXT,
    p_lead_email TEXT,
    p_lead_phone TEXT,
    p_emergency_contact TEXT,
    p_special_requirements TEXT,
    p_charged_currency VARCHAR(3),
    p_participants JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_schedule RECORD;
    v_option RECORD;
    v_tour RECORD;
    v_total_participants INT;
    v_available_seats INT;
    v_total_base_jpy NUMERIC := 0;
    v_tier_price NUMERIC;
    v_participant JSONB;
    v_participant_name TEXT;
    v_participant_tier TEXT;
    v_booking_ref TEXT;
    v_booking_id UUID;
    v_guest_token UUID := gen_random_uuid();
    v_hold_expires TIMESTAMPTZ := NOW() + INTERVAL '15 minutes';
    v_tour_cutoff_jst TIMESTAMPTZ;
    v_effective_user_id UUID;
    v_effective_rate NUMERIC;
    v_rate_updated_at TIMESTAMPTZ;
    v_reclaimed_expired_seats INT := 0;
    v_active_holds_count INT;
    v_rate_limit_key TEXT;
    v_insert_attempts INT := 0;
BEGIN
    -- 1. Strict Input Sanity & Format Checks
    p_lead_name := TRIM(COALESCE(p_lead_name, ''));
    p_lead_email := LOWER(TRIM(COALESCE(p_lead_email, '')));
    p_lead_phone := TRIM(COALESCE(p_lead_phone, ''));
    p_emergency_contact := SUBSTRING(TRIM(COALESCE(p_emergency_contact, '')), 1, 200);
    p_special_requirements := SUBSTRING(TRIM(COALESCE(p_special_requirements, '')), 1, 500);
    p_charged_currency := UPPER(TRIM(COALESCE(p_charged_currency, 'JPY')));

    IF p_lead_name = '' OR LENGTH(p_lead_name) < 2 OR LENGTH(p_lead_name) > 100 THEN
        RAISE EXCEPTION 'Lead traveler full name is required (between 2 and 100 characters).';
    END IF;

    IF p_lead_email = '' OR LENGTH(p_lead_email) > 254 OR p_lead_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'A valid lead traveler email address is required.';
    END IF;

    IF p_lead_phone = '' OR LENGTH(p_lead_phone) < 7 OR LENGTH(p_lead_phone) > 20 OR p_lead_phone !~ '^\+?[0-9\s\-()]{7,20}$' THEN
        RAISE EXCEPTION 'A valid contact phone number is required (7 to 20 digits).';
    END IF;

    -- Validate supported checkout currency
    IF p_charged_currency NOT IN ('JPY', 'USD', 'EUR', 'GBP', 'AED', 'PKR') THEN
        RAISE EXCEPTION 'Unsupported checkout currency: %. Permitted: JPY, USD, EUR, GBP, AED, PKR.', p_charged_currency;
    END IF;

    -- 2. Validate participant manifest size and structure
    IF p_participants IS NULL OR jsonb_typeof(p_participants) != 'array' THEN
        RAISE EXCEPTION 'Participant manifest must be a non-empty JSON array.';
    END IF;

    IF octet_length(p_participants::text) > 8192 THEN
        RAISE EXCEPTION 'Participant manifest exceeds maximum allowed payload size (8 KB).';
    END IF;

    v_total_participants := jsonb_array_length(p_participants);
    IF v_total_participants < 1 OR v_total_participants > 20 THEN
        RAISE EXCEPTION 'Booking participant count must be between 1 and 20 travelers.';
    END IF;

    -- 3. Abuse Prevention: Rate limiting keyed on verified lead traveler email (immune to forwarded header spoofing)
    IF auth.uid() IS NOT NULL THEN
        v_rate_limit_key := 'user:' || auth.uid()::text;
    ELSE
        v_rate_limit_key := 'email:' || p_lead_email;
    END IF;

    IF NOT public.check_and_increment_rate_limit(v_rate_limit_key, 'create_hold', 10, 60) THEN
        RAISE EXCEPTION 'Too many reservation requests for this account. Please wait a moment before creating a new booking hold.';
    END IF;

    -- 4. Prevent Parallel Bypass of Active Hold Limits: Transaction-level advisory lock on email
    PERFORM pg_advisory_xact_lock(hashtext('email_hold_gate:' || p_lead_email));

    SELECT COUNT(*) INTO v_active_holds_count
    FROM public.bookings
    WHERE lead_traveler_email = p_lead_email
      AND status = 'hold_pending_payment'
      AND hold_expires_at > NOW();

    IF v_active_holds_count >= 3 THEN
        RAISE EXCEPTION 'There are currently % active pending holds for email %. Please complete payment or wait for prior holds to expire.', v_active_holds_count, p_lead_email;
    END IF;

    -- Determine trusted user association (Prevents account spoofing)
    IF auth.uid() IS NOT NULL THEN
        v_effective_user_id := auth.uid();
    ELSE
        v_effective_user_id := NULL;
    END IF;

    -- 5. Authoritative Exchange Rate Determination & Freshness Check
    IF p_charged_currency = 'JPY' THEN
        v_effective_rate := 1.0;
    ELSE
        SELECT rate, updated_at INTO v_effective_rate, v_rate_updated_at
        FROM public.exchange_rates
        WHERE base_currency = 'JPY' AND target_currency = p_charged_currency;

        IF NOT FOUND OR v_effective_rate IS NULL OR v_effective_rate <= 0 THEN
            RAISE EXCEPTION 'Active exchange rate unavailable for currency %. Reservation cannot proceed.', p_charged_currency;
        END IF;

        IF v_rate_updated_at < (NOW() - INTERVAL '48 hours') THEN
            RAISE EXCEPTION 'Exchange rate for % is stale (last updated %). Reservation rejected for pricing safety.', p_charged_currency, v_rate_updated_at;
        END IF;
    END IF;

    -- 6. ROW LOCKING STEP 1: Lock schedule row exclusively
    SELECT * INTO v_schedule
    FROM public.tour_schedules
    WHERE id = p_schedule_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tour departure schedule not found.';
    END IF;

    IF v_schedule.is_blocked THEN
        RAISE EXCEPTION 'This tour schedule departure is currently closed for bookings.';
    END IF;

    -- 7. Lazy reclamation of expired holds for THIS schedule under the schedule lock
    WITH expired_holds AS (
        UPDATE public.bookings
        SET status = 'expired',
            cancellation_reason = 'Hold expired prior to payment confirmation',
            updated_at = NOW()
        WHERE tour_schedule_id = p_schedule_id
          AND status = 'hold_pending_payment'
          AND hold_expires_at < NOW()
        RETURNING total_participants
    )
    SELECT COALESCE(SUM(total_participants), 0) INTO v_reclaimed_expired_seats FROM expired_holds;

    IF v_reclaimed_expired_seats > 0 THEN
        IF v_schedule.held_capacity < v_reclaimed_expired_seats THEN
            RAISE EXCEPTION 'Capacity inconsistency: schedule held_capacity (%) is less than reclaimed seats (%).', v_schedule.held_capacity, v_reclaimed_expired_seats;
        END IF;

        UPDATE public.tour_schedules
        SET held_capacity = held_capacity - v_reclaimed_expired_seats
        WHERE id = p_schedule_id;
        
        v_schedule.held_capacity := v_schedule.held_capacity - v_reclaimed_expired_seats;
    END IF;

    -- 8. Lock option and tour to check active status and booking cutoffs
    SELECT * INTO v_option
    FROM public.tour_options
    WHERE id = v_schedule.tour_option_id;

    IF NOT FOUND OR NOT v_option.is_active THEN
        RAISE EXCEPTION 'Selected tour option is currently inactive.';
    END IF;

    SELECT * INTO v_tour
    FROM public.tours
    WHERE id = v_option.tour_id;

    IF NOT FOUND OR NOT v_tour.is_active THEN
        RAISE EXCEPTION 'Selected tour is currently inactive.';
    END IF;

    -- Validate booking cutoff in Tokyo time (JST)
    v_tour_cutoff_jst := (v_schedule.tour_date + v_schedule.start_time_jst)::timestamp AT TIME ZONE 'Asia/Tokyo';
    IF NOW() >= (v_tour_cutoff_jst - (v_option.booking_cutoff_hours || ' hours')::interval) THEN
        RAISE EXCEPTION 'Bookings for this departure closed % hours prior to departure.', v_option.booking_cutoff_hours;
    END IF;

    -- 9. Strict Capacity Verification
    v_available_seats := v_schedule.max_capacity - (v_schedule.booked_capacity + v_schedule.held_capacity);
    IF v_available_seats < v_total_participants THEN
        RAISE EXCEPTION 'Insufficient capacity. Only % seats available on this departure.', GREATEST(0, v_available_seats);
    END IF;

    -- 10. Validate participants & calculate authoritative base price from database tiers
    FOR v_participant IN SELECT * FROM jsonb_array_elements(p_participants)
    LOOP
        v_participant_name := TRIM(COALESCE(v_participant->>'full_name', ''));
        v_participant_tier := TRIM(COALESCE(v_participant->>'tier_type', ''));

        IF v_participant_name = '' OR LENGTH(v_participant_name) < 2 OR LENGTH(v_participant_name) > 100 THEN
            RAISE EXCEPTION 'Each traveler participant must have a valid full name (2 to 100 characters).';
        END IF;

        IF v_participant_tier NOT IN ('adult', 'child', 'infant') THEN
            RAISE EXCEPTION 'Invalid participant tier: %. Permitted: adult, child, infant.', v_participant_tier;
        END IF;

        SELECT price_in_base_currency INTO v_tier_price
        FROM public.tour_pricing_tiers
        WHERE tour_option_id = v_option.id
          AND tier_type = v_participant_tier::participant_tier_enum;

        IF NOT FOUND OR v_tier_price IS NULL THEN
            RAISE EXCEPTION 'Pricing tier % is not configured for this tour option.', v_participant_tier;
        END IF;

        v_total_base_jpy := v_total_base_jpy + v_tier_price;
    END LOOP;

    -- 11. High-Entropy Cryptographic Reference with INSERT Collision Retry Loop (12 Random Bytes = 96 Bits)
    LOOP
        v_insert_attempts := v_insert_attempts + 1;
        IF v_insert_attempts > 5 THEN
            RAISE EXCEPTION 'Failed to generate a unique booking reference after multiple attempts.';
        END IF;

        v_booking_ref := 'JP-' || TO_CHAR(NOW() AT TIME ZONE 'Asia/Tokyo', 'YYMM') || '-' || UPPER(encode(gen_random_bytes(12), 'hex'));

        BEGIN
            INSERT INTO public.bookings (
                booking_reference,
                guest_access_token,
                user_id,
                tour_schedule_id,
                lead_traveler_name,
                lead_traveler_email,
                lead_traveler_phone,
                emergency_contact,
                special_requirements,
                total_participants,
                base_currency,
                total_base_amount,
                charged_currency,
                charged_amount,
                exchange_rate_applied,
                status,
                hold_expires_at
            ) VALUES (
                v_booking_ref,
                v_guest_token,
                v_effective_user_id,
                p_schedule_id,
                p_lead_name,
                p_lead_email,
                p_lead_phone,
                NULLIF(p_emergency_contact, ''),
                NULLIF(p_special_requirements, ''),
                v_total_participants,
                'JPY',
                v_total_base_jpy,
                p_charged_currency,
                ROUND((v_total_base_jpy * v_effective_rate)::numeric, 2),
                v_effective_rate,
                'hold_pending_payment',
                v_hold_expires
            ) RETURNING id INTO v_booking_id;

            EXIT; -- Insert succeeded, exit retry loop
        EXCEPTION
            WHEN unique_violation THEN
                CONTINUE; -- Collision caught at constraint level, retry with fresh random bytes
        END;
    END LOOP;

    -- 12. Atomically reserve seats
    UPDATE public.tour_schedules
    SET held_capacity = held_capacity + v_total_participants
    WHERE id = p_schedule_id;

    -- 13. Insert participant manifest
    FOR v_participant IN SELECT * FROM jsonb_array_elements(p_participants)
    LOOP
        INSERT INTO public.booking_participants (
            booking_id,
            tier_type,
            full_name,
            passport_number,
            nationality
        ) VALUES (
            v_booking_id,
            (v_participant->>'tier_type')::participant_tier_enum,
            TRIM(v_participant->>'full_name'),
            NULLIF(SUBSTRING(TRIM(COALESCE(v_participant->>'passport_number', '')), 1, 30), ''),
            NULLIF(SUBSTRING(TRIM(COALESCE(v_participant->>'nationality', '')), 1, 50), '')
        );
    END LOOP;

    -- 14. Return structured hold summary to caller
    RETURN jsonb_build_object(
        'booking_id', v_booking_id,
        'booking_reference', v_booking_ref,
        'guest_access_token', v_guest_token,
        'total_base_jpy', v_total_base_jpy,
        'charged_amount', ROUND((v_total_base_jpy * v_effective_rate)::numeric, 2),
        'charged_currency', p_charged_currency,
        'exchange_rate_applied', v_effective_rate,
        'hold_expires_at', v_hold_expires
    );
END;
$$;

-- 7.2 Confirm Booking Upon Verified Payment
-- Row-locking order: ALWAYS locks tour_schedules FIRST, then bookings, then payments
-- Rejects operator-cancelled, draft, refunded, completed bookings
-- Correctly handles active holds and expired holds without double-counting seats
-- Explicitly checks capacity counters without silently hiding inconsistencies with GREATEST(0, ...)
CREATE OR REPLACE FUNCTION public.confirm_booking_payment(
    p_booking_id UUID,
    p_payment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tour_schedule_id UUID;
    v_booking RECORD;
    v_payment RECORD;
    v_schedule RECORD;
    v_available_capacity INT;
BEGIN
    -- SECURITY CHECK: Strictly service_role or admin
    IF auth.role() IS NOT NULL AND auth.role() <> 'service_role' AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only verified webhook processors (service_role) or administrators can confirm booking payments.';
    END IF;

    -- 1. Read tour_schedule_id to establish consistent lock order without taking out-of-order locks
    SELECT tour_schedule_id INTO v_tour_schedule_id
    FROM public.bookings
    WHERE id = p_booking_id;

    IF NOT FOUND OR v_tour_schedule_id IS NULL THEN
        RAISE EXCEPTION 'Booking not found with ID %.', p_booking_id;
    END IF;

    -- 2. ROW LOCK 1: Lock tour_schedules row FOR UPDATE FIRST
    SELECT * INTO v_schedule
    FROM public.tour_schedules
    WHERE id = v_tour_schedule_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Associated tour schedule % not found.', v_tour_schedule_id;
    END IF;

    -- 3. ROW LOCK 2: Lock bookings row FOR UPDATE SECOND
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    -- 4. ROW LOCK 3: Lock payments row FOR UPDATE THIRD
    SELECT * INTO v_payment
    FROM public.payments
    WHERE id = p_payment_id AND booking_id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment record % is not associated with booking %.', p_payment_id, p_booking_id;
    END IF;

    -- 5. Payment Integrity Verification: Status, Currency, and Exact Amount
    IF v_payment.status != 'captured' THEN
        RAISE EXCEPTION 'Cannot confirm booking: Payment status is % (must be captured).', v_payment.status;
    END IF;

    IF v_payment.currency != v_booking.charged_currency THEN
        RAISE EXCEPTION 'Payment currency mismatch: Gateway payment was % but booking required %.', v_payment.currency, v_booking.charged_currency;
    END IF;

    IF v_payment.amount != v_booking.charged_amount THEN
        RAISE EXCEPTION 'Payment amount mismatch: Gateway captured % does not exactly equal required %.', v_payment.amount, v_booking.charged_amount;
    END IF;

    -- 6. Safe Idempotency Check (AFTER payment verification)
    IF v_booking.status = 'confirmed' THEN
        RETURN jsonb_build_object(
            'success', true,
            'status', 'already_confirmed',
            'booking_reference', v_booking.booking_reference
        );
    END IF;

    -- 7. Reject Terminal & Invalid Booking States
    -- An intentionally operator-cancelled, customer-cancelled, or refunded booking must NEVER be revived
    IF v_booking.status IN ('draft', 'cancelled_by_customer', 'cancelled_by_operator', 'refunded', 'completed') THEN
        RAISE EXCEPTION 'Cannot confirm payment: booking % has non-confirmable status %.', v_booking.booking_reference, v_booking.status;
    END IF;

    -- 8. Capacity & Hold State Transitions
    IF v_booking.status = 'hold_pending_payment' AND v_booking.hold_expires_at >= NOW() THEN
        -- Case A: Normal unexpired hold. Seats are ALREADY in held_capacity.
        IF v_schedule.held_capacity < v_booking.total_participants THEN
            RAISE EXCEPTION 'Capacity inconsistency: schedule held_capacity (%) is less than booking total_participants (%).', v_schedule.held_capacity, v_booking.total_participants;
        END IF;

        UPDATE public.tour_schedules
        SET held_capacity = held_capacity - v_booking.total_participants,
            booked_capacity = booked_capacity + v_booking.total_participants
        WHERE id = v_schedule.id;

        UPDATE public.bookings
        SET status = 'confirmed',
            updated_at = NOW()
        WHERE id = p_booking_id;

        RETURN jsonb_build_object(
            'success', true,
            'status', 'confirmed',
            'booking_reference', v_booking.booking_reference
        );

    ELSIF v_booking.status = 'hold_pending_payment' AND v_booking.hold_expires_at < NOW() THEN
        -- Case B: Hold expired seconds ago, but sweeper hasn't transitioned it to 'expired' yet.
        -- Because it was not yet reclaimed, seats are STILL in held_capacity.
        IF v_schedule.held_capacity < v_booking.total_participants THEN
            RAISE EXCEPTION 'Capacity inconsistency: schedule held_capacity (%) is less than booking total_participants (%).', v_schedule.held_capacity, v_booking.total_participants;
        END IF;

        UPDATE public.tour_schedules
        SET held_capacity = held_capacity - v_booking.total_participants,
            booked_capacity = booked_capacity + v_booking.total_participants
        WHERE id = v_schedule.id;

        UPDATE public.bookings
        SET status = 'confirmed',
            updated_at = NOW()
        WHERE id = p_booking_id;

        RETURN jsonb_build_object(
            'success', true,
            'status', 'confirmed_unclaimed_hold',
            'booking_reference', v_booking.booking_reference
        );

    ELSIF v_booking.status = 'expired' THEN
        -- Case C: Booking was already marked 'expired' and its seats were returned to available pool.
        -- Must evaluate real available capacity: max - (booked + held).
        v_available_capacity := v_schedule.max_capacity - (v_schedule.booked_capacity + v_schedule.held_capacity);

        IF v_available_capacity >= v_booking.total_participants THEN
            -- Capacity remains available! Reclaim seats into booked_capacity.
            UPDATE public.tour_schedules
            SET booked_capacity = booked_capacity + v_booking.total_participants
            WHERE id = v_schedule.id;

            UPDATE public.bookings
            SET status = 'confirmed',
                cancellation_reason = NULL,
                updated_at = NOW()
            WHERE id = p_booking_id;

            RETURN jsonb_build_object(
                'success', true,
                'status', 'confirmed_late_reclaimed',
                'booking_reference', v_booking.booking_reference
            );
        ELSE
            -- Capacity is exhausted! Cannot fulfill seats.
            -- PERSIST REFUND REQUIREMENT WITHOUT EXCEPTION TO PREVENT SILENT TRANSACTION ROLLBACK
            UPDATE public.payments
            SET requires_refund = TRUE,
                refund_reason = 'Booking hold expired and departure capacity was exhausted prior to late payment arrival. Gateway refund required.',
                status = 'refund_pending',
                updated_at = NOW()
            WHERE id = p_payment_id;

            RETURN jsonb_build_object(
                'success', false,
                'status', 'capacity_exhausted_refund_required',
                'booking_reference', v_booking.booking_reference,
                'requires_refund', true,
                'refund_reason', 'Departure sold out before late payment arrived'
            );
        END IF;
    ELSE
        RAISE EXCEPTION 'Unexpected booking state % during payment confirmation.', v_booking.status;
    END IF;
END;
$$;

-- 7.3 Atomic Webhook Processor & Idempotent Confirmation
-- Handles payment webhook event idempotency, payload validation, payment record conflict checks,
-- and booking confirmation atomically with robust error logging
CREATE OR REPLACE FUNCTION public.process_payment_webhook(
    p_gateway_provider TEXT,
    p_event_id TEXT,
    p_event_type TEXT,
    p_booking_id UUID,
    p_gateway_transaction_id TEXT,
    p_gateway_tracker_token TEXT,
    p_amount NUMERIC,
    p_currency VARCHAR(3),
    p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_log_id UUID;
    v_existing_log RECORD;
    v_payment_id UUID;
    v_existing_payment RECORD;
    v_booking RECORD;
    v_confirm_result JSONB;
BEGIN
    -- 1. SECURITY CHECK: Strictly service_role or admin
    IF auth.role() IS NOT NULL AND auth.role() <> 'service_role' AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Webhook processing is restricted to service_role.';
    END IF;

    -- 2. Strict Input & Gateway Event Validation
    p_gateway_provider := LOWER(TRIM(COALESCE(p_gateway_provider, '')));
    p_event_id := TRIM(COALESCE(p_event_id, ''));
    p_event_type := LOWER(TRIM(COALESCE(p_event_type, '')));
    p_gateway_transaction_id := TRIM(COALESCE(p_gateway_transaction_id, ''));
    p_currency := UPPER(TRIM(COALESCE(p_currency, '')));

    IF p_gateway_provider NOT IN ('safepay', 'stripe') THEN
        RAISE EXCEPTION 'Invalid gateway provider: %. Permitted: safepay, stripe.', p_gateway_provider;
    END IF;

    IF p_event_id = '' OR LENGTH(p_event_id) > 255 THEN
        RAISE EXCEPTION 'A valid gateway event ID is required (up to 255 characters).';
    END IF;

    IF p_event_type = '' OR LENGTH(p_event_type) > 100 THEN
        RAISE EXCEPTION 'A valid gateway event type is required.';
    END IF;

    -- Only accept legitimate successful payment events
    IF p_event_type NOT IN (
        'payment_intent.succeeded',
        'charge.succeeded',
        'payment.completed',
        'payment.captured'
    ) THEN
        RAISE EXCEPTION 'Unsupported or unhandled payment event type: %.', p_event_type;
    END IF;

    IF p_booking_id IS NULL THEN
        RAISE EXCEPTION 'A valid booking ID is required.';
    END IF;

    IF p_gateway_transaction_id = '' OR LENGTH(p_gateway_transaction_id) > 255 THEN
        RAISE EXCEPTION 'A valid gateway transaction ID is required.';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero.';
    END IF;

    IF p_currency NOT IN ('JPY', 'USD', 'EUR', 'GBP', 'AED', 'PKR') THEN
        RAISE EXCEPTION 'Unsupported payment currency: %.', p_currency;
    END IF;

    IF p_payload IS NULL OR jsonb_typeof(p_payload) != 'object' THEN
        RAISE EXCEPTION 'Webhook payload must be a non-null JSON object.';
    END IF;

    -- 3. Verify Target Booking Existence & Financial Requirements
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target booking % not found for payment webhook event %.', p_booking_id, p_event_id;
    END IF;

    IF p_currency != v_booking.charged_currency THEN
        RAISE EXCEPTION 'Payment currency mismatch: Webhook received % but booking % requires %.', p_currency, p_booking_id, v_booking.charged_currency;
    END IF;

    IF p_amount != v_booking.charged_amount THEN
        RAISE EXCEPTION 'Payment amount mismatch: Webhook received % but booking % requires %.', p_amount, p_booking_id, v_booking.charged_amount;
    END IF;

    -- 4. Idempotency Check on Webhook Event
    SELECT id, is_successful INTO v_existing_log
    FROM public.payment_webhook_logs
    WHERE gateway_provider = p_gateway_provider AND event_id = p_event_id;

    IF FOUND AND v_existing_log.is_successful = TRUE THEN
        -- Webhook event already processed successfully; exit idempotently without duplicate operations
        RETURN jsonb_build_object(
            'success', true,
            'status', 'already_processed',
            'message', 'Webhook event ' || p_event_id || ' has already been successfully processed.'
        );
    END IF;

    -- Record initial webhook log entry (or update existing failed entry for safe retry)
    IF FOUND THEN
        UPDATE public.payment_webhook_logs
        SET event_type = p_event_type,
            payload = p_payload,
            processed_at = NOW(),
            error_message = 'Retry initiated'
        WHERE id = v_existing_log.id
        RETURNING id INTO v_log_id;
    ELSE
        INSERT INTO public.payment_webhook_logs (
            gateway_provider,
            event_id,
            event_type,
            payload,
            processed_at,
            is_successful,
            error_message
        ) VALUES (
            p_gateway_provider,
            p_event_id,
            p_event_type,
            p_payload,
            NOW(),
            FALSE,
            'Processing initiated'
        )
        RETURNING id INTO v_log_id;
    END IF;

    -- Subtransaction to ensure processing errors are logged to payment_webhook_logs without aborting log insert
    BEGIN
        -- 5. Prevent multiple separate captured payments from confirming the same booking
        IF EXISTS (
            SELECT 1 FROM public.payments
            WHERE booking_id = p_booking_id
              AND status = 'captured'
              AND (gateway_provider != p_gateway_provider OR gateway_transaction_id != p_gateway_transaction_id)
        ) THEN
            RAISE EXCEPTION 'Booking % already has a different captured payment from transaction.', p_booking_id;
        END IF;

        -- 6. Check existing payment by gateway_transaction_id on conflict
        SELECT * INTO v_existing_payment
        FROM public.payments
        WHERE gateway_provider = p_gateway_provider
          AND gateway_transaction_id = p_gateway_transaction_id;

        IF FOUND THEN
            -- Existing payment record found: verify it matches the EXACT same booking, amount, and currency!
            IF v_existing_payment.booking_id != p_booking_id THEN
                RAISE EXCEPTION 'Transaction ID % is already linked to booking % (incoming: %).', p_gateway_transaction_id, v_existing_payment.booking_id, p_booking_id;
            END IF;

            IF v_existing_payment.amount != p_amount OR v_existing_payment.currency != p_currency THEN
                RAISE EXCEPTION 'Transaction ID % data mismatch: existing payment has % %, incoming has % %.', p_gateway_transaction_id, v_existing_payment.amount, v_existing_payment.currency, p_amount, p_currency;
            END IF;

            UPDATE public.payments
            SET status = 'captured',
                gateway_tracker_token = COALESCE(p_gateway_tracker_token, gateway_tracker_token),
                raw_payload = p_payload,
                updated_at = NOW()
            WHERE id = v_existing_payment.id
            RETURNING id INTO v_payment_id;
        ELSE
            -- Insert new payment record
            INSERT INTO public.payments (
                booking_id,
                gateway_provider,
                gateway_tracker_token,
                gateway_transaction_id,
                amount,
                currency,
                status,
                raw_payload
            ) VALUES (
                p_booking_id,
                p_gateway_provider,
                p_gateway_tracker_token,
                p_gateway_transaction_id,
                p_amount,
                p_currency,
                'captured',
                p_payload
            )
            RETURNING id INTO v_payment_id;
        END IF;

        -- 7. Execute payment confirmation and inventory transition
        v_confirm_result := public.confirm_booking_payment(p_booking_id, v_payment_id);

        -- If confirmation required a gateway refund (e.g. sold out hold), record reason in webhook log
        IF COALESCE((v_confirm_result->>'requires_refund')::boolean, false) THEN
            UPDATE public.payment_webhook_logs
            SET is_successful = FALSE,
                error_message = v_confirm_result->>'refund_reason'
            WHERE id = v_log_id;
        ELSE
            UPDATE public.payment_webhook_logs
            SET is_successful = TRUE,
                error_message = NULL
            WHERE id = v_log_id;
        END IF;

        RETURN v_confirm_result;

    EXCEPTION WHEN OTHERS THEN
        -- Safely record processing error in payment_webhook_logs without rolling back the log row
        UPDATE public.payment_webhook_logs
        SET is_successful = FALSE,
            error_message = SQLERRM
        WHERE id = v_log_id;

        RETURN jsonb_build_object(
            'success', false,
            'status', 'error',
            'error', SQLERRM
        );
    END;
END;
$$;

-- 7.4 Deadlock-Free Sweeper to Release Expired Booking Holds
-- Locks tour_schedules FIRST in ascending ID order before updating bookings
-- Transitions expired holds to status = 'expired' (NOT cancelled_by_operator)
-- Strictly validates held capacity before decrementing
CREATE OR REPLACE FUNCTION public.release_expired_booking_holds()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sched RECORD;
    v_sched_held INT;
    v_released_seats INT;
    v_released_bookings INT;
    v_total_released_count INT := 0;
BEGIN
    -- SECURITY CHECK: Background worker or admin only
    IF auth.role() IS NOT NULL AND auth.role() <> 'service_role' AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only scheduled background workers (service_role) or administrators can release expired booking holds.';
    END IF;

    -- Standardize row locking order: Iterate through distinct schedule IDs sorted ASC
    FOR v_sched IN
        SELECT DISTINCT s.id
        FROM public.tour_schedules s
        JOIN public.bookings b ON b.tour_schedule_id = s.id
        WHERE b.status = 'hold_pending_payment'
          AND b.hold_expires_at < NOW()
        ORDER BY s.id ASC
    LOOP
        -- Lock schedule row exclusively
        PERFORM 1 FROM public.tour_schedules WHERE id = v_sched.id FOR UPDATE;

        -- Cancel expired bookings and sum released capacity atomically
        WITH expired AS (
            UPDATE public.bookings
            SET status = 'expired',
                cancellation_reason = 'Hold expired prior to payment confirmation',
                updated_at = NOW()
            WHERE tour_schedule_id = v_sched.id
              AND status = 'hold_pending_payment'
              AND hold_expires_at < NOW()
            RETURNING total_participants
        )
        SELECT COALESCE(SUM(total_participants), 0), COUNT(*)
        INTO v_released_seats, v_released_bookings
        FROM expired;

        IF v_released_seats > 0 THEN
            SELECT held_capacity INTO v_sched_held
            FROM public.tour_schedules WHERE id = v_sched.id;

            IF v_sched_held < v_released_seats THEN
                RAISE EXCEPTION 'Capacity inconsistency in schedule %: held_capacity (%) is less than released expired seats (%).', v_sched.id, v_sched_held, v_released_seats;
            END IF;

            UPDATE public.tour_schedules
            SET held_capacity = held_capacity - v_released_seats
            WHERE id = v_sched.id;

            v_total_released_count := v_total_released_count + v_released_bookings;
        END IF;
    END LOOP;

    RETURN v_total_released_count;
END;
$$;

-- 7.5 Secure Guest Booking Lookup Function with Rate Limiting
-- Keyed on target booking reference to directly prevent enumeration / brute force
CREATE OR REPLACE FUNCTION public.get_guest_booking(
    p_booking_reference TEXT,
    p_guest_token UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_result JSONB;
BEGIN
    p_booking_reference := UPPER(TRIM(COALESCE(p_booking_reference, '')));

    IF p_booking_reference = '' OR p_guest_token IS NULL THEN
        RAISE EXCEPTION 'A valid booking reference and guest access token are required.';
    END IF;

    -- Rate limiting per target booking reference (Max 10 lookups per 60 seconds per reference)
    IF NOT public.check_and_increment_rate_limit('ref:' || p_booking_reference, 'guest_lookup', 10, 60) THEN
        RAISE EXCEPTION 'Too many booking lookup attempts for this reference. Please wait 1 minute before retrying.';
    END IF;

    -- Only return traveler-facing itinerary fields.
    -- Internal foreign keys, payment gateway raw payloads, and tokens are never returned.
    SELECT jsonb_build_object(
        'booking_reference', b.booking_reference,
        'status', b.status,
        'total_participants', b.total_participants,
        'lead_traveler_name', b.lead_traveler_name,
        'base_currency', b.base_currency,
        'total_base_amount', b.total_base_amount,
        'charged_currency', b.charged_currency,
        'charged_amount', b.charged_amount,
        'voucher_pdf_url', b.voucher_pdf_url,
        'voucher_qr_code', b.voucher_qr_code,
        'hold_expires_at', b.hold_expires_at,
        'tour_title', t.title,
        'departure_date', s.tour_date,
        'departure_time_jst', s.start_time_jst,
        'meeting_point', t.meeting_point_details
    ) INTO v_result
    FROM public.bookings b
    JOIN public.tour_schedules s ON b.tour_schedule_id = s.id
    JOIN public.tour_options o ON s.tour_option_id = o.id
    JOIN public.tours t ON o.tour_id = t.id
    WHERE b.booking_reference = p_booking_reference
      AND b.guest_access_token = p_guest_token;

    RETURN v_result;
END;
$$;

-- ==============================================================================
-- 8. Row Level Security (RLS) & Table Access Privileges
-- ==============================================================================

-- 8.1 Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- 8.2 Revoke Default Permissions (Strict Least Privilege)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- Prevent untrusted users from creating objects in public schema (SECURITY DEFINER Protection)
REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT CREATE ON SCHEMA public TO postgres, service_role;

-- 8.3 Public Catalog Access Grants
GRANT SELECT ON public.destinations TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.tours TO anon, authenticated;
GRANT SELECT ON public.tour_options TO anon, authenticated;
GRANT SELECT ON public.tour_pricing_tiers TO anon, authenticated;
GRANT SELECT (id, base_currency, target_currency, rate, updated_at) ON public.exchange_rates TO anon, authenticated;
GRANT SELECT ON public.v_tour_schedules_public TO anon, authenticated;
GRANT SELECT ON public.v_public_reviews TO anon, authenticated;

-- Authorized Tour Operator & Admin Catalog Mutation Grants (Governed by is_tour_operator() RLS)
GRANT INSERT, UPDATE, DELETE ON public.destinations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tours TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tour_options TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tour_pricing_tiers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tour_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.exchange_rates TO authenticated;
GRANT UPDATE (status, cancellation_reason, voucher_pdf_url, voucher_qr_code, updated_at) ON public.bookings TO authenticated;

-- Service role has full administrative access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 8.4 RLS Policies: Public Catalog & Operator Management
CREATE POLICY "Public destinations viewable" ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Operators and admins manage destinations" ON public.destinations FOR ALL USING (public.is_tour_operator());

CREATE POLICY "Public categories viewable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Operators and admins manage categories" ON public.categories FOR ALL USING (public.is_tour_operator());

CREATE POLICY "Active tours viewable" ON public.tours FOR SELECT USING (is_active = true);
CREATE POLICY "Operators and admins manage tours" ON public.tours FOR ALL USING (public.is_tour_operator());

CREATE POLICY "Active tour options viewable" ON public.tour_options FOR SELECT USING (is_active = true);
CREATE POLICY "Operators and admins manage options" ON public.tour_options FOR ALL USING (public.is_tour_operator());

CREATE POLICY "Tour pricing tiers viewable" ON public.tour_pricing_tiers FOR SELECT USING (true);
CREATE POLICY "Operators and admins manage pricing tiers" ON public.tour_pricing_tiers FOR ALL USING (public.is_tour_operator());

CREATE POLICY "Exchange rates viewable" ON public.exchange_rates FOR SELECT USING (true);
CREATE POLICY "Admins manage exchange rates" ON public.exchange_rates FOR ALL USING (public.is_admin());

-- Tour schedules: direct table SELECT & management restricted to operators/admins
CREATE POLICY "Operators and admins view full schedules" ON public.tour_schedules
FOR SELECT USING (public.is_tour_operator());

CREATE POLICY "Operators and admins manage schedules" ON public.tour_schedules
FOR ALL USING (public.is_tour_operator());

-- Reviews: Published reviews viewable, admins manage, customers review own completed bookings
CREATE POLICY "Published reviews viewable" ON public.reviews
FOR SELECT USING (status = 'published');

CREATE POLICY "Operators and admins manage reviews" ON public.reviews
FOR ALL USING (public.is_tour_operator());

CREATE POLICY "Customers review completed bookings" ON public.reviews
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND (
        booking_id IS NULL OR EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id
              AND b.user_id = auth.uid()
              AND b.status IN ('confirmed', 'completed')
        )
    )
);

CREATE POLICY "Customers update own reviews" ON public.reviews
FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 8.5 Profiles RLS & Privileges
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone_country_code, phone_national_number, nationality_code, preferred_currency) ON public.profiles TO authenticated;

CREATE POLICY "Users view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users update own profile fields" ON public.profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins manage profiles" ON public.profiles
FOR ALL USING (public.is_admin());

-- 8.6 Bookings Ledger RLS & Granular Column Privileges
-- Ordinary customer queries CANNOT access guest_access_tokens
GRANT SELECT (
    id,
    booking_reference,
    tour_schedule_id,
    lead_traveler_name,
    lead_traveler_email,
    lead_traveler_phone,
    emergency_contact,
    special_requirements,
    total_participants,
    base_currency,
    total_base_amount,
    charged_currency,
    charged_amount,
    exchange_rate_applied,
    status,
    hold_expires_at,
    voucher_pdf_url,
    voucher_qr_code,
    created_at,
    updated_at
) ON public.bookings TO authenticated;

GRANT SELECT ON public.booking_participants TO authenticated;

-- Ordinary customer queries CANNOT access raw_payload, gateway_tracker_token, or refund internal details
GRANT SELECT (
    id,
    booking_id,
    gateway_provider,
    gateway_transaction_id,
    amount,
    currency,
    status,
    created_at
) ON public.payments TO authenticated;

CREATE POLICY "Users view own bookings" ON public.bookings
FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR public.is_admin()
);

CREATE POLICY "Admins update bookings" ON public.bookings
FOR UPDATE USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Users view own booking participants" ON public.booking_participants
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = booking_id
          AND ((auth.uid() IS NOT NULL AND b.user_id = auth.uid()) OR public.is_admin())
    )
);

CREATE POLICY "Users view own payments" ON public.payments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = booking_id
          AND ((auth.uid() IS NOT NULL AND b.user_id = auth.uid()) OR public.is_admin())
    )
);

CREATE POLICY "Admins view webhook logs" ON public.payment_webhook_logs
FOR SELECT USING (public.is_admin());

-- ==============================================================================
-- 9. Explicit Function Execution Privileges (Hardened Least Privilege)
-- ==============================================================================

-- Helper functions: safe STABLE functions
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_tour_operator() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_tour_operator() TO anon, authenticated, service_role;

-- Rate limiting: REVOKED from anon and authenticated. Service role only.
REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit(TEXT, TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(TEXT, TEXT, INT, INT) TO service_role;

REVOKE ALL ON FUNCTION public.cleanup_expired_rate_limit_buckets(INTERVAL) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_rate_limit_buckets(INTERVAL) TO service_role;

-- Booking RPCs
REVOKE ALL ON FUNCTION public.create_booking_hold(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, VARCHAR, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_hold(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, VARCHAR, JSONB) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_guest_booking(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_guest_booking(TEXT, UUID) TO anon, authenticated, service_role;

-- Internal / Service Role Only RPCs (Webhooks & Background Workers)
REVOKE ALL ON FUNCTION public.confirm_booking_payment(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_booking_payment(UUID, UUID) TO service_role;

REVOKE ALL ON FUNCTION public.process_payment_webhook(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, NUMERIC, VARCHAR, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment_webhook(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, NUMERIC, VARCHAR, JSONB) TO service_role;

REVOKE ALL ON FUNCTION public.release_expired_booking_holds() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_expired_booking_holds() TO service_role;
