import { useState, useCallback } from 'react';
import FileDropzone from './components/FileDropzone';
import FileList from './components/FileList';
import PrintControls from './components/PrintControls';
import type { FileData, FileAdjustments } from './types';
import './App.css';

function App() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [fileAdjustments, setFileAdjustments] = useState<Record<string, FileAdjustments>>({});

  const handleFilesAdded = useCallback((newFiles: FileData[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    // Auto-select newly added files
    const newFileIds = newFiles.map(file => file.id);
    setSelectedFiles(prev => [...prev, ...newFileIds]);
  }, []);

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    setSelectedFiles(prev => prev.filter(id => id !== fileId));
    setFileAdjustments(prev => {
      const newAdjustments = { ...prev };
      delete newAdjustments[fileId];
      return newAdjustments;
    });
    
    // Clean up object URL to prevent memory leaks
    const file = files.find(f => f.id === fileId);
    if (file?.url) {
      URL.revokeObjectURL(file.url);
    }
  }, [files]);

  const handleSelectFile = useCallback((fileId: string, selected: boolean) => {
    setSelectedFiles(prev => 
      selected 
        ? [...prev, fileId]
        : prev.filter(id => id !== fileId)
    );
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    setSelectedFiles(selected ? files.map(file => file.id) : []);
  }, [files]);

  const handleUpdateAdjustments = useCallback((fileId: string, adjustments: FileAdjustments) => {
    setFileAdjustments(prev => ({
      ...prev,
      [fileId]: adjustments
    }));
  }, []);

  const handlePrintComplete = useCallback((success: boolean) => {
    if (success) {
      // Show success notification
      console.log('Druck erfolgreich abgeschlossen!');
      console.log('Dateianpassungen:', fileAdjustments);
      // Optionally clear selected files or show a success message
    } else {
      // Show error notification
      console.error('Druck fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
  }, [fileAdjustments]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <h1>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="app-icon">
              <polyline points="6,9 6,2 18,2 18,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="6" y="14" width="12" height="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            StupidoPrint
          </h1>
          <p>Für alle, die noch nie einen Drucker zum Laufen gebracht haben... und es auch diesmal nicht schaffen werden</p>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <FileDropzone onFilesAdded={handleFilesAdded} />
          
          {files.length > 0 && (
            <>
              <FileList
                files={files}
                onRemoveFile={handleRemoveFile}
                onUpdateAdjustments={handleUpdateAdjustments}
                selectedFiles={selectedFiles}
                onSelectFile={handleSelectFile}
                onSelectAll={handleSelectAll}
              />
              
              <PrintControls
                files={files}
                selectedFiles={selectedFiles}
                fileAdjustments={fileAdjustments}
                onPrintComplete={handlePrintComplete}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
