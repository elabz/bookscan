
import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Book, Scan, Search, BookPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchTab } from '@/components/books/SearchTab';
import { ScanTab } from '@/components/books/ScanTab';
import { ManualEntryTab } from '@/components/books/ManualEntryTab';
import { AddBookProvider } from '@/components/books/AddBookProvider';

const AddBookPage = () => {
  const [activeTab, setActiveTab] = useState('search');

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8 animate-slide-down">Add a Book</h1>
        
        <AddBookProvider>
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
      </div>
    </PageLayout>
  );
};

export default AddBookPage;
