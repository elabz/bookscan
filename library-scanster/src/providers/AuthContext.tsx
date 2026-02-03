import { createContext } from 'react';

export interface AuthContextType {
  isSignedIn: boolean;
  userId: string | null;
  userEmail: string | null;
  isAdmin: boolean;
  signOut: () => Promise<{ success?: boolean; error?: any }>;
  signIn: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  refreshSession: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);
