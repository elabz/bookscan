import { api } from '@/lib/api';

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  reading_goal?: number;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LibraryStats {
  totalBooks: number;
  genreCounts: { name: string; count: number }[];
  recentBooks: { id: string; title: string; cover_small_url?: string; added_at: string }[];
}

export const getProfile = async (): Promise<UserProfile> => {
  return api.get<UserProfile>('/users/me');
};

export const updateProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  return api.patch<UserProfile>('/users/me', data);
};

export const getLibraryStats = async (): Promise<LibraryStats> => {
  return api.get<LibraryStats>('/users/me/stats');
};
