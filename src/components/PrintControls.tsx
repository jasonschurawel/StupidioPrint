import { useState, useEffect } from 'react';
import type { FileData, PrintSettings, FileAdjustments } from '../types';
import { systemPrint, printFile, generateCombinedPrintPreview } from '../utils/fileUtils';
import { getPrintSettings, getConfiguredPrinter } from '../utils/configUtils';
import PrintPreviewModal from './PrintPreviewModal';
import './PrintControls.css';

interface PrintControlsProps {
  files: FileData[];
  selectedFiles: string[];
  fileAdjustments: Record<string, FileAdjustments>;
  onPrintComplete: (success: boolean) => void;
}

const PrintControls: React.FC<PrintControlsProps> = ({
  files,
  selectedFiles,
  fileAdjustments,
  onPrintComplete
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<'view' | 'print'>('view');
  const [printStatus, setPrintStatus] = useState<string>('');
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    printer: 'default',
    paperSize: 'A4',
    quality: 'normal',
    colorMode: 'color',
    duplex: 'einseitig'
  });

  // Load printer configuration silently on component mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configSettings = await getPrintSettings();
        const printerName = await getConfiguredPrinter();
        
        setPrintSettings(prev => ({
          ...prev,
          ...configSettings,
          printer: printerName
        }));
      } catch (error) {
        console.warn('Failed to load printer configuration:', error);
      }
    };

    loadConfig();
  }, []);

  const selectedFileData = files.filter(file => selectedFiles.includes(file.id));
  const canPrint = selectedFileData.length > 0;

  const handlePrint = async (useSystemPrint: boolean = true) => {
    if (!canPrint || isPrinting) return;

    setIsPrinting(true);
    setPrintStatus('Bereite Druckauftrag vor...');

    try {
      // Generate the combined PDF that matches exactly what the preview shows
      setPrintStatus('Erstelle kombinierte PDF...');
      const combinedPreviewUrl = await generateCombinedPrintPreview(
        selectedFileData, 
        printSettings, 
        fileAdjustments
      );
      
      // Convert the preview URL back to a blob for printing
      const response = await fetch(combinedPreviewUrl);
      const combinedBlob = await response.blob();
      
      // Create a file object from the combined blob
      const combinedFile = new File([combinedBlob], 'combined_print.pdf', { type: 'application/pdf' });
      const combinedFileData: FileData = {
        id: 'combined_print',
        name: 'combined_print.pdf',
        type: 'application/pdf',
        size: combinedBlob.size,
        file: combinedFile,
        preview: null
      };
      
      // Print the combined file (no adjustments needed since they're already applied)
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
      
      setPrintStatus('Sende an Drucker...');
      const success = useSystemPrint 
        ? await systemPrint(combinedFileData, printSettings, defaultAdjustments)
        : await printFile(combinedFileData, printSettings, defaultAdjustments);
      
      // Clean up the blob URL
      URL.revokeObjectURL(combinedPreviewUrl);
      
      setPrintStatus(success ? 'Erfolgreich gedruckt!' : 'Druckfehler aufgetreten');
      onPrintComplete(success);
      
      // Clear status after 3 seconds
      setTimeout(() => setPrintStatus(''), 3000);
    } catch (error) {
      console.error('Druckfehler:', error);
      setPrintStatus('Druckfehler aufgetreten');
      onPrintComplete(false);
      setTimeout(() => setPrintStatus(''), 3000);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePreview = () => {
    if (!canPrint) return;
    console.log('handlePreview called - opening preview modal');
    setPreviewMode('view');
    setShowPreview(true);
    console.log('Preview modal state set to open');
  };

  const handleConfirmPrint = () => {
    setShowPreview(false);
    handlePrint(true);
  };

  const handleSettingChange = (key: keyof PrintSettings, value: string | boolean) => {
    setPrintSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="print-controls">
      <div className="print-header">
        <div className="print-info">
          <h3>Drucksteuerung</h3>
          <p>
            {selectedFileData.length} von {files.length} Dateien ausgewählt
          </p>
          {printStatus && (
            <div className={`print-status ${isPrinting ? 'printing' : 'completed'}`}>
              {printStatus}
            </div>
          )}
        </div>

        <div className="print-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowSettings(!showSettings)}
            disabled={isPrinting}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Einstellungen
          </button>

          <button
            className="btn-tertiary"
            onClick={handlePreview}
            disabled={!canPrint || isPrinting}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Vorschau
          </button>

          <button
            className="btn-primary"
            onClick={() => handlePrint(true)}
            disabled={!canPrint || isPrinting}
          >
            {isPrinting ? (
              <>
                <div className="spinner-small"></div>
                Drucke...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <polyline points="6,9 6,2 18,2 18,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="6" y="14" width="12" height="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Jetzt drucken
              </>
            )}
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="print-settings">
          <div className="settings-grid">
            <div className="setting-group">
              <label htmlFor="paper-size">Papierformat</label>
              <select
                id="paper-size"
                value={printSettings.paperSize}
                onChange={(e) => handleSettingChange('paperSize', e.target.value)}
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="Letter">Letter</option>
                <option value="Legal">Legal</option>
              </select>
            </div>

            <div className="setting-group">
              <label htmlFor="quality">Qualität</label>
              <select
                id="quality"
                value={printSettings.quality}
                onChange={(e) => handleSettingChange('quality', e.target.value)}
              >
                <option value="draft">Entwurf</option>
                <option value="normal">Normal</option>
                <option value="high">Hoch</option>
              </select>
            </div>

            <div className="setting-group">
              <label htmlFor="color-mode">Farbmodus</label>
              <select
                id="color-mode"
                value={printSettings.colorMode}
                onChange={(e) => handleSettingChange('colorMode', e.target.value)}
              >
                <option value="color">Farbe</option>
                <option value="grayscale">Graustufen</option>
                <option value="monochrome">Schwarz-weiß</option>
              </select>
            </div>

            <div className="setting-group">
              <label htmlFor="duplex-mode">Duplexdruck</label>
              <select
                id="duplex-mode"
                value={printSettings.duplex}
                onChange={(e) => handleSettingChange('duplex', e.target.value)}
              >
                <option value="einseitig">Einseitig</option>
                <option value="zweiseitig-horizontal">Zweiseitig (Horizontal spiegeln)</option>
                <option value="zweiseitig-vertikal">Zweiseitig (Vertikal spiegeln)</option>
              </select>
            </div>
          </div>

          <div className="settings-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                setPrintSettings(prev => ({
                  ...prev,
                  paperSize: 'A4',
                  quality: 'normal',
                  colorMode: 'color',
                  duplex: 'einseitig'
                }));
              }}
            >
              Zurücksetzen
            </button>
          </div>
        </div>
      )}

      {!canPrint && (
        <div className="print-warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Bitte wählen Sie mindestens eine Datei zum Drucken aus.
        </div>
      )}

      <PrintPreviewModal
        files={selectedFileData}
        printSettings={printSettings}
        fileAdjustments={fileAdjustments}
        isOpen={showPreview}
        mode={previewMode}
        onClose={() => setShowPreview(false)}
        onConfirmPrint={handleConfirmPrint}
        isPrinting={isPrinting}
      />
    </div>
  );
};

export default PrintControls;
