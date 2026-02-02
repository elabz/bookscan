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
  getAllGenres,
  addGenre,
  addGenreToBook,
  getBookGenres,
  getBooksByGenre,
  removeGenreFromBook,
} from '@/services/genreService';

const mockApi = vi.mocked(api);

beforeEach(() => vi.clearAllMocks());

describe('genreService', () => {
  it('getAllGenres returns genres', async () => {
    mockApi.get.mockResolvedValueOnce([{ id: 1, name: 'Fiction' }]);
    const result = await getAllGenres();
    expect(result).toEqual([{ id: 1, name: 'Fiction' }]);
    expect(mockApi.get).toHaveBeenCalledWith('/genres');
  });

  it('getAllGenres returns empty on error', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('fail'));
    const result = await getAllGenres();
    expect(result).toEqual([]);
  });

  it('addGenre creates genre', async () => {
    mockApi.post.mockResolvedValueOnce({ id: 1, name: 'Drama' });
    const result = await addGenre('Drama', 'desc');
    expect(result).toEqual({ id: 1, name: 'Drama' });
  });

  it('addGenre returns null on error', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('fail'));
    expect(await addGenre('Bad')).toBeNull();
  });

  it('addGenreToBook returns true on success', async () => {
    mockApi.post.mockResolvedValueOnce({});
    expect(await addGenreToBook('b1', 1)).toBe(true);
  });

  it('addGenreToBook returns false on error', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('fail'));
    expect(await addGenreToBook('b1', 1)).toBe(false);
  });

  it('getBookGenres returns genres', async () => {
    mockApi.get.mockResolvedValueOnce([{ id: 1 }]);
    expect(await getBookGenres('b1')).toEqual([{ id: 1 }]);
  });

  it('getBooksByGenre returns book ids', async () => {
    mockApi.get.mockResolvedValueOnce(['b1', 'b2']);
    expect(await getBooksByGenre(1)).toEqual(['b1', 'b2']);
  });

  it('removeGenreFromBook returns true', async () => {
    mockApi.delete.mockResolvedValueOnce({});
    expect(await removeGenreFromBook('b1', 1)).toBe(true);
  });
});
