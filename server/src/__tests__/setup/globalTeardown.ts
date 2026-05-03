import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import os from 'os';
import path from 'path';

export default async function globalTeardown() {
  const mongoServer = (global as Record<string, unknown>).__MONGO_SERVER__ as MongoMemoryServer;
  if (mongoServer) {
    await mongoServer.stop();
  }
  const tmpFile = path.join(os.tmpdir(), 'acv2-test-mongo-uri.txt');
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
}
