import fs from 'fs';
import path from 'path';

const uploadRoot = path.join(process.cwd(), 'uploads');

export function ensureUploadDir(): void {
  if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });
}

export { uploadRoot };
