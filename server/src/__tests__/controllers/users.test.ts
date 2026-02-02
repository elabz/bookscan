const mockQuery = jest.fn();
jest.mock('../../config/db', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args) },
}));

import { getProfile, updateProfile, getLibraryStats } from '../../controllers/users';

function mockReq(overrides: any = {}) {
  return {
    params: {},
    query: {},
    body: {},
    session: { getUserId: () => 'user-1' },
    ...overrides,
  } as any;
}

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => jest.clearAllMocks());

describe('users controller', () => {
  describe('getProfile', () => {
    it('returns existing profile', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'user-1', email: 'test@test.com' }] });
      const res = mockRes();
      await getProfile(mockReq(), res);
      expect(res.json).toHaveBeenCalledWith({ id: 'user-1', email: 'test@test.com' });
    });

    it('auto-creates user when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // not found
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'user-1', email: '' }] }); // insert
      const res = mockRes();
      await getProfile(mockReq(), res);
      expect(res.json).toHaveBeenCalledWith({ id: 'user-1', email: '' });
    });
  });

  describe('updateProfile', () => {
    it('returns 400 with no valid fields', async () => {
      const res = mockRes();
      await updateProfile(mockReq({ body: { invalid: 'x' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('updates valid fields', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'user-1', display_name: 'New Name' }] });
      const res = mockRes();
      await updateProfile(mockReq({ body: { display_name: 'New Name' } }), res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ display_name: 'New Name' }));
    });

    it('returns 404 when user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const res = mockRes();
      await updateProfile(mockReq({ body: { display_name: 'Test' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getLibraryStats', () => {
    it('returns stats', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ name: 'Fiction', count: '3' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'b1', title: 'Book' }] });
      const res = mockRes();
      await getLibraryStats(mockReq(), res);
      expect(res.json).toHaveBeenCalledWith({
        totalBooks: 5,
        genreCounts: [{ name: 'Fiction', count: '3' }],
        recentBooks: [{ id: 'b1', title: 'Book' }],
      });
    });
  });
});
