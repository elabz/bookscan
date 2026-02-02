import { buildBookText } from '../../services/embeddingService';

describe('embeddingService', () => {
  describe('buildBookText', () => {
    it('builds text from a full book object', () => {
      const book = {
        title: 'Test Book',
        authors: ['Author One', 'Author Two'],
        description: 'A great book',
        publisher: 'Test Publisher',
        published_date: '2024',
        edition: '2nd',
        language: 'en',
        categories: ['Fiction', 'Drama'],
        subjects: [{ name: 'Literature' }, 'History'],
        excerpts: [{ text: 'Once upon a time' }],
        publish_places: [{ name: 'New York' }],
        isbn: '9781234567890',
        page_count: 300,
      };

      const text = buildBookText(book);

      expect(text).toContain('Title: Test Book');
      expect(text).toContain('Authors: Author One, Author Two');
      expect(text).toContain('Description: A great book');
      expect(text).toContain('Publisher: Test Publisher');
      expect(text).toContain('Published: 2024');
      expect(text).toContain('Edition: 2nd');
      expect(text).toContain('Language: en');
      expect(text).toContain('Categories: Fiction, Drama');
      expect(text).toContain('Subjects: Literature, History');
      expect(text).toContain('Excerpts: Once upon a time');
      expect(text).toContain('Published in: New York');
      expect(text).toContain('ISBN: 9781234567890');
      expect(text).toContain('Pages: 300');
    });

    it('handles minimal book with only title', () => {
      const text = buildBookText({ title: 'Minimal Book' });
      expect(text).toBe('Title: Minimal Book');
    });

    it('handles empty book object', () => {
      const text = buildBookText({});
      expect(text).toBe('');
    });

    it('handles authors as objects with name property', () => {
      const book = {
        title: 'Test',
        authors: [{ name: 'John Doe' }, { name: 'Jane Doe' }],
      };
      const text = buildBookText(book);
      expect(text).toContain('Authors: John Doe, Jane Doe');
    });

    it('uses number_of_pages when page_count is absent', () => {
      const text = buildBookText({ number_of_pages: 150 });
      expect(text).toContain('Pages: 150');
    });

    it('handles subjects as strings', () => {
      const text = buildBookText({ subjects: ['Math', 'Science'] });
      expect(text).toContain('Subjects: Math, Science');
    });

    it('handles publish_places as strings', () => {
      const text = buildBookText({ publish_places: ['London', 'Paris'] });
      expect(text).toContain('Published in: London, Paris');
    });

    it('handles excerpts with comment field', () => {
      const text = buildBookText({ excerpts: [{ comment: 'A note' }] });
      expect(text).toContain('Excerpts: A note');
    });
  });
});
