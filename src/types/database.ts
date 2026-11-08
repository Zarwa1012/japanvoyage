export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BookingStatus =
  | 'draft'
  | 'hold_pending_payment'
  | 'confirmed'
  | 'cancelled_by_customer'
  | 'cancelled_by_operator'
  | 'refunded'
  | 'completed';

export type PaymentStatus =
  | 'initiated'
  | 'processing'
  | 'pending'
  | 'pending_verification'
  | 'paid'
  | 'captured'
  | 'failed'
  | 'rejected'
  | 'refunded'
  | 'partially_refunded';

export type PaymentGatewayProvider =
  | 'easypaisa'
  | 'jazzcash'
  | 'raast'
  | 'card'
  | 'manual_bank'
  | 'stripe';

export type ParticipantTier = 'adult' | 'child' | 'infant';

export interface MeetingPointDetails {
  title: string;
  address: string;
  google_maps_url: string;
  latitude: number;
  longitude: number;
  instructions: string;
  pickup_time_offset_minutes?: number;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone_country_code: string | null;
  phone_national_number: string | null;
  nationality_code: string | null;
  preferred_currency: string;
  role: 'customer' | 'admin' | 'tour_operator';
  created_at: string;
  updated_at: string;
}

export interface Destination {
  id: string;
  slug: string;
  name: string;
  region: string;
  country_code: string;
  description: string | null;
  hero_image_url: string | null;
  is_featured: boolean;
  display_order: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon_name: string | null;
  description: string | null;
}

export interface Tour {
  id: string;
  destination_id: string;
  category_id: string | null;
  slug: string;
  title: string;
  short_summary: string;
  full_description: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  important_information: string[];
  cancellation_policy: string;
  duration_hours: number;
  meeting_point_details: MeetingPointDetails;
  languages_supported: string[];
  base_currency: string; // 'JPY'
  is_active: boolean;
  rating_average: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  // Joined relations
  destination?: Destination;
  category?: Category;
  options?: TourOption[];
}

export interface TourOption {
  id: string;
  tour_id: string;
  title: string;
  description: string | null;
  departure_time_jst: string; // '08:00:00'
  max_capacity_per_departure: number;
  min_capacity_per_departure: number;
  booking_cutoff_hours: number;
  is_active: boolean;
  pricing_tiers?: TourPricingTier[];
}

export interface TourPricingTier {
  id: string;
  tour_option_id: string;
  tier_type: ParticipantTier;
  min_age: number;
  max_age: number | null;
  price_in_base_currency: number; // In JPY
}

export interface TourSchedule {
  id: string;
  tour_option_id: string;
  tour_date: string; // YYYY-MM-DD
  start_time_jst: string; // HH:mm:ss
  max_capacity: number;
  booked_capacity: number;
  held_capacity: number;
  is_blocked: boolean;
  created_at: string;
  tour_option?: TourOption;
}

export interface Booking {
  id: string;
  booking_reference: string;
  guest_access_token: string;
  user_id: string | null;
  tour_schedule_id: string;
  lead_traveler_name: string;
  lead_traveler_email: string;
  lead_traveler_phone: string;
  emergency_contact: string | null;
  total_participants: number;
  base_currency: string; // JPY
  total_base_amount: number;
  charged_currency: string; // PKR
  charged_amount: number;
  exchange_rate_applied: number;
  status: BookingStatus;
  payment_method?: PaymentGatewayProvider | string | null;
  hold_expires_at: string | null;
  special_requirements: string | null;
  voucher_pdf_url: string | null;
  voucher_qr_code: string | null;
  created_at: string;
  updated_at: string;
  participants?: BookingParticipant[];
  tour_schedule?: TourSchedule;
}

export interface BookingParticipant {
  id: string;
  booking_id: string;
  tier_type: ParticipantTier;
  full_name: string;
  passport_number: string | null;
  nationality: string | null;
}

export interface Payment {
  id: string;
  booking_id: string;
  gateway_provider: PaymentGatewayProvider | string;
  gateway_tracker_token?: string | null;
  gateway_transaction_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  sender_name?: string | null;
  sender_mobile?: string | null;
  sender_account?: string | null;
  proof_image_url?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  admin_notes?: string | null;
  rejection_reason?: string | null;
  raw_payload?: Json | null;
  created_at: string;
  updated_at: string;
  booking?: Booking;
}

export interface PaymentWebhookLog {
  id: string;
  gateway_provider: string;
  event_id: string;
  event_type: string;
  payload: Json;
  processed_at: string;
  is_successful: boolean;
  error_message: string | null;
}

export interface ExchangeRate {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  updated_at: string;
}

export interface Review {
  id: string;
  tour_id: string;
  booking_id: string;
  user_id: string | null;
  rating: number;
  traveler_type: 'solo' | 'couple' | 'family' | 'friends' | 'business' | null;
  title: string | null;
  comment: string;
  is_verified_booking: boolean;
  created_at: string;
}
