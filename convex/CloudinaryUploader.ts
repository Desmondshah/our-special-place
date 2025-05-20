// src/utils/CloudinaryUploader.ts
const CLOUDINARY_CLOUD_NAME = "dzpyafpzu";
const CLOUDINARY_UPLOAD_PRESET = "unsigned_uploads";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Uploads an image to Cloudinary
 * @param imageData The base64 or dataURL of the image
 * @param onProgress Optional callback for upload progress
 * @returns Promise with Cloudinary URL on success
 */
export async function uploadToCloudinary(
  imageData: string, 
  onProgress?: (progress: number) => void
): Promise<string> {
  // If it's already a URL (from Cloudinary or elsewhere), don't re-upload
  if (imageData.startsWith('http')) {
    return imageData;
  }

  // Convert data URL to blob
  let blob;
  try {
    // Get just the base64 part if it's a data URL
    const base64Data = imageData.split(',')[1];
    const mimeType = imageData.split(';')[0].split(':')[1];
    blob = base64ToBlob(base64Data, mimeType);
  } catch (error) {
    console.error("Error converting to blob:", error);
    throw new Error("Invalid image format");
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  // Track upload with XHR for progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Progress tracking
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } catch (error) {
          reject(new Error("Failed to parse response"));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };
    
    xhr.onerror = () => {
      reject(new Error("Network error"));
    };
    
    xhr.open('POST', CLOUDINARY_URL);
    xhr.send(formData);
  });
}

/**
 * Convert base64 to Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: mimeType });
}

/**
 * Uploads multiple images to Cloudinary sequentially
 * @param images Array of image data URLs
 * @param onProgress Optional callback for progress (index, progress)
 * @returns Array of Cloudinary URLs
 */
export async function uploadMultiple(
  images: string[],
  onProgress?: (index: number, progress: number, url: string) => void
): Promise<string[]> {
  const urls: string[] = [];
  
  // Upload each image sequentially
  for (let i = 0; i < images.length; i++) {
    try {
      // Skip upload if it's already a URL
      if (images[i].startsWith('http')) {
        urls.push(images[i]);
        if (onProgress) {
          onProgress(i, 100, images[i]);
        }
        continue;
      }
      
      // Upload to Cloudinary
      const url = await uploadToCloudinary(
        images[i],
        (progress) => {
          if (onProgress) {
            onProgress(i, progress, '');
          }
        }
      );
      
      urls.push(url);
      
      if (onProgress) {
        onProgress(i, 100, url);
      }
    } catch (error) {
      console.error(`Failed to upload image ${i+1}:`, error);
    }
  }
  
  return urls;
}