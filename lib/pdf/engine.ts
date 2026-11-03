/**
 * Apex Developments Construction Project Management ERP
 * Enterprise PDF Report Generation Engine
 *
 * Built on `pdf-lib` for 100% reliability on Vercel Serverless Functions,
 * Next.js App Router, and Node.js environments without file-system font dependencies.
 */

import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";

export interface PDFSummaryStat {
  label: string;
  value: string;
}

export interface PDFTableConfig {
  title?: string;
  subtitle?: string;
  headers: string[];
  colWidths?: number[];
  rows: string[][];
}

export interface ReportGenerationOptions {
  title: string;
  subtitle?: string;
  reportType: string;
  issuerName: string;
  issuerRole?: string;
  projectName?: string;
  summaryStats?: PDFSummaryStat[];
  tables?: PDFTableConfig[];
  singleTable?: {
    headers: string[];
    rows: string[][];
  };
}

export async function generateEnterprisePdf(options: ReportGenerationOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // Standard Type 1 Helvetica fonts embedded automatically in memory
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  // A4 Page Dimensions (Points): 595.28 x 841.89
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 36;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // 523.28 pt

  let currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let currentY = PAGE_HEIGHT - MARGIN;

  const checkPageBreak = (neededHeight: number): PDFPage => {
    if (currentY - neededHeight < MARGIN + 30) {
      currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      currentY = PAGE_HEIGHT - MARGIN;
      // Re-draw subtle mini-header on subsequent pages
      drawPageHeader(currentPage, false);
      return currentPage;
    }
    return currentPage;
  };

  const drawPageHeader = (page: PDFPage, isFirstPage: boolean) => {
    if (isFirstPage) {
      // Primary Black Executive Banner
      page.drawRectangle({
        x: MARGIN,
        y: currentY - 56,
        width: CONTENT_WIDTH,
        height: 56,
        color: rgb(0, 0, 0),
      });

      page.drawText("APEX DEVELOPMENTS", {
        x: MARGIN + 14,
        y: currentY - 24,
        size: 15,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      page.drawText("Enterprise Construction Project Management ERP — Official Intelligence Report", {
        x: MARGIN + 14,
        y: currentY - 42,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.85, 0.85, 0.85),
      });

      page.drawText("CONFIDENTIAL AUDIT", {
        x: MARGIN + CONTENT_WIDTH - 120,
        y: currentY - 24,
        size: 7.5,
        font: fontBold,
        color: rgb(0.8, 0.8, 0.8),
      });

      currentY -= 68;

      // Metadata Box
      const metaHeight = 36;
      page.drawRectangle({
        x: MARGIN,
        y: currentY - metaHeight,
        width: CONTENT_WIDTH,
        height: metaHeight,
        color: rgb(0.98, 0.98, 0.98),
        borderColor: rgb(0.83, 0.83, 0.83),
        borderWidth: 0.75,
      });

      const today = new Date().toUTCString();
      const colW = CONTENT_WIDTH / 3;

      // Metadata Col 1
      page.drawText("REPORT:", { x: MARGIN + 8, y: currentY - 14, size: 6.5, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
      page.drawText(options.title.substring(0, 32), { x: MARGIN + 8, y: currentY - 26, size: 8, font: fontBold, color: rgb(0, 0, 0) });

      // Metadata Col 2
      page.drawText("ISSUED BY / SCOPE:", { x: MARGIN + colW + 8, y: currentY - 14, size: 6.5, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
      page.drawText(`${options.issuerName} (${options.issuerRole || "Admin"})`, { x: MARGIN + colW + 8, y: currentY - 26, size: 7.5, font: fontRegular, color: rgb(0, 0, 0) });

      // Metadata Col 3
      page.drawText("DATE & CURRENCY:", { x: MARGIN + colW * 2 + 8, y: currentY - 14, size: 6.5, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
      page.drawText(`${today.substring(0, 16)} • ETB`, { x: MARGIN + colW * 2 + 8, y: currentY - 26, size: 7.5, font: fontRegular, color: rgb(0, 0, 0) });

      currentY -= metaHeight + 14;
    } else {
      // Subsequent Pages Mini-Header
      page.drawRectangle({
        x: MARGIN,
        y: currentY - 20,
        width: CONTENT_WIDTH,
        height: 20,
        color: rgb(0.08, 0.08, 0.08),
      });

      page.drawText("APEX DEVELOPMENTS ERP", {
        x: MARGIN + 8,
        y: currentY - 13,
        size: 7.5,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      page.drawText(options.title.toUpperCase(), {
        x: MARGIN + CONTENT_WIDTH - 240,
        y: currentY - 13,
        size: 7,
        font: fontRegular,
        color: rgb(0.8, 0.8, 0.8),
      });

      currentY -= 28;
    }
  };

  // 1. Draw First Page Header
  drawPageHeader(currentPage, true);

  // 2. Summary KPI Cards (if present)
  if (options.summaryStats && options.summaryStats.length > 0) {
    checkPageBreak(46);
    const count = options.summaryStats.length;
    const cardWidth = (CONTENT_WIDTH - (count - 1) * 6) / count;
    const cardHeight = 36;

    options.summaryStats.forEach((stat, idx) => {
      const cardX = MARGIN + idx * (cardWidth + 6);
      currentPage.drawRectangle({
        x: cardX,
        y: currentY - cardHeight,
        width: cardWidth,
        height: cardHeight,
        color: rgb(0.98, 0.98, 0.98),
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 0.75,
      });

      currentPage.drawText(stat.label.toUpperCase().substring(0, 24), {
        x: cardX + 6,
        y: currentY - 12,
        size: 6,
        font: fontBold,
        color: rgb(0.4, 0.4, 0.4),
      });

      currentPage.drawText(stat.value.substring(0, 20), {
        x: cardX + 6,
        y: currentY - 26,
        size: 8.5,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
    });

    currentY -= cardHeight + 14;
  }

  // Helper: Wrap text cleanly into lines respecting column width
  const wrapTextToLines = (
    text: string,
    maxWidth: number,
    font: PDFFont,
    fontSize: number
  ): string[] => {
    if (!text) return ["-"];
    const sanitized = String(text).trim();
    if (!sanitized) return ["-"];

    const paragraphs = sanitized.split(/\r?\n/);
    const resultLines: string[] = [];

    for (const para of paragraphs) {
      const words = para.split(/\s+/).filter(Boolean);
      if (words.length === 0) continue;

      let currentLine = "";

      for (const word of words) {
        const wordWidth = font.widthOfTextAtSize(word, fontSize);
        if (wordWidth > maxWidth) {
          if (currentLine) {
            resultLines.push(currentLine);
            currentLine = "";
          }
          let chunk = "";
          for (const char of word) {
            const testChunk = chunk + char;
            if (font.widthOfTextAtSize(testChunk, fontSize) > maxWidth && chunk.length > 0) {
              resultLines.push(chunk);
              chunk = char;
            } else {
              chunk = testChunk;
            }
          }
          if (chunk) {
            currentLine = chunk;
          }
          continue;
        }

        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            resultLines.push(currentLine);
          }
          currentLine = word;
        }
      }

      if (currentLine) {
        resultLines.push(currentLine);
      }
    }

    return resultLines.length > 0 ? resultLines : ["-"];
  };

  // Helper: Draw a Table with Automatic Page Breaks, Dynamic Line-Height, Text Wrapping and Repeated Headers
  const renderTable = (
    tableTitle: string | undefined,
    tableSubtitle: string | undefined,
    headers: string[],
    rows: string[][],
    colWidths?: number[]
  ) => {
    // Proportional column widths calculation if not explicitly provided
    const widths: number[] = colWidths && colWidths.length === headers.length
      ? colWidths
      : headers.map(() => CONTENT_WIDTH / headers.length);

    // Normalize sum to CONTENT_WIDTH
    const totalW = widths.reduce((s, w) => s + w, 0);
    const normWidths = widths.map((w) => (w / totalW) * CONTENT_WIDTH);

    // Section Header / Title
    if (tableTitle) {
      checkPageBreak(32);
      currentPage.drawRectangle({
        x: MARGIN,
        y: currentY - 20,
        width: CONTENT_WIDTH,
        height: 20,
        color: rgb(0.08, 0.08, 0.08),
      });

      currentPage.drawText(tableTitle.toUpperCase(), {
        x: MARGIN + 8,
        y: currentY - 13,
        size: 8,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      if (tableSubtitle) {
        currentPage.drawText(tableSubtitle, {
          x: MARGIN + CONTENT_WIDTH - 200,
          y: currentY - 13,
          size: 7,
          font: fontRegular,
          color: rgb(0.75, 0.75, 0.75),
        });
      }

      currentY -= 24;
    }

    const CELL_PAD_X = 5;
    const CELL_PAD_Y = 4;
    const CELL_FONT_SIZE = 7;
    const CELL_LINE_HEIGHT = 9;

    const HEADER_FONT_SIZE = 6.5;
    const HEADER_LINE_HEIGHT = 8.5;

    const drawTableHeaderRow = () => {
      // Calculate wrapped header lines for every column
      const headerCellLines = headers.map((h, i) =>
        wrapTextToLines(
          h.toUpperCase(),
          Math.max(12, normWidths[i] - CELL_PAD_X * 2),
          fontBold,
          HEADER_FONT_SIZE
        )
      );
      const maxHeaderLines = Math.max(...headerCellLines.map((lines) => lines.length), 1);
      const headerRowHeight = Math.max(18, maxHeaderLines * HEADER_LINE_HEIGHT + CELL_PAD_Y * 2);

      checkPageBreak(headerRowHeight + 10);

      currentPage.drawRectangle({
        x: MARGIN,
        y: currentY - headerRowHeight,
        width: CONTENT_WIDTH,
        height: headerRowHeight,
        color: rgb(0.12, 0.12, 0.12),
      });

      let currentX = MARGIN;
      headers.forEach((_, idx) => {
        const lines = headerCellLines[idx];
        lines.forEach((lineText, lineIdx) => {
          const lineY =
            currentY -
            CELL_PAD_Y -
            lineIdx * HEADER_LINE_HEIGHT -
            HEADER_FONT_SIZE * 0.82;
          currentPage.drawText(lineText, {
            x: currentX + CELL_PAD_X,
            y: lineY,
            size: HEADER_FONT_SIZE,
            font: fontBold,
            color: rgb(1, 1, 1),
          });
        });
        currentX += normWidths[idx];
      });

      currentY -= headerRowHeight;
    };

    checkPageBreak(26);
    drawTableHeaderRow();

    // Empty state handling
    if (!rows || rows.length === 0) {
      checkPageBreak(22);
      currentPage.drawRectangle({
        x: MARGIN,
        y: currentY - 18,
        width: CONTENT_WIDTH,
        height: 18,
        color: rgb(0.98, 0.98, 0.98),
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 0.5,
      });

      currentPage.drawText("No recorded entries found for this section in the database.", {
        x: MARGIN + 8,
        y: currentY - 12,
        size: 7,
        font: fontOblique,
        color: rgb(0.5, 0.5, 0.5),
      });

      currentY -= 26;
      return;
    }

    // Rows rendering with Dynamic Height & Wrapping
    rows.forEach((row, rowIdx) => {
      // Wrap text in all cells for this row
      const wrappedCells = row.map((cell, colIdx) =>
        wrapTextToLines(
          String(cell ?? "-"),
          Math.max(12, normWidths[colIdx] - CELL_PAD_X * 2),
          fontRegular,
          CELL_FONT_SIZE
        )
      );

      const maxLinesInRow = Math.max(...wrappedCells.map((lines) => lines.length), 1);
      const rowHeight = Math.max(18, maxLinesInRow * CELL_LINE_HEIGHT + CELL_PAD_Y * 2);

      // Check page break with the actual dynamic row height
      if (currentY - rowHeight < MARGIN + 30) {
        currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        currentY = PAGE_HEIGHT - MARGIN;
        drawPageHeader(currentPage, false);
        drawTableHeaderRow();
      }

      const isEven = rowIdx % 2 === 0;
      currentPage.drawRectangle({
        x: MARGIN,
        y: currentY - rowHeight,
        width: CONTENT_WIDTH,
        height: rowHeight,
        color: isEven ? rgb(1, 1, 1) : rgb(0.97, 0.97, 0.97),
        borderColor: rgb(0.88, 0.88, 0.88),
        borderWidth: 0.5,
      });

      let currentX = MARGIN;
      row.forEach((_, colIdx) => {
        const lines = wrappedCells[colIdx];
        lines.forEach((lineText, lineIdx) => {
          const lineY =
            currentY -
            CELL_PAD_Y -
            lineIdx * CELL_LINE_HEIGHT -
            CELL_FONT_SIZE * 0.82;
          currentPage.drawText(lineText, {
            x: currentX + CELL_PAD_X,
            y: lineY,
            size: CELL_FONT_SIZE,
            font: fontRegular,
            color: rgb(0.08, 0.08, 0.08),
          });
        });
        currentX += normWidths[colIdx];
      });

      // Dynamically decrement currentY by the row height
      currentY -= rowHeight;
    });

    currentY -= 10;
  };

  // Render Multiple Tables (Master Report) or Single Table (Specialized Reports)
  if (options.tables && options.tables.length > 0) {
    for (const tbl of options.tables) {
      renderTable(tbl.title, tbl.subtitle, tbl.headers, tbl.rows, tbl.colWidths);
    }
  } else if (options.singleTable) {
    renderTable(undefined, undefined, options.singleTable.headers, options.singleTable.rows);
  }

  // 3. Footers with Page Numbers ("Page X of Y") & Confidentiality on all pages
  const totalPages = doc.getPageCount();
  doc.getPages().forEach((page, pageIndex) => {
    const footerY = MARGIN - 14;

    page.drawLine({
      start: { x: MARGIN, y: footerY + 12 },
      end: { x: MARGIN + CONTENT_WIDTH, y: footerY + 12 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });

    page.drawText("Apex Developments ERP — Official Construction Project Management Record", {
      x: MARGIN,
      y: footerY,
      size: 6.5,
      font: fontRegular,
      color: rgb(0.45, 0.45, 0.45),
    });

    const pageStr = `Page ${pageIndex + 1} of ${totalPages}`;
    page.drawText(pageStr, {
      x: MARGIN + CONTENT_WIDTH - 60,
      y: footerY,
      size: 7,
      font: fontBold,
      color: rgb(0.3, 0.3, 0.3),
    });
  });

  return await doc.save();
}
