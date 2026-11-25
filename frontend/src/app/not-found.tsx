'use client';

import Error from 'next/error';
import { Bricolage_Grotesque, Inter } from 'next/font/google';

const display = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  axes: ['opsz', 'wdth'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export default function NotFound() {
  return (
    <html lang="en" className={`${display.variable} ${inter.variable}`}>
      <body className={`${inter.className} bg-gray-25 text-gray-900 antialiased`}>
        <Error statusCode={404} />
      </body>
    </html>
  );
}
