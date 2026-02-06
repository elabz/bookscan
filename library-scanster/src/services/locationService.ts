import { api } from '@/lib/api';

export type LocationType = 'home' | 'storage' | 'bookshelf' | 'shelf' | 'box';

export interface Location {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  type: LocationType;
  created_at: string;
  children?: Location[];
}

/** Top-level location types (no parent) */
export const TOP_LEVEL_TYPES: LocationType[] = ['home', 'storage'];
/** Child location types (require a parent) */
export const CHILD_TYPES: LocationType[] = ['bookshelf', 'shelf', 'box'];

/** Types that can have children added to them */
export const TYPES_THAT_CAN_HAVE_CHILDREN: LocationType[] = ['home', 'storage', 'bookshelf'];

/** Allowed child types per parent type */
export const ALLOWED_CHILD_TYPES: Partial<Record<LocationType, LocationType[]>> = {
  home: ['bookshelf'],
  storage: ['bookshelf'],
  bookshelf: ['shelf', 'box'],
};

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  home: 'Home',
  storage: 'Storage',
  bookshelf: 'Bookshelf',
  shelf: 'Shelf',
  box: 'Box',
};

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

/**
 * Build a tree structure from flat location list.
 * Top-level locations (no parent_id) get children nested inside.
 */
export function buildLocationTree(locations: Location[]): Location[] {
  const map = new Map<string, Location>();
  const roots: Location[] = [];

  for (const loc of locations) {
    map.set(loc.id, { ...loc, children: [] });
  }

  for (const loc of locations) {
    const node = map.get(loc.id)!;
    if (loc.parent_id && map.has(loc.parent_id)) {
      map.get(loc.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/**
 * Get all descendant location IDs for a given location (including itself).
 * This is useful for filtering books when a parent location is selected.
 */
export function getLocationWithDescendantIds(locationId: string, locations: Location[]): string[] {
  const ids: string[] = [locationId];

  // Find all children recursively
  const findChildren = (parentId: string) => {
    for (const loc of locations) {
      if (loc.parent_id === parentId) {
        ids.push(loc.id);
        findChildren(loc.id);
      }
    }
  };

  findChildren(locationId);
  return ids;
}
