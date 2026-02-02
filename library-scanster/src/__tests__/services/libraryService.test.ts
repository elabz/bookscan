import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('@/services/converters', () => ({
  dbBookToAppFormat: vi.fn((row: any) => ({ id: row.id, title: row.title })),
}));

import { api } from '@/lib/api';
import { getUserBooks, searchUserBooks, getFeaturedBooks, getBookById, getBookByIdPublic } from '@/services/libraryService';

const mockApi = vi.mocked(api);

beforeEach(() => vi.clearAllMocks());

describe('libraryService', () => {
  it('getUserBooks returns mapped books', async () => {
    mockApi.get.mockResolvedValueOnce([{ id: 'b1', title: 'Test' }]);
    const books = await getUserBooks();
    expect(books).toEqual([{ id: 'b1', title: 'Test' }]);
  });

  it('getUserBooks returns empty on error', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('fail'));
    expect(await getUserBooks()).toEqual([]);
  });

  it('searchUserBooks calls API with encoded query', async () => {
    mockApi.get.mockResolvedValueOnce([{ id: 'b1', title: 'Match' }]);
    await searchUserBooks('test query');
    expect(mockApi.get).toHaveBeenCalledWith('/library/search?query=test%20query');
  });

  it('getFeaturedBooks returns books', async () => {
    mockApi.get.mockResolvedValueOnce([{ id: 'b1', title: 'Featured' }]);
    const books = await getFeaturedBooks();
    expect(books).toHaveLength(1);
  });

  it('getBookById returns book', async () => {
    mockApi.get.mockResolvedValueOnce({ id: 'b1', title: 'Book' });
    const book = await getBookById('b1');
    expect(book).toEqual({ id: 'b1', title: 'Book' });
  });

  it('getBookById returns null on error', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('fail'));
    expect(await getBookById('b1')).toBeNull();
  });

  it('getBookByIdPublic returns book', async () => {
    mockApi.get.mockResolvedValueOnce({ id: 'b1', title: 'Public' });
    const book = await getBookByIdPublic('b1');
    expect(book).toEqual({ id: 'b1', title: 'Public' });
  });
});
