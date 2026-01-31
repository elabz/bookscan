import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/services/profileService';

const profileSchema = z.object({
  display_name: z.string().min(1, 'Display name is required').max(100),
  username: z.string().max(50).regex(/^[a-zA-Z0-9_-]*$/, 'Only letters, numbers, hyphens, underscores').optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
  location: z.string().max(100).optional().or(z.literal('')),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  reading_goal: z.coerce.number().int().min(0).max(1000).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  profile: UserProfile;
  onSave: (data: Partial<UserProfile>) => Promise<void>;
  isSaving: boolean;
}

export const ProfileForm = ({ profile, onSave, isSaving }: ProfileFormProps) => {
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile.display_name || '',
      username: profile.username || '',
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      phone: profile.phone || '',
      reading_goal: profile.reading_goal || undefined,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="display_name">Display Name</Label>
          <Input id="display_name" {...register('display_name')} />
          {errors.display_name && <p className="text-sm text-destructive mt-1">{errors.display_name.message}</p>}
        </div>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" {...register('username')} placeholder="@username" />
          {errors.username && <p className="text-sm text-destructive mt-1">{errors.username.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={profile.email || ''} disabled className="opacity-60" />
        <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here</p>
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" {...register('bio')} placeholder="Tell us about yourself" rows={3} />
        {errors.bio && <p className="text-sm text-destructive mt-1">{errors.bio.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...register('location')} placeholder="City, Country" />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input id="website" {...register('website')} placeholder="https://..." />
          {errors.website && <p className="text-sm text-destructive mt-1">{errors.website.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register('phone')} placeholder="+1..." />
        </div>
        <div>
          <Label htmlFor="reading_goal">Annual Reading Goal</Label>
          <Input id="reading_goal" type="number" {...register('reading_goal')} placeholder="e.g. 24" />
          {errors.reading_goal && <p className="text-sm text-destructive mt-1">{errors.reading_goal.message}</p>}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSaving || !isDirty}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};
