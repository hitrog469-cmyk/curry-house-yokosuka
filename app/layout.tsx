import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionWrapper } from '@/components/session-wrapper';
import { CartProvider } from '@/contexts/cart-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'The Curry House Yokosuka',
  description: 'Authentic Indian Cuisine in Yokosuka, Japan',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <SessionWrapper>
          <CartProvider>
            {children}
          </CartProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
