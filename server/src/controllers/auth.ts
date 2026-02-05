import { Response } from 'express';
import { SessionRequest } from 'supertokens-node/framework/express';
import Session from 'supertokens-node/recipe/session';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import supertokens from 'supertokens-node';

// User signout controller
export const signOut = async (req: SessionRequest, res: Response) => {
    try {
        await Session.revokeSession(req.session!.getHandle());
        return res.json({
            status: 'OK'
        });
    } catch (err) {
        console.error('Signout error:', err);
        return res.status(500).json({
            status: 'ERROR',
            message: 'An error occurred during signout'
        });
    }
};

// Get user information
export const getUserInfo = async (req: SessionRequest, res: Response) => {
    try {
        const userId = req.session!.getUserId();
        const userInfo = await supertokens.getUser(userId);

        if (userInfo === undefined) {
            return res.status(404).json({
                status: 'ERROR',
                message: 'User not found'
            });
        }

        return res.json({
            status: 'OK',
            user: {
                id: userId,
                email: userInfo.emails,
                name: ("name" in userInfo) ? userInfo.name : '',
            }
        });
    } catch (err) {
        console.error('Get user info error:', err);
        return res.status(500).json({
            status: 'ERROR',
            message: 'An error occurred while fetching user information'
        });
    }
};

// Middleware to verify session
export const requireAuth = verifySession();
