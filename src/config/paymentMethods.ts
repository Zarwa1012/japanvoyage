export interface PakistaniPaymentAccount {
  id: 'easypaisa' | 'jazzcash' | 'raast' | 'card';
  name: string;
  tagline: string;
  badge: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
  bankName?: string;
  color: string;
  lightBg: string;
  borderColor: string;
  textColor: string;
  isEnabled: boolean;
  isComingSoon?: boolean;
  instructions: string[];
}

export const PAKISTANI_PAYMENT_METHODS: Record<string, PakistaniPaymentAccount> = {
  easypaisa: {
    id: 'easypaisa',
    name: 'Easypaisa',
    tagline: 'Instant Mobile Wallet Transfer',
    badge: 'Popular',
    accountTitle: process.env.NEXT_PUBLIC_EASYPAISA_TITLE || 'Zarwa Aslam',
    accountNumber: process.env.NEXT_PUBLIC_EASYPAISA_NUMBER || '0324-6465916',
    color: '#00A859',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-700',
    isEnabled: true,
    instructions: [
      'Open your Easypaisa app on your mobile phone.',
      'Tap on "Send Money" and select "Easypaisa Account" or "Mobile Account".',
      'Enter the Account Number: 0324-6465916.',
      'Confirm the Account Title shows: "Zarwa Aslam".',
      'Enter the exact booking amount displayed below in PKR.',
      'Verify the recipient details and tap "Send Now".',
      'Copy the 11-digit Transaction ID (TRX ID) from your SMS or app receipt.',
      'Take a screenshot of the payment receipt and upload it below.',
    ],
  },
  jazzcash: {
    id: 'jazzcash',
    name: 'JazzCash',
    tagline: 'Fast Mobile Wallet & App Transfer',
    badge: 'Verified',
    accountTitle: process.env.NEXT_PUBLIC_JAZZCASH_TITLE || 'Zarwa Aslam',
    accountNumber: process.env.NEXT_PUBLIC_JAZZCASH_NUMBER || '0324-6465916',
    color: '#D81E05',
    lightBg: 'bg-red-50',
    borderColor: 'border-red-500',
    textColor: 'text-red-700',
    isEnabled: true,
    instructions: [
      'Open your JazzCash app or dial *786# on your mobile phone.',
      'Select "Send Money" and choose "To JazzCash Account" or "Mobile Account".',
      'Enter the Account Number: 0324-6465916.',
      'Confirm the Account Title shows: "Zarwa Aslam".',
      'Enter the exact booking amount displayed below in PKR.',
      'Confirm the transaction with your 4-digit MPIN.',
      'Copy the Transaction ID (TID) from the SMS or app receipt.',
      'Upload the payment screenshot/receipt below for verification.',
    ],
  },
  raast: {
    id: 'raast',
    name: 'Raast / Meezan Bank Instant Transfer',
    tagline: 'Meezan Bank & SBP Raast Instant Transfer (Zero Fees)',
    badge: 'Zero Fees',
    accountTitle: process.env.NEXT_PUBLIC_RAAST_TITLE || 'Zarwa Aslam',
    accountNumber: process.env.NEXT_PUBLIC_RAAST_ID || '0324-6465916',
    iban: process.env.NEXT_PUBLIC_RAAST_IBAN || '26940112845883',
    bankName: 'Meezan Bank Limited / SBP Raast',
    color: '#0054A6',
    lightBg: 'bg-sky-50',
    borderColor: 'border-sky-500',
    textColor: 'text-sky-700',
    isEnabled: true,
    instructions: [
      'Open ANY Pakistani Bank App (Meezan, HBL, Alfalah, UBL, Nayapay, Sadapay, etc.).',
      'Select "Raast Transfer" or "Bank Transfer" (Meezan Bank Limited).',
      'Enter Raast ID: 0324-6465916 OR Meezan Account / IBAN: 26940112845883.',
      'Verify the Account Title shows: "Zarwa Aslam".',
      'Enter the exact PKR booking amount and complete the zero-fee transfer.',
      'Copy the Reference / RRN number from your bank confirmation receipt.',
      'Upload the transfer receipt screenshot / PDF below for quick verification.',
    ],
  },
  card: {
    id: 'card',
    name: 'Credit / Debit Card',
    tagline: 'Visa, Mastercard, UnionPay',
    badge: 'Coming Soon',
    accountTitle: 'Card Processing Gateway',
    accountNumber: '•••• •••• •••• ••••',
    color: '#64748B',
    lightBg: 'bg-slate-50',
    borderColor: 'border-slate-300',
    textColor: 'text-slate-600',
    isEnabled: false,
    isComingSoon: true,
    instructions: [
      'International Credit / Debit card payments are coming soon.',
      'Please select Easypaisa, JazzCash, or Raast to complete your booking.',
    ],
  },
};
