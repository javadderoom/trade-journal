import { Metadata } from "next";
import "./globals.scss";
import "./landing.scss";
import "./contact/contact.scss";
import AppLayout from "../components/layout/AppLayout";

export const metadata: Metadata = {
  title: "تریدکاو (TradeKav) | ژورنال معاملاتی هوشمند - Smart Trading Journal",
  description: "تریدکاو (TradeKav) اولین ژورنال معاملاتی هوشمند؛ ثبت خودکار معاملات متاتریدر ۴ و ۵، تحلیل دقیق عملکرد، هیت‌مپ روزانه، مدیریت ریسک و روانشناسی ترید.",
  keywords: [
    "تریدکاو",
    "ترید کاو",
    "TradeKav",
    "Trade Kav",
    "tradekav",
    "tradekav.ir",
    "ژورنال معاملاتی",
    "ژورنال معاملاتی فارسی",
    "ژورنال معاملاتی تریدکاو",
    "دفترچه معاملاتی",
    "ثبت خودکار معاملات",
    "متاتریدر",
    "تحلیل معاملات",
    "روانشناسی معاملات",
    "مدیریت ریسک",
    "فارکس",
    "بورس",
    "کریپتو",
    "trade Forex",
    "Trade Crypto",
    "Trade Analysis",
    "Trading Journal",
    "Smart Trading Journal"
  ],
  metadataBase: new URL("https://tradekav.ir"),
  alternates: {
    canonical: "/",
    languages: {
      "fa": "/",
      "en": "/en",
      "fa-IR": "/",
    },
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "تریدکاو (TradeKav) | ژورنال معاملاتی هوشمند",
    description: "ثبت خودکار و تحلیل معاملات متاتریدر ۴ و ۵ با ژورنال هوشمند تریدکاو (TradeKav). بهینه‌سازی استراتژی، مدیریت ریسک و روانشناسی معامله‌گری.",
    url: "https://tradekav.ir",
    siteName: "تریدکاو | TradeKav",
    locale: "fa_IR",
    alternateLocale: ["en_US"],
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "لوگوی تریدکاو - TradeKav Logo",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "تریدکاو (TradeKav) | ژورنال معاملاتی هوشمند",
    description: "ثبت خودکار و تحلیل معاملات متاتریدر ۴ و ۵ با ژورنال هوشمند تریدکاو (TradeKav).",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "B2DBktEUzJzG5nYciLfIYUeDIQk05tzcpFtUWUyiKKw",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "تریدکاو",
      "alternateName": ["TradeKav", "Trade Kav", "ترید کاو", "TradeKav Journal"],
      "url": "https://tradekav.ir",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "description": "تریدکاو (TradeKav) اولین ژورنال معاملاتی هوشمند ایرانی؛ ثبت خودکار معاملات متاتریدر ۴ و ۵، تحلیل دقیق عملکرد، هیت‌مپ روزانه، مدیریت ریسک و روانشناسی معاملات.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "IRR",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "تریدکاو | TradeKav",
      "alternateName": ["TradeKav", "Trade Kav", "ترید کاو", "تریدکاو"],
      "url": "https://tradekav.ir",
      "inLanguage": ["fa-IR", "en-US"],
    }
  ];

  return (
    <html suppressHydrationWarning lang="fa" dir="rtl">
      <head>
        {/* Vazirmatn — self-hosted, no CDN (Google Fonts is blocked in Iran) */}
        <link rel="stylesheet" href="/fonts/vazirmatn.css" />
        {/* Material Symbols — keep CDN for icons (not blocked) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        {/* Kavenegar Webpush SDK */}
        {process.env.NODE_ENV !== 'development' && (
          <script src="https://cdn.kavenegar.com/sdk/page.js?appId=245422b2-eab2-4608-93ab-80526bd21f85" defer charSet="utf-8"></script>
        )}
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
