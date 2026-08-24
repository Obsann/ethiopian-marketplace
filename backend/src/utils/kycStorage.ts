import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fetchPrivateKyc, isCloudinaryConfigured, uploadPrivateKyc } from './cloudinary';

const kycDir = path.join(process.cwd(), 'private', 'kyc');
const REF_PREFIX = 'kyc:';
const CLOUD_PREFIX = 'cloudinary:';

export function isLikelyImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return true;
  }
  const riff = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
  const webp = buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return riff && webp;
}

function extensionFor(buffer: Buffer): string {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return '.jpg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return '.png';
  if (buffer.subarray(8, 12).toString('ascii') === 'WEBP') return '.webp';
  return '.bin';
}

export async function saveKycImage(buffer: Buffer): Promise<string> {
  if (!isLikelyImageBuffer(buffer)) {
    throw new Error('File is not a valid image');
  }
  if (isCloudinaryConfigured()) {
    return uploadPrivateKyc(buffer);
  }
  fs.mkdirSync(kycDir, { recursive: true });
  const filename = `${randomUUID()}${extensionFor(buffer)}`;
  fs.writeFileSync(path.join(kycDir, filename), buffer);
  return `${REF_PREFIX}${filename}`;
}

export async function readKycImage(
  ref: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (ref.startsWith(CLOUD_PREFIX)) {
    const publicId = ref.slice(CLOUD_PREFIX.length);
    if (!publicId || publicId.includes('..')) return null;
    return fetchPrivateKyc(publicId);
  }
  if (!ref.startsWith(REF_PREFIX)) return null;
  const filename = path.basename(ref.slice(REF_PREFIX.length));
  if (!filename || filename.includes('..')) return null;
  const full = path.join(kycDir, filename);
  if (!fs.existsSync(full)) return null;
  const buffer = fs.readFileSync(full);
  const ext = path.extname(filename).toLowerCase();
  const contentType =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return { buffer, contentType };
}
