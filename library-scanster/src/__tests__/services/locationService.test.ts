import { describe, it, expect } from 'vitest';
import {
  buildLocationTree,
  TOP_LEVEL_TYPES,
  CHILD_TYPES,
  TYPES_THAT_CAN_HAVE_CHILDREN,
  ALLOWED_CHILD_TYPES,
  LOCATION_TYPE_LABELS,
} from '@/services/locationService';
import type { Location } from '@/services/locationService';

describe('locationService', () => {
  describe('constants', () => {
    it('defines top-level types', () => {
      expect(TOP_LEVEL_TYPES).toContain('home');
      expect(TOP_LEVEL_TYPES).toContain('storage');
    });

    it('defines child types', () => {
      expect(CHILD_TYPES).toContain('bookshelf');
      expect(CHILD_TYPES).toContain('shelf');
      expect(CHILD_TYPES).toContain('box');
    });

    it('defines which types can have children', () => {
      expect(TYPES_THAT_CAN_HAVE_CHILDREN).toContain('home');
      expect(TYPES_THAT_CAN_HAVE_CHILDREN).toContain('bookshelf');
      expect(TYPES_THAT_CAN_HAVE_CHILDREN).not.toContain('shelf');
    });

    it('defines allowed child types', () => {
      expect(ALLOWED_CHILD_TYPES.home).toEqual(['bookshelf']);
      expect(ALLOWED_CHILD_TYPES.bookshelf).toEqual(['shelf', 'box']);
    });

    it('defines labels for all types', () => {
      expect(LOCATION_TYPE_LABELS.home).toBe('Home');
      expect(LOCATION_TYPE_LABELS.shelf).toBe('Shelf');
    });
  });

  describe('buildLocationTree', () => {
    it('returns roots when no parent_ids', () => {
      const locations: Location[] = [
        { id: '1', user_id: 'u1', name: 'Home', parent_id: null, type: 'home', created_at: '' },
        { id: '2', user_id: 'u1', name: 'Storage', parent_id: null, type: 'storage', created_at: '' },
      ];

      const tree = buildLocationTree(locations);
      expect(tree).toHaveLength(2);
      expect(tree[0].children).toEqual([]);
    });

    it('nests children under parents', () => {
      const locations: Location[] = [
        { id: '1', user_id: 'u1', name: 'Home', parent_id: null, type: 'home', created_at: '' },
        { id: '2', user_id: 'u1', name: 'Bookshelf', parent_id: '1', type: 'bookshelf', created_at: '' },
        { id: '3', user_id: 'u1', name: 'Shelf 1', parent_id: '2', type: 'shelf', created_at: '' },
      ];

      const tree = buildLocationTree(locations);
      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children![0].name).toBe('Bookshelf');
      expect(tree[0].children![0].children).toHaveLength(1);
      expect(tree[0].children![0].children![0].name).toBe('Shelf 1');
    });

    it('handles empty array', () => {
      expect(buildLocationTree([])).toEqual([]);
    });

    it('orphaned children become roots', () => {
      const locations: Location[] = [
        { id: '2', user_id: 'u1', name: 'Orphan', parent_id: 'missing', type: 'bookshelf', created_at: '' },
      ];
      const tree = buildLocationTree(locations);
      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('Orphan');
    });
  });
});
