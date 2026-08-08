import { PaginationMetadata } from '../interfaces/api-response-metadata.interface';

export function createPaginationResult(
  page: number,
  limit: number,
  total: number,
): { pagination: PaginationMetadata } {
  const totalPages = Math.ceil(total / limit);

  return {
    pagination: {
      page: page,
      limit: limit,
      total: total,
      totalPages: totalPages,
    },
  };
}
