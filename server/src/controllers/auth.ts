import { Request, Response } from 'express';
import { SessionRequest } from 'supertokens-node/framework/express';
import Session from 'supertokens-node/recipe/session';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import ThirdParty from 'supertokens-node/recipe/thirdparty';
import supertokens from 'supertokens-node';

// Handle social login callback
export const handleAuthCallback = async (req: Request, res: Response) => {
    try {
        const { code, state } = req.query;
        
        if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Invalid callback parameters'
            });
        }

        const signInUpResponse = await ThirdParty.signInAndUp(code, state, {
            userContext: {}
        });

        if (signInUpResponse.status === 'OK') {
            await Session.createNewSession(req, res, signInUpResponse.user.tenantIds[0], signInUpResponse.user.id);
            
            return res.json({
                status: 'OK',
                user: {
                    id: signInUpResponse.user.id,
                    email: signInUpResponse.user.email
                }
            });
        } else {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Social login failed'
            });
        }
    } catch (err) {
        console.error('Social login callback error:', err);
        return res.status(500).json({
            status: 'ERROR',
            message: 'An error occurred during social login'
        });
    }
};

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
