import { useEffect, useMemo, useRef, useState, memo, useCallback } from 'react';
import toast from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
// @ts-ignore - leaflet-routing-machine doesn't have proper ES module exports
import 'leaflet-routing-machine';
import { MAP_CONFIG, MARKER_ICONS } from '../../config/mapConfig';
import { Location, Event } from '../../types';
import { EventService } from '../../services/eventService';

// Fix for default markers in Leaflet with Webpack/Vite (avoid explicit any)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapProps {
  locations: Location[];
  events?: Event[];
  selectedLocation?: Location;
  onLocationSelect?: (location: Location) => void;
  onEventSelect?: (event: Event) => void;
  className?: string;
  enableRouting?: boolean;
  routingMode?: boolean;
  onToggleRouting?: () => void;
}

export const LeafletMap = memo<LeafletMapProps>(({
  locations = [],
  events = [],
  selectedLocation,
  onLocationSelect,
  onEventSelect,
  className = '',
  enableRouting = false,
  routingMode = false,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const eventMarkersRef = useRef<L.Marker[]>([]); // Separate ref for event markers
  const routingControlRef = useRef<any>(null); // Routing control reference
  const waypointMarkersRef = useRef<L.Marker[]>([]); // Waypoint markers reference
  
  // Existing state
  // const [mapStyle, setMapStyle] = useState<'default' | 'satellite' | 'dark' | 'terrain'>('default');
  const [showEvents] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // New routing state
  const [waypoints, setWaypoints] = useState<L.LatLng[]>([]);
  const [routeInfo, setRouteInfo] = useState<{distance: string; time: string; instructions: string[]} | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Memoized callback for location selection
  const handleLocationSelect = useCallback((location: Location) => {
    onLocationSelect?.(location);
  }, [onLocationSelect]);

  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (!routingMode || !enableRouting || !mapInstanceRef.current) return;
    
    const clickPoint = e.latlng;
    
    // Clear old waypoint markers if we're starting fresh or replacing
    if (waypointMarkersRef.current.length >= 2) {
      waypointMarkersRef.current.forEach(marker => {
        mapInstanceRef.current?.removeLayer(marker);
      });
      waypointMarkersRef.current = [];
    }
    
    setWaypoints(prev => {
      const newWaypoints = [...prev, clickPoint];
      
      // Create visual waypoint marker immediately
      const isStart = prev.length === 0;
      const markerColor = isStart ? '#22c55e' : '#ef4444'; // Green for start, Red for end
      const markerLabel = isStart ? 'A' : 'B';
      
      const waypointMarker = L.marker(clickPoint, {
        icon: L.divIcon({
          html: `
            <div style="
              background: ${markerColor}; 
              color: white;
              border-radius: 50%; 
              width: 40px; 
              height: 40px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold;
              font-size: 18px;
              border: 3px solid white;
              box-shadow: 0 4px 8px rgba(0,0,0,0.4);
              animation: bounce 0.5s ease;
            ">${markerLabel}</div>
            <style>
              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
            </style>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          className: 'routing-waypoint-marker'
        }),
        zIndexOffset: 1000 // Make sure waypoint markers appear above location markers
      });
      
      waypointMarker.bindPopup(`
        <div style="padding: 8px; font-family: Inter, sans-serif;">
          <h4 style="margin: 0; font-size: 14px; font-weight: bold; color: ${markerColor};">
            ${isStart ? '🚀 Start Point' : '🎯 End Point'}
          </h4>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">
            ${isStart ? 'Click another location for destination' : 'Route will be calculated'}
          </p>
        </div>
      `);
      
      waypointMarker.addTo(mapInstanceRef.current!);
      waypointMarkersRef.current.push(waypointMarker);
      
      // Limit to 2 waypoints for start/end
      let updatedWaypoints = newWaypoints;
      if (newWaypoints.length > 2) {
        // Remove the first waypoint marker when replacing
        const oldMarker = waypointMarkersRef.current.shift();
        if (oldMarker && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(oldMarker);
        }
        updatedWaypoints = [newWaypoints[1], clickPoint]; // Keep the last and new point
      }
      
      // Show toast notification AFTER state update (using setTimeout to defer)
      setTimeout(() => {
        if (isStart) {
          toast.success('📍 Start point selected! Click another location for destination', { duration: 2000 });
        } else {
          toast.success('🎯 End point selected! Calculating route...', { duration: 2000 });
        }
      }, 0);
      
      return updatedWaypoints;
    });
  }, [routingMode, enableRouting]);

  const handleClearRoute = useCallback(() => {
    setWaypoints([]);
    setRouteInfo(null);
    
    // Remove routing control
    if (routingControlRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }
    
    // Clear waypoint markers
    waypointMarkersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    waypointMarkersRef.current = [];
    
    toast.success('Route cleared', { duration: 1500 });
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      try {
        // Clear any existing map instance from the container
        if ((mapRef.current as any)._leaflet_id) {
          delete (mapRef.current as any)._leaflet_id;
        }

        // Set campus bounds - restrict map to Thapar campus area for better UX
        // VERSION: v7-large-campus-bounds-2024-10-14
        const bounds = L.latLngBounds(
          [MAP_CONFIG.center.lat - 0.015, MAP_CONFIG.center.lng - 0.018],  // Southwest (~1650m × 2000m)
          [MAP_CONFIG.center.lat + 0.015, MAP_CONFIG.center.lng + 0.018]   // Northeast (large campus area)
        );

        // Create map instance with bounds options
        const map = L.map(mapRef.current, {
          zoomControl: false,           // We'll add custom controls
          maxBounds: bounds,            // Restrict panning to campus area
          maxBoundsViscosity: 1.0       // Make bounds "sticky" - prevents panning outside
        }).setView(
          [MAP_CONFIG.center.lat, MAP_CONFIG.center.lng],
          MAP_CONFIG.zoom
        );

        // Add zoom control in bottom right
        L.control.zoom({
          position: 'bottomright'
        }).addTo(map);

        // Add tile layer
        const tileLayer = L.tileLayer(MAP_CONFIG.tileLayer.url, {
          attribution: MAP_CONFIG.tileLayer.attribution,
          maxZoom: MAP_CONFIG.maxZoom,
          minZoom: MAP_CONFIG.minZoom
        });
        
        tileLayer.addTo(map);

        mapInstanceRef.current = map;
        
        // Add click handler for routing
        map.on('click', handleMapClick);
        
        setIsMapLoaded(true);
        setMapError(null);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to load map. Please refresh the page.');
        toast.error('Failed to load map. Please refresh.');
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        mapInstanceRef.current = null;
        setIsMapLoaded(false);
      }
    };
  }, [handleMapClick]);

  // Handle routing when waypoints change
  useEffect(() => {
    if (!mapInstanceRef.current || !enableRouting || waypoints.length < 2) {
      return;
    }

    // Remove existing routing control
    if (routingControlRef.current) {
      mapInstanceRef.current.removeControl(routingControlRef.current);
    }

    try {
      // Create routing control with OpenRouteService
      routingControlRef.current = (L as any).Routing.control({
        waypoints: waypoints,
        routeWhileDragging: false,
        addWaypoints: false,
        // Don't create default markers - we handle them manually for better control
        createMarker: function() {
          return null; // Return null to prevent default markers
        },
        router: (L as any).Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'foot', // Walking routes for campus
        }),
        lineOptions: {
          styles: [
            { color: '#3b82f6', opacity: 0.8, weight: 6 },
            { color: '#ffffff', opacity: 0.9, weight: 4 }
          ]
        },
        show: false, // Hide the routing panel to keep UI clean
        collapsible: false
      }).on('routesfound', function(e: any) {
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const route = routes[0];
          const distance = (route.summary.totalDistance / 1000).toFixed(2) + ' km';
          const time = Math.round(route.summary.totalTime / 60) + ' min';
          const instructions = route.instructions?.map((instruction: any) => instruction.text) || [];
          
          setRouteInfo({ distance, time, instructions });
          toast.success(`Route found: ${distance}, ${time}`, { duration: 3000 });
        }
      }).on('routingerror', function(e: { error: { message: string } }) {
        console.error('Routing error:', e);
        toast.error('Could not find route between selected points');
        setRouteInfo(null);
      }).addTo(mapInstanceRef.current);

    } catch (error) {
      console.error('Error creating route:', error);
      toast.error('Error creating route. Please try again.');
    }
  }, [waypoints, enableRouting]);

  // Use the already filtered locations from props (no fallback - empty means show nothing)
  const filteredLocations = useMemo(() => {
    if (Array.isArray(locations)) return locations;
    return [];
  }, [locations]);

  // Update markers when locations or events change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

  // Add location markers
  filteredLocations.forEach(location => {
      if (location.coordinates) {
        // Find events at this location and check if any are ongoing
        const locationEvents = showEvents && Array.isArray(events) ? events.filter(event => {
          const eventLocId = typeof event.locationId === 'object' ? event.locationId._id : event.locationId;
          return eventLocId === location._id;
        }) : [];
        
        const hasEvents = locationEvents.length > 0;
        
        // Check if any event is currently ongoing
        const hasOngoingEvent = locationEvents.some(event => {
          const status = EventService.getEventStatus(event);
          return status === 'ongoing';
        });
        
        // Get type-specific emoji and color
        const emoji = MARKER_ICONS[location.type as keyof typeof MARKER_ICONS] || '📍';
        // Vibrant colors for better visibility - LARGER sizes for event locations
        const markerSize = hasEvents ? 32 : 24; // Bigger for events
        const iconSize = hasEvents ? 18 : 14; // Bigger emoji for events
        
        const typeColors: Record<string, string> = {
          'hostel': '#fbbf24',       // Vibrant yellow
          'class': '#3b82f6',        // Vibrant blue
          'faculty': '#a855f7',      // Vibrant purple
          'entertainment': '#ec4899', // Vibrant pink
          'shop': '#f97316',         // Vibrant orange
          'parking': '#9ca3af',      // Gray
          'medical': '#ef4444',      // Red
          'sports': '#22c55e',       // Bright green
          'eatables': '#f59e0b',     // Amber
          'religious': '#8b5cf6'     // Purple
        };
        const borderColors: Record<string, string> = {
          'hostel': '#d97706',       // Dark yellow
          'class': '#1e40af',        // Dark blue
          'faculty': '#7c3aed',      // Dark purple
          'entertainment': '#be185d', // Dark pink
          'shop': '#c2410c',         // Dark orange
          'parking': '#4b5563',      // Dark gray
          'medical': '#b91c1c',      // Dark red
          'sports': '#15803d',       // Dark green
          'eatables': '#c2410c',     // Dark amber
          'religious': '#6b21a8'     // Dark purple
        };
        const baseColor = typeColors[location.type] || '#3b82f6';
        const borderColor = borderColors[location.type] || '#1e40af';
        
        // Different glow effects: ONGOING = pulsing green, UPCOMING = steady blue
        let boxShadow = '0 4px 8px rgba(0, 0, 0, 0.4)';
        let eventBorderColor = borderColor;
        let animationClass = '';
        
        if (hasOngoingEvent) {
          // ONGOING: Strong pulsing green glow
          boxShadow = '0 0 0 8px rgba(16, 185, 129, 0.9), 0 0 30px 6px rgba(16, 185, 129, 0.8), 0 4px 12px rgba(0, 0, 0, 0.4)';
          eventBorderColor = '#10b981';
          animationClass = 'ongoing-event-pulse';
        } else if (hasEvents) {
          // UPCOMING: Steady blue glow
          boxShadow = '0 0 0 6px rgba(59, 130, 246, 0.8), 0 0 20px 4px rgba(59, 130, 246, 0.6), 0 4px 8px rgba(0, 0, 0, 0.3)';
          eventBorderColor = '#3b82f6';
        }
        
        // Create teardrop-shaped custom icon with enhanced visibility for events
        const customIcon = L.divIcon({
          html: `
            <div class="location-marker ${animationClass}" style="
              background: ${baseColor}; 
              width: ${markerSize}px; 
              height: ${markerSize}px; 
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex; 
              align-items: center; 
              justify-content: center; 
              box-shadow: ${boxShadow};
              border: ${hasEvents ? 5 : 4}px solid ${eventBorderColor};
              cursor: pointer;
              transition: all 0.3s ease;
            ">
              <span style="
                transform: rotate(45deg);
                font-size: ${iconSize}px;
              ">${emoji}</span>
            </div>
          `,
          iconSize: [markerSize + 4, markerSize + 4],
          iconAnchor: [(markerSize + 4) / 2, (markerSize + 4) / 2],
          className: 'custom-leaflet-marker'
        });

        const marker = L.marker([location.coordinates.lat, location.coordinates.lng], {
          icon: customIcon
        });

        // Build events HTML
        let eventsHTML = '';
        if (locationEvents.length > 0) {
          eventsHTML = `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              <h4 style="font-size: 13px; font-weight: 600; color: #374151; margin: 0 0 8px 0;">📅 Events at this Location (${locationEvents.length})</h4>
              ${locationEvents.slice(0, 3).map(event => {
                const eventStatus = EventService.getEventStatus(event);
                const statusColor = eventStatus === 'ongoing' ? '#10b981' : '#3b82f6';
                const statusLabel = eventStatus === 'ongoing' ? 'LIVE NOW' : 'UPCOMING';
                return `
                  <div style="margin-bottom: 8px; padding: 8px; background: #f9fafb; border-radius: 6px; border-left: 3px solid ${statusColor};">
                    <div style="font-size: 12px; font-weight: 600; color: #111827; margin-bottom: 2px;">${event.title}</div>
                    <div style="font-size: 11px; color: #6b7280;">
                      <span style="color: ${statusColor}; font-weight: 600;">${statusLabel}</span> • 
                      ${new Date(event.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                      at ${new Date(event.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                `;
              }).join('')}
              ${locationEvents.length > 3 ? `<div style="font-size: 11px; color: #6b7280; margin-top: 4px;">+${locationEvents.length - 3} more event${locationEvents.length - 3 > 1 ? 's' : ''}</div>` : ''}
            </div>
          `;
        }

        // Add popup with improved styling
        marker.bindPopup(`
          <div style="padding: 12px; min-width: 200px; font-family: Inter, sans-serif;">
            <h3 style="font-size: 16px; font-weight: bold; margin: 0 0 8px 0; color: #1f2937;">${location.name}</h3>
            <p style="font-size: 14px; color: #6b7280; margin: 0 0 12px 0; line-height: 1.4;">${location.description || 'No description available'}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${location.type}</span>
              ${location.floor ? 
                `<span style="font-size: 12px; color: #6b7280;">Floor: ${location.floor}</span>` : ''}
            </div>
            ${eventsHTML}
          </div>
        `, {
          closeButton: true,
          maxWidth: 300
        });

        // Add click handler
        marker.on('click', () => {
          handleLocationSelect(location);
        });

        marker.addTo(mapInstanceRef.current!);
        markersRef.current.push(marker);
      }
    });

    // Add event markers (if provided)
    if (showEvents && Array.isArray(events) && events.length > 0) {
      // Filter to show only upcoming and ongoing events (exclude completed and cancelled)
      const activeEvents = events.filter(event => {
        if (event.status === 'cancelled') return false;
        const status = EventService.getEventStatus(event);
        return status === 'upcoming' || status === 'ongoing';
      });
      
      // Clear existing event markers
      eventMarkersRef.current.forEach(marker => {
        mapInstanceRef.current?.removeLayer(marker);
      });
      eventMarkersRef.current = [];

      activeEvents.forEach((event: Event) => {
        // Get coordinates from event's location
        let coords: Location['coordinates'] | undefined;
        
        // Check if locationId is populated as a Location object
        if (event.locationId && typeof event.locationId === 'object' && 'coordinates' in event.locationId) {
          coords = event.locationId.coordinates;
        }
        
        if (!coords) return; // Skip if no valid coordinates

        // Create custom icon for events (different from locations)
        const eventIcon = L.divIcon({
          html: `
            <div style="
              background: linear-gradient(135deg, #ec4899, #8b5cf6); 
              border-radius: 50%; 
              width: 38px; 
              height: 38px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              border: 3px solid white; 
              font-size: 20px;
              box-shadow: 0 3px 8px rgba(236, 72, 153, 0.4);
              cursor: pointer;
              transition: transform 0.2s;
            " 
            onmouseover="this.style.transform='scale(1.1)'"
            onmouseout="this.style.transform='scale(1)'">�</div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
          popupAnchor: [0, -19],
          className: 'custom-event-marker'
        });

        const marker = L.marker([coords.lat, coords.lng], { icon: eventIcon });

        // Format date/time
        const eventDate = new Date(event.dateTime);
        const formattedDate = eventDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        const formattedTime = eventDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        // Calculate available spots
        const registeredCount = event.attendees?.length || 0;
        const availableSpots = event.capacity - registeredCount;
        const isFull = availableSpots <= 0;

        // Create enhanced popup
        marker.bindPopup(`
          <div style="padding: 14px; min-width: 220px; max-width: 280px; font-family: Inter, sans-serif;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
              <span style="font-size: 22px;">🎉</span>
              <h3 style="font-size: 16px; font-weight: 700; margin: 0; color: #1f2937; flex: 1;">${event.title}</h3>
            </div>
            
            <p style="font-size: 13px; color: #4b5563; margin: 0 0 12px 0; line-height: 1.5;">${event.description || 'No description available'}</p>
            
            <div style="background: #f3f4f6; border-radius: 6px; padding: 10px; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                <span style="font-size: 14px;">📅</span>
                <span style="font-size: 13px; color: #374151; font-weight: 500;">${formattedDate}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 14px;">⏰</span>
                <span style="font-size: 13px; color: #374151; font-weight: 500;">${formattedTime}</span>
              </div>
            </div>
            
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
              <span style="background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${event.category}</span>
              ${isFull ? 
                '<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">FULL</span>' :
                `<span style="background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">${availableSpots} spots left</span>`
              }
            </div>
            
            ${typeof event.locationId === 'object' && event.locationId.name ? 
              `<div style="font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 4px;">
                <span>📍</span>
                <span>${event.locationId.name}</span>
              </div>` : ''
            }
          </div>
        `, {
          closeButton: true,
          maxWidth: 280,
          className: 'event-popup'
        });

        // Add click handler for event selection
        if (onEventSelect) {
          marker.on('click', () => {
            onEventSelect(event);
          });
        }

        marker.addTo(mapInstanceRef.current!);
        eventMarkersRef.current.push(marker);
      });
    }
  }, [filteredLocations, events, handleLocationSelect, onEventSelect, showEvents, routingMode]);

  // Handle selected location
  useEffect(() => {
    if (selectedLocation && selectedLocation.coordinates && mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [selectedLocation.coordinates.lat, selectedLocation.coordinates.lng],
        18
      );
    }
  }, [selectedLocation]);

  // Change map style (unused for now, kept for future feature)
  // Commented out to avoid unused variable warnings
  /*
  const changeMapStyle = (style: 'default' | 'satellite' | 'dark' | 'terrain') => {
    if (!mapInstanceRef.current) return;

    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current?.removeLayer(layer);
      }
    });

    let tileConfig = MAP_CONFIG.tileLayer;
    if (style !== 'default') {
      tileConfig = MAP_CONFIG.alternativeTiles[style];
    }

    const tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: MAP_CONFIG.maxZoom,
      minZoom: MAP_CONFIG.minZoom
    });

    tileLayer.addTo(mapInstanceRef.current);
    setMapStyle(style);
  };
  */

  // Helper function to get turn icon from instruction text
  const getTurnIcon = (instruction: string): string => {
    const lower = instruction.toLowerCase();
    if (lower.includes('left')) return '⬅️';
    if (lower.includes('right')) return '➡️';
    if (lower.includes('arrive') || lower.includes('destination')) return '🏁';
    if (lower.includes('continue') || lower.includes('straight')) return '⬆️';
    return '🧭';
  };

  // Reset step index when route changes
  useEffect(() => {
    if (routeInfo) {
      setCurrentStepIndex(0);
    }
  }, [routeInfo]);

  return (
    <div className={`relative ${className}`}>
      {/* Enhanced Navigation Bar with Inline Directions */}
      {enableRouting && routingMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] rounded-xl shadow-2xl backdrop-blur-md max-w-2xl w-full mx-4" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)'
        }}>
          <div className="px-4 py-3">
            {/* Waiting for waypoints */}
            {waypoints.length === 0 && (
              <p className="text-sm font-medium text-white text-center">
                🗺️ Click on the map to set a starting point
              </p>
            )}
            
            {/* Waiting for destination */}
            {waypoints.length === 1 && (
              <p className="text-sm font-medium text-white text-center">
                📍 Click on the map to set the destination
              </p>
            )}
            
            {/* Calculating route */}
            {waypoints.length === 2 && !routeInfo && (
              <p className="text-sm font-medium text-white text-center">
                ⏳ Calculating route...
              </p>
            )}
            
            {/* Route found - show inline directions */}
            {waypoints.length === 2 && routeInfo && (
              <div className="space-y-2">
                {/* Route Summary */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white">
                    <span className="text-lg">🧭</span>
                    <span className="font-semibold text-sm">
                      {routeInfo.distance} • {routeInfo.time}
                    </span>
                    {routeInfo.instructions && routeInfo.instructions.length > 0 && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        Step {currentStepIndex + 1} of {routeInfo.instructions.length}
                      </span>
                    )}
                  </div>
                  <button
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                    title="Clear route"
                    aria-label="Clear current route"
                    onClick={handleClearRoute}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Current Turn Instruction */}
                {routeInfo.instructions && routeInfo.instructions.length > 0 && (
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                    <span className="text-2xl flex-shrink-0">
                      {getTurnIcon(routeInfo.instructions[currentStepIndex])}
                    </span>
                    <p className="text-sm text-white font-medium flex-1 truncate">
                      {routeInfo.instructions[currentStepIndex]}
                    </p>
                    {routeInfo.instructions.length > 1 && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                          disabled={currentStepIndex === 0}
                          className="text-white/80 hover:text-white hover:bg-white/20 rounded p-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Previous step"
                          aria-label="Previous navigation step"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentStepIndex(Math.min(routeInfo.instructions.length - 1, currentStepIndex + 1))}
                          disabled={currentStepIndex === routeInfo.instructions.length - 1}
                          className="text-white/80 hover:text-white hover:bg-white/20 rounded p-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Next step"
                          aria-label="Next navigation step"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Clear route button for non-route states */}
          {waypoints.length > 0 && waypoints.length < 2 && (
            <div className="absolute top-3 right-3">
              <button
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                title="Clear route"
                aria-label="Clear current route"
                onClick={handleClearRoute}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search Results Counter with Accessibility */}
    <div 
      className={`absolute top-4 z-[1000] rounded-lg shadow-xl px-3 py-2 ${
        enableRouting ? 'right-4' : 'left-4'
      }`}
      style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(59, 130, 246, 0.95))',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(10px)'
      }}
      role="status"
      aria-live="polite"
      aria-label={`Search results: ${(Array.isArray(filteredLocations) ? filteredLocations.length : 0)} location${(Array.isArray(filteredLocations) ? filteredLocations.length : 0) !== 1 ? 's' : ''} found`}
    >
        <span className="text-sm font-semibold text-white">
      {(Array.isArray(filteredLocations) ? filteredLocations.length : 0)} location{(Array.isArray(filteredLocations) ? filteredLocations.length : 0) !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Loading State with Accessibility */}
      {!isMapLoaded && !mapError && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-[2000]"
          style={{
            background: 'linear-gradient(135deg, #fffef7 0%, #fffcf5 50%, #fffbf0 100%)'
          }}
          role="status"
          aria-live="polite"
          aria-label="Loading campus map"
        >
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-8 w-8 mx-auto mb-2"
              style={{
                border: '3px solid transparent',
                borderTop: '3px solid #10b981',
                borderRight: '3px solid #3b82f6'
              }}
              aria-hidden="true"
            />
            <p className="font-medium text-sm" style={{
              background: 'linear-gradient(90deg, #10b981, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Loading campus map...</p>
          </div>
        </div>
      )}

      {/* Error State with Accessibility */}
      {mapError && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-[2000]"
          style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
          }}
          role="alert"
          aria-live="assertive"
          aria-label={`Map error: ${mapError}`}
        >
          <div className="text-center">
            <div className="text-red-600 text-xl mb-2" aria-hidden="true">⚠️</div>
            <p className="text-red-600 text-sm">{mapError}</p>
          </div>
        </div>
      )}

      {/* Map Container with Accessibility */}
      <div 
        key="map-v7-large-bounds-final"
        ref={mapRef} 
        className="w-full h-full overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #fffef7 0%, #fffcf5 50%, #fffbf0 100%)',
          minHeight: '500px',
          position: 'relative'
        }}
        role="img"
        aria-label="Interactive campus map showing locations and events"
        tabIndex={0}
        onKeyDown={(e) => {
          // Allow map to receive focus for keyboard navigation
          if (e.key === 'Enter') {
            e.preventDefault();
            mapRef.current?.focus();
          }
        }}
        style={{ 
          minHeight: '500px',
          height: '100%',
          background: '#f8fafc'
        }}
      />
    </div>
  );
});

LeafletMap.displayName = 'LeafletMap';

export default LeafletMap;
