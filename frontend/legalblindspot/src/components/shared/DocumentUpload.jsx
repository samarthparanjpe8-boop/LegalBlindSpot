import { useState, useRef } from 'react';
import { Upload, File, X, Check, ChevronDown } from 'lucide-react';

const ALLOWED_TYPES = ['.pdf', '.png', '.jpg', '.jpeg', '.zip'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function DocumentUpload({ sessionId, onUploadComplete, onError, documentTypes }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [showDocDropdown, setShowDocDropdown] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_TYPES.includes(ext)) {
      throw new Error(`Invalid file type: ${ext}. Only PDF, PNG, JPG, and ZIP files are allowed.`);
    }
    if (file.size > MAX_SIZE) {
      throw new Error(`File size exceeds 10MB limit.`);
    }
    return true;
  };

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const errors = [];

    fileArray.forEach((file) => {
      try {
        validateFile(file);
        validFiles.push(file);
      } catch (err) {
        errors.push(err.message);
      }
    });

    if (errors.length > 0 && onError) {
      onError(errors.join('\n'));
    }

    uploadFiles(validFiles);
  };

  const uploadFiles = async (files) => {
    if (files.length === 0) return;

    setIsUploading(true);

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      if (sessionId) {
        formData.append('sessionId', sessionId);
      }
      if (selectedDocType) {
        formData.append('documentType', selectedDocType);
      }

      try {
        const response = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();
        setUploadedFiles((prev) => [...prev, { ...result.data, status: 'success' }]);
        
        if (onUploadComplete) {
          onUploadComplete(result.data);
        }
      } catch (err) {
        setUploadedFiles((prev) => [...prev, { originalName: file.name, status: 'error', error: err.message }]);
        if (onError) {
          onError(`Failed to upload ${file.name}: ${err.message}`);
        }
      }
    }

    setIsUploading(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleInputChange = (e) => {
    handleFileSelect(e.target.files);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="document-upload">
      {documentTypes && documentTypes.length > 0 && (
        <div className="doc-type-selector">
          <label className="doc-type-label">Document Type</label>
          <div className="doc-type-dropdown">
            <button
              className="doc-type-dropdown-btn"
              onClick={() => setShowDocDropdown(!showDocDropdown)}
            >
              <span className="doc-type-selected">
                {selectedDocType || 'Select document type...'}
              </span>
              <ChevronDown size={16} className="dropdown-arrow" />
            </button>
            {showDocDropdown && (
              <div className="doc-type-dropdown-menu">
                {documentTypes.map((doc) => (
                  <button
                    key={doc.name}
                    className="doc-type-option"
                    onClick={() => {
                      setSelectedDocType(doc.name);
                      setShowDocDropdown(false);
                    }}
                  >
                    <span className="doc-option-name">{doc.name}</span>
                    <span className="doc-option-desc">{doc.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.zip"
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
        <div className="upload-zone-content">
          <Upload className="upload-icon" size={32} />
          <div className="upload-text">
            <p className="upload-title">Drop files here or click to upload</p>
            <p className="upload-subtitle">PDF, PNG, JPG, ZIP (max 10MB)</p>
          </div>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h4 className="uploaded-files-title">Uploaded Files</h4>
          {uploadedFiles.map((file, index) => (
            <div key={index} className={`uploaded-file ${file.status}`}>
              <div className="file-info">
                {file.status === 'success' ? (
                  <Check className="file-icon success" size={16} />
                ) : (
                  <File className="file-icon error" size={16} />
                )}
                <span className="file-name">{file.originalName}</span>
                {file.size && (
                  <span className="file-size">({formatFileSize(file.size)})</span>
                )}
              </div>
              <button
                className="remove-file-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {isUploading && (
        <div className="uploading-indicator">
          <div className="spinner"></div>
          <span>Uploading...</span>
        </div>
      )}

      <style jsx>{`
        .document-upload {
          width: 100%;
        }

        .doc-type-selector {
          margin-bottom: var(--space-4);
        }

        .doc-type-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: var(--space-2);
        }

        .doc-type-dropdown {
          position: relative;
        }

        .doc-type-dropdown-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-3) var(--space-4);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition);
        }

        .doc-type-dropdown-btn:hover {
          border-color: var(--border-light);
          background: var(--bg-hover);
        }

        .doc-type-selected {
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .dropdown-arrow {
          color: var(--text-muted);
          transition: transform 0.2s ease;
        }

        .doc-type-dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          z-index: 10;
          max-height: 300px;
          overflow-y: auto;
        }

        .doc-type-option {
          width: 100%;
          padding: var(--space-3) var(--space-4);
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          flex-direction: column;
          gap: 2px;
          border-bottom: 1px solid var(--border);
        }

        .doc-type-option:last-child {
          border-bottom: none;
        }

        .doc-type-option:hover {
          background: var(--bg-hover);
        }

        .doc-option-name {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .doc-option-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .upload-zone {
          border: 2px dashed var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-8);
          text-align: center;
          cursor: pointer;
          transition: var(--transition);
          background: var(--bg-card);
        }

        .upload-zone:hover {
          border-color: var(--border-light);
          background: var(--bg-hover);
        }

        .upload-zone.dragging {
          border-color: var(--accent);
          background: var(--accent-dim);
        }

        .upload-zone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
        }

        .upload-icon {
          color: var(--text-muted);
        }

        .upload-text {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .upload-title {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0;
        }

        .upload-subtitle {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0;
        }

        .uploaded-files {
          margin-top: var(--space-4);
        }

        .uploaded-files-title {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: var(--space-2);
        }

        .uploaded-file {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-2) var(--space-3);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          margin-bottom: var(--space-2);
          gap: var(--space-2);
        }

        .uploaded-file.success {
          border-color: rgba(16, 185, 129, 0.2);
        }

        .uploaded-file.error {
          border-color: rgba(239, 68, 68, 0.2);
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex: 1;
          min-width: 0;
        }

        .file-icon {
          flex-shrink: 0;
        }

        .file-icon.success {
          color: var(--success);
        }

        .file-icon.error {
          color: var(--danger);
        }

        .file-name {
          font-size: 0.85rem;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          font-size: 0.75rem;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .remove-file-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: var(--space-1);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
        }

        .remove-file-btn:hover {
          color: var(--danger);
          background: var(--bg-hover);
        }

        .uploading-indicator {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-top: var(--space-4);
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .uploading-indicator .spinner {
          width: 16px;
          height: 16px;
        }
      `}</style>
    </div>
  );
}
