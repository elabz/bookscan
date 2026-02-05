const mockQuery = jest.fn();
jest.mock('../../config/db', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args) },
}));
jest.mock('../../services/searchService', () => ({
  hybridSearch: jest.fn().mockResolvedValue([{ id: 'b1', title: 'Result' }]),
  syncAllBooks: jest.fn().mockResolvedValue(5),
}));
jest.mock('../../services/embeddingService', () => ({
  generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));

import { search, syncIndex } from '../../controllers/search';

function mockReq(overrides: any = {}) {
  return {
    params: {},
    query: {},
    body: {},
    session: { getUserId: () => 'admin-1' },
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

describe('search controller', () => {
  describe('search', () => {
    it('returns 400 without query', async () => {
      const res = mockRes();
      await search({ query: {} } as any, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns search results', async () => {
      const res = mockRes();
      await search({ query: { q: 'test' } } as any, res);
      expect(res.json).toHaveBeenCalledWith([{ id: 'b1', title: 'Result' }]);
    });

    it('caps limit at 50', async () => {
      const { hybridSearch } = require('../../services/searchService');
      const res = mockRes();
      await search({ query: { q: 'test', limit: '100' } } as any, res);
      expect(hybridSearch).toHaveBeenCalledWith('test', [0.1, 0.2, 0.3], 50);
    });
  });

  describe('syncIndex', () => {
    it('returns sync count for admin user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ is_admin: true }] });
      const res = mockRes();
      await syncIndex(mockReq(), res);
      expect(res.json).toHaveBeenCalledWith({ synced: 5 });
    });

    it('returns 403 for non-admin user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ is_admin: false }] });
      const res = mockRes();
      await syncIndex(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
