import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LocationService } from '../services/locationService';
import { EventService } from '../services/eventService';
import { Location, Event } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { LeafletMap } from '../components/Map/LeafletMap';
import SearchFilters from '../components/SearchFilters';
import { ProfileDropdown } from '../components/ProfileDropdown';

const MapPage: React.FC = () => {
  const { user } = useAuthStore();
  const [locations, setLocations] = useState<Location[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [routingMode, setRoutingMode] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []); // Only load once on mount

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🗺️ MapPage: Loading data for user role:', user?.role);

      // For organizers, show only their own events
      // For students/admins, show all upcoming events
      const eventsPromise = user?.role === 'organizer' 
        ? EventService.getMyEvents()
        : EventService.getUpcomingEvents(50);

      console.log('🗺️ MapPage: Using', user?.role === 'organizer' ? 'getMyEvents()' : 'getUpcomingEvents()');

      const [locationsResponse, eventsResponse] = await Promise.all([
        LocationService.getLocations({ limit: 100 }),
        eventsPromise,
      ]);

      console.log('🗺️ MapPage: Loaded', eventsResponse.length, 'events');
      console.log('🗺️ MapPage: Event titles:', eventsResponse.map(e => e.title));
      console.log('🗺️ MapPage: Event creators:', eventsResponse.map(e => 
        typeof e.createdBy === 'object' ? e.createdBy?.name : e.createdBy
      ));

      // For organizers, filter locations to only show those with their events
      let filteredLocs = locationsResponse.locations;
      if (user?.role === 'organizer') {
        // Get unique location IDs from the organizer's events
        const eventLocationIds = new Set(
          eventsResponse
            .map(event => typeof event.locationId === 'object' ? event.locationId._id : event.locationId)
            .filter(Boolean)
        );
        
        // Only show locations that have organizer's events
        filteredLocs = locationsResponse.locations.filter(loc => 
          eventLocationIds.has(loc._id)
        );
        
        console.log('🗺️ MapPage: Organizer mode - filtered to', filteredLocs.length, 'locations with events');
      }

      setLocations(filteredLocs);
      setEvents(eventsResponse);
      setFilteredLocations(filteredLocs);
      setFilteredEvents(eventsResponse);
      
      console.log('✅ MapPage: State updated with filtered events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]); // Only recreate if user role changes

  const handleLocationSelect = useCallback((location: Location) => {
    setSelectedLocation(location);
    // Clear event selection when location is selected
    setSelectedEvent(null);
  }, []);

  const handleEventSelect = useCallback((event: Event) => {
    setSelectedEvent(event);
    // Clear location selection when event is selected
    setSelectedLocation(null);
  }, []);

  const handleToggleRouting = useCallback(() => {
    setRoutingMode(prev => !prev);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadInitialData}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                <span className="text-white font-bold text-lg">LOGO</span>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                {/* Dashboard Navigation based on role */}
                {/* Only show Organizer Dashboard for organizers, not admins */}
                {user.role === 'organizer' && (
                  <Link
                    to="/organizer/dashboard"
                    className="text-sm px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 font-medium rounded-lg border border-blue-200 transition-all"
                  >
                    📊 Organizer Dashboard
                  </Link>
                )}
                
                {user.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="text-sm px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 font-medium rounded-lg border border-red-200 transition-all"
                  >
                    ⚙️ Admin Dashboard
                  </Link>
                )}
                
                <span className="text-sm nav-link hidden sm:block">
                  Welcome, {user.name}
                </span>
                
                {/* Profile Dropdown with Logout */}
                <ProfileDropdown />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Search and Filters */}
          <div className="lg:col-span-1">
            <SearchFilters
              locations={locations}
              events={events}
              onLocationFilter={setFilteredLocations}
              onEventFilter={setFilteredEvents}
              className="sticky top-6"
              routingMode={routingMode}
              onToggleRouting={handleToggleRouting}
            />

            {/* Selected Item Details */}
            {(selectedLocation || selectedEvent) && (
              <div className="mt-6 card p-4">
                <h3 className="font-semibold text-lg mb-3">
                  {selectedLocation ? 'Location Details' : 'Event Details'}
                </h3>
                
                {selectedLocation && (
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedLocation.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedLocation.description || 'No description available'}
                    </p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-500 w-16">Type:</span>
                        <span className="text-gray-900 capitalize">{selectedLocation.type}</span>
                      </div>
                      {Array.isArray(selectedLocation.tags) && selectedLocation.tags.length > 0 && (
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-500 w-16">Tags:</span>
                          <span className="text-gray-900">{selectedLocation.tags.join(', ')}</span>
                        </div>
                      )}
                      {selectedLocation.accessibility?.wheelchairAccessible && (
                        <div className="flex items-center text-sm text-green-600">
                          <span>♿ Wheelchair accessible</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedEvent && (
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedEvent.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{selectedEvent.description}</p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-500 w-20">Category:</span>
                        <span className="text-gray-900">{selectedEvent.category}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-500 w-20">Date:</span>
                        <span className="text-gray-900">
                          {new Date(selectedEvent.dateTime).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-500 w-20">Time:</span>
                        <span className="text-gray-900">
                          {new Date(selectedEvent.dateTime).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-500 w-20">Capacity:</span>
                        <span className="text-gray-900">
                          {(Array.isArray(selectedEvent.attendees) ? selectedEvent.attendees.length : 0)}/{selectedEvent.capacity}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedLocation(null);
                    setSelectedEvent(null);
                  }}
                  className="mt-4 w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <LeafletMap
              locations={filteredLocations}
              events={filteredEvents}
              onLocationSelect={handleLocationSelect}
              onEventSelect={handleEventSelect}
              enableRouting={true}
              routingMode={routingMode}
              onToggleRouting={() => setRoutingMode(!routingMode)}
              className="h-[calc(100vh-8rem)] rounded-lg overflow-hidden shadow-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
