import React from 'react';
interface PaginationControlsProps { page: number; pageSize: number; total: number; onPageChange: (page: number) => void; }
export function PaginationControls({ page, pageSize, total, onPageChange }: PaginationControlsProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', alignItems: 'center' }}>
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
      <span style={{ fontSize: '14px' }}>Page {page} of {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
    </div>
  );
}
