import { DocumentBuilder } from '@nestjs/swagger';
import { version } from '../../../package.json';

interface SwaggerSecurityScheme {
  name: string;
  scheme: 'bearer' | 'apiKey';
  format?: string;
  description: string;
  location?: 'header' | 'cookie';
}

interface SwaggerTag {
  name: string;
  description: string;
}

interface SwaggerServer {
  url: string;
  description: string;
  variables?: Record<string, { default: string; description?: string }>;
}

const SECURITY_SCHEMES: Record<string, SwaggerSecurityScheme> = {
  accessToken: {
    name: 'access-token',
    scheme: 'bearer',
    format: 'JWT',
    description: 'Access Token (Authorization header)',
  },
  refreshToken: {
    name: 'refreshToken',
    scheme: 'apiKey',
    description: 'Refresh Token (HttpOnly Cookie)',
    location: 'cookie',
  },
};

const API_TAGS: SwaggerTag[] = [
  {
    name: 'Auth',
    description:
      'Authentication endpoints including login, registration, token refresh, and logout.',
  },
  {
    name: 'Users',
    description: 'User management endpoints including profile updates and user queries.',
  },
  {
    name: 'Products',
    description: 'Product catalog and inventory management.',
  },
  {
    name: 'Orders',
    description: 'Order processing and management.',
  },
];

const SERVERS: SwaggerServer[] = [
  {
    url: 'http://localhost:3000/api',
    description: 'Development Server',
  },
  {
    url: 'https://staging-api.lumora.com/api',
    description: 'Staging Server',
  },
  {
    url: 'https://api.lumora.com/api',
    description: 'Production Server',
  },
];

export function createSwaggerConfig() {
  const builder = new DocumentBuilder()
    .setTitle('Lumora API')
    .setDescription(
      'Comprehensive REST API documentation for Lumora project. ' +
        'All requests (except auth endpoints) require valid JWT authentication. ' +
        'The API uses standardized response envelopes with success, statusCode, message, and data fields.',
    )
    .setVersion(version)
    .setContact('Lumora Support', 'https://lumora.com', 'support@lumora.com')
    .setLicense('UNLICENSED', '');

  // Add API servers
  SERVERS.forEach((server) => {
    builder.addServer(server.url, server.description);
  });

  // Add security schemes
  builder.addBearerAuth(
    {
      type: 'http',
      scheme: SECURITY_SCHEMES.accessToken.scheme,
      bearerFormat: SECURITY_SCHEMES.accessToken.format,
      description: SECURITY_SCHEMES.accessToken.description,
    },
    SECURITY_SCHEMES.accessToken.name,
  );

  builder.addCookieAuth(SECURITY_SCHEMES.refreshToken.name, {
    type: 'apiKey',
    in: SECURITY_SCHEMES.refreshToken.location,
    description: SECURITY_SCHEMES.refreshToken.description,
  });

  // Add tags with descriptions
  API_TAGS.forEach((tag) => {
    builder.addTag(tag.name, tag.description);
  });

  return builder.build();
}
