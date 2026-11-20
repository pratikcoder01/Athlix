'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';

export default function WorkspaceNavigation() {
  const { user } = useAuthStore();
  const pathname = usePathname();
  if (!user) return null;
  const links = [
    ['/dashboard', 'Overview'], ['/profile', 'Profile'], ['/training', 'Training'],
    ['/bookings', 'Sessions'], ['/feed', 'Community'], ['/notifications', 'Notifications'],
    ...(user.role === 'coach' ? [['/clients', 'Clients'], ['/coach-settings', 'Availability']] : []),
    ...(['academy_owner', 'admin'].includes(user.role) ? [['/academies', 'Academies']] : []),
    ...(['tournament_organizer', 'admin'].includes(user.role) ? [['/tournaments', 'Tournaments']] : []),
    ...(user.role === 'admin' ? [['/moderation', 'Moderation']] : []),
    ['/settings', 'Settings'],
  ];
  return <nav aria-label="Your workspace" className="mb-8 flex flex-wrap gap-2">{links.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} className={`rounded-full border px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${pathname === href ? 'border-accent text-accent' : 'border-border text-text-secondary hover:text-text-primary'}`}>{label}</Link>)}</nav>;
}
