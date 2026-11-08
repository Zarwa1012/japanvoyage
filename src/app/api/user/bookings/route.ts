import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const serverSupabase = createServerClient();
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ bookings: [] });
    }

    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        status,
        total_participants,
        total_base_amount,
        base_currency,
        created_at,
        schedule:tour_schedules(
          tour_date,
          start_time_jst,
          tour_option:tour_options(
            title,
            tour:tours(
              id,
              title,
              slug,
              meeting_point_details,
              destination:destinations(name, hero_image_url)
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('User bookings fetch warning:', error?.message);
      return NextResponse.json({ bookings: [] });
    }

    const mapped = data.map((b: any) => {
      const schedule = b.schedule;
      const option = schedule?.tour_option;
      const tour = option?.tour;
      const destination = tour?.destination;
      const meetingPoint = tour?.meeting_point_details;

      return {
        id: b.id,
        reference: b.booking_reference,
        tourTitle: tour?.title || 'Japan Scenic Tour',
        tourSlug: tour?.slug || 'nikko-day-trip-with-tobu-world-square',
        destination: destination?.name || 'Japan',
        departureDate: schedule?.tour_date || (b.created_at ? new Date(b.created_at).toISOString().split('T')[0] : '2026-11-20'),
        departureTime: schedule?.start_time_jst ? `${schedule.start_time_jst.substring(0, 5)} JST` : '08:00 AM JST',
        meetingPoint: meetingPoint?.title || 'Central Station Departure Point',
        participants: `${b.total_participants} Travelers`,
        totalJpy: Number(b.total_base_amount || 0),
        status: b.status === 'confirmed' ? 'Confirmed' : b.status === 'hold_pending_payment' ? 'Pending Payment' : b.status,
        imageUrl: destination?.hero_image_url || 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80',
      };
    });

    return NextResponse.json({ bookings: mapped });
  } catch (err: any) {
    console.error('Error in user bookings endpoint:', err);
    return NextResponse.json({ bookings: [] });
  }
}
