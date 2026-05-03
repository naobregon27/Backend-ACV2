import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import os from 'os';
import path from 'path';

export default async function globalSetup() {
  const mongoServer = await MongoMemoryServer.create();

  const uri = mongoServer.getUri();

  // Guardamos la URI en un archivo temporal para que los tests la lean
  const tmpFile = path.join(os.tmpdir(), 'acv2-test-mongo-uri.txt');
  fs.writeFileSync(tmpFile, uri, 'utf-8');

  (global as Record<string, unknown>).__MONGO_SERVER__ = mongoServer;
}
