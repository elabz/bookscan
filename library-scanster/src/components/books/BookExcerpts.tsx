
import { BookExcerpt } from '@/types/book';

interface BookExcerptsProps {
  excerpts?: BookExcerpt[];
}

export const BookExcerpts = ({ excerpts }: BookExcerptsProps) => {
  if (!excerpts || excerpts.length === 0) return null;
  
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Excerpts</h3>
      {excerpts.map((excerpt, index) => (
        <div key={index} className="bg-secondary/30 p-4 rounded-md my-2">
          {excerpt.comment && <p className="text-muted-foreground mb-2">{excerpt.comment}</p>}
          <p className="italic">{excerpt.text}</p>
        </div>
      ))}
    </div>
  );
};
