'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '../../../store/useAppStore';
import './ea-setup.scss';

const CONTENT = {
  fa: {
    logo: "تریدکاو",
    backBtn: "ورود به پنل کاربری",
    langSwitch: "English",
    badge: "راهنمای رسمی تریدکاو",
    title: "راهنمای نصب و راه‌اندازی اکسپرت متاتریدر",
    subtitle: "با نصب اکسپرت اختصاصی تریدکاو روی متاتریدر، معاملات شما به‌صورت خودکار، لحظه‌ای و بدون نیاز به ثبت دستی در ژورنال معاملاتی شما ثبت و تحلیل می‌شوند.",
    downloadTitle: "اکسپرت همگام‌ساز خودکار",
    mt5Compatibility: "سازگار با متاتریدر ۵ (نسخه ویندوز و سرور مجازی)",
    mt5Btn: "دانلود اکسپرت متاتریدر ۵ (EX5)",
    mt4Compatibility: "سازگار با متاتریدر ۴ (نسخه ویندوز و سرور مجازی)",
    mt4Btn: "دانلود اکسپرت متاتریدر ۴ (EX4)",
    stepsTitle: "مراحل نصب و فعال‌سازی",
    step1Title: "۱. انتقال فایل اکسپرت به متاتریدر",
    step1Body: "نرم‌افزار متاتریدر را باز کنید. از منوی بالا به مسیر File > Open Data Folder بروید. در پنجره باز شده، وارد پوشه MQL4 (برای متاتریدر ۴) یا MQL5 (برای متاتریدر ۵) و سپس پوشه Experts شوید. فایل دانلود شده مربوطه را در این پوشه کپی کنید.",
    step2Title: "۲. تنظیم دسترسی ارسال اطلاعات (WebRequest)",
    step2Body: "برای اینکه اکسپرت بتواند اطلاعات را به ژورنال شما بفرستد، باید آدرس سایت را در متاتریدر مجاز کنید. از منوی بالا به مسیر Tools > Options بروید و تب Expert Advisors را باز کنید.",
    step2Important: "مرحله بسیار مهم: گزینه‌ی Allow WebRequest for listed URL را فعال کنید. سپس روی دکمه + کلیک کرده و آدرس زیر را دقیقاً وارد کنید و کلید Enter را بزنید:",
    copyTitle: "کپی آدرس",
    step3Title: "۳. فعال‌سازی روی چارت",
    step3Body: "در متاتریدر، در منوی سمت چپ (پنجره Navigator)، روی گزینه‌ی Expert Advisors راست‌کلیک کرده و Refresh را بزنید. اکنون اکسپرت TradeKav_EA را در لیست مشاهده می‌کنید. آن را بکشید (Drag) و روی یکی از چارت‌ها رها کنید (نماد یا تایم‌فریم چارت تأثیری در کارکرد اکسپرت ندارد).",
    step4Title: "۴. تنظیم پارامترهای ورودی (Inputs)",
    step4Body: "در پنجره تنظیمات اکسپرت، وارد تب Inputs شوید و مقادیر زیر را تنظیم کنید:",
    paramName: "نام پارامتر",
    paramValue: "مقدار تنظیمی",
    paramDesc: "توضیحات",
    apiUrlDesc: "آدرس سرور API تریدکاو",
    apiTokenDesc: "توکن اختصاصی حساب کاربری شما (دریافت از تنظیمات پنل کاربری)",
    accountIdDesc: "شناسه عددی حسابی که در بخش حساب‌های معاملاتی ایجاد کرده‌اید",
    syncIntervalDesc: "دوره زمانی همگام‌سازی خودکار بر حسب ثانیه",
    step4Info: "پس از تأیید، دکمه Algo Trading (یا Auto Trading در متاتریدر ۴) در منوی بالای متاتریدر حتماً باید فعال (سبز رنگ) باشد و نماد کلاه در گوشه بالا سمت راست چارت به رنگ آبی (یا صورت خندان در متاتریدر ۴) درآید.",
    faqTitle: "سؤالات متداول و عیب‌یابی",
    faq1Q: "آیا باید متاتریدر برای همگام‌سازی باز بماند؟",
    faq1A: "بله، اکسپرت برای ارسال خودکار معاملات نیاز به باز بودن متاتریدر دارد. در صورتی که سیستم شخصی خود را خاموش می‌کنید، پیشنهاد می‌شود متاتریدر را روی یک سرور مجازی (VPS) اجرا کنید تا همگام‌سازی ۲۴ ساعته و بدون وقفه انجام شود.",
    faq2Q: "چرا معاملات من همگام‌سازی نمی‌شوند؟",
    faq2A: "۱. مطمئن شوید دکمه Algo Trading (یا Auto Trading) در بالای متاتریدر فعال و سبز است.\n۲. تب Journal و Experts را در پایین صفحه متاتریدر (بخش Toolbox یا Terminal) چک کنید. اگر خطایی مانند WebRequest failed وجود دارد، آدرس را در تنظیمات WebRequest متاتریدر اشتباه وارد کرده‌اید یا اینترنت سرور قطع است.",
    footer: "تریدکاو. تمامی حقوق محفوظ است.",
    tableRows: [
      { name: "InpApiUrl", value: "https://api.tradekav.ir", desc: "آدرس سرور API تریدکاو" },
      { name: "InpApiToken", value: "توکن شما", desc: "توکن اختصاصی حساب کاربری شما (دریافت از تنظیمات پنل کاربری)" },
      { name: "InpAccountId", value: "شناسه حساب", desc: "شناسه عددی حسابی که در بخش حساب‌های معاملاتی ایجاد کرده‌اید" },
      { name: "InpSyncInterval", value: "60", desc: "دوره زمانی همگام‌سازی خودکار بر حسب ثانیه" }
    ]
  },
  en: {
    logo: "TradeKav",
    backBtn: "Dashboard",
    langSwitch: "فارسی",
    badge: "Official TradeKav Guide",
    title: "MetaTrader Expert Advisor Setup Guide",
    subtitle: "By installing the official TradeKav EA on your MetaTrader 4 or 5 terminal, your trades will sync automatically and in real-time, eliminating manual entry errors.",
    downloadTitle: "Auto-Sync Expert Advisor",
    mt5Compatibility: "Compatible with MetaTrader 5 (Windows & VPS)",
    mt5Btn: "Download MetaTrader 5 EA (EX5)",
    mt4Compatibility: "Compatible with MetaTrader 4 (Windows & VPS)",
    mt4Btn: "Download MetaTrader 4 EA (EX4)",
    stepsTitle: "Installation & Activation Steps",
    step1Title: "1. Transfer the EA File to MetaTrader",
    step1Body: "Open your MetaTrader terminal. Go to File > Open Data Folder in the top menu. In the newly opened folder, navigate to MQL4 (for MetaTrader 4) or MQL5 (for MetaTrader 5), and then open the Experts folder. Copy the downloaded EA file into this folder.",
    step2Title: "2. Allow URL Access (WebRequest)",
    step2Body: "To send trade data from the EA to your journal, you must allow WebRequests in the terminal settings. Go to Tools > Options in the top menu and select the Expert Advisors tab.",
    step2Important: "CRITICAL STEP: Check the box 'Allow WebRequest for listed URL'. Then double-click the '+' button, enter the following address exactly, and press Enter:",
    copyTitle: "Copy URL",
    step3Title: "3. Activate the EA on a Chart",
    step3Body: "In MetaTrader, right-click Expert Advisors in the Navigator window on the left and select Refresh. You should now see the TradeKav_EA in the list. Drag and drop it onto any open chart (the chart's symbol or timeframe does not affect the EA's sync behavior).",
    step4Title: "4. Configure Input Parameters",
    step4Body: "In the EA settings window, navigate to the Inputs tab and configure the following parameters:",
    paramName: "Parameter Name",
    paramValue: "Value",
    paramDesc: "Description",
    apiUrlDesc: "TradeKav API server URL",
    apiTokenDesc: "Your unique API authentication token (retrieve from settings in your dashboard)",
    accountIdDesc: "The numerical ID of the trading account you created in your dashboard",
    syncIntervalDesc: "Automatic synchronization interval in seconds",
    step4Info: "Once configured and saved, make sure the 'Algo Trading' (or 'Auto Trading' in MT4) button in the top menu bar is enabled (turned green) and the graduation cap icon in the top-right corner of the chart is blue (or showing a smiley face in MT4).",
    faqTitle: "Frequently Asked Questions & Troubleshooting",
    faq1Q: "Does MetaTrader need to remain open to sync trades?",
    faq1A: "Yes, the Expert Advisor requires MetaTrader to be running to sync trades. If you power off your computer, we highly recommend running MetaTrader on a Virtual Private Server (VPS) to ensure 24/7 uninterrupted background synchronization.",
    faq2Q: "Why are my trades not syncing?",
    faq2A: "1. Ensure 'Algo Trading' (or 'Auto Trading') is turned on and green.\n2. Check the 'Journal' and 'Experts' tabs in the Toolbox/Terminal window at the bottom of MetaTrader. If you see errors like 'WebRequest failed', verify that the WebRequest URL is correctly configured or check the server internet connection.",
    footer: "TradeKav. All rights reserved.",
    tableRows: [
      { name: "InpApiUrl", value: "https://api.tradekav.ir", desc: "TradeKav API server URL" },
      { name: "InpApiToken", value: "Your Token", desc: "Your unique API authentication token (retrieve from settings)" },
      { name: "InpAccountId", value: "Account ID", desc: "The numerical ID of the trading account you created" },
      { name: "InpSyncInterval", value: "60", desc: "Automatic sync interval in seconds" }
    ]
  }
};

export default function EaSetupHelpPage() {
  const { language, setLanguage, dir } = useTranslation();
  const content = CONTENT[language];

  return (
    <div className="ea-help-container" dir={dir}>
      <div className="ea-help-glow-1"></div>
      <div className="ea-help-glow-2"></div>
      
      <header className="ea-help-header">
        <Link href="/" className="ea-logo">
          {content.logo}
        </Link>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')} 
            className="ea-back-btn"
            style={{ cursor: 'pointer' }}
          >
            {content.langSwitch}
          </button>
          <Link href="/dashboard" className="ea-back-btn">
            <span>{content.backBtn}</span>
            <span className="material-symbols-outlined">arrow_left</span>
          </Link>
        </div>
      </header>

      <main className="ea-help-content">
        <div className="ea-help-hero">
          <span className="ea-badge">{content.badge}</span>
          <h1>{content.title}</h1>
          <p>{content.subtitle}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '24px' }}>
            <div className="ea-download-card" style={{ flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
              <div className="download-info">
                <h3>{content.downloadTitle} (MT5)</h3>
                <p>{content.mt5Compatibility}</p>
              </div>
              <a 
                href="/downloads/TradeKav_EA.ex5" 
                download="TradeKav_EA.ex5"
                className="download-action-btn"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined">download</span>
                <span>{content.mt5Btn}</span>
              </a>
            </div>

            <div className="ea-download-card" style={{ flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
              <div className="download-info">
                <h3>{content.downloadTitle} (MT4)</h3>
                <p>{content.mt4Compatibility}</p>
              </div>
              <a 
                href="/downloads/TradeKav_EA.ex4" 
                download="TradeKav_EA.ex4"
                className="download-action-btn"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined">download</span>
                <span>{content.mt4Btn}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="ea-steps-section">
          <h2>{content.stepsTitle}</h2>
          
          <div className="ea-step-card">
            <div className="step-num">۱</div>
            <div className="step-body">
              <h3>{content.step1Title}</h3>
              <p>{content.step1Body}</p>
            </div>
          </div>

          <div className="ea-step-card">
            <div className="step-num">۲</div>
            <div className="step-body">
              <h3>{content.step2Title}</h3>
              <p>{content.step2Body}</p>
              <div className="ea-alert ea-alert-warning">
                <span className="material-symbols-outlined">warning</span>
                <div>
                  <strong>{content.step2Important}</strong>
                  <div className="ea-code-block">
                    <code>https://api.tradekav.ir</code>
                    <button 
                      onClick={() => navigator.clipboard.writeText('https://api.tradekav.ir')}
                      className="copy-btn"
                      title={content.copyTitle}
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
              <h3>{content.step3Title}</h3>
              <p>{content.step3Body}</p>
            </div>
          </div>

          <div className="ea-step-card">
            <div className="step-num">۴</div>
            <div className="step-body">
              <h3>{content.step4Title}</h3>
              <p>{content.step4Body}</p>
              <table className="ea-table">
                <thead>
                  <tr>
                    <th>{content.paramName}</th>
                    <th>{content.paramValue}</th>
                    <th>{content.paramDesc}</th>
                  </tr>
                </thead>
                <tbody>
                  {content.tableRows.map((row, index) => (
                    <tr key={index}>
                      <td><code>{row.name}</code></td>
                      <td><code>{row.value}</code></td>
                      <td>{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="ea-alert ea-alert-info">
                <span className="material-symbols-outlined">info</span>
                <p>{content.step4Info}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="ea-faq-section">
          <h2>{content.faqTitle}</h2>
          <div className="faq-item">
            <h4>{content.faq1Q}</h4>
            <p>{content.faq1A}</p>
          </div>
          <div className="faq-item">
            <h4>{content.faq2Q}</h4>
            <p>{content.faq2A}</p>
          </div>
        </div>
      </main>

      <footer className="ea-help-footer">
        <p>© {new Date().getFullYear()} {content.footer}</p>
      </footer>
    </div>
  );
}
