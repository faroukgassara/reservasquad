'use client';

import Error from 'next/error';
import { Playfair_Display, Poppins } from 'next/font/google';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

const playfair = Playfair_Display({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export default function NotFound() {
  return (
    <html lang="en" className={`${poppins.variable} ${playfair.variable}`}>
      <body className={`${poppins.className} bg-gray-25 text-gray-900 antialiased`}>
        <Error statusCode={404} />
      </body>
    </html>
  );
}
