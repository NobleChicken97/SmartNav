import React, { useEffect, useState, useCallback } from 'react';
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
  // Note: filteredEvents is set by SearchFilters component
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

      // For organizers, show only their own events
      // For students/admins, show all upcoming events
      const eventsPromise = user?.role === 'organizer' 
        ? EventService.getMyEvents()
        : EventService.getUpcomingEvents(50);

      const [locationsResponse, eventsResponse] = await Promise.all([
        LocationService.getLocations({ limit: 100 }),
        eventsPromise,
      ]);

      // Filter events to only show upcoming and ongoing events (hide completed/canceled)
      // Use computed status based on time, not the status field (draft/published/cancelled)
      const activeEvents = eventsResponse.filter(event => {
        // Exclude cancelled events
        if (event.status === 'cancelled') return false;
        
        // Check time-based status
        const timeStatus = EventService.getEventStatus(event);
        return timeStatus === 'upcoming' || timeStatus === 'ongoing';
      });

      // For organizers, filter locations to only show those with their active events
      let filteredLocs = locationsResponse.locations;
      if (user?.role === 'organizer') {
        // Get unique location IDs from the organizer's active events
        const eventLocationIds = new Set(
          activeEvents
            .map(event => typeof event.locationId === 'object' ? event.locationId._id : event.locationId)
            .filter(Boolean)
        );
        
        // Only show locations that have organizer's active events
        filteredLocs = locationsResponse.locations.filter(loc => 
          eventLocationIds.has(loc._id)
        );
      }

      setLocations(filteredLocs);
      setEvents(activeEvents);
      setFilteredLocations(filteredLocs);
      setFilteredEvents(activeEvents);
      
      console.log('MapPage loaded:', {
        totalLocations: locationsResponse.locations.length,
        filteredLocations: filteredLocs.length,
        totalEvents: eventsResponse.length,
        activeEvents: activeEvents.length,
        userRole: user?.role,
        eventsData: eventsResponse.map(e => ({
          id: e._id,
          title: e.title,
          status: e.status,
          dateTime: e.dateTime,
          timeStatus: EventService.getEventStatus(e),
          locationId: typeof e.locationId === 'object' ? e.locationId._id : e.locationId
        }))
      });
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
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #fffef7 0%, #fffcf5 50%, #fffbf0 100%)'
    }}>
      {/* Header */}
      <header className="navbar shadow-lg" style={{
        background: 'linear-gradient(90deg, #fffef9 0%, #fffdf5 50%, #fffcf0 100%)',
        borderBottom: '2px solid rgba(16, 185, 129, 0.3)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="SmartNav Logo" 
                className="h-14 w-auto ml-4"
              />
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                {/* Dashboard Navigation based on role */}
                {/* Only show Organizer Dashboard for organizers, not admins */}
                {user.role === 'organizer' && (
                  <Link
                    to="/organizer/dashboard"
                    className="text-sm px-4 py-2 bg-gradient-to-r from-blue-50 to-violet-50 text-blue-700 hover:from-blue-100 hover:to-violet-100 hover:text-blue-800 font-semibold rounded-lg border border-blue-300 hover:border-violet-400 transition-all shadow-sm hover:shadow-md"
                  >
                    📊 Organizer Dashboard
                  </Link>
                )}
                
                {user.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="text-sm px-4 py-2 bg-gradient-to-r from-emerald-50 to-blue-50 text-emerald-700 hover:from-emerald-100 hover:to-blue-100 hover:text-emerald-800 font-semibold rounded-lg border border-emerald-300 hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
                  >
                    ⚙️ Admin Dashboard
                  </Link>
                )}
                
                <span className="text-sm nav-link hidden sm:block px-3 py-1.5 border-2 border-gray-300 rounded-lg bg-white/50">
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{
          padding: '1.5rem',
          borderRadius: '1rem',
          background: 'rgba(255, 255, 250, 0.6)',
          border: '2px solid rgba(16, 185, 129, 0.25)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)'
        }}>
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
              <div className="mt-6 card p-4" style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 248, 0.5), rgba(255, 255, 245, 0.3))',
                borderColor: 'rgba(16, 185, 129, 0.3)'
              }}>
                <h3 className="font-semibold text-lg mb-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-600">
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
          <div className="lg:col-span-3" style={{
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(16, 185, 129, 0.25), 0 0 0 3px rgba(16, 185, 129, 0.2)',
            border: '3px solid rgba(16, 185, 129, 0.4)'
          }}>
            <LeafletMap
              locations={filteredLocations}
              events={filteredEvents}
              onLocationSelect={handleLocationSelect}
              onEventSelect={handleEventSelect}
              enableRouting={true}
              routingMode={routingMode}
              onToggleRouting={() => setRoutingMode(!routingMode)}
              className="h-[calc(100vh-8rem)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
