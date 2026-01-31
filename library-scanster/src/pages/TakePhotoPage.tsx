
import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CameraView } from '@/components/scan/CameraView';
import { processImageFromDataURL } from '@/services/imageService';
import { useToast } from '@/components/ui/use-toast';

const TakePhotoPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUploading, setIsUploading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Get the ISBN from location state (passed during navigation)
  const isbn = location.state?.isbn || '';
  const returnPath = location.state?.returnPath || '/books/add';
  
  const handlePhotoCapture = async (dataUrl: string) => {
    setCapturedImage(dataUrl);
  };
  
  const handleCancel = () => {
    navigate(returnPath);
  };
  
  const handleSavePhoto = async () => {
    if (!capturedImage) return;
    
    setIsUploading(true);
    try {
      const processedImages = await processImageFromDataURL(capturedImage, isbn);
      
      // Navigate back with the processed image URLs
      navigate(returnPath, { 
        state: { 
          coverUrl: processedImages.medium,
          coverSmallUrl: processedImages.small,
          coverLargeUrl: processedImages.large
        } 
      });
      
      toast({
        title: "Success",
        description: "Photo saved successfully",
      });
    } catch (error) {
      console.error('Error processing camera image:', error);
      toast({
        title: "Error",
        description: "Failed to process photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={handleCancel}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Take Photo</h1>
        </div>
        
        {!capturedImage ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm mb-8">
            <CameraView
              onPhotoCapture={handlePhotoCapture}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8">
            <h2 className="text-xl font-medium mb-4">Review Photo</h2>
            <div className="aspect-ratio-container mb-4" style={{ aspectRatio: '3/4' }}>
              <img 
                src={capturedImage} 
                alt="Captured photo" 
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => setCapturedImage(null)}
              >
                Retake Photo
              </Button>
              <Button 
                onClick={handleSavePhoto}
                disabled={isUploading}
              >
                {isUploading ? "Saving..." : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Use Photo
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default TakePhotoPage;
