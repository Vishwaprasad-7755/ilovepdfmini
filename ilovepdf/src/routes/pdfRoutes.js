const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { showMerge, mergePdfs, showSplit, splitPdf, showImagesToPdf, imagesToPdf, showWordToPdf, wordToPdf } = require('../controllers/pdfController');

const router = express.Router();

router.get('/merge', requireAuth, showMerge);
router.post('/merge', requireAuth, (req, res, next) => {
  req.app.locals.upload.array('pdfs', 20)(req, res, (err) => {
    if (err) return next(err);
    return mergePdfs(req, res, next);
  });
});

router.get('/split', requireAuth, showSplit);
router.post('/split', requireAuth, (req, res, next) => {
  req.app.locals.upload.single('pdf')(req, res, (err) => {
    if (err) return next(err);
    return splitPdf(req, res, next);
  });
});

router.get('/images-to-pdf', requireAuth, showImagesToPdf);
router.post('/images-to-pdf', requireAuth, (req, res, next) => {
  req.app.locals.upload.array('images', 50)(req, res, (err) => {
    if (err) return next(err);
    return imagesToPdf(req, res, next);
  });
});

router.get('/word-to-pdf', requireAuth, showWordToPdf);
router.post('/word-to-pdf', requireAuth, (req, res, next) => {
  req.app.locals.upload.single('doc')(req, res, (err) => {
    if (err) return next(err);
    return wordToPdf(req, res, next);
  });
});

module.exports = router;

