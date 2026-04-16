import { connectDatabase, disconnectDatabase } from '../config';
import { ensureDefaultSiteConfig, ensureInitialAdminUser } from '../services/bootstrap.service';

async function main(): Promise<void> {
  await connectDatabase();
  try {
    await ensureDefaultSiteConfig();
    await ensureInitialAdminUser();
    console.info('Seed completado (admin inicial + site config por defecto si faltaban).');
  } finally {
    await disconnectDatabase();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
