import "./globals.scss";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html dir="rtl" lang="fa" suppressHydrationWarning>
      <head>
        <title>معامله‌یار</title>
        {/* Vazirmatn — self-hosted, no CDN (Google Fonts is blocked in Iran) */}
        <link rel="stylesheet" href="/fonts/vazirmatn.css" />
        {/* Material Symbols — keep CDN for icons (not blocked) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
