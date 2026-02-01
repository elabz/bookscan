
interface BookDescriptionProps {
  description?: string;
}

// Safety parse: if a raw JSON string slips through from the DB, extract .value
const parseDescription = (desc: string): string => {
  if (desc.startsWith('{')) {
    try {
      const parsed = JSON.parse(desc);
      return parsed.value || desc;
    } catch {
      return desc;
    }
  }
  return desc;
};

export const BookDescription = ({ description }: BookDescriptionProps) => {
  if (!description) return null;

  const text = parseDescription(description);
  const paragraphs = text.split(/\n\n+/).filter(Boolean);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Description</h3>
      <div className="prose max-w-none dark:prose-invert">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
};
