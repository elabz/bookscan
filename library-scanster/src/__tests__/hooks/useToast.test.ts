import { describe, it, expect } from 'vitest';
import { reducer } from '@/hooks/use-toast';

describe('toast reducer', () => {
  const emptyState = { toasts: [] };

  it('ADD_TOAST adds a toast', () => {
    const newState = reducer(emptyState, {
      type: 'ADD_TOAST',
      toast: { id: '1', title: 'Test' } as any,
    });
    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0].title).toBe('Test');
  });

  it('ADD_TOAST respects limit of 1', () => {
    const state = {
      toasts: [{ id: '1', title: 'First' } as any],
    };
    const newState = reducer(state, {
      type: 'ADD_TOAST',
      toast: { id: '2', title: 'Second' } as any,
    });
    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0].title).toBe('Second');
  });

  it('UPDATE_TOAST updates matching toast', () => {
    const state = {
      toasts: [{ id: '1', title: 'Old' } as any],
    };
    const newState = reducer(state, {
      type: 'UPDATE_TOAST',
      toast: { id: '1', title: 'New' },
    });
    expect(newState.toasts[0].title).toBe('New');
  });

  it('DISMISS_TOAST sets open to false', () => {
    const state = {
      toasts: [{ id: '1', open: true } as any],
    };
    const newState = reducer(state, {
      type: 'DISMISS_TOAST',
      toastId: '1',
    });
    expect(newState.toasts[0].open).toBe(false);
  });

  it('DISMISS_TOAST without id dismisses all', () => {
    const state = {
      toasts: [{ id: '1', open: true } as any, { id: '2', open: true } as any],
    };
    const newState = reducer(state, { type: 'DISMISS_TOAST' });
    expect(newState.toasts.every((t: any) => t.open === false)).toBe(true);
  });

  it('REMOVE_TOAST removes specific toast', () => {
    const state = {
      toasts: [{ id: '1' } as any, { id: '2' } as any],
    };
    const newState = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' });
    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0].id).toBe('2');
  });

  it('REMOVE_TOAST without id clears all', () => {
    const state = {
      toasts: [{ id: '1' } as any, { id: '2' } as any],
    };
    const newState = reducer(state, { type: 'REMOVE_TOAST' });
    expect(newState.toasts).toHaveLength(0);
  });
});
