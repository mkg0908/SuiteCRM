import React from 'react';
interface ConflictAlertProps { message: string; onDismiss: () => void; }
export function ConflictAlert({ message, onDismiss }: ConflictAlertProps) {
  return (
    <div role="alert" style={{ background: '#fef3cd', border: '1px solid #ffc107', padding: '12px 16px', borderRadius: '4px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#856404' }}>{message}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }} aria-label="Dismiss alert">&times;</button>
    </div>
  );
}
