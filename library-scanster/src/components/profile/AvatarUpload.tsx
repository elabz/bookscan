import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';
import { processAndUploadImage } from '@/services/imageService';

interface AvatarUploadProps {
  avatarUrl?: string;
  displayName?: string;
  email?: string;
  onAvatarChange: (url: string) => void;
}

export const AvatarUpload = ({ avatarUrl, displayName, email, onAvatarChange }: AvatarUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const initials = (displayName || email || 'U').substring(0, 2).toUpperCase();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const urls = await processAndUploadImage(file, `avatar-${Date.now()}`);
      onAvatarChange(urls.medium);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setIsUploading(false);
      // Reset inputs so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar className="h-24 w-24">
        <AvatarImage src={avatarUrl} alt={displayName || 'Avatar'} />
        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
      </Avatar>
      {/* File upload input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      {/* Camera capture input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera className="mr-2 h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Take Photo'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </div>
    </div>
  );
};
