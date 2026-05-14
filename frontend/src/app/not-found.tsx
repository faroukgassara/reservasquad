'use client';

import Error from 'next/error';
import { Lato } from 'next/font/google';

const lato = Lato({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export default function NotFound() {
  return (
    <html lang="en">
      <body className={`${lato.variable} font-sans antialiased`}>
        <Error statusCode={404} />
      </body>
    </html>
  );
}
