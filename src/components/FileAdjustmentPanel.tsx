import React, { useState, useEffect, useRef } from 'react';
import type { FileAdjustments, FileData, PrintSettings } from '../types';
import { generatePrintPreview } from '../utils/fileUtils';
import './FileAdjustmentPanel.css';

interface FileAdjustmentPanelProps {
  fileId: string;
  fileData: FileData;
  printSettings?: PrintSettings;
  onUpdateAdjustments: (id: string, adjustments: FileAdjustments) => void;
}

const FileAdjustmentPanel: React.FC<FileAdjustmentPanelProps> = ({
  fileId,
  fileData,
  printSettings = {
    printer: 'default',
    paperSize: 'A4',
    quality: 'normal',
    colorMode: 'color',
    duplex: 'einseitig'
  },
  onUpdateAdjustments
}) => {
  const [adjustments, setAdjustments] = useState<FileAdjustments>({
    scale: 100,
    rotation: 0,
    copies: 1,
    orientation: 'portrait',
    pageRange: 'all',
    pageNumbers: '',
    pagesPerPage: 1,
    layoutColumns: 1,
    layoutRows: 1,
    pageMode: 'sequential',
    enabledGridPositions: [true]
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const currentGenerationRef = useRef(0);

  const generateLivePreview = async (currentAdjustments: FileAdjustments) => {
    if (!fileData) return;
    
    const generation = ++currentGenerationRef.current;
    setIsGeneratingPreview(true);
    
    try {
      // Clean up previous preview URL
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      
      // Generate new preview
      const newPreviewUrl = await generatePrintPreview(fileData, printSettings, currentAdjustments);
      
      // Only update if this is still the latest generation
      if (generation === currentGenerationRef.current) {
        setPreviewUrl(newPreviewUrl);
      } else {
        // Clean up if outdated
        URL.revokeObjectURL(newPreviewUrl);
      }
    } catch (error) {
      console.error('FileAdjustmentPanel: Error generating live preview:', error);
      if (generation === currentGenerationRef.current) {
        setPreviewUrl(null);
      }
    } finally {
      if (generation === currentGenerationRef.current) {
        setIsGeneratingPreview(false);
      }
    }
  };

  // Debounced preview generation
  const schedulePreviewGeneration = (newAdjustments: FileAdjustments) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Schedule new preview generation
    timeoutRef.current = setTimeout(() => {
      generateLivePreview(newAdjustments);
    }, 500);
  };

  // Generate initial preview when fileData changes
  useEffect(() => {
    if (fileData) {
      generateLivePreview(adjustments);
    }
  }, [fileData?.id]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  const handleAdjustmentChange = (key: keyof FileAdjustments, value: number | string | boolean[]) => {
    const newAdjustments = { ...adjustments, [key]: value };
    setAdjustments(newAdjustments);
    onUpdateAdjustments(fileId, newAdjustments);
    
    // Schedule debounced preview generation
    schedulePreviewGeneration(newAdjustments);
  };

  const resetAdjustments = () => {
    const defaultAdjustments: FileAdjustments = {
      scale: 100,
      rotation: 0,
      copies: 1,
      orientation: 'portrait',
      pageRange: 'all',
      pageNumbers: '',
      pagesPerPage: 1,
      layoutColumns: 1,
      layoutRows: 1,
      pageMode: 'sequential',
      enabledGridPositions: [true]
    };
    setAdjustments(defaultAdjustments);
    onUpdateAdjustments(fileId, defaultAdjustments);
    
    // Generate preview immediately for reset
    generateLivePreview(defaultAdjustments);
  };

  return (
    <div className="file-adjustment-panel">
      <div className="adjustment-header">
        <h4>Dateianpassungen</h4>
        <button className="btn-reset" onClick={resetAdjustments}>
          Zurücksetzen
        </button>
      </div>

      <div className="file-adjustment-main">
        <div className="file-adjustment-content">
          <div className="adjustment-grid">
        <div className="adjustment-group">
          <label htmlFor={`scale-${fileId}`}>
            Skalierung ({adjustments.scale}%)
          </label>
          <input
            id={`scale-${fileId}`}
            type="range"
            min="10"
            max="200"
            step="5"
            value={adjustments.scale}
            onChange={(e) => handleAdjustmentChange('scale', parseInt(e.target.value))}
            className="slider"
          />
          <div className="slider-labels">
            <span>10%</span>
            <span>200%</span>
          </div>
        </div>

        <div className="adjustment-group">
          <label>Ausrichtung</label>
          <div className="orientation-buttons">
            <button
              className={`btn-orientation ${adjustments.rotation === 0 ? 'active' : ''}`}
              onClick={() => handleAdjustmentChange('rotation', 0)}
              title="Normal (0°)"
            >
              <span className="page-icon" style={{ transform: 'rotate(0deg)' }}>📄</span>
            </button>
            <button
              className={`btn-orientation ${adjustments.rotation === 90 ? 'active' : ''}`}
              onClick={() => handleAdjustmentChange('rotation', 90)}
              title="90° rechts"
            >
              <span className="page-icon" style={{ transform: 'rotate(90deg)' }}>📄</span>
            </button>
            <button
              className={`btn-orientation ${adjustments.rotation === 180 ? 'active' : ''}`}
              onClick={() => handleAdjustmentChange('rotation', 180)}
              title="180°"
            >
              <span className="page-icon" style={{ transform: 'rotate(180deg)' }}>📄</span>
            </button>
            <button
              className={`btn-orientation ${adjustments.rotation === 270 ? 'active' : ''}`}
              onClick={() => handleAdjustmentChange('rotation', 270)}
              title="270° / 90° links"
            >
              <span className="page-icon" style={{ transform: 'rotate(270deg)' }}>📄</span>
            </button>
          </div>
        </div>

        <div className="adjustment-group">
          <label htmlFor={`copies-${fileId}`}>
            Exemplare ({adjustments.copies})
          </label>
          <input
            id={`copies-${fileId}`}
            type="range"
            min="1"
            max="10"
            step="1"
            value={adjustments.copies}
            onChange={(e) => handleAdjustmentChange('copies', parseInt(e.target.value))}
            className="slider"
          />
          <div className="slider-labels">
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        <div className="adjustment-group">
          <label>Seiten auswählen</label>
          <div className="page-selection">
            <div className="page-range-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name={`pageRange-${fileId}`}
                  value="all"
                  checked={adjustments.pageRange === 'all'}
                  onChange={(e) => handleAdjustmentChange('pageRange', e.target.value)}
                />
                Alle Seiten
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name={`pageRange-${fileId}`}
                  value="specific"
                  checked={adjustments.pageRange === 'specific'}
                  onChange={(e) => handleAdjustmentChange('pageRange', e.target.value)}
                />
                Bestimmte Seiten
              </label>
            </div>
            {adjustments.pageRange === 'specific' && (
              <input
                type="text"
                placeholder="z.B. 1,3,5-10"
                value={adjustments.pageNumbers || ''}
                onChange={(e) => handleAdjustmentChange('pageNumbers', e.target.value)}
                className="page-numbers-input"
              />
            )}
          </div>
        </div>
          </div>
        </div>

        {/* Pages per sheet section moved outside and positioned to the right */}
        <div className="pages-per-sheet-section">
          <h4>Seiten pro Blatt</h4>
          <div className="pages-per-sheet-container">
          <div className="layout-container">
            <div className="layout-controls">
              <div className="layout-control-row">
                <label htmlFor={`columns-${fileId}`}>Spalten:</label>
                <select
                  id={`columns-${fileId}`}
                  value={adjustments.layoutColumns}
                  onChange={(e) => {
                    const columns = Number(e.target.value);
                    const totalPages = columns * adjustments.layoutRows;
                    // Initialize grid positions (all enabled by default)
                    const enabledPositions = new Array(totalPages).fill(true);
                    
                    // Batch all changes together
                    const newAdjustments = {
                      ...adjustments,
                      layoutColumns: columns,
                      pagesPerPage: totalPages,
                      enabledGridPositions: enabledPositions
                    };
                    setAdjustments(newAdjustments);
                    onUpdateAdjustments(fileId, newAdjustments);
                    schedulePreviewGeneration(newAdjustments);
                  }}
                  className="layout-select"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </div>

              <div className="layout-control-row">
                <label htmlFor={`rows-${fileId}`}>Zeilen:</label>
                <select
                  id={`rows-${fileId}`}
                  value={adjustments.layoutRows}
                  onChange={(e) => {
                    const rows = Number(e.target.value);
                    const totalPages = adjustments.layoutColumns * rows;
                    // Initialize grid positions (all enabled by default)
                    const enabledPositions = new Array(totalPages).fill(true);
                    
                    // Batch all changes together
                    const newAdjustments = {
                      ...adjustments,
                      layoutRows: rows,
                      pagesPerPage: totalPages,
                      enabledGridPositions: enabledPositions
                    };
                    setAdjustments(newAdjustments);
                    onUpdateAdjustments(fileId, newAdjustments);
                    schedulePreviewGeneration(newAdjustments);
                  }}
                  className="layout-select"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </div>
              
              {adjustments.pagesPerPage > 1 && (
                <div className="layout-control-row">
                  <label htmlFor={`page-mode-${fileId}`}>Füllmodus:</label>
                  <select
                    id={`page-mode-${fileId}`}
                    value={adjustments.pageMode}
                    onChange={(e) => handleAdjustmentChange('pageMode', e.target.value)}
                    className="layout-select"
                  >
                    <option value="sequential">Aufeinanderfolgende Seiten</option>
                    <option value="replicate">Gleiche Seite wiederholen</option>
                  </select>
                </div>
              )}
            </div>

            {adjustments.pagesPerPage > 1 && (
              <div className="layout-visualization">
                <div className="din-sheet-preview">
                  <div className="layout-grid" style={{
                    gridTemplateColumns: `repeat(${adjustments.layoutColumns}, 1fr)`,
                    gridTemplateRows: `repeat(${adjustments.layoutRows}, 1fr)`
                  }}>
                    {Array.from({ length: adjustments.pagesPerPage }, (_, index) => {
                      const isEnabled = adjustments.enabledGridPositions?.[index] ?? true;
                      return (
                        <div key={index} className={`layout-cell ${isEnabled ? 'enabled' : 'disabled'}`}>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => {
                              const newEnabledPositions = [...(adjustments.enabledGridPositions || new Array(adjustments.pagesPerPage).fill(true))];
                              newEnabledPositions[index] = e.target.checked;
                              handleAdjustmentChange('enabledGridPositions', newEnabledPositions);
                            }}
                            className="grid-checkbox"
                          />
                          <span className="page-number">
                            {adjustments.pageMode === 'sequential' ? index + 1 : 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="layout-info">
                  <span className="layout-description">
                    {adjustments.pagesPerPage} Seiten ({adjustments.layoutColumns}×{adjustments.layoutRows}) - {adjustments.pageMode === 'sequential' ? 'Aufeinanderfolgende Seiten' : 'Gleiche Seite wiederholt'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      <div className="adjustment-quick-actions">
        <button
          className="btn-quick-action"
          onClick={() => handleAdjustmentChange('scale', adjustments.scale === 100 ? 50 : 100)}
        >
          {adjustments.scale === 100 ? 'Halbe Größe' : 'Volle Größe'}
        </button>
        <button
          className="btn-quick-action"
          onClick={() => handleAdjustmentChange('copies', adjustments.copies === 1 ? 2 : 1)}
        >
          {adjustments.copies === 1 ? 'Doppelt drucken' : 'Einfach drucken'}
        </button>
      </div>

      <div className="preview-section">
        <div className="preview-header">
          <h5>Live-Vorschau</h5>
          {isGeneratingPreview && (
            <div className="preview-loading">
              <div className="spinner-small"></div>
              <span>Generiere Vorschau...</span>
            </div>
          )}
        </div>
        <div className="preview-container">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className="preview-iframe"
              title={`Vorschau von ${fileData.name}`}
            />
          ) : !isGeneratingPreview ? (
            <div className="preview-placeholder">
              <span>Keine Vorschau verfügbar</span>
            </div>
          ) : null}
        </div>
        <div className="preview-info">
          <span>Diese Vorschau zeigt, wie die Datei mit den aktuellen Einstellungen gedruckt wird.</span>
        </div>
      </div>
    </div>
  );
};

export default FileAdjustmentPanel;
