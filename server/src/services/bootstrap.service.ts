import { env } from '../config/env';
import { User } from '../models/User.model';
import { SiteConfig } from '../models/SiteConfig.model';
import { hashPassword } from './auth.service';

export async function ensureDefaultSiteConfig(): Promise<void> {
  const existing = await SiteConfig.findOne({ key: 'default' });
  if (existing) return;
  await SiteConfig.create({
    key: 'default',
    navLinks: [
      { label: 'Inicio', path: '/', sortOrder: 0, visible: true },
      { label: 'Música', path: '/musica', sortOrder: 1, visible: true },
      { label: 'Galería', path: '/galeria', sortOrder: 2, visible: true },
      { label: 'Comunidad', path: '/comunidad', sortOrder: 3, visible: true },
      { label: 'Contacto', path: '/contacto', sortOrder: 4, visible: true },
      { label: 'Exclusivo', path: '/exclusivo', sortOrder: 5, visible: true },
    ],
    socialLinks: [],
    highlights: [],
    siteSettings: {
      siteTitle: 'ACV2.Music',
      siteDescription: '',
    },
  });
}

export async function ensureInitialAdminUser(): Promise<void> {
  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount > 0) return;
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.warn('[bootstrap] No hay ADMIN_EMAIL/ADMIN_PASSWORD: no se creó administrador inicial.');
    return;
  }
  const exists = await User.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });
  if (exists) {
    if (exists.role !== 'admin') {
      exists.role = 'admin';
      exists.passwordHash = await hashPassword(env.ADMIN_PASSWORD);
      exists.name = env.ADMIN_NAME || exists.name;
      await exists.save();
    }
    return;
  }
  await User.create({
    email: env.ADMIN_EMAIL.toLowerCase(),
    passwordHash: await hashPassword(env.ADMIN_PASSWORD),
    name: env.ADMIN_NAME || 'Administrador',
    role: 'admin',
    isBlocked: false,
    hasPremiumAccess: true,
  });
  console.info('[bootstrap] Usuario administrador inicial creado.');
}
