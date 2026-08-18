import { PaginationMetadata } from '../interfaces/api-response-metadata.interface';

export function createPaginationResult(
  page: number,
  limit: number,
  total: number,
): { pagination: PaginationMetadata } {
  const totalPages = Math.ceil(total / limit);

  return {
    pagination: {
      total: total,
      page: page,
      limit: limit,
      totalPages: totalPages,
    },
  };
}
