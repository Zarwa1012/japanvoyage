-- ==============================================================================
-- Migration: Pakistani Payment Methods & Verification Workflow
-- Adds support for:
-- 1. Easypaisa, JazzCash, Raast, and Debit/Credit Card
-- 2. Transaction IDs and Payment Proof Uploads
-- 3. Admin Verification (Approve / Reject Workflow)
-- ==============================================================================

-- 1. Extend Payment Status Enum
DO $$ BEGIN
    ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'pending';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'pending_verification';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'paid';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'rejected';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Update public.payments table constraints and columns
DO $$ BEGIN
    -- Drop old check constraint that restricted gateway_provider to safepay/stripe
    ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_gateway_provider_check;
    ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS unique_gateway_transaction;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Add updated constraint allowing Pakistani gateways and card
ALTER TABLE public.payments ADD CONSTRAINT payments_gateway_provider_check 
CHECK (gateway_provider IN ('easypaisa', 'jazzcash', 'raast', 'card', 'stripe', 'manual_bank'));

-- Add columns for manual verification if not exist
ALTER TABLE public.payments 
    ADD COLUMN IF NOT EXISTS sender_name TEXT,
    ADD COLUMN IF NOT EXISTS sender_mobile TEXT,
    ADD COLUMN IF NOT EXISTS sender_account TEXT,
    ADD COLUMN IF NOT EXISTS proof_image_url TEXT,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS admin_notes TEXT,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Add payment_method to bookings table
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'easypaisa';

-- 4. Enable Row Level Security and Policies for public.payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Customers insert own payments" ON public.payments;
    DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
    DROP POLICY IF EXISTS "Admins manage all payments" ON public.payments;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "Customers insert own payments" ON public.payments
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = booking_id
        AND (b.user_id = auth.uid() OR auth.uid() IS NULL)
    )
);

CREATE POLICY "Users view own payments" ON public.payments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = booking_id
        AND (b.user_id = auth.uid() OR public.is_admin())
    )
);

CREATE POLICY "Admins manage all payments" ON public.payments
FOR ALL USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Atomic Payment Verification RPC Function
CREATE OR REPLACE FUNCTION public.verify_booking_payment(
    p_payment_id UUID,
    p_action TEXT, -- 'approve' or 'reject'
    p_admin_id UUID,
    p_rejection_reason TEXT DEFAULT NULL,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_payment RECORD;
    v_booking RECORD;
BEGIN
    -- Check admin privileges
    IF NOT public.is_admin() AND p_admin_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: only platform administrators can verify payments.';
    END IF;

    -- Select and lock payment record
    SELECT * INTO v_payment 
    FROM public.payments 
    WHERE id = p_payment_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment record % not found.', p_payment_id;
    END IF;

    SELECT * INTO v_booking 
    FROM public.bookings 
    WHERE id = v_payment.booking_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Associated booking % not found.', v_payment.booking_id;
    END IF;

    IF p_action = 'approve' THEN
        -- Transition payment to captured
        UPDATE public.payments
        SET status = 'captured',
            verified_at = NOW(),
            verified_by = p_admin_id,
            admin_notes = p_admin_notes,
            updated_at = NOW()
        WHERE id = p_payment_id;

        -- Transition booking to confirmed
        UPDATE public.bookings
        SET status = 'confirmed',
            updated_at = NOW()
        WHERE id = v_payment.booking_id;

        RETURN jsonb_build_object(
            'success', true,
            'action', 'approved',
            'payment_id', p_payment_id,
            'booking_id', v_payment.booking_id,
            'booking_reference', v_booking.booking_reference,
            'status', 'confirmed'
        );

    ELSIF p_action = 'reject' THEN
        -- Transition payment to rejected
        UPDATE public.payments
        SET status = 'rejected',
            verified_at = NOW(),
            verified_by = p_admin_id,
            rejection_reason = COALESCE(p_rejection_reason, 'Payment verification failed. Transaction ID could not be matched.'),
            admin_notes = p_admin_notes,
            updated_at = NOW()
        WHERE id = p_payment_id;

        -- Cancel the booking hold
        UPDATE public.bookings
        SET status = 'cancelled_by_operator',
            cancellation_reason = COALESCE(p_rejection_reason, 'Payment verification rejected.'),
            updated_at = NOW()
        WHERE id = v_payment.booking_id;

        RETURN jsonb_build_object(
            'success', true,
            'action', 'rejected',
            'payment_id', p_payment_id,
            'booking_id', v_payment.booking_id,
            'booking_reference', v_booking.booking_reference,
            'status', 'cancelled_by_operator'
        );
    ELSE
        RAISE EXCEPTION 'Invalid action: %. Permitted: approve, reject.', p_action;
    END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.verify_booking_payment(UUID, TEXT, UUID, TEXT, TEXT) TO authenticated, service_role;
