import React, { useState } from 'react';
import type { FileData, FileAdjustments } from '../types';
import { formatFileSize } from '../utils/fileUtils';
import FileAdjustmentPanel from './FileAdjustmentPanel';
import './FileList.css';

interface FileListProps {
  files: FileData[];
  onRemoveFile: (id: string) => void;
  onUpdateAdjustments: (id: string, adjustments: FileAdjustments) => void;
  selectedFiles: string[];
  onSelectFile: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  onRemoveFile,
  onUpdateAdjustments,
  selectedFiles,
  onSelectFile,
  onSelectAll
}) => {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  if (files.length === 0) {
    return (
      <div className="file-list-empty">
        <p>Noch keine Dateien hochgeladen. Ziehen Sie Dateien oben hinein, um zu beginnen.</p>
      </div>
    );
  }

  const allSelected = files.length > 0 && selectedFiles.length === files.length;
  const someSelected = selectedFiles.length > 0 && selectedFiles.length < files.length;

  return (
    <div className="file-list">
      <div className="file-list-header">
        <div className="select-all-container">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) input.indeterminate = someSelected;
              }}
              onChange={(e) => onSelectAll(e.target.checked)}
            />
            <span className="checkmark"></span>
            Alle auswählen ({files.length} Dateien)
          </label>
        </div>
        <div className="file-stats">
          Gesamtgröße: {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
        </div>
      </div>

      <div className="file-items">
        {files.map((file) => (
          <div key={file.id} className={`file-item ${selectedFiles.includes(file.id) ? 'selected' : ''}`}>
            <div className="file-item-header">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.id)}
                  onChange={(e) => onSelectFile(file.id, e.target.checked)}
                />
                <span className="checkmark"></span>
              </label>

              <div className="file-preview">
                {file.preview ? (
                  <img src={file.preview} alt={file.name} className="preview-image" />
                ) : (
                  <div className="preview-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points="14,2 14,8 20,8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="file-type">{file.type.split('/')[1].toUpperCase()}</span>
                  </div>
                )}
              </div>

              <div className="file-info">
                <h4 className="file-name" title={file.name}>{file.name}</h4>
                <div className="file-meta">
                  <span className="file-size">{formatFileSize(file.size)}</span>
                  <span className="file-type-badge">{file.type}</span>
                </div>
              </div>

              <div className="file-actions">
                <button
                  className="btn-secondary btn-small"
                  onClick={() => setExpandedFile(expandedFile === file.id ? null : file.id)}
                  title="Dateieinstellungen anpassen"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Anpassen
                </button>
                <button
                  className="btn-danger btn-small"
                  onClick={() => onRemoveFile(file.id)}
                  title="Datei entfernen"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <polyline
                      points="3,6 5,6 21,6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Entfernen
                </button>
              </div>
            </div>

            {expandedFile === file.id && (
              <div className="file-adjustment-panel">
                <FileAdjustmentPanel
                  fileId={file.id}
                  fileData={file}
                  onUpdateAdjustments={onUpdateAdjustments}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
