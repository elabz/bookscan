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
import { getBookImages, addBookImage, deleteBookImage, setImageAsCover } from '@/services/bookImageService';

const mockApi = vi.mocked(api);

beforeEach(() => vi.clearAllMocks());

describe('bookImageService', () => {
  it('getBookImages returns images', async () => {
    mockApi.get.mockResolvedValueOnce([{ id: 'img1', url: 'http://img.jpg' }]);
    const images = await getBookImages('b1');
    expect(images).toHaveLength(1);
    expect(mockApi.get).toHaveBeenCalledWith('/library/book/b1/images');
  });

  it('addBookImage posts image data', async () => {
    mockApi.post.mockResolvedValueOnce({ id: 'img1' });
    const result = await addBookImage('b1', { url: 'http://img.jpg', is_cover: true });
    expect(result.id).toBe('img1');
  });

  it('deleteBookImage deletes', async () => {
    mockApi.delete.mockResolvedValueOnce(undefined);
    await deleteBookImage('b1', 'img1');
    expect(mockApi.delete).toHaveBeenCalledWith('/library/book/b1/images/img1');
  });

  it('setImageAsCover patches', async () => {
    mockApi.patch.mockResolvedValueOnce(undefined);
    await setImageAsCover('b1', 'img1');
    expect(mockApi.patch).toHaveBeenCalledWith('/library/book/b1/images/img1/set-cover', {});
  });
});
