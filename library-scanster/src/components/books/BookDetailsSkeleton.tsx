
export const BookDetailsSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-pulse">
      <div className="h-8 bg-muted rounded-md w-1/3 mb-8"></div>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <div className="aspect-[2/3] bg-muted rounded-lg"></div>
        </div>
        
        <div className="w-full md:w-2/3 space-y-4">
          <div className="h-8 bg-muted rounded-md"></div>
          <div className="h-6 bg-muted rounded-md w-2/3"></div>
          <div className="h-32 bg-muted rounded-md"></div>
          <div className="h-6 bg-muted rounded-md w-1/2"></div>
          <div className="h-6 bg-muted rounded-md w-1/3"></div>
        </div>
      </div>
    </div>
  );
};
