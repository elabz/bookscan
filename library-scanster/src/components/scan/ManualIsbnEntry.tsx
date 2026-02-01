
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { normalizeIsbn } from '@/utils/isbnUtils';

interface ManualIsbnEntryProps {
  onSubmit: (isbn: string) => void;
  isSearching: boolean;
}

export const ManualIsbnEntry = ({ onSubmit, isSearching }: ManualIsbnEntryProps) => {
  const [manualIsbn, setManualIsbn] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIsbn.trim()) return;
    
    // Submit the original ISBN (with hyphens if present)
    // The search service will normalize it
    onSubmit(manualIsbn.replace(/^isbn[:\s]*/i, '').trim());
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-sm mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
      <h2 className="text-xl font-medium mb-4">Manual ISBN Entry</h2>
      <p className="text-muted-foreground mb-6">
        If scanning doesn't work, you can enter the ISBN manually. Both formats (e.g., 9780743273565 or 1-885183-58-5) are accepted.
      </p>
      
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <Input
          value={manualIsbn}
          onChange={(e) => setManualIsbn(e.target.value)}
          placeholder="Enter ISBN (e.g., 9780743273565 or 1-885183-58-5)"
          className="flex-1"
          disabled={isSearching}
        />
        <Button type="submit" disabled={!manualIsbn.trim() || isSearching}>
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
};
