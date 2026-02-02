import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

import { api } from '@/lib/api';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  getBookCollections,
  addBookToCollection,
  removeBookFromCollection,
} from '@/services/collectionService';

const mockApi = vi.mocked(api);

beforeEach(() => vi.clearAllMocks());

describe('collectionService', () => {
  it('getCollections returns collections', async () => {
    mockApi.get.mockResolvedValueOnce([{ id: 'c1', name: 'Faves' }]);
    expect(await getCollections()).toEqual([{ id: 'c1', name: 'Faves' }]);
  });

  it('createCollection posts and returns', async () => {
    mockApi.post.mockResolvedValueOnce({ id: 'c1', name: 'New' });
    expect(await createCollection({ name: 'New' })).toEqual({ id: 'c1', name: 'New' });
  });

  it('updateCollection patches and returns', async () => {
    mockApi.patch.mockResolvedValueOnce({ id: 'c1', name: 'Updated' });
    expect(await updateCollection('c1', { name: 'Updated' } as any)).toEqual({ id: 'c1', name: 'Updated' });
  });

  it('deleteCollection calls delete', async () => {
    mockApi.delete.mockResolvedValueOnce(undefined);
    await deleteCollection('c1');
    expect(mockApi.delete).toHaveBeenCalledWith('/collections/c1');
  });

  it('getBookCollections returns collections for book', async () => {
    mockApi.get.mockResolvedValueOnce([{ id: 'c1' }]);
    expect(await getBookCollections('b1')).toEqual([{ id: 'c1' }]);
  });

  it('addBookToCollection posts', async () => {
    mockApi.post.mockResolvedValueOnce(undefined);
    await addBookToCollection('b1', 'c1');
    expect(mockApi.post).toHaveBeenCalledWith('/collections/book/b1', { collection_id: 'c1' });
  });

  it('removeBookFromCollection deletes', async () => {
    mockApi.delete.mockResolvedValueOnce(undefined);
    await removeBookFromCollection('b1', 'c1');
    expect(mockApi.delete).toHaveBeenCalledWith('/collections/book/b1/c1');
  });
});
