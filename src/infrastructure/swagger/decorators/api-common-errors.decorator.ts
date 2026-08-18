import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

interface ErrorSchema {
  status: number;
  schema: {
    example: {
      success: boolean;
      statusCode: number;
      message: string;
      path: string;
      timestamp: string;
      requestId: string;
      error?: string;
    };
  };
}

const createErrorSchema = (statusCode: number, message: string, error?: string): ErrorSchema => ({
  status: statusCode,
  schema: {
    example: {
      success: false,
      statusCode,
      message,
      path: '/api/v1/products/123',
      timestamp: new Date().toISOString(),
      requestId: 'a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p',
      error: error || message,
    },
  },
});

type CommonErrorKey =
  'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_SERVER_ERROR';

const ERROR_DEFINITIONS: Record<CommonErrorKey, ErrorSchema> = {
  BAD_REQUEST: createErrorSchema(400, 'Validation failed', 'ValidationError'),
  UNAUTHORIZED: createErrorSchema(401, 'Unauthorized access', 'UnauthorizedError'),
  FORBIDDEN: createErrorSchema(403, 'Forbidden resource', 'ForbiddenError'),
  NOT_FOUND: createErrorSchema(404, 'Resource not found', 'NotFoundError'),
  CONFLICT: createErrorSchema(409, 'Resource already exists', 'ConflictError'),
  INTERNAL_SERVER_ERROR: createErrorSchema(500, 'Internal server error', 'InternalServerError'),
};

/**
 * Decorator for documenting common HTTP error responses.
 * Matches the actual error format returned by AllExceptionsFilter.
 *
 * @example
 * ```typescript
 * @ApiCommonErrors(['UNAUTHORIZED', 'NOT_FOUND'])
 * @Get(':id')
 * findOne(@Param('id') id: string) { }
 * ```
 */
export function ApiCommonErrors(keys: CommonErrorKey[]) {
  return applyDecorators(...keys.map((key) => ApiResponse(ERROR_DEFINITIONS[key])));
}
