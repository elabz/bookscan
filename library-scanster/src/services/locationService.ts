import { api } from '@/lib/api';

export interface Location {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  type: 'room' | 'bookcase' | 'shelf';
  created_at: string;
}

export const getLocations = async (): Promise<Location[]> => {
  return api.get<Location[]>('/locations');
};

export const createLocation = async (data: { name: string; parent_id?: string; type: string }): Promise<Location> => {
  return api.post<Location>('/locations', data);
};

export const updateLocation = async (id: string, data: Partial<Location>): Promise<Location> => {
  return api.patch<Location>(`/locations/${id}`, data);
};

export const deleteLocation = async (id: string): Promise<void> => {
  await api.delete(`/locations/${id}`);
};

export const updateBookLocation = async (bookId: string, locationId: string | null): Promise<void> => {
  await api.patch(`/library/book/${bookId}/location`, { location_id: locationId });
};
