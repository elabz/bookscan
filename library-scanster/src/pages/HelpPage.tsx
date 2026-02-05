import { PageLayout } from '@/components/layout/PageLayout';
import { Link } from 'react-router-dom';
import { Scan, BookPlus, Camera, Search, Library, Settings, HelpCircle, ChevronRight } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const HelpPage = () => {
  return (
    <PageLayout>
      <div className="container py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6 animate-slide-down">Help Center</h1>
        <p className="text-muted-foreground mb-8 animate-slide-down" style={{ animationDelay: '50ms' }}>
          Learn how to get the most out of AllMyBooks with our guides and FAQs.
        </p>

        {/* Quick Start Guides */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quick Start Guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-6 rounded-lg border bg-card hover:border-primary/50 transition-colors">
              <Scan className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Scanning Books</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Use your device's camera to scan ISBN barcodes and instantly add books to your library.
              </p>
              <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                <li>Go to the Scan page</li>
                <li>Point your camera at the book's barcode</li>
                <li>Wait for automatic detection</li>
                <li>Review and confirm the book details</li>
              </ol>
            </div>

            <div className="p-6 rounded-lg border bg-card hover:border-primary/50 transition-colors">
              <BookPlus className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Adding Books Manually</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Search for books and add them to your library without scanning.
              </p>
              <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                <li>Go to the Discover page</li>
                <li>Search by title, author, or ISBN</li>
                <li>Click on a book to view details</li>
                <li>Click "Add to Library"</li>
              </ol>
            </div>

            <div className="p-6 rounded-lg border bg-card hover:border-primary/50 transition-colors">
              <Camera className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Taking Book Photos</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Capture photos of your books, including custom covers and special editions.
              </p>
              <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                <li>Open a book from your library</li>
                <li>Click "Add Photo"</li>
                <li>Take or upload a photo</li>
                <li>Optionally set it as your cover</li>
              </ol>
            </div>

            <div className="p-6 rounded-lg border bg-card hover:border-primary/50 transition-colors">
              <Library className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Managing Your Library</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Organize and customize your book collection.
              </p>
              <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                <li>View all books in your Library</li>
                <li>Click on a book to edit details</li>
                <li>Add notes and personal ratings</li>
                <li>Set custom cover images</li>
              </ol>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I scan a book's barcode?</AccordionTrigger>
              <AccordionContent>
                Navigate to the Scan page and point your device's camera at the book's ISBN barcode
                (usually found on the back cover). The app will automatically detect and read the
                barcode, then fetch the book's information from our database.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>What if my book isn't found when scanning?</AccordionTrigger>
              <AccordionContent>
                If the barcode scan doesn't find your book, you can search for it manually on the
                Discover page. If it's still not found, you can add a book manually with your own
                details and photos.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Can I set a custom cover image for my book?</AccordionTrigger>
              <AccordionContent>
                Yes! Open the book from your library, add a photo, then click the star icon on the
                photo to set it as your personal cover. This won't affect other users' views of
                the book.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Is my library data private?</AccordionTrigger>
              <AccordionContent>
                Your personal library data, including which books you own, your notes, and your
                custom covers, is private to your account. The basic book information (title,
                author, ISBN) may be shared in our public catalog to help others discover books.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>Can I export my library data?</AccordionTrigger>
              <AccordionContent>
                We're working on an export feature. In the meantime, please contact us if you need
                a copy of your library data.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>How do I delete my account?</AccordionTrigger>
              <AccordionContent>
                You can delete your account from the Profile page. This will permanently remove
                your library data, uploaded photos, and personal information. This action cannot
                be undone.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Still Need Help */}
        <section className="p-6 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-semibold">Still Need Help?</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for? We're here to help.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center text-primary hover:underline font-medium"
          >
            Contact Support <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </section>
      </div>
    </PageLayout>
  );
};

export default HelpPage;
