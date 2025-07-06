export interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
  preview: string | null;
  url?: string;
}

export interface FileAdjustments {
  scale: number;
  rotation: number;
  copies: number;
  orientation: 'portrait' | 'landscape';
  pageRange: 'all' | 'specific';
  pageNumbers?: string; // e.g., "1,3,5-10"
  pagesPerPage: number; // Number of pages to fit on one printed page (1, 2, 4, 6, 8, 9, 12, 16)
  layoutColumns: number; // Number of columns in the grid
  layoutRows: number; // Number of rows in the grid
  pageMode: 'replicate' | 'sequential'; // 'replicate' = same page repeated, 'sequential' = different pages from file
  enabledGridPositions?: boolean[]; // Track which grid positions are enabled for printing
}

export interface PrintSettings {
  printer: string;
  paperSize: 'A4' | 'A3' | 'Letter' | 'Legal';
  quality: 'draft' | 'normal' | 'high';
  colorMode: 'color' | 'grayscale' | 'monochrome';
  duplex: 'einseitig' | 'zweiseitig-horizontal' | 'zweiseitig-vertikal';
}

export interface PrinterConfig {
  DEFAULT_PRINTER: string;
  PRINT_QUALITY: string;
  PAPER_SIZE: string;
  COLOR_MODE: string;
}
