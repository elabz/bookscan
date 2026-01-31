import { Book, Genre } from '@/types/book';
import { addBookToLibrary } from './bookOperations';
import { addGenre, addGenreToBook } from './genreService';

// Process categories from OpenLibrary and add them as genres
const processBookCategories = async (categories?: string[]): Promise<Genre[]> => {
  if (!categories || categories.length === 0) {
    return [];
  }

  const genres: Genre[] = [];
  const categoriesToProcess = categories.slice(0, 5);

  for (const categoryName of categoriesToProcess) {
    const cleanName = categoryName.replace(/\.$/, '').trim();
    if (cleanName) {
      const genre = await addGenre(cleanName);
      if (genre) {
        genres.push(genre);
      }
    }
  }

  return genres;
};

// Add a book to the user's library
export const addBook = async (book: Book): Promise<Book> => {
  try {
    // Process categories into genres
    const genres = await processBookCategories(book.categories);

    const bookToAdd: Book = {
      ...book,
      id: book.id || Math.random().toString(36).substring(2, 9),
      genres,
    };

    const genreIds = bookToAdd.genres?.map(g => g.id) || [];

    const addedBook = await addBookToLibrary(bookToAdd);

    if (!addedBook) {
      throw new Error('Failed to add book to library');
    }

    // Associate genres with the book
    if (genreIds.length > 0 && addedBook.id) {
      for (const genreId of genreIds) {
        await addGenreToBook(addedBook.id, genreId);
      }
    }

    return addedBook;
  } catch (error) {
    console.error('Error in addBook service:', error);
    throw error;
  }
};

export { searchOpenLibrary } from './searchService';
export { fetchBookByISBN } from './isbnService';
