/**
 * LocationEditor - Modal for creating and editing locations
 * Simple interface: name, type, description, and map-based coordinate picker
 */

import { useState, useEffect } from 'react';
import { Location, CreateLocationData, UpdateLocationData } from '../types';
import MapLocationPicker from './MapLocationPicker.tsx';

interface LocationEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateLocationData | UpdateLocationData) => Promise<void>;
  location?: Location | null;
  title?: string;
}

const LOCATION_TYPES = [
  { value: 'hostel', label: '🏠 Hostel', emoji: '🏠' },
  { value: 'class', label: '🎓 Class', emoji: '🎓' },
  { value: 'faculty', label: '👨‍🏫 Faculty', emoji: '👨‍🏫' },
  { value: 'entertainment', label: '🎭 Entertainment', emoji: '🎭' },
  { value: 'shop', label: '🛒 Shop', emoji: '🛒' },
  { value: 'parking', label: '🅿️ Parking', emoji: '🅿️' },
  { value: 'medical', label: '🏥 Medical', emoji: '🏥' },
  { value: 'sports', label: '⚽ Sports', emoji: '⚽' },
  { value: 'eatables', label: '🍽️ Eatables', emoji: '🍽️' },
  { value: 'religious', label: '🕌 Religious', emoji: '🕌' },
  { value: 'bank', label: '🏦 Bank', emoji: '🏦' },
];

const LocationEditor = ({ isOpen, onClose, onSave, location, title }: LocationEditorProps) => {
  const [formData, setFormData] = useState<CreateLocationData>({
    name: '',
    type: 'hostel',
    description: '',
    coordinates: { lat: 30.3548, lng: 76.3646 }, // Default: Thapar campus center
    tags: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with location data if editing
  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        type: location.type,
        description: location.description || '',
        coordinates: location.coordinates,
        tags: location.tags || [],
      });
    } else {
      // Reset form for new location
      setFormData({
        name: '',
        type: 'hostel',
        description: '',
        coordinates: { lat: 30.3548, lng: 76.3646 },
        tags: [],
      });
    }
    setError(null);
  }, [location, isOpen]);

  const handleCoordinatesChange = (coords: { lat: number; lng: number }) => {
    setFormData(prev => ({
      ...prev,
      coordinates: coords
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Location name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {title || (location ? 'Edit Location' : 'New Location')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Left Column - Form Fields */}
            <div className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Location Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="e.g., Hostel A, Library, Sports Complex"
                />
              </div>

              {/* Location Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Location['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {LOCATION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Optional description..."
                />
              </div>

              {/* Coordinates Display */}
              <div className="bg-white rounded-md p-4 border-2 border-blue-400 shadow-sm">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">📍 Coordinates</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-700 font-medium mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.coordinates.lat}
                      onChange={(e) => handleCoordinatesChange({ lat: parseFloat(e.target.value), lng: formData.coordinates.lng })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 font-medium mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.coordinates.lng}
                      onChange={(e) => handleCoordinatesChange({ lat: formData.coordinates.lat, lng: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-3 font-medium">
                  💡 Click on the map to set coordinates automatically
                </p>
              </div>
            </div>

            {/* Right Column - Map Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 Location on Map *
              </label>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <MapLocationPicker
                  coordinates={formData.coordinates}
                  onCoordinatesChange={handleCoordinatesChange}
                  locationType={formData.type}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationEditor;
