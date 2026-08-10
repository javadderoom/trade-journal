'use client';

import React, { useState } from 'react';
import { ReportModal, ReportTargetType } from './ReportModal';

interface ReportButtonProps {
  targetId: string;
  targetType: ReportTargetType;
  className?: string;
  style?: React.CSSProperties;
}

export function ReportButton({ targetId, targetType, className, style }: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button 
        title="Report" 
        onClick={() => setShowModal(true)} 
        className={className}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, ...style }}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </button>

      {showModal && (
        <ReportModal 
          targetId={targetId}
          targetType={targetType}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
