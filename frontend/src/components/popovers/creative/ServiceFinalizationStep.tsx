import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  IconButton,
} from '@mui/material';
import { 
  Upload,
  CloudUpload,
  PhotoLibrary,
  Delete,
  Visibility
} from '@mui/icons-material';
import React, { useCallback, useState } from 'react';

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
}

export function ServiceFinalizationStep({
  uploadedFiles,
  onFilesChange,
  onFinalize,
  isFinalizing
}: ServiceFinalizationStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    setIsUploading(true);
    
    Array.from(files).forEach((file) => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

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
        
        onFilesChange([...uploadedFiles, newFile]);
      };
      reader.readAsDataURL(file);
    });

    setTimeout(() => setIsUploading(false), 1000);
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

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
            cursor: 'pointer',
            '&:hover': {
              borderColor: '#3b82f6',
              backgroundColor: '#f0f9ff',
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
          <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
            <CloudUpload sx={{ fontSize: 48, color: dragActive ? '#3b82f6' : '#9ca3af', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {dragActive ? 'Drop files here' : 'Upload Files (Optional)'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Drag and drop files here, or click to browse. Any file type is supported.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              component="span"
              disabled={isUploading}
              sx={{
                borderColor: '#3b82f6',
                color: '#3b82f6',
                '&:hover': {
                  borderColor: '#2563eb',
                  backgroundColor: '#f0f9ff',
                }
              }}
            >
              {isUploading ? 'Uploading...' : 'Choose Files'}
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
