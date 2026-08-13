import { DocumentBuilder } from '@nestjs/swagger';

export function createSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Lumora API')
    .setDescription('API documentation for Lumora project')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access Token (Authorization header)',
      },
      'access-token',
    )
    .addCookieAuth('refreshToken', {
      type: 'apiKey',
      in: 'cookie',
      description: 'Refresh Token (HttpOnly Cookie)',
    })
    .addTag('Auth', 'Authentication, login, refresh tokens, 2FA')
    .addTag('Users', 'User management')
    .build();
}
