const mockQuery = jest.fn();
jest.mock('../../config/db', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args) },
}));

import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addBookToCollection,
  removeBookFromCollection,
  getBookCollections,
} from '../../controllers/collections';

function mockReq(overrides: any = {}) {
  return {
    params: {},
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

describe('collections controller', () => {
  it('getCollections returns user collections', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'c1', name: 'Favorites' }] });
    const res = mockRes();
    await getCollections(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith([{ id: 'c1', name: 'Favorites' }]);
  });

  it('createCollection returns 400 without name', async () => {
    const res = mockRes();
    await createCollection(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createCollection creates successfully', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'c1', name: 'New' }] });
    const res = mockRes();
    await createCollection(mockReq({ body: { name: 'New' } }), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateCollection returns 404 when not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = mockRes();
    await updateCollection(mockReq({ params: { id: 'c1' }, body: { name: 'Updated' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deleteCollection returns success', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = mockRes();
    await deleteCollection(mockReq({ params: { id: 'c1' } }), res);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('addBookToCollection adds successfully', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = mockRes();
    await addBookToCollection(mockReq({ params: { id: 'b1' }, body: { collection_id: 'c1' } }), res);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('removeBookFromCollection removes successfully', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = mockRes();
    await removeBookFromCollection(mockReq({ params: { id: 'b1', collectionId: 'c1' } }), res);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('getBookCollections returns collections for a book', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'c1', name: 'Faves' }] });
    const res = mockRes();
    await getBookCollections(mockReq({ params: { id: 'b1' } }), res);
    expect(res.json).toHaveBeenCalledWith([{ id: 'c1', name: 'Faves' }]);
  });
});
