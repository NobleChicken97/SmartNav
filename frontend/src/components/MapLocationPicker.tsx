/**
 * MapLocationPicker - Interactive map for selecting location coordinates
 * Click anywhere on the map to set the coordinates
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapLocationPickerProps {
  coordinates: { lat: number; lng: number };
  onCoordinatesChange: (lat: number, lng: number) => void;
  locationType?: 'hostel' | 'class' | 'faculty' | 'entertainment' | 'shop' | 'parking' | 'medical' | 'sports' | 'eatables' | 'religious';
}

const MapLocationPicker = ({ coordinates, onCoordinatesChange, locationType = 'hostel' }: MapLocationPickerProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const getCustomIcon = (type: string) => {
    const iconStyles: Record<string, { color: string; emoji: string }> = {
      hostel: { color: '#fef3c7', emoji: '🏠' },      // Light yellow
      class: { color: '#dbeafe', emoji: '🎓' },       // Light blue
      faculty: { color: '#e9d5ff', emoji: '👨‍🏫' },    // Light purple
      entertainment: { color: '#fce7f3', emoji: '🎭' }, // Light pink
      shop: { color: '#fed7aa', emoji: '🛒' },        // Light orange
      parking: { color: '#e5e7eb', emoji: '🅿️' },     // Light gray
      medical: { color: '#fee2e2', emoji: '🏥' },     // Light red
      sports: { color: '#d1fae5', emoji: '⚽' },      // Light green
      eatables: { color: '#fef3c7', emoji: '🍽️' },   // Light amber
      religious: { color: '#ede9fe', emoji: '🕌' },   // Light purple
    };

    const borderColors: Record<string, string> = {
      hostel: '#15803d',      // Dark green
      class: '#1e40af',       // Dark blue
      faculty: '#6b21a8',     // Dark purple
      entertainment: '#be185d', // Dark pink
      shop: '#c2410c',        // Dark orange
      parking: '#4b5563',     // Dark gray
      medical: '#b91c1c',     // Dark red
      sports: '#15803d',      // Dark green
      eatables: '#c2410c',    // Dark amber
      religious: '#6b21a8',   // Dark purple
    };

    const style = iconStyles[type] || iconStyles.hostel;
    const borderColor = borderColors[type] || borderColors.hostel;

    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background: ${style.color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
        border: 3px solid ${borderColor};
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 16px;
        ">${style.emoji}</span>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map centered on Thapar campus
    const map = L.map(mapContainerRef.current, {
      center: [coordinates.lat, coordinates.lng],
      zoom: 16,
      zoomControl: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add initial marker with custom icon
    const marker = L.marker([coordinates.lat, coordinates.lng], {
      icon: getCustomIcon(locationType),
      draggable: true,
    }).addTo(map);

    // Handle marker drag
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onCoordinatesChange(pos.lat, pos.lng);
    });

    // Handle map click to place marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onCoordinatesChange(lat, lng);
      
      // Pan to new location
      map.panTo([lat, lng]);
    });

    mapRef.current = map;
    markerRef.current = marker;

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker position when coordinates change externally
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([coordinates.lat, coordinates.lng]);
      mapRef.current.setView([coordinates.lat, coordinates.lng], mapRef.current.getZoom());
    }
  }, [coordinates]);

  // Update marker icon when location type changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(getCustomIcon(locationType));
    }
  }, [locationType]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ width: '100%', height: '100%' }}
      className="rounded-md"
    />
  );
};

export default MapLocationPicker;
