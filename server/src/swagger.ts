import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './config/env';

const servers =
  env.NODE_ENV === 'production'
    ? [{ url: env.PUBLIC_API_URL + '/api/v1', description: 'Producción' }]
    : [
        { url: env.PUBLIC_API_URL + '/api/v1', description: 'Local' },
        { url: 'http://localhost:' + env.PORT + '/api/v1', description: 'Este servidor' },
      ];

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ACV2.MUSIC API',
      version: '1.0.0',
      description: 'API pública, autenticación y panel administración (v1).',
    },
    servers,
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/health': {
        get: {
          security: [],
          summary: 'Estado del servicio',
          responses: { '200': { description: 'OK' } },
        },
      },
      '/auth/register': {
        post: {
          security: [],
          summary: 'Registro de usuario web',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Creado' } },
        },
      },
      '/auth/login': {
        post: {
          security: [],
          summary: 'Login email + password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: { email: { type: 'string' }, password: { type: 'string' } },
                },
              },
            },
          },
          responses: { '200': { description: 'Tokens' } },
        },
      },
      '/public/site-config': {
        get: { security: [], summary: 'Configuración del sitio (nav, redes, highlights)' },
      },
    },
  },
  apis: [],
});
