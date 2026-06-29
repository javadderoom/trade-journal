'use client';

import React from 'react';
import Link from 'next/link';
import './ea-setup.scss';

export default function EaSetupHelpPage() {
  return (
    <div className="ea-help-container">
      <div className="ea-help-glow-1"></div>
      <div className="ea-help-glow-2"></div>
      
      <header className="ea-help-header">
        <Link href="/" className="ea-logo">
          تریدکاو
        </Link>
        <Link href="/dashboard" className="ea-back-btn">
          <span>ورود به پنل کاربری</span>
          <span className="material-symbols-outlined">arrow_left</span>
        </Link>
      </header>

      <main className="ea-help-content">
        <div className="ea-help-hero">
          <span className="ea-badge">راهنمای رسمی تریدکاو</span>
          <h1>راهنمای نصب و راه‌اندازی اکسپرت متاتریدر ۵</h1>
          <p>
            با نصب اکسپرت اختصاصی تریدکاو روی متاتریدر ۵، معاملات شما به‌صورت خودکار، لحظه‌ای و بدون نیاز به ثبت دستی در ژورنال معاملاتی شما ثبت و تحلیل می‌شوند.
          </p>
          
          <div className="ea-download-card">
            <div className="download-info">
              <h3>اکسپرت همگام‌ساز خودکار (نسخه ۱.۱۰)</h3>
              <p>سازگار با متاتریدر ۵ (نسخه ویندوز و سرور مجازی)</p>
            </div>
            <a 
              href="/downloads/TradeJournal_EA.ex5" 
              download="TradeJournal_EA.ex5"
              className="download-action-btn"
            >
              <span className="material-symbols-outlined">download</span>
              <span>دانلود فایل اکسپرت (EX5)</span>
            </a>
          </div>
        </div>

        <div className="ea-steps-section">
          <h2>مراحل نصب و فعال‌سازی</h2>
          
          <div className="ea-step-card">
            <div className="step-num">۱</div>
            <div className="step-body">
              <h3>انتقال فایل اکسپرت به متاتریدر</h3>
              <p>
                نرم‌افزار متاتریدر ۵ را باز کنید. از منوی بالا به مسیر <strong>File</strong> &gt; <strong>Open Data Folder</strong> بروید. 
                در پنجره باز شده، وارد پوشه <strong>MQL5</strong> و سپس پوشه <strong>Experts</strong> شوید. فایل دانلود شده (<code>TradeJournal_EA.ex5</code>) را در این پوشه کپی کنید.
              </p>
            </div>
          </div>

          <div className="ea-step-card">
            <div className="step-num">۲</div>
            <div className="step-body">
              <h3>تنظیم دسترسی ارسال اطلاعات (WebRequest)</h3>
              <p>
                برای اینکه اکسپرت بتواند اطلاعات را به ژورنال شما بفرستد، باید آدرس سایت را در متاتریدر مجاز کنید. 
                از منوی بالا به مسیر <strong>Tools</strong> &gt; <strong>Options</strong> بروید و تب <strong>Expert Advisors</strong> را باز کنید.
              </p>
              <div className="ea-alert ea-alert-warning">
                <span className="material-symbols-outlined">warning</span>
                <div>
                  <strong>مرحله بسیار مهم:</strong> گزینه‌ی <code>Allow WebRequest for listed URL</code> را فعال کنید. سپس روی دکمه <code>+</code> کلیک کرده و آدرس زیر را دقیقاً وارد کنید و کلید Enter را بزنید:
                  <div className="ea-code-block">
                    <code>https://api.tradekav.ir</code>
                    <button 
                      onClick={() => navigator.clipboard.writeText('https://api.tradekav.ir')}
                      className="copy-btn"
                      title="کپی آدرس"
                    >
                      <span className="material-symbols-outlined">content_copy</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="ea-step-card">
            <div className="step-num">۳</div>
            <div className="step-body">
              <h3>فعال‌سازی روی چارت</h3>
              <p>
                در متاتریدر، در منوی سمت چپ (پنجره Navigator)، روی گزینه‌ی <strong>Expert Advisors</strong> راست‌کلیک کرده و <strong>Refresh</strong> را بزنید. 
                اکنون اکسپرت <code>TradeJournal_EA</code> را در لیست مشاهده می‌کنید. آن را بکشید (Drag) و روی یکی از چارت‌ها رها کنید (نماد یا تایم‌فریم چارت تأثیری در کارکرد اکسپرت ندارد).
              </p>
            </div>
          </div>

          <div className="ea-step-card">
            <div className="step-num">۴</div>
            <div className="step-body">
              <h3>تنظیم پارامترهای ورودی (Inputs)</h3>
              <p>
                در پنجره تنظیمات اکسپرت، وارد تب <strong>Inputs</strong> شوید و مقادیر زیر را تنظیم کنید:
              </p>
              <table className="ea-table">
                <thead>
                  <tr>
                    <th>نام پارامتر</th>
                    <th>مقدار تنظیمی</th>
                    <th>توضیحات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>InpApiUrl</code></td>
                    <td><code>https://api.tradekav.ir</code></td>
                    <td>آدرس سرور API تریدکاو</td>
                  </tr>
                  <tr>
                    <td><code>InpApiToken</code></td>
                    <td>توکن شما</td>
                    <td>توکن اختصاصی حساب کاربری شما (دریافت از تنظیمات پنل کاربری)</td>
                  </tr>
                  <tr>
                    <td><code>InpAccountId</code></td>
                    <td>شناسه حساب</td>
                    <td>شناسه عددی حسابی که در بخش حساب‌های معاملاتی ایجاد کرده‌اید</td>
                  </tr>
                  <tr>
                    <td><code>InpSyncInterval</code></td>
                    <td><code>60</code></td>
                    <td>دوره زمانی همگام‌سازی خودکار بر حسب ثانیه</td>
                  </tr>
                </tbody>
              </table>
              <div className="ea-alert ea-alert-info">
                <span className="material-symbols-outlined">info</span>
                <p>
                  پس از تأیید، دکمه <strong>Algo Trading</strong> در منوی بالای متاتریدر حتماً باید فعال (سبز رنگ) باشد و نماد کلاه در گوشه بالا سمت راست چارت به رنگ آبی درآید.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="ea-faq-section">
          <h2>سؤالات متداول و عیب‌یابی</h2>
          <div className="faq-item">
            <h4>آیا باید متاتریدر برای همگام‌سازی باز بماند؟</h4>
            <p>بله، اکسپرت برای ارسال خودکار معاملات نیاز به باز بودن متاتریدر دارد. در صورتی که سیستم شخصی خود را خاموش می‌کنید، پیشنهاد می‌شود متاتریدر را روی یک سرور مجازی (VPS) اجرا کنید تا همگام‌سازی ۲۴ ساعته و بدون وقفه انجام شود.</p>
          </div>
          <div className="faq-item">
            <h4>چرا معاملات من همگام‌سازی نمی‌شوند؟</h4>
            <p>۱. مطمئن شوید دکمه <strong>Algo Trading</strong> در بالای متاتریدر فعال و سبز است.<br />
            ۲. تب <strong>Journal</strong> و <strong>Experts</strong> را در پایین صفحه متاتریدر (بخش Toolbox) چک کنید. اگر خطایی مانند <code>WebRequest failed</code> وجود دارد، آدرس <code>https://api.tradekav.ir</code> را در تنظیمات WebRequest متاتریدر اشتباه وارد کرده‌اید یا اینترنت سرور قطع است.</p>
          </div>
        </div>
      </main>

      <footer className="ea-help-footer">
        <p>© {new Date().getFullYear()} تریدکاو. تمامی حقوق محفوظ است.</p>
      </footer>
    </div>
  );
}
