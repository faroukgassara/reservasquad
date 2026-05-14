'use client';

import Error from 'next/error';
import { Bebas_Neue, Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});
const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export default function NotFound() {
  return (
    <html lang="en">
      <body className={`${inter.className} ${bebasNeue.className}`}>
        <Error statusCode={404} />
      </body>
    </html>
  );
}
