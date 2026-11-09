import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { uploadReceiptFile, ALLOWED_RECEIPT_MIME_TYPES } from '@/lib/supabase/storage';
import { sendAdminPaymentProofNotification } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let bookingId = '';
    let paymentMethod = '';
    let transactionId = '';
    let senderName = '';
    let senderMobile = '';
    let amountPkr = '';
    let customerNotes: string | null = null;
    let receiptFileBuffer: Buffer | null = null;
    let receiptFileName = 'receipt.png';
    let receiptMimeType = 'image/png';
    let fallbackImageUrl: string | null = null;

    // 1. Parse Multipart/Form-Data or JSON Request
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      bookingId = (formData.get('bookingId') as string) || '';
      paymentMethod = (formData.get('paymentMethod') as string) || '';
      transactionId = (formData.get('transactionId') as string) || '';
      senderName = (formData.get('senderName') as string) || '';
      senderMobile = (formData.get('senderMobile') as string) || '';
      amountPkr = (formData.get('amountPkr') as string) || '';
      customerNotes = (formData.get('customerNotes') as string) || null;

      const file = formData.get('receiptFile') as File | null;
      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        receiptFileName = file.name || 'receipt';
        receiptMimeType = file.type || 'image/png';
        const arrayBuffer = await file.arrayBuffer();
        receiptFileBuffer = Buffer.from(arrayBuffer);
      }

      const base64Field = (formData.get('receiptFileBase64') as string) || '';
      if (!receiptFileBuffer && base64Field) {
        const matches = base64Field.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          receiptMimeType = matches[1];
          receiptFileBuffer = Buffer.from(matches[2], 'base64');
          receiptFileName = (formData.get('receiptFileName') as string) || (receiptMimeType.includes('pdf') ? 'receipt.pdf' : 'receipt.png');
        } else {
          fallbackImageUrl = base64Field;
        }
      }
    } else {
      const body = await request.json();
      bookingId = body.bookingId || '';
      paymentMethod = body.paymentMethod || '';
      transactionId = body.transactionId || '';
      senderName = body.senderName || '';
      senderMobile = body.senderMobile || '';
      amountPkr = body.amountPkr ? String(body.amountPkr) : '';
      customerNotes = body.customerNotes || null;

      // Check if base64 file provided
      if (body.receiptFileBase64) {
        const matches = body.receiptFileBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          receiptMimeType = matches[1];
          receiptFileBuffer = Buffer.from(matches[2], 'base64');
          receiptFileName = body.receiptFileName || (receiptMimeType.includes('pdf') ? 'receipt.pdf' : 'receipt.png');
        } else {
          fallbackImageUrl = body.receiptFileBase64;
        }
      } else if (body.proofImageUrl) {
        fallbackImageUrl = body.proofImageUrl;
      }
    }

    // 2. Strict Input Validations
    if (!bookingId || !paymentMethod || !transactionId || !senderName || !senderMobile) {
      return NextResponse.json(
        { error: 'Missing required payment details: Booking ID, Payment Method, Transaction ID, and Sender details are mandatory.' },
        { status: 400 }
      );
    }

    const permittedMethods = ['easypaisa', 'jazzcash', 'raast'];
    if (!permittedMethods.includes(paymentMethod.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid payment method: ${paymentMethod}. Permitted: ${permittedMethods.join(', ')}` },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // 3. Verify associated booking exists (Requirement 7)
    let { data: booking, error: bookingErr } = await adminSupabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        status,
        charged_amount,
        charged_currency,
        total_base_amount,
        lead_traveler_name,
        lead_traveler_email,
        lead_traveler_phone,
        schedule:tour_schedules(
          tour_date,
          tour_option:tour_options(
            title,
            tour:tours(
              title
            )
          )
        )
      `)
      .eq('id', bookingId)
      .single();

    // Fallback query if joined schedule has any postgrest issue
    if (bookingErr || !booking) {
      const basic = await adminSupabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (basic.error || !basic.data) {
        return NextResponse.json(
          { error: 'Associated booking reservation not found for the provided Booking ID.' },
          { status: 404 }
        );
      }
      booking = basic.data;
    }

    if (!booking) {
      return NextResponse.json(
        { error: 'Associated booking reservation not found for the provided Booking ID.' },
        { status: 404 }
      );
    }

    const currentBooking = booking;

    // 4. Store receipt in Supabase Storage bucket 'payment-receipts' (Requirement 1, 2, 7, 8)
    let storedReceiptPath: string | null = fallbackImageUrl;

    if (receiptFileBuffer) {
      try {
        const { filePath } = await uploadReceiptFile(adminSupabase, {
          bookingId: currentBooking.id,
          fileName: receiptFileName,
          mimeType: receiptMimeType,
          fileBuffer: receiptFileBuffer,
        });
        storedReceiptPath = filePath;
      } catch (storageErr: any) {
        console.error('Storage upload failure:', storageErr.message);
        return NextResponse.json(
          { error: `Receipt upload failed: ${storageErr.message}. Please try again.` },
          { status: 400 }
        );
      }
    }

    const cleanTrxId = transactionId.trim().toUpperCase();
    const cleanSenderName = senderName.trim();
    const cleanSenderMobile = senderMobile.trim();
    const finalAmount = Number(amountPkr) || Number(currentBooking.charged_amount) || 0;

    // 5. Insert payment submission record with status PENDING_VERIFICATION (Requirement 2, 9)
    // NEVER automatically mark as PAID on receipt upload! Admin must manually review actual receipt.
    const { data: payment, error: paymentErr } = await adminSupabase
      .from('payments')
      .insert({
        booking_id: currentBooking.id,
        gateway_provider: paymentMethod.toLowerCase(),
        gateway_transaction_id: cleanTrxId,
        amount: finalAmount,
        currency: 'PKR',
        status: 'pending_verification',
        sender_name: cleanSenderName,
        sender_mobile: cleanSenderMobile,
        proof_image_url: storedReceiptPath,
        raw_payload: {
          customer_notes: customerNotes || null,
          booking_reference: currentBooking.booking_reference,
          receipt_file_name: receiptFileName,
          receipt_mime_type: receiptMimeType,
          submitted_at: new Date().toISOString(),
        },
      })
      .select('id, status, created_at')
      .single();

    if (paymentErr) {
      console.error('Database payment record insertion failed:', paymentErr.message);
      return NextResponse.json(
        { error: `Database error while saving payment record: ${paymentErr.message}` },
        { status: 500 }
      );
    }

    // 6. Update booking payment_method and ensure booking status remains hold_pending_payment (Requirement 9)
    await adminSupabase
      .from('bookings')
      .update({
        payment_method: paymentMethod.toLowerCase(),
        status: 'hold_pending_payment',
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentBooking.id);

    // 7. Dispatch automated alert email to Admin
    try {
      const tourTitle = (currentBooking as any).schedule?.tour_option?.tour?.title || (currentBooking as any).schedule?.tour_option?.title || 'Japan Voyage Tour';
      const departureDate = (currentBooking as any).schedule?.tour_date || undefined;

      await sendAdminPaymentProofNotification({
        bookingReference: currentBooking.booking_reference,
        bookingId: currentBooking.id,
        customerName: cleanSenderName || (currentBooking as any).lead_traveler_name || 'Traveler',
        customerEmail: (currentBooking as any).lead_traveler_email || undefined,
        customerPhone: cleanSenderMobile || (currentBooking as any).lead_traveler_phone || undefined,
        tourTitle,
        departureDate,
        amountPkr: finalAmount,
        amountJpy: Number((currentBooking as any).total_base_amount) || undefined,
        paymentMethod: paymentMethod.toLowerCase(),
        transactionId: cleanTrxId,
        senderName: cleanSenderName,
        senderMobile: cleanSenderMobile,
        customerNotes,
        submittedAt: new Date().toISOString(),
      });
    } catch (emailErr) {
      console.warn('Non-blocking error sending admin notification email:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment receipt uploaded and submitted successfully. Reservation is pending administrator manual verification.',
      payment: {
        id: payment.id,
        status: 'pending_verification',
        booking_id: currentBooking.id,
        booking_reference: currentBooking.booking_reference,
        receipt_path: storedReceiptPath,
        created_at: payment.created_at,
      },
    });
  } catch (err: any) {
    console.error('Exception in submit-manual payment API:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error while processing payment submission.' },
      { status: 500 }
    );
  }
}
