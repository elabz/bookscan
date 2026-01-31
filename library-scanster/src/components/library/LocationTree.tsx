import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLocations, createLocation, deleteLocation, Location } from '@/services/locationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Home, BookOpen, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const typeIcons = {
  room: Home,
  bookcase: BookOpen,
  shelf: Layers,
};

export const LocationTree = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<string>('room');
  const [newParentId, setNewParentId] = useState<string>('');

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: getLocations,
  });

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createLocation({ name: newName, type: newType, parent_id: newParentId || undefined });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setNewName('');
      toast({ title: 'Location created' });
    } catch (err) {
      toast({ title: 'Failed to create location', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLocation(id);
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({ title: 'Location deleted' });
    } catch (err) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  // Build tree structure
  const roots = locations.filter(l => !l.parent_id);
  const getChildren = (parentId: string) => locations.filter(l => l.parent_id === parentId);

  const renderLocation = (loc: Location, depth: number = 0) => {
    const Icon = typeIcons[loc.type] || Home;
    const children = getChildren(loc.id);
    return (
      <div key={loc.id} style={{ paddingLeft: depth * 20 }}>
        <div className="flex items-center gap-2 py-1.5 group">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm flex-1">{loc.name}</span>
          <span className="text-xs text-muted-foreground">{loc.type}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={() => handleDelete(loc.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        {children.map(child => renderLocation(child, depth + 1))}
      </div>
    );
  };

  // Get valid parent options based on selected type
  const getParentOptions = () => {
    if (newType === 'room') return [];
    if (newType === 'bookcase') return locations.filter(l => l.type === 'room');
    if (newType === 'shelf') return locations.filter(l => l.type === 'bookcase');
    return [];
  };

  const parentOptions = getParentOptions();

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Locations</h3>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : locations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No locations yet</p>
      ) : (
        <div className="border rounded-lg p-3">
          {roots.map(loc => renderLocation(loc))}
        </div>
      )}

      {/* Add new location */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            placeholder="Location name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </div>
        <Select value={newType} onValueChange={v => { setNewType(v); setNewParentId(''); }}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="room">Room</SelectItem>
            <SelectItem value="bookcase">Bookcase</SelectItem>
            <SelectItem value="shelf">Shelf</SelectItem>
          </SelectContent>
        </Select>
        {parentOptions.length > 0 && (
          <Select value={newParentId} onValueChange={setNewParentId}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Parent..." />
            </SelectTrigger>
            <SelectContent>
              {parentOptions.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button size="icon" onClick={handleCreate} disabled={!newName.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
