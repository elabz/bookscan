
import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MobileActionBar } from './MobileActionBar';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <MobileActionBar />
      <main className={`flex-grow pt-28 md:pt-24 pb-16 ${className}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
};
