import { api } from '@/lib/api';
import { BookImage } from '@/types/book';

export const getBookImages = async (bookId: string): Promise<BookImage[]> => {
  return api.get<BookImage[]>(`/library/book/${bookId}/images`);
};

export const addBookImage = async (bookId: string, data: {
  url: string;
  url_small?: string;
  url_large?: string;
  is_cover?: boolean;
  sort_order?: number;
  caption?: string;
}): Promise<BookImage> => {
  return api.post<BookImage>(`/library/book/${bookId}/images`, data);
};

export const deleteBookImage = async (bookId: string, imageId: string): Promise<void> => {
  await api.delete(`/library/book/${bookId}/images/${imageId}`);
};

export const setImageAsCover = async (bookId: string, imageId: string): Promise<void> => {
  await api.patch(`/library/book/${bookId}/images/${imageId}/set-cover`, {});
};
