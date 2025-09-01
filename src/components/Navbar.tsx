"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinkClasses =
    "relative text-slate-100 hover:text-cyan-400 transition-colors duration-300 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:scale-x-0 after:bg-cyan-400 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100";

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ease-in-out ${
        isScrolled
          ? "bg-slate-900/80 backdrop-blur-sm shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main container controlling alignment and height */}
        <div className="flex items-center justify-between h-20">
          
          {/* Left Section (Logo) */}
          <div className="flex-1 md:flex-none">
            <Link href="/" className="text-2xl font-bold text-white">
              Jobquest AI
            </Link>
          </div>

          {/* Center Section (Desktop Menu) */}
          <div className="hidden md:flex flex-1 justify-center items-center space-x-8">
            <Link href="/" className={navLinkClasses}>
              Home
            </Link>
            <Link href="/about" className={navLinkClasses}>
              About
            </Link>
            <Link href="/features" className={navLinkClasses}>
              Features
            </Link>
            <Link href="/contact" className={navLinkClasses}>
              Contact
            </Link>
          </div>

          {/* Right Section (Placeholder for balance & Mobile Menu Button) */}
          <div className="flex-1 flex justify-end">
            {/* Desktop placeholder */}
            <div className="hidden md:block">
              {/* You can add a Login button here */}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="z-50 flex flex-col justify-around w-6 h-6"
                aria-label="Toggle menu"
              >
                <span
                  className={`block w-6 h-0.5 bg-white transition-transform duration-300 ease-in-out ${
                    isMobileMenuOpen ? "transform rotate-45 translate-y-[5px]" : ""
                  }`}
                ></span>
                <span
                  className={`block w-6 h-0.5 bg-white transition-opacity duration-300 ease-in-out ${
                    isMobileMenuOpen ? "opacity-0" : ""
                  }`}
                ></span>
                <span
                  className={`block w-6 h-0.5 bg-white transition-transform duration-300 ease-in-out ${
                    isMobileMenuOpen
                      ? "transform -rotate-45 -translate-y-[5px]"
                      : ""
                  }`}
                ></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div
        className={`md:hidden absolute top-0 left-0 w-full bg-slate-900/95 backdrop-blur-sm transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "transform translate-y-0" : "transform -translate-y-full"
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-6 h-screen">
          <Link href="/" className="text-2xl text-white" onClick={toggleMobileMenu}>
            Home
          </Link>
          <Link href="/about" className="text-2xl text-white" onClick={toggleMobileMenu}>
            About
          </Link>
          <Link href="/features" className="text-2xl text-white" onClick={toggleMobileMenu}>
            Features
          </Link>
          <Link href="/contact" className="text-2xl text-white" onClick={toggleMobileMenu}>
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
}
