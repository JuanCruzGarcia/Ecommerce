import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from './client';

/**
 * Sube un archivo a Cloudflare R2 y devuelve la URL pública.
 * @param file - El archivo a subir (Buffer o Uint8Array)
 * @param fileName - Nombre de destino en el bucket
 * @param contentType - MIME type del archivo (ej: 'image/webp')
 */
export async function uploadToR2(
  file: Buffer | Uint8Array,
  fileName: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileName,
    Body: file,
    ContentType: contentType,
    // Cache publico por 1 año (imágenes de productos no cambian, se reemplazan)
    CacheControl: 'public, max-age=31536000, immutable',
  });

  await r2Client.send(command);

  // Retorna la URL pública del archivo
  return `${R2_PUBLIC_URL}/${fileName}`;
}

/**
 * Elimina un archivo del bucket R2.
 * @param fileUrl - URL pública del archivo o solo el Key (nombre del archivo)
 */
export async function deleteFromR2(fileUrlOrKey: string): Promise<void> {
  // Extrae el Key si se pasa la URL completa
  const key = fileUrlOrKey.startsWith('http')
    ? fileUrlOrKey.replace(`${R2_PUBLIC_URL}/`, '')
    : fileUrlOrKey;

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * Genera un nombre de archivo único para evitar colisiones.
 * @param folder - Carpeta dentro del bucket (ej: 'products', 'gallery')
 * @param originalName - Nombre original del archivo
 */
export function generateFileName(folder: string, originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${folder}/${timestamp}-${random}.${ext}`;
}
