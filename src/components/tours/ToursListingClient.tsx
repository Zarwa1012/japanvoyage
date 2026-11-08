'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Star, 
  Compass, 
  Clock, 
  MapPin, 
  Filter, 
  Check,
  AlertCircle
} from 'lucide-react';
import { ALL_TOURS, MockTour } from '@/data/mockTours';
import { getToursFromDatabase } from '@/lib/services/toursService';
import { TourCard } from '@/components/tours/TourCard';
import { useCurrency } from '@/context/CurrencyContext';

type SortOption = 'recommended' | 'popular' | 'rating' | 'price-low' | 'price-high';
type PriceRangeOption = 'all' | 'under-10000' | '10000-20000' | 'over-20000';
type DurationOption = 'all' | 'under-4' | '4-8' | 'over-8';
type RatingOption = 'all' | '4.5' | '4.8' | '4.9';

const DESTINATIONS = [
  { slug: 'all', label: 'All Japan' },
  { slug: 'tokyo', label: 'Tokyo' },
  { slug: 'nikko', label: 'Nikko' },
  { slug: 'kyoto', label: 'Kyoto' },
  { slug: 'osaka', label: 'Osaka' },
  { slug: 'mt-fuji', label: 'Mt. Fuji' },
  { slug: 'hiroshima', label: 'Hiroshima' },
];

const CATEGORIES = [
  { name: 'all', label: 'All Categories' },
  { name: 'Day Trips', label: 'Day Trips' },
  { name: 'Cultural Tours', label: 'Cultural Tours' },
  { name: 'Food Tours', label: 'Food Tours' },
  { name: 'Nature & Adventure', label: 'Nature & Adventure' },
];

const ITEMS_PER_PAGE = 6;

export function ToursListingClient() {
  const { formatPrice, currency } = useCurrency();

  // Real Database Tours State
  const [tours, setTours] = useState<MockTour[]>(ALL_TOURS);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Fetch real tours from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function loadDbTours() {
      setIsLoadingDb(true);
      try {
        const liveTours = await getToursFromDatabase();
        if (isMounted && liveTours && liveTours.length > 0) {
          setTours(liveTours);
        }
      } catch (err) {
        console.warn('Error loading tours from database:', err);
      } finally {
        if (isMounted) setIsLoadingDb(false);
      }
    }
    loadDbTours();
    return () => { isMounted = false; };
  }, []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRangeOption>('all');
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>('all');
  const [selectedRating, setSelectedRating] = useState<RatingOption>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('recommended');
  
  // Pagination & UI State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  // Reset to page 1 whenever filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDestination, selectedCategory, selectedPriceRange, selectedDuration, selectedRating, selectedSort]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      selectedDestination !== 'all' ||
      selectedCategory !== 'all' ||
      selectedPriceRange !== 'all' ||
      selectedDuration !== 'all' ||
      selectedRating !== 'all' ||
      selectedSort !== 'recommended'
    );
  }, [searchQuery, selectedDestination, selectedCategory, selectedPriceRange, selectedDuration, selectedRating, selectedSort]);

  // Count active filters (for badge)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim() !== '') count++;
    if (selectedDestination !== 'all') count++;
    if (selectedCategory !== 'all') count++;
    if (selectedPriceRange !== 'all') count++;
    if (selectedDuration !== 'all') count++;
    if (selectedRating !== 'all') count++;
    return count;
  }, [searchQuery, selectedDestination, selectedCategory, selectedPriceRange, selectedDuration, selectedRating]);

  // Clear all filters handler
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedDestination('all');
    setSelectedCategory('all');
    setSelectedPriceRange('all');
    setSelectedDuration('all');
    setSelectedRating('all');
    setSelectedSort('recommended');
    setCurrentPage(1);
  };

  // Filter and Sort Engine
  const filteredAndSortedTours = useMemo(() => {
    let result = [...tours];

    // 1. Text Search (title, destination, features)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.features.some((f) => f.toLowerCase().includes(q))
      );
    }

    // 2. Destination Filter
    if (selectedDestination !== 'all') {
      result = result.filter((t) => t.destinationSlug === selectedDestination);
    }

    // 3. Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter((t) => t.category === selectedCategory);
    }

    // 4. Price Range Filter (Based on Master JPY)
    if (selectedPriceRange === 'under-10000') {
      result = result.filter((t) => t.priceJpy < 10000);
    } else if (selectedPriceRange === '10000-20000') {
      result = result.filter((t) => t.priceJpy >= 10000 && t.priceJpy <= 20000);
    } else if (selectedPriceRange === 'over-20000') {
      result = result.filter((t) => t.priceJpy > 20000);
    }

    // 5. Duration Filter
    if (selectedDuration === 'under-4') {
      result = result.filter((t) => t.durationHours < 4);
    } else if (selectedDuration === '4-8') {
      result = result.filter((t) => t.durationHours >= 4 && t.durationHours <= 8);
    } else if (selectedDuration === 'over-8') {
      result = result.filter((t) => t.durationHours > 8);
    }

    // 6. Minimum Rating Filter
    if (selectedRating !== 'all') {
      const min = parseFloat(selectedRating);
      result = result.filter((t) => t.rating >= min);
    }

    // 7. Sorting Engine
    if (selectedSort === 'popular') {
      result.sort((a, b) => b.reviewCount - a.reviewCount);
    } else if (selectedSort === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (selectedSort === 'price-low') {
      result.sort((a, b) => a.priceJpy - b.priceJpy);
    } else if (selectedSort === 'price-high') {
      result.sort((a, b) => b.priceJpy - a.priceJpy);
    }
    // 'recommended' retains original curated order

    return result;
  }, [searchQuery, selectedDestination, selectedCategory, selectedPriceRange, selectedDuration, selectedRating, selectedSort]);

  // Pagination Math
  const totalTours = filteredAndSortedTours.length;
  const totalPages = Math.ceil(totalTours / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTours = filteredAndSortedTours.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Breadcrumbs & Page Header */}
      <div className="bg-white border-b border-slate-200 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4">
            <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">All Japan Tours</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                Explore Japan Tours & Activities
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                Discover unforgettable day trips, UNESCO shrine excursions, bullet train tours, and culinary walks with instant confirmation and English-speaking guides.
              </p>
            </div>

            {/* Total Count Badge */}
            <div className="bg-slate-100 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-bold self-start md:self-auto flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Showing {totalTours} available {totalTours === 1 ? 'tour' : 'tours'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Listing Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Top Control Bar: Search Input, Mobile Filter Button, Sort Dropdown */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tours, Nikko, Shinjuku, shrines..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm font-medium text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Mobile Filters Toggle Button */}
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4 text-red-600" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">Sort:</span>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as SortOption)}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips / Pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6 text-xs font-medium">
            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mr-1">
              Active Filters:
            </span>

            {searchQuery && (
              <span className="bg-white border border-slate-200 text-slate-800 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <span>Keyword: "{searchQuery}"</span>
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedDestination !== 'all' && (
              <span className="bg-white border border-slate-200 text-slate-800 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <span>Destination: {DESTINATIONS.find((d) => d.slug === selectedDestination)?.label}</span>
                <button onClick={() => setSelectedDestination('all')} className="text-slate-400 hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span className="bg-white border border-slate-200 text-slate-800 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <span>Category: {selectedCategory}</span>
                <button onClick={() => setSelectedCategory('all')} className="text-slate-400 hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedPriceRange !== 'all' && (
              <span className="bg-white border border-slate-200 text-slate-800 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <span>
                  Price: {selectedPriceRange === 'under-10000' ? '< ¥10,000' : selectedPriceRange === '10000-20000' ? '¥10,000 - ¥20,000' : '> ¥20,000'}
                </span>
                <button onClick={() => setSelectedPriceRange('all')} className="text-slate-400 hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedDuration !== 'all' && (
              <span className="bg-white border border-slate-200 text-slate-800 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <span>
                  Duration: {selectedDuration === 'under-4' ? '< 4 hours' : selectedDuration === '4-8' ? '4 - 8 hours' : '8+ hours'}
                </span>
                <button onClick={() => setSelectedDuration('all')} className="text-slate-400 hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedRating !== 'all' && (
              <span className="bg-white border border-slate-200 text-slate-800 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <span>Rating: {selectedRating}+ ★</span>
                <button onClick={() => setSelectedRating('all')} className="text-slate-400 hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Clear All Button */}
            <button
              onClick={handleClearAllFilters}
              className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 ml-2 underline text-xs cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>
        )}

        {/* Content Layout: Left Sidebar Filters + Right Tour Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filter Sidebar (Column 1) */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-28 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-red-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">Filter Tours</h3>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearAllFilters}
                    className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* 1. Destination Filter */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Destination
                </label>
                <div className="space-y-1.5">
                  {DESTINATIONS.map((d) => (
                    <button
                      key={d.slug}
                      onClick={() => setSelectedDestination(d.slug)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        selectedDestination === d.slug
                          ? 'bg-red-50 text-red-600 font-extrabold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{d.label}</span>
                      {selectedDestination === d.slug && (
                        <Check className="w-4 h-4 text-red-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Category Filter */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Category
                </label>
                <div className="space-y-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedCategory(c.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        selectedCategory === c.name
                          ? 'bg-red-50 text-red-600 font-extrabold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{c.label}</span>
                      {selectedCategory === c.name && (
                        <Check className="w-4 h-4 text-red-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Price Range Filter */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Price Range ({currency})
                </label>
                <div className="space-y-1.5 text-xs font-semibold">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under-10000', label: `Under ${formatPrice(10000)}` },
                    { id: '10000-20000', label: `${formatPrice(10000)} - ${formatPrice(20000)}` },
                    { id: 'over-20000', label: `Over ${formatPrice(20000)}` },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPriceRange(p.id as PriceRangeOption)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                        selectedPriceRange === p.id
                          ? 'bg-red-50 text-red-600 font-extrabold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{p.label}</span>
                      {selectedPriceRange === p.id && (
                        <Check className="w-4 h-4 text-red-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Duration Filter */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Duration
                </label>
                <div className="space-y-1.5 text-xs font-semibold">
                  {[
                    { id: 'all', label: 'Any Duration' },
                    { id: 'under-4', label: 'Under 4 Hours' },
                    { id: '4-8', label: '4 to 8 Hours' },
                    { id: 'over-8', label: 'Full Day (8+ Hours)' },
                  ].map((dur) => (
                    <button
                      key={dur.id}
                      onClick={() => setSelectedDuration(dur.id as DurationOption)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                        selectedDuration === dur.id
                          ? 'bg-red-50 text-red-600 font-extrabold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{dur.label}</span>
                      {selectedDuration === dur.id && (
                        <Check className="w-4 h-4 text-red-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Rating Filter */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Customer Rating
                </label>
                <div className="space-y-1.5 text-xs font-semibold">
                  {[
                    { id: 'all', label: 'All Ratings' },
                    { id: '4.5', label: '4.5 & Above' },
                    { id: '4.8', label: '4.8 & Above' },
                    { id: '4.9', label: '4.9 & Above' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRating(r.id as RatingOption)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                        selectedRating === r.id
                          ? 'bg-red-50 text-red-600 font-extrabold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {r.id !== 'all' && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                        <span>{r.label}</span>
                      </span>
                      {selectedRating === r.id && (
                        <Check className="w-4 h-4 text-red-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Right Tour Results Grid (Columns 2-4) */}
          <main className="lg:col-span-3">
            {paginatedTours.length > 0 ? (
              <>
                {/* Tour Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {paginatedTours.map((tour) => (
                    <TourCard key={tour.id} tour={tour} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-slate-500">
                      Showing {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, totalTours)} of {totalTours} tours
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Prev</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                              currentPage === pageNum
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Empty State UI */
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-100">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-950 mb-2">
                  No Tours Match Your Criteria
                </h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                  We couldn't find any tours matching your active combination of filters and search keywords. Try widening your price range or clearing filters.
                </p>
                <button
                  onClick={handleClearAllFilters}
                  className="bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-extrabold px-6 py-3 rounded-xl transition-all shadow-md shadow-red-600/20 inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Slide-over / Modal */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileFiltersOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-red-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Filters</h3>
              </div>
              <button 
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filters Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Destination */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-2">Destination</label>
                <div className="space-y-1">
                  {DESTINATIONS.map((d) => (
                    <button
                      key={d.slug}
                      onClick={() => setSelectedDestination(d.slug)}
                      className={`w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center justify-between ${
                        selectedDestination === d.slug ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span>{d.label}</span>
                      {selectedDestination === d.slug && <Check className="w-4 h-4 text-red-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-2">Category</label>
                <div className="space-y-1">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedCategory(c.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center justify-between ${
                        selectedCategory === c.name ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span>{c.label}</span>
                      {selectedCategory === c.name && <Check className="w-4 h-4 text-red-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-2">Price Range</label>
                <div className="space-y-1">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under-10000', label: `< ${formatPrice(10000)}` },
                    { id: '10000-20000', label: `${formatPrice(10000)} - ${formatPrice(20000)}` },
                    { id: 'over-20000', label: `> ${formatPrice(20000)}` },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPriceRange(p.id as PriceRangeOption)}
                      className={`w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center justify-between ${
                        selectedPriceRange === p.id ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span>{p.label}</span>
                      {selectedPriceRange === p.id && <Check className="w-4 h-4 text-red-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-2">Duration</label>
                <div className="space-y-1">
                  {[
                    { id: 'all', label: 'Any Duration' },
                    { id: 'under-4', label: 'Under 4 Hours' },
                    { id: '4-8', label: '4 to 8 Hours' },
                    { id: 'over-8', label: 'Full Day (8+ Hours)' },
                  ].map((dur) => (
                    <button
                      key={dur.id}
                      onClick={() => setSelectedDuration(dur.id as DurationOption)}
                      className={`w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center justify-between ${
                        selectedDuration === dur.id ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span>{dur.label}</span>
                      {selectedDuration === dur.id && <Check className="w-4 h-4 text-red-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-2">Min Rating</label>
                <div className="space-y-1">
                  {[
                    { id: 'all', label: 'All Ratings' },
                    { id: '4.5', label: '4.5 & Above' },
                    { id: '4.8', label: '4.8 & Above' },
                    { id: '4.9', label: '4.9 & Above' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRating(r.id as RatingOption)}
                      className={`w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center justify-between ${
                        selectedRating === r.id ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span>{r.label}</span>
                      {selectedRating === r.id && <Check className="w-4 h-4 text-red-600" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
              <button
                onClick={handleClearAllFilters}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 text-xs"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs shadow-md"
              >
                View {totalTours} {totalTours === 1 ? 'Tour' : 'Tours'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
