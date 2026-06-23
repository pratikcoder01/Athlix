'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-background pt-14 pb-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12 items-start">
          {/* Brand column */}
          <motion.div
            variants={colFade}
            initial="hidden"
            whileInView="visible"
            transition={{ delay: 0, duration: 0.4, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="md:col-span-1"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-bold tracking-tight text-text-primary">
                Athlix
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs text-text-secondary">
              Management platform for combat sports academies, coaches, and athletes to organize schedules and tournaments.
            </p>
          </motion.div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([col, links], i) => (
            <motion.div
              key={col}
              variants={colFade}
              initial="hidden"
              whileInView="visible"
              transition={{ delay: (i + 1) * 0.08, duration: 0.4, ease: 'easeOut' }}
              viewport={{ once: true }}
            >
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">
                {col}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors duration-150 text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:text-text-primary"
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
            transition={{ delay: 0.24, duration: 0.4, ease: 'easeOut' }}
            viewport={{ once: true }}
          >
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">
              Stay updated
            </h4>
            <p className="text-sm mb-4 leading-relaxed text-text-secondary">
              Subscribe to receive updates on brackets and training schedules.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 min-w-0 bg-secondary border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
              />
              <button
                type="submit"
                className="bg-primary hover:brightness-105 text-white px-4 py-2 rounded text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
              >
                Subscribe
              </button>
            </form>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-text-tertiary">
            © {new Date().getFullYear()} Athlix. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-text-tertiary">
            <Link href="#" className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:text-text-primary">Privacy policy</Link>
            <Link href="#" className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:text-text-primary">Terms of service</Link>
            <Link href="#" className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:text-text-primary">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
