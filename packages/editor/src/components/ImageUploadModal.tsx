import { useState, useRef, useCallback, useEffect } from 'react';

interface ImageUploadModalProps {
  open: boolean;
  onClose: () => void;
  onImageUpload: (file: File) => Promise<string>;
  onInsertImage: (url: string) => void;
}

type Tab = 'upload' | 'url';

const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';
const MAX_SIZE = 5 * 1024 * 1024;

function isImageFile(file: File): boolean {
  return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
}

export function ImageUploadModal({
  open,
  onClose,
  onImageUpload,
  onInsertImage,
}: ImageUploadModalProps) {
  const [tab, setTab] = useState<Tab>('upload');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setTab('upload');
      setUploading(false);
      setError('');
      setPreview('');
      setUrlInput('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  const handleFile = useCallback(
    async (file: File) => {
      setError('');
      if (!isImageFile(file)) {
        setError('不支持的文件类型，请选择 JPG/PNG/GIF/WebP 格式');
        return;
      }
      if (file.size > MAX_SIZE) {
        setError(`文件大小 ${(file.size / 1024 / 1024).toFixed(1)}MB 超出 5MB 限制`);
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setUploading(true);

      try {
        const url = await onImageUpload(file);
        onInsertImage(url);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : '上传失败');
      } finally {
        setUploading(false);
        URL.revokeObjectURL(objectUrl);
      }
    },
    [onImageUpload, onInsertImage, onClose],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleFile],
  );

  const handleUrlInsert = useCallback(() => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onInsertImage(trimmed);
    onClose();
  }, [urlInput, onInsertImage, onClose]);

  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleUrlInsert();
    },
    [handleUrlInsert],
  );

  if (!open) return null;

  return (
    <div className="img-upload-overlay" onClick={onClose}>
      <div className="img-upload-modal" onClick={e => e.stopPropagation()}>
        <div className="img-upload-header">
          <span className="img-upload-title">插入图片</span>
          <button type="button" className="img-upload-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="img-upload-tabs">
          <button
            type="button"
            className={`img-upload-tab${tab === 'upload' ? ' is-active' : ''}`}
            onClick={() => setTab('upload')}
          >
            上传文件
          </button>
          <button
            type="button"
            className={`img-upload-tab${tab === 'url' ? ' is-active' : ''}`}
            onClick={() => setTab('url')}
          >
            输入链接
          </button>
        </div>

        <div className="img-upload-body">
          {tab === 'upload' && (
            <>
              <div
                className={`img-upload-dropzone${uploading ? ' is-uploading' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => !uploading && fileInputRef.current?.click()}
              >
                {preview ? (
                  <img src={preview} alt="preview" className="img-upload-preview" />
                ) : (
                  <div className="img-upload-placeholder">
                    <span className="img-upload-icon">📁</span>
                    <span>点击或拖拽图片到此处</span>
                    <span className="img-upload-hint">支持 JPG / PNG / GIF / WebP，最大 5MB</span>
                  </div>
                )}
                {uploading && (
                  <div className="img-upload-loading">
                    <span className="img-upload-spinner" />
                    <span>上传中…</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                onChange={handleFileInput}
                hidden
              />
            </>
          )}

          {tab === 'url' && (
            <div className="img-upload-url-form">
              <input
                className="img-upload-url-input"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={handleUrlKeyDown}
                autoFocus
              />
              <button
                type="button"
                className="img-upload-url-btn"
                onClick={handleUrlInsert}
                disabled={!urlInput.trim()}
              >
                插入
              </button>
            </div>
          )}

          {error && <div className="img-upload-error">{error}</div>}
        </div>
      </div>
    </div>
  );
}
