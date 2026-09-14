import path from 'node:path';
import fs from 'node:fs';

/**
 * Returns a writable directory path for file uploads.
 * On Vercel serverless environments, writes to /tmp/uploads/<subfolder>.
 * On local / VPS environments, writes to apps/api/uploads/<subfolder>.
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
