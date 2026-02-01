import { PageLayout } from '@/components/layout/PageLayout';
import { LocationManager } from '@/components/library/LocationManager';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LibrarySetupPage = () => {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate('/library')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Button>

        <h1 className="text-2xl font-bold mb-6">Library Setup</h1>

        <LocationManager />
      </div>
    </PageLayout>
  );
};

export default LibrarySetupPage;
