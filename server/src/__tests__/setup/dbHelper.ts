import mongoose from 'mongoose';
import fs from 'fs';
import os from 'os';
import path from 'path';

function getTestMongoUri(): string {
  // Intentamos desde variable de entorno primero
  if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'placeholder') {
    return process.env.MONGODB_URI;
  }
  // Fallback: archivo temporal escrito en globalSetup
  const tmpFile = path.join(os.tmpdir(), 'acv2-test-mongo-uri.txt');
  if (fs.existsSync(tmpFile)) {
    return fs.readFileSync(tmpFile, 'utf-8').trim();
  }
  throw new Error('No se encontró la URI de MongoDB para tests. Ejecutá npm test desde server/.');
}

export async function connectTestDB() {
  // Aseguramos que las variables de entorno estén configuradas para tests
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-key-minimo-32-caracteres-ok';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-minimo-32-caracteres-ok';
  process.env.PUBLIC_API_URL = process.env.PUBLIC_API_URL ?? 'http://localhost:4000';
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = getTestMongoUri();

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

export async function disconnectTestDB() {
  await mongoose.disconnect();
}
