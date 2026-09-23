import React from 'react';
interface SearchInputProps { value: string; onChange: (value: string) => void; placeholder?: string; }
export function SearchInput({ value, onChange, placeholder = 'Search cases...' }: SearchInputProps) {
  return <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label="Search cases" style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '300px', fontSize: '14px' }} />;
}
