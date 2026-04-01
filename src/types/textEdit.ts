/** A text item extracted from a PDF page via pdfjs getTextContent() */
export interface PdfTextItem {
  /** Unique key: `${pageIndex}_${itemIndex}` */
  id: string;
  /** The original text string */
  str: string;
  /** Position in canvas coordinates (scaled) */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Derived font size in canvas pixels */
  fontSize: number;
  /** CSS font family from pdfjs styles */
  fontFamily: string;
  /** Page index this item belongs to */
  pageIndex: number;
  /** Position in PDF points (unscaled, y-up origin) */
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  pdfFontSize: number;
}

/** A text edit: maps an item ID to its replacement text */
export interface TextEdit {
  itemId: string;
  original: string;
  replacement: string;
}
