import type { AppProps } from 'next/app';
import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider } from '@emotion/react';
import { createTheme } from './themes';
import '../styles/rtl.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <html dir="rtl" lang="fa">
      <head>
        <title>معامله‌یار</title>
        <link href="/fonts/Vazirmatn.woff2" rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <ChakraProvider>
          <ThemeProvider theme={createTheme()}>
            <Component {...pageProps} />
          </ThemeProvider>
        </ChakraProvider>
      </body>
    </html>
  );
}