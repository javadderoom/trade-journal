'use client';

import React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { FollowButton } from './FollowButton';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const fetcher = (url: string) => axios.get(`${API_URL}${url}`, { withCredentials: true }).then(res => res.data);

export function FollowingManager() {
  const { data, error, isLoading, mutate } = useSWR('/api/community/follow/list', fetcher);

  if (isLoading) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Loading following list...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--error)' }}>Failed to load following list.</div>;

  const { users, symbols, categories } = data;

  const sectionStyle = {
    background: 'var(--surface)',
    border: '1px solid rgba(var(--outline-variant-rgb), 0.4)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px'
  };

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid rgba(var(--outline-variant-rgb), 0.2)'
  };

  return (
    <div>
      <div style={sectionStyle}>
        <h2 style={{ marginBottom: '16px' }}>Users</h2>
        {users?.length === 0 ? <p style={{ color: 'var(--muted)' }}>You aren't following any users.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {users.map((f: any) => (
              <div key={f.following.id} style={itemStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
                    {f.following.avatar_url ? <img src={f.following.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : f.following.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600 }}>{f.following.name}</span>
                </div>
                <FollowButton targetId={f.following.id} targetType="USER" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <h2 style={{ marginBottom: '16px' }}>Symbols</h2>
        {symbols?.length === 0 ? <p style={{ color: 'var(--muted)' }}>You aren't following any symbols.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {symbols.map((f: any) => (
              <div key={f.symbol.id} style={itemStyle}>
                <span style={{ fontWeight: 600 }}>{f.symbol.symbol}</span>
                <FollowButton targetId={f.symbol.id} targetType="SYMBOL" />
              </div>
            ))}
          </div>
        )}
      </div>

      {categories && categories.length > 0 && (
        <div style={sectionStyle}>
          <h2 style={{ marginBottom: '16px' }}>Categories</h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {categories.map((f: any) => (
              <div key={f.category.id} style={itemStyle}>
                <span style={{ fontWeight: 600 }}>{f.category.nameEn}</span>
                {/* Add FollowButton for CATEGORY if implemented in future */}
                <button style={{ background: 'var(--surface-container-high)', border: 'none', padding: '6px 12px', borderRadius: '20px', cursor: 'not-allowed', color: 'var(--text)' }}>Following</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
