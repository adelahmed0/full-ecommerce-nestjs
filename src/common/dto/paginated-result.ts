export interface PaginationMeta {
  total_count: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

export type PaginatedResult<T, K extends string = string> = {
  [P in K]: T[];
} & {
  pagination: PaginationMeta;
};

export function buildPaginatedResult<T, K extends string>(
  collectionKey: K,
  items: T[],
  total: number,
  page: number,
  perPage: number,
): PaginatedResult<T, K> {
  return {
    [collectionKey]: items,
    pagination: {
      total_count: total,
      current_page: page,
      last_page: total === 0 ? 0 : Math.ceil(total / perPage),
      per_page: perPage,
    },
  } as PaginatedResult<T, K>;
}

export function isPaginatedResult(
  value: unknown,
): value is Record<string, unknown> & { pagination: PaginationMeta } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.pagination !== 'object' || record.pagination === null) {
    return false;
  }

  return Object.entries(record).some(
    ([key, entry]) => key !== 'pagination' && Array.isArray(entry),
  );
}
