import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  IconButton,
  Alert,
  Collapse,
} from '@mui/material';
import { 
  Upload,
  CloudUpload,
  PhotoLibrary,
  Delete,
  Visibility,
  Settings
} from '@mui/icons-material';
import React, { useCallback, useState, useEffect } from 'react';
import { errorToast } from '../../toast/toast';

// Progress bar component for duplicate error alert
const DuplicateErrorProgressBar = ({ startTime, duration = 3000 }: { startTime: number; duration?: number }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const progressPercent = (remaining / duration) * 100;
      setProgress(progressPercent);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, [startTime, duration]);

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 4,
        backgroundColor: '#d32f2f', // Dark red color for error alerts
        width: `${progress}%`,
        transition: 'width 50ms linear',
        borderRadius: '0 0 4px 4px',
        zIndex: 1,
      }}
    />
  );
};

// Define uploaded file interface
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  preview?: string;
  uploadedAt: Date;
}

export interface ServiceFinalizationStepProps {
  uploadedFiles: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onFinalize: () => void;
  isFinalizing: boolean;
  storageUsedBytes?: number;
  storageLimitBytes?: number;
  onStorageExceededChange?: (exceeded: boolean) => void;
  onManageStorage?: () => void;
}

export function ServiceFinalizationStep({
  uploadedFiles,
  onFilesChange,
  onFinalize,
  isFinalizing,
  storageUsedBytes = 0,
  storageLimitBytes = 0,
  onStorageExceededChange,
  onManageStorage
}: ServiceFinalizationStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [duplicateFileError, setDuplicateFileError] = useState<string | null>(null);
  const [duplicateErrorStartTime, setDuplicateErrorStartTime] = useState<number>(0);

  // Check if current uploaded files would exceed storage limit
  const checkCurrentStorageExceeded = useCallback(() => {
    if (storageLimitBytes === 0) {
      return false; // No limit, not exceeded
    }

    const existingUploadedSize = uploadedFiles.reduce((sum, file) => sum + file.size, 0);
    const totalSizeAfterUpload = storageUsedBytes + existingUploadedSize;

    return totalSizeAfterUpload > storageLimitBytes;
  }, [uploadedFiles, storageUsedBytes, storageLimitBytes]);

  // Calculate if storage is exceeded for button disabling
  const isStorageExceeded = checkCurrentStorageExceeded();

  // Notify parent when storage exceeded status changes
  useEffect(() => {
    if (onStorageExceededChange) {
      const exceeded = checkCurrentStorageExceeded();
      onStorageExceededChange(exceeded);
    }
  }, [uploadedFiles, storageUsedBytes, storageLimitBytes, checkCurrentStorageExceeded, onStorageExceededChange]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const checkStorageLimit = (newFiles: File[]): { allowed: boolean; error?: string } => {
    if (storageLimitBytes === 0) {
      // No storage limit set, allow upload
      return { allowed: true };
    }

    // Calculate total size of new files
    const newFilesSize = newFiles.reduce((sum, file) => sum + file.size, 0);
    
    // Calculate current total size (existing uploaded files + current storage used)
    const existingUploadedSize = uploadedFiles.reduce((sum, file) => sum + file.size, 0);
    const totalSizeAfterUpload = storageUsedBytes + existingUploadedSize + newFilesSize;

    if (totalSizeAfterUpload > storageLimitBytes) {
      const overage = totalSizeAfterUpload - storageLimitBytes;
      return {
        allowed: false,
        error: `Uploading these files would exceed your storage limit by ${formatFileSize(overage)}. You have ${formatFileSize(Math.max(0, storageLimitBytes - storageUsedBytes - existingUploadedSize))} remaining.`
      };
    }

    return { allowed: true };
  };

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    // Validate all files first
    fileArray.forEach((file) => {
      // Validate file size (max 30GB to match backend)
      if (file.size > 30 * 1024 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (exceeds 30GB limit)`);
      } else {
        validFiles.push(file);
      }
    });
    
    // Show error for invalid files
    if (invalidFiles.length > 0) {
      errorToast(`The following files exceed the 30GB size limit:\n${invalidFiles.join('\n')}`);
    }
    
    if (validFiles.length === 0) {
      setIsUploading(false);
      return;
    }

    // Check for duplicate filenames
    const existingFilenames = new Set(uploadedFiles.map(f => f.name));
    const duplicates: string[] = [];
    const uniqueFiles = validFiles.filter(file => {
      if (existingFilenames.has(file.name)) {
        duplicates.push(file.name);
        return false;
      }
      return true;
    });

    // Show warning if duplicates were detected
    if (duplicates.length > 0) {
      setDuplicateFileError(duplicates.length === 1 ? 'Duplicate file detected' : `${duplicates.length} duplicate files detected`);
      setDuplicateErrorStartTime(Date.now());
      // Clear error after 3 seconds
      setTimeout(() => setDuplicateFileError(null), 3000);
    }

    if (uniqueFiles.length === 0) {
      setIsUploading(false);
      return;
    }

    // Check storage limit before allowing upload
    const storageCheck = checkStorageLimit(uniqueFiles);
    if (!storageCheck.allowed) {
      setStorageError(storageCheck.error || 'Storage limit would be exceeded');
      errorToast(storageCheck.error || 'Storage limit would be exceeded');
      setIsUploading(false);
      return;
    }
    
    // Clear any previous storage errors
    setStorageError(null);
    
    // Process all valid files and add them in batch
    const newFiles: UploadedFile[] = [];
    let processedCount = 0;
    
    uniqueFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          preview: e.target?.result as string,
          uploadedAt: new Date()
        };
        
        newFiles.push(newFile);
        processedCount++;
        
        // When all files are processed, add them all at once
        if (processedCount === uniqueFiles.length) {
          onFilesChange([...uploadedFiles, ...newFiles]);
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        processedCount++;
        if (processedCount === uniqueFiles.length) {
          onFilesChange([...uploadedFiles, ...newFiles]);
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [uploadedFiles, onFilesChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    // Prevent drop if storage is full
    if (storageLimitBytes > 0 && storageUsedBytes >= storageLimitBytes) {
      errorToast('Storage limit reached. Please delete some files before uploading new ones.');
      return;
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload, storageLimitBytes, storageUsedBytes]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  const handleRemoveFile = (fileId: string) => {
    onFilesChange(uploadedFiles.filter(file => file.id !== fileId));
  };

  return (
    <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
          Finalize Service
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload any files you want to deliver to your client. This step is optional - you can finalize without uploading files.
        </Typography>

        {/* Storage Progress Bar */}
        {storageLimitBytes > 0 && (() => {
          const existingUploadedSize = uploadedFiles.reduce((sum, file) => sum + file.size, 0);
          const totalSizeAfterUpload = storageUsedBytes + existingUploadedSize;
          const isExceeded = totalSizeAfterUpload > storageLimitBytes;
          const overageBytes = isExceeded ? totalSizeAfterUpload - storageLimitBytes : 0;
          
          // Calculate percentages only when not exceeded
          const currentStoragePercentage = !isExceeded ? (storageUsedBytes / storageLimitBytes) * 100 : 0;
          const pendingFilesPercentage = !isExceeded ? (existingUploadedSize / storageLimitBytes) * 100 : 0;

          return (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {isExceeded 
                    ? `Storage: ${formatFileSize(totalSizeAfterUpload)} / ${formatFileSize(storageLimitBytes)} (exceeds limit)`
                    : `Storage: ${formatFileSize(storageUsedBytes)} / ${formatFileSize(storageLimitBytes)} used${existingUploadedSize > 0 ? ` (+ ${formatFileSize(existingUploadedSize)} pending)` : ''}`}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600,
                      color: isExceeded ? 'error.main' : 'text.secondary'
                    }}
                  >
                    {isExceeded 
                      ? `Exceeds by ${formatFileSize(overageBytes)}`
                      : `${formatFileSize(Math.max(0, storageLimitBytes - totalSizeAfterUpload))} remaining`}
                  </Typography>
                  {onManageStorage && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Settings />}
                      onClick={onManageStorage}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        minWidth: 'auto',
                        px: 1.5,
                        py: 0.5,
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          borderColor: 'primary.dark',
                          backgroundColor: 'primary.light',
                          color: 'primary.dark',
                        }
                      }}
                    >
                      Manage Storage
                    </Button>
                  )}
                </Box>
              </Box>
              
              {/* Progress Bar */}
              <Box sx={{ position: 'relative', width: '100%', height: 12, borderRadius: 6, overflow: 'hidden' }}>
                {/* Background */}
                <Box
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backgroundColor: isExceeded ? 'error.light' : 'grey.200',
                  }}
                />
                
                {isExceeded ? (
                  // When exceeded: show full bar as red
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: '100%',
                      backgroundColor: 'error.main',
                    }}
                  />
                ) : (
                  <>
                    {/* Current storage (blue) - already used */}
                    {currentStoragePercentage > 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          width: `${Math.min(currentStoragePercentage, 100)}%`,
                          backgroundColor: 'primary.main',
                        }}
                      />
                    )}
                    {/* Pending files (orange/warning) - files to be uploaded */}
                    {pendingFilesPercentage > 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: `${Math.min(currentStoragePercentage, 100)}%`,
                          top: 0,
                          height: '100%',
                          width: `${Math.min(pendingFilesPercentage, Math.max(0, 100 - currentStoragePercentage))}%`,
                          backgroundColor: 'warning.main',
                        }}
                      />
                    )}
                  </>
                )}
              </Box>
              
              {isExceeded && (
                <Alert severity="error" sx={{ mt: 1.5 }}>
                  <Typography variant="body2">
                    Uploading these files would exceed your storage limit by {formatFileSize(overageBytes)}. Please remove some files before finalizing.
                  </Typography>
                </Alert>
              )}
            </Box>
          );
        })()}

        {/* Storage Error Alert */}
        {storageError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setStorageError(null)}>
            {storageError}
          </Alert>
        )}

        {/* Duplicate File Error Alert */}
        <Collapse in={!!duplicateFileError}>
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              position: 'relative',
              overflow: 'hidden',
              paddingBottom: '0 !important', // Remove bottom padding to show progress bar
            }}
          >
            <Box sx={{ pb: 1 }}>
              {duplicateFileError}
            </Box>
            {duplicateErrorStartTime > 0 && <DuplicateErrorProgressBar startTime={duplicateErrorStartTime} />}
          </Alert>
        </Collapse>

        {/* Upload Area */}
        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            border: `2px dashed ${dragActive ? '#3b82f6' : '#d1d5db'}`,
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            backgroundColor: dragActive ? '#f0f9ff' : '#fafafa',
            transition: 'all 0.2s ease',
            cursor: (storageLimitBytes > 0 && storageUsedBytes >= storageLimitBytes) ? 'not-allowed' : 'pointer',
            opacity: (storageLimitBytes > 0 && storageUsedBytes >= storageLimitBytes) ? 0.6 : 1,
            '&:hover': {
              borderColor: (storageLimitBytes > 0 && storageUsedBytes >= storageLimitBytes) ? '#d1d5db' : '#3b82f6',
              backgroundColor: (storageLimitBytes > 0 && storageUsedBytes >= storageLimitBytes) ? '#fafafa' : '#f0f9ff',
            }
          }}
        >
          <input
            type="file"
            multiple
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label 
            htmlFor="file-upload" 
            style={{ 
              cursor: (storageLimitBytes > 0 && storageUsedBytes >= storageLimitBytes) ? 'not-allowed' : 'pointer', 
              display: 'block',
              pointerEvents: (storageLimitBytes > 0 && storageUsedBytes >= storageLimitBytes) ? 'none' : 'auto'
            }}
          >
            <CloudUpload sx={{ fontSize: 48, color: dragActive ? '#3b82f6' : '#9ca3af', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {dragActive ? 'Drop files here' : storageLimitBytes > 0 && storageUsedBytes >= storageLimitBytes ? 'Storage Full' : 'Upload Files (Optional)'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {storageLimitBytes > 0 && storageUsedBytes >= storageLimitBytes
                ? 'You have reached your storage limit. Please delete some files before uploading new ones.'
                : 'Drag and drop multiple files here, or click to browse and select multiple files. Any file type is supported (max 30GB per file).'}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              component="span"
              disabled={isUploading || (storageLimitBytes > 0 && storageUsedBytes >= storageLimitBytes)}
              sx={{
                borderColor: '#3b82f6',
                color: '#3b82f6',
                '&:hover': {
                  borderColor: '#2563eb',
                  backgroundColor: '#f0f9ff',
                },
                '&:disabled': {
                  borderColor: '#d1d5db',
                  color: '#9ca3af',
                }
              }}
            >
              {isUploading ? 'Uploading...' : storageLimitBytes > 0 && storageUsedBytes >= storageLimitBytes ? 'Storage Full' : 'Choose Files'}
            </Button>
          </label>
        </Box>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Files to Deliver ({uploadedFiles.length})
            </Typography>
            <Stack spacing={1}>
              {uploadedFiles.map((file) => (
                <Box
                  key={file.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    border: '1px solid #e2e8f0',
                    borderRadius: 1,
                    backgroundColor: '#fafafa'
                  }}
                >
                  <PhotoLibrary sx={{ color: '#3b82f6', fontSize: 20 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.size)} • {file.uploadedAt.toLocaleTimeString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => window.open(file.url, '_blank')}>
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleRemoveFile(file.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
