
import { Button } from '@/components/ui/button';
import { Bookmark, Share2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export const BookSecondaryActions = () => {
  const { toast } = useToast();

  const handleBookmarkClick = () => {
    toast({
      title: "Bookmarked",
      description: "This book has been added to your bookmarks",
    });
  };

  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Book link copied to clipboard",
    });
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" className="flex-1" onClick={handleBookmarkClick}>
        <Bookmark className="mr-2 h-4 w-4" />
        Bookmark
      </Button>
      <Button variant="outline" className="flex-1" onClick={handleShareClick}>
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>
    </div>
  );
};
