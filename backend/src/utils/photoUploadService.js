/**
 * Photo Upload Service - ASAA Platform
 * Gère l'upload et la gestion des photos
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuration du stockage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/photos');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour les fichiers image
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non autorisé. Utilisez JPEG, PNG, WebP ou GIF.'));
  }
};

// Configuration de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

/**
 * Middleware pour upload simple
 */
const uploadSingle = upload.single('photo');

/**
 * Middleware pour uploads multiples
 */
const uploadMultiple = upload.array('photos', 5); // Max 5 photos

/**
 * Converter image en base64
 */
async function imageToBase64(filePath) {
  try {
    const file = await fs.readFile(filePath);
    const base64 = file.toString('base64');
    const ext = path.extname(filePath).substr(1);
    return `data:image/${ext};base64,${base64}`;
  } catch (error) {
    console.error(`❌ Erreur conversion base64: ${error.message}`);
    return null;
  }
}

/**
 * Compresser l'image
 */
async function compressImage(filePath) {
  try {
    // Pour production, utiliser sharp ou imagemin
    // Pour maintenant, retourner le chemin original
    return filePath;
  } catch (error) {
    console.error(`❌ Erreur compression: ${error.message}`);
    return filePath;
  }
}

/**
 * Supprimer une image
 */
async function deleteImage(filePath) {
  try {
    await fs.unlink(filePath);
    console.log(`✅ Image supprimée: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur suppression image: ${error.message}`);
    return false;
  }
}

/**
 * Obtenir l'URL publique d'une image
 */
function getImageUrl(fileName) {
  return `/uploads/photos/${fileName}`;
}

/**
 * Valider le fichier uploadé
 */
function validateUploadedFile(file) {
  if (!file) {
    return { valid: false, error: 'Aucun fichier fourni' };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'Fichier trop volumineux (max 5MB)' };
  }

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimes.includes(file.mimetype)) {
    return { valid: false, error: 'Format de fichier non autorisé' };
  }

  return { valid: true };
}

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  imageToBase64,
  compressImage,
  deleteImage,
  getImageUrl,
  validateUploadedFile
};
