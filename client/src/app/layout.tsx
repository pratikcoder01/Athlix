import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '../context/QueryProvider';
import SocketProvider from '../context/SocketContext';
import ThemeProvider from '../components/shared/ThemeProvider';
import SmoothScrollProvider from '../components/shared/SmoothScrollProvider';
import PageTransitionProvider from '../components/shared/PageTransitionProvider';

export const metadata: Metadata = {
  title: 'ATHLIX | Next-Gen Combat Sports Tech Platform',
  description: 'The ultimate sports-tech ecosystem for BJJ, MMA, Karate practitioners, coaches, academies, and tournament brackets.',
  keywords: 'martial arts, combat sports, bjj booking, mma tournaments, karate brackets, coach finder, athlete training progress',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://athlix.com',
    title: 'ATHLIX | Next-Gen Combat Sports Tech Platform',
    description: 'Unified network, real-time calendars, social feed and brackets for martial artists.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
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
