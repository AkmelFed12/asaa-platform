import React, { useState, useRef } from 'react';
import '../styles/PhotoUpload.css';

/**
 * Photo Upload Component
 * Supports single and batch uploads with preview
 */
const PhotoUpload = ({ eventId = null, onUploadSuccess = null }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  // Handle file selection
  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const validFiles = [];
    const newPreviews = [];

    selectedFiles.forEach(file => {
      // Validate file
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`Format non valide: ${file.name}`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`Fichier trop volumineux: ${file.name}`);
        return;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push({
          id: Math.random(),
          src: e.target.result,
          name: file.name
        });

        if (newPreviews.length === validFiles.length) {
          setPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setFiles(prev => [...prev, ...validFiles]);
    setError(null);
  };

  // Remove preview
  const removePreview = (id) => {
    setPreviews(prev => {
      const newPreviews = prev.filter(p => p.id !== id);
      setFiles(f => f.slice(newPreviews.length));
      return newPreviews;
    });
  };

  // Upload photos
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Sélectionnez au moins une photo');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();

      if (files.length === 1) {
        // Single upload
        formData.append('photo', files[0]);

        const endpoint = eventId
          ? `/api/photos/event/${eventId}/photo`
          : '/api/photos/upload';

        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        setUploadedPhotos([data.photo]);
        setFiles([]);
        setPreviews([]);

        if (onUploadSuccess) {
          onUploadSuccess(data.photo);
        }
      } else {
        // Multiple upload
        files.forEach(file => {
          formData.append('photos', file);
        });

        const response = await fetch('/api/photos/upload-multiple', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        setUploadedPhotos(data.photos);
        setFiles([]);
        setPreviews([]);

        if (onUploadSuccess) {
          onUploadSuccess(data.photos);
        }
      }

      setUploadProgress(100);
    } catch (err) {
      setError(`Erreur d'upload: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="photo-upload-container">
      <h3>📸 Upload de Photos</h3>

      {/* File Input */}
      <div className="upload-area">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileSelect}
          disabled={uploading}
          style={{ display: 'none' }}
        />

        <div
          className="upload-zone"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">📁</div>
          <p>Cliquez ou glissez les photos ici</p>
          <p className="upload-hint">Max 5MB par fichier</p>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="upload-error">{error}</div>}

      {/* Previews */}
      {previews.length > 0 && (
        <div className="previews">
          <h4>Aperçu ({previews.length})</h4>
          <div className="preview-grid">
            {previews.map(preview => (
              <div key={preview.id} className="preview-item">
                <img src={preview.src} alt={preview.name} />
                <button
                  className="remove-btn"
                  onClick={() => removePreview(preview.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="progress-text">Téléchargement... {uploadProgress}%</p>
        </div>
      )}

      {/* Upload Button */}
      <button
        className="upload-btn"
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
      >
        {uploading ? 'Téléchargement...' : `Télécharger (${files.length})`}
      </button>

      {/* Uploaded Photos */}
      {uploadedPhotos.length > 0 && (
        <div className="uploaded-photos">
          <h4>✅ Photos téléchargées</h4>
          <div className="photos-grid">
            {uploadedPhotos.map((photo, idx) => (
              <div key={idx} className="uploaded-photo">
                <img src={photo.url} alt={photo.filename} />
                <p className="photo-name">{photo.filename}</p>
                <p className="photo-size">
                  {(photo.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
