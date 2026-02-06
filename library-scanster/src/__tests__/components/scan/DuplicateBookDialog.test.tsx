import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DuplicateBookDialog } from '@/components/scan/DuplicateBookDialog';

describe('DuplicateBookDialog', () => {
  const mockBook = {
    id: '123',
    title: 'Test Book',
    authors: ['Author One', 'Author Two'],
    cover_url: 'https://example.com/cover.jpg',
  };

  const defaultProps = {
    open: true,
    book: mockBook,
    onScanAnother: vi.fn(),
    onGoToLibrary: vi.fn(),
  };

  it('renders dialog with book title and authors', () => {
    render(<DuplicateBookDialog {...defaultProps} />);

    expect(screen.getByText('Already in Your Library')).toBeInTheDocument();
    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText(/Author One, Author Two/)).toBeInTheDocument();
  });

  it('renders "Scan Next Book" as primary action button', () => {
    render(<DuplicateBookDialog {...defaultProps} />);

    const scanButton = screen.getByRole('button', { name: /scan next book/i });
    expect(scanButton).toBeInTheDocument();
  });

  it('renders "Go to Library" as secondary action', () => {
    render(<DuplicateBookDialog {...defaultProps} />);

    const libraryButton = screen.getByRole('button', { name: /go to library/i });
    expect(libraryButton).toBeInTheDocument();
  });

  it('calls onScanAnother when "Scan Next Book" is clicked', async () => {
    const onScanAnother = vi.fn();
    const user = userEvent.setup();

    render(<DuplicateBookDialog {...defaultProps} onScanAnother={onScanAnother} />);

    await user.click(screen.getByRole('button', { name: /scan next book/i }));
    expect(onScanAnother).toHaveBeenCalledTimes(1);
  });

  it('calls onGoToLibrary when "Go to Library" is clicked', async () => {
    const onGoToLibrary = vi.fn();
    const user = userEvent.setup();

    render(<DuplicateBookDialog {...defaultProps} onGoToLibrary={onGoToLibrary} />);

    await user.click(screen.getByRole('button', { name: /go to library/i }));
    expect(onGoToLibrary).toHaveBeenCalledTimes(1);
  });

  it('handles book with single author', () => {
    const singleAuthorBook = { ...mockBook, authors: ['Solo Author'] };
    render(<DuplicateBookDialog {...defaultProps} book={singleAuthorBook} />);

    expect(screen.getByText(/Solo Author/)).toBeInTheDocument();
  });

  it('handles book with no authors', () => {
    const noAuthorBook = { ...mockBook, authors: [] };
    render(<DuplicateBookDialog {...defaultProps} book={noAuthorBook} />);

    expect(screen.getByText('Test Book')).toBeInTheDocument();
    // Should not crash and title should still be visible
  });

  it('does not render when open is false', () => {
    render(<DuplicateBookDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('Already in Your Library')).not.toBeInTheDocument();
  });

  it('renders book cover image when cover_url is provided', () => {
    render(<DuplicateBookDialog {...defaultProps} />);

    const coverImage = screen.getByRole('img', { name: 'Test Book' });
    expect(coverImage).toBeInTheDocument();
    expect(coverImage).toHaveAttribute('src', 'https://example.com/cover.jpg');
  });

  it('renders placeholder icon when cover_url is not provided', () => {
    const noCoverBook = { ...mockBook, cover_url: undefined };
    render(<DuplicateBookDialog {...defaultProps} book={noCoverBook} />);

    // Should not have an img element
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    // The BookOpen icon should be rendered (it's an SVG)
    expect(screen.getByText('Test Book')).toBeInTheDocument();
  });
});
