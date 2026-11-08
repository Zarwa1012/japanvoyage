import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    // 1. Verify caller is authenticated Admin (Requirement 8)
    const serverSupabase = createServerClient();
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: authentication required.' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Check admin role in profiles
    const { data: profile, error: profErr } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profErr || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: administrator access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { paymentId, action, rejectionReason, adminNotes } = body;

    if (!paymentId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid parameters: paymentId and action ("approve" | "reject") are required.' },
        { status: 400 }
      );
    }

    // 2. Select payment record
    const { data: payment, error: pErr } = await adminSupabase
      .from('payments')
      .select('id, booking_id, status, gateway_transaction_id')
      .eq('id', paymentId)
      .single();

    if (pErr || !payment) {
      return NextResponse.json({ error: 'Payment record not found.' }, { status: 404 });
    }

    // 3. Prevent duplicate payment approvals (Requirement 9)
    if (action === 'approve') {
      const alreadyApproved = payment.status === 'paid' || payment.status === 'captured';
      if (alreadyApproved) {
        return NextResponse.json(
          { error: 'Duplicate Approval Prevented: This payment has already been approved and marked as PAID.' },
          { status: 409 }
        );
      }
    }

    // 4. Select associated booking record
    const { data: booking, error: bErr } = await adminSupabase
      .from('bookings')
      .select('id, booking_reference, status')
      .eq('id', payment.booking_id)
      .single();

    if (bErr || !booking) {
      return NextResponse.json({ error: 'Associated booking record not found.' }, { status: 404 });
    }

    if (action === 'approve' && booking.status === 'confirmed') {
      return NextResponse.json(
        { error: 'Duplicate Approval Prevented: The booking reservation is already CONFIRMED.' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    // 5. Handle Action: APPROVE (Requirement 6)
    if (action === 'approve') {
      // Update payment status to PAID (or fallback to captured if enum value not migrated yet)
      let updateError = null;
      const { error: errPaid } = await adminSupabase
        .from('payments')
        .update({
          status: 'paid',
          verified_at: now,
          verified_by: user.id,
          admin_notes: adminNotes || 'Approved by admin',
          updated_at: now,
        })
        .eq('id', paymentId);

      if (errPaid) {
        // Fallback to 'captured' in case Postgres enum was defined as 'captured'
        const { error: errCaptured } = await adminSupabase
          .from('payments')
          .update({
            status: 'captured',
            verified_at: now,
            verified_by: user.id,
            admin_notes: adminNotes || 'Approved by admin',
            updated_at: now,
          })
          .eq('id', paymentId);
        updateError = errCaptured;
      }

      if (updateError) {
        console.error('Failed to update payment status:', updateError.message);
        return NextResponse.json({ error: `Database error updating payment: ${updateError.message}` }, { status: 500 });
      }

      // Update associated booking status to CONFIRMED
      const { error: bookingUpdateErr } = await adminSupabase
        .from('bookings')
        .update({
          status: 'confirmed',
          updated_at: now,
        })
        .eq('id', booking.id);

      if (bookingUpdateErr) {
        console.error('Failed to update booking status:', bookingUpdateErr.message);
        return NextResponse.json({ error: `Database error updating booking: ${bookingUpdateErr.message}` }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'approved',
        paymentId,
        bookingId: booking.id,
        bookingReference: booking.booking_reference,
        paymentStatus: 'PAID',
        bookingStatus: 'CONFIRMED',
        verifiedAt: now,
        verifiedBy: user.id,
      });
    } 
    
    // 6. Handle Action: REJECT (Requirement 7)
    else {
      const reason = rejectionReason?.trim() || 'Payment verification rejected: Transaction ID mismatch or invalid proof.';

      // Update payment status to REJECTED, record rejection reason and verification details
      const { error: rejectErr } = await adminSupabase
        .from('payments')
        .update({
          status: 'rejected',
          verified_at: now,
          verified_by: user.id,
          rejection_reason: reason,
          admin_notes: adminNotes || null,
          updated_at: now,
        })
        .eq('id', paymentId);

      if (rejectErr) {
        console.error('Failed to update payment to rejected:', rejectErr.message);
        return NextResponse.json({ error: `Database error rejecting payment: ${rejectErr.message}` }, { status: 500 });
      }

      // Keep booking unconfirmed: transition booking hold to cancelled
      const { error: cancelBookingErr } = await adminSupabase
        .from('bookings')
        .update({
          status: 'cancelled_by_operator',
          cancellation_reason: reason,
          updated_at: now,
        })
        .eq('id', booking.id);

      if (cancelBookingErr) {
        console.error('Failed to cancel booking hold:', cancelBookingErr.message);
      }

      return NextResponse.json({
        success: true,
        action: 'rejected',
        paymentId,
        bookingId: booking.id,
        bookingReference: booking.booking_reference,
        paymentStatus: 'REJECTED',
        bookingStatus: 'UNCONFIRMED',
        rejectionReason: reason,
        verifiedAt: now,
        verifiedBy: user.id,
      });
    }
  } catch (err: any) {
    console.error('Exception in verify payment API:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
