
import { BookOpen, Github, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-secondary/50 backdrop-blur-sm border-t border-border py-8 px-6 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <Link to="/" className="flex items-center space-x-2 text-primary font-display font-bold text-xl mb-4">
            <BookOpen className="h-6 w-6" />
            <span>AllMyBooks</span>
          </Link>
          <p className="text-muted-foreground text-sm">
            A modern library management system that helps you catalog and organize your books with ease.
          </p>
          <div className="flex space-x-4 mt-4">
            <a href="#" className="text-muted-foreground hover:text-primary" aria-label="Twitter">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary" aria-label="GitHub">
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
        
        <div>
          <h3 className="font-display font-medium text-lg mb-4">Navigation</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="text-muted-foreground hover:text-primary text-sm">
                Home
              </Link>
            </li>
            <li>
              <Link to="/library" className="text-muted-foreground hover:text-primary text-sm">
                My Library
              </Link>
            </li>
            <li>
              <Link to="/discover" className="text-muted-foreground hover:text-primary text-sm">
                Discover
              </Link>
            </li>
            <li>
              <Link to="/scan" className="text-muted-foreground hover:text-primary text-sm">
                Scan Books
              </Link>
            </li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-display font-medium text-lg mb-4">Support</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/about" className="text-muted-foreground hover:text-primary text-sm">
                About
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="text-muted-foreground hover:text-primary text-sm">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="text-muted-foreground hover:text-primary text-sm">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-muted-foreground hover:text-primary text-sm">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-border/50 text-center">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} AllMyBooks. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
