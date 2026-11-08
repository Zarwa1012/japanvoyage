-- ==============================================================================
-- Seed Data: Complete Japan Tourism Platform (JapanVoyage)
-- Includes:
-- 1. Multi-Currency Exchange Rates (Base: JPY)
-- 2. All 6 Official Destinations (Nikko, Tokyo, Kyoto, Mt. Fuji, Osaka, Hiroshima)
-- 3. All 4 Tourism Categories (Day Trips, Cultural, Food, Nature & Adventure)
-- 4. All 12 Full Tour Catalog Offerings (Summaries, Highlights, Inclusions, Meeting Points)
-- 5. Complete Tour Options (Coach, VIP, Shinkansen, Walking)
-- 6. Pricing Tiers (Adult, Child, Infant)
-- 7. Automated Tour Schedules for the Next 30 Days (Upcoming Departures)
-- 8. Authentic Verified Traveler Reviews
-- 9. Administrator Account Bootstrap Instructions
-- ==============================================================================

-- 1. Seed Multi-Currency Exchange Rates (Master Base: JPY)
INSERT INTO public.exchange_rates (base_currency, target_currency, rate) VALUES
('JPY', 'JPY', 1.000000),
('JPY', 'USD', 0.006550), -- 1 JPY ≈ 0.00655 USD (~152 JPY/USD)
('JPY', 'EUR', 0.006120), -- 1 JPY ≈ 0.00612 EUR (~163 JPY/EUR)
('JPY', 'GBP', 0.005150), -- 1 JPY ≈ 0.00515 GBP (~194 JPY/GBP)
('JPY', 'AED', 0.024050), -- 1 JPY ≈ 0.02405 AED (~41.5 JPY/AED)
('JPY', 'PKR', 1.820000)  -- 1 JPY ≈ 1.82 PKR (14,500 JPY ≈ ~26,390 PKR)
ON CONFLICT (base_currency, target_currency) DO UPDATE SET rate = EXCLUDED.rate, updated_at = NOW();

-- 2. Seed All 6 Destinations
INSERT INTO public.destinations (id, slug, name, region, country_code, description, hero_image_url, is_featured, display_order)
VALUES
(
    'a1b2c3d4-0001-4000-8000-000000000001',
    'nikko',
    'Nikko & Lake Chuzenji',
    'Tochigi Prefecture (Kanto)',
    'JP',
    'Ancient cedar forests, ornate Tokugawa shrines, miniature world landmarks & misty alpine waterfalls.',
    'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=800&q=80',
    TRUE,
    1
),
(
    'a1b2c3d4-0001-4000-8000-000000000002',
    'tokyo',
    'Tokyo',
    'Kanto',
    'JP',
    'Electric neon streets, Senso-ji ancient temple, Skytree panoramas & Michelin-starred izakayas.',
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    TRUE,
    2
),
(
    'a1b2c3d4-0001-4000-8000-000000000003',
    'kyoto',
    'Kyoto',
    'Kansai',
    'JP',
    'The cultural soul of Japan featuring 10,000 crimson Torii gates, Zen gardens & Geisha alleys.',
    'https://images.unsplash.com/photo-1478436127897-769e00d2c715?auto=format&fit=crop&w=800&q=80',
    TRUE,
    3
),
(
    'a1b2c3d4-0001-4000-8000-000000000004',
    'mt-fuji',
    'Mt. Fuji & Hakone',
    'Shizuoka & Yamanashi',
    'JP',
    'Iconic sacred volcanic peaks, Lake Ashi pirate ships & panoramic Komagatake ropeway.',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    TRUE,
    4
),
(
    'a1b2c3d4-0001-4000-8000-000000000005',
    'osaka',
    'Osaka',
    'Kansai',
    'JP',
    'Japan’s street food capital, vibrant Dotonbori neon canal & majestic Osaka Samurai Castle.',
    'https://images.unsplash.com/photo-1590559899731-a3f07b749759?auto=format&fit=crop&w=800&q=80',
    TRUE,
    5
),
(
    'a1b2c3d4-0001-4000-8000-000000000006',
    'hiroshima',
    'Hiroshima & Miyajima',
    'Chugoku',
    'JP',
    'Historic Peace Memorial Park and the world-renowned floating Itsukushima Torii gate.',
    'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=800&q=80',
    FALSE,
    6
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    region = EXCLUDED.region,
    description = EXCLUDED.description,
    hero_image_url = EXCLUDED.hero_image_url,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

-- 3. Seed All 4 Categories
INSERT INTO public.categories (id, slug, name, icon_name, description)
VALUES
(
    'b1b2c3d4-0002-4000-8000-000000000001',
    'day-trips',
    'Day Trips & Excursions',
    'Compass',
    'Full-day and multi-hour guided excursions exploring Japan iconic sights and scenic landmarks with seamless transport.'
),
(
    'b1b2c3d4-0002-4000-8000-000000000002',
    'cultural-tours',
    'Cultural & Heritage Tours',
    'Landmark',
    'Immersive historical journeys through ancient shrines, sacred temples, samurai castles, and geisha districts.'
),
(
    'b1b2c3d4-0002-4000-8000-000000000003',
    'food-tours',
    'Food & Culinary Walking Tours',
    'UtensilsCrossed',
    'Authentic local gastronomy tours exploring hidden izakayas, bustling street markets, ramen alleys, and sake tastings.'
),
(
    'b1b2c3d4-0002-4000-8000-000000000004',
    'nature-adventure',
    'Nature & Adventure Experiences',
    'MountainSnow',
    'Thrilling outdoor excursions, alpine marshland hikes, volcanic peak ropeways, snow sledding, and island cycling.'
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    icon_name = EXCLUDED.icon_name,
    description = EXCLUDED.description;

-- 4. Seed All 12 Tours
INSERT INTO public.tours (
    id,
    destination_id,
    category_id,
    slug,
    title,
    short_summary,
    full_description,
    highlights,
    inclusions,
    exclusions,
    important_information,
    cancellation_policy,
    duration_hours,
    meeting_point_details,
    languages_supported,
    base_currency,
    is_active,
    rating_average,
    review_count
) VALUES
(
    'c1b2c3d4-0003-4000-8000-000000000001',
    'a1b2c3d4-0001-4000-8000-000000000001',
    'b1b2c3d4-0002-4000-8000-000000000001',
    'nikko-day-trip-with-tobu-world-square',
    'From Tokyo/Yokohama: Nikko Day Trip with Tobu World Square & Toshogu Shrine',
    'Escape Tokyo into the serene mountain grandeur of Nikko. Visit Tokugawa Ieyasu’s ornate Toshogu Shrine, explore 102 miniature architectural wonders at Tobu World Square, and witness the roaring 97-meter Kegon Falls.',
    'Embark on an unforgettable full-day excursion from Tokyo or Yokohama into Tochigi Prefecture''s alpine sanctuary. 

Your journey starts aboard a modern executive coach traveling through the sacred cedar forests of Nikko National Park. First, step into feudal Japan at UNESCO-listed Nikko Toshogu Shrine. Marvel at the intricate gold leaf carvings, the world-famous "Three Wise Monkeys" (Hear no evil, speak no evil, see no evil), and the Sleeping Cat (Nemuri-neko).

Next, arrive at the whimsical Tobu World Square, featuring 102 meticulously crafted 1:25 scale architectural replicas from 21 countries. Walk past the Sphinx, the Eiffel Tower, the Colosseum, and the Empire State Building alongside 140,000 intricately positioned miniature figurines.

Conclude your journey at sacred Lake Chuzenji and behold the thunderous Kegon Falls plunging 97 meters into an emerald gorge before a relaxing return drive to central Tokyo.',
    ARRAY['Explore the UNESCO World Heritage Nikko Toshogu Shrine with a certified English guide', 'Walk among 102 miniature world landmarks at 1:25 scale at Tobu World Square', 'Witness the majestic 97-meter drop of Kegon Falls plunging from Lake Chuzenji', 'Convenient round-trip transportation from Shinjuku Tokyo or Yokohama', 'High-fidelity English audio guide headsets for clear historical insights'],
    ARRAY['Round-trip transportation aboard an air-conditioned coach with USB ports', 'Admission ticket to Nikko Toshogu Shrine', 'Admission ticket to Tobu World Square', 'Professional English-speaking tour conductor', 'Audio guide headset in English, Japanese, and Mandarin', 'Toll fees, parking fees, and road taxes'],
    ARRAY['Lunch and beverages (ample time provided at Tobu World Square restaurants)', 'Kegon Falls lower deck elevator ticket (optional on-site ¥570 JPY)', 'Hotel pickup and drop-off'],
    ARRAY['Comfortable walking shoes are strongly recommended due to cobblestone stairs at Toshogu Shrine.', 'Please arrive at the meeting point at least 15 minutes prior to scheduled departure.', 'Infants (ages 0-3) participate free of charge but must be held on lap.', 'In the event of severe mountain snowfall or highway congestion, itinerary times may be adjusted.'],
    'Free cancellation up to 24 hours before the tour start time (JST). Full refund processed in 5-10 business days.',
    11,
    '{"title":"Shinjuku Station West Exit (Tokyo)","address":"1 Chome-7-3 Nishishinjuku, Shinjuku City, Tokyo 160-0023, Japan","google_maps_url":"https://maps.google.com/?q=35.6917,139.6974","latitude":35.6917,"longitude":139.6974,"instructions":"Assemble directly in front of the Mode Gakuen Cocoon Tower near Shinjuku Station West Exit. Look for your tour conductor holding a bright red \"JapanVoyage\" tour flag."}'::jsonb,
    ARRAY['English', 'Japanese'],
    'JPY',
    TRUE,
    4.88,
    348
),
(
    'c1b2c3d4-0003-4000-8000-000000000002',
    'a1b2c3d4-0001-4000-8000-000000000004',
    'b1b2c3d4-0002-4000-8000-000000000001',
    'mt-fuji-hakone-lake-ashi-cruise-ropeway',
    'Mt. Fuji 5th Station, Lake Ashi Sightseeing Cruise & Komagatake Ropeway',
    'Ascend to Mt. Fuji’s 5th Station above the clouds, take an iconic Hakone Pirate Ship cruise across sacred Lake Ashi, and ride the Komagatake Ropeway for breathtaking panoramic vistas.',
    'Experience the crown jewel of Japan’s natural wonders. Journey by motorcoach to the famous 5th Station of Mt. Fuji at 2,300 meters above sea level for dramatic volcanic panoramas. Continue to picturesque Hakone for a relaxing cruise across Lake Ashi and board the Hakone Komagatake Ropeway for sweeping views of Mt. Fuji and the Pacific Ocean.',
    ARRAY['Stand at 2,300m elevation on Mt. Fuji 5th Station overlooking the cloud sea', 'Cruise across scenic Lake Ashi aboard the famous Hakone Pirate Ship', 'Ride the Komagatake Ropeway for 360-degree views of Mt. Fuji and Suruga Bay', 'Comfortable round-trip transportation from central Tokyo'],
    ARRAY['Round-trip coach transportation', 'Lake Ashi cruise ticket', 'Hakone Komagatake Ropeway ticket', 'English-speaking tour guide'],
    ARRAY['Lunch', 'Personal expenses'],
    ARRAY['Warm clothing is recommended as mountain elevations can be chilly even in summer.'],
    'Free cancellation up to 24 hours before tour start time (JST).',
    10,
    '{"title":"Tokyo Station Marunouchi South Exit","address":"1 Chome Marunouchi, Chiyoda City, Tokyo 100-0005, Japan","google_maps_url":"https://maps.google.com/?q=35.6812,139.7671","latitude":35.6812,"longitude":139.7671,"instructions":"Meet outside the Marunouchi South Exit gate of Tokyo Station next to the red brick facade."}'::jsonb,
    ARRAY['English', 'Japanese'],
    'JPY',
    TRUE,
    4.84,
    1420
),
(
    'c1b2c3d4-0003-4000-8000-000000000003',
    'a1b2c3d4-0001-4000-8000-000000000003',
    'b1b2c3d4-0002-4000-8000-000000000002',
    'kyoto-fushimi-inari-kinkakuji-arashiyama-day-trip',
    'Kyoto Highlights: 1,000 Torii Fushimi Inari, Golden Pavilion & Arashiyama Bamboo Grove',
    'Witness Kyoto’s most breathtaking landmarks in one seamless day: wander through thousands of scarlet Torii gates at Fushimi Inari, marvel at the Golden Pavilion reflecting in Mirror Pond, and stroll Arashiyama Bamboo Grove.',
    'Immerse yourself in centuries of Japanese imperial history. Begin at Fushimi Inari Taisha, climbing the iconic red torii tunnel winding up Mount Inari. Journey to Kinkaku-ji (The Golden Pavilion), covered in gold leaf and resting beside a tranquil Zen reflecting pond. Conclude in Arashiyama, strolling under towering green bamboo stalks and crossing Togetsukyo Moon Bridge.',
    ARRAY['Walk through the endless scarlet Torii path at Fushimi Inari Shrine', 'Admire the shimmering gold leaf facade of Kinkaku-ji Temple', 'Listen to the rustling wind in the sacred Arashiyama Bamboo Forest', 'Cross the historic Togetsukyo Bridge with mountain river views'],
    ARRAY['All temple admission fees', 'Comfortable coach transit', 'English licensed guide', 'Matcha snack'],
    ARRAY['Lunch', 'Personal shopping'],
    ARRAY['Walking distance is approx 6km over the day; wear sturdy walking shoes.'],
    'Free cancellation up to 24 hours in advance.',
    9,
    '{"title":"Kyoto Station (Hachijo Exit)","address":"Higashishiokoji Kamadonocho, Shimogyo Ward, Kyoto 600-8215, Japan","google_maps_url":"https://maps.google.com/?q=34.9858,135.7588","latitude":34.9858,"longitude":135.7588,"instructions":"Meet in the central concourse of Hachijo West Exit near the Shinkansen gates."}'::jsonb,
    ARRAY['English', 'Japanese'],
    'JPY',
    TRUE,
    4.92,
    890
),
(
    'c1b2c3d4-0003-4000-8000-000000000004',
    'a1b2c3d4-0001-4000-8000-000000000002',
    'b1b2c3d4-0002-4000-8000-000000000003',
    'tokyo-hidden-izakaya-shinjuku-omoide-yokocho-food-tour',
    'Tokyo After Dark: Shinjuku Omoide Yokocho & Kabukicho Food & Izakaya Tour',
    'Navigate Tokyo’s neon nightlife like a local. Savor flame-grilled yakitori in vintage Omoide Yokocho (Memory Lane), explore Kabukicho entertainment district, and enjoy sake in a hidden Golden Gai drinking nook.',
    'Step away from the tourist traps and dive headfirst into Tokyo’s authentic after-hours culinary culture. Your English-speaking food specialist leads an intimate group through narrow lantern-lit alleys, ordering sizzling skewers of charcoal yakitori, handmade gyoza dumplings, craft Japanese beer, and seasonal sake at 3 distinct local venues.',
    ARRAY['Taste 8+ authentic Japanese dishes across 3 local taverns and izakayas', 'Explore the legendary post-war alleys of Omoide Yokocho', 'Learn Japanese drinking etiquette and sake pairing basics', 'Intimate small group limited to max 8 travelers'],
    ARRAY['All food tastings (dinner equivalent)', '3 drinks (beer, sake, highball, or soft drinks)', 'Local culinary guide'],
    ARRAY['Additional drinks', 'Hotel transfer'],
    ARRAY['Participants must be 20+ years old to consume alcoholic beverages in Japan.'],
    'Free cancellation up to 24 hours prior.',
    3.5,
    '{"title":"Shinjuku Station East Exit (Cross Shinjuku Vision)","address":"3 Chome-23-18 Shinjuku, Shinjuku City, Tokyo 160-0022, Japan","google_maps_url":"https://maps.google.com/?q=35.6922,139.7011","latitude":35.6922,"longitude":139.7011,"instructions":"Meet in the plaza under the giant 3D Calico Cat digital billboard."}'::jsonb,
    ARRAY['English', 'Japanese'],
    'JPY',
    TRUE,
    4.95,
    520
),
(
    'c1b2c3d4-0003-4000-8000-000000000005',
    'a1b2c3d4-0001-4000-8000-000000000006',
    'b1b2c3d4-0002-4000-8000-000000000002',
    'hiroshima-peace-memorial-miyajima-shrine-bullet-train',
    'Hiroshima Peace Memorial Park & Miyajima Floating Torii Gate from Kyoto/Osaka',
    'Ride the world-renowned Shinkansen bullet train at 300 km/h to Hiroshima. Pay respects at the sobering Peace Memorial Park & Atomic Bomb Dome, then ferry across to sacred Miyajima Island to behold the floating Torii gate.',
    'A profound and poignant historical pilgrimage. Board the sleek Sanyo Shinkansen from Osaka or Kyoto to Hiroshima. With an expert historian guide, tour the UNESCO Atomic Bomb Dome, Peace Memorial Museum, and Children’s Peace Monument. Next, take a short ferry crossing to sacred Miyajima Island, exploring the vermilion Itsukushima Shrine standing above the tidal waters.',
    ARRAY['Travel by 300 km/h high-speed Shinkansen Bullet Train with reserved seats', 'Walk through the poignant Peace Memorial Park and Atomic Bomb Dome', 'Ferry across the Seto Inland Sea to sacred Miyajima Island', 'Photograph the floating Great Torii Gate at high tide'],
    ARRAY['Round-trip Shinkansen bullet train tickets', 'Ferry ticket to Miyajima', 'Peace Museum admission', 'English guide'],
    ARRAY['Lunch', 'Personal shopping'],
    ARRAY['Passport required for bullet train ticket validation on day of travel.'],
    'Free cancellation up to 48 hours before departure.',
    12,
    '{"title":"Shin-Osaka Station (Central Shinkansen Gate)","address":"5 Chome-16-1 Nishinakajima, Yodogawa Ward, Osaka 532-0011, Japan","google_maps_url":"https://maps.google.com/?q=34.7335,135.5003","latitude":34.7335,"longitude":135.5003,"instructions":"Meet directly outside the Central Shinkansen Ticket Gate on the 3rd floor."}'::jsonb,
    ARRAY['English', 'Japanese'],
    'JPY',
    TRUE,
    4.89,
    412
),
(
    'c1b2c3d4-0003-4000-8000-000000000006',
    'a1b2c3d4-0001-4000-8000-000000000005',
    'b1b2c3d4-0002-4000-8000-000000000003',
    'osaka-dotonbori-shinsekai-street-food-hidden-bars',
    'Osaka Street Food Extravaganza: Dotonbori, Shinsekai & Kuromon Market',
    'Eat your way through "Japan’s Kitchen." Taste piping hot takoyaki, golden kushikatsu skewers, and fresh seafood in legendary Kuromon Market and under the neon Glico Running Man in Dotonbori.',
    'Discover why Osakans live by the motto "kuidaore" (eat until you drop). Follow your local culinary insider through Kuromon Ichiba market, sampling grilled scallops and melt-in-your-mouth wagyu beef. Walk to retro Shinsekai for deep-fried kushikatsu skewers, before finishing along the neon-lit Dotonbori canal.',
    ARRAY['Taste 6+ iconic Osaka culinary staples', 'Explore Kuromon Ichiba fresh seafood market', 'Discover retro 1912 Showa-era Shinsekai district', 'Photo stop at the world-famous Glico Running Man neon sign'],
    ARRAY['All street food tastings', '1 alcoholic or non-alcoholic beverage', 'English guide'],
    ARRAY['Hotel transfer', 'Extra drinks'],
    ARRAY['Vegetarian options are available upon advance request.'],
    'Free cancellation up to 24 hours prior.',
    3,
    '{"title":"Namba Station (Namba Walk Exit B12)","address":"Namba, Chuo Ward, Osaka 542-0076, Japan","google_maps_url":"https://maps.google.com/?q=34.6675,135.5013","latitude":34.6675,"longitude":135.5013,"instructions":"Meet outside Exit B12 of Namba Walk underground mall."}'::jsonb,
    ARRAY['English', 'Japanese'],
    'JPY',
    TRUE,
    4.91,
    680
),
(
    'c1b2c3d4-0003-4000-8000-000000000007',
    'a1b2c3d4-0001-4000-8000-000000000001',
    'b1b2c3d4-0002-4000-8000-000000000004',
    'nikko-lake-chuzenji-senjogahara-marshland-hiking-adventure',
    'Nikko Alpine Nature Trek: Lake Chuzenji, Ryuzu Falls & Senjogahara Marshland',
    'Hike through Nikko’s pristine high-elevation marshland. Follow elevated wooden boardwalks across Senjogahara, marvel at Ryuzu (Dragon Head) Falls, and soak in a natural volcanic sulfur hot spring.',
    'Escape deep into the untouched wilderness of Oku-Nikko. Guided by a certified mountain naturalist, hike the peaceful 6km Senjogahara Marshland trail beneath sacred volcanic peaks. Marvel at the roaring twin cascades of Ryuzu Falls, before rejuvenating your body in a traditional open-air natural onsen.',
    ARRAY['Hike across the legendary Senjogahara high marshland boardwalks', 'Admire the rushing cascades of Ryuzu Dragon Head Falls', 'Relax in a traditional sulfur outdoor onsen', 'Breathtaking alpine vistas of Mount Nantai'],
    ARRAY['Professional hiking guide', 'Local bus transit pass in Nikko', 'Onsen admission and towel'],
    ARRAY['Lunch', 'Train tickets between Tokyo and Nikko'],
    ARRAY['Trail is level and accessible; comfortable walking sneakers or hiking boots required.'],
    'Free cancellation up to 24 hours in advance.',
    8.5,
    '{"title":"Tobu-Nikko Station Entrance","address":"4-3 Matsubaracho, Nikko, Tochigi 321-1406, Japan","google_maps_url":"https://maps.google.com/?q=36.7471,139.6192","latitude":36.7471,"longitude":139.6192,"instructions":"Meet outside the main exit of Tobu-Nikko Station near the tourist information center."}'::jsonb,
    ARRAY['English', 'Japanese'],
    'JPY',
    TRUE,
    4.86,
    195
),
(
    'c1b2c3d4-0003-4000-8000-000000000008',
    'a1b2c3d4-0001-4000-8000-000000000002',
    'b1b2c3d4-0002-4000-8000-000000000001',
    'tokyo-asakusa-sensoji-skytree-sumida-river-cruise',
    'Tokyo Timeless Icons: Historic Asakusa Senso-ji, Sumida Cruise & Tokyo Skytree Entry',
    'Combine Tokyo’s oldest heritage with its ultra-modern summit. Walk past the giant red lantern of Asakusa Senso-ji Temple, cruise down the Sumida River, and ascend the Tokyo Skytree for a 350-meter panoramic view.',
    'Bridge ancient Edo and modern metropolis Tokyo. Begin at 7th-century Senso-ji Temple, inhaling incense at the Joukoro and browsing traditional snacks on Nakamise shopping street. Board the futuristic glass water bus down the Sumida River, before ascending to the 350m observation deck of the world’s tallest free-standing broadcasting tower.',
    ARRAY['Skip-the-line admission to Tokyo Skytree Tembo Deck (350m)', 'Panoramic 45-minute Sumida River cruise', 'Historical tour of Asakusa Senso-ji Temple', 'English audio guide commentary'],
    ARRAY['Tokyo Skytree 350m Deck ticket', 'Sumida River cruise ticket', 'English guide'],
    ARRAY['Lunch', 'Skytree 450m Galleria upgrade (available on-site)'],
    ARRAY['Skytree visibility is dependent on weather conditions.'],
    'Free cancellation up to 24 hours prior.',
    6,
    '{"title":"Asakusa Station (Exit 1)","address":"1 Chome-1-3 Asakusa, Taito City, Tokyo 111-0032, Japan","google_maps_url":"https://maps.google.com/?q=35.7118,139.7967","latitude":35.7118,"longitude":139.7967,"instructions":"Meet outside Exit 1 of Asakusa Station right in front of the tourist information booth."}'::jsonb,
    ARRAY['English', 'Japanese'],
    'JPY',
    TRUE,
    4.82,
    740
),
(
    'c1b2c3d4-0003-4000-8000-000000000009',
    'a1b2c3d4-0001-4000-8000-000000000003',
    'b1b2c3d4-0002-4000-8000-000000000002',
    'kyoto-gion-pontocho-geisha-traditions-night-walking-tour',
    'Kyoto Gion at Dusk: Lantern-Lit Pontocho Alley & Geisha Heritage Walking Tour',
    'Uncover the secrets of Kyoto’s historic entertainment districts. Stroll the narrow flagstone pathways of Pontocho and Shirakawa Canal, learning the rigorous traditions of Geisha and Maiko entertainers.',
    'As the paper lanterns glow at twilight, enter the secluded world of Kyoto’s Geisha culture. Led by a licensed local historian, walk past preserved 17th-century wooden machiya merchant houses along Shirakawa Canal and Pontocho alley. Learn about the training of Geiko and Maiko, and visit Yasaka Shrine illuminated by hundreds of offering lanterns.',
    ARRAY['Stroll through the atmospheric preservation district of Gion Shirakawa', 'Explore narrow Pontocho alley overlooking the Kamogawa River', 'Learn authentic Geisha customs and etiquette from an expert', 'Visit Yasaka Shrine glowing with evening paper lanterns'],
    ARRAY['Certified local cultural guide', 'Intimate small group tour (max 10 guests)'],
    ARRAY['Food and drinks', 'Inside entry to private ochaya teahouses'],
    ARRAY['Please respect Kyoto city regulations regarding photography in private alleys.'],
    'Free cancellation up to 24 hours prior.',
    2.5,
    '{"title":"Gion-Shijo Station (Exit 6 Minamiza)","address":"Higashiyama Ward, Kyoto 605-0075, Japan","google_maps_url":"https://maps.google.com/?q=35.0037,135.7725","latitude":35.0037,"longitude":135.7725,"instructions":"Meet on the sidewalk outside Exit 6 of Gion-Shijo Station in front of the Minamiza Kabuki Theatre."}'::jsonb,
    ARRAY['English', 'Japanese'],
    'JPY',
    TRUE,
    4.96,
    920
),
(
    'c1b2c3d4-0003-4000-8000-000000000010',
    'a1b2c3d4-0001-4000-8000-000000000004',
    'b1b2c3d4-0002-4000-8000-000000000004',
    'mt-fuji-yeti-snow-resort-lake-kawaguchi-sightseeing',
    'Mt. Fuji Winter Adventure: Yeti Snow Resort Sledding & Lake Kawaguchi Oishi Park',
    'Enjoy snowy thrills on the southern slopes of Mount Fuji. Sled and play in the snow at Snowtown Yeti, followed by lakeside photos of Mount Fuji at Lake Kawaguchi Oishi Park.',
    'Celebrate Japanese winter beneath the grandeur of Mount Fuji. Depart Tokyo in a comfortable coach directly to Snowtown Yeti, located at Mt. Fuji’s 2nd Station. Enjoy 2 hours of sledding and snow play with equipment included. Continue to Lake Kawaguchi Oishi Park for iconic postcard photos of Mt. Fuji reflected on the calm water surface.',
    ARRAY['2 hours of snow sledding fun at Mt. Fuji Snowtown Yeti', 'Sled rental and snow area admission included', 'Postcard photo stops at Lake Kawaguchi Oishi Park', 'Warm lunch options with traditional Yamanashi Hoto noodles'],
    ARRAY['Round-trip coach transportation', 'Snowtown Yeti admission and sled rental', 'English-speaking coordinator'],
    ARRAY['Lunch', 'Ski clothing rental (available on-site)'],
    ARRAY['Warm waterproof gloves and winter boots recommended.'],
    'Free cancellation up to 24 hours prior.',
    9.5,
    '{"title":"Shinjuku Center Building","address":"1 Chome-25-1 Nishishinjuku, Shinjuku City, Tokyo 163-0690, Japan","google_maps_url":"https://maps.google.com/?q=35.6918,139.6953","latitude":35.6918,"longitude":139.6953,"instructions":"Meet on the ground floor lobby of Shinjuku Center Building."}'::jsonb,
    ARRAY['English', 'Japanese'],
    'JPY',
    TRUE,
    4.79,
    310
),
(
    'c1b2c3d4-0003-4000-8000-000000000011',
    'a1b2c3d4-0001-4000-8000-000000000005',
    'b1b2c3d4-0002-4000-8000-000000000002',
    'osaka-castle-samurai-history-and-aqua-liner-boat-cruise',
    'Osaka Samurai Grandeur: Osaka Castle Keep Museum & Aqua-Liner River Cruise',
    'Explore the monumental castle of warlord Toyotomi Hideyoshi. Climb to the 8th floor observation deck for grand city views, inspect authentic samurai armor, and cruise the Okawa River on the Aqua-Liner.',
    'Discover the epic feudal battles that unified Japan. Tour the towering stone moats and Ote-mon Gate of Osaka Castle with a historian guide. Explore museum exhibits detailing the Siege of Osaka and don samurai helmet replicas. Conclude with a peaceful 60-minute cruise on the glass-roofed Aqua-Liner down the Okawa River.',
    ARRAY['Fast-track ticket to Osaka Castle Main Keep', 'Panoramic 8th floor castle observation deck', '60-minute Aqua-Liner water bus cruise on Okawa River', 'Deep dive into samurai history and warlord strategy'],
    ARRAY['Osaka Castle Keep admission', 'Aqua-Liner cruise ticket', 'English licensed guide'],
    ARRAY['Lunch', 'Personal expenses'],
    ARRAY['Elevators are available inside the castle keep for accessibility.'],
    'Free cancellation up to 24 hours prior.',
    4,
    '{"title":"JR Osakajokoen Station","address":"Osakajo, Chuo Ward, Osaka 540-0002, Japan","google_maps_url":"https://maps.google.com/?q=34.6897,135.5342","latitude":34.6897,"longitude":135.5342,"instructions":"Meet outside the ticket gates of JR Osakajokoen Station."}'::jsonb,
    ARRAY['English', 'Japanese'],
    'JPY',
    TRUE,
    4.78,
    430
),
(
    'c1b2c3d4-0003-4000-8000-000000000012',
    'a1b2c3d4-0001-4000-8000-000000000006',
    'b1b2c3d4-0002-4000-8000-000000000004',
    'shimanami-kaido-inland-sea-island-bridge-biking-tour',
    'Seto Inland Sea Cycling Day Trip: Shimanami Kaido Bridges & Citrus Orchards',
    'Cycle along the world-famous Shimanami Kaido sea route. Pedal across soaring suspension bridges connecting islands in the Seto Inland Sea, through fragrant lemon groves and quiet fishing hamlets.',
    'Rated as one of the world’s top cycling routes. Equipped with modern electric assist bicycles, pedal across majestic bridges spanning emerald island waters. Visit local citrus orchards on Ikuchijima Island, taste artisan lemon gelato, and stop at quiet Zen temples with panoramic ocean backdrops.',
    ARRAY['Cross suspension bridges elevated above the blue Seto Inland Sea', 'Effortless riding with modern e-bikes', 'Taste local Setouchi lemon ice cream and citrus specialties', 'Support vehicle follows the route for peace of mind'],
    ARRAY['Electric assist bicycle and helmet rental', 'Island ferry tickets', 'English cycling guide', 'Support van service'],
    ARRAY['Lunch', 'Train transit to Onomichi'],
    ARRAY['Participants should be comfortable riding a bicycle for approx 30km with e-assist.'],
    'Free cancellation up to 24 hours prior.',
    7,
    '{"title":"JR Onomichi Station Green Window","address":"1-1 Higashigoshocho, Onomichi, Hiroshima 722-0036, Japan","google_maps_url":"https://maps.google.com/?q=34.4055,133.1931","latitude":34.4055,"longitude":133.1931,"instructions":"Meet outside Onomichi Station South Exit next to the bicycle terminal."}'::jsonb,
    ARRAY['English', 'Japanese'],
    'JPY',
    TRUE,
    4.93,
    260
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    short_summary = EXCLUDED.short_summary,
    full_description = EXCLUDED.full_description,
    highlights = EXCLUDED.highlights,
    inclusions = EXCLUDED.inclusions,
    exclusions = EXCLUDED.exclusions,
    important_information = EXCLUDED.important_information,
    cancellation_policy = EXCLUDED.cancellation_policy,
    duration_hours = EXCLUDED.duration_hours,
    meeting_point_details = EXCLUDED.meeting_point_details,
    rating_average = EXCLUDED.rating_average,
    review_count = EXCLUDED.review_count,
    updated_at = NOW();

-- 5. Seed Tour Options & Pricing Tiers

-- Tour: nikko-day-trip-with-tobu-world-square | Option: Standard Coach Departure (Shinjuku)
INSERT INTO public.tour_options (id, tour_id, title, description, departure_time_jst, max_capacity_per_departure, min_capacity_per_departure, booking_cutoff_hours, is_active)
VALUES ('d1b2c3d4-0004-4000-8000-000000000001', 'c1b2c3d4-0003-4000-8000-000000000001', 'Standard Coach Departure (Shinjuku)', 'Standard luxury coach departure from Shinjuku West Exit.', '08:00:00'::time, 36, 1, 24, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, departure_time_jst = EXCLUDED.departure_time_jst, max_capacity_per_departure = EXCLUDED.max_capacity_per_departure;

INSERT INTO public.tour_pricing_tiers (tour_option_id, tier_type, min_age, max_age, price_in_base_currency)
VALUES
('d1b2c3d4-0004-4000-8000-000000000001', 'adult', 12, NULL, 14500.00),
('d1b2c3d4-0004-4000-8000-000000000001', 'child', 4, 11, 9860.00),
('d1b2c3d4-0004-4000-8000-000000000001', 'infant', 0, 3, 0.00)
ON CONFLICT (tour_option_id, tier_type) DO UPDATE SET price_in_base_currency = EXCLUDED.price_in_base_currency;

-- 30-Day Departure Schedules for Standard Coach Departure (Shinjuku)
INSERT INTO public.tour_schedules (tour_option_id, tour_date, start_time_jst, max_capacity, booked_capacity, held_capacity)
SELECT 
    'd1b2c3d4-0004-4000-8000-000000000001',
    (CURRENT_DATE + (i || ' days')::interval)::date,
    '08:00:00'::time,
    36,
    (FLOOR(RANDOM() * 8))::int,
    0
FROM generate_series(1, 30) AS i
ON CONFLICT (tour_option_id, tour_date, start_time_jst) DO NOTHING;

-- Tour: nikko-day-trip-with-tobu-world-square | Option: Yokohama Departure Option
INSERT INTO public.tour_options (id, tour_id, title, description, departure_time_jst, max_capacity_per_departure, min_capacity_per_departure, booking_cutoff_hours, is_active)
VALUES ('d1b2c3d4-0004-4000-8000-000000000002', 'c1b2c3d4-0003-4000-8000-000000000001', 'Yokohama Departure Option', 'Direct pickup from Yokohama Station Sky Building Bus Terminal.', '09:00:00'::time, 36, 1, 24, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, departure_time_jst = EXCLUDED.departure_time_jst, max_capacity_per_departure = EXCLUDED.max_capacity_per_departure;

INSERT INTO public.tour_pricing_tiers (tour_option_id, tier_type, min_age, max_age, price_in_base_currency)
VALUES
('d1b2c3d4-0004-4000-8000-000000000002', 'adult', 12, NULL, 15500.00),
('d1b2c3d4-0004-4000-8000-000000000002', 'child', 4, 11, 10540.00),
('d1b2c3d4-0004-4000-8000-000000000002', 'infant', 0, 3, 0.00)
ON CONFLICT (tour_option_id, tier_type) DO UPDATE SET price_in_base_currency = EXCLUDED.price_in_base_currency;

-- 30-Day Departure Schedules for Yokohama Departure Option
INSERT INTO public.tour_schedules (tour_option_id, tour_date, start_time_jst, max_capacity, booked_capacity, held_capacity)
SELECT 
    'd1b2c3d4-0004-4000-8000-000000000002',
    (CURRENT_DATE + (i || ' days')::interval)::date,
    '09:00:00'::time,
    36,
    (FLOOR(RANDOM() * 8))::int,
    0
FROM generate_series(1, 30) AS i
ON CONFLICT (tour_option_id, tour_date, start_time_jst) DO NOTHING;

-- Tour: nikko-day-trip-with-tobu-world-square | Option: VIP Small Group (Max 12 Guests)
INSERT INTO public.tour_options (id, tour_id, title, description, departure_time_jst, max_capacity_per_departure, min_capacity_per_departure, booking_cutoff_hours, is_active)
VALUES ('d1b2c3d4-0004-4000-8000-000000000003', 'c1b2c3d4-0003-4000-8000-000000000001', 'VIP Small Group (Max 12 Guests)', 'Luxury Mercedes Sprinter van with traditional Tochigi bento lunch included.', '08:30:00'::time, 12, 1, 24, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, departure_time_jst = EXCLUDED.departure_time_jst, max_capacity_per_departure = EXCLUDED.max_capacity_per_departure;

INSERT INTO public.tour_pricing_tiers (tour_option_id, tier_type, min_age, max_age, price_in_base_currency)
VALUES
('d1b2c3d4-0004-4000-8000-000000000003', 'adult', 12, NULL, 24000.00),
('d1b2c3d4-0004-4000-8000-000000000003', 'child', 4, 11, 16320.00),
('d1b2c3d4-0004-4000-8000-000000000003', 'infant', 0, 3, 0.00)
ON CONFLICT (tour_option_id, tier_type) DO UPDATE SET price_in_base_currency = EXCLUDED.price_in_base_currency;

-- 30-Day Departure Schedules for VIP Small Group (Max 12 Guests)
INSERT INTO public.tour_schedules (tour_option_id, tour_date, start_time_jst, max_capacity, booked_capacity, held_capacity)
SELECT 
    'd1b2c3d4-0004-4000-8000-000000000003',
    (CURRENT_DATE + (i || ' days')::interval)::date,
    '08:30:00'::time,
    12,
    (FLOOR(RANDOM() * 8))::int,
    0
FROM generate_series(1, 30) AS i
ON CONFLICT (tour_option_id, tour_date, start_time_jst) DO NOTHING;

-- Tour: mt-fuji-hakone-lake-ashi-cruise-ropeway | Option: Standard Coach Tour
INSERT INTO public.tour_options (id, tour_id, title, description, departure_time_jst, max_capacity_per_departure, min_capacity_per_departure, booking_cutoff_hours, is_active)
VALUES ('d1b2c3d4-0004-4000-8000-000000000004', 'c1b2c3d4-0003-4000-8000-000000000002', 'Standard Coach Tour', 'Round-trip coach from Tokyo Station.', '08:00:00'::time, 36, 1, 24, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, departure_time_jst = EXCLUDED.departure_time_jst, max_capacity_per_departure = EXCLUDED.max_capacity_per_departure;

INSERT INTO public.tour_pricing_tiers (tour_option_id, tier_type, min_age, max_age, price_in_base_currency)
VALUES
('d1b2c3d4-0004-4000-8000-000000000004', 'adult', 12, NULL, 16800.00),
('d1b2c3d4-0004-4000-8000-000000000004', 'child', 4, 11, 11424.00),
('d1b2c3d4-0004-4000-8000-000000000004', 'infant', 0, 3, 0.00)
ON CONFLICT (tour_option_id, tier_type) DO UPDATE SET price_in_base_currency = EXCLUDED.price_in_base_currency;

-- 30-Day Departure Schedules for Standard Coach Tour
INSERT INTO public.tour_schedules (tour_option_id, tour_date, start_time_jst, max_capacity, booked_capacity, held_capacity)
SELECT 
    'd1b2c3d4-0004-4000-8000-000000000004',
    (CURRENT_DATE + (i || ' days')::interval)::date,
    '08:00:00'::time,
    36,
    (FLOOR(RANDOM() * 8))::int,
    0
FROM generate_series(1, 30) AS i
ON CONFLICT (tour_option_id, tour_date, start_time_jst) DO NOTHING;

-- Tour: mt-fuji-hakone-lake-ashi-cruise-ropeway | Option: Return via Shinkansen Bullet Train
INSERT INTO public.tour_options (id, tour_id, title, description, departure_time_jst, max_capacity_per_departure, min_capacity_per_departure, booking_cutoff_hours, is_active)
VALUES ('d1b2c3d4-0004-4000-8000-000000000005', 'c1b2c3d4-0003-4000-8000-000000000002', 'Return via Shinkansen Bullet Train', 'Return from Odawara Station via Tokaido Shinkansen bullet train.', '08:00:00'::time, 36, 1, 24, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, departure_time_jst = EXCLUDED.departure_time_jst, max_capacity_per_departure = EXCLUDED.max_capacity_per_departure;

INSERT INTO public.tour_pricing_tiers (tour_option_id, tier_type, min_age, max_age, price_in_base_currency)
VALUES
('d1b2c3d4-0004-4000-8000-000000000005', 'adult', 12, NULL, 22500.00),
('d1b2c3d4-0004-4000-8000-000000000005', 'child', 4, 11, 15300.00),
('d1b2c3d4-0004-4000-8000-000000000005', 'infant', 0, 3, 0.00)
ON CONFLICT (tour_option_id, tier_type) DO UPDATE SET price_in_base_currency = EXCLUDED.price_in_base_currency;

-- 30-Day Departure Schedules for Return via Shinkansen Bullet Train
INSERT INTO public.tour_schedules (tour_option_id, tour_date, start_time_jst, max_capacity, booked_capacity, held_capacity)
SELECT 
    'd1b2c3d4-0004-4000-8000-000000000005',
    (CURRENT_DATE + (i || ' days')::interval)::date,
    '08:00:00'::time,
    36,
    (FLOOR(RANDOM() * 8))::int,
    0
FROM generate_series(1, 30) AS i
ON CONFLICT (tour_option_id, tour_date, start_time_jst) DO NOTHING;

-- Tour: kyoto-fushimi-inari-kinkakuji-arashiyama-day-trip | Option: Departs Kyoto Station
INSERT INTO public.tour_options (id, tour_id, title, description, departure_time_jst, max_capacity_per_departure, min_capacity_per_departure, booking_cutoff_hours, is_active)
VALUES ('d1b2c3d4-0004-4000-8000-000000000006', 'c1b2c3d4-0003-4000-8000-000000000003', 'Departs Kyoto Station', 'Standard departure from central Kyoto.', '08:30:00'::time, 36, 1, 24, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, departure_time_jst = EXCLUDED.departure_time_jst, max_capacity_per_departure = EXCLUDED.max_capacity_per_departure;

INSERT INTO public.tour_pricing_tiers (tour_option_id, tier_type, min_age, max_age, price_in_base_currency)
VALUES
('d1b2c3d4-0004-4000-8000-000000000006', 'adult', 12, NULL, 13200.00),
('d1b2c3d4-0004-4000-8000-000000000006', 'child', 4, 11, 8976.00),
('d1b2c3d4-0004-4000-8000-000000000006', 'infant', 0, 3, 0.00)
ON CONFLICT (tour_option_id, tier_type) DO UPDATE SET price_in_base_currency = EXCLUDED.price_in_base_currency;

-- 30-Day Departure Schedules for Departs Kyoto Station
INSERT INTO public.tour_schedules (tour_option_id, tour_date, start_time_jst, max_capacity, booked_capacity, held_capacity)
SELECT 
    'd1b2c3d4-0004-4000-8000-000000000006',
    (CURRENT_DATE + (i || ' days')::interval)::date,
    '08:30:00'::time,
    36,
    (FLOOR(RANDOM() * 8))::int,
    0
FROM generate_series(1, 30) AS i
ON CONFLICT (tour_option_id, tour_date, start_time_jst) DO NOTHING;

-- Tour: kyoto-fushimi-inari-kinkakuji-arashiyama-day-trip | Option: Departs Osaka Umeda
INSERT INTO public.tour_options (id, tour_id, title, description, departure_time_jst, max_capacity_per_departure, min_capacity_per_departure, booking_cutoff_hours, is_active)
VALUES ('d1b2c3d4-0004-4000-8000-000000000007', 'c1b2c3d4-0003-4000-8000-000000000003', 'Departs Osaka Umeda', 'Includes round-trip transfer from central Osaka.', '09:00:00'::time, 36, 1, 24, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, departure_time_jst = EXCLUDED.departure_time_jst, max_capacity_per_departure = EXCLUDED.max_capacity_per_departure;

INSERT INTO public.tour_pricing_tiers (tour_option_id, tier_type, min_age, max_age, price_in_base_currency)
VALUES
('d1b2c3d4-0004-4000-8000-000000000007', 'adult', 12, NULL, 14800.00),
('d1b2c3d4-0004-4000-8000-000000000007', 'child', 4, 11, 10064.00),
('d1b2c3d4-0004-4000-8000-000000000007', 'infant', 0, 3, 0.00)
ON CONFLICT (tour_option_id, tier_type) DO UPDATE SET price_in_base_currency = EXCLUDED.price_in_base_currency;

-- 30-Day Departure Schedules for Departs Osaka Umeda
INSERT INTO public.tour_schedules (tour_option_id, tour_date, start_time_jst, max_capacity, booked_capacity, held_capacity)
SELECT 
    'd1b2c3d4-0004-4000-8000-000000000007',
    (CURRENT_DATE + (i || ' days')::interval)::date,
    '09:00:00'::time,
    36,
    (FLOOR(RANDOM() * 8))::int,
    0
FROM generate_series(1, 30) AS i
ON CONFLICT (tour_option_id, tour_date, start_time_jst) DO NOTHING;

-- Tour: tokyo-hidden-izakaya-shinjuku-omoide-yokocho-food-tour | Option: Evening Food Tour (06:00 PM)
INSERT INTO public.tour_options (id, tour_id, title, description, departure_time_jst, max_capacity_per_departure, min_capacity_per_departure, booking_cutoff_hours, is_active)
VALUES ('d1b2c3d4-0004-4000-8000-000000000008', 'c1b2c3d4-0003-4000-8000-000000000004', 'Evening Food Tour (06:00 PM)', 'Evening culinary walk.', '18:00:00'::time, 36, 1, 24, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, departure_time_jst = EXCLUDED.departure_time_jst, max_capacity_per_departure = EXCLUDED.max_capacity_per_departure;

INSERT INTO public.tour_pricing_tiers (tour_option_id, tier_type, min_age, max_age, price_in_base_currency)
VALUES
('d1b2c3d4-0004-4000-8000-000000000008', 'adult', 12, NULL, 11500.00),
('d1b2c3d4-0004-4000-8000-000000000008', 'child', 4, 11, 7820.00),
('d1b2c3d4-0004-4000-8000-000000000008', 'infant', 0, 3, 0.00)
ON CONFLICT (tour_option_id, tier_type) DO UPDATE SET price_in_base_currency = EXCLUDED.price_in_base_currency;

-- 30-Day Departure Schedules for Evening Food Tour (06:00 PM)
INSERT INTO public.tour_schedules (tour_option_id, tour_date, start_time_jst, max_capacity, booked_capacity, held_capacity)
SELECT 
    'd1b2c3d4-0004-4000-8000-000000000008',
    (CURRENT_DATE + (i || ' days')::interval)::date,
    '18:00:00'::time,
    36,
    (FLOOR(RANDOM() * 8))::int,
    0
FROM generate_series(1, 30) AS i
ON CONFLICT (tour_option_id, tour_date, start_time_jst) DO NOTHING;

-- Tour: hiroshima-peace-memorial-miyajima-shrine-bullet-train | Option: Departs Shin-Osaka
INSERT INTO public.tour_options (id, tour_id, title, description, departure_time_jst, max_capacity_per_departure, min_capacity_per_departure, booking_cutoff_hours, is_active)
VALUES ('d1b2c3d4-0004-4000-8000-000000000009', 'c1b2c3d4-0003-4000-8000-000000000005', 'Departs Shin-Osaka', 'Round-trip from Shin-Osaka.', '09:00:00'::time, 36, 1, 24, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, departure_time_jst = EXCLUDED.departure_time_jst, max_capacity_per_departure = EXCLUDED.max_capacity_per_departure;

INSERT INTO public.tour_pricing_tiers (tour_option_id, tier_type, min_age, max_age, price_in_base_currency)
VALUES
('d1b2c3d4-0004-4000-8000-000000000009', 'adult', 12, NULL, 28500.00),
('d1b2c3d4-0004-4000-8000-000000000009', 'child', 4, 11, 19380.00),
('d1b2c3d4-0004-4000-8000-000000000009', 'infant', 0, 3, 0.00)
ON CONFLICT (tour_option_id, tier_type) DO UPDATE SET price_in_base_currency = EXCLUDED.price_in_base_currency;

-- 30-Day Departure Schedules for Departs Shin-Osaka
INSERT INTO public.tour_schedules (tour_option_id, tour_date, start_time_jst, max_capacity, booked_capacity, held_capacity)
SELECT 
    'd1b2c3d4-0004-4000-8000-000000000009',
    (CURRENT_DATE + (i || ' days')::interval)::date,
    '09:00:00'::time,
    36,
    (FLOOR(RANDOM() * 8))::int,
    0
FROM generate_series(1, 30) AS i
ON CONFLICT (tour_option_id, tour_date, start_time_jst) DO NOTHING;

-- Tour: hiroshima-peace-memorial-miyajima-shrine-bullet-train | Option: Departs Kyoto Station
INSERT INTO public.tour_options (id, tour_id, title, description, departure_time_jst, max_capacity_per_departure, min_capacity_per_departure, booking_cutoff_hours, is_active)
VALUES ('d1b2c3d4-0004-4000-8000-000000000010', 'c1b2c3d4-0003-4000-8000-000000000005', 'Departs Kyoto Station', 'Round-trip from Kyoto Station.', '09:00:00'::time, 36, 1, 24, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, departure_time_jst = EXCLUDED.departure_time_jst, max_capacity_per_departure = EXCLUDED.max_capacity_per_departure;

INSERT INTO public.tour_pricing_tiers (tour_option_id, tier_type, min_age, max_age, price_in_base_currency)
VALUES
('d1b2c3d4-0004-4000-8000-000000000010', 'adult', 12, NULL, 29800.00),
('d1b2c3d4-0004-4000-8000-000000000010', 'child', 4, 11, 20264.00),
('d1b2c3d4-0004-4000-8000-000000000010', 'infant', 0, 3, 0.00)
ON CONFLICT (tour_option_id, tier_type) DO UPDATE SET price_in_base_currency = EXCLUDED.price_in_base_currency;

-- 30-Day Departure Schedules for Departs Kyoto Station
INSERT INTO public.tour_schedules (tour_option_id, tour_date, start_time_jst, max_capacity, booked_capacity, held_capacity)
SELECT 
    'd1b2c3d4-0004-4000-8000-000000000010',
    (CURRENT_DATE + (i || ' days')::interval)::date,
    '09:00:00'::time,
    36,
    (FLOOR(RANDOM() * 8))::int,
    0
FROM generate_series(1, 30) AS i
ON CONFLICT (tour_option_id, tour_date, start_time_jst) DO NOTHING;

-- Tour: osaka-dotonbori-shinsekai-street-food-hidden-bars | Option: Afternoon Food Tour (05:00 PM)
INSERT INTO public.tour_options (id, tour_id, title, description, departure_time_jst, max_capacity_per_departure, min_capacity_per_departure, booking_cutoff_hours, is_active)
VALUES ('d1b2c3d4-0004-4000-8000-000000000011', 'c1b2c3d4-0003-4000-8000-000000000006', 'Afternoon Food Tour (05:00 PM)', 'Standard evening departure.', '17:00:00'::time, 36, 1, 24, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, departure_time_jst = EXCLUDED.departure_time_jst, max_capacity_per_departure = EXCLUDED.max_capacity_per_departure;

INSERT INTO public.tour_pricing_tiers (tour_option_id, tier_type, min_age, max_age, price_in_base_currency)
VALUES
('d1b2c3d4-0004-4000-8000-000000000011', 'adult', 12, NULL, 9500.00),
('d1b2c3d4-0004-4000-8000-000000000011', 'child', 4, 11, 6460.00),
('d1b2c3d4-0004-4000-8000-000000000011', 'infant', 0, 3, 0.00)
ON CONFLICT (tour_option_id, tier_type) DO UPDATE SET price_in_base_currency = EXCLUDED.price_in_base_currency;

-- 30-Day Departure Schedules for Afternoon Food Tour (05:00 PM)
INSERT INTO public.tour_schedules (tour_option_id, tour_date, start_time_jst, max_capacity, booked_capacity, held_capacity)
SELECT 
    'd1b2c3d4-0004-4000-8000-000000000011',
    (CURRENT_DATE + (i || ' days')::interval)::date,
    '17:00:00'::time,
    36,
    (FLOOR(RANDOM() * 8))::int,
    0
FROM generate_series(1, 30) AS i
ON CONFLICT (tour_option_id, tour_date, start_time_jst) DO NOTHING;

-- Tour: nikko-lake-chuzenji-senjogahara-marshland-hiking-adventure | Option: Standard Alpine Hike
INSERT INTO public.tour_options (id, tour_id, title, description, departure_time_jst, max_capacity_per_departure, min_capacity_per_departure, booking_cutoff_hours, is_active)
VALUES ('d1b2c3d4-0004-4000-8000-000000000012', 'c1b2c3d4-0003-4000-8000-000000000007', 'Standard Alpine Hike', 'Departing Tobu-Nikko Station.', '09:00:00'::time, 36, 1, 24, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, departure_time_jst = EXCLUDED.departure_time_jst, max_capacity_per_departure = EXCLUDED.max_capacity_per_departure;

INSERT INTO public.tour_pricing_tiers (tour_option_id, tier_type, min_age, max_age, price_in_base_currency)
VALUES
('d1b2c3d4-0004-4000-8000-000000000012', 'adult', 12, NULL, 12000.00),
('d1b2c3d4-0004-4000-8000-000000000012', 'child', 4, 11, 8160.00),
('d1b2c3d4-0004-4000-8000-000000000012', 'infant', 0, 3, 0.00)
ON CONFLICT (tour_option_id, tier_type) DO UPDATE SET price_in_base_currency = EXCLUDED.price_in_base_currency;

-- 30-Day Departure Schedules for Standard Alpine Hike
INSERT INTO public.tour_schedules (tour_option_id, tour_date, start_time_jst, max_capacity, booked_capacity, held_capacity)
SELECT 
    'd1b2c3d4-0004-4000-8000-000000000012',
    (CURRENT_DATE + (i || ' days')::interval)::date,
    '09:00:00'::time,
    36,
    (FLOOR(RANDOM() * 8))::int,
    0
FROM generate_series(1, 30) AS i
ON CONFLICT (tour_option_id, tour_date, start_time_jst) DO NOTHING;

-- Tour: tokyo-asakusa-sensoji-skytree-sumida-river-cruise | Option: Standard Departure
INSERT INTO public.tour_options (id, tour_id, title, description, departure_time_jst, max_capacity_per_departure, min_capacity_per_departure, booking_cutoff_hours, is_active)
VALUES ('d1b2c3d4-0004-4000-8000-000000000013', 'c1b2c3d4-0003-4000-8000-000000000008', 'Standard Departure', 'Morning tour departure.', '10:00:00'::time, 36, 1, 24, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, departure_time_jst = EXCLUDED.departure_time_jst, max_capacity_per_departure = EXCLUDED.max_capacity_per_departure;

INSERT INTO public.tour_pricing_tiers (tour_option_id, tier_type, min_age, max_age, price_in_base_currency)
VALUES
('d1b2c3d4-0004-4000-8000-000000000013', 'adult', 12, NULL, 9800.00),
('d1b2c3d4-0004-4000-8000-000000000013', 'child', 4, 11, 6664.00),
('d1b2c3d4-0004-4000-8000-000000000013', 'infant', 0, 3, 0.00)
ON CONFLICT (tour_option_id, tier_type) DO UPDATE SET price_in_base_currency = EXCLUDED.price_in_base_currency;

-- 30-Day Departure Schedules for Standard Departure
INSERT INTO public.tour_schedules (tour_option_id, tour_date, start_time_jst, max_capacity, booked_capacity, held_capacity)
SELECT 
    'd1b2c3d4-0004-4000-8000-000000000013',
    (CURRENT_DATE + (i || ' days')::interval)::date,
    '10:00:00'::time,
    36,
    (FLOOR(RANDOM() * 8))::int,
    0
FROM generate_series(1, 30) AS i
ON CONFLICT (tour_option_id, tour_date, start_time_jst) DO NOTHING;

-- Tour: kyoto-gion-pontocho-geisha-traditions-night-walking-tour | Option: Twilight Tour (05:30 PM)
INSERT INTO public.tour_options (id, tour_id, title, description, departure_time_jst, max_capacity_per_departure, min_capacity_per_departure, booking_cutoff_hours, is_active)
VALUES ('d1b2c3d4-0004-4000-8000-000000000014', 'c1b2c3d4-0003-4000-8000-000000000009', 'Twilight Tour (05:30 PM)', 'Evening cultural stroll.', '17:30:00'::time, 36, 1, 24, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, departure_time_jst = EXCLUDED.departure_time_jst, max_capacity_per_departure = EXCLUDED.max_capacity_per_departure;

INSERT INTO public.tour_pricing_tiers (tour_option_id, tier_type, min_age, max_age, price_in_base_currency)
VALUES
('d1b2c3d4-0004-4000-8000-000000000014', 'adult', 12, NULL, 6800.00),
('d1b2c3d4-0004-4000-8000-000000000014', 'child', 4, 11, 4624.00),
('d1b2c3d4-0004-4000-8000-000000000014', 'infant', 0, 3, 0.00)
ON CONFLICT (tour_option_id, tier_type) DO UPDATE SET price_in_base_currency = EXCLUDED.price_in_base_currency;

-- 30-Day Departure Schedules for Twilight Tour (05:30 PM)
INSERT INTO public.tour_schedules (tour_option_id, tour_date, start_time_jst, max_capacity, booked_capacity, held_capacity)
SELECT 
    'd1b2c3d4-0004-4000-8000-000000000014',
    (CURRENT_DATE + (i || ' days')::interval)::date,
    '17:30:00'::time,
    36,
    (FLOOR(RANDOM() * 8))::int,
    0
FROM generate_series(1, 30) AS i
ON CONFLICT (tour_option_id, tour_date, start_time_jst) DO NOTHING;

-- Tour: mt-fuji-yeti-snow-resort-lake-kawaguchi-sightseeing | Option: Standard Snow Adventure
INSERT INTO public.tour_options (id, tour_id, title, description, departure_time_jst, max_capacity_per_departure, min_capacity_per_departure, booking_cutoff_hours, is_active)
VALUES ('d1b2c3d4-0004-4000-8000-000000000015', 'c1b2c3d4-0003-4000-8000-000000000010', 'Standard Snow Adventure', 'Includes transport and sled rental.', '08:00:00'::time, 36, 1, 24, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, departure_time_jst = EXCLUDED.departure_time_jst, max_capacity_per_departure = EXCLUDED.max_capacity_per_departure;

INSERT INTO public.tour_pricing_tiers (tour_option_id, tier_type, min_age, max_age, price_in_base_currency)
VALUES
('d1b2c3d4-0004-4000-8000-000000000015', 'adult', 12, NULL, 15500.00),
('d1b2c3d4-0004-4000-8000-000000000015', 'child', 4, 11, 10540.00),
('d1b2c3d4-0004-4000-8000-000000000015', 'infant', 0, 3, 0.00)
ON CONFLICT (tour_option_id, tier_type) DO UPDATE SET price_in_base_currency = EXCLUDED.price_in_base_currency;

-- 30-Day Departure Schedules for Standard Snow Adventure
INSERT INTO public.tour_schedules (tour_option_id, tour_date, start_time_jst, max_capacity, booked_capacity, held_capacity)
SELECT 
    'd1b2c3d4-0004-4000-8000-000000000015',
    (CURRENT_DATE + (i || ' days')::interval)::date,
    '08:00:00'::time,
    36,
    (FLOOR(RANDOM() * 8))::int,
    0
FROM generate_series(1, 30) AS i
ON CONFLICT (tour_option_id, tour_date, start_time_jst) DO NOTHING;

-- Tour: osaka-castle-samurai-history-and-aqua-liner-boat-cruise | Option: Morning Castle & Cruise Tour
INSERT INTO public.tour_options (id, tour_id, title, description, departure_time_jst, max_capacity_per_departure, min_capacity_per_departure, booking_cutoff_hours, is_active)
VALUES ('d1b2c3d4-0004-4000-8000-000000000016', 'c1b2c3d4-0003-4000-8000-000000000011', 'Morning Castle & Cruise Tour', 'Morning departure.', '09:30:00'::time, 36, 1, 24, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, departure_time_jst = EXCLUDED.departure_time_jst, max_capacity_per_departure = EXCLUDED.max_capacity_per_departure;

INSERT INTO public.tour_pricing_tiers (tour_option_id, tier_type, min_age, max_age, price_in_base_currency)
VALUES
('d1b2c3d4-0004-4000-8000-000000000016', 'adult', 12, NULL, 7500.00),
('d1b2c3d4-0004-4000-8000-000000000016', 'child', 4, 11, 5100.00),
('d1b2c3d4-0004-4000-8000-000000000016', 'infant', 0, 3, 0.00)
ON CONFLICT (tour_option_id, tier_type) DO UPDATE SET price_in_base_currency = EXCLUDED.price_in_base_currency;

-- 30-Day Departure Schedules for Morning Castle & Cruise Tour
INSERT INTO public.tour_schedules (tour_option_id, tour_date, start_time_jst, max_capacity, booked_capacity, held_capacity)
SELECT 
    'd1b2c3d4-0004-4000-8000-000000000016',
    (CURRENT_DATE + (i || ' days')::interval)::date,
    '09:30:00'::time,
    36,
    (FLOOR(RANDOM() * 8))::int,
    0
FROM generate_series(1, 30) AS i
ON CONFLICT (tour_option_id, tour_date, start_time_jst) DO NOTHING;

-- Tour: shimanami-kaido-inland-sea-island-bridge-biking-tour | Option: Full Day E-Bike Tour
INSERT INTO public.tour_options (id, tour_id, title, description, departure_time_jst, max_capacity_per_departure, min_capacity_per_departure, booking_cutoff_hours, is_active)
VALUES ('d1b2c3d4-0004-4000-8000-000000000017', 'c1b2c3d4-0003-4000-8000-000000000012', 'Full Day E-Bike Tour', 'Includes e-bike and helmet.', '09:00:00'::time, 36, 1, 24, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, departure_time_jst = EXCLUDED.departure_time_jst, max_capacity_per_departure = EXCLUDED.max_capacity_per_departure;

INSERT INTO public.tour_pricing_tiers (tour_option_id, tier_type, min_age, max_age, price_in_base_currency)
VALUES
('d1b2c3d4-0004-4000-8000-000000000017', 'adult', 12, NULL, 13800.00),
('d1b2c3d4-0004-4000-8000-000000000017', 'child', 4, 11, 9384.00),
('d1b2c3d4-0004-4000-8000-000000000017', 'infant', 0, 3, 0.00)
ON CONFLICT (tour_option_id, tier_type) DO UPDATE SET price_in_base_currency = EXCLUDED.price_in_base_currency;

-- 30-Day Departure Schedules for Full Day E-Bike Tour
INSERT INTO public.tour_schedules (tour_option_id, tour_date, start_time_jst, max_capacity, booked_capacity, held_capacity)
SELECT 
    'd1b2c3d4-0004-4000-8000-000000000017',
    (CURRENT_DATE + (i || ' days')::interval)::date,
    '09:00:00'::time,
    36,
    (FLOOR(RANDOM() * 8))::int,
    0
FROM generate_series(1, 30) AS i
ON CONFLICT (tour_option_id, tour_date, start_time_jst) DO NOTHING;

-- ==============================================================================
-- 6. Seed Authentic Customer Reviews
-- ==============================================================================
INSERT INTO public.reviews (id, tour_id, booking_id, user_id, rating, traveler_type, title, comment, is_verified_booking)
VALUES
(
    'e1b2c3d4-0006-4000-8000-000000000001',
    'c1b2c3d4-0003-4000-8000-000000000001',
    NULL,
    NULL,
    5,
    'couple',
    'Magical Nikko day trip from Tokyo! Tobu World Square is brilliant',
    'We booked this tour from the UK before flying to Tokyo. The bus was right on time at Shinjuku West Exit. Toshogu Shrine was breathtaking, and Tobu World Square had so many incredible miniature details. Our guide Ken was super knowledgeable and spoke fluent English. Highly recommended!',
    TRUE
),
(
    'e1b2c3d4-0006-4000-8000-000000000002',
    'c1b2c3d4-0003-4000-8000-000000000001',
    NULL,
    NULL,
    5,
    'family',
    'Kids loved Tobu World Square, Kegon Falls was majestic',
    'Traveling with two kids (7 and 10), we were worried about logistics from Tokyo. This tour made everything stress-free. The coach was very comfortable with USB charging ports. The kids were thrilled spotting the mini Eiffel Tower and Pyramids. Great value!',
    TRUE
),
(
    'e1b2c3d4-0006-4000-8000-000000000003',
    'c1b2c3d4-0003-4000-8000-000000000002',
    NULL,
    NULL,
    5,
    'couple',
    'Unbelievable views of Mount Fuji and Lake Ashi pirate boat!',
    'The weather was clear and the 5th Station view of Fuji peak was surreal. The pirate ship cruise across Lake Ashi was so relaxing and picturesque. Returning via Shinkansen was super smooth.',
    TRUE
),
(
    'e1b2c3d4-0006-4000-8000-000000000004',
    'c1b2c3d4-0003-4000-8000-000000000003',
    NULL,
    NULL,
    5,
    'solo',
    'Kyoto in one unforgettable day! Fushimi Inari and Bamboo grove',
    'As a solo traveler from the US, this was the absolute best way to see Kyoto highlights without getting lost on local trains. Fushimi Inari torii gates were spectacular in the morning light.',
    TRUE
),
(
    'e1b2c3d4-0006-4000-8000-000000000005',
    'c1b2c3d4-0003-4000-8000-000000000004',
    NULL,
    NULL,
    5,
    'friends',
    'Best food tour in Tokyo! Yakitori and sake in Omoide Yokocho',
    'Our guide Takeshi took our group of 6 through tiny alleyways we never would have entered on our own. The wagyu skewers, gyoza, and local sake pairings were extraordinary.',
    TRUE
),
(
    'e1b2c3d4-0006-4000-8000-000000000006',
    'c1b2c3d4-0003-4000-8000-000000000006',
    NULL,
    NULL,
    5,
    'couple',
    'Osaka street food heaven: Takoyaki and Kushikatsu!',
    'Dotonbori was buzzing with energy! We sampled fresh piping-hot octopus balls (takoyaki), crispy kushikatsu skewers, and craft beer while learning about Osaka merchant culture.',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 7. PLATFORM ADMINISTRATOR BOOTSTRAP
-- ==============================================================================
-- This block creates a fully-configured platform administrator account in both
-- auth.users and auth.identities (required by Supabase GoTrue authentication engine).
--
-- Credentials:
--   Email:    admin@japanvoyage.com
--   Password: AdminJapanVoyage2026!
-- ==============================================================================
DO $$ 
DECLARE 
    v_user_id UUID := '00000000-0000-4000-a000-000000000001';
    v_email TEXT := 'admin@japanvoyage.com';
    v_password TEXT := 'AdminJapanVoyage2026!';
    v_encrypted_pw TEXT := crypt(v_password, gen_salt('bf'));
BEGIN 
    -- Clean up any prior incomplete user records
    DELETE FROM auth.identities WHERE user_id = v_user_id OR identity_data->>'email' = v_email;
    DELETE FROM auth.users WHERE id = v_user_id OR email = v_email;

    -- Insert into auth.users with empty-string tokens expected by GoTrue scanner
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone_change,
        phone_change_token,
        email_change_token_current,
        email_change_confirm_status,
        reauthentication_token,
        is_sso_user
    ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        v_encrypted_pw,
        NOW(),
        '',
        '',
        '',
        '',
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Platform Administrator"}'::jsonb,
        FALSE,
        NOW(),
        NOW(),
        '',
        '',
        '',
        0,
        '',
        FALSE
    ); 

    -- Insert into auth.identities (MANDATORY for Supabase Auth to recognize email logins)
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_user_id,
        format('{"sub": "%s", "email": "%s"}', v_user_id, v_email)::jsonb,
        'email',
        v_user_id::text,
        NOW(),
        NOW(),
        NOW()
    );

    -- Ensure Admin role is assigned in public.profiles
    UPDATE public.profiles
    SET role = 'admin',
        full_name = 'Platform Administrator',
        updated_at = NOW()
    WHERE id = v_user_id OR email = v_email;

END $$;
-- ==============================================================================
