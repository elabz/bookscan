
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';

interface ManualIsbnEntryProps {
  onSubmit: (isbn: string) => void;
  isSearching: boolean;
  bannerMessage?: string;
  autoFocus?: boolean;
}

export interface ManualIsbnEntryHandle {
  focus: () => void;
  scrollIntoView: () => void;
}

export const ManualIsbnEntry = forwardRef<ManualIsbnEntryHandle, ManualIsbnEntryProps>(
  ({ onSubmit, isSearching, bannerMessage, autoFocus }, ref) => {
    const [manualIsbn, setManualIsbn] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      scrollIntoView: () => containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    }));

    useEffect(() => {
      if (autoFocus) {
        // Small delay to allow DOM to settle after scanner unmount
        const timer = setTimeout(() => {
          containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [autoFocus]);

    const handleManualSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!manualIsbn.trim()) return;

      // Submit the original ISBN (with hyphens if present)
      // The search service will normalize it
      onSubmit(manualIsbn.replace(/^(isbn|lccn)[:\s]*/i, '').trim());
    };

    return (
      <div ref={containerRef} className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-sm mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <h2 className="text-xl font-medium mb-4">Manual ISBN / LCCN Entry</h2>

        {bannerMessage && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              {bannerMessage}
            </p>
          </div>
        )}

        <p className="text-muted-foreground mb-6">
          If scanning doesn't work, you can enter the ISBN or LCCN manually. Both ISBN formats (e.g., 9780743273565 or 1-885183-58-5) and LCCN numbers are accepted.
        </p>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={manualIsbn}
            onChange={(e) => setManualIsbn(e.target.value)}
            placeholder="Enter ISBN or LCCN"
            className="flex-1"
            disabled={isSearching}
          />
          <Button type="submit" disabled={!manualIsbn.trim() || isSearching}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    );
  }
);
