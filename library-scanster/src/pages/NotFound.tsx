
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/layout/PageLayout";
import { BookX } from "lucide-react";

const NotFound = () => {
  return (
    <PageLayout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-8 animate-float">
          <BookX className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-slide-up">Page Not Found</h1>
        
        <p className="text-muted-foreground max-w-md mx-auto mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          We couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
        </p>
        
        <Button asChild className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    </PageLayout>
  );
};

export default NotFound;
