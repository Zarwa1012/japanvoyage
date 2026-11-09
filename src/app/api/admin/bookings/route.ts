import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

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

    // 2. Fetch all real bookings joined with schedule and tour details
    const { data: bookings, error: bErr } = await adminSupabase
      .from('bookings')
      .select(`
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
        exchange_rate_applied,
        payment_method,
        special_requirements,
        emergency_contact,
        created_at,
        schedule:tour_schedules(
          id,
          tour_date,
          start_time_jst,
          tour_option:tour_options(
            id,
            title,
            tour:tours(
              id,
              title,
              slug
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    let finalBookings = bookings;
    if (bErr) {
      console.warn('Joined bookings query failed, falling back to basic bookings query:', bErr.message);
      const { data: fallbackBookings, error: fbErr } = await adminSupabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (fbErr) {
        return NextResponse.json({ error: fbErr.message }, { status: 500 });
      }
      finalBookings = fallbackBookings;
    }

    // Compute dynamic stats
    const totalBookings = finalBookings?.length || 0;
    const confirmedList = finalBookings?.filter((b: any) => b.status === 'confirmed') || [];
    const pendingList = finalBookings?.filter((b: any) => b.status === 'hold_pending_payment') || [];
    const cancelledList = finalBookings?.filter((b: any) => b.status === 'cancelled_by_operator' || b.status === 'rejected') || [];

    const confirmedCount = confirmedList.length;
    const pendingCount = pendingList.length;
    const cancelledCount = cancelledList.length;

    const confirmedRevenueJpy = confirmedList.reduce((sum: number, b: any) => sum + (Number(b.total_base_amount) || 0), 0);
    const confirmedRevenuePkr = confirmedList.reduce((sum: number, b: any) => sum + (Number(b.charged_amount) || 0), 0);
    const pendingRevenuePkr = pendingList.reduce((sum: number, b: any) => sum + (Number(b.charged_amount) || 0), 0);

    return NextResponse.json({
      success: true,
      bookings: finalBookings || [],
      stats: {
        totalBookings,
        confirmedCount,
        pendingCount,
        cancelledCount,
        confirmedRevenueJpy,
        confirmedRevenuePkr,
        pendingRevenuePkr,
      },
    });
  } catch (err: any) {
    console.error('Exception in admin bookings API:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

// Allow direct status updates from admin (e.g. manually confirm or cancel a booking)
export async function PATCH(request: Request) {
  try {
    const serverSupabase = createServerClient();
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { bookingId, status, notes } = body;

    if (!bookingId || !status) {
      return NextResponse.json({ error: 'Missing bookingId or status' }, { status: 400 });
    }

    const { data: updated, error } = await adminSupabase
      .from('bookings')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(notes ? { special_requirements: notes } : {}),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
