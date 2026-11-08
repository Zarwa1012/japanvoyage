-- ==============================================================================
-- Migration: 20261107_auth_and_profiles.sql (SECURITY AUDITED & PRODUCTION HARDENED)
-- Description: Automated Profile Lifecycle, Secure Role Management, and Auth Triggers
-- Depends on: 20261107_initial_schema.sql (public.profiles table)
-- Audit: Privilege Isolation, Non-Recursive RLS & SQL Editor First-Admin Bootstrap
-- ==============================================================================

-- 1. Automatic Profile Creation Trigger Function
-- Triggered whenever a new user registers via Supabase Auth (email/password, OAuth, or phone)
-- Runs with database owner privileges (SECURITY DEFINER) to write into public.profiles
-- Safely handles missing/NULL email to satisfy profiles.email NOT NULL UNIQUE constraint
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_email CITEXT;
BEGIN
    -- Fallback for authentication methods without an email address (e.g. phone or anonymous)
    v_user_email := COALESCE(
        NEW.email,
        CASE 
            WHEN NEW.phone IS NOT NULL AND NEW.phone <> '' THEN NEW.phone || '@phone.auth.local'
            ELSE NEW.id::text || '@noemail.auth.local'
        END
    );

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone_country_code,
        phone_national_number,
        nationality_code,
        preferred_currency,
        role
    )
    VALUES (
        NEW.id,
        v_user_email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(v_user_email, '@', 1)),
        NEW.raw_user_meta_data->>'phone_country_code',
        NEW.raw_user_meta_data->>'phone_national_number',
        NEW.raw_user_meta_data->>'nationality',
        COALESCE(NEW.raw_user_meta_data->>'preferred_currency', 'USD'),
        'customer' -- ALWAYS enforce 'customer' role. Client user_metadata role is strictly ignored.
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
END;
$$;

-- 2. Bind Profile Trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Profile Immutable Fields & Privilege Escalation Protection Trigger
-- Runs BEFORE UPDATE on public.profiles to ensure customers cannot tamper with protected columns
-- Uses NULL-safe IS DISTINCT FROM comparisons on all protected fields
-- Allows direct SQL Editor execution while strictly blocking client API privilege escalation
CREATE OR REPLACE FUNCTION public.protect_profile_immutable_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_client_user BOOLEAN;
    v_is_platform_admin BOOLEAN;
BEGIN
    -- In Supabase PostgREST, client requests carry auth.role() = 'authenticated' or 'anon'
    v_is_client_user := (COALESCE(auth.role(), '') IN ('authenticated', 'anon'));

    -- Check if the caller is an active, verified platform administrator
    v_is_platform_admin := (auth.uid() IS NOT NULL AND public.is_admin());

    -- If the request originates from a client API connection and they are not an administrator:
    IF v_is_client_user AND NOT v_is_platform_admin THEN
        -- NULL-safe comparison for id
        IF NEW.id IS DISTINCT FROM OLD.id THEN
            RAISE EXCEPTION 'Modifying profile id is strictly forbidden.';
        END IF;

        -- NULL-safe comparison for role (Prevents privilege escalation)
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Privilege escalation forbidden: users cannot alter their assigned role.';
        END IF;

        -- NULL-safe comparison for email
        IF NEW.email IS DISTINCT FROM OLD.email THEN
            RAISE EXCEPTION 'Email changes must be performed through verified authentication workflows.';
        END IF;

        -- NULL-safe comparison for created_at
        IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Profile creation timestamp is immutable.';
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_fields_trigger ON public.profiles;
CREATE TRIGGER protect_profile_fields_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_immutable_fields();

-- 4. Remove Self-Insert Policy & Revoke Direct Profile Inserts
-- Direct profile inserts by clients are eliminated. All profiles originate from the auth trigger.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
REVOKE INSERT ON public.profiles FROM anon, authenticated;

-- 5. Helper Function to Read Current User's Verified Role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(
        (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid() AND auth.uid() IS NOT NULL),
        'anon'
    );
$$;

-- 6. REMOVAL OF set_user_role FUNCTION
-- The set_user_role RPC function has been completely removed to eliminate any potential API attack surface.
DROP FUNCTION IF EXISTS public.set_user_role(TEXT, TEXT);

-- ==============================================================================
-- 7. SECURE FIRST-ADMIN BOOTSTRAP INSTRUCTIONS (SQL EDITOR ONLY)
-- ==============================================================================
-- To bootstrap the initial administrator for your JapanVoyage platform,
-- navigate to the Supabase Dashboard -> SQL Editor and execute the following query
-- with your registered administrator email address:
--
-- UPDATE public.profiles
-- SET role = 'admin',
--     updated_at = NOW()
-- WHERE email = 'your-admin-email@example.com';
--
-- Optionally synchronize with Supabase Auth app_metadata for JWT claims:
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'your-admin-email@example.com';
-- ==============================================================================

-- 8. Explicit Function Privilege Hardening
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_immutable_fields() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.get_my_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon, authenticated, service_role;
