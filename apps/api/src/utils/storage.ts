import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import multer from 'multer';
import { put, del } from '@vercel/blob';

/**
 * Returns the configured Vercel Blob read/write token (supports default or custom prefix).
 */
export function getBlobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.BB_READ_WRITE_TOKEN;
}

/**
 * Checks whether Vercel Blob storage is configured via environment token.
 */
export function isVercelBlobConfigured(): boolean {
  return Boolean(getBlobToken());
}

/**
 * Returns a local fallback directory path for file uploads.
 * On Vercel without a blob token, writes to /tmp/uploads/<subfolder>.
 * On standard servers, writes to apps/api/uploads/<subfolder>.
 */
export function getUploadDir(subfolder: string): string {
  const base = process.env.VERCEL
    ? path.join('/tmp', 'uploads', subfolder)
    : path.join(__dirname, '../../uploads', subfolder);

  try {
    if (!fs.existsSync(base)) {
      fs.mkdirSync(base, { recursive: true });
    }
  } catch (err) {
    console.warn(`[Storage] Warning: Could not create directory ${base}:`, err);
  }

  return base;
}

/**
 * Saves a raw Buffer either to Vercel Blob (if configured) or to local disk storage.
 * Returns the public URL (e.g. https://...blob.vercel-storage.com/... or /uploads/...).
 */
export async function saveUploadedBuffer(
  buffer: Buffer,
  filename: string,
  mimetype: string,
  folder: string
): Promise<string> {
  if (isVercelBlobConfigured()) {
    const blobPath = `${folder}/${filename}`;
    const blob = await put(blobPath, buffer, {
      access: 'public',
      contentType: mimetype,
      token: getBlobToken(),
    });
    return blob.url;
  }

  // Local filesystem fallback
  const localDir = getUploadDir(folder);
  const localPath = path.join(localDir, filename);
  await fs.promises.writeFile(localPath, buffer);
  return `/uploads/${folder}/${filename}`;
}

/**
 * Saves an uploaded Multer file (from memoryStorage or diskStorage).
 * Automatically handles uploading to Vercel Blob or saving locally.
 */
export async function saveUploadedFile(
  file: Express.Multer.File,
  folder: string
): Promise<string> {
  const ext = path.extname(file.originalname).toLowerCase() || '.png';
  const filename = `${crypto.randomUUID()}${ext}`;
  const buffer = file.buffer || (file.path ? await fs.promises.readFile(file.path) : null);

  if (!buffer) {
    throw new Error('No file buffer available for upload');
  }

  const resultUrl = await saveUploadedBuffer(buffer, filename, file.mimetype, folder);

  // If a temporary disk file was created, clean it up
  if (file.path && fs.existsSync(file.path)) {
    try {
      await fs.promises.unlink(file.path);
    } catch (_) {}
  }

  return resultUrl;
}

/**
 * Deletes a file either from Vercel Blob or from the local filesystem.
 */
export async function deleteUploadedFile(fileUrlOrPath: string | null | undefined): Promise<void> {
  if (!fileUrlOrPath) return;

  try {
    if (fileUrlOrPath.startsWith('http') && fileUrlOrPath.includes('blob.vercel-storage.com')) {
      const token = getBlobToken();
      await del(fileUrlOrPath, token ? { token } : undefined);
      return;
    }

    // Local filesystem path handling
    const normalized = fileUrlOrPath.replace(/^\/api/, '');
    if (normalized.startsWith('/uploads/')) {
      const relPath = normalized.replace('/uploads/', '');
      const parts = relPath.split('/');
      if (parts.length >= 2) {
        const folder = parts[0];
        const filename = parts.slice(1).join('/');
        const localPath = path.join(getUploadDir(folder), filename);
        if (fs.existsSync(localPath)) {
          await fs.promises.unlink(localPath);
        }
      }
    }
  } catch (err) {
    console.warn(`[Storage] Warning: Failed to delete file ${fileUrlOrPath}:`, err);
  }
}

/**
 * Pre-configured Multer instances using memory storage (ideal for serverless + blob upload).
 */
export const createMemoryUpload = (maxSizeMB = 10, allowedMimes = [/jpeg|jpg|png|gif|webp/]) => {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const isAllowed = allowedMimes.some(regex => regex.test(file.mimetype));
      if (isAllowed) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type: ${file.mimetype}`));
      }
    },
  });
};
