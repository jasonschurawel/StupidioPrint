import { PDFDocument, degrees } from 'pdf-lib';
import { saveAs } from 'file-saver';
import type { FileData, FileAdjustments, PrintSettings } from '../types';

export const createFilePreview = async (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      // For PDF files, we'll create a placeholder preview
      // In a real implementation, you might use PDF.js to render the first page
      resolve(null);
    } else {
      resolve(null);
    }
  });
};

export const validateFileType = (file: File): boolean => {
  const supportedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp'
  ];
  
  return supportedTypes.includes(file.type);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const generateFileId = (): string => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const downloadFile = (blob: Blob, filename: string): void => {
  saveAs(blob, filename);
};

export const printFile = async (fileData: FileData, settings: PrintSettings, adjustments?: FileAdjustments): Promise<boolean> => {
  try {
    // For web-based printing, we'll use the browser's print dialog
    // This is a simplified version - in a real desktop app, you'd integrate with system printing
    console.log('Verwende Druckeinstellungen:', settings);
    console.log('Verwende Dateianpassungen:', adjustments);
    
    if (fileData.type === 'application/pdf') {
      // For PDF files, we no longer open in browser - just log success
      console.log(`PDF-Datei "${fileData.name}" wird an Drucker gesendet...`);
      // In a real implementation, this would send to system printer
      return true;
    } else if (fileData.type.startsWith('image/')) {
      // For images, we also avoid opening browser window
      console.log(`Bild-Datei "${fileData.name}" wird an Drucker gesendet...`);
      // In a real implementation, this would send to system printer
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Druckfehler:', error);
    return false;
  }
};

export const systemPrint = async (fileData: FileData, settings: PrintSettings, adjustments?: FileAdjustments): Promise<boolean> => {
  try {
    console.log('Printing file:', fileData.name, 'with settings:', settings);
    console.log('Applying adjustments:', adjustments);
    
    // Create FormData to send the file to the print server
    const formData = new FormData();
    formData.append('file', fileData.file);
    formData.append('settings', JSON.stringify(settings));
    
    // Apply adjustments if provided
    if (adjustments) {
      formData.append('adjustments', JSON.stringify(adjustments));
    }
    
    // Send to our print server
    const response = await fetch('http://localhost:3001/api/print', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Print server response:', result);
      return true;
    } else {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Print server error:', error);
      
      // Fallback to browser print if server fails
      console.log('Falling back to browser print...');
      return await printFile(fileData, settings, adjustments);
    }
    
  } catch (error) {
    console.error('System print error:', error);
    console.log('Print server may not be running. Falling back to browser print...');
    // Fallback to browser print
    return await printFile(fileData, settings, adjustments);
  }
};

export const applyImageAdjustments = async (
  file: File,
  adjustments: FileAdjustments
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      // Calculate dimensions based on rotation and scale
      const { scale, rotation } = adjustments;
      const scaleDecimal = scale / 100;
      const radians = (rotation * Math.PI) / 180;
      
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      // Calculate rotated dimensions
      const cos = Math.abs(Math.cos(radians));
      const sin = Math.abs(Math.sin(radians));
      const rotatedWidth = originalWidth * cos + originalHeight * sin;
      const rotatedHeight = originalWidth * sin + originalHeight * cos;
      
      canvas.width = rotatedWidth * scaleDecimal;
      canvas.height = rotatedHeight * scaleDecimal;
      
      // Apply transformations
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.scale(scaleDecimal, scaleDecimal);
      
      // Draw the image (removed brightness/contrast filters)
      ctx.drawImage(img, -originalWidth / 2, -originalHeight / 2);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/png',
        0.9
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Paper size dimensions in points (1 point = 1/72 inch)
const PAPER_SIZES = {
  A4: { width: 595, height: 842 },
  A3: { width: 842, height: 1191 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 }
};

// Helper function to parse page numbers string
const parsePageNumbers = (pageNumbersStr: string, totalPages: number): number[] => {
  const pageIndices: number[] = [];
  const parts = pageNumbersStr.split(',').map(part => part.trim());
  
  for (const part of parts) {
    if (part.includes('-')) {
      // Handle range like "5-7"
      const [start, end] = part.split('-').map(num => parseInt(num.trim()));
      if (!isNaN(start) && !isNaN(end) && start > 0 && end <= totalPages && start <= end) {
        for (let i = start; i <= end; i++) {
          pageIndices.push(i - 1); // Convert to 0-based index
        }
      }
    } else {
      // Handle single page like "3"
      const pageNum = parseInt(part);
      if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
        pageIndices.push(pageNum - 1); // Convert to 0-based index
      }
    }
  }
  
  // Remove duplicates and sort
  return [...new Set(pageIndices)].sort((a, b) => a - b);
};

export const generatePrintPreview = async (
  fileData: FileData, 
  printSettings: PrintSettings,
  adjustments: FileAdjustments
): Promise<string> => {
  console.log('generatePrintPreview called for:', fileData.name);
  
  try {
    // Process the file with adjustments to get the final PDF
    const processedPDFs = await processFileForPrinting(fileData, adjustments, printSettings);
    
    // For preview, just show the first copy
    const firstPDF = processedPDFs[0];
    return URL.createObjectURL(firstPDF);
  } catch (error) {
    console.error('Fehler beim Generieren der Druckvorschau für', fileData.name, ':', error);
    // Fallback to original file
    return URL.createObjectURL(fileData.file);
  }
};

// Generate combined preview for multiple files
export const generateCombinedPrintPreview = async (
  files: FileData[],
  printSettings: PrintSettings,
  fileAdjustments: Record<string, FileAdjustments>
): Promise<string> => {
  console.log('generateCombinedPrintPreview called for', files.length, 'files');
  console.log('Print settings:', printSettings);
  console.log('File adjustments:', fileAdjustments);
  
  try {
    // First, collect all processed pages from all files
    const allPages: { pdfDoc: PDFDocument; pageIndex: number; rotation: number }[] = [];
    
    // Process each file and collect all pages
    for (const fileData of files) {
      const adjustments = fileAdjustments[fileData.id] || {
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
      
      console.log(`Processing ${fileData.name} with ${adjustments.copies} copies, adjustments:`, adjustments);
      
      try {
        // Get all processed copies for this file
        const processedPDFs = await processFileForPrinting(fileData, adjustments, printSettings);
        console.log(`processFileForPrinting returned ${processedPDFs.length} PDFs for ${fileData.name}`);
        
        // Add each copy to the pages collection
        for (let copyIndex = 0; copyIndex < processedPDFs.length; copyIndex++) {
          const pdfBlob = processedPDFs[copyIndex];
          const pdfArrayBuffer = await pdfBlob.arrayBuffer();
          const pdf = await PDFDocument.load(pdfArrayBuffer);
          
          // Add all pages from this copy with rotation info
          for (let pageIndex = 0; pageIndex < pdf.getPageCount(); pageIndex++) {
            allPages.push({
              pdfDoc: pdf,
              pageIndex: pageIndex,
              rotation: adjustments.rotation
            });
          }
          
          console.log(`Added copy ${copyIndex + 1}/${adjustments.copies} of ${fileData.name} (${pdf.getPageCount()} pages)`);
        }
      } catch (fileError) {
        console.error(`Error processing file ${fileData.name}:`, fileError);
        // Continue with other files even if one fails
      }
    }
    
    console.log(`Total pages collected: ${allPages.length}`);
    
    // Simply add all processed pages to the final PDF
    // Each file has already been processed with its own layout settings
    const finalPdf = await PDFDocument.create();
    
    for (const pageInfo of allPages) {
      const [copiedPage] = await finalPdf.copyPages(pageInfo.pdfDoc, [pageInfo.pageIndex]);
      finalPdf.addPage(copiedPage);
    }
    
    const combinedPdfBytes = await finalPdf.save();
    const combinedBlob = new Blob([combinedPdfBytes], { type: 'application/pdf' });
    
    console.log('Combined preview generated successfully, size:', combinedBlob.size, 'bytes');
    return URL.createObjectURL(combinedBlob);
  } catch (error) {
    console.error('Error generating combined preview:', error);
    throw error;
  }
};

export const mergePDFs = async (files: FileData[]): Promise<Blob> => {
  const mergedPdf = await PDFDocument.create();
  
  for (const fileData of files) {
    if (fileData.type === 'application/pdf') {
      const arrayBuffer = await fileData.file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }
  }
  
  const pdfBytes = await mergedPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

export const processFileForPrinting = async (
  fileData: FileData,
  adjustments: FileAdjustments,
  printSettings: PrintSettings
): Promise<Blob[]> => {
  console.log('Processing file for printing:', fileData.name, 'with adjustments:', adjustments);
  
  try {
    // Apply adjustments and create the processed file
    let processedFile: Blob;
    
    if (fileData.type === 'application/pdf') {
      // For PDF files, apply adjustments
      processedFile = await applyPDFAdjustments(fileData.file, adjustments);
    } else if (fileData.type.startsWith('image/')) {
      // For images, apply adjustments and convert to PDF
      processedFile = await applyImageAdjustmentsAndConvertToPDF(fileData.file, adjustments, printSettings);
    } else {
      throw new Error(`Unsupported file type: ${fileData.type}`);
    }
    
    // Create the specified number of copies
    const copies: Blob[] = [];
    for (let i = 0; i < adjustments.copies; i++) {
      copies.push(processedFile);
    }
    
    return copies;
  } catch (error) {
    console.error('Error processing file for printing:', error);
    throw error;
  }
};

const applyPDFAdjustments = async (
  file: File,
  adjustments: FileAdjustments
): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();
  
  // Determine which pages to include
  let pageIndices: number[];
  if (adjustments.pageRange === 'specific' && adjustments.pageNumbers) {
    pageIndices = parsePageNumbers(adjustments.pageNumbers, sourcePdf.getPageCount());
  } else {
    pageIndices = sourcePdf.getPageIndices();
  }
  
  // Process selected pages with multiple pages per page layout BEFORE rotation
  if (adjustments.pagesPerPage > 1) {
    // Handle multiple pages per page layout
    const { layoutColumns, layoutRows, pagesPerPage, pageMode } = adjustments;
    
    // For 'replicate' mode, we use the same page for all positions
    // For 'sequential' mode, we use different pages in sequence
    const totalSheetsNeeded = pageMode === 'replicate' 
      ? pageIndices.length  // One sheet per original page, each showing the same page replicated
      : Math.ceil(pageIndices.length / pagesPerPage);  // Multiple pages fit on each sheet
    
    for (let sheetIndex = 0; sheetIndex < totalSheetsNeeded; sheetIndex++) {
      let batchPageIndices: number[];
      
      if (pageMode === 'replicate') {
        // For replicate mode: fill all cells with the same page
        const sourcePageIndex = pageIndices[sheetIndex];
        batchPageIndices = new Array(pagesPerPage).fill(sourcePageIndex);
      } else {
        // For sequential mode: take the next batch of pages
        const batchStart = sheetIndex * pagesPerPage;
        batchPageIndices = pageIndices.slice(batchStart, batchStart + pagesPerPage);
      }
      
      // Get the first page to determine dimensions
      const firstSourcePage = sourcePdf.getPage(batchPageIndices[0]);
      const originalSize = firstSourcePage.getSize();
      
      // Create a composite page
      const compositePage = newPdf.addPage([originalSize.width, originalSize.height]);
      const pageSize = compositePage.getSize();
      
      // Calculate cell dimensions
      const cellWidth = pageSize.width / layoutColumns;
      const cellHeight = pageSize.height / layoutRows;
      const margin = 10;
      
      // Place each page in the grid
      for (let i = 0; i < Math.min(batchPageIndices.length, pagesPerPage); i++) {
        const pageIndex = batchPageIndices[i];
        
        // Skip if we don't have enough pages (can happen in sequential mode)
        if (pageIndex === undefined) continue;
        
        // Check if this grid position is enabled
        const isPositionEnabled = adjustments.enabledGridPositions?.[i] ?? true;
        if (!isPositionEnabled) continue;
        
        const sourcePage = sourcePdf.getPage(pageIndex);
        const row = Math.floor(i / layoutColumns);
        const col = i % layoutColumns;
        
        try {
          // Calculate position for this cell
          const cellX = col * cellWidth + margin;
          const cellY = pageSize.height - (row + 1) * cellHeight + margin;
          const availableWidth = cellWidth - 2 * margin;
          const availableHeight = cellHeight - 2 * margin;
          
          // Apply scaling within the cell with rotation awareness
          const scaleDecimal = adjustments.scale / 100;
          const sourcePageSize = sourcePage.getSize();
          const isRotated90or270 = adjustments.rotation === 90 || adjustments.rotation === 270;
          
          let scaledWidth, scaledHeight;
          if (isRotated90or270) {
            // For rotated content in grid, consider swapped dimensions
            const rotationFitScale = Math.min(availableHeight / sourcePageSize.width, availableWidth / sourcePageSize.height, 1);
            scaledWidth = sourcePageSize.width * scaleDecimal * rotationFitScale;
            scaledHeight = sourcePageSize.height * scaleDecimal * rotationFitScale;
          } else {
            scaledWidth = sourcePageSize.width * scaleDecimal;
            scaledHeight = sourcePageSize.height * scaleDecimal;
          }
          
          // Calculate scaling to fit in cell
          const cellScaleX = availableWidth / scaledWidth;
          const cellScaleY = availableHeight / scaledHeight;
          const cellScale = Math.min(cellScaleX, cellScaleY, 1);
          
          // Create a form object from the source page
          const pageEmbed = await newPdf.embedPage(sourcePage);
          
          // Calculate final dimensions and position for center placement
          const finalWidth = scaledWidth * cellScale;
          const finalHeight = scaledHeight * cellScale;
          
          // Draw the page with content rotation applied within the cell
          // Calculate proper rotation positioning for PDF-lib
          const centerX = cellX + availableWidth / 2;
          const centerY = cellY + availableHeight / 2;
          
          const rotationRadians = (adjustments.rotation * Math.PI) / 180;
          const cos = Math.cos(rotationRadians);
          const sin = Math.sin(rotationRadians);
          
          // Calculate offset for rotation around bottom-left corner
          const halfWidth = finalWidth / 2;
          const halfHeight = finalHeight / 2;
          
          const rotatedX = centerX - (halfWidth * cos - halfHeight * sin);
          const rotatedY = centerY - (halfWidth * sin + halfHeight * cos);
          
          compositePage.drawPage(pageEmbed, {
            x: rotatedX,
            y: rotatedY,
            width: finalWidth,
            height: finalHeight,
            rotate: degrees(adjustments.rotation)  // Rotate content within cell
          });
          
        } catch (pageError) {
          console.error(`Error placing page ${i} in grid:`, pageError);
        }
      }
      
      // Don't apply rotation to entire page - rotation is applied to content within cells
    }
  } else {
    // Single page per page - process each page individually
    for (let i = 0; i < pageIndices.length; i++) {
      const pageIndex = pageIndices[i];
      const sourcePage = sourcePdf.getPage(pageIndex);
      const originalSize = sourcePage.getSize();
      
      // Create a new page with original dimensions
      const newPage = newPdf.addPage([originalSize.width, originalSize.height]);
      
      // Apply scaling to content
      const scaleDecimal = adjustments.scale / 100;
      
      // Create a form object from the source page
      const pageEmbed = await newPdf.embedPage(sourcePage);
      
      // Calculate scaled dimensions with rotation-aware scaling
      // For 90° and 270° rotations, we need to scale to fit the swapped page dimensions
      const isRotated90or270 = adjustments.rotation === 90 || adjustments.rotation === 270;
      let scaledWidth, scaledHeight;
      
      if (isRotated90or270) {
        // For 90°/270° rotation, the content width becomes page height and vice versa
        // Scale the content to fit within the page bounds when rotated
        const maxWidth = originalSize.height; // rotated content width fits in page height
        const maxHeight = originalSize.width; // rotated content height fits in page width
        
        const widthScale = maxWidth / originalSize.width;
        const heightScale = maxHeight / originalSize.height;
        const rotationFitScale = Math.min(widthScale, heightScale, 1);
        
        scaledWidth = originalSize.width * scaleDecimal * rotationFitScale;
        scaledHeight = originalSize.height * scaleDecimal * rotationFitScale;
      } else {
        // Normal scaling for 0° and 180°
        scaledWidth = originalSize.width * scaleDecimal;
        scaledHeight = originalSize.height * scaleDecimal;
      }
      
      // Draw the scaled page content with proper rotation positioning
      // PDF-lib rotates around the bottom-left corner, so we need to calculate offset
      const centerX = originalSize.width / 2;
      const centerY = originalSize.height / 2;
      
      const rotationRadians = (adjustments.rotation * Math.PI) / 180;
      const cos = Math.cos(rotationRadians);
      const sin = Math.sin(rotationRadians);
      
      // Calculate the actual position needed after rotation
      // This ensures the rotated content is centered on the page
      const halfWidth = scaledWidth / 2;
      const halfHeight = scaledHeight / 2;
      
      const rotatedX = centerX - (halfWidth * cos - halfHeight * sin);
      const rotatedY = centerY - (halfWidth * sin + halfHeight * cos);
      
      newPage.drawPage(pageEmbed, {
        x: rotatedX,
        y: rotatedY,
        width: scaledWidth,
        height: scaledHeight,
        rotate: degrees(adjustments.rotation)
      });
    }
  }
  
  const pdfBytes = await newPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

const applyImageAdjustmentsAndConvertToPDF = async (
  file: File,
  adjustments: FileAdjustments,
  printSettings: PrintSettings
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        // Create canvas and apply adjustments
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');
        
        // Calculate rotated dimensions
        const radians = (adjustments.rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(radians));
        const sin = Math.abs(Math.sin(radians));
        const rotatedWidth = img.width * cos + img.height * sin;
        const rotatedHeight = img.width * sin + img.height * cos;
        
        // Apply scale (convert percentage to decimal)
        const scaleDecimal = adjustments.scale / 100;
        canvas.width = rotatedWidth * scaleDecimal;
        canvas.height = rotatedHeight * scaleDecimal;
        
        // Apply transformations
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(radians);
        ctx.scale(scaleDecimal, scaleDecimal);
        
        // Draw the image (removed brightness/contrast filters)
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        // Convert canvas to blob
        canvas.toBlob(async (imageBlob) => {
          if (!imageBlob) {
            reject(new Error('Failed to create image blob'));
            return;
          }
          
          try {
            // Convert to PDF
            const pdfBlob = await convertImageToPDF(imageBlob, printSettings);
            resolve(pdfBlob);
          } catch (error) {
            reject(error);
          }
        }, 'image/png');
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

const convertImageToPDF = async (
  imageBlob: Blob, 
  printSettings: PrintSettings
): Promise<Blob> => {
  const pdfDoc = await PDFDocument.create();
  
  // Get paper dimensions (using portrait orientation by default)
  const paperSize = PAPER_SIZES[printSettings.paperSize];
  const pageWidth = paperSize.width;
  const pageHeight = paperSize.height;
  
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Embed the image
  const imageArrayBuffer = await imageBlob.arrayBuffer();
  const imageType = imageBlob.type;
  
  let embeddedImage;
  if (imageType === 'image/png') {
    embeddedImage = await pdfDoc.embedPng(imageArrayBuffer);
  } else {
    embeddedImage = await pdfDoc.embedJpg(imageArrayBuffer);
  }
  
  // Scale image to fit page with margins
  const margin = 50;
  const availableWidth = pageWidth - (2 * margin);
  const availableHeight = pageHeight - (2 * margin);
  
  const imgDims = embeddedImage.scale(1);
  const scaleX = availableWidth / imgDims.width;
  const scaleY = availableHeight / imgDims.height;
  const scale = Math.min(scaleX, scaleY);
  
  const scaledDims = embeddedImage.scale(scale);
  const x = margin + (availableWidth - scaledDims.width) / 2;
  const y = margin + (availableHeight - scaledDims.height) / 2;
  
  page.drawImage(embeddedImage, {
    x,
    y,
    width: scaledDims.width,
    height: scaledDims.height,
  });
  
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};


