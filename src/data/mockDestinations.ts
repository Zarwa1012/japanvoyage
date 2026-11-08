export interface MockDestination {
  id: string;
  name: string;
  slug: string;
  region: string;
  tourCount: number;
  imageUrl: string;
  description: string;
  isPopular?: boolean;
}

export const POPULAR_DESTINATIONS: MockDestination[] = [
  {
    id: 'nikko',
    name: 'Nikko & Lake Chuzenji',
    slug: 'nikko',
    region: 'Tochigi Prefecture (Kanto)',
    tourCount: 14,
    imageUrl: '/images/destinations/nikko.jpg',
    description: 'Ancient cedar forests, ornate Tokugawa shrines, miniature world landmarks & misty alpine waterfalls.',
    isPopular: true,
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    slug: 'tokyo',
    region: 'Kanto',
    tourCount: 52,
    imageUrl: '/images/destinations/tokyo.jpg',
    description: 'Electric neon streets, Senso-ji ancient temple, Skytree panoramas & Michelin-starred izakayas.',
    isPopular: true,
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    slug: 'kyoto',
    region: 'Kansai',
    tourCount: 38,
    imageUrl: '/images/destinations/kyoto.jpg',
    description: 'The cultural soul of Japan featuring 10,000 crimson Torii gates, Zen gardens & Geisha alleys.',
    isPopular: true,
  },
  {
    id: 'mt-fuji',
    name: 'Mt. Fuji & Hakone',
    slug: 'mt-fuji',
    region: 'Shizuoka & Yamanashi',
    tourCount: 22,
    imageUrl: '/images/destinations/mt-fuji.jpg',
    description: 'Iconic sacred volcanic peaks, Lake Ashi pirate ships & panoramic Komagatake ropeway.',
    isPopular: true,
  },
  {
    id: 'osaka',
    name: 'Osaka',
    slug: 'osaka',
    region: 'Kansai',
    tourCount: 29,
    imageUrl: '/images/destinations/osaka.jpg',
    description: 'Japan’s street food capital, vibrant Dotonbori neon canal & majestic Osaka Samurai Castle.',
    isPopular: true,
  },
  {
    id: 'hiroshima',
    name: 'Hiroshima & Miyajima',
    slug: 'hiroshima',
    region: 'Chugoku',
    tourCount: 16,
    imageUrl: '/images/destinations/hiroshima.jpg',
    description: 'Historic Peace Memorial Park and the world-renowned floating Itsukushima Torii gate.',
    isPopular: false,
  }
];
