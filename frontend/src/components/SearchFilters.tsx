import { useState, useEffect, useMemo, memo } from 'react';
import { Search, Filter, X, MapPin } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { Location, Event } from '../types';
import { cn, debounce } from '../utils';
import { LocationService } from '../services/locationService';

interface SearchFiltersProps {
  locations: Location[];
  events: Event[];
  onLocationFilter: (locations: Location[]) => void;
  onEventFilter: (events: Event[]) => void;
  className?: string;
  routingMode: boolean;
  onToggleRouting: () => void;
}

const SearchFilters = memo<SearchFiltersProps>(({
  locations,
  events,
  onLocationFilter,
  onEventFilter,
  className,
  routingMode,
  onToggleRouting,
}) => {
  const {
    searchQuery,
    activeFilters,
    setSearchQuery,
    updateFilters,
    clearFilters,
  } = useMapStore();

  const [showFilters, setShowFilters] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [fetchedLocations, setFetchedLocations] = useState<Location[] | null>(null);
  const [fetchedEvents, setFetchedEvents] = useState<Event[] | null>(null);

  // Ensure we always work with arrays even if props are null/undefined/malformed
  const safeLocations: Location[] = useMemo(() => (Array.isArray(locations) ? locations : []), [locations]);
  const safeEvents: Event[] = useMemo(() => (Array.isArray(events) ? events : []), [events]);

  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
  }, 300);

  useEffect(() => {
    debouncedSearch(localSearchQuery);
  }, [localSearchQuery, debouncedSearch]);

  // Server-backed search when query length >= 2; otherwise use provided props
  // Note: For events, we use local filtering to respect role-based filtering (organizers see only their events)
  useEffect(() => {
    let cancelled = false;
    const q = searchQuery.trim();

    if (q.length >= 2) {
      (async () => {
        try {
          // Only fetch locations from server; events are filtered locally to respect role permissions
          const locs = await LocationService.searchLocations(q);
          if (!cancelled) {
            setFetchedLocations(locs);
            // Don't fetch events from server - use local filtering instead
            setFetchedEvents(null);
          }
  } catch {
          // On error, fall back to local lists
          if (!cancelled) {
            setFetchedLocations(null);
            setFetchedEvents(null);
          }
        }
      })();
    } else {
      setFetchedLocations(null);
      setFetchedEvents(null);
    }

    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  // Memoize filtering logic to prevent unnecessary recalculations
  const { filteredLocs, filteredEvts } = useMemo(() => {
    const baseLocations = fetchedLocations ?? safeLocations;
    const baseEvents = fetchedEvents ?? safeEvents;
    
    let filteredLocations = baseLocations;
    let filteredEvents = baseEvents;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      
      filteredLocations = filteredLocations.filter((location) =>
        location.name.toLowerCase().includes(query) ||
        location.description?.toLowerCase().includes(query) ||
        (Array.isArray(location.tags) && location.tags.some(tag => tag.toLowerCase().includes(query)))
      );

      filteredEvents = filteredEvents.filter((event) =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        (Array.isArray(event.tags) && event.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // Apply location type filters
    if (activeFilters.category.length > 0) {
      filteredLocations = filteredLocations.filter((location) =>
        activeFilters.category.includes(location.type)
      );
    }



    return {
      filteredLocs: filteredLocations,
      filteredEvts: filteredEvents
    };
  }, [searchQuery, activeFilters, safeLocations, safeEvents, fetchedLocations, fetchedEvents]);

  // Update parent components when filtered results change
  useEffect(() => {
    onLocationFilter(filteredLocs);
    onEventFilter(filteredEvts);
  }, [filteredLocs, filteredEvts, onLocationFilter, onEventFilter]);

  const handleCategoryToggle = (category: string) => {
    const categories = activeFilters.category.includes(category)
      ? activeFilters.category.filter(c => c !== category)
      : [...activeFilters.category, category];
    
    updateFilters({ category: categories });
  };



  const handleClearFilters = () => {
    setLocalSearchQuery('');
    clearFilters();
  };

  const hasActiveFilters = searchQuery.trim() || activeFilters.category.length > 0;

  return (
    <div className={cn('card', className)}>
      {/* Search Bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-5 w-5" />
          <input
            type="text"
            placeholder="Search locations and events..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="search-input pl-10 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
          />
          {localSearchQuery && (
            <button
              onClick={() => setLocalSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="px-4 py-2 border-b border-blue-100 flex items-center justify-between" style={{
        background: showFilters ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08))' : 'transparent'
      }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'btn btn-ghost !px-3 !py-1 flex items-center space-x-2 transition-all',
            showFilters && 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-md'
          )}
        >
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs rounded-full px-2 py-0.5 font-semibold shadow-sm">
              {activeFilters.category.length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="btn btn-outline !text-sm hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white hover:border-transparent transition-all"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Navigation Toggle */}
      <div className="px-4 py-2 border-b border-emerald-100" style={{
        background: routingMode ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))' : 'transparent'
      }}>
        <button
          onClick={onToggleRouting}
          className={cn(
            'btn btn-ghost !px-3 !py-1 flex items-center space-x-2 w-full transition-all font-medium',
            routingMode && 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg transform scale-105'
          )}
        >
          <span className="text-lg">🧭</span>
          <span>{routingMode ? 'Exit Navigation' : 'Get Directions'}</span>
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 space-y-4">
          {/* Location Type Filters */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center px-3 py-2 rounded-lg" style={{
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.05))'
            }}>
              <MapPin className="h-4 w-4 mr-2 text-emerald-600" />
              Location Types
            </h4>
            <div className="space-y-2">
              {['hostel', 'class', 'faculty', 'entertainment', 'shop', 'parking', 'medical', 'sports', 'eatables', 'religious'].map((type) => (
                <label key={type} className="flex items-center hover:bg-emerald-50 px-2 py-1 rounded transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeFilters.category.includes(type)}
                    onChange={() => handleCategoryToggle(type)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>



          {/* Quick Stats */}
          <div className="pt-2 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-blue-600">{safeLocations.length}</div>
                <div className="text-gray-500">Locations</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">{safeEvents.length}</div>
                <div className="text-gray-500">Events</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results Summary */}
      {hasActiveFilters && (
  <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 rounded-b-lg">
          {searchQuery.trim() && (
            <span>Searching for "{searchQuery.trim()}" • </span>
          )}
          <span>{safeLocations.length} locations, {safeEvents.length} events</span>
        </div>
      )}
    </div>
  );
});

SearchFilters.displayName = 'SearchFilters';

export default SearchFilters;
