import "./globals.scss";
import AppLayout from "../components/layout/AppLayout";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html dir="rtl" lang="fa" suppressHydrationWarning>
      <head>
        <title>تریدکاو | ژورنال معاملاتی هوشمند</title>
        <link rel="icon" href="/logo.png" />
        {/* Vazirmatn — self-hosted, no CDN (Google Fonts is blocked in Iran) */}
        <link rel="stylesheet" href="/fonts/vazirmatn.css" />
        {/* Material Symbols — keep CDN for icons (not blocked) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
