'use client';

import React from 'react';
import Link from 'next/link';

export default function NamadPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0b0f19',
      color: '#f8fafc',
      fontFamily: 'Vazirmatn, sans-serif',
      padding: '20px',
      direction: 'rtl'
    }}>
      <div style={{
        padding: '32px 24px',
        borderRadius: '16px',
        backgroundColor: '#111827',
        border: '1px solid #1f2937',
        textAlign: 'center',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <h1 style={{
          fontSize: '1.4rem',
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#3ddc97'
        }}>
          نماد اعتماد الکترونیکی
        </h1>
        <p style={{
          fontSize: '0.88rem',
          color: '#94a3b8',
          lineHeight: '1.6',
          marginBottom: '24px'
        }}>
          جهت استعلام اصالت و جزئیات مجوز فعالیت تریدکاو، روی تصویر زیر کلیک کنید:
        </p>

        {/* E-namad logo iframe/link */}
        <div style={{
          display: 'inline-flex',
          padding: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <a
            referrerPolicy="origin"
            target="_blank"
            href="https://trustseal.enamad.ir/?id=6712312&Code=ijlypx97VzY8LxxCpiKO81gBE1Ju0VRE"
            rel="noopener noreferrer"
          >
            <img
              referrerPolicy="origin"
              src="https://trustseal.enamad.ir/logo.aspx?id=6712312&Code=ijlypx97VzY8LxxCpiKO81gBE1Ju0VRE"
              alt="نماد اعتماد الکترونیکی تریدکاو"
              style={{ cursor: 'pointer', width: '120px', height: '120px', objectFit: 'contain' }}
              {...{ code: "ijlypx97VzY8LxxCpiKO81gBE1Ju0VRE" } as any}
            />
          </a>
        </div>

        {/* Action Button */}
        <div>
          <Link href="/">
            <button style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#1f2937',
              color: '#f8fafc',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#374151'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
            >
              بازگشت به سایت
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
