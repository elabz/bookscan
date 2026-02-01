import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLocations,
  createLocation,
  deleteLocation,
  buildLocationTree,
  Location,
  LocationType,
  TOP_LEVEL_TYPES,
  CHILD_TYPES,
  LOCATION_TYPE_LABELS,
} from '@/services/locationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Library as LibraryIcon,
  Plus,
  Trash2,
  Home,
  Warehouse,
  BookOpen,
  Layers,
  Package,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const TYPE_ICONS: Record<LocationType, React.ReactNode> = {
  home: <Home className="h-4 w-4" />,
  storage: <Warehouse className="h-4 w-4" />,
  bookshelf: <BookOpen className="h-4 w-4" />,
  shelf: <Layers className="h-4 w-4" />,
  box: <Package className="h-4 w-4" />,
};

export const LocationManager = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<LocationType>('home');
  const [newParentId, setNewParentId] = useState<string | undefined>();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [addingChildOf, setAddingChildOf] = useState<string | null>(null);
  const [childName, setChildName] = useState('');
  const [childType, setChildType] = useState<LocationType>('bookshelf');

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: getLocations,
  });

  const tree = buildLocationTree(locations);

  const createMut = useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setNewName('');
      setChildName('');
      setAddingChildOf(null);
      toast({ title: 'Location created' });
    },
    onError: () => {
      toast({ title: 'Failed to create location', variant: 'destructive' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({ title: 'Location deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete location', variant: 'destructive' });
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddTopLevel = () => {
    if (!newName.trim()) return;
    createMut.mutate({ name: newName.trim(), type: newType });
  };

  const handleAddChild = (parentId: string) => {
    if (!childName.trim()) return;
    createMut.mutate({ name: childName.trim(), type: childType, parent_id: parentId });
  };

  const renderLocationNode = (loc: Location, depth = 0) => {
    const hasChildren = loc.children && loc.children.length > 0;
    const isExpanded = expandedIds.has(loc.id);
    const isAddingChild = addingChildOf === loc.id;

    return (
      <div key={loc.id} style={{ marginLeft: depth * 20 }}>
        <div className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/50 group">
          {/* Expand toggle */}
          <button
            onClick={() => toggleExpand(loc.id)}
            className="p-0.5 text-muted-foreground hover:text-foreground"
          >
            {hasChildren || TOP_LEVEL_TYPES.includes(loc.type as LocationType) ? (
              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              <span className="w-4" />
            )}
          </button>

          {TYPE_ICONS[loc.type as LocationType] || <LibraryIcon className="h-4 w-4" />}
          <span className="font-medium text-sm flex-1">{loc.name}</span>
          <span className="text-xs text-muted-foreground">{LOCATION_TYPE_LABELS[loc.type as LocationType]}</span>

          {/* Add child button — only for top-level locations */}
          {TOP_LEVEL_TYPES.includes(loc.type as LocationType) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={() => {
                setAddingChildOf(isAddingChild ? null : loc.id);
                setChildName('');
                setExpandedIds((prev) => new Set([...prev, loc.id]));
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive"
            onClick={() => deleteMut.mutate(loc.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Add child form */}
        {isAddingChild && (
          <div className="flex items-center gap-2 py-2" style={{ marginLeft: (depth + 1) * 20 + 12 }}>
            <select
              value={childType}
              onChange={(e) => setChildType(e.target.value as LocationType)}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            >
              {CHILD_TYPES.map((t) => (
                <option key={t} value={t}>{LOCATION_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <Input
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Name..."
              className="h-8 w-40"
              onKeyDown={(e) => e.key === 'Enter' && handleAddChild(loc.id)}
            />
            <Button size="sm" className="h-8" onClick={() => handleAddChild(loc.id)} disabled={createMut.isPending}>
              Add
            </Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setAddingChildOf(null)}>
              Cancel
            </Button>
          </div>
        )}

        {/* Children */}
        {isExpanded && loc.children?.map((child) => renderLocationNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <LibraryIcon className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Locations</h2>
      </div>

      {/* Location tree */}
      {tree.length > 0 ? (
        <div className="mb-4 border rounded-lg p-2">
          {tree.map((loc) => renderLocationNode(loc))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-4">
          No locations yet. Add a location to organize your books.
        </p>
      )}

      {/* Add top-level location */}
      <div className="flex items-center gap-2">
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as LocationType)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {TOP_LEVEL_TYPES.map((t) => (
            <option key={t} value={t}>{LOCATION_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Location name..."
          className="h-9 max-w-[200px]"
          onKeyDown={(e) => e.key === 'Enter' && handleAddTopLevel()}
        />
        <Button size="sm" onClick={handleAddTopLevel} disabled={createMut.isPending || !newName.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          Add Location
        </Button>
      </div>
    </div>
  );
};
