import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

/**
 * In other words, `ApiOkResponseWrapped` is merely a response description intended for Swagger,
 * not the actual implementation logic for the response itself.
 *
 * usage with single response:
 *
 *   @ApiOkResponseWrapped(ProductDto)
 *   @Get(':id')
 *   findOne() { ... }
 *
 * usage with array response:
 *
 *   @ApiOkResponseWrapped(ProductDto, { isArray: true })
 *   @Get()
 *   findAll() { ... }
 */
export function ApiOkResponseWrapped<T extends Type<unknown>>(
  dto: T,
  options?: { isArray?: boolean; description?: string },
) {
  const dataSchema = options?.isArray
    ? { type: 'array', items: { $ref: getSchemaPath(dto) } }
    : { $ref: getSchemaPath(dto) };

  return applyDecorators(
    ApiExtraModels(dto),
    ApiOkResponse({
      description: options?.description,
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              statusCode: { type: 'number', example: 200 },
              message: { type: 'string', example: 'Request successful' },
              data: dataSchema,
              metadata: {
                type: 'object',
              },
            },
          },
        ],
      },
    }),
  );
}
