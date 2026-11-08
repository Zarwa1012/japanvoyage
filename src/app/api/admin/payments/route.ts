import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // 1. Verify caller is authenticated Admin
    const serverSupabase = createServerClient();
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: authentication required.' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Check admin role in profiles
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: administrator access required.' }, { status: 403 });
    }

    // 2. Fetch payments joined with booking and schedule details
    const { data: payments, error: paymentsErr } = await adminSupabase
      .from('payments')
      .select(`
        id,
        booking_id,
        gateway_provider,
        gateway_transaction_id,
        amount,
        currency,
        status,
        sender_name,
        sender_mobile,
        sender_account,
        proof_image_url,
        verified_at,
        verified_by,
        admin_notes,
        rejection_reason,
        created_at,
        raw_payload,
        booking:bookings(
          id,
          booking_reference,
          status,
          lead_traveler_name,
          lead_traveler_email,
          lead_traveler_phone,
          total_participants,
          total_base_amount,
          charged_amount,
          charged_currency,
          schedule:tour_schedules(
            tour_date,
            start_time_jst,
            tour_option:tour_options(
              title,
              tour:tours(
                title,
                slug
              )
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (paymentsErr) {
      console.error('Error fetching payments in admin API:', paymentsErr.message);
      return NextResponse.json({ error: paymentsErr.message }, { status: 500 });
    }

    return NextResponse.json({ payments: payments || [] });
  } catch (err: any) {
    console.error('Exception in admin payments API:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
