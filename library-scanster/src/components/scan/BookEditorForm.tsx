
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface BookEditorFormProps {
  formData: {
    title: string;
    authors: string;
    isbn: string;
    publisher: string;
    publishedDate: string;
    pageCount: string;
    description: string;
    width: string;
    height: string;
  };
  onChange: (field: string, value: string) => void;
}

export const BookEditorForm: React.FC<BookEditorFormProps> = ({ formData, onChange }) => {
  return (
    <>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Book title"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="authors">Authors</Label>
        <Input
          id="authors"
          value={formData.authors}
          onChange={(e) => onChange('authors', e.target.value)}
          placeholder="Author names (comma separated)"
        />
      </div>
      
      <div>
        <Label htmlFor="isbn">ISBN</Label>
        <Input
          id="isbn"
          value={formData.isbn}
          onChange={(e) => onChange('isbn', e.target.value)}
          placeholder="ISBN"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="publisher">Publisher</Label>
          <Input
            id="publisher"
            value={formData.publisher}
            onChange={(e) => onChange('publisher', e.target.value)}
            placeholder="Publisher"
          />
        </div>
        
        <div>
          <Label htmlFor="publishedDate">Published Date</Label>
          <Input
            id="publishedDate"
            value={formData.publishedDate}
            onChange={(e) => onChange('publishedDate', e.target.value)}
            placeholder="Published date"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="pageCount">Page Count</Label>
        <Input
          id="pageCount"
          type="number"
          value={formData.pageCount}
          onChange={(e) => onChange('pageCount', e.target.value)}
          placeholder="Number of pages"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="width">Width (cm)</Label>
          <Input
            id="width"
            value={formData.width}
            onChange={(e) => onChange('width', e.target.value)}
            placeholder="Book width"
          />
        </div>
        
        <div>
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            value={formData.height}
            onChange={(e) => onChange('height', e.target.value)}
            placeholder="Book height"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Book description"
          rows={3}
        />
      </div>
    </>
  );
};
