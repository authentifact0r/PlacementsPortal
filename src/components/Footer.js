import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Twitter, Instagram, Facebook } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#050505] text-gray-400">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-7xl">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-12">
          {/* Column 1: Brand */}
          <div className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-1 mb-4 lg:mb-0">
            <Link to="/" className="inline-block mb-4 sm:mb-6 group">
              <img 
                src="/images/logo.png" 
                alt="PlacementsPortal" 
                className="h-12 sm:h-14 lg:h-16 w-auto group-hover:scale-105 transition-transform mb-2"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              <div className="text-xs text-brand-primary font-semibold tracking-wider">CAREER HUB</div>
            </Link>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed max-w-xs">
              Your global pathway to career success. Empowering students worldwide.
            </p>
            {/* Social Media Icons */}
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors group"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors group"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors group"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors group"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 className="text-white font-semibold text-xs sm:text-sm mb-3 sm:mb-4 uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-2.5 sm:space-y-3">
              <li>
                <Link
                  to="/opportunities"
                  className="text-sm hover:text-white transition-colors block py-0.5"
                >
                  Opportunities
                </Link>
              </li>
              <li>
                <Link
                  to="/employers"
                  className="text-sm hover:text-white transition-colors block py-0.5"
                >
                  Partners
                </Link>
              </li>
              <li>
                <Link
                  to="/community"
                  className="text-sm hover:text-white transition-colors block py-0.5"
                >
                  Community
                </Link>
              </li>
              <li>
                <Link
                  to="/resources"
                  className="text-sm hover:text-white transition-colors block py-0.5"
                >
                  Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h4 className="text-white font-semibold text-xs sm:text-sm mb-3 sm:mb-4 uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-2.5 sm:space-y-3">
              <li>
                <Link
                  to="/resources"
                  className="text-sm hover:text-white transition-colors block py-0.5"
                >
                  All Resources
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-sm hover:text-white transition-colors block py-0.5"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/templates"
                  className="text-sm hover:text-white transition-colors block py-0.5"
                >
                  Templates
                </Link>
              </li>
              <li>
                <Link
                  to="/success-stories"
                  className="text-sm hover:text-white transition-colors block py-0.5"
                >
                  Success Stories
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-sm hover:text-white transition-colors block py-0.5"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h4 className="text-white font-semibold text-xs sm:text-sm mb-3 sm:mb-4 uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-2.5 sm:space-y-3">
              <li>
                <Link
                  to="/about"
                  className="text-sm hover:text-white transition-colors block py-0.5"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="text-sm hover:text-white transition-colors block py-0.5"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm hover:text-white transition-colors block py-0.5"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/legal"
                  className="text-sm hover:text-white transition-colors block py-0.5"
                >
                  Legal
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Support */}
          <div>
            <h4 className="text-white font-semibold text-xs sm:text-sm mb-3 sm:mb-4 uppercase tracking-wider">
              Support
            </h4>
            <ul className="space-y-2.5 sm:space-y-3">
              <li>
                <Link
                  to="/help-center"
                  className="text-sm hover:text-white transition-colors block py-0.5"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/global-students"
                  className="text-sm hover:text-white transition-colors block py-0.5"
                >
                  Global Students
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm hover:text-white transition-colors block py-0.5"
                >
                  Get in Touch
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@placementsportal.com"
                  className="text-sm hover:text-white transition-colors block py-0.5"
                >
                  Email Support
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-7xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Copyright */}
            <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              © {currentYear} PlacementsPortal. All rights reserved.
            </p>

            {/* Legal Links */}
            <div className="flex items-center flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
              <Link
                to="/privacy"
                className="text-gray-500 hover:text-white transition-colors whitespace-nowrap"
              >
                Privacy Policy
              </Link>
              <span className="text-gray-800 hidden sm:inline">|</span>
              <Link
                to="/terms"
                className="text-gray-500 hover:text-white transition-colors whitespace-nowrap"
              >
                Terms of Service
              </Link>
              <span className="text-gray-800 hidden sm:inline">|</span>
              <Link
                to="/cookies"
                className="text-gray-500 hover:text-white transition-colors whitespace-nowrap"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
