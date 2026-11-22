import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const footerLinks = {
  Platform: [
    { label: 'Discover Coaches', href: '/coaches' },
    { label: 'Academy Directory', href: '/academies' },
    { label: 'Tournament Portal', href: '/tournaments' },
    { label: 'Activity Feed', href: '/feed' },
  ],
  Product: [
    { label: 'About', href: '/about' },
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Blog', href: '/blog' },
  ],
  Legal: [
    { label: 'Privacy status', href: '/privacy' },
    { label: 'Terms status', href: '/terms' },
    { label: 'Contact the project', href: '/contact' },
  ],
};

export const Footer = () => (
  <footer className="border-t border-border bg-background">
    <div className="mx-auto w-full max-w-7xl px-4 pb-7 pt-14 sm:px-6 lg:px-8">
      <div className="grid gap-x-10 gap-y-10 pb-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="font-display text-xl font-extrabold tracking-[0.06em] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">ATHLIX<span aria-hidden="true" className="ml-1 text-text-tertiary">/</span></Link>
          <p className="mt-5 max-w-[28ch] text-sm leading-relaxed text-text-secondary">A focused development project for combat-sports clubs, local events and experimental 2D kata feedback.</p>
          <Link href="/contact" className="mt-5 inline-flex items-center gap-1 text-sm text-text-secondary underline decoration-border-strong underline-offset-4 transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">Contact the project<ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
        </div>
        {Object.entries(footerLinks).map(([group, links]) => <nav key={group} aria-label={`${group} footer links`}>
          <h2 className="mb-5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-text-primary">{group}</h2>
          <ul className="space-y-3">{links.map(link => <li key={link.href}><Link href={link.href} className="text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">{link.label}</Link></li>)}</ul>
        </nav>)}
      </div>
      <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">© {new Date().getFullYear()} ATHLIX project</p>
        <p className="flex items-center gap-2 font-mono text-[10px] leading-relaxed text-text-secondary"><span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]" />Development build · Checkout disabled · Service status unverified</p>
      </div>
    </div>
  </footer>
);

export default Footer;
