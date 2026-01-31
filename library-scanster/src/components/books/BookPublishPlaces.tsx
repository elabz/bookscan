
interface BookPublishPlacesProps {
  publishPlaces?: { name: string }[];
}

export const BookPublishPlaces = ({ publishPlaces }: BookPublishPlacesProps) => {
  if (!publishPlaces || publishPlaces.length === 0) return null;
  
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Published In</h3>
      <div className="flex flex-wrap gap-2">
        {publishPlaces.map((place, index) => (
          <span key={index} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
            {place.name}
          </span>
        ))}
      </div>
    </div>
  );
};
