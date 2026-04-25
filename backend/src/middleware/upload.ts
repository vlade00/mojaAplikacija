// Multer middleware za upload fajlova

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Kreiraj uploads/avatars folder ako ne postoji
const uploadsDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Konfiguracija za skladištenje
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generiši jedinstveno ime: userId-timestamp.extension
    const userId = (req as any).user?.userId || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${userId}-${timestamp}${ext}`;
    cb(null, filename);
  },
});

// Filter za validaciju tipa fajla
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Dozvoli samo slike
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Samo slike su dozvoljene!'));
  }
};

// Konfiguriši multer
export const uploadAvatar = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: fileFilter,
});

// Helper funkcija za dobijanje URL-a avatara
export const getAvatarUrl = (filename: string | null): string | null => {
  if (!filename) return null;
  // Vrati relativni put koji će frontend koristiti
  return `/uploads/avatars/${filename}`;
};

