import { useQuery } from '@tanstack/react-query';
import { getLocations, Location } from '@/services/locationService';
import { getCollections, Collection } from '@/services/collectionService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, FolderOpen, X } from 'lucide-react';

interface LibraryFiltersProps {
  selectedLocationId: string | null;
  selectedCollectionId: string | null;
  onLocationChange: (id: string | null) => void;
  onCollectionChange: (id: string | null) => void;
}

export const LibraryFilters = ({
  selectedLocationId,
  selectedCollectionId,
  onLocationChange,
  onCollectionChange,
}: LibraryFiltersProps) => {
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: getLocations,
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: getCollections,
  });

  const hasFilters = selectedLocationId || selectedCollectionId;

  return (
    <div className="space-y-3">
      {/* Location filter */}
      {locations.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          {locations.map((loc: Location) => (
            <Badge
              key={loc.id}
              variant={selectedLocationId === loc.id ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => onLocationChange(selectedLocationId === loc.id ? null : loc.id)}
            >
              {loc.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Collection filter */}
      {collections.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          {collections.map((col: Collection) => (
            <Badge
              key={col.id}
              variant={selectedCollectionId === col.id ? 'default' : 'outline'}
              className="cursor-pointer"
              style={{
                borderColor: col.color || undefined,
                color: selectedCollectionId === col.id ? 'white' : col.color || undefined,
                backgroundColor: selectedCollectionId === col.id ? col.color || undefined : undefined,
              }}
              onClick={() => onCollectionChange(selectedCollectionId === col.id ? null : col.id)}
            >
              {col.name}
            </Badge>
          ))}
        </div>
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { onLocationChange(null); onCollectionChange(null); }}
        >
          <X className="h-3 w-3 mr-1" /> Clear filters
        </Button>
      )}
    </div>
  );
};
