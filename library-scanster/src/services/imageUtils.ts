
/**
 * Utility functions for image processing
 */

/**
 * Fetches an image from a URL or File and returns it as a Blob
 */
export const fetchImageAsBlob = async (imageSource: string | File): Promise<Blob> => {
  try {
    if (typeof imageSource === 'string') {
      // Handle data URLs or remote URLs
      if (imageSource.startsWith('data:')) {
        // Convert data URL to blob
        const response = await fetch(imageSource);
        return await response.blob();
      } else {
        // Fetch remote image
        const response = await fetch(imageSource, { 
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        
        return await response.blob();
      }
    } else {
      // Already a File (which is a Blob)
      return imageSource;
    }
  } catch (error) {
    console.error('Error in fetchImageAsBlob:', error);
    throw error;
  }
};

/**
 * Rotates an image by 90 degrees clockwise (or counter-clockwise)
 */
export const rotateImage = async (imageBlob: Blob, degrees: 90 | -90 | 180 = 90): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      try {
        if (degrees === 90 || degrees === -90) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((degrees * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert canvas to blob'));
        }, 'image/jpeg', 0.9);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageBlob);
  });
};

/**
 * Resizes an image to a specific width while maintaining aspect ratio
 */
export const resizeImage = async (imageBlob: Blob, targetWidth: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      img.onload = () => {
        try {
          // Calculate the new height to maintain aspect ratio
          const scaleFactor = targetWidth / img.width;
          const targetHeight = img.height * scaleFactor;
          
          // Set canvas dimensions
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          // Draw the image on the canvas
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          
          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          }, 'image/jpeg', 0.9); // Use JPEG with 90% quality
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Set the source of the image
      img.src = URL.createObjectURL(imageBlob);
    } catch (error) {
      reject(error);
    }
  });
};
