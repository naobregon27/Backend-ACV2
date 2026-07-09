import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';

const tmpFile = path.join(os.tmpdir(), 'acv2-test-mongo-uri.txt');

function writeTestMongoUri(uri: string) {
  fs.writeFileSync(tmpFile, uri, 'utf-8');
}

export default async function globalSetup() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });

  if (process.env.SKIP_MEMORY_MONGO === '1' && process.env.MONGODB_URI) {
    writeTestMongoUri(process.env.MONGODB_URI);
    return;
  }

  if (process.env.MONGODB_URI) {
    writeTestMongoUri(process.env.MONGODB_URI);
    console.info('[tests] Usando MONGODB_URI del .env (SKIP_MEMORY_MONGO=1 para omitir MongoMemoryServer).');
    return;
  }

  try {
    const mongoServer = await MongoMemoryServer.create({
      instance: { launchTimeout: 60000 },
    });
    writeTestMongoUri(mongoServer.getUri());
    (global as Record<string, unknown>).__MONGO_SERVER__ = mongoServer;
  } catch (err) {
    if (process.env.MONGODB_URI) {
      console.warn(
        '[tests] MongoMemoryServer no disponible; usando MONGODB_URI del .env como fallback.',
      );
      writeTestMongoUri(process.env.MONGODB_URI);
      return;
    }
    throw err;
  }
}
