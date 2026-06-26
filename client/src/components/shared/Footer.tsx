'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

const footerLinks = {
  Platform: [
    { label: 'Discover Coaches', href: '/coaches' },
    { label: 'Academy Directory', href: '/academies' },
    { label: 'Tournament Portal', href: '/tournaments' },
    { label: 'Social Activity Feed', href: '/feed' },
  ],
  Product: [
    { label: 'About story', href: '/about' },
    { label: 'Core features', href: '/features' },
    { label: 'Subscriptions', href: '/pricing' },
    { label: 'Articles', href: '/blog' },
  ],
};

const colFade = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-background pt-16 pb-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Grayscale Partner Strip */}
        <div className="border-b border-border/60 pb-10 mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-text-tertiary uppercase font-mono">
                AFFILIATED PLATFORMS & CLUBS
              </span>
            </div>
            <div className="flex flex-wrap gap-6 items-center">
              {['GRACIE LEAGUE', 'WRESTLING FED', 'COMBAT ALLIANCE', 'STRIPE CHAMPIONSHIPS'].map((partner) => (
                <span
                  key={partner}
                  className="text-xs font-display font-black tracking-widest text-text-tertiary hover:text-text-secondary transition-colors duration-200 cursor-default uppercase"
                >
                  {partner}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12 items-start">
          {/* Brand column */}
          <motion.div
            variants={colFade}
            initial="hidden"
            whileInView="visible"
            transition={{ delay: 0, duration: 0.35, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="md:col-span-1 flex flex-col gap-4"
          >
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" className="fill-none stroke-current stroke-2" />
                <polygon points="12 6 18 10 18 14 12 18 6 14 6 10" />
              </svg>
              <span className="text-md font-display font-black tracking-widest text-text-primary uppercase">
                ATHLIX<span className="text-primary">.</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-text-secondary max-w-xs font-sans">
              Schedule sessions with verified coaches, run structured tournaments, and log rank milestones in one shared profile.
            </p>
            <div className="flex gap-3 text-text-secondary mt-2">
              <a href="#" aria-label="Instagram" className="hover:text-primary transition-colors duration-150">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" aria-label="Twitter" className="hover:text-primary transition-colors duration-150">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a href="mailto:support@athlix.com" aria-label="Email" className="hover:text-primary transition-colors duration-150">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </motion.div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([col, links], i) => (
            <motion.div
              key={col}
              variants={colFade}
              initial="hidden"
              whileInView="visible"
              transition={{ delay: (i + 1) * 0.06, duration: 0.35, ease: 'easeOut' }}
              viewport={{ once: true }}
            >
              <h4 className="text-[10px] font-bold text-text-primary uppercase tracking-widest font-mono mb-4">
                {col}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs transition-colors duration-150 text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:text-text-primary font-mono font-medium tracking-wide uppercase"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Newsletter column */}
          <motion.div
            variants={colFade}
            initial="hidden"
            whileInView="visible"
            transition={{ delay: 0.18, duration: 0.35, ease: 'easeOut' }}
            viewport={{ once: true }}
          >
            <h4 className="text-[10px] font-bold text-text-primary uppercase tracking-widest font-mono mb-4">
              Weekly updates
            </h4>
            <p className="text-xs mb-4 leading-relaxed text-text-secondary">
              Get tournament brackets and coach calendar openings straight to your inbox.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 min-w-0 bg-surface border border-border rounded px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
                required
              />
              <button
                type="submit"
                className="bg-primary hover:bg-opacity-95 text-white px-4 py-2 rounded-sm text-xs font-bold font-mono uppercase transition-all cursor-pointer"
              >
                Join
              </button>
            </form>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-[10px] text-text-tertiary font-mono">
              © {new Date().getFullYear()} ATHLIX. ALL RIGHTS RESERVED.
            </p>
            <div className="flex gap-4 text-[10px] text-text-tertiary font-mono">
              <Link href="#" className="hover:text-text-primary transition-colors">PRIVACY POLICY</Link>
              <Link href="#" className="hover:text-text-primary transition-colors">TERMS OF SERVICE</Link>
            </div>
          </div>

          {/* Payment Badges (Visa, Mastercard, Stripe, Apple Pay) */}
          <div className="flex items-center gap-2 text-text-tertiary">
            <svg className="h-5 w-8" viewBox="0 0 36 24" fill="currentColor">
              <rect width="36" height="24" rx="2" fill="currentColor" opacity="0.05" />
              <path d="M12 16h2l1.2-5h-2L12 16z M24 11c-0.6-0.3-1.3-0.5-2-0.5-2.2 0-3.8 1.2-3.8 2.9 0 1.2 1.1 1.9 2 2.3 0.9 0.4 1.2 0.7 1.2 1.1 0 0.6-0.7 0.9-1.3 0.9-1.7 0-2.4-0.3-3.2-0.7l-0.4 2.2c0.6 0.3 1.8 0.5 3 0.5 2.3 0 3.8-1.1 3.8-2.9 0-1-0.6-1.7-1.9-2.3-0.8-0.4-1.3-0.7-1.3-1.1 0-0.4 0.4-0.8 1.3-0.8 0.8 0 1.4 0.2 1.9 0.4l0.4-2.1z" />
            </svg>
            <svg className="h-5 w-8" viewBox="0 0 36 24" fill="currentColor">
              <rect width="36" height="24" rx="2" fill="currentColor" opacity="0.05" />
              <circle cx="15" cy="12" r="6" fill="currentColor" opacity="0.3" />
              <circle cx="21" cy="12" r="6" fill="currentColor" opacity="0.3" />
            </svg>
            <span className="text-[9px] font-bold font-mono tracking-widest bg-border px-1.5 py-0.5 rounded opacity-40 uppercase">
              STRIPE SECURED
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
