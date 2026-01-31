
interface BookSubjectsProps {
  subjects?: { url?: string; name: string }[];
}

export const BookSubjects = ({ subjects }: BookSubjectsProps) => {
  if (!subjects || subjects.length === 0) return null;
  
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Subjects</h3>
      <div className="flex flex-wrap gap-2">
        {subjects.map((subject, index) => (
          <span key={index} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
            {subject.name}
          </span>
        ))}
      </div>
    </div>
  );
};
