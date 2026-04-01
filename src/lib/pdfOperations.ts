import {
  PDFDocument,
  degrees,
} from "pdf-lib";

export async function extractPages(
  srcBytes: Uint8Array,
  indices: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(srcBytes);
  const newDoc = await PDFDocument.create();
  const copied = await newDoc.copyPages(srcDoc, indices);
  copied.forEach((page) => newDoc.addPage(page));
  return newDoc.save();
}

export async function combineDocuments(
  bytesArr: Uint8Array[]
): Promise<Uint8Array> {
  const newDoc = await PDFDocument.create();
  for (const bytes of bytesArr) {
    const srcDoc = await PDFDocument.load(bytes);
    const indices = srcDoc.getPageIndices();
    const copied = await newDoc.copyPages(srcDoc, indices);
    copied.forEach((page) => newDoc.addPage(page));
  }
  return newDoc.save();
}

export async function rotatePages(
  srcBytes: Uint8Array,
  indices: number[],
  angle: number
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(srcBytes);
  const indexSet = new Set(indices);
  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    if (indexSet.has(i)) {
      const current = pages[i].getRotation().angle;
      pages[i].setRotation(degrees(current + angle));
    }
  }
  return doc.save();
}

export async function splitDocument(
  srcBytes: Uint8Array,
  every: number
): Promise<{ bytes: Uint8Array; label: string }[]> {
  const srcDoc = await PDFDocument.load(srcBytes);
  const total = srcDoc.getPageCount();
  const results: { bytes: Uint8Array; label: string }[] = [];

  for (let start = 0; start < total; start += every) {
    const end = Math.min(start + every, total);
    const indices = Array.from({ length: end - start }, (_, i) => start + i);
    const newDoc = await PDFDocument.create();
    const copied = await newDoc.copyPages(srcDoc, indices);
    copied.forEach((page) => newDoc.addPage(page));
    const label =
      every === 1 ? `${start + 1}` : `${start + 1}-${end}`;
    results.push({ bytes: await newDoc.save(), label });
  }
  return results;
}

export async function imposeNup(
  srcBytes: Uint8Array,
  cols: number,
  rows: number,
  landscape = false
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(srcBytes);
  const newDoc = await PDFDocument.create();
  const srcPages = srcDoc.getPages();
  const perSheet = cols * rows;

  const firstPage = srcPages[0];
  const origW = firstPage.getWidth();
  const origH = firstPage.getHeight();
  // Output sheet orientation
  const sheetW = landscape ? Math.max(origW, origH) : origW;
  const sheetH = landscape ? Math.min(origW, origH) : origH;
  const cellW = sheetW / cols;
  const cellH = sheetH / rows;

  for (let sheetStart = 0; sheetStart < srcPages.length; sheetStart += perSheet) {
    const sheet = newDoc.addPage([sheetW, sheetH]);
    const chunk = srcPages.slice(sheetStart, sheetStart + perSheet);

    for (let slot = 0; slot < chunk.length; slot++) {
      const [embedded] = await newDoc.embedPdf(srcDoc, [sheetStart + slot]);
      const col = slot % cols;
      const row = rows - 1 - Math.floor(slot / cols); // top-to-bottom
      const srcW = chunk[slot].getWidth();
      const srcH = chunk[slot].getHeight();
      const sx = cellW / srcW;
      const sy = cellH / srcH;
      const scale = Math.min(sx, sy);

      sheet.drawPage(embedded, {
        x: col * cellW,
        y: row * cellH,
        width: srcW * scale,
        height: srcH * scale,
      });
    }
  }

  return newDoc.save();
}

export async function imposeBooklet(
  srcBytes: Uint8Array
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(srcBytes);
  const newDoc = await PDFDocument.create();
  const srcPages = srcDoc.getPages();

  // Pad to multiple of 4
  const padded = [...Array(srcPages.length).keys()];
  while (padded.length % 4 !== 0) {
    padded.push(-1); // -1 = blank
  }

  const pageW = srcPages[0].getWidth();
  const pageH = srcPages[0].getHeight();

  // Build booklet pairs
  const pairs: [number, number][] = [];
  let left = 0;
  let right = padded.length - 1;
  while (left < right) {
    pairs.push([padded[right], padded[left]]); // front
    pairs.push([padded[left + 1], padded[right - 1]]); // back
    left += 2;
    right -= 2;
  }

  for (const [leftIdx, rightIdx] of pairs) {
    const sheet = newDoc.addPage([pageW * 2, pageH]);

    if (leftIdx >= 0 && leftIdx < srcPages.length) {
      const [emb] = await newDoc.embedPdf(srcDoc, [leftIdx]);
      sheet.drawPage(emb, { x: 0, y: 0, width: pageW, height: pageH });
    }
    if (rightIdx >= 0 && rightIdx < srcPages.length) {
      const [emb] = await newDoc.embedPdf(srcDoc, [rightIdx]);
      sheet.drawPage(emb, { x: pageW, y: 0, width: pageW, height: pageH });
    }
  }

  return newDoc.save();
}

export function getPdfInfo(doc: PDFDocument) {
  const pages = doc.getPages();
  const first = pages[0];
  return {
    pageCount: pages.length,
    title: doc.getTitle() ?? "",
    author: doc.getAuthor() ?? "",
    creator: doc.getCreator() ?? "",
    producer: doc.getProducer() ?? "",
    creationDate: doc.getCreationDate()?.toISOString() ?? "",
    modDate: doc.getModificationDate()?.toISOString() ?? "",
    width: first.getWidth(),
    height: first.getHeight(),
  };
}
