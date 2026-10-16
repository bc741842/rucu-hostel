"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Client-side search + pagination for a list. `getText` returns everything a
 * row should be searchable by; the query matches any word, case-insensitively.
 */
export function useTable<T>(
  rows: T[],
  getText: (row: T) => string,
  pageSize = 10,
) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return rows;
    return rows.filter((r) => {
      const text = getText(r).toLowerCase();
      return words.every((w) => text.includes(w));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Go back to page 1 when the search changes; clamp if rows shrink.
  useEffect(() => setPage(1), [query]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return {
    query,
    setQuery,
    page,
    setPage,
    pageCount,
    pageRows,
    filtered,
    total: rows.length,
    pageSize,
  };
}
