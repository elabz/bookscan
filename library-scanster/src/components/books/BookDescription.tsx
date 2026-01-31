
interface BookDescriptionProps {
  description?: string;
}

export const BookDescription = ({ description }: BookDescriptionProps) => {
  if (!description) return null;
  
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Description</h3>
      <div className="prose max-w-none dark:prose-invert">
        <p>{description}</p>
      </div>
    </div>
  );
};
