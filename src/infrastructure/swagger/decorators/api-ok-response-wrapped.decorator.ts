import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

interface ApiOkResponseWrappedOptions {
  isArray?: boolean;
  description?: string;
  isPaginated?: boolean;
}

/**
 * Decorator for documenting wrapped API responses with standardized envelope format.
 * Automatically documents the success response structure including metadata.
 *
 * @param dto - The data transfer object type for the response
 * @param options - Configuration options for the response format
 *
 * @example
 * Single response:
 * ```typescript
 * @ApiOkResponseWrapped(ProductDto, { description: 'Product details' })
 * @Get(':id')
 * findOne(@Param('id') id: string) { }
 * ```
 *
 * @example
 * Array response:
 * ```typescript
 * @ApiOkResponseWrapped(ProductDto, { isArray: true, isPaginated: true })
 * @Get()
 * findAll(@Query() query: PaginationQuery) { }
 * ```
 */
export function ApiOkResponseWrapped<T extends Type<unknown>>(
  dto: T,
  options?: ApiOkResponseWrappedOptions,
) {
  const dataSchema = options?.isArray
    ? { type: 'array', items: { $ref: getSchemaPath(dto) } }
    : { $ref: getSchemaPath(dto) };

  const defaultDescription = options?.isPaginated
    ? 'Successful response with paginated data'
    : options?.isArray
      ? 'Successful response with array data'
      : 'Successful response with single data object';

  const metadataProperties = options?.isPaginated
    ? {
        type: 'object',
        properties: {
          total: { type: 'number', example: 100 },
          page: { type: 'number', example: 1 },
          limit: { type: 'number', example: 10 },
          pages: { type: 'number', example: 10 },
        },
      }
    : { type: 'object' };

  return applyDecorators(
    ApiExtraModels(dto),
    ApiOkResponse({
      description: options?.description || defaultDescription,
      schema: {
        allOf: [
          {
            properties: {
              success: {
                type: 'boolean',
                example: true,
                description: 'Request success status',
              },
              statusCode: {
                type: 'number',
                example: 200,
                description: 'HTTP status code',
              },
              message: {
                type: 'string',
                example: 'Request successful',
                description: 'Human-readable response message',
              },
              data: {
                ...dataSchema,
                description: 'Response payload',
              },
              metadata: {
                ...metadataProperties,
                description: 'Additional metadata (e.g., pagination info)',
              },
            },
          },
        ],
      },
    }),
  );
}
