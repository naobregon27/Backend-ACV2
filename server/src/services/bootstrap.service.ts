import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../models/User.model';
import { SiteConfig } from '../models/SiteConfig.model';
import { hashPassword, verifyPassword } from './auth.service';

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
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.warn('[bootstrap] No hay ADMIN_EMAIL/ADMIN_PASSWORD: no se creó administrador inicial.');
    }
    return;
  }

  const emailLower = env.ADMIN_EMAIL.toLowerCase();
  console.info(
    `[bootstrap] MongoDB db="${mongoose.connection.name}" · login admin debe usar email="${emailLower}"`,
  );
  const exists = await User.findOne({ email: emailLower }).select('+passwordHash');

  if (exists) {
    if (exists.role !== 'admin') {
      exists.role = 'admin';
      exists.passwordHash = await hashPassword(env.ADMIN_PASSWORD);
      exists.name = env.ADMIN_NAME || exists.name;
      exists.hasPremiumAccess = true;
      await exists.save();
      console.info('[bootstrap] Usuario promovido a administrador.');
      return;
    }
    let changed = false;
    const samePwd =
      !!exists.passwordHash && (await verifyPassword(env.ADMIN_PASSWORD, exists.passwordHash));
    if (!samePwd) {
      exists.passwordHash = await hashPassword(env.ADMIN_PASSWORD);
      changed = true;
    }
    if (env.ADMIN_NAME && exists.name !== env.ADMIN_NAME) {
      exists.name = env.ADMIN_NAME;
      changed = true;
    }
    if (changed) {
      await exists.save();
      console.info('[bootstrap] Administrador actualizado desde ADMIN_EMAIL / ADMIN_PASSWORD.');
    }
    return;
  }

  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount > 0) {
    console.warn(
      '[bootstrap] Ya hay administradores y ningún usuario coincide con ADMIN_EMAIL; no se creó cuenta nueva.',
    );
    return;
  }

  await User.create({
    email: emailLower,
    passwordHash: await hashPassword(env.ADMIN_PASSWORD),
    name: env.ADMIN_NAME || 'Administrador',
    role: 'admin',
    isBlocked: false,
    hasPremiumAccess: true,
  });
  console.info('[bootstrap] Usuario administrador inicial creado.');
}
