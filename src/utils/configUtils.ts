// Configuration utilities for loading printer settings
import type { PrintSettings } from '../types';

export interface PrinterConfig {
  DEFAULT_PRINTER: string;
  PRINT_QUALITY: string;
  PAPER_SIZE: string;
  COLOR_MODE: string;
}

// Default configuration fallback
const DEFAULT_CONFIG: PrinterConfig = {
  DEFAULT_PRINTER: 'default',
  PRINT_QUALITY: 'normal',
  PAPER_SIZE: 'A4',
  COLOR_MODE: 'color'
};

// Map config values to PrintSettings format
const mapConfigToPrintSettings = (config: PrinterConfig): Partial<PrintSettings> => {
  // Type-safe mapping with validation
  const validQuality = ['draft', 'normal', 'high'].includes(config.PRINT_QUALITY) 
    ? config.PRINT_QUALITY as 'draft' | 'normal' | 'high'
    : 'normal';
    
  const validPaperSize = ['A4', 'A3', 'Letter', 'Legal'].includes(config.PAPER_SIZE)
    ? config.PAPER_SIZE as 'A4' | 'A3' | 'Letter' | 'Legal'
    : 'A4';
    
  const validColorMode = ['color', 'grayscale', 'monochrome'].includes(config.COLOR_MODE)
    ? config.COLOR_MODE as 'color' | 'grayscale' | 'monochrome'
    : 'color';

  return {
    printer: config.DEFAULT_PRINTER || 'default',
    quality: validQuality,
    paperSize: validPaperSize,
    colorMode: validColorMode
  };
};

// Load printer configuration from the system
export const loadPrinterConfig = async (): Promise<PrinterConfig> => {
  try {
    // In a real browser environment, we can't directly read files
    // Instead, we'll use localStorage as a fallback or expect the config
    // to be provided by a local server or embedded in the app
    
    // Try to load from localStorage first (set by config script)
    const storedConfig = localStorage.getItem('stupidoprint_config');
    if (storedConfig) {
      try {
        const config = JSON.parse(storedConfig);
        return { ...DEFAULT_CONFIG, ...config };
      } catch {
        console.warn('Failed to parse stored config');
      }
    }
    
    // Fallback to checking if a config file exists in public folder
    try {
      const response = await fetch('/stupidoprint_config.json');
      if (response.ok) {
        const config = await response.json();
        return { ...DEFAULT_CONFIG, ...config };
      }
    } catch {
      // Config file doesn't exist, use defaults
    }

    return DEFAULT_CONFIG;
  } catch (error) {
    console.warn('Could not load printer configuration, using defaults:', error);
    return DEFAULT_CONFIG;
  }
};

// Get printer configuration as print settings
export const getPrintSettings = async (): Promise<Partial<PrintSettings>> => {
  const config = await loadPrinterConfig();
  return mapConfigToPrintSettings(config);
};

// Get configured printer name
export const getConfiguredPrinter = async (): Promise<string> => {
  try {
    const config = await loadPrinterConfig();
    return config.DEFAULT_PRINTER || 'default';
  } catch {
    return 'default';
  }
};
