import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

const errorSchema = (statusCode: number, message: string) => ({
  status: statusCode,
  schema: {
    example: {
      success: false,
      statusCode,
      message,
      path: '/api/v1/products/123',
      timestamp: new Date().toISOString(),
      requestId: 'a1b2c3d4-...',
    },
  },
});

/**
 * توثيق موحد لأشكال الأخطاء الشائعة (400/401/403/404/409/500)،
 * مطابق تمامًا للشكل اللي بيرجعه AllExceptionsFilter فعليًا.
 *
 * الاستخدام:
 *   @ApiCommonErrors(['UNAUTHORIZED', 'NOT_FOUND'])
 *   @Get(':id')
 *   findOne() { ... }
 */
type CommonErrorKey = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT';

const ERROR_DEFINITIONS: Record<CommonErrorKey, ReturnType<typeof errorSchema>> = {
  BAD_REQUEST: errorSchema(400, 'Validation failed'),
  UNAUTHORIZED: errorSchema(401, 'Unauthorized'),
  FORBIDDEN: errorSchema(403, 'Forbidden resource'),
  NOT_FOUND: errorSchema(404, 'Resource not found'),
  CONFLICT: errorSchema(409, 'Resource already exists'),
};

export function ApiCommonErrors(keys: CommonErrorKey[]) {
  return applyDecorators(...keys.map((key) => ApiResponse(ERROR_DEFINITIONS[key])));
}
