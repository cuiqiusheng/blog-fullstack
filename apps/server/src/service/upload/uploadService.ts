import qiniu from 'qiniu';
import { randomUUID } from 'crypto';
import path from 'path';

interface UploadTokenResult {
  token: string;
  key: string;
  cdnDomain: string;
}

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function getQiniuConfig() {
  const accessKey = process.env.QINIU_ACCESS_KEY;
  const secretKey = process.env.QINIU_SECRET_KEY;
  const bucket = process.env.QINIU_BUCKET;
  const cdnDomain = process.env.QINIU_CDN_DOMAIN;

  if (!accessKey || !secretKey || !bucket || !cdnDomain) {
    throw new Error(
      'Missing Qiniu configuration. Required: QINIU_ACCESS_KEY, QINIU_SECRET_KEY, QINIU_BUCKET, QINIU_CDN_DOMAIN',
    );
  }

  return { accessKey, secretKey, bucket, cdnDomain };
}

function generateFileKey(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const uuid = randomUUID();
  return `uploads/${year}/${month}/${uuid}${ext}`;
}

export function generateUploadToken(fileName: string): UploadTokenResult {
  const ext = path.extname(fileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(
      `File type not allowed: ${ext}. Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}`,
    );
  }

  const { accessKey, secretKey, bucket, cdnDomain } = getQiniuConfig();
  const key = generateFileKey(fileName);

  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: `${bucket}:${key}`,
    expires: 5 * 60, // 5 minutes
    fsizeLimit: MAX_FILE_SIZE,
    mimeLimit: 'image/jpeg;image/png;image/gif;image/webp',
  });

  const token = putPolicy.uploadToken(mac);
  return { token, key, cdnDomain };
}
