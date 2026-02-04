interface BookDescriptionProps {
  description?: string;
  showPlaceholder?: boolean;
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

export const BookDescription = ({ description, showPlaceholder = false }: BookDescriptionProps) => {
  if (!description && !showPlaceholder) return null;

  const text = description ? parseDescription(description) : '';
  const paragraphs = text.split(/\n\n+/).filter(Boolean);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Description</h3>
      {paragraphs.length > 0 ? (
        <div className="prose max-w-none dark:prose-invert">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground italic">No description available. Click "Edit Details" to add one.</p>
      )}
    </div>
  );
};
