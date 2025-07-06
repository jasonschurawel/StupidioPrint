import React, { useState, useEffect, useCallback } from 'react';
import type { FileData, PrintSettings, FileAdjustments } from '../types';
import { generateCombinedPrintPreview } from '../utils/fileUtils';
import './PrintPreviewModal.css';

interface PrintPreviewModalProps {
  files: FileData[];
  printSettings: PrintSettings;
  fileAdjustments: Record<string, FileAdjustments>;
  isOpen: boolean;
  mode?: 'view' | 'print';
  onClose: () => void;
  onConfirmPrint: () => void;
  isPrinting: boolean;
}

const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  files,
  printSettings,
  fileAdjustments,
  isOpen,
  mode = 'print',
  onClose,
  onConfirmPrint,
  isPrinting
}) => {
  const [combinedPreviewUrl, setCombinedPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePreviews = useCallback(async () => {
    setIsGenerating(true);
    console.log('Starting combined preview generation for', files.length, 'files');
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Preview generation timeout')), 15000)
      );
      
      const previewPromise = async () => {
        // Generate combined preview for all files (what will actually be printed)
        console.log('PrintPreviewModal: Generating combined preview...');
        const combinedUrl = await generateCombinedPrintPreview(files, printSettings, fileAdjustments);
        setCombinedPreviewUrl(combinedUrl);
        console.log('PrintPreviewModal: Combined preview generated successfully');
        return combinedUrl;
      };
      
      await Promise.race([previewPromise(), timeoutPromise]);
      
      console.log('Combined preview generated successfully');
    } catch (error) {
      console.error('Error generating preview:', error);
      setCombinedPreviewUrl(null);
    } finally {
      setIsGenerating(false);
    }
  }, [files, printSettings, fileAdjustments]);

  useEffect(() => {
    if (isOpen && files.length > 0) {
      generatePreviews();
    }
  }, [isOpen, files, printSettings, generatePreviews]);

  if (!isOpen) return null;

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={e => e.stopPropagation()}>
        <div className="preview-header">
          <h3>Druckvorschau - Genau so wird alles gedruckt</h3>
          <button 
            className="btn-close"
            onClick={onClose}
            disabled={isPrinting}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        <div className="preview-content">
          {isGenerating ? (
            <div className="preview-loading">
              <div className="spinner"></div>
              <p>Generiere Vorschau...</p>
            </div>
          ) : combinedPreviewUrl ? (
            <div className="preview-display">
              <iframe
                src={combinedPreviewUrl}
                className="preview-frame"
                title="Druckvorschau"
              />
            </div>
          ) : (
            <div className="preview-error">
              <p>Keine Vorschau verfügbar</p>
              <div className="debug-info">
                <p><small>Debug Info:</small></p>
                <p><small>Combined Preview URL: {combinedPreviewUrl ? 'Available' : 'Not available'}</small></p>
                <p><small>Is Generating: {isGenerating ? 'Yes' : 'No'}</small></p>
              </div>
            </div>
          )}
        </div>

        <div className="preview-actions">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={isPrinting}
          >
            {mode === 'view' ? 'Schließen' : 'Abbrechen'}
          </button>
          
          {mode === 'print' && (
            <button
              className="btn-primary"
              onClick={onConfirmPrint}
              disabled={isPrinting || isGenerating}
            >
              {isPrinting ? (
                <>
                  <div className="spinner-small"></div>
                  Drucke...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <polyline points="6,9 6,2 18,2 18,9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" stroke="currentColor" strokeWidth="2"/>
                    <rect x="6" y="14" width="12" height="8" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Jetzt drucken
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrintPreviewModal;
