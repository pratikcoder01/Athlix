import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk, Sora } from 'next/font/google';
import './globals.css';
import QueryProvider from '../context/QueryProvider';
import AuthSessionProvider from '../context/AuthSessionProvider';
import SocketProvider from '../context/SocketContext';
import ThemeProvider from '../components/shared/ThemeProvider';
import SmoothScrollProvider from '../components/shared/SmoothScrollProvider';
import PageTransitionProvider from '../components/shared/PageTransitionProvider';
import { ToastContainer } from '../components/ui/Toast';
import { cn } from '../lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-athlix-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-athlix-mono',
  display: 'swap',
});
const displayFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-athlix-display', display: 'swap' });
const numberFont = Sora({ subsets: ['latin'], variable: '--font-athlix-numbers', display: 'swap' });

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
    <html lang="en" className={cn('dark', inter.variable, jetbrainsMono.variable, displayFont.variable, numberFont.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-text-primary antialiased selection:bg-accent selection:text-black" suppressHydrationWarning>
        <QueryProvider>
          <AuthSessionProvider>
          <SocketProvider>
            <ThemeProvider>
              <SmoothScrollProvider>
                <PageTransitionProvider>
                  {children}
                </PageTransitionProvider>
                <ToastContainer />
              </SmoothScrollProvider>
            </ThemeProvider>
          </SocketProvider>
          </AuthSessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
