import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { AuthContext } from '@/providers/AuthContext';
import { useAuth } from '@/hooks/useAuth';

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    // Suppress console.error for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });

  it('returns context when inside provider', () => {
    const mockContext = {
      isSignedIn: true,
      userId: 'u1',
      userEmail: 'test@test.com',
      signOut: vi.fn(),
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signUp: vi.fn(),
      isLoading: false,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockContext}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.userId).toBe('u1');
  });
});
