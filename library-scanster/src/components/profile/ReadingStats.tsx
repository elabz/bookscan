import { LibraryStats } from '@/services/profileService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen, Target } from 'lucide-react';

interface ReadingStatsProps {
  stats: LibraryStats;
  readingGoal?: number;
}

export const ReadingStats = ({ stats, readingGoal }: ReadingStatsProps) => {
  const goalProgress = readingGoal ? Math.min((stats.totalBooks / readingGoal) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-primary/5 rounded-xl p-4 text-center">
          <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{stats.totalBooks}</p>
          <p className="text-sm text-muted-foreground">Total Books</p>
        </div>
        {readingGoal && readingGoal > 0 && (
          <div className="bg-primary/5 rounded-xl p-4 text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.totalBooks}/{readingGoal}</p>
            <p className="text-sm text-muted-foreground">Reading Goal</p>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Genre distribution */}
      {stats.genreCounts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">Books by Genre</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.genreCounts.slice(0, 8)} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent additions */}
      {stats.recentBooks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">Recent Additions</h3>
          <div className="space-y-2">
            {stats.recentBooks.map((book) => (
              <div key={book.id} className="flex items-center gap-3 text-sm">
                {book.cover_small_url && (
                  <img src={book.cover_small_url} alt="" className="h-8 w-6 object-cover rounded" />
                )}
                <span className="truncate">{book.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
