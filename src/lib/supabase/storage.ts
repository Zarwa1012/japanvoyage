import { SupabaseClient } from '@supabase/supabase-js';

export const RECEIPTS_BUCKET = 'payment-receipts';
export const ALLOWED_RECEIPT_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/pdf',
];
export const MAX_RECEIPT_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Ensures the payment-receipts bucket exists in Supabase Storage with private access.
 */
export async function ensureReceiptsBucket(adminSupabase: SupabaseClient) {
  try {
    const { data: buckets, error: listError } = await adminSupabase.storage.listBuckets();
    if (listError) {
      console.warn('Error checking storage buckets:', listError.message);
      return;
    }

    const exists = buckets?.some(
      (b) => b.name === RECEIPTS_BUCKET || b.id === RECEIPTS_BUCKET
    );

    if (!exists) {
      const { error: createError } = await adminSupabase.storage.createBucket(
        RECEIPTS_BUCKET,
        {
          public: false, // Strictly private (Requirement 6)
          fileSizeLimit: MAX_RECEIPT_FILE_SIZE,
          allowedMimeTypes: ALLOWED_RECEIPT_MIME_TYPES,
        }
      );

      if (createError && !createError.message.includes('already exists')) {
        console.warn('Could not auto-create storage bucket:', createError.message);
      }
    }
  } catch (err) {
    console.warn('Exception ensuring receipts bucket:', err);
  }
}

/**
 * Uploads a customer payment receipt (Image or PDF) to the dedicated bucket.
 * Returns the storage file path.
 */
export async function uploadReceiptFile(
  adminSupabase: SupabaseClient,
  params: {
    bookingId: string;
    fileName: string;
    mimeType: string;
    fileBuffer: Buffer | Uint8Array;
  }
): Promise<{ filePath: string }> {
  const { bookingId, fileName, mimeType, fileBuffer } = params;

  // 1. Validate MIME type
  const normalizedMime = mimeType.toLowerCase();
  if (!ALLOWED_RECEIPT_MIME_TYPES.includes(normalizedMime)) {
    throw new Error(
      `Unsupported file type (${mimeType}). Only PNG, JPG, WEBP images and PDF documents are allowed.`
    );
  }

  // 2. Validate file size
  if (fileBuffer.byteLength > MAX_RECEIPT_FILE_SIZE) {
    throw new Error('File size exceeds the 10 MB limit. Please upload a smaller receipt.');
  }

  // 3. Ensure bucket exists
  await ensureReceiptsBucket(adminSupabase);

  // 4. Sanitize file name & generate storage path associated with booking ID (Requirement 1, 7)
  const cleanBaseName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();
  const timestamp = Date.now();
  const filePath = `${bookingId}/${timestamp}_${cleanBaseName}`;

  // 5. Upload to Supabase Storage
  const { error: uploadError } = await adminSupabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: normalizedMime,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  return { filePath };
}

/**
 * Generates a temporary secure signed URL for authorized admins to view/download receipts.
 */
export async function generateReceiptSignedUrl(
  adminSupabase: SupabaseClient,
  filePath: string,
  expiresInSeconds: number = 3600 // 1 hour
): Promise<string> {
  const cleanPath = filePath.startsWith(`${RECEIPTS_BUCKET}/`)
    ? filePath.replace(`${RECEIPTS_BUCKET}/`, '')
    : filePath;

  const { data, error } = await adminSupabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(cleanPath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL for receipt: ${error?.message || 'Unknown error'}`);
  }

  return data.signedUrl;
}
