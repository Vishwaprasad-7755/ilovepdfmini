const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const multer = require('multer');

const authRoutes = require('./src/routes/authRoutes');
const pdfRoutes = require('./src/routes/pdfRoutes');
const { attachUserIfAny } = require('./src/middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Attach user from JWT (if present) and expose to views
app.use(attachUserIfAny, (req, res, next) => {
  res.locals.user = req.user;
  next();
});

// Multer - memory storage (used in routes as needed)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
app.locals.upload = upload;

// Routes
app.use('/', authRoutes);
app.use('/pdf', pdfRoutes);

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});

