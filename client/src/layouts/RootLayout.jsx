import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const RootLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-dojo-dark text-dojo-text">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default RootLayout;
