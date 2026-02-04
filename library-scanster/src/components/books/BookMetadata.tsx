
import { Book } from '@/types/book';
import { BookIcon, Calendar, Bookmark, Globe, Scale, Layers, Ruler, DollarSign } from 'lucide-react';
import { getMainIdentifier } from '@/utils/bookUtils';
import { MetadataItem } from './metadata/MetadataItem';
import { IdentifierItem } from './metadata/IdentifierItem';
import { AuthorsItem } from './metadata/AuthorsItem';
import { LinksItem } from './metadata/LinksItem';

interface BookMetadataProps {
  book: Book;
}

// Format dimensions as WxHxD string
const formatDimensions = (book: Book): string | null => {
  const parts = [book.width, book.height, book.depth].filter(Boolean);
  if (parts.length === 0) return null;
  const unit = book.dimensionUnit || 'mm';
  return `${parts.join(' × ')} ${unit}`;
};

// Format weight with unit (avoid duplicating unit if already in value)
const formatWeight = (book: Book): string | null => {
  if (!book.weight) return null;
  const weightStr = book.weight.toString();
  // Check if weight already contains unit text (e.g., "4.8 ounces" from OpenLibrary)
  const hasUnitText = /[a-zA-Z]/.test(weightStr);
  if (hasUnitText) return weightStr;
  const unit = book.weightUnit || 'g';
  return `${weightStr} ${unit}`;
};

// Format price with currency
const formatPrice = (price: string | undefined, currency: string | undefined): string | null => {
  if (!price) return null;
  const curr = currency || 'USD';
  // Simple currency symbol mapping
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥',
    CAD: 'CA$', AUD: 'A$', CHF: 'CHF', INR: '₹', RUB: '₽',
  };
  const symbol = symbols[curr] || curr + ' ';
  return `${symbol}${price}`;
};

export const BookMetadata = ({ book }: BookMetadataProps) => {
  // Get the main ISBN from identifiers if not directly available
  const mainIsbn = book.isbn || (book.identifiers && getMainIdentifier(book));

  const dimensions = formatDimensions(book);
  const weight = formatWeight(book);
  const price = formatPrice(book.price, book.priceCurrency);
  const pricePublished = formatPrice(book.pricePublished, book.priceCurrency);

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

      {/* Dimensions */}
      {dimensions && (
        <MetadataItem icon={Ruler} label="Dimensions">
          {dimensions}
        </MetadataItem>
      )}

      {/* Weight */}
      {weight && (
        <MetadataItem icon={Scale} label="Weight">
          {weight}
        </MetadataItem>
      )}

      {/* Price information */}
      {(price || pricePublished) && (
        <MetadataItem icon={DollarSign} label="Price">
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            {price && <span>{price}</span>}
            {pricePublished && pricePublished !== price && (
              <span className="text-muted-foreground text-sm line-through">{pricePublished}</span>
            )}
          </span>
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
