import { createApp } from './app';
import { connectDatabase, env } from './config';
import { ensureDefaultSiteConfig, ensureInitialAdminUser } from './services/bootstrap.service';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await ensureDefaultSiteConfig();
  await ensureInitialAdminUser();
}

bootstrap()
  .then(() => {
    console.info('[ACV2] Bootstrap completado: configuración del sitio y usuarios listos.');
    const app = createApp();
    app.listen(env.PORT, () => {
      console.info(`[ACV2] API escuchando en http://localhost:${env.PORT}`);
      console.info(`[ACV2] Documentación Swagger: http://localhost:${env.PORT}/api/v1/docs`);
      console.info(`[ACV2] Servidor listo · entorno: ${env.NODE_ENV}`);
    });
  })
  .catch((err) => {
    console.error('No se pudo iniciar el servidor:', err);
    process.exit(1);
  });
