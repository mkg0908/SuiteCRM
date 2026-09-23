import React from 'react';
interface MaskedContactCellProps { value: string | null | undefined; label: string; }
export function MaskedContactCell({ value, label }: MaskedContactCellProps) {
  if (!value) return <span style={{ color: '#999' }}>-</span>;
  return <span aria-label={label}>{value}</span>;
}
