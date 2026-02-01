
import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Scan, Search, BookPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchTab } from '@/components/books/SearchTab';
import { ScanTab } from '@/components/books/ScanTab';
import { ManualEntryTab } from '@/components/books/ManualEntryTab';
import { AddBookProvider } from '@/components/books/AddBookProvider';
import { LocationPicker } from '@/components/library/LocationPicker';

const LOCATION_STORAGE_KEY = 'addBook_selectedLocationId';

const AddBookPage = () => {
  const [activeTab, setActiveTab] = useState('search');

  // Sticky location — persists across page visits via sessionStorage
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(() => {
    return sessionStorage.getItem(LOCATION_STORAGE_KEY) || null;
  });

  const handleLocationChange = (locId: string | null) => {
    setSelectedLocationId(locId);
    if (locId) {
      sessionStorage.setItem(LOCATION_STORAGE_KEY, locId);
    } else {
      sessionStorage.removeItem(LOCATION_STORAGE_KEY);
    }
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4 animate-slide-down">Add a Book</h1>

        <AddBookProvider locationId={selectedLocationId}>
          <Tabs defaultValue="search" value={activeTab} onValueChange={setActiveTab} className="animate-fade-in">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </TabsTrigger>
              <TabsTrigger value="scan" className="flex items-center gap-2">
                <Scan className="h-4 w-4" />
                Scan Barcode
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <BookPlus className="h-4 w-4" />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search">
              <SearchTab />
            </TabsContent>

            <TabsContent value="scan">
              <ScanTab />
            </TabsContent>

            <TabsContent value="manual">
              <ManualEntryTab />
            </TabsContent>
          </Tabs>
        </AddBookProvider>

        {/* Location picker — subdued, below main content */}
        <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="shrink-0">Location:</span>
          <LocationPicker
            value={selectedLocationId}
            onChange={handleLocationChange}
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default AddBookPage;
