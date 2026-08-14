'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/auth';
import AdminSidebar from '@/components/admin2/AdminSidebar';
import './admin2.scss';

export default function Admin2Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [user, mounted, router]);

  if (!mounted) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <>
      <AdminSidebar />
      <div className="main-content-wrapper">
        <div className="admin-container">
          <div className="admin-header">
            <div>
              <h1>مدیریت سیستم (نسخه جدید)</h1>
              <p className="admin-sub">داشبورد ماژولار و توسعه‌یافته</p>
            </div>
          </div>
          
          <div className="admin-content-area">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
