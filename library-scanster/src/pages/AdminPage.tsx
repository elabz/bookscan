import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getPendingEdits, reviewEdit, PendingEdit } from '@/services/adminService';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';

const AdminPage = () => {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [edits, setEdits] = useState<PendingEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/library');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadEdits();
    }
  }, [isAdmin]);

  const loadEdits = async () => {
    try {
      setLoading(true);
      const data = await getPendingEdits();
      setEdits(data);
    } catch (err) {
      toast.error('Failed to load pending edits');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (editId: string, action: 'approve' | 'reject') => {
    setReviewing(editId);
    try {
      await reviewEdit(editId, action);
      toast.success(action === 'approve' ? 'Edit approved and applied' : 'Edit rejected');
      setEdits(edits.filter(e => e.id !== editId));
      if (expandedId === editId) setExpandedId(null);
    } catch (err) {
      toast.error(`Failed to ${action} edit`);
    } finally {
      setReviewing(null);
    }
  };

  const coverFields = ['cover_url', 'cover_small_url', 'cover_large_url'];

  const renderChanges = (changes: Record<string, any>) => {
    const textChanges = Object.entries(changes).filter(([k]) => !coverFields.includes(k));
    const hasCoverChanges = Object.keys(changes).some(k => coverFields.includes(k));

    return (
      <div className="space-y-3 mt-3">
        {textChanges.map(([field, value]) => (
          <div key={field} className="bg-muted/50 rounded p-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{field.replace(/_/g, ' ')}</div>
            <div className="text-sm">
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </div>
          </div>
        ))}
        {hasCoverChanges && (
          <div className="bg-muted/50 rounded p-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Cover Image</div>
            <div className="flex gap-4 mt-2">
              {changes.cover_url && (
                <img src={changes.cover_url} alt="Proposed cover" className="h-32 rounded shadow" />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (authLoading || (!isAdmin && !authLoading)) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-12">
        <h1 className="text-2xl font-bold mb-6">Admin: Pending Edits</h1>

        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : edits.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No pending edits to review.
          </div>
        ) : (
          <div className="space-y-3">
            {edits.map((edit) => {
              const isExpanded = expandedId === edit.id;
              return (
                <div key={edit.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <button
                      className="flex-1 text-left flex items-center gap-2"
                      onClick={() => setExpandedId(isExpanded ? null : edit.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="font-medium">{edit.book_title}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {Object.keys(edit.changes).filter(k => !coverFields.includes(k)).join(', ') || 'cover'}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto mr-4">
                        {new Date(edit.created_at).toLocaleDateString()}
                      </span>
                    </button>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={reviewing === edit.id}
                        onClick={() => handleReview(edit.id, 'approve')}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewing === edit.id}
                        onClick={() => handleReview(edit.id, 'reject')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                  {isExpanded && renderChanges(edit.changes)}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
