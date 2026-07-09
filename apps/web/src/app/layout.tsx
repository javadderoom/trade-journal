import { Metadata } from "next";
import "./globals.scss";
import "./landing.scss";
import "./contact/contact.scss";
import AppLayout from "../components/layout/AppLayout";

export const metadata: Metadata = {
  title: "تریدکاو | ژورنال معاملاتی هوشمند",
  description: "تریدکاو اولین ژورنال معاملاتی هوشمند ایرانی؛ ثبت خودکار معاملات متاتریدر ۴ و ۵، تحلیل دقیق عملکرد، هیت‌مپ روزانه، مدیریت ریسک و روانشناسی معاملات.",
  keywords: [
    "ژورنال معاملاتی",
    "دفترچه معاملاتی",
    "ثبت معاملات",
    "متاتریدر",
    "تحلیل معاملات",
    "روانشناسی معاملات",
    "مدیریت ریسک",
    "فارکس",
    "بورس",
    "کریپتو"
  ],
  metadataBase: new URL("https://tradekav.ir"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "تریدکاو | ژورنال معاملاتی هوشمند",
    description: "ثبت خودکار و تحلیل معاملات متاتریدر ۴ و ۵، بهبود مستمر عملکرد معاملاتی با ژورنال هوشمند تریدکاو.",
    url: "https://tradekav.ir",
    siteName: "تریدکاو",
    locale: "fa_IR",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "لوگوی تریدکاو",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "تریدکاو | ژورنال معاملاتی هوشمند",
    description: "ثبت خودکار و تحلیل معاملات متاتریدر ۴ و ۵، بهبود مستمر عملکرد معاملاتی با ژورنال هوشمند تریدکاو.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "B2DBktEUzJzG5nYciLfIYUeDIQk05tzcpFtUWUyiKKw",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "تریدکاو",
    "alternateName": "TradeKav",
    "url": "https://tradekav.ir",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All",
    "description": "تریدکاو اولین ژورنال معاملاتی هوشمند ایرانی؛ ثبت خودکار معاملات متاتریدر ۴ و ۵، تحلیل دقیق عملکرد، هیت‌مپ روزانه، مدیریت ریسک و روانشناسی معاملات.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "IRR",
    },
  };

  return (
    <html suppressHydrationWarning>
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
      <body suppressHydrationWarning>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
