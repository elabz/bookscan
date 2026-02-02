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
  bookToDbFormat: vi.fn((book: any) => ({ id: book.id, title: book.title })),
  dbBookToAppFormat: vi.fn((row: any) => ({ id: row.id, title: row.title })),
}));

import { api } from '@/lib/api';
import { addBookToLibrary, updateBookDetails, removeBookFromLibrary } from '@/services/bookOperations';

const mockApi = vi.mocked(api);

beforeEach(() => vi.clearAllMocks());

describe('bookOperations', () => {
  it('addBookToLibrary posts and returns book', async () => {
    mockApi.post.mockResolvedValueOnce({ id: 'b1', title: 'New Book' });
    const result = await addBookToLibrary({ id: 'b1', title: 'New Book', authors: [] });
    expect(result).toEqual({ id: 'b1', title: 'New Book' });
  });

  it('addBookToLibrary throws on error', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('fail'));
    await expect(addBookToLibrary({ title: 'T', authors: [] })).rejects.toThrow('fail');
  });

  it('updateBookDetails patches and returns book', async () => {
    mockApi.patch.mockResolvedValueOnce({ id: 'b1', title: 'Updated' });
    const result = await updateBookDetails('b1', { title: 'Updated' } as any);
    expect(result).toEqual({ id: 'b1', title: 'Updated' });
  });

  it('removeBookFromLibrary returns true', async () => {
    mockApi.delete.mockResolvedValueOnce({});
    expect(await removeBookFromLibrary('b1')).toBe(true);
  });

  it('removeBookFromLibrary returns false on error', async () => {
    mockApi.delete.mockRejectedValueOnce(new Error('fail'));
    expect(await removeBookFromLibrary('b1')).toBe(false);
  });
});
