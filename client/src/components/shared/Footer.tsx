import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-background py-12 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <span className="text-2xl font-extrabold tracking-wider font-display text-primary uppercase">
              ATHLIX
            </span>
            <p className="mt-4 text-sm text-text-secondary leading-relaxed max-w-xs">
              Handcrafted next-gen sports technology platform designed to elevate combat athletes, coaching calendars, and digital tournament bracket registries.
            </p>
          </div>

          {/* Links: Platform */}
          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest font-display mb-4">Platform</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/discovery" className="text-sm text-text-secondary hover:text-primary transition-colors">Discover Coaches</Link>
              <Link href="/gyms" className="text-sm text-text-secondary hover:text-primary transition-colors">Academy Directory</Link>
              <Link href="/tournaments" className="text-sm text-text-secondary hover:text-primary transition-colors">Tournament Portal</Link>
              <Link href="/feed" className="text-sm text-text-secondary hover:text-primary transition-colors">Social Activity Feed</Link>
            </div>
          </div>

          {/* Links: Product */}
          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest font-display mb-4">Product</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/about" className="text-sm text-text-secondary hover:text-primary transition-colors">About Story</Link>
              <Link href="/features" className="text-sm text-text-secondary hover:text-primary transition-colors">Core Features</Link>
              <Link href="/pricing" className="text-sm text-text-secondary hover:text-primary transition-colors">Elite Subscriptions</Link>
              <Link href="/blog" className="text-sm text-text-secondary hover:text-primary transition-colors">Blog Articles</Link>
            </div>
          </div>

          {/* Contact / Newsletter */}
          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest font-display mb-4">Stay Tuned</h4>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">Subscribe to get tournament alerts and scheduling system updates.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email"
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                required
              />
              <button
                type="submit"
                className="bg-primary hover:bg-opacity-95 text-white px-4 py-2 rounded text-xs font-bold font-bebas tracking-wider"
              >
                JOIN
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-text-secondary">
            © {new Date().getFullYear()} ATHLIX. Built for combat sports athletes by martial artists. 🥋
          </p>
          <div className="flex gap-6 text-xs text-text-secondary">
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-primary transition-colors">Accessibility Standard</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
