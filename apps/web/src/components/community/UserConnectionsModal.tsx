import React from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { useTranslation } from '@/store/useAppStore';
import { FollowButton } from './FollowButton';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export interface UserConnectionsModalProps {
  userId: string;
  type: 'followers' | 'following';
  onClose: () => void;
}

export function UserConnectionsModal({ userId, type, onClose }: UserConnectionsModalProps) {
  const { language } = useTranslation();
  const isFa = language === 'fa';
  const params = useParams();
  const locale = params?.locale || 'en';

  const { data: users, error, isLoading } = useSWR<any[]>(`/api/community/user/${userId}/${type}`, fetcher);

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface-container-low)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          width: '100%', maxWidth: '400px',
          maxHeight: '80vh',
          display: 'flex', flexDirection: 'column'
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>
            {type === 'followers' ? (isFa ? 'دنبال‌کننده‌ها' : 'Followers') : (isFa ? 'دنبال‌شونده‌ها' : 'Following')}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '24px' }}>&times;</button>
        </div>
        
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isLoading && <div style={{ textAlign: 'center', color: 'var(--muted)' }}>{isFa ? 'در حال بارگذاری...' : 'Loading...'}</div>}
          {error && <div style={{ textAlign: 'center', color: 'var(--error)' }}>{isFa ? 'خطا در بارگذاری.' : 'Failed to load.'}</div>}
          
          {!isLoading && !error && users?.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
              {isFa ? 'هیچ کاربری یافت نشد.' : 'No users found.'}
            </div>
          )}

          {!isLoading && !error && users?.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Link href={`/${locale}/community/user/${u.id}`} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
                  {u.avatar_url ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.name ? u.name.charAt(0).toUpperCase() : '?')}
                </div>
                <span style={{ fontWeight: 600 }}>{u.name}</span>
              </Link>
              <FollowButton targetId={u.id} targetType="USER" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
