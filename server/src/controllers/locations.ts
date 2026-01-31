import { Response } from 'express';
import { SessionRequest } from 'supertokens-node/framework/express';
import { pool } from '../config/db';

type AuthRequest = SessionRequest;

export const getLocations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const result = await pool.query(
      'SELECT * FROM locations WHERE user_id = $1 ORDER BY type, name',
      [userId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching locations:', err);
    return res.status(500).json({ error: 'Failed to fetch locations' });
  }
};

export const createLocation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { name, parent_id, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'name and type are required' });
    }

    const result = await pool.query(
      'INSERT INTO locations (user_id, name, parent_id, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, name, parent_id || null, type]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating location:', err);
    return res.status(500).json({ error: 'Failed to create location' });
  }
};

export const updateLocation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { id } = req.params;
    const { name, parent_id, type } = req.body;

    const result = await pool.query(
      `UPDATE locations SET name = COALESCE($1, name), parent_id = $2, type = COALESCE($3, type)
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [name, parent_id ?? null, type, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating location:', err);
    return res.status(500).json({ error: 'Failed to update location' });
  }
};

export const deleteLocation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { id } = req.params;

    await pool.query('DELETE FROM locations WHERE id = $1 AND user_id = $2', [id, userId]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting location:', err);
    return res.status(500).json({ error: 'Failed to delete location' });
  }
};
