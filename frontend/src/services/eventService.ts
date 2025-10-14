import { apiClient } from './apiClient';
import { Event, EventFormData } from '../types';

interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  totalPages: number;
}

interface EventFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  locationId?: string;
  upcoming?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'dateTime' | 'title' | 'category' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class EventService {
  static async getEvents(filters?: EventFilters): Promise<EventsResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.category) {
        params.append('category', filters.category);
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters.locationId) {
        params.append('locationId', filters.locationId);
      }
      if (filters.upcoming !== undefined) {
        params.append('upcoming', String(filters.upcoming));
      }
  if (filters.search) params.append('q', filters.search);
      if (filters.page) {
        params.append('page', String(filters.page));
      }
      if (filters.limit) {
        params.append('limit', String(filters.limit));
      }
      if (filters.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      if (filters.sortOrder) {
        params.append('sortOrder', filters.sortOrder);
      }
    }

    const queryString = params.toString();
    const url = queryString ? `/events?${queryString}` : '/events';

    const raw = await apiClient.get<{ success: boolean; data: { events: Event[]; pagination: { current: number; pages: number; total: number } } }>(url);
    const { events, pagination } = raw.data;
    return {
      events,
      page: pagination.current,
      totalPages: pagination.pages,
      total: pagination.total,
    };
  }

  static async getEventById(id: string): Promise<Event> {
    return apiClient.get<Event>(`/events/${id}`);
  }

  static async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    const raw = await apiClient.get<{ success: boolean; data: { events: Event[] } }>(`/events?upcoming=true&limit=${limit}`);
    return raw.data.events;
  }

  static async getEventsByCategory(category: string): Promise<Event[]> {
    const raw = await apiClient.get<{ success: boolean; data: { events: Event[] } }>(`/events?category=${category}`);
    return raw.data.events;
  }

  static async getEventsByLocation(locationId: string): Promise<Event[]> {
    const raw = await apiClient.get<{ success: boolean; data: { events: Event[] } }>(`/events?locationId=${locationId}`);
    return raw.data.events;
  }

  static async searchEvents(query: string): Promise<Event[]> {
    const raw = await apiClient.get<{ success: boolean; data: { events: Event[] } }>(`/events?q=${encodeURIComponent(query)}`);
    return raw.data.events;
  }

  static async createEvent(data: EventFormData): Promise<Event> {
    return apiClient.post<Event>('/events', data);
  }

  static async updateEvent(id: string, data: Partial<EventFormData>): Promise<Event> {
    return apiClient.put<Event>(`/events/${id}`, data);
  }

  static async deleteEvent(id: string): Promise<void> {
    return apiClient.delete(`/events/${id}`);
  }

  static async registerForEvent(id: string): Promise<Event> {
    return apiClient.post<Event>(`/events/${id}/register`);
  }

  static async unregisterFromEvent(id: string): Promise<Event> {
    return apiClient.delete<Event>(`/events/${id}/register`);
  }

  static async getRegisteredEvents(): Promise<Event[]> {
    const raw = await apiClient.get<{ success: boolean; data: { events: Event[] } }>('/events/registered');
    return raw.data.events;
  }

  /**
   * Get events created by the current user (organizer's events)
   */
  static async getMyEvents(): Promise<Event[]> {
    const raw = await apiClient.get<{ success: boolean; data: { events: Event[] } }>('/events/my-events');
    return raw.data.events;
  }

  static async getEventAttendees(id: string): Promise<unknown[]> {
    const raw = await apiClient.get<{ success: boolean; data: { attendees: unknown[] } }>(`/events/${id}/attendees`);
    return raw.data.attendees;
  }

  static async getRecommendedEvents(limit: number = 5): Promise<Event[]> {
    const raw = await apiClient.get<{ success: boolean; data: { events: Event[] } }>(`/events/recommended?limit=${limit}`);
    return raw.data.events;
  }

  // Utility methods
  static isEventUpcoming(event: Event): boolean {
    return new Date(event.dateTime) > new Date();
  }

  static isEventToday(event: Event): boolean {
    const eventDate = new Date(event.dateTime);
    const today = new Date();
    return (
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  }

  static getEventStatus(event: Event): 'upcoming' | 'ongoing' | 'completed' {
    const now = new Date();
    const eventDate = new Date(event.dateTime);
    
    if (eventDate > now) {
      return 'upcoming';
    } else if (eventDate.getDate() === now.getDate()) {
      return 'ongoing';
    } else {
      return 'completed';
    }
  }

  static formatEventDateTime(event: Event): {
    date: string;
    time: string;
    fullDateTime: string;
  } {
    const eventDate = new Date(event.dateTime);
    
    return {
      date: eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: eventDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      fullDateTime: eventDate.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }

  static getAvailableSpots(event: Event): number {
    return Math.max(0, event.capacity - event.attendees.length);
  }

  static isEventFull(event: Event): boolean {
    return this.getAvailableSpots(event) === 0;
  }

  static sortEventsByDate(events: Event[], ascending: boolean = true): Event[] {
    return events.sort((a, b) => {
      const dateA = new Date(a.dateTime).getTime();
      const dateB = new Date(b.dateTime).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  static filterEventsByDate(events: Event[], startDate?: Date, endDate?: Date): Event[] {
    return events.filter(event => {
      const eventDate = new Date(event.dateTime);
      if (startDate && eventDate < startDate) return false;
      if (endDate && eventDate > endDate) return false;
      return true;
    });
  }

  static groupEventsByDate(events: Event[]): Record<string, Event[]> {
    return events.reduce((groups, event) => {
      const date = new Date(event.dateTime).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
      return groups;
    }, {} as Record<string, Event[]>);
  }
}
