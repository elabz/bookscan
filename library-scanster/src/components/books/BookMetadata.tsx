
import { Book } from '@/types/book';
import { BookIcon, Calendar, Bookmark, Globe, Scale, Layers, MapPin } from 'lucide-react';
import { getMainIdentifier } from '@/utils/bookUtils';
import { MetadataItem } from './metadata/MetadataItem';
import { IdentifierItem } from './metadata/IdentifierItem';
import { AuthorsItem } from './metadata/AuthorsItem';
import { LinksItem } from './metadata/LinksItem';

interface BookMetadataProps {
  book: Book;
}

export const BookMetadata = ({ book }: BookMetadataProps) => {
  // Get the main ISBN from identifiers if not directly available
  const mainIsbn = book.isbn || (book.identifiers && getMainIdentifier(book));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '150ms' }}>
      {book.publisher && (
        <MetadataItem icon={BookIcon} label="Publisher">
          {book.publisher}
        </MetadataItem>
      )}
      
      {book.publishedDate && (
        <MetadataItem icon={Calendar} label="Published">
          {book.publishedDate}
        </MetadataItem>
      )}
      
      {(book.pageCount || book.number_of_pages) && (
        <MetadataItem icon={Bookmark} label="Pages">
          {book.pageCount || book.number_of_pages}
        </MetadataItem>
      )}
      
      {book.language && (
        <MetadataItem icon={Globe} label="Language">
          {book.language}
        </MetadataItem>
      )}
      
      {/* Main ISBN */}
      {mainIsbn && <IdentifierItem identifier={mainIsbn} />}

      {/* Display ISBN-10 if available and different from main ISBN */}
      {book.identifiers?.isbn_10 && book.identifiers.isbn_10.length > 0 && 
       book.identifiers.isbn_10[0] !== mainIsbn && (
        <IdentifierItem identifier={book.identifiers.isbn_10[0]} label="ISBN-10" />
      )}
      
      {/* Display ISBN-13 if available and different from main ISBN */}
      {book.identifiers?.isbn_13 && book.identifiers.isbn_13.length > 0 && 
       book.identifiers.isbn_13[0] !== mainIsbn && (
        <IdentifierItem identifier={book.identifiers.isbn_13[0]} label="ISBN-13" />
      )}

      {/* Weight information */}
      {book.weight && (
        <MetadataItem icon={Scale} label="Weight">
          {book.weight}
        </MetadataItem>
      )}
      
      {/* Edition information */}
      {book.edition && (
        <MetadataItem icon={Layers} label="Edition">
          {book.edition}
        </MetadataItem>
      )}
      
      {/* Authors with more details if available */}
      {book.authors && book.authors.length > 0 && (
        <AuthorsItem authors={book.authors} />
      )}
      
      {/* External links */}
      {book.links && book.links.length > 0 && (
        <LinksItem links={book.links} />
      )}
    </div>
  );
};
