const mockQuery = jest.fn();
jest.mock('../../config/db', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args) },
}));

import {
  getAllGenres,
  addGenre,
  getBookGenres,
  addGenreToBook,
  getBooksByGenre,
  removeGenreFromBook,
} from '../../controllers/genres';

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

describe('genres controller', () => {
  describe('getAllGenres', () => {
    it('returns all genres', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Fiction' }] });
      const res = mockRes();
      await getAllGenres(mockReq(), res);
      expect(res.json).toHaveBeenCalledWith([{ id: 1, name: 'Fiction' }]);
    });
  });

  describe('addGenre', () => {
    it('returns existing genre if duplicate', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Fiction' }] });
      const res = mockRes();
      await addGenre(mockReq({ body: { name: 'Fiction' } }), res);
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'Fiction' });
    });

    it('creates new genre', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // no existing
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 2, name: 'Sci-Fi' }] });
      const res = mockRes();
      await addGenre(mockReq({ body: { name: 'Sci-Fi' } }), res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getBookGenres', () => {
    it('returns genres for book', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Fiction' }] });
      const res = mockRes();
      await getBookGenres(mockReq({ params: { bookId: 'b1' } }), res);
      expect(res.json).toHaveBeenCalledWith([{ id: 1, name: 'Fiction' }]);
    });
  });

  describe('addGenreToBook', () => {
    it('adds genre to book when user owns it', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ }] }); // ownership check
      mockQuery.mockResolvedValueOnce({ rows: [] }); // insert
      const res = mockRes();
      await addGenreToBook(mockReq({ params: { bookId: 'b1' }, body: { genreId: 1 } }), res);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('returns 403 when user does not own book', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // ownership check fails
      const res = mockRes();
      await addGenreToBook(mockReq({ params: { bookId: 'b1' }, body: { genreId: 1 } }), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getBooksByGenre', () => {
    it('returns book ids', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ book_id: 'b1' }, { book_id: 'b2' }] });
      const res = mockRes();
      await getBooksByGenre(mockReq({ params: { genreId: '1' } }), res);
      expect(res.json).toHaveBeenCalledWith(['b1', 'b2']);
    });
  });

  describe('removeGenreFromBook', () => {
    it('removes genre from book when user owns it', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ }] }); // ownership check
      mockQuery.mockResolvedValueOnce({ rows: [] }); // delete
      const res = mockRes();
      await removeGenreFromBook(mockReq({ params: { bookId: 'b1', genreId: '1' } }), res);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('returns 403 when user does not own book', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // ownership check fails
      const res = mockRes();
      await removeGenreFromBook(mockReq({ params: { bookId: 'b1', genreId: '1' } }), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
