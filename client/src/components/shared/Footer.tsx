'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';
import { AnimatedText } from './AnimatedText';
import { MagneticButton } from './MagneticButton';

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

const colFade = {
  hidden: { opacity: 0, filter: 'blur(10px)', y: 20 },
  visible: { opacity: 1, filter: 'blur(0px)', y: 0 },
};

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-background pt-24 pb-12 overflow-hidden border-t border-border">
      {/* Subtle Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
        
        {/* Top CTA Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-border pb-16 mb-16">
          <div className="max-w-xl">
            <AnimatedText 
              text="Ready to elevate your game?" 
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4"
              delay={0.1}
            />
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-text-secondary text-lg"
            >
              Explore the development build and discuss a focused karate-club pilot.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <Link href="/signup">
              <MagneticButton size="lg" variant="premium">
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </MagneticButton>
            </Link>
          </motion.div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
          {/* Brand Column */}
          <motion.div
            variants={colFade}
            initial="hidden"
            whileInView="visible"
            transition={{ delay: 0.1, duration: 0.5 }}
            viewport={{ once: true }}
            className="col-span-2 lg:col-span-2 flex flex-col gap-6"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden">
                <Image src="/logo.png" alt="Athlix" width={32} height={32} className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight">Athlix</span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              A development project for combat-sports clubs, local events, and experimental kata feedback.
            </p>
            <Link href="/contact" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent"><Mail className="h-4 w-4" />Contact the project</Link>
          </motion.div>

          {/* Nav Columns */}
          {Object.entries(footerLinks).map(([col, links], i) => (
            <motion.div
              key={col}
              variants={colFade}
              initial="hidden"
              whileInView="visible"
              transition={{ delay: 0.2 + (i * 0.1), duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h4 className="text-sm font-semibold text-text-primary mb-6">{col}</h4>
              <ul className="flex flex-col gap-4">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary hover:text-accent transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 border-t border-border text-sm text-text-tertiary"
        >
          <p>© {new Date().getFullYear()} ATHLIX project.</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-default">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Development build · Service status unverified</span>
            </div>
          </div>
        </motion.div>

      </div>
    </footer>
  );
};

export default Footer;
