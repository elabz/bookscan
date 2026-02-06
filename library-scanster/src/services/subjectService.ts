import { api } from '@/lib/api';

// Search subjects for autocomplete
export const searchSubjects = async (query: string): Promise<string[]> => {
  try {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('limit', '20');

    const response = await api.get<string[]>(`/library/subjects/search?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Error searching subjects:', error);
    return [];
  }
};
