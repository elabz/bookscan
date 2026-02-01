import { useQuery } from '@tanstack/react-query';
import {
  getLocations,
  buildLocationTree,
  Location,
  LocationType,
  LOCATION_TYPE_LABELS,
} from '@/services/locationService';
import { Library, Home, Warehouse, BookOpen, Layers, Package } from 'lucide-react';

const TYPE_ICONS: Record<LocationType, React.ReactNode> = {
  home: <Home className="h-3 w-3" />,
  storage: <Warehouse className="h-3 w-3" />,
  bookshelf: <BookOpen className="h-3 w-3" />,
  shelf: <Layers className="h-3 w-3" />,
  box: <Package className="h-3 w-3" />,
};

interface LocationPickerProps {
  value: string | null;
  onChange: (locationId: string | null) => void;
  className?: string;
}

export const LocationPicker = ({ value, onChange, className }: LocationPickerProps) => {
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: getLocations,
  });

  const tree = buildLocationTree(locations);

  const renderOptions = (nodes: Location[], ancestors: string[] = []): React.ReactNode[] => {
    const options: React.ReactNode[] = [];
    for (const node of nodes) {
      const path = [...ancestors, node.name];
      options.push(
        <option key={node.id} value={node.id}>
          {path.join(' → ')}
        </option>
      );
      if (node.children && node.children.length > 0) {
        options.push(...renderOptions(node.children, path));
      }
    }
    return options;
  };

  if (locations.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Library className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm w-auto max-w-xs"
      >
        <option value="">No location</option>
        {renderOptions(tree)}
      </select>
    </div>
  );
};
