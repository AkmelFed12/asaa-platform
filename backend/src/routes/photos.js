const express = require('express');
const router = express.Router();
const { uploadSingle, uploadMultiple, getImageUrl, deleteImage } = require('../utils/photoUploadService');

// In-memory storage pour photos d'événements
let eventPhotos = {};

/**
 * Upload une photo pour un événement
 */
router.post('/upload', uploadSingle, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const photoUrl = getImageUrl(req.file.filename);
    const photoData = {
      id: Date.now(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: photoUrl,
      size: req.file.size,
      uploadedAt: new Date()
    };

    res.json({
      message: 'Photo uploadée avec succès',
      photo: photoData
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Upload plusieurs photos
 */
router.post('/upload-multiple', uploadMultiple, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const photos = req.files.map(file => ({
      id: Date.now() + Math.random(),
      filename: file.filename,
      originalName: file.originalname,
      url: getImageUrl(file.filename),
      size: file.size,
      uploadedAt: new Date()
    }));

    res.json({
      message: 'Photos uploadées avec succès',
      count: photos.length,
      photos: photos
    });
  } catch (error) {
    console.error('Erreur upload multiple:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Associer une photo à un événement
 */
router.post('/event/:eventId/photo', uploadSingle, (req, res) => {
  try {
    const { eventId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    if (!eventPhotos[eventId]) {
      eventPhotos[eventId] = [];
    }

    const photoData = {
      id: Date.now(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: getImageUrl(req.file.filename),
      size: req.file.size,
      uploadedAt: new Date()
    };

    eventPhotos[eventId].push(photoData);

    res.json({
      message: 'Photo associée à l\'événement',
      eventId: eventId,
      photo: photoData,
      totalPhotos: eventPhotos[eventId].length
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtenir les photos d'un événement
 */
router.get('/event/:eventId/photos', (req, res) => {
  try {
    const { eventId } = req.params;
    const photos = eventPhotos[eventId] || [];

    res.json({
      eventId: eventId,
      photos: photos,
      count: photos.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Supprimer une photo
 */
router.delete('/photo/:photoId', (req, res) => {
  try {
    const { photoId } = req.params;
    
    // Supprimer de tous les événements
    let deleted = false;
    for (const eventId in eventPhotos) {
      eventPhotos[eventId] = eventPhotos[eventId].filter(photo => {
        if (photo.id === parseInt(photoId)) {
          deleteImage(photo.filename);
          deleted = true;
          return false;
        }
        return true;
      });
    }

    if (deleted) {
      res.json({ message: 'Photo supprimée avec succès' });
    } else {
      res.status(404).json({ error: 'Photo non trouvée' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtenir les statistiques d'upload
 */
router.get('/stats', (req, res) => {
  try {
    let totalPhotos = 0;
    let totalSize = 0;

    for (const eventId in eventPhotos) {
      eventPhotos[eventId].forEach(photo => {
        totalPhotos++;
        totalSize += photo.size || 0;
      });
    }

    res.json({
      totalPhotos: totalPhotos,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      eventCount: Object.keys(eventPhotos).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
