const mockQuery = jest.fn();
jest.mock('../../config/db', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args) },
}));
jest.mock('../../services/imageProcessor', () => ({
  processAndUploadCover: jest.fn().mockResolvedValue({
    cover_url: 'http://cdn/M.webp',
    cover_small_url: 'http://cdn/S.webp',
    cover_large_url: 'http://cdn/L.webp',
  }),
  uploadBufferToCDN: jest.fn().mockResolvedValue('http://cdn/test.webp'),
  deleteFromCDN: jest.fn().mockResolvedValue(undefined),
  processAndUploadAvatar: jest.fn().mockResolvedValue('http://cdn/avatar.webp'),
  CDN_PATHS: { covers: 'covers', userCovers: 'user-covers', avatars: 'avatars' },
}));
jest.mock('sharp', () => {
  const mockSharp = jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    removeAlpha: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('test')),
  }));
  return mockSharp;
});

import { processCover, uploadImage, migrateCovers } from '../../controllers/images';

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => jest.clearAllMocks());

describe('images controller', () => {
  describe('processCover', () => {
    it('returns 400 without sourceUrl', async () => {
      const res = mockRes();
      await processCover({ body: {} } as any, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('processes cover and returns urls', async () => {
      const res = mockRes();
      await processCover({ body: { sourceUrl: 'https://covers.openlibrary.org/b/isbn/123-M.jpg' } } as any, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ cover_url: 'http://cdn/M.webp' }));
    });

    it('rejects disallowed source URL', async () => {
      const res = mockRes();
      await processCover({ body: { sourceUrl: 'http://evil.com/img.jpg' } } as any, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Image source not allowed' });
    });

    it('updates book record when bookId provided', async () => {
      const res = mockRes();
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await processCover({ body: { sourceUrl: 'https://covers.openlibrary.org/b/isbn/123-M.jpg', bookId: 'b1' } } as any, res);
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('uploadImage', () => {
    it('returns 400 without file', async () => {
      const res = mockRes();
      await uploadImage({ body: {} } as any, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('processes and uploads file', async () => {
      const { uploadBufferToCDN } = require('../../services/imageProcessor');
      uploadBufferToCDN
        .mockResolvedValueOnce('http://cdn/L.webp')
        .mockResolvedValueOnce('http://cdn/M.webp')
        .mockResolvedValueOnce('http://cdn/S.webp');

      const res = mockRes();
      await uploadImage({ file: { buffer: Buffer.from('test') }, body: { filename: 'test' } } as any, res);
      expect(res.json).toHaveBeenCalledWith({
        large: 'http://cdn/L.webp',
        medium: 'http://cdn/M.webp',
        small: 'http://cdn/S.webp',
      });
    });
  });

  describe('migrateCovers', () => {
    it('migrates external covers', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'b1', isbn: '123', cover_url: 'http://external.jpg' }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE
      const res = mockRes();
      await migrateCovers({} as any, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ migrated: 1 }));
    });
  });
});
