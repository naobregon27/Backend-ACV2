export function parsePagination(query: { page?: string; pageSize?: string }) {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(String(query.pageSize || '20'), 10) || 20));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}

export function paginationMeta(total: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}
