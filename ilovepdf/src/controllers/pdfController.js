const { PDFDocument } = require('pdf-lib');
const PDFDocumentKit = require('pdfkit');
const { v4: uuidv4 } = require('uuid');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer');

function sendBufferAsDownload(res, buffer, filename, mime) {
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(buffer);
}

function showMerge(req, res) {
  res.render('pdf/merge', { title: 'Merge PDFs' });
}

async function mergePdfs(req, res) {
  const files = req.files || [];
  if (!files.length) {
    return res.status(400).render('pdf/merge', { title: 'Merge PDFs', error: 'Please upload at least one PDF.' });
  }
  const mergedPdf = await PDFDocument.create();
  for (const file of files) {
    try {
      const pdf = await PDFDocument.load(file.buffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((p) => mergedPdf.addPage(p));
    } catch (e) {
      return res.status(400).render('pdf/merge', { title: 'Merge PDFs', error: 'One of the files is not a valid PDF.' });
    }
  }
  const mergedBytes = await mergedPdf.save();
  return sendBufferAsDownload(res, Buffer.from(mergedBytes), `merged-${uuidv4().slice(0,8)}.pdf`, 'application/pdf');
}

function showSplit(req, res) {
  res.render('pdf/split', { title: 'Split PDF' });
}

async function splitPdf(req, res) {
  const file = req.file;
  const { ranges } = req.body; // e.g., "1-3,5,7-9"
  if (!file || !ranges) {
    return res.status(400).render('pdf/split', { title: 'Split PDF', error: 'Upload a PDF and specify page ranges.' });
  }
  let pdf;
  try {
    pdf = await PDFDocument.load(file.buffer);
  } catch (e) {
    return res.status(400).render('pdf/split', { title: 'Split PDF', error: 'Invalid PDF file.' });
  }

  const totalPages = pdf.getPageCount();
  const indexes = new Set();

  const parts = ranges.split(',').map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (Number.isNaN(start) || Number.isNaN(end) || start < 1 || end < start) {
        return res.status(400).render('pdf/split', { title: 'Split PDF', error: 'Invalid range format.' });
      }
      for (let i = start; i <= end; i += 1) {
        if (i <= totalPages) indexes.add(i - 1);
      }
    } else {
      const page = parseInt(part, 10);
      if (!Number.isNaN(page) && page >= 1 && page <= totalPages) {
        indexes.add(page - 1);
      }
    }
  }

  const output = await PDFDocument.create();
  const copiedPages = await output.copyPages(pdf, Array.from(indexes.values()));
  copiedPages.forEach((p) => output.addPage(p));
  const bytes = await output.save();
  return sendBufferAsDownload(res, Buffer.from(bytes), `split-${uuidv4().slice(0,8)}.pdf`, 'application/pdf');
}

function showImagesToPdf(req, res) {
  res.render('pdf/images-to-pdf', { title: 'Images to PDF' });
}

async function imagesToPdf(req, res) {
  const files = req.files || [];
  if (!files.length) {
    return res.status(400).render('pdf/images-to-pdf', { title: 'Images to PDF', error: 'Please upload images.' });
  }
  // Compose images into a single PDF using pdfkit
  const doc = new PDFDocumentKit({ autoFirstPage: false });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {
    const buffer = Buffer.concat(chunks);
    return sendBufferAsDownload(res, buffer, `images-${uuidv4().slice(0,8)}.pdf`, 'application/pdf');
  });

  for (const file of files) {
    try {
      const image = file.buffer;
      const img = doc.openImage ? doc.openImage(image) : null; // not available in pdfkit
      // pdfkit does not have openImage for buffers generically; use addPage + image(buffer)
      doc.addPage();
      doc.image(image, {
        fit: [500, 700],
        align: 'center',
        valign: 'center',
      });
    } catch (e) {
      // skip invalid image
    }
  }
  doc.end();
}

async function showWordToPdf(req, res) {
  res.render('pdf/word-to-pdf', { title: 'Word → PDF' });
}

async function wordToPdf(req, res) {
  const file = req.file;
  if (!file) {
    return res.status(400).render('pdf/word-to-pdf', { title: 'Word → PDF', error: 'Please upload a .docx file.' });
  }
  try {
    // Convert DOCX buffer to HTML
    const { value: html } = await mammoth.convertToHtml({ buffer: file.buffer });
    // Use headless chromium to render HTML to PDF for highest fidelity
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(`<html><head><meta charset='utf-8'><style>body{font-family:Arial,Helvetica,sans-serif;margin:40px;}</style></head><body>${html}</body></html>`, { waitUntil: 'load' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return sendBufferAsDownload(res, pdfBuffer, `word-${uuidv4().slice(0,8)}.pdf`, 'application/pdf');
  } catch (e) {
    return res.status(500).render('pdf/word-to-pdf', { title: 'Word → PDF', error: 'Failed to convert the document.' });
  }
}

module.exports = { showMerge, mergePdfs, showSplit, splitPdf, showImagesToPdf, imagesToPdf, showWordToPdf, wordToPdf };

