-- ==============================================================================
-- Migration: Supabase Storage Configuration for Payment Receipts
-- Bucket: payment-receipts (Private storage bucket for customer payment proofs)
-- Note: Do NOT run "ALTER TABLE storage.objects" as that table is owned by
-- Supabase's internal storage service (supabase_storage_admin).
-- ==============================================================================

-- 1. Create payment-receipts bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-receipts',
    'payment-receipts',
    false, -- Private bucket: prevents public unauthenticated access
    10485760, -- 10 MB limit
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
