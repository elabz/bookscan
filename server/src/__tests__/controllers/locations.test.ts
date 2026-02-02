const mockQuery = jest.fn();
jest.mock('../../config/db', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args) },
}));

import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../../controllers/locations';

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

describe('locations controller', () => {
  it('getLocations returns user locations', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'l1', name: 'Home' }] });
    const res = mockRes();
    await getLocations(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith([{ id: 'l1', name: 'Home' }]);
  });

  it('createLocation returns 400 without name or type', async () => {
    const res = mockRes();
    await createLocation(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createLocation creates successfully', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'l1', name: 'Home', type: 'home' }] });
    const res = mockRes();
    await createLocation(mockReq({ body: { name: 'Home', type: 'home' } }), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateLocation returns 404 when not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = mockRes();
    await updateLocation(mockReq({ params: { id: 'l1' }, body: { name: 'New' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deleteLocation returns success', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = mockRes();
    await deleteLocation(mockReq({ params: { id: 'l1' } }), res);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
