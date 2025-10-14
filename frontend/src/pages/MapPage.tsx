import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LocationService } from '../services/locationService';
import { EventService } from '../services/eventService';
import { Location, Event } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { LeafletMap } from '../components/Map/LeafletMap';
import SearchFilters from '../components/SearchFilters';

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
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [locationsResponse, eventsResponse] = await Promise.all([
        LocationService.getLocations({ limit: 100 }),
        EventService.getUpcomingEvents(50),
      ]);

      setLocations(locationsResponse.locations);
      setEvents(eventsResponse);
      setFilteredLocations(locationsResponse.locations);
      setFilteredEvents(eventsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    // Clear event selection when location is selected
    setSelectedEvent(null);
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    // Clear location selection when event is selected
    setSelectedLocation(null);
  };

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
              <h1 className="text-xl font-semibold site-title">Smart Navigator</h1>
              <span className="ml-2 text-sm text-light">
                Thapar Institute Campus
              </span>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                {/* Dashboard Navigation based on role */}
                {user.role === 'organizer' || user.role === 'admin' ? (
                  <Link
                    to="/organizer/dashboard"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    📊 Organizer Dashboard
                  </Link>
                ) : null}
                
                {user.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                  >
                    ⚙️ Admin Dashboard
                  </Link>
                )}
                
                <span className="text-sm nav-link">
                  Welcome, {user.name}
                </span>
                <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, var(--primary-green), var(--secondary-blue))'}}>
                  <span className="text-white text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
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
              onToggleRouting={() => setRoutingMode(!routingMode)}
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
