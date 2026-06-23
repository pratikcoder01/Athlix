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
    { label: 'About Story', href: '/about' },
    { label: 'Core Features', href: '/features' },
    { label: 'Elite Subscriptions', href: '/pricing' },
    { label: 'Blog Articles', href: '/blog' },
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
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/logo.png" alt="ATHLIX Logo" className="h-8 w-auto object-contain" />
              <span className="text-2xl font-extrabold tracking-wider font-display text-primary uppercase">
                ATHLIX
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(200, 210, 230, 0.7)' }}>
              Handcrafted next-gen sports technology platform designed to elevate combat athletes, coaching calendars, and digital tournament bracket registries.
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
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest font-display mb-5">
                {col}
              </h4>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors duration-150 hover:text-primary focus-visible:outline-none focus-visible:text-primary"
                      style={{ color: 'rgba(200, 210, 230, 0.65)' }}
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
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest font-display mb-5">
              Stay Tuned
            </h4>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: 'rgba(200, 210, 230, 0.65)' }}>
              Subscribe to get tournament alerts and scheduling system updates.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email"
                className="flex-1 min-w-0 bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
              />
              <button
                type="submit"
                className="bg-primary hover:brightness-110 text-white px-4 py-2 rounded text-xs font-bold font-bebas tracking-wider transition-all shadow-md shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                JOIN
              </button>
            </form>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs" style={{ color: 'rgba(200, 210, 230, 0.5)' }}>
            © {new Date().getFullYear()} ATHLIX. Built for combat sports athletes by martial artists. 🥋
          </p>
          <div className="flex gap-6 text-xs" style={{ color: 'rgba(200, 210, 230, 0.5)' }}>
            <Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary">Terms of Service</Link>
            <Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
