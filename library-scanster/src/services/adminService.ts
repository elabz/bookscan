import { api } from '@/lib/api';

export interface PendingEdit {
  id: string;
  book_id: string;
  user_id: string;
  book_title: string;
  changes: Record<string, any>;
  status: string;
  created_at: string;
}

export const getPendingEdits = async (): Promise<PendingEdit[]> => {
  return api.get<PendingEdit[]>('/library/admin/pending-edits');
};

export const reviewEdit = async (editId: string, action: 'approve' | 'reject'): Promise<{ success: boolean; action: string }> => {
  return api.post<{ success: boolean; action: string }>(`/library/admin/pending-edits/${editId}/review`, { action });
};
