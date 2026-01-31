import { createContext } from 'react';

export interface AuthContextType {
  isSignedIn: boolean;
  userId: string | null;
  userEmail: string | null;
  signOut: () => Promise<{ success?: boolean; error?: any }>;
  signIn: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);
