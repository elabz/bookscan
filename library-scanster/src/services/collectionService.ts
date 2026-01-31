import { api } from '@/lib/api';

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
}

export const getCollections = async (): Promise<Collection[]> => {
  return api.get<Collection[]>('/collections');
};

export const createCollection = async (data: { name: string; description?: string; color?: string }): Promise<Collection> => {
  return api.post<Collection>('/collections', data);
};

export const updateCollection = async (id: string, data: Partial<Collection>): Promise<Collection> => {
  return api.patch<Collection>(`/collections/${id}`, data);
};

export const deleteCollection = async (id: string): Promise<void> => {
  await api.delete(`/collections/${id}`);
};

export const getBookCollections = async (bookId: string): Promise<Collection[]> => {
  return api.get<Collection[]>(`/collections/book/${bookId}`);
};

export const addBookToCollection = async (bookId: string, collectionId: string): Promise<void> => {
  await api.post(`/collections/book/${bookId}`, { collection_id: collectionId });
};

export const removeBookFromCollection = async (bookId: string, collectionId: string): Promise<void> => {
  await api.delete(`/collections/book/${bookId}/${collectionId}`);
};
