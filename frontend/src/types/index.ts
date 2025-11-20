import * as L from 'leaflet';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface PaginationMeta {
  current: number;
  pages: number;
  total: number;
}

// User types
export interface User {
  _id: string;
  uid?: string; // Firebase UID (optional for backward compatibility)
  name: string;
  email: string;
  interests: string[];
  role: 'student' | 'organizer' | 'admin';
  photoURL?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  interests: string[];
}

// Location types
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  _id: string;
  name: string;
  description?: string;
  type: 'hostel' | 'class' | 'faculty' | 'entertainment' | 'shop' | 'parking' | 'medical' | 'sports' | 'eatables' | 'religious';
  coordinates: Coordinates;
  buildingId?: string;
  floor?: number | string;
  tags: string[];
  meta?: Record<string, unknown>;
  accessibility?: {
    wheelchairAccessible: boolean;
    elevatorAccess?: boolean;
    brailleSignage?: boolean;
    audioAssistance?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LocationFormData {
  name: string;
  description?: string;
  type: 'hostel' | 'class' | 'faculty' | 'entertainment' | 'shop' | 'parking' | 'medical' | 'sports' | 'eatables' | 'religious';
  coordinates: Coordinates;
  buildingId?: string;
  floor?: number | string;
  tags: string[];
  meta?: Record<string, unknown>;
  accessibility?: {
    wheelchairAccessible: boolean;
    elevatorAccess?: boolean;
    brailleSignage?: boolean;
    audioAssistance?: boolean;
  };
}

export type CreateLocationData = LocationFormData;

export type UpdateLocationData = Partial<LocationFormData>;

export interface LocationFilters {
  q?: string;
  type?: 'hostel' | 'class' | 'faculty' | 'entertainment' | 'shop';
  north?: number;
  south?: number;
  east?: number;
  west?: number;
  limit?: number;
  page?: number;
}

// Event types
export interface Event {
  _id: string;
  title: string;
  description: string;
  category: EventCategory;
  locationId: Location | string;
  dateTime: string;
  endDateTime?: string; // End date and time for the event (optional for backward compatibility)
  capacity: number;
  attendees: EventAttendee[];
  tags: string[];
  organizer: string;
  createdBy: string | User; // Creator user ID or populated User object
  status: EventStatus;
  availableSpots?: number;
  isFull?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EventCategory = 
  | 'academic' 
  | 'cultural' 
  | 'sports' 
  | 'workshop' 
  | 'seminar' 
  | 'conference' 
  | 'social' 
  | 'other';

export type EventStatus = 'draft' | 'published' | 'cancelled';

export interface EventAttendee {
  userId: string;
  registeredAt: string;
}

export interface EventFormData {
  title: string;
  description: string;
  category: EventCategory;
  locationId: string;
  dateTime: string;
  endDateTime: string; // End date and time for the event
  capacity: number;
  organizer: string;
  tags: string[];
  status?: EventStatus; // Optional for create, can be set for edit
}

export interface EventFilters {
  q?: string;
  category?: EventCategory;
  startDate?: string;
  endDate?: string;
  locationId?: string;
  upcoming?: boolean;
  limit?: number;
  page?: number;
}

// Map types
export interface MapConfig {
  center: Coordinates;
  zoom: number;
  tilt?: number;
  heading?: number;
}

export interface CameraPreset {
  name: string;
  center: Coordinates;
  zoom: number;
  tilt: number;
  heading: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MarkerData {
  id: string;
  position: Coordinates;
  title: string;
  type: 'location' | 'event';
  data: Location | Event;
}

// 3D Overlay types
export interface OverlayConfig {
  modelUrl: string;
  anchor: {
    lat: number;
    lng: number;
    altitude: number;
  };
  scale: number;
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  headingOffset: number;
}

// UI types
export interface LayerToggle {
  id: string;
  name: string;
  enabled: boolean;
  icon?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'location' | 'event';
  coordinates?: Coordinates;
  data: Location | Event;
}

export interface DirectionsRequest {
  origin: Coordinates | string;
  destination: Coordinates | string;
  travelMode?: 'walking' | 'driving' | 'cycling' | 'transit';
}

// Store types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  csrfToken: string | null;
}

export interface MapState {
  map: L.Map | null;
  isLoaded: boolean;
  activePreset: string | null;
  bounds: MapBounds | null;
  is3DEnabled: boolean;
  layers: {
    locations: boolean;
    events: boolean;
  };
}

export interface UIState {
  sidebarOpen: boolean;
  activePanel: string | null;
  searchQuery: string;
  selectedLocation: Location | null;
  selectedEvent: Event | null;
}

// Form types
export interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  helpText?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// CSV Import types
export interface CSVImportResult {
  imported: number;
  errors?: string[];
  locations: Location[];
}

// Hook types
export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseFormResult<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
  handleSubmit: (onSubmit: (values: T) => Promise<void>) => Promise<void>;
  reset: () => void;
}

// Leaflet types
declare global {
  interface Window {
    L: typeof L;
  }
}

export interface LeafletMapConfig {
  center: Coordinates;
  zoom: number;
  maxZoom: number;
  minZoom: number;
}

export interface MapInstance {
  map: L.Map;
  markers: L.Marker[];
  popups: L.Popup[];
  overlay: unknown | null;
}

export interface CameraPreset {
  name: string;
  center: Coordinates;
  zoom: number;
  tilt: number;
  heading: number;
}

export interface ThreeOverlayConfig {
  enabled: boolean;
  modelUrl?: string;
  scale?: number;
  position?: Coordinates;
  rotation?: {
    x: number;
    y: number;
    z: number;
  };
}
