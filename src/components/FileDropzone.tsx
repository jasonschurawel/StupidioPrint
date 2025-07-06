import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type { FileData } from '../types';
import { validateFileType, createFilePreview, generateFileId, formatFileSize } from '../utils/fileUtils';
import './FileDropzone.css';

interface FileDropzoneProps {
  onFilesAdded: (files: FileData[]) => void;
  maxFiles?: number;
  maxSize?: number;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ 
  onFilesAdded, 
  maxFiles = 10, 
  maxSize = 50 * 1024 * 1024 // 50MB
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    
    try {
      const fileDataPromises = acceptedFiles
        .filter(validateFileType)
        .slice(0, maxFiles)
        .map(async (file): Promise<FileData> => {
          const preview = await createFilePreview(file);
          return {
            id: generateFileId(),
            name: file.name,
            type: file.type,
            size: file.size,
            file,
            preview,
            url: URL.createObjectURL(file)
          };
        });

      const filesData = await Promise.all(fileDataPromises);
      onFilesAdded(filesData);
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Dateien:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [onFilesAdded, maxFiles]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    maxSize,
    multiple: true
  });

  return (
    <div className="file-dropzone-container">
      <div
        {...getRootProps()}
        className={`file-dropzone ${isDragActive ? 'active' : ''} ${isProcessing ? 'processing' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          {isProcessing ? (
            <div className="processing-indicator">
              <div className="spinner"></div>
              <p>Verarbeite Dateien...</p>
            </div>
          ) : (
            <>
              <div className="dropzone-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 15V3m0 0l-4 4m4-4l4 4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>Dateien hier hineinziehen</h3>
              <p>oder klicken zum Auswählen</p>
              <div className="supported-formats">
                <span>Unterstützt: PDF, JPG, PNG, GIF, BMP, WebP</span>
                <span>Max. Größe: {formatFileSize(maxSize)} pro Datei</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {fileRejections.length > 0 && (
        <div className="file-rejections">
          <h4>Einige Dateien wurden abgelehnt:</h4>
          <ul>
            {fileRejections.map(({ file, errors }) => (
              <li key={file.name}>
                <strong>{file.name}</strong>:
                <ul>
                  {errors.map(error => (
                    <li key={error.code}>{error.message}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
