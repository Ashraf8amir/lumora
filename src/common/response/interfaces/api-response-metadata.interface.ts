export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponseMetadata {
  pagination?: PaginationMetadata;
  [key: string]: unknown;
}
