import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '../context/QueryProvider';
import SocketProvider from '../context/SocketContext';
import ThemeProvider from '../components/shared/ThemeProvider';
import SmoothScrollProvider from '../components/shared/SmoothScrollProvider';
import PageTransitionProvider from '../components/shared/PageTransitionProvider';

export const metadata: Metadata = {
  title: 'ATHLIX | Combat Sports Schedules & Brackets',
  description: 'Schedule private training with verified coaches, manage academy calendars, and generate live brackets for BJJ, MMA, and wrestling.',
  keywords: 'martial arts scheduling, combat sports brackets, bjj calendar, mma matchmaking, wrestling bracket maker, athlete belt progress tracker',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://athlix.com',
    title: 'ATHLIX | Combat Sports Schedules & Brackets',
    description: 'Direct calendar bookings, live interactive brackets, and progression tracking for combat sports academies.',
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
