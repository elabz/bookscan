import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCollections, createCollection, deleteCollection, Collection } from '@/services/collectionService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PRESET_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

export const CollectionManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: getCollections,
  });

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createCollection({ name: newName, color: newColor });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setNewName('');
      toast({ title: 'Collection created' });
    } catch (err) {
      toast({ title: 'Failed to create collection', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCollection(id);
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast({ title: 'Collection deleted' });
    } catch (err) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Collections</h3>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : collections.length === 0 ? (
        <p className="text-sm text-muted-foreground">No collections yet</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {collections.map((col: Collection) => (
            <div key={col.id} className="group flex items-center gap-1">
              <Badge
                variant="outline"
                className="px-3 py-1"
                style={{ borderColor: col.color || undefined, color: col.color || undefined }}
              >
                {col.name}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100"
                onClick={() => handleDelete(col.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new collection */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            placeholder="Collection name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </div>
        <div className="flex gap-1">
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              className="h-6 w-6 rounded-full border-2 transition-transform"
              style={{
                backgroundColor: color,
                borderColor: newColor === color ? 'white' : 'transparent',
                transform: newColor === color ? 'scale(1.2)' : 'scale(1)',
              }}
              onClick={() => setNewColor(color)}
            />
          ))}
        </div>
        <Button size="icon" onClick={handleCreate} disabled={!newName.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
