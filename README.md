# PDFMate (Node.js + Express + EJS)

A local-only PDF toolkit with JWT auth, built on Express and EJS. Supports:

- Merge PDFs
- Split PDF by page ranges
- Images to PDF

## Tech
- Express, EJS, express-ejs-layouts, Bootstrap
- Multer (in-memory), cookie-based JWT, bcryptjs
- pdf-lib (merge/split), pdfkit (images -> pdf)

## Setup

1. Install dependencies:
```
npm install
```

2. Run in dev mode:
```
npm run dev
```

3. Open: `http://localhost:3000`

Optional: set environment variables
- `PORT=3000`
- `JWT_SECRET=your_secret`

## Usage

- Sign up or log in.
- Use the dashboard to access Merge, Split, and Images→PDF tools.
- Files are processed in memory. Downloads provided immediately. No storage.

## Project Structure
```
public/            # static assets
server.js          # app entry
src/
  controllers/
  middleware/
  routes/
  views/
```

## Notes
- This project is meant for local use only. No external storage or DB.
- The user store is in-memory and resets on server restart.