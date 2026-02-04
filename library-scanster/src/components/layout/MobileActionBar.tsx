
import { Link } from 'react-router-dom';
import { ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const MobileActionBar = () => {
  return (
    <div className="md:hidden fixed top-14 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-2">
      <Button asChild size="sm" className="w-full">
        <Link to="/books/add">
          <ScanLine className="h-4 w-4 mr-2" />
          Add / Scan Book
        </Link>
      </Button>
    </div>
  );
};
