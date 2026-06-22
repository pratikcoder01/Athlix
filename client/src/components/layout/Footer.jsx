import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t border-dojo-border bg-dojo-dark py-8 px-6 mt-12 text-center text-sm text-dojo-muted">
      <div className="mx-auto max-w-7xl">
        <p>© {new Date().getFullYear()} DojoPro. Built for martial artists by martial artists. 🥋</p>
        <p className="mt-2 text-xs opacity-75">Hackathon Release Version 1.0.0</p>
      </div>
    </footer>
  );
};

export default Footer;
