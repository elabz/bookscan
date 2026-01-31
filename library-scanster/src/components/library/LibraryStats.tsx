import { useQuery } from '@tanstack/react-query';
import { getLibraryStats } from '@/services/profileService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen } from 'lucide-react';

export const LibraryStats = () => {
  const { data: stats } = useQuery({
    queryKey: ['libraryStats'],
    queryFn: getLibraryStats,
  });

  if (!stats) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-primary/10">
      <div className="flex items-center gap-3 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Library Overview</h2>
        <span className="ml-auto text-2xl font-bold text-primary">{stats.totalBooks}</span>
        <span className="text-sm text-muted-foreground">books</span>
      </div>

      {stats.genreCounts.length > 0 && (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.genreCounts.slice(0, 6)}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
