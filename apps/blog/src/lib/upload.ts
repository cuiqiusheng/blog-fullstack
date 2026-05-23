import { getToken } from './auth';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const QINIU_UPLOAD_URL = 'https://up-z1.qiniup.com';

function getUploadTokenUrl(): string {
  const graphqlUri = import.meta.env.VITE_GRAPHQL_URI ?? '/api/graphql';
  return graphqlUri.replace(/\/graphql$/, '/upload/token');
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

export async function uploadImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadError(`不支持的文件类型: ${file.type}。支持: JPG, PNG, GIF, WebP`);
  }

  if (file.size > MAX_SIZE) {
    throw new UploadError(`文件大小超出限制: ${(file.size / 1024 / 1024).toFixed(1)}MB，最大 5MB`);
  }

  const token = getToken();
  if (!token) {
    throw new UploadError('请先登录');
  }

  const tokenRes = await fetch(getUploadTokenUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fileName: file.name }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.json().catch(() => ({ error: 'Unknown error' }));
    throw new UploadError(err.error || '获取上传凭证失败');
  }

  const { token: uploadToken, key, cdnDomain } = await tokenRes.json();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('token', uploadToken);
  formData.append('key', key);

  const uploadRes = await fetch(QINIU_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({ error: 'Unknown error' }));
    throw new UploadError(err.error || '图片上传失败');
  }

  return `${cdnDomain}/${key}`;
}
