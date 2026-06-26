import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import QueryProvider from '../context/QueryProvider';
import SocketProvider from '../context/SocketContext';
import ThemeProvider from '../components/shared/ThemeProvider';
import SmoothScrollProvider from '../components/shared/SmoothScrollProvider';
import PageTransitionProvider from '../components/shared/PageTransitionProvider';
import { cn } from '../lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Athlix | Premium Combat Sports Platform',
  description: 'World-class scheduling, tracking, and analytics for elite combat sports athletes and academies.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://athlix-client.vercel.app',
    title: 'Athlix | Premium Combat Sports Platform',
    description: 'World-class scheduling, tracking, and analytics for elite combat sports athletes and academies.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(inter.variable, jetbrainsMono.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-text-primary antialiased selection:bg-accent selection:text-black">
        <QueryProvider>
          <SocketProvider>
            <ThemeProvider>
              <SmoothScrollProvider>
                <PageTransitionProvider>
                  {children}
                </PageTransitionProvider>
              </SmoothScrollProvider>
            </ThemeProvider>
          </SocketProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
