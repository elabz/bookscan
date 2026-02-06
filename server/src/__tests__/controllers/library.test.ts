import { Response } from 'express';

// Mock dependencies before importing controller
const mockQuery = jest.fn();
jest.mock('../../config/db', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args) },
}));
jest.mock('../../services/imageProcessor', () => ({
  processAndUploadCover: jest.fn().mockResolvedValue({
    cover_url: 'http://cdn/cover-M.webp',
    cover_small_url: 'http://cdn/cover-S.webp',
    cover_large_url: 'http://cdn/cover-L.webp',
  }),
  deleteFromCDN: jest.fn().mockResolvedValue(undefined),
  CDN_PATHS: { covers: 'covers', userCovers: 'user-covers', avatars: 'avatars' },
}));
jest.mock('../../services/searchService', () => ({
  indexBook: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/openLibraryService', () => ({
  fetchFromOpenLibraryByCode: jest.fn().mockResolvedValue(null),
  getOpenLibraryCoverUrl: jest.fn().mockReturnValue('http://covers.openlibrary.org/b/isbn/test-L.jpg'),
}));

import {
  lookupBookByCode,
  getFeaturedBooks,
  getUserBooks,
  searchUserBooks,
  getBookById,
  addBookToLibrary,
  updateBook,
  removeBookFromLibrary,
  updateBookLocation,
  getBookImages,
  addBookImage,
  deleteBookImage,
  getPendingEdits,
  reviewEdit,
} from '../../controllers/library';

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
  return res as Response & { status: jest.Mock; json: jest.Mock };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('library controller', () => {
  describe('lookupBookByCode', () => {
    it('returns 400 when code is missing', async () => {
      const res = mockRes();
      await lookupBookByCode(mockReq({ query: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns book found by ISBN', async () => {
      const book = { id: 'b1', title: 'Test', isbn: '9781234567890' };
      mockQuery.mockResolvedValueOnce({ rows: [book] });
      const res = mockRes();
      await lookupBookByCode(mockReq({ query: { code: '9781234567890' } }), res);
      expect(res.json).toHaveBeenCalledWith(book);
    });

    it('returns 404 when book not found', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // ISBN search
        .mockResolvedValueOnce({ rows: [] }) // identifiers search variant 1
        .mockResolvedValueOnce({ rows: [] }) // identifiers search variant 2
        .mockResolvedValueOnce({ rows: [] }) // UPC search
        .mockResolvedValueOnce({ rows: [] }) // LCCN column search
        .mockResolvedValueOnce({ rows: [] }); // LCCN identifiers search
      const res = mockRes();
      await lookupBookByCode(mockReq({ query: { code: '0000000000' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('converts ISBN-10 and searches both variants', async () => {
      const book = { id: 'b1', title: 'Test' };
      mockQuery.mockResolvedValueOnce({ rows: [book] });
      const res = mockRes();
      await lookupBookByCode(mockReq({ query: { code: '0306406152' } }), res);
      // Should have searched with both ISBN-10 and ISBN-13
      expect(mockQuery.mock.calls[0][1][0]).toHaveLength(2);
    });
  });

  describe('getFeaturedBooks', () => {
    it('returns featured books', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: '1', title: 'Book' }] });
      const res = mockRes();
      await getFeaturedBooks({} as any, res);
      expect(res.json).toHaveBeenCalledWith([{ id: '1', title: 'Book' }]);
    });

    it('returns 500 on error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));
      const res = mockRes();
      await getFeaturedBooks({} as any, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUserBooks', () => {
    it('returns user books', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'b1' }] });
      const res = mockRes();
      await getUserBooks(mockReq(), res);
      expect(res.json).toHaveBeenCalledWith([{ id: 'b1' }]);
    });
  });

  describe('searchUserBooks', () => {
    it('returns 400 without query', async () => {
      const res = mockRes();
      await searchUserBooks(mockReq({ query: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns matching books', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'b1' }] });
      const res = mockRes();
      await searchUserBooks(mockReq({ query: { query: 'test' } }), res);
      expect(res.json).toHaveBeenCalledWith([{ id: 'b1' }]);
    });
  });

  describe('getBookById', () => {
    it('returns 404 when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const res = mockRes();
      await getBookById(mockReq({ params: { id: 'missing' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns book when found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'b1' }] });
      const res = mockRes();
      await getBookById(mockReq({ params: { id: 'b1' } }), res);
      expect(res.json).toHaveBeenCalledWith({ id: 'b1' });
    });
  });

  describe('addBookToLibrary', () => {
    it('creates new book and adds to user library', async () => {
      const bookData = { title: 'New Book', authors: ['Author'], isbn: '9781234567890' };
      // ISBN check
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // Title/author check
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // INSERT book
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-id', ...bookData }] });
      // INSERT user_books
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // SELECT complete book
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-id', ...bookData }] });

      const res = mockRes();
      await addBookToLibrary(mockReq({ body: bookData }), res);
      expect(res.json).toHaveBeenCalled();
    });

    it('reuses existing book by ISBN', async () => {
      // ISBN check finds existing
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] });
      // INSERT user_books
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // SELECT complete book
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-id', title: 'Existing' }] });

      const res = mockRes();
      await addBookToLibrary(mockReq({ body: { isbn: '9781234567890', title: 'Existing' } }), res);
      expect(res.json).toHaveBeenCalledWith({ id: 'existing-id', title: 'Existing' });
    });
  });

  describe('updateBook', () => {
    it('returns 403 when user does not own book', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // ownership check
      const res = mockRes();
      await updateBook(mockReq({ params: { id: 'b1' }, body: { title: 'New' } }), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 400 when no valid fields', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{}] }); // ownership
      mockQuery.mockResolvedValueOnce({ rows: [{ is_admin: false }] }); // admin check
      const res = mockRes();
      await updateBook(mockReq({ params: { id: 'b1' }, body: { invalid_field: 'x' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('queues edit for non-admin user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{}] }); // ownership
      mockQuery.mockResolvedValueOnce({ rows: [{ is_admin: false }] }); // admin check
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE user_books (personal overrides)
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'edit-1' }] }); // INSERT pending_book_edits
      const res = mockRes();
      await updateBook(mockReq({ params: { id: 'b1' }, body: { title: 'New Title' } }), res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ pending: true }));
    });

    it('applies directly for admin user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{}] }); // ownership
      mockQuery.mockResolvedValueOnce({ rows: [{ is_admin: true }] }); // admin check
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'b1', title: 'New Title' }] }); // UPDATE
      const res = mockRes();
      await updateBook(mockReq({ params: { id: 'b1' }, body: { title: 'New Title' } }), res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Title' }));
    });

    it('saves cover-only update as personal override for non-admin', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{}] }); // ownership
      mockQuery.mockResolvedValueOnce({ rows: [{ is_admin: false }] }); // admin check
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE user_books
      mockQuery.mockResolvedValueOnce({ rows: [{}] }); // INSERT pending_book_edits
      const res = mockRes();
      await updateBook(mockReq({ params: { id: 'b1' }, body: { cover_url: 'http://new.jpg' } }), res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ personal: true }));
    });
  });

  describe('removeBookFromLibrary', () => {
    it('removes book and returns success', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const res = mockRes();
      await removeBookFromLibrary(mockReq({ params: { bookId: 'b1' } }), res);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('updateBookLocation', () => {
    it('updates location', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ book_id: 'b1', location_id: 'loc1' }] });
      const res = mockRes();
      await updateBookLocation(mockReq({ params: { id: 'b1' }, body: { location_id: 'loc1' } }), res);
      expect(res.json).toHaveBeenCalled();
    });

    it('returns 404 when book not in library', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const res = mockRes();
      await updateBookLocation(mockReq({ params: { id: 'b1' }, body: { location_id: 'loc1' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getBookImages', () => {
    it('returns images', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'img1' }] });
      const res = mockRes();
      await getBookImages(mockReq({ params: { id: 'b1' } }), res);
      expect(res.json).toHaveBeenCalledWith([{ id: 'img1' }]);
    });
  });

  describe('addBookImage', () => {
    it('returns 400 without url', async () => {
      const res = mockRes();
      await addBookImage(mockReq({ params: { id: 'b1' }, body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('adds image successfully', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'img1', url: 'http://img.jpg' }] });
      const res = mockRes();
      await addBookImage(mockReq({ params: { id: 'b1' }, body: { url: 'http://img.jpg' } }), res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('deleteBookImage', () => {
    it('returns 404 when image not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // SELECT returns nothing
      const res = mockRes();
      await deleteBookImage(mockReq({ params: { id: 'b1', imageId: 'img1' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deletes image', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ url: 'http://cdn/img.webp', url_small: null, url_large: null }] }); // SELECT image
      mockQuery.mockResolvedValueOnce({ rows: [] }); // DELETE
      const res = mockRes();
      await deleteBookImage(mockReq({ params: { id: 'b1', imageId: 'img1' } }), res);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('getPendingEdits', () => {
    it('returns 403 for non-admin', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ is_admin: false }] });
      const res = mockRes();
      await getPendingEdits(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns pending edits for admin', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ is_admin: true }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'edit1' }] });
      const res = mockRes();
      await getPendingEdits(mockReq(), res);
      expect(res.json).toHaveBeenCalledWith([{ id: 'edit1' }]);
    });
  });

  describe('reviewEdit', () => {
    it('returns 403 for non-admin', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ is_admin: false }] });
      const res = mockRes();
      await reviewEdit(mockReq({ params: { editId: 'e1' }, body: { action: 'approve' } }), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 404 for missing edit', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ is_admin: true }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const res = mockRes();
      await reviewEdit(mockReq({ params: { editId: 'e1' }, body: { action: 'approve' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('approves edit and applies changes', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ is_admin: true }] }); // admin check
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'e1', book_id: 'b1', changes: { title: 'New' } }] }); // get edit
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'b1', title: 'New' }] }); // UPDATE books
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE pending_book_edits
      const res = mockRes();
      await reviewEdit(mockReq({ params: { editId: 'e1' }, body: { action: 'approve' } }), res);
      expect(res.json).toHaveBeenCalledWith({ success: true, action: 'approve' });
    });

    it('rejects edit', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ is_admin: true }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'e1', book_id: 'b1', changes: {} }] });
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE status
      const res = mockRes();
      await reviewEdit(mockReq({ params: { editId: 'e1' }, body: { action: 'reject' } }), res);
      expect(res.json).toHaveBeenCalledWith({ success: true, action: 'reject' });
    });
  });
});
