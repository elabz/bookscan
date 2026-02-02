import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/lib/api';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('api', () => {
  describe('get', () => {
    it('makes GET request with credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      });

      const result = await api.get('/test');
      expect(result).toEqual({ data: 'test' });
      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        credentials: 'include',
      }));
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      await expect(api.get('/missing')).rejects.toThrow('Not found');
    });

    it('handles json parse failure in error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: () => Promise.reject(new Error('parse error')),
      });

      await expect(api.get('/broken')).rejects.toThrow('Server Error');
    });
  });

  describe('post', () => {
    it('makes POST request with JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: '1' }),
      });

      await api.post('/items', { name: 'test' });
      expect(mockFetch).toHaveBeenCalledWith('/api/items', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }));
    });
  });

  describe('patch', () => {
    it('makes PATCH request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: '1' }),
      });

      await api.patch('/items/1', { name: 'updated' });
      expect(mockFetch).toHaveBeenCalledWith('/api/items/1', expect.objectContaining({
        method: 'PATCH',
      }));
    });
  });

  describe('delete', () => {
    it('makes DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await api.delete('/items/1');
      expect(mockFetch).toHaveBeenCalledWith('/api/items/1', expect.objectContaining({
        method: 'DELETE',
      }));
    });
  });
});
