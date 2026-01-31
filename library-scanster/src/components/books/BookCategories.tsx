
interface BookCategoriesProps {
  categories: string[];
}

export const BookCategories = ({ categories }: BookCategoriesProps) => {
  if (!categories || categories.length === 0) return null;
  
  return (
    <div className="mt-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
      <p className="text-sm text-muted-foreground mb-2">Categories</p>
      <div className="flex flex-wrap gap-2">
        {categories.map((category, index) => (
          <span key={index} className="px-3 py-1 bg-accent text-accent-foreground text-sm rounded-full">
            {category}
          </span>
        ))}
      </div>
    </div>
  );
};
