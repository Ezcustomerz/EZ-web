/**
 * Service Draft Manager
 * Handles saving, loading, and managing service creation drafts in localStorage
 */

import type { ServiceFormData } from '../components/popovers/creative/ServiceFormPopover';

const DRAFT_KEY = 'service-draft';
const MAX_PHOTO_SIZE = 1024 * 1024; // 1MB per photo for compression threshold

export interface PhotoData {
  base64: string;
  filename: string;
  size: number;
  type: string;
}

export interface ServiceDraft {
  formData: ServiceFormData;
  activeStep: number;
  timestamp: number;
  deliveryTimeState: {
    minTime: string;
    maxTime: string;
    unit: string;
  };
  isDeliveryTimeEnabled: boolean;
  schedulingData: {
    isSchedulingEnabled: boolean;
    sessionDuration: string;
    defaultSessionLength: string;
    minNotice: { amount: string; unit: 'minutes' | 'hours' | 'days' };
    maxAdvance: { amount: string; unit: 'hours' | 'days' | 'weeks' | 'months' };
    bufferTime: { amount: string; unit: 'minutes' | 'hours' };
    weeklySchedule: {
      day: string;
      enabled: boolean;
      timeBlocks: { start: string; end: string }[];
      timeSlots: { time: string; enabled: boolean }[];
    }[];
  };
  photoData: PhotoData[];
}

/**
 * Compress an image if it's too large
 */
async function compressImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate scaling factor if image is too large
        const maxDimension = 1200;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels to get under maxSize
        let quality = 0.9;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Estimate base64 size (base64 is ~33% larger than binary)
        while (dataUrl.length > maxSize * 1.33 && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(dataUrl);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert File objects to base64 data URLs with compression
 */
export async function convertPhotosToBase64(files: File[]): Promise<PhotoData[]> {
  const photoDataPromises = files.map(async (file) => {
    try {
      let base64: string;
      
      // If file is larger than threshold, compress it
      if (file.size > MAX_PHOTO_SIZE) {
        base64 = await compressImage(file, MAX_PHOTO_SIZE);
      } else {
        // Convert directly to base64
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      }
      
      return {
        base64,
        filename: file.name,
        size: file.size,
        type: file.type,
      };
    } catch (error) {
      console.error('Failed to convert photo:', error);
      return null;
    }
  });
  
  const results = await Promise.all(photoDataPromises);
  return results.filter((data): data is PhotoData => data !== null);
}

/**
 * Convert base64 data URLs back to File objects
 */
export function convertBase64ToFiles(photoData: PhotoData[]): File[] {
  return photoData.map((data) => {
    try {
      // Extract base64 data
      const base64Data = data.base64.split(',')[1];
      const byteString = atob(base64Data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([ab], { type: data.type });
      return new File([blob], data.filename, { type: data.type });
    } catch (error) {
      console.error('Failed to convert base64 to file:', error);
      return null;
    }
  }).filter((file): file is File => file !== null);
}

/**
 * Save draft to localStorage
 */
export function saveDraft(draft: ServiceDraft): boolean {
  try {
    const draftString = JSON.stringify(draft);
    localStorage.setItem(DRAFT_KEY, draftString);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Cannot save draft.');
      // Try to save without photos
      try {
        const draftWithoutPhotos = { ...draft, photoData: [] };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftWithoutPhotos));
        console.warn('Draft saved without photos due to storage limits.');
        return false;
      } catch (retryError) {
        console.error('Failed to save draft even without photos:', retryError);
        return false;
      }
    }
    console.error('Failed to save draft:', error);
    return false;
  }
}

/**
 * Load draft from localStorage
 */
export function loadDraft(): ServiceDraft | null {
  try {
    const draftString = localStorage.getItem(DRAFT_KEY);
    if (!draftString) {
      return null;
    }
    
    const draft = JSON.parse(draftString) as ServiceDraft;
    return draft;
  } catch (error) {
    console.error('Failed to load draft:', error);
    // Clear corrupted draft
    clearDraft();
    return null;
  }
}

/**
 * Clear draft from localStorage
 */
export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.error('Failed to clear draft:', error);
  }
}

/**
 * Check if a draft exists
 */
export function hasDraft(): boolean {
  try {
    return localStorage.getItem(DRAFT_KEY) !== null;
  } catch (error) {
    console.error('Failed to check for draft:', error);
    return false;
  }
}

/**
 * Get relative time string for draft timestamp
 */
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else {
    return 'Just now';
  }
}
