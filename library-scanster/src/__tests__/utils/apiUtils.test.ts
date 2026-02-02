import { describe, it, expect, vi } from 'vitest';
import { delay } from '@/utils/apiUtils';

describe('apiUtils', () => {
  describe('delay', () => {
    it('resolves after specified ms', async () => {
      vi.useFakeTimers();
      const promise = delay(100);
      vi.advanceTimersByTime(100);
      await expect(promise).resolves.toBeUndefined();
      vi.useRealTimers();
    });
  });
});
