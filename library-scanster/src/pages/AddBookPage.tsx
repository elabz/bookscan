
import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Scan, Search, BookPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchTab } from '@/components/books/SearchTab';
import { ScanTab } from '@/components/books/ScanTab';
import { ManualEntryTab } from '@/components/books/ManualEntryTab';
import { AddBookProvider, useAddBook } from '@/components/books/AddBookProvider';


/** Wrapper that wires ScanTab's "add manually" to pre-fill the manual form and switch tab */
const ScanTabWithManual = ({
  selectedLocationId,
  onLocationChange,
  setActiveTab,
}: {
  selectedLocationId: string | null;
  onLocationChange: (locId: string | null) => void;
  setActiveTab: (tab: string) => void;
}) => {
  const { setNewBook } = useAddBook();

  const handleSwitchToManual = (isbn13?: string, isbn10?: string) => {
    setNewBook(prev => ({
      ...prev,
      isbn: isbn13 || isbn10 || '',
      identifiers: {
        ...(isbn13 ? { isbn_13: [isbn13] } : {}),
        ...(isbn10 ? { isbn_10: [isbn10] } : {}),
      },
    }));
    setActiveTab('manual');
  };

  return (
    <ScanTab
      selectedLocationId={selectedLocationId}
      onLocationChange={onLocationChange}
      onSwitchToManual={handleSwitchToManual}
    />
  );
};

const LOCATION_STORAGE_KEY = 'addBook_selectedLocationId';

const AddBookPage = () => {
  const [activeTab, setActiveTab] = useState('scan');

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
          <Tabs defaultValue="scan" value={activeTab} onValueChange={setActiveTab} className="animate-fade-in">
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
              <ScanTabWithManual
                selectedLocationId={selectedLocationId}
                onLocationChange={handleLocationChange}
                setActiveTab={setActiveTab}
              />
            </TabsContent>

            <TabsContent value="manual">
              <ManualEntryTab />
            </TabsContent>
          </Tabs>
        </AddBookProvider>
      </div>
    </PageLayout>
  );
};

export default AddBookPage;
