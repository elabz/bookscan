import React, { useState, useEffect, useCallback } from 'react';
import Session from 'supertokens-auth-react/recipe/session';
import EmailPassword from 'supertokens-auth-react/recipe/emailpassword';
import { redirectToThirdPartyLogin } from 'supertokens-auth-react/recipe/thirdparty';
import { AuthContext } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getProfile } from '@/services/profileService';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const checkSession = useCallback(async () => {
    try {
      const exists = await Session.doesSessionExist();
      if (exists) {
        const uid = await Session.getUserId();
        setIsSignedIn(true);
        setUserId(uid);
        try {
          const profile = await getProfile();
          setUserEmail(profile.email || null);
          setIsAdmin(profile.is_admin === true);
        } catch {
          setUserEmail(null);
          setIsAdmin(false);
        }
      } else {
        setIsSignedIn(false);
        setUserId(null);
        setUserEmail(null);
        setIsAdmin(false);
      }
    } catch {
      setIsSignedIn(false);
      setUserId(null);
      setUserEmail(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await EmailPassword.signIn({ formFields: [
        { id: 'email', value: email },
        { id: 'password', value: password },
      ]});

      if (response.status === 'WRONG_CREDENTIALS_ERROR') {
        toast.error('Invalid email or password');
        return { error: { message: 'Invalid email or password' } };
      }

      if (response.status === 'OK') {
        toast.success('Successfully signed in!');
        await checkSession();
        navigate('/library');
        return { data: response };
      }

      toast.error('Sign in failed');
      return { error: { message: 'Sign in failed' } };
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    await redirectToThirdPartyLogin({ thirdPartyId: 'google' });
  };

  const signUp = async (email: string, password: string) => {
    try {
      const response = await EmailPassword.signUp({ formFields: [
        { id: 'email', value: email },
        { id: 'password', value: password },
      ]});

      if (response.status === 'FIELD_ERROR') {
        const msg = response.formFields.map(f => f.error).join(', ');
        toast.error(msg);
        return { error: { message: msg } };
      }

      if (response.status === 'OK') {
        toast.success('Account created! You are now signed in.');
        await checkSession();
        navigate('/library');
        return { data: response };
      }

      toast.error('Sign up failed');
      return { error: { message: 'Sign up failed' } };
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await Session.signOut();
      setIsSignedIn(false);
      setUserId(null);
      setUserEmail(null);
      setIsAdmin(false);
      navigate('/');
      toast.success('Successfully signed out');
      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{ isSignedIn, userId, userEmail, isAdmin, signOut, signIn, signInWithGoogle, signUp, refreshSession: checkSession, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
