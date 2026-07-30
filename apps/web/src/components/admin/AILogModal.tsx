'use client';
import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../lib/api';

interface AILogModalProps {
  onClose: () => void;
}

export default function AILogModal({ onClose }: AILogModalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchLogs = async () => {
      try {
        const res = await api.get('/api/admin/blog/posts/generate-ai-status');
        setLogs(res.data.logs || []);
        setIsRunning(res.data.isRunning);
      } catch (err) {
        console.error('Failed to fetch AI logs:', err);
      }
    };

    fetchLogs();
    interval = setInterval(fetchLogs, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isMinimized]);

  if (isMinimized) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#1e293b',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        zIndex: 1000,
        direction: 'rtl',
        border: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isRunning ? (
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#38bdf8' }}>sync</span>
          ) : (
            <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '18px' }}>check_circle</span>
          )}
          <span style={{ fontSize: '14px' }}>{isRunning ? 'در حال تولید مقاله...' : 'پایان تولید مقاله'}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', borderRight: '1px solid #334155', paddingRight: '10px' }}>
          <button onClick={() => setIsMinimized(false)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>open_in_full</span>
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      direction: 'rtl'
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        width: '650px',
        maxWidth: '90vw',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '1px solid #334155',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b' }}>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
            {isRunning ? (
              <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>sync</span>
            ) : (
              <span className="material-symbols-outlined" style={{ color: '#10b981' }}>check_circle</span>
            )}
            لاگ‌های تولید محتوای هوش مصنوعی
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setIsMinimized(true)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }} title="Minimize">
              <span className="material-symbols-outlined">minimize</span>
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }} title="Close">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <div ref={scrollRef} style={{
          padding: '20px',
          height: '400px',
          overflowY: 'auto',
          backgroundColor: '#020617',
          color: '#38bdf8',
          fontFamily: 'monospace',
          fontSize: '13px',
          lineHeight: '1.6',
          direction: 'ltr',
          textAlign: 'left'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', marginTop: '150px' }}>در حال ارتباط با سرور...</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} style={{ 
                marginBottom: '8px', 
                wordBreak: 'break-all',
                color: log.includes('Failed') || log.includes('rejected') ? '#ef4444' : 
                       log.includes('Success') || log.includes('approved') ? '#10b981' : 
                       '#38bdf8'
              }}>
                {log}
              </div>
            ))
          )}
          {!isRunning && logs.length > 0 && (
            <div style={{ marginTop: '20px', color: '#10b981', borderTop: '1px dashed #334155', paddingTop: '10px' }}>
              [System] Process finished. You can now close this window.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
