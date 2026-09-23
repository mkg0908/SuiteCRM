import React from 'react';
interface SlaBadgeProgressProps { isAtRisk: boolean; isBreached: boolean; slaDueAt: string | null; }
export function SlaBadgeProgress({ isAtRisk, isBreached, slaDueAt }: SlaBadgeProgressProps) {
  if (!slaDueAt) return <span style={{ color: '#999' }}>-</span>;
  if (isBreached) return <span role="status" style={{ color: '#e74c3c', fontWeight: 600 }}>Breached</span>;
  if (isAtRisk) return <span role="status" style={{ color: '#f39c12', fontWeight: 600 }}>At Risk</span>;
  return <span role="status" style={{ color: '#2ecc71' }}>On Track</span>;
}
