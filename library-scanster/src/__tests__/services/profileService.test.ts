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
import { getProfile, updateProfile, getLibraryStats } from '@/services/profileService';

const mockApi = vi.mocked(api);

beforeEach(() => vi.clearAllMocks());

describe('profileService', () => {
  it('getProfile calls /users/me', async () => {
    mockApi.get.mockResolvedValueOnce({ id: 'u1', email: 'test@test.com' });
    const profile = await getProfile();
    expect(profile.email).toBe('test@test.com');
    expect(mockApi.get).toHaveBeenCalledWith('/users/me');
  });

  it('updateProfile patches /users/me', async () => {
    mockApi.patch.mockResolvedValueOnce({ id: 'u1', display_name: 'New Name' });
    const result = await updateProfile({ display_name: 'New Name' });
    expect(result.display_name).toBe('New Name');
  });

  it('getLibraryStats calls /users/me/stats', async () => {
    mockApi.get.mockResolvedValueOnce({ totalBooks: 5 });
    const stats = await getLibraryStats();
    expect(stats.totalBooks).toBe(5);
  });
});
