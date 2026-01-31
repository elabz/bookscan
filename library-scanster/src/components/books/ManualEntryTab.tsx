
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Book as BookIcon } from 'lucide-react';
import { ManualEntryTabProps } from '@/types/addBook';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Link } from 'react-router-dom';
import { useAddBook } from './AddBookProvider';
import { useNavigate } from 'react-router-dom';

export const ManualEntryTab: React.FC<ManualEntryTabProps> = (props) => {
  const {
    newBook: propsNewBook,
    handleManualChange: propsHandleManualChange,
    handleSubmitManual: propsHandleSubmitManual,
    isSubmitting: propsIsSubmitting
  } = props;

  // Use navigate from hook and from props
  const navigate = useNavigate();
  const propsNavigate = props.navigate;

  // Use context if props are not provided
  const {
    newBook: contextNewBook,
    handleManualChange: contextHandleManualChange,
    handleSubmitManual: contextHandleSubmitManual,
    isSubmitting: contextIsSubmitting
  } = useAddBook();

  // Use props if available, otherwise use context
  const newBook = propsNewBook || contextNewBook;
  const handleManualChange = propsHandleManualChange || contextHandleManualChange;
  const handleSubmitManual = propsHandleSubmitManual || contextHandleSubmitManual;
  const isSubmitting = propsIsSubmitting !== undefined ? propsIsSubmitting : contextIsSubmitting;
  const navigateFn = propsNavigate || navigate;

  return (
    <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8">
        <h2 className="text-xl font-medium mb-6">Add Book Manually</h2>
        
        <form onSubmit={handleSubmitManual} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <AspectRatio ratio={2/3} className="bg-muted rounded-lg mb-4">
                <div className="flex items-center justify-center h-full w-full">
                  <BookIcon className="h-12 w-12 opacity-30" />
                </div>
              </AspectRatio>
              
              <Button asChild variant="outline" className="w-full">
                <Link to="/take-photo" state={{ returnTo: '/books/add' }}>
                  Take or Upload Cover
                </Link>
              </Button>
            </div>
            
            <div className="md:col-span-2 space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={newBook.title}
                  onChange={handleManualChange}
                  placeholder="Book title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  name="author"
                  value={newBook.authors?.[0] || ''}
                  onChange={handleManualChange}
                  placeholder="Author name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    name="isbn"
                    value={newBook.isbn || ''}
                    onChange={handleManualChange}
                    placeholder="ISBN (optional)"
                  />
                </div>
                
                <div>
                  <Label htmlFor="publishedDate">Published Date</Label>
                  <Input
                    id="publishedDate"
                    name="publishedDate"
                    value={newBook.publishedDate || ''}
                    onChange={handleManualChange}
                    placeholder="YYYY or YYYY-MM-DD"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={typeof newBook.description === 'string' ? newBook.description : ''}
                  onChange={handleManualChange}
                  placeholder="Book description (optional)"
                  rows={4}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigateFn('/library')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add to Library'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
