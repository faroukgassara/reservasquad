'use client';

import Error from 'next/error';
import { Inter, Poppins } from 'next/font/google';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
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
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body className={`${inter.className} bg-gray-25 text-gray-900 antialiased`}>
        <Error statusCode={404} />
      </body>
    </html>
  );
}
