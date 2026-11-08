import { createClient } from '@/lib/supabase/client';
import { ALL_TOURS, MockTour, TourOptionItem } from '@/data/mockTours';
import { POPULAR_DESTINATIONS, MockDestination } from '@/data/mockDestinations';

/**
 * Maps a raw Supabase Tour row (joined with destination, category, options, pricing tiers)
 * to the standardized MockTour frontend interface.
 */
export function mapDbTourToMockTour(dbTour: any): MockTour {
  // Find matching static fallback for curated gallery/itinerary details if needed
  const staticFallback = ALL_TOURS.find((t) => t.slug === dbTour.slug) || ALL_TOURS[0];

  // Calculate base price from options/pricing tiers
  let adultPriceJpy = 14500;
  const dbOptions: TourOptionItem[] = [];

  if (Array.isArray(dbTour.options) && dbTour.options.length > 0) {
    dbTour.options.forEach((opt: any) => {
      let optionPrice = 14500;
      if (Array.isArray(opt.pricing_tiers)) {
        const adultTier = opt.pricing_tiers.find((pt: any) => pt.tier_type === 'adult');
        if (adultTier && adultTier.price_in_base_currency) {
          optionPrice = Number(adultTier.price_in_base_currency);
        }
      }
      dbOptions.push({
        id: opt.id,
        title: opt.title,
        departureTime: opt.departure_time_jst ? opt.departure_time_jst.substring(0, 5) : '08:00',
        description: opt.description || '',
        priceJpy: optionPrice,
      });
    });

    if (dbOptions.length > 0) {
      adultPriceJpy = dbOptions[0].priceJpy;
    }
  } else {
    dbOptions.push(...staticFallback.options);
    adultPriceJpy = staticFallback.priceJpy;
  }

  const meetingPoint = dbTour.meeting_point_details || staticFallback.meetingPoint;

  return {
    id: dbTour.id || staticFallback.id,
    slug: dbTour.slug || staticFallback.slug,
    title: dbTour.title || staticFallback.title,
    destination: dbTour.destination?.name || staticFallback.destination,
    destinationSlug: (dbTour.destination?.slug as any) || staticFallback.destinationSlug,
    category: (dbTour.category?.name as any) || staticFallback.category,
    duration: `${dbTour.duration_hours || 10} hours`,
    durationHours: Number(dbTour.duration_hours) || staticFallback.durationHours,
    departureLocation: meetingPoint?.title || staticFallback.departureLocation,
    rating: Number(dbTour.rating_average) || staticFallback.rating,
    reviewCount: Number(dbTour.review_count) || staticFallback.reviewCount,
    priceJpy: adultPriceJpy,
    priceUsd: Math.round(adultPriceJpy * 0.00655),
    pricePkr: Math.round(adultPriceJpy * 1.82),
    imageUrl: `/images/destinations/${(dbTour.destination?.slug as any) || staticFallback.destinationSlug}.jpg`,
    galleryImages: staticFallback.galleryImages,
    badge: staticFallback.badge,
    isBestseller: staticFallback.isBestseller,
    features: staticFallback.features,
    shortDescription: dbTour.short_summary || staticFallback.shortDescription,
    fullDescription: dbTour.full_description || staticFallback.fullDescription,
    highlights: Array.isArray(dbTour.highlights) && dbTour.highlights.length > 0 ? dbTour.highlights : staticFallback.highlights,
    itinerary: staticFallback.itinerary,
    inclusions: Array.isArray(dbTour.inclusions) && dbTour.inclusions.length > 0 ? dbTour.inclusions : staticFallback.inclusions,
    exclusions: Array.isArray(dbTour.exclusions) && dbTour.exclusions.length > 0 ? dbTour.exclusions : staticFallback.exclusions,
    meetingPoint: {
      title: meetingPoint?.title || staticFallback.meetingPoint.title,
      address: meetingPoint?.address || staticFallback.meetingPoint.address,
      instructions: meetingPoint?.instructions || staticFallback.meetingPoint.instructions,
      mapUrl: meetingPoint?.google_maps_url || staticFallback.meetingPoint.mapUrl,
      coordinates: {
        lat: meetingPoint?.latitude || staticFallback.meetingPoint.coordinates.lat,
        lng: meetingPoint?.longitude || staticFallback.meetingPoint.coordinates.lng,
      },
    },
    importantInfo: Array.isArray(dbTour.important_information) && dbTour.important_information.length > 0 
      ? dbTour.important_information 
      : staticFallback.importantInfo,
    cancellationPolicy: dbTour.cancellation_policy || staticFallback.cancellationPolicy,
    options: dbOptions.length > 0 ? dbOptions : staticFallback.options,
  };
}

/**
 * Fetches all active tours from Supabase with full relational joins.
 * Seamlessly falls back to static seed data if Supabase is offline.
 */
export async function getToursFromDatabase(): Promise<MockTour[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('tours')
      .select(`
        *,
        destination:destinations(*),
        category:categories(*),
        options:tour_options(
          *,
          pricing_tiers:tour_pricing_tiers(*)
        )
      `)
      .eq('is_active', true)
      .order('rating_average', { ascending: false });

    if (error || !data || data.length === 0) {
      if (error) console.warn('Supabase tours query note:', error.message);
      return ALL_TOURS;
    }

    return data.map(mapDbTourToMockTour);
  } catch (err: any) {
    console.warn('Fallback to static tours due to:', err?.message);
    return ALL_TOURS;
  }
}

/**
 * Fetches a single tour by slug from Supabase.
 */
export async function getTourBySlugFromDatabase(slug: string): Promise<MockTour | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('tours')
      .select(`
        *,
        destination:destinations(*),
        category:categories(*),
        options:tour_options(
          *,
          pricing_tiers:tour_pricing_tiers(*)
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      const fallback = ALL_TOURS.find((t) => t.slug === slug);
      return fallback || null;
    }

    return mapDbTourToMockTour(data);
  } catch (err: any) {
    const fallback = ALL_TOURS.find((t) => t.slug === slug);
    return fallback || null;
  }
}

/**
 * Fetches all destinations from Supabase.
 */
export async function getDestinationsFromDatabase(): Promise<MockDestination[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('destinations')
      .select('*')
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return POPULAR_DESTINATIONS;
    }

    return data.map((d: any) => {
      const match = POPULAR_DESTINATIONS.find((pd) => pd.slug === d.slug);
      return {
        id: d.id,
        name: d.name,
        slug: d.slug,
        region: d.region,
        imageUrl: `/images/destinations/${d.slug}.jpg`,
        tourCount: match?.tourCount || 2,
        isPopular: Boolean(d.is_featured),
        description: d.description || match?.description || '',
      };
    });
  } catch (err) {
    return POPULAR_DESTINATIONS;
  }
}

/**
 * Fetches live exchange rates from Supabase.
 */
export async function getExchangeRatesFromDatabase(): Promise<Record<string, number> | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('target_currency, rate');

    if (error || !data || data.length === 0) {
      return null;
    }

    const rates: Record<string, number> = {};
    data.forEach((r: any) => {
      rates[r.target_currency] = Number(r.rate);
    });
    return rates;
  } catch {
    return null;
  }
}
