import React, { useState, useEffect } from 'react';
import { Book } from '@/types/book';
import { EditableField } from '@/components/ui/editable-field';
import { BookCoverEditor } from './BookCoverEditor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EditableBookFormProps {
  book: Book;
  onChange: (book: Book) => void;
}

type DimensionUnit = 'mm' | 'cm' | 'in';
type WeightUnit = 'g' | 'kg' | 'lb' | 'oz';

const DIMENSION_UNITS: { value: DimensionUnit; label: string }[] = [
  { value: 'mm', label: 'mm' },
  { value: 'cm', label: 'cm' },
  { value: 'in', label: 'in' },
];

const WEIGHT_UNITS: { value: WeightUnit; label: string }[] = [
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
  { value: 'oz', label: 'oz' },
];

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'CHF', 'RUB',
];

// Helper to extract description string from various formats
const getDescriptionText = (description: any): string => {
  if (!description) return '';
  if (typeof description === 'string') return description;
  if (description?.value) return description.value;
  return '';
};

export const EditableBookForm: React.FC<EditableBookFormProps> = ({
  book,
  onChange,
}) => {
  // Form data state
  const [formData, setFormData] = useState({
    title: book.title || '',
    authors: book.authors?.join(', ') || '',
    isbn: book.isbn || '',
    publisher: book.publisher || '',
    publishedDate: book.publishedDate || '',
    pageCount: book.pageCount?.toString() || book.number_of_pages?.toString() || '',
    description: getDescriptionText(book.description),
    language: book.language || '',
    edition: book.edition || '',
    width: book.width || '',
    height: book.height || '',
    depth: book.depth || '',
    weight: book.weight || '',
    price: book.price || '',
    pricePublished: book.pricePublished || '',
  });

  // Unit selections
  const [dimensionUnit, setDimensionUnit] = useState<DimensionUnit>(
    book.dimensionUnit || 'mm'
  );
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(
    book.weightUnit || 'g'
  );
  const [priceCurrency, setPriceCurrency] = useState(
    book.priceCurrency || 'USD'
  );

  // Cover URLs
  const [coverUrls, setCoverUrls] = useState({
    coverUrl: book.cover || '',
    coverSmallUrl: book.coverSmall || '',
    coverLargeUrl: book.coverLarge || '',
  });
  const [isUploading, setIsUploading] = useState(false);

  // Lock state for each field (locked if value exists)
  const [lockedFields, setLockedFields] = useState<Record<string, boolean>>(() => ({
    title: !!book.title,
    authors: !!(book.authors?.length),
    isbn: !!book.isbn,
    publisher: !!book.publisher,
    publishedDate: !!book.publishedDate,
    pageCount: !!(book.pageCount || book.number_of_pages),
    description: !!getDescriptionText(book.description),
    language: !!book.language,
    edition: !!book.edition,
    width: !!book.width,
    height: !!book.height,
    depth: !!book.depth,
    weight: !!book.weight,
    price: !!book.price,
    pricePublished: !!book.pricePublished,
  }));

  // Sync form data back to parent on change
  useEffect(() => {
    const updatedBook: Book = {
      ...book,
      title: formData.title,
      authors: formData.authors.split(',').map(a => a.trim()).filter(Boolean),
      isbn: formData.isbn,
      publisher: formData.publisher || undefined,
      publishedDate: formData.publishedDate || undefined,
      pageCount: formData.pageCount ? parseInt(formData.pageCount, 10) : undefined,
      description: formData.description || undefined,
      language: formData.language || undefined,
      edition: formData.edition || undefined,
      width: formData.width || undefined,
      height: formData.height || undefined,
      depth: formData.depth || undefined,
      weight: formData.weight || undefined,
      price: formData.price || undefined,
      pricePublished: formData.pricePublished || undefined,
      dimensionUnit,
      weightUnit,
      priceCurrency,
      cover: coverUrls.coverUrl || undefined,
      coverSmall: coverUrls.coverSmallUrl || undefined,
      coverLarge: coverUrls.coverLargeUrl || undefined,
    };
    onChange(updatedBook);
  }, [formData, dimensionUnit, weightUnit, priceCurrency, coverUrls]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleLock = (field: string) => {
    setLockedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleCoverChange = (newUrls: {
    coverUrl: string;
    coverSmallUrl: string;
    coverLargeUrl: string;
  }) => {
    setCoverUrls(newUrls);
  };

  return (
    <div className="space-y-6">
      {/* Cover + Main Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cover Column */}
        <div className="col-span-1">
          <BookCoverEditor
            isbn={formData.isbn}
            bookId={book.id}
            coverUrls={coverUrls}
            isUploading={isUploading}
            onCoverChange={handleCoverChange}
            setIsUploading={setIsUploading}
          />
        </div>

        {/* Details Column */}
        <div className="col-span-2 space-y-4">
          <EditableField
            id="title"
            label="Title"
            value={formData.title}
            onChange={(v) => handleFieldChange('title', v)}
            isLocked={lockedFields.title}
            onToggleLock={() => toggleLock('title')}
            placeholder="Enter book title"
          />

          <EditableField
            id="authors"
            label="Authors"
            value={formData.authors}
            onChange={(v) => handleFieldChange('authors', v)}
            isLocked={lockedFields.authors}
            onToggleLock={() => toggleLock('authors')}
            placeholder="Author names, comma separated"
          />

          <EditableField
            id="isbn"
            label="ISBN"
            value={formData.isbn}
            onChange={(v) => handleFieldChange('isbn', v)}
            isLocked={lockedFields.isbn}
            onToggleLock={() => toggleLock('isbn')}
            placeholder="ISBN-10 or ISBN-13"
            inputClassName="font-mono"
          />

          <div className="grid grid-cols-2 gap-4">
            <EditableField
              id="publisher"
              label="Publisher"
              value={formData.publisher}
              onChange={(v) => handleFieldChange('publisher', v)}
              isLocked={lockedFields.publisher}
              onToggleLock={() => toggleLock('publisher')}
              placeholder="Publisher name"
            />

            <EditableField
              id="publishedDate"
              label="Published Date"
              value={formData.publishedDate}
              onChange={(v) => handleFieldChange('publishedDate', v)}
              isLocked={lockedFields.publishedDate}
              onToggleLock={() => toggleLock('publishedDate')}
              placeholder="e.g., 2024 or 2024-01-15"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <EditableField
              id="pageCount"
              label="Pages"
              value={formData.pageCount}
              onChange={(v) => handleFieldChange('pageCount', v)}
              isLocked={lockedFields.pageCount}
              onToggleLock={() => toggleLock('pageCount')}
              type="number"
              placeholder="Page count"
            />

            <EditableField
              id="language"
              label="Language"
              value={formData.language}
              onChange={(v) => handleFieldChange('language', v)}
              isLocked={lockedFields.language}
              onToggleLock={() => toggleLock('language')}
              placeholder="e.g., en"
            />

            <EditableField
              id="edition"
              label="Edition"
              value={formData.edition}
              onChange={(v) => handleFieldChange('edition', v)}
              isLocked={lockedFields.edition}
              onToggleLock={() => toggleLock('edition')}
              placeholder="e.g., 1st"
            />
          </div>
        </div>
      </div>

      {/* Description - Full Width */}
      <EditableField
        id="description"
        label="Description"
        value={formData.description}
        onChange={(v) => handleFieldChange('description', v)}
        isLocked={lockedFields.description}
        onToggleLock={() => toggleLock('description')}
        type="textarea"
        placeholder="Book description or summary"
      />

      {/* Dimensions Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">
            Dimensions
          </label>
          <Select
            value={dimensionUnit}
            onValueChange={(v) => setDimensionUnit(v as DimensionUnit)}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIMENSION_UNITS.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <DimensionInput
            id="width"
            label="Width"
            value={formData.width}
            onChange={(v) => handleFieldChange('width', v)}
            isLocked={lockedFields.width}
            onToggleLock={() => toggleLock('width')}
          />
          <DimensionInput
            id="height"
            label="Height"
            value={formData.height}
            onChange={(v) => handleFieldChange('height', v)}
            isLocked={lockedFields.height}
            onToggleLock={() => toggleLock('height')}
          />
          <DimensionInput
            id="depth"
            label="Depth"
            value={formData.depth}
            onChange={(v) => handleFieldChange('depth', v)}
            isLocked={lockedFields.depth}
            onToggleLock={() => toggleLock('depth')}
          />
        </div>
      </div>

      {/* Weight Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">
            Weight
          </label>
          <Select
            value={weightUnit}
            onValueChange={(v) => setWeightUnit(v as WeightUnit)}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEIGHT_UNITS.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DimensionInput
          id="weight"
          label=""
          value={formData.weight}
          onChange={(v) => handleFieldChange('weight', v)}
          isLocked={lockedFields.weight}
          onToggleLock={() => toggleLock('weight')}
          placeholder="Weight value"
          className="max-w-xs"
        />
      </div>

      {/* Price Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">
            Price
          </label>
          <Select
            value={priceCurrency}
            onValueChange={setPriceCurrency}
          >
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <DimensionInput
            id="price"
            label="Current"
            value={formData.price}
            onChange={(v) => handleFieldChange('price', v)}
            isLocked={lockedFields.price}
            onToggleLock={() => toggleLock('price')}
            placeholder="Price"
          />
          <DimensionInput
            id="pricePublished"
            label="Published"
            value={formData.pricePublished}
            onChange={(v) => handleFieldChange('pricePublished', v)}
            isLocked={lockedFields.pricePublished}
            onToggleLock={() => toggleLock('pricePublished')}
            placeholder="List price"
          />
        </div>
      </div>
    </div>
  );
};

// Compact input for dimensions/weight/price with inline lock toggle
interface DimensionInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  isLocked: boolean;
  onToggleLock: () => void;
  placeholder?: string;
  className?: string;
}

const DimensionInput: React.FC<DimensionInputProps> = ({
  id,
  label,
  value,
  onChange,
  isLocked,
  onToggleLock,
  placeholder,
  className,
}) => {
  const hasValue = value.trim().length > 0;
  const effectivelyLocked = isLocked && hasValue;

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <label htmlFor={id} className="text-xs text-muted-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || label}
          disabled={effectivelyLocked}
          className={cn(
            "h-9 pr-8",
            effectivelyLocked && "bg-muted/50 cursor-default"
          )}
        />
        {hasValue && (
          <button
            type="button"
            onClick={onToggleLock}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors",
              effectivelyLocked
                ? "text-muted-foreground hover:text-foreground"
                : "text-primary/50"
            )}
            title={effectivelyLocked ? "Click to edit" : "Editable"}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {effectivelyLocked ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              )}
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
