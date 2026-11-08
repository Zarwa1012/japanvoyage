import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateReceiptSignedUrl, RECEIPTS_BUCKET } from '@/lib/supabase/storage';

export async function GET(request: NextRequest) {
  try {
    // 1. Role-based authorization: Only verified admins can view/download payment receipts (Requirement 6)
    const serverSupabase = createServerClient();
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Verify admin role in profiles
    const { data: profile, error: profErr } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profErr || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Administrator credentials required.' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get('paymentId');
    const download = searchParams.get('download') === 'true';

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing paymentId query parameter.' }, { status: 400 });
    }

    // 2. Fetch payment record
    const { data: payment, error: pErr } = await adminSupabase
      .from('payments')
      .select(`
        id,
        booking_id,
        proof_image_url,
        gateway_transaction_id,
        amount,
        currency,
        sender_name,
        raw_payload,
        booking:bookings (
          booking_reference,
          lead_traveler_name
        )
      `)
      .eq('id', paymentId)
      .single();

    if (pErr || !payment) {
      return NextResponse.json({ error: 'Payment record not found.' }, { status: 404 });
    }

    if (!payment.proof_image_url) {
      return NextResponse.json({ error: 'No receipt file attached to this payment submission.' }, { status: 404 });
    }

    const filePath = payment.proof_image_url;
    const isBase64 = filePath.startsWith('data:');
    const fileName = (payment.raw_payload as any)?.receipt_file_name || `receipt_${payment.gateway_transaction_id}.png`;
    const isPdf = filePath.toLowerCase().endsWith('.pdf') || (payment.raw_payload as any)?.receipt_mime_type === 'application/pdf';

    // 3. Handle Direct File Download (Requirement 5)
    if (download && !isBase64) {
      const cleanPath = filePath.startsWith(`${RECEIPTS_BUCKET}/`)
        ? filePath.replace(`${RECEIPTS_BUCKET}/`, '')
        : filePath;

      const { data: fileData, error: downloadError } = await adminSupabase.storage
        .from(RECEIPTS_BUCKET)
        .download(cleanPath);

      if (downloadError || !fileData) {
        return NextResponse.json({ error: `Failed to download file from storage: ${downloadError?.message}` }, { status: 500 });
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      const mimeType = isPdf ? 'application/pdf' : 'image/png';

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // 4. Generate Temporary Secure Signed URL (Requirement 4, 6)
    let signedUrl = filePath;
    if (!isBase64) {
      signedUrl = await generateReceiptSignedUrl(adminSupabase, filePath, 3600); // 1-hour expiration
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      bookingId: payment.booking_id,
      bookingReference: (payment.booking as any)?.booking_reference,
      customerName: (payment.booking as any)?.lead_traveler_name || payment.sender_name,
      transactionId: payment.gateway_transaction_id,
      filePath,
      fileName,
      isPdf,
      signedUrl,
    });
  } catch (err: any) {
    console.error('Exception in payment receipt retrieval API:', err);
    return NextResponse.json({ error: err?.message || 'Server error retrieving receipt' }, { status: 500 });
  }
}
