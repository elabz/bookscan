
import { Link } from 'react-router-dom';

interface BookSubjectsProps {
  subjects?: { url?: string; name: string }[];
}

export const BookSubjects = ({ subjects }: BookSubjectsProps) => {
  if (!subjects || subjects.length === 0) return null;

  return (
    <>
      <h3 className="text-lg font-semibold mb-3">Subjects</h3>
      <div className="flex flex-wrap gap-2">
        {subjects.map((subject, index) => (
          <Link
            key={index}
            to={`/library?subject=${encodeURIComponent(subject.name)}`}
            className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
          >
            {subject.name}
          </Link>
        ))}
      </div>
    </>
  );
};
