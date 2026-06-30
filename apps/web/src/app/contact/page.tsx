'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { toPersianDigits } from '../../utils/farsi';
import './contact.scss';

interface ContactInfo {
  email?: string;
  mobile?: string;
  landline?: string;
  address?: string;
}

export default function ContactPage() {
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await api.get('/api/settings/contact');
        setContact(res.data);
      } catch (err) {
        console.error('Error fetching contact info:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, []);

  const hasAnyContact =
    contact && (contact.email || contact.mobile || contact.landline || contact.address);

  return (
    <div className="contact-page-container" dir="rtl">
      {/* Background glow effects */}
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      <header className="contact-header">
        <Link href="/" className="back-link">
          <span className="material-symbols-outlined">arrow_forward</span>
          <span>بازگشت به خانه</span>
        </Link>
        <h1>ارتباط با ما</h1>
        <p>در صورت داشتن هرگونه سوال، پیشنهاد یا نیاز به پشتیبانی با ما در ارتباط باشید.</p>
      </header>

      <main className="contact-main">
        {loading && (
          <div className="status-container">
            <div className="spinner"></div>
            <p>در حال بارگذاری اطلاعات تماس...</p>
          </div>
        )}

        {!loading && error && (
          <div className="status-container error-box">
            <span className="material-symbols-outlined error-icon">error</span>
            <p>خطا در دریافت اطلاعات تماس. لطفاً مجدداً تلاش فرمایید.</p>
          </div>
        )}

        {!loading && !error && !hasAnyContact && (
          <div className="status-container empty-box">
            <span className="material-symbols-outlined empty-icon">contact_support</span>
            <p>هیچ اطلاعات تماسی در حال حاضر ثبت نشده است.</p>
          </div>
        )}

        {!loading && !error && contact && (
          <div className="contact-cards-grid">
            {contact.mobile && (
              <div className="contact-card card-mobile">
                <div className="card-icon-wrapper">
                  <span className="material-symbols-outlined">smartphone</span>
                </div>
                <h3>تلفن همراه</h3>
                <a href={`tel:${contact.mobile}`} className="card-link font-ltr">
                  {toPersianDigits(contact.mobile)}
                </a>
                <p className="card-hint font-rtl">پشتیبانی در پیامرسان بله و تلگرام</p>
              </div>
            )}

            {contact.landline && (
              <div className="contact-card card-landline">
                <div className="card-icon-wrapper">
                  <span className="material-symbols-outlined">call</span>
                </div>
                <h3>تلفن ثابت</h3>
                <a href={`tel:${contact.landline}`} className="card-link font-ltr">
                  {toPersianDigits(contact.landline)}
                </a>
                <p className="card-hint font-rtl">شنبه تا چهارشنبه از ساعت ۹ الی ۱۷</p>
              </div>
            )}

            {contact.email && (
              <div className="contact-card card-email">
                <div className="card-icon-wrapper">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <h3>پست الکترونیک</h3>
                <a href={`mailto:${contact.email}`} className="card-link">
                  {contact.email}
                </a>
                <p className="card-hint font-rtl">پاسخگویی حداکثر در ۲۴ ساعت کاری</p>
              </div>
            )}

            {contact.address && (
              <div className="contact-card card-address">
                <div className="card-icon-wrapper">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <h3>آدرس حضوری</h3>
                <p className="card-text">{toPersianDigits(contact.address)}</p>
                <p className="card-hint font-rtl">مراجعه حضوری فقط با هماهنگی قبلی</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="contact-footer">
        <p>© {toPersianDigits(new Date().getFullYear())} معامله‌یار. تمامی حقوق محفوظ است.</p>
      </footer>
    </div>
  );
}
