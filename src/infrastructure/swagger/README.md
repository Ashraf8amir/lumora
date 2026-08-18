# Swagger Documentation System

Comprehensive and extensible Swagger/OpenAPI documentation setup for the Lumora API.

## 📁 File Structure

```
src/infrastructure/swagger/
├── decorators/
│   ├── api-common-errors.decorator.ts       # Standard error response documentation
│   ├── api-doc-property.decorator.ts        # Enhanced property documentation
│   ├── api-endpoint.decorator.ts            # Complete endpoint documentation
│   ├── api-ok-response-wrapped.decorator.ts # Success response documentation
│   ├── api-request-body.decorator.ts        # Request body with examples
│   ├── api-schema-example.decorator.ts      # Schema example metadata
│   └── index.ts                             # Exports all decorators
├── setup-swagger.ts                         # Swagger initialization
├── swagger.config.ts                        # Swagger configuration builder
├── index.ts                                 # Module exports
└── README.md                                # This file
```

## 🎯 Core Features

### 1. **Enhanced Configuration** (`swagger.config.ts`)

- Dynamic version from package.json
- Multiple server environments (Dev, Staging, Prod)
- Organized security schemes (Bearer JWT + Cookie-based refresh tokens)
- Structured API tags with descriptions
- Contact and license information

### 2. **Decorators**

#### `@ApiEndpoint(options)`

Complete endpoint documentation in one decorator.

```typescript
@ApiEndpoint({
  summary: 'Get user by ID',
  description: 'Retrieve detailed information about a specific user',
  params: [
    { name: 'id', description: 'The user ID', type: 'string' }
  ],
  queries: [
    { name: 'includeDetails', description: 'Include extra details', type: 'boolean' }
  ],
  security: ['access-token'],
  deprecated: false
})
@Get(':id')
findOne(@Param('id') id: string) { }
```

**Options:**

- `summary` (string, required): Short operation summary
- `description` (string, optional): Detailed description
- `params` (ParamDoc[], optional): Route parameters
- `queries` (QueryDoc[], optional): Query parameters
- `security` (string[], optional): Required security schemes
- `deprecated` (boolean, optional): Mark as deprecated

---

#### `@ApiRequestBodyWithExample(dto, options)`

Document request bodies with multiple examples.

```typescript
@ApiRequestBodyWithExample(CreateCustomerDto, {
  description: 'Customer registration payload',
  examples: {
    basic: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    },
    withAddresses: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      addresses: [
        {
          label: 'Home',
          city: 'Cairo',
          street: 'Nile Street',
          building: '123',
          apartment: '5A'
        }
      ]
    }
  }
})
@Post()
create(@Body() dto: CreateCustomerDto) { }
```

**Options:**

- `description` (string, optional): Request body description
- `examples` (Record<string, any>, optional): Named examples for the request
- `isArray` (boolean, optional): Whether the body is an array

---

#### `@ApiOkResponseWrapped(dto, options)`

Document success responses with automatic envelope wrapping.

```typescript
@ApiOkResponseWrapped(UserResponseDto, {
  isPaginated: true,
  description: 'Paginated list of users'
})
@Get()
findAll() { }

// Single response
@ApiOkResponseWrapped(UserResponseDto, {
  description: 'User details'
})
@Get(':id')
findOne(@Param('id') id: string) { }
```

**Options:**

- `isArray` (boolean, optional): Whether response is an array
- `isPaginated` (boolean, optional): Include pagination metadata (total, page, limit, pages)
- `description` (string, optional): Response description

**Response Envelope:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": {},
  "metadata": {}
}
```

---

#### `@ApiCommonErrors(keys)`

Document common HTTP error responses.

```typescript
@ApiCommonErrors(['BAD_REQUEST', 'UNAUTHORIZED', 'NOT_FOUND', 'CONFLICT'])
@Post()
create() { }
```

**Supported Error Codes:**

- `BAD_REQUEST` (400): Validation failed
- `UNAUTHORIZED` (401): Missing/invalid token
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource already exists
- `INTERNAL_SERVER_ERROR` (500): Server error

**Error Response Format:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "ValidationError",
  "path": "/api/v1/users",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "a1b2c3d4-..."
}
```

---

#### `@ApiDocProperty(options)`

Enhanced property documentation for DTOs.

```typescript
export class CreateUserDto {
  @ApiDocProperty({
    description: 'User first name',
    example: 'John',
    minLength: 2,
    maxLength: 50,
  })
  firstName!: string;

  @ApiDocProperty({
    description: 'User email address',
    example: 'john@example.com',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
  })
  email!: string;

  @ApiDocProperty({
    description: 'User role',
    enum: ['admin', 'user', 'guest'],
    example: 'user',
  })
  role!: string;

  @ApiDocProperty({
    description: 'Optional phone number',
    example: '+1234567890',
    isOptional: true,
  })
  phone?: string;
}
```

**Options:**

- `description` (string, optional): Property description
- `example` (any, optional): Example value
- `pattern` (string, optional): Regex pattern for strings
- `minLength` (number, optional): Minimum string length
- `maxLength` (number, optional): Maximum string length
- `minimum` (number, optional): Minimum numeric value
- `maximum` (number, optional): Maximum numeric value
- `enum` (unknown[], optional): Allowed values
- `isArray` (boolean, optional): Whether the property is an array
- `isOptional` (boolean, optional): Whether the property is optional

---

#### `@ApiSchemaExample(examples)`

Attach example values to DTO classes.

```typescript
@ApiSchemaExample({
  example1: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  example2: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
})
export class UserDto {}
```

---

## 🚀 Setup Functions

### `setupSwagger(app, options?)`

Initialize Swagger UI for the application.

```typescript
// In bootstrap.ts
import { setupSwagger } from '@/infrastructure/swagger';

export async function bootstrap(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

  setupSwagger(app, {
    path: 'api/docs', // Default: 'api/docs'
    enableBasicAuth: true, // Default: true
    persistAuthorization: true, // Default: true
  });

  return app;
}
```

**Options:**

- `path` (string, optional): Swagger UI path (default: 'api/docs')
- `enableBasicAuth` (boolean, optional): Enable basic auth (default: true)
- `persistAuthorization` (boolean, optional): Persist auth token (default: true)

---

### `createSwaggerConfig()`

Build the Swagger document configuration.

Already integrated in `setupSwagger()`, but can be used standalone:

```typescript
import { SwaggerModule } from '@nestjs/swagger';
import { createSwaggerConfig } from '@/infrastructure/swagger';

const document = SwaggerModule.createDocument(app, createSwaggerConfig());
SwaggerModule.setup('api/docs', app, document);
```

---

## 📋 Complete Example

```typescript
import { Controller, Get, Post, Param, Query, Body, Delete, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiEndpoint,
  ApiRequestBodyWithExample,
  ApiOkResponseWrapped,
  ApiCommonErrors,
  ApiDocProperty,
} from '@/infrastructure/swagger/decorators';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  @Post('customers')
  @ApiEndpoint({
    summary: 'Create a new customer',
    description: 'Creates a new customer account with optional address information',
    security: ['access-token'],
  })
  @ApiRequestBodyWithExample(CreateCustomerDto, {
    description: 'Customer registration payload',
    examples: {
      basic: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
      withAddresses: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        addresses: [
          {
            label: 'Home',
            city: 'Cairo',
            street: 'Nile Street',
            building: '123',
            apartment: '5A',
            isDefault: true,
          },
        ],
      },
    },
  })
  @ApiOkResponseWrapped(UserResponseDto, {
    description: 'Customer created successfully',
  })
  @ApiCommonErrors(['BAD_REQUEST', 'CONFLICT'])
  async create(@Body() dto: CreateCustomerDto) {
    // implementation
  }

  @Get()
  @ApiEndpoint({
    summary: 'List all customers',
    description: 'Retrieve a paginated list of customers with filtering options',
    queries: [
      {
        name: 'search',
        description: 'Search by customer name or email',
        example: 'john',
      },
      {
        name: 'isActive',
        description: 'Filter by active status',
        type: 'boolean',
        example: true,
      },
      {
        name: 'page',
        description: 'Page number (1-based)',
        type: 'number',
        example: 1,
      },
      {
        name: 'limit',
        description: 'Items per page',
        type: 'number',
        example: 20,
      },
    ],
    security: ['access-token'],
  })
  @ApiOkResponseWrapped(UserResponseDto, {
    isArray: true,
    isPaginated: true,
    description: 'Paginated list of customers',
  })
  @ApiCommonErrors(['BAD_REQUEST'])
  async findAll(@Query() query: QueryUserDto) {
    // implementation
  }

  @Get(':id')
  @ApiEndpoint({
    summary: 'Get customer by ID',
    description: 'Retrieve detailed information about a specific customer',
    params: [
      {
        name: 'id',
        description: 'The unique customer identifier (MongoDB ObjectId)',
        type: 'string',
      },
    ],
    security: ['access-token'],
  })
  @ApiOkResponseWrapped(UserResponseDto, {
    description: 'Customer details retrieved successfully',
  })
  @ApiCommonErrors(['NOT_FOUND'])
  async findOne(@Param('id') id: string) {
    // implementation
  }

  @Patch(':id')
  @ApiEndpoint({
    summary: 'Update customer',
    description: 'Update specific fields of an existing customer',
    params: [
      {
        name: 'id',
        description: 'The customer ID to update',
        type: 'string',
      },
    ],
    security: ['access-token'],
  })
  @ApiRequestBodyWithExample(UpdateUserDto, {
    description: 'Fields to update (all fields optional)',
    examples: {
      updateName: {
        firstName: 'Jonathan',
        lastName: 'Doe',
      },
      updateStatus: {
        isActive: false,
      },
    },
  })
  @ApiOkResponseWrapped(UserResponseDto, {
    description: 'Customer updated successfully',
  })
  @ApiCommonErrors(['NOT_FOUND', 'BAD_REQUEST'])
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    // implementation
  }

  @Delete(':id')
  @ApiEndpoint({
    summary: 'Delete customer',
    description: 'Permanently delete a customer account',
    params: [
      {
        name: 'id',
        description: 'The customer ID to delete',
        type: 'string',
      },
    ],
    security: ['access-token'],
  })
  @ApiCommonErrors(['NOT_FOUND'])
  async remove(@Param('id') id: string) {
    // implementation
  }
}
```

---

## 🔒 Security Schemes

### Bearer Token (JWT)

```typescript
// Automatically applied to endpoints with:
@ApiEndpoint({ security: ['access-token'] })
```

Default header: `Authorization: Bearer <token>`

### Refresh Token (Cookie)

Configured automatically in the setup. Uses HttpOnly cookie.

---

## 📝 Environment Configuration

Required environment variables (in `.env`):

```bash
# Swagger Configuration
SWAGGER_ENABLED_IN_PRODUCTION=false      # Enable/disable in production
SWAGGER_BASIC_AUTH_USER=admin            # Basic auth username
SWAGGER_BASIC_AUTH_PASSWORD=password123  # Basic auth password
```

---

## 🌐 Available Endpoints

- **Development:** `http://localhost:3000/api/docs`
- **Staging:** `https://staging-api.lumora.com/api/docs`
- **Production:** `https://api.lumora.com/api/docs`

---

## ✨ Key Benefits

- ✅ **Comprehensive Documentation**: Every endpoint, parameter, and response is documented
- ✅ **Type-Safe**: Full TypeScript support with interfaces
- ✅ **Example Values**: Multiple examples for request/response bodies
- ✅ **Error Handling**: Standardized error response documentation
- ✅ **Security**: Built-in authentication/authorization documentation
- ✅ **Pagination**: Automatic pagination metadata handling
- ✅ **Extensible**: Easy to add new decorators and configurations
- ✅ **Environment-Aware**: Different servers for different environments

---

## 🔄 Response Envelope

All API responses follow a standardized envelope format:

### Success Response (2xx)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Customers retrieved successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "customer",
      "isActive": true,
      "isEmailVerified": true
    }
  ],
  "metadata": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

### Error Response (4xx, 5xx)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "ValidationError",
  "path": "/api/v1/customers",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p"
}
```

---

## 📚 Additional Resources

- See `SWAGGER_GUIDE.md` for additional examples
- NestJS Swagger: https://docs.nestjs.com/openapi/introduction
- OpenAPI Specification: https://swagger.io/specification/
