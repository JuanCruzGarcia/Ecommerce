'use client';

import { useState } from 'react';

interface UploadResult {
  url: string;
  key: string;
}

interface UseUploadReturn {
  uploadImage: (file: File, folder?: string) => Promise<UploadResult | null>;
  uploading: boolean;
  error: string | null;
}

/**
 * Hook para subir imágenes a Cloudflare R2 vía API route.
 * Utilizable desde cualquier componente cliente del admin.
 */
export function useR2Upload(): UseUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File, folder = 'products'): Promise<UploadResult | null> => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir imagen');
      }

      return { url: data.url, key: data.key };
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading, error };
}
