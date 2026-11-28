import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import QueryProvider from '../context/QueryProvider';
import AuthSessionProvider from '../context/AuthSessionProvider';
import SocketProvider from '../context/SocketContext';
import ThemeProvider from '../components/shared/ThemeProvider';
import PageTransitionProvider from '../components/shared/PageTransitionProvider';
import { ToastContainer } from '../components/ui/Toast';
import { cn } from '../lib/utils';

const bodyFont = localFont({
  src: '../assets/fonts/dm-sans-latin-variable.woff2',
  weight: '400 600',
  style: 'normal',
  variable: '--font-athlix-sans',
  display: 'swap',
});

const jetbrainsMono = localFont({
  src: '../assets/fonts/jetbrains-mono-latin-variable.woff2',
  weight: '400 600',
  style: 'normal',
  variable: '--font-athlix-mono',
  display: 'swap',
});
const displayFont = localFont({
  src: '../assets/fonts/plus-jakarta-sans-latin-variable.woff2',
  weight: '600 800',
  style: 'normal',
  variable: '--font-athlix-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ATHLIX | Combat Sports Development Pilot',
  description: 'A development project for combat-sports clubs, local tournaments, and experimental 2D kata feedback. Review product status and pilot limits.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://athlix-client.vercel.app',
    title: 'ATHLIX | Combat Sports Development Pilot',
    description: 'A development project for combat-sports clubs, local tournaments, and experimental 2D kata feedback. Review product status and pilot limits.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn('dark', bodyFont.variable, jetbrainsMono.variable, displayFont.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-text-primary antialiased selection:bg-accent selection:text-black" suppressHydrationWarning>
        <QueryProvider>
          <AuthSessionProvider>
            <SocketProvider>
              <ThemeProvider>
                <PageTransitionProvider>
                  {children}
                </PageTransitionProvider>
                <ToastContainer />
              </ThemeProvider>
            </SocketProvider>
          </AuthSessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
