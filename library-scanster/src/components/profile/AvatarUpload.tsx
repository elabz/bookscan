import { useState, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';
import { processAndUploadImage } from '@/services/imageService';

interface AvatarUploadProps {
  avatarUrl?: string;
  displayName?: string;
  email?: string;
  onAvatarChange: (url: string) => void;
}

export const AvatarUpload = ({ avatarUrl, displayName, email, onAvatarChange }: AvatarUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const initials = (displayName || email || 'U').substring(0, 2).toUpperCase();

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const urls = await processAndUploadImage(file, `avatar-${Date.now()}`);
      onAvatarChange(urls.medium);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Fallback to file input on mobile
      fileInputRef.current?.click();
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const size = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center crop to square
    const offsetX = (videoRef.current.videoWidth - size) / 2;
    const offsetY = (videoRef.current.videoHeight - size) / 2;
    ctx.drawImage(videoRef.current, offsetX, offsetY, size, size, 0, 0, size, size);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      stopCamera();
      await uploadFile(file);
    }, 'image/jpeg', 0.9);
  }, [stopCamera]);

  if (showCamera) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-48 h-48 object-cover rounded-full"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-background shadow"
            onClick={stopCamera}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={capturePhoto} disabled={isUploading}>
          <Camera className="mr-2 h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Capture'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar className="h-24 w-24">
        <AvatarImage src={avatarUrl} alt={displayName || 'Avatar'} />
        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
      </Avatar>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={startCamera}
        >
          <Camera className="mr-2 h-4 w-4" />
          Take Photo
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
