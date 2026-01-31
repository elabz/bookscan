
interface BookClassificationsProps {
  classifications?: Record<string, string[]>;
}

export const BookClassifications = ({ classifications }: BookClassificationsProps) => {
  if (!classifications || Object.keys(classifications).length === 0) return null;
  
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Classifications</h3>
      <div className="space-y-2">
        {Object.entries(classifications).map(([key, values], index) => {
          if (values && values.length > 0) {
            return (
              <div key={index} className="bg-secondary/30 p-3 rounded-md">
                <p className="font-medium">{key.replace(/_/g, ' ')}:</p>
                <p>{values.join(', ')}</p>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};
