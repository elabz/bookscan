
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Book } from '@/types/book';
import { BookEditorForm } from './BookEditorForm';
import { BookCoverEditor } from './BookCoverEditor';
import { useNavigate, useLocation } from 'react-router-dom';

interface BookEditorProps {
  book: Book;
  onSave: (updatedBook: Book) => void;
}

export const BookEditor: React.FC<BookEditorProps> = ({ book, onSave }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    title: book.title,
    authors: book.authors?.join(', ') || '',
    isbn: book.isbn || '',
    publisher: book.publisher || '',
    publishedDate: book.publishedDate || '',
    pageCount: book.pageCount?.toString() || '',
    description: getBookDescription(book.description),
    width: book.width || '',
    height: book.height || '',
  });
  
  const [coverUrls, setCoverUrls] = useState({
    coverUrl: book.cover || '',
    coverSmallUrl: book.coverSmall || '',
    coverLargeUrl: book.coverLarge || '',
  });
  
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (location.state) {
      const { coverUrl, coverSmallUrl, coverLargeUrl } = location.state as any;
      
      if (coverUrl) {
        setCoverUrls({
          coverUrl,
          coverSmallUrl: coverSmallUrl || '',
          coverLargeUrl: coverLargeUrl || '',
        });
        
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, navigate, location.pathname]);

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCoverChange = (newCoverUrls: { 
    coverUrl: string; 
    coverSmallUrl: string; 
    coverLargeUrl: string; 
  }) => {
    setCoverUrls(newCoverUrls);
  };

  const handleSetUploading = (uploading: boolean) => {
    setIsUploading(uploading);
  };

  const handleSave = () => {
    const updatedBook: Book = {
      ...book,
      title: formData.title,
      authors: formData.authors.split(',').map(author => author.trim()).filter(Boolean),
      isbn: formData.isbn,
      publisher: formData.publisher,
      publishedDate: formData.publishedDate,
      pageCount: formData.pageCount ? parseInt(formData.pageCount, 10) : undefined,
      description: formData.description,
      cover: coverUrls.coverUrl,
      coverSmall: coverUrls.coverSmallUrl,
      coverLarge: coverUrls.coverLargeUrl,
      width: formData.width || undefined,
      height: formData.height || undefined
    };
    
    onSave(updatedBook);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <BookCoverEditor
            isbn={formData.isbn}
            bookId={book.id}
            coverUrls={coverUrls}
            isUploading={isUploading}
            onCoverChange={handleCoverChange}
            setIsUploading={handleSetUploading}
          />
        </div>
        
        <div className="col-span-2 space-y-4">
          <BookEditorForm
            formData={formData}
            onChange={handleFormChange}
          />
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button type="button" onClick={handleSave} disabled={isUploading}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

// Helper function to handle complex description objects
function getBookDescription(description: any): string {
  if (!description) return '';
  
  if (typeof description === 'string') {
    return description;
  }
  
  if (description && typeof description === 'object') {
    // Handle OpenLibrary description format
    if (description.value) {
      return description.value;
    }
    
    // If it's some other object, convert to string or return empty
    return String(description) !== '[object Object]' 
      ? String(description) 
      : '';
  }
  
  return '';
}
