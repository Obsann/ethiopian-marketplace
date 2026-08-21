import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

const uploadsDir = path.join(process.cwd(), 'uploads');

export async function uploadImageBuffer(
  buffer: Buffer,
  folder = 'ethiopian-marketplace'
): Promise<string> {
  const configured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (!configured) {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filename = `${randomUUID()}.jpg`;
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);
    const base = process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;
    return `${base}/uploads/${filename}`;
  }

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve(result.secure_url);
      }
    );
    bufferToStream(buffer).pipe(upload);
  });
}
