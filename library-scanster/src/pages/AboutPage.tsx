import { PageLayout } from '@/components/layout/PageLayout';
import { BookOpen, Scan, Search, Library, Users, Heart } from 'lucide-react';

const AboutPage = () => {
  return (
    <PageLayout>
      <div className="container py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6 animate-slide-down">About AllMyBooks</h1>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-xl text-muted-foreground mb-8 animate-slide-down" style={{ animationDelay: '50ms' }}>
            AllMyBooks is a modern personal library management system designed to help book lovers
            catalog, organize, and discover books with ease.
          </p>

          <div className="grid md:grid-cols-2 gap-6 my-12">
            <div className="p-6 rounded-lg border bg-card animate-slide-up" style={{ animationDelay: '100ms' }}>
              <Scan className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Barcode Scanning</h3>
              <p className="text-muted-foreground">
                Quickly add books to your library by scanning ISBN barcodes with your device's camera.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card animate-slide-up" style={{ animationDelay: '150ms' }}>
              <Search className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Search</h3>
              <p className="text-muted-foreground">
                Search your library and millions of books from OpenLibrary with intelligent matching.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Library className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Personal Library</h3>
              <p className="text-muted-foreground">
                Organize your books with custom covers, notes, and photos. Track what you own and what you've read.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card animate-slide-up" style={{ animationDelay: '250ms' }}>
              <Users className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Share & Discover</h3>
              <p className="text-muted-foreground">
                Explore books in our community catalog and discover new reads from fellow book lovers.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Our Mission</h2>
          <p className="text-muted-foreground">
            We believe that every book deserves a place in your digital library. Our mission is to make
            it simple and enjoyable to catalog your physical books, turning your bookshelf into a
            searchable, shareable collection that you can access from anywhere.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Built with Care</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            AllMyBooks is built by book lovers, for book lovers. We're constantly improving
            and adding new features based on community feedback.
          </p>

          <div className="mt-12 p-6 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold">Get Started Today</h3>
            </div>
            <p className="text-muted-foreground">
              Create a free account and start building your digital library. Scan your first book
              in seconds and watch your collection grow.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AboutPage;
