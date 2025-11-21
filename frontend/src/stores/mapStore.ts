import { create } from 'zustand';
import { Location } from '../types';

interface CameraPreset {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  heading?: number;
  tilt?: number;
}

interface MapState {
  isMapLoaded: boolean;
  selectedLocation: Location | null;
  searchQuery: string;
  filteredLocations: Location[] | null;
  activeFilters: {
    category: string[];
  };
  cameraPresets: CameraPreset[];
  currentPreset: string | null;
  showLayer3D: boolean;
  showLayerSatellite: boolean;
  showLayerTraffic: boolean;
  overlayConfig: {
    glbModelUrl: string | null;
    scale: number;
    rotation: { x: number; y: number; z: number };
    position: { lat: number; lng: number; altitude: number };
  };
}

interface MapActions {
  setMapLoaded: (loaded: boolean) => void;
  setSelectedLocation: (location: Location | null) => void;
  setSearchQuery: (query: string) => void;
  setFilteredLocations: (locations: Location[] | null) => void;
  updateFilters: (filters: Partial<MapState['activeFilters']>) => void;
  clearFilters: () => void;
  setCameraPreset: (presetId: string) => void;
  addCameraPreset: (preset: CameraPreset) => void;
  removeCameraPreset: (presetId: string) => void;
  toggleLayer: (layer: '3d' | 'satellite' | 'traffic') => void;
  updateOverlayConfig: (config: Partial<MapState['overlayConfig']>) => void;
  resetMap: () => void;
}

type MapStore = MapState & MapActions;

// Default camera presets for Thapar Institute
const defaultPresets: CameraPreset[] = [
  {
    id: 'campus-overview',
    name: 'Campus Overview',
    lat: 30.3557,
    lng: 76.3675,
    zoom: 16,
    heading: 0,
    tilt: 0,
  },
  {
    id: 'main-gate',
    name: 'Main Gate',
    lat: 30.3565,
    lng: 76.3660,
    zoom: 18,
    heading: 90,
    tilt: 45,
  },
  {
    id: 'academic-block',
    name: 'Academic Block',
    lat: 30.3555,
    lng: 76.3680,
    zoom: 17,
    heading: 180,
    tilt: 30,
  },
  {
    id: 'hostels',
    name: 'Hostel Area',
    lat: 30.3540,
    lng: 76.3690,
    zoom: 16,
    heading: 270,
    tilt: 15,
  },
];

export const useMapStore = create<MapStore>((set, get) => ({
  // Initial state
  isMapLoaded: false,
  selectedLocation: null,
  searchQuery: '',
  filteredLocations: null,
  activeFilters: {
    category: [],
  },
  cameraPresets: defaultPresets,
  currentPreset: null,
  showLayer3D: false,
  showLayerSatellite: false,
  showLayerTraffic: false,
  overlayConfig: {
    glbModelUrl: null,
    scale: 1,
    rotation: { x: 0, y: 0, z: 0 },
    position: { lat: 30.3557, lng: 76.3675, altitude: 0 },
  },

  // Actions
  setMapLoaded: (loaded: boolean) => {
    set({ isMapLoaded: loaded });
  },

  setSelectedLocation: (location: Location | null) => {
    set({ selectedLocation: location });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setFilteredLocations: (locations: Location[] | null) => {
    set({ filteredLocations: locations });
  },

  updateFilters: (filters: Partial<MapState['activeFilters']>) => {
    const currentFilters = get().activeFilters;
    set({
      activeFilters: {
        ...currentFilters,
        ...filters,
      },
    });
  },

  clearFilters: () => {
    set({
      activeFilters: {
        category: [],
        accessibility: false,
      },
      filteredLocations: null,
      searchQuery: '',
    });
  },

  setCameraPreset: (presetId: string) => {
    set({ currentPreset: presetId });
  },

  addCameraPreset: (preset: CameraPreset) => {
    const currentPresets = get().cameraPresets;
    set({
      cameraPresets: [...currentPresets, preset],
    });
  },

  removeCameraPreset: (presetId: string) => {
    const currentPresets = get().cameraPresets;
    set({
      cameraPresets: currentPresets.filter(p => p.id !== presetId),
    });
  },

  toggleLayer: (layer: '3d' | 'satellite' | 'traffic') => {
    const state = get();
    switch (layer) {
      case '3d':
        set({ showLayer3D: !state.showLayer3D });
        break;
      case 'satellite':
        set({ showLayerSatellite: !state.showLayerSatellite });
        break;
      case 'traffic':
        set({ showLayerTraffic: !state.showLayerTraffic });
        break;
    }
  },

  updateOverlayConfig: (config: Partial<MapState['overlayConfig']>) => {
    const currentConfig = get().overlayConfig;
    set({
      overlayConfig: {
        ...currentConfig,
        ...config,
      },
    });
  },

  resetMap: () => {
    set({
      selectedLocation: null,
      searchQuery: '',
      filteredLocations: null,
      activeFilters: {
        category: [],
        accessibility: false,
      },
      currentPreset: null,
    });
  },
}));
