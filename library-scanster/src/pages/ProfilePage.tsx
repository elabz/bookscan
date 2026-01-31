import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ReadingStats } from '@/components/profile/ReadingStats';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, getLibraryStats, UserProfile } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const ProfilePage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['libraryStats'],
    queryFn: getLibraryStats,
  });

  const handleSave = async (data: Partial<UserProfile>) => {
    setIsSaving(true);
    try {
      await updateProfile(data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Profile updated', description: 'Your changes have been saved' });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: 'Failed to save', description: 'Please try again', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (url: string) => {
    try {
      await updateProfile({ avatar_url: url });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Avatar updated' });
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast({ title: 'Failed to update avatar', variant: 'destructive' });
    }
  };

  if (profileLoading) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
          {/* Left column: Avatar + Stats */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-primary/10">
              <AvatarUpload
                avatarUrl={profile?.avatar_url}
                displayName={profile?.display_name}
                email={profile?.email}
                onAvatarChange={handleAvatarChange}
              />
            </div>

            {stats && !statsLoading && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-primary/10">
                <h2 className="text-lg font-semibold mb-4">Reading Stats</h2>
                <ReadingStats stats={stats} readingGoal={profile?.reading_goal} />
              </div>
            )}
          </div>

          {/* Right column: Profile form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-primary/10">
            <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
            {profile && (
              <ProfileForm profile={profile} onSave={handleSave} isSaving={isSaving} />
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ProfilePage;
