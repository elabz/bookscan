import { Response } from 'express';
import { SessionRequest } from 'supertokens-node/framework/express';
import supertokens from 'supertokens-node';
import { pool } from '../config/db';

type AuthRequest = SessionRequest;

// Get current user's profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();

    const result = await pool.query(
      `SELECT id, email, display_name, avatar_url, username, bio, location, website, phone, reading_goal, is_admin, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Auto-create user record - fetch info from Supertokens first
      let email = '';
      let displayName = '';

      try {
        const userInfo = await supertokens.getUser(userId);
        if (userInfo) {
          // Get email from login methods (email/password or OAuth)
          const loginMethod = userInfo.loginMethods?.[0];
          if (loginMethod?.email) {
            email = loginMethod.email;
          }
          // Try to get name from thirdParty info if available
          if (loginMethod?.thirdParty) {
            // For Google, we can derive display name from email
            displayName = email.split('@')[0];
          }
        }
      } catch (e) {
        console.error('Failed to fetch user info from Supertokens:', e);
      }

      // Derive username from email (first part before @)
      const username = email ? email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : '';

      const insert = await pool.query(
        `INSERT INTO users (id, email, display_name, username)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           email = COALESCE(NULLIF(users.email, ''), EXCLUDED.email),
           display_name = COALESCE(NULLIF(users.display_name, ''), EXCLUDED.display_name),
           username = COALESCE(NULLIF(users.username, ''), EXCLUDED.username)
         RETURNING *`,
        [userId, email, displayName, username]
      );
      return res.json(insert.rows[0] || { id: userId, email, display_name: displayName, username });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching profile:', err);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update current user's profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const updates = req.body;

    const allowedFields: Record<string, string> = {
      display_name: 'display_name',
      avatar_url: 'avatar_url',
      username: 'username',
      bio: 'bio',
      location: 'location',
      website: 'website',
      phone: 'phone',
      reading_goal: 'reading_goal',
    };

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, column] of Object.entries(allowedFields)) {
      if (key in updates) {
        setClauses.push(`${column} = $${paramIndex}`);
        values.push(updates[key] ?? null);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await pool.query(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating profile:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Get library stats for current user
export const getLibraryStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();

    const [totalBooks, genreCounts, recentBooks] = await Promise.all([
      pool.query(
        'SELECT COUNT(*) as count FROM user_books WHERE user_id = $1',
        [userId]
      ),
      pool.query(
        `SELECT g.name, COUNT(*) as count
         FROM book_genres bg
         JOIN genres g ON g.id = bg.genre_id
         JOIN user_books ub ON ub.book_id = bg.book_id
         WHERE ub.user_id = $1
         GROUP BY g.name
         ORDER BY count DESC`,
        [userId]
      ),
      pool.query(
        `SELECT b.id, b.title, b.cover_small_url, ub.added_at
         FROM books b
         JOIN user_books ub ON ub.book_id = b.id
         WHERE ub.user_id = $1
         ORDER BY ub.added_at DESC
         LIMIT 5`,
        [userId]
      ),
    ]);

    return res.json({
      totalBooks: parseInt(totalBooks.rows[0].count),
      genreCounts: genreCounts.rows,
      recentBooks: recentBooks.rows,
    });
  } catch (err) {
    console.error('Error fetching library stats:', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
